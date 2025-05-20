import crypto from 'crypto';
import { adminDb } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Collection reference for reset tokens
const tokensCollection = adminDb.collection('resetTokens');

// Generate a secure random token
export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Create a new reset token for a user
export const createResetToken = async (email) => {
  try {
    // Check if user exists
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    
    if (usersSnapshot.empty) {
      throw new Error('No user found with this email');
    }
    
    const user = usersSnapshot.docs[0];
    const userId = user.id;
    
    // Generate token
    const token = generateResetToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour
    
    // Store token in database
    await tokensCollection.doc(token).set({
      token,
      userId,
      email,
      expiresAt,
      createdAt: FieldValue.serverTimestamp(),
      used: false
    });
    
    return {
      token,
      userId,
      expiresAt
    };
  } catch (error) {
    console.error('Error creating reset token:', error);
    throw error;
  }
};

// Verify a reset token
export const verifyResetToken = async (token) => {
  try {
    const tokenDoc = await tokensCollection.doc(token).get();
    
    if (!tokenDoc.exists) {
      throw new Error('Invalid token');
    }
    
    const tokenData = tokenDoc.data();
    
    // Check if token is expired
    const now = new Date();
    const expiresAt = tokenData.expiresAt.toDate();
    
    if (now > expiresAt) {
      throw new Error('Token has expired');
    }
    
    // Check if token has been used
    if (tokenData.used) {
      throw new Error('Token has already been used');
    }
    
    return {
      valid: true,
      userId: tokenData.userId,
      email: tokenData.email
    };
  } catch (error) {
    console.error('Error verifying token:', error);
    throw error;
  }
};

// Mark a token as used
export const markTokenAsUsed = async (token) => {
  try {
    await tokensCollection.doc(token).update({
      used: true,
      usedAt: FieldValue.serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error marking token as used:', error);
    throw error;
  }
}; 