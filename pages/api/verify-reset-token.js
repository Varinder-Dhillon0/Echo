import { verifyResetToken } from '../../utils/resetTokens';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token is required' });
    }

    // Verify the token
    const verification = await verifyResetToken(token).catch(error => {
      console.error('Error verifying token:', error);
      throw error;
    });

    return res.status(200).json({ 
      success: true, 
      valid: verification.valid,
      email: verification.email
    });
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(400).json({ 
      success: false, 
      message: error.message || 'Invalid or expired token'
    });
  }
} 