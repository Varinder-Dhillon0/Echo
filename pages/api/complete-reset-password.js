import { verifyResetToken, markTokenAsUsed } from '../../utils/resetTokens';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '../../utils/firebase-admin';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    // Verify the token
    const verification = await verifyResetToken(token).catch(error => {
      console.error('Error verifying token:', error);
      throw error;
    });

    // Update password
    try {
      await getAuth().updateUser(verification.userId, {
        password: newPassword,
      });
    } catch (error) {
      console.error('Error updating user password:', error);
      throw new Error('Failed to update password');
    }

    // Mark token as used
    await markTokenAsUsed(token);

    // Add entry to password history (optional)
    try {
      await adminDb.collection('users').doc(verification.userId).collection('passwordHistory').add({
        changedAt: new Date(),
        resetToken: token,
        method: 'reset',
      });
    } catch (error) {
      // Non-critical operation, just log error
      console.error('Error adding to password history:', error);
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Password has been reset successfully'
    });
  } catch (error) {
    console.error('Complete password reset error:', error);
    return res.status(400).json({ 
      success: false, 
      message: error.message || 'Failed to reset password'
    });
  }
} 