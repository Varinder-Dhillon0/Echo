import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import logo from "../../public/logo.png";
import { toast } from "react-toastify";
import { BiError } from "react-icons/bi";
import { FiCheck } from "react-icons/fi";

// Custom toast styles
const toastStyles = {
  success: {
    style: {
      background: '#ffffff',
      color: '#1a1a1a',
      border: '1px solid #e2e8f0',
      borderRadius: '0.375rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: '0.5rem 0.75rem',
      fontSize: '0.75rem',
      minHeight: '0',
      maxWidth: '240px',
    },
    icon: <FiCheck className="w-3 h-3 text-green-500" />,
  },
  error: {
    style: {
      background: '#ffffff',
      color: '#1a1a1a',
      border: '1px solid #e2e8f0',
      borderRadius: '0.375rem',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      padding: '0.5rem 0.75rem',
      fontSize: '0.75rem',
      minHeight: '0',
      maxWidth: '240px',
    },
    icon: <BiError className="w-3 h-3 text-red-500" />,
  },
};

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const validateEmail = (email) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate email format
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
        ...toastStyles.error,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      // Always show success message (even if email doesn't exist)
      // This is a security best practice to prevent email enumeration
      setEmailSent(true);
      toast.success("If your email is registered, you will receive a password reset link", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
        ...toastStyles.success,
      });
      
      // Redirect to reset password page
      router.push('/auth/reset-password');
      
    } catch (error) {
      console.error("Error sending password reset email:", error);
      
      // Always show the same message as success for security
      toast.success("If your email is registered, you will receive a password reset link", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
        ...toastStyles.success,
      });
      
      // Redirect to reset password page
      router.push('/auth/reset-password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-6">
        <Image src={logo} alt="Creative Minds" width={120} priority />
      </div>
      
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">Forgot your password?</h1>
          <p className="mt-2 text-sm text-gray-600">
            Enter your email and we'll send you a password reset link
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <div className="mt-1">
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !email}
            className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link 
            href="/auth/login" 
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
} 