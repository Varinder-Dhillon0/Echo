import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from 'next/image';
import logo from "../../public/logo.png";
import { BiError } from "react-icons/bi";
import { FiCheck } from "react-icons/fi";

export default function ResetPassword() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-6">
        <Image src={logo} alt="Creative Minds" width={120} priority />
      </div>
      
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-gray-900">Reset Password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Please check your email for a password reset link from Firebase. Click the link in your email to reset your password.
          </p>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-sm text-blue-700">
            <div className="flex items-center">
              <FiCheck className="w-5 h-5 text-blue-500 mr-2" />
              <p>We've sent you an email with instructions to reset your password. Please check your inbox.</p>
            </div>
          </div>
          
          <div className="text-center text-sm text-gray-600">
            <p>Didn't receive the email?</p>
            <ul className="mt-2 space-y-1 pl-5 list-disc text-left">
              <li>Check your spam or junk folder</li>
              <li>Verify you entered the correct email address</li>
              <li>Wait a few minutes for the email to arrive</li>
            </ul>
          </div>

          <div className="pt-4">
            <Link href="/auth/forgot-password">
              <button
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Request New Reset Link
              </button>
            </Link>
          </div>
        </div>

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