// We're going to use Firebase Client SDK directly
import { initializeApp } from "firebase/app";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

// Initialize Firebase with client SDK
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (only if not already initialized)
let firebaseApp;
try {
  firebaseApp = initializeApp(firebaseConfig);
} catch (error) {
  // If app is already initialized, use the existing one
  if (error.code !== 'app/duplicate-app') {
    console.error('Firebase initialization error:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  console.log('Password reset API route called');
  
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  // Check if email exists in request
  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  console.log(`Processing password reset request for email: ${email}`);

  try {
    // Get auth instance
    const auth = getAuth(firebaseApp);
    
    // Send password reset email using Firebase Auth
    await sendPasswordResetEmail(auth, email);
    
    // Return success regardless of whether the email exists
    // This prevents user enumeration
    return res.status(200).json({ 
      success: true, 
      message: 'If the email is registered, a password reset link has been sent' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    
    // Always return a generic message to prevent user enumeration
    return res.status(200).json({ 
      success: true, 
      message: 'If the email is registered, a password reset link has been sent' 
    });
  }
} 