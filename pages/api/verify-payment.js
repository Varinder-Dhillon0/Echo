import { adminDb } from "../../utils/firebase-admin";
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      userId
    } = req.body;

    // Log the received data for debugging
    console.log('Received payment verification data:', {
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      signature: razorpay_signature,
      userId
    });

    // Verify all required fields are present
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !userId) {
      console.error('Missing required fields:', { razorpay_payment_id, razorpay_order_id, razorpay_signature, userId });
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay secret key is not configured');
      return res.status(500).json({
        success: false,
        message: 'Payment verification is not properly configured'
      });
    }

    // Verify the payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    // Compare signatures
    if (signature !== razorpay_signature) {
      console.error('Signature verification failed:', {
        generated: signature,
        received: razorpay_signature
      });
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update user's premium status in Firestore using admin SDK
    const userRef = adminDb.collection('users').doc(userId);
    await userRef.update({
      isPremium: true,
      premiumSince: new Date(),
      premiumPaymentId: razorpay_payment_id,
      premiumOrderId: razorpay_order_id,
      customTheme: {
        primary: "#3B82F6",
        secondary: "#2563EB",
        background: "#FFFFFF",
        text: "#000000"
      }
    });

    console.log('Successfully updated user premium status:', userId);

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully'
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying payment',
      error: error.message
    });
  }
} 