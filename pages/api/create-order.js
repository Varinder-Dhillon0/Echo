import Razorpay from 'razorpay';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false,
      message: 'Method not allowed' 
    });
  }

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay credentials are not configured');
    return res.status(500).json({ 
      success: false,
      message: 'Payment service is not properly configured',
      error: 'MISSING_CREDENTIALS'
    });
  }

  try {
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { amount } = req.body;

    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid amount provided',
        error: 'INVALID_AMOUNT'
      });
    }

    // Convert amount to paise (smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    
    if (!order || !order.id) {
      throw new Error('Invalid order response from Razorpay');
    }

    res.status(200).json({ 
      success: true,
      order: {
        ...order,
        amount: amountInPaise
      }
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating payment order',
      error: error.message
    });
  }
} 