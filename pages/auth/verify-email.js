import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../utils/firebase";
import { sendEmailVerification } from "firebase/auth";
import { toast } from "react-toastify";
import { BiError } from "react-icons/bi";
import { FiCheck } from "react-icons/fi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from 'next/image';
import logo from "../../public/logo.png";

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

export default function VerifyEmail() {
  const [user, loading] = useAuthState(auth);
  const [resendDisabled, setResendDisabled] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!loading && user?.emailVerified) {
      router.push("/");
    }
  }, [user, loading, router]);

  useEffect(() => {
    let timer;
    if (resendDisabled && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setResendDisabled(false);
      setCountdown(60);
    }
    return () => clearInterval(timer);
  }, [resendDisabled, countdown]);

  const handleResendEmail = async () => {
    if (resendDisabled) return;

    try {
      await sendEmailVerification(user);
      setResendDisabled(true);
      toast.success("Verification email sent!", {
        ...toastStyles.success,
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast.error("Failed to send verification email", {
        ...toastStyles.error,
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
    }
  };

  if (loading || !user) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="mb-6">
        <Image src={logo} alt="Creative Minds" width={120} priority />
      </div>
      
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Verify your email</CardTitle>
          <CardDescription>
            We've sent a verification email to {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600">
              Please check your email and click the verification link to complete your registration.
            </p>
            <p className="text-sm text-gray-600">
              If you don't see the email, check your spam folder.
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={handleResendEmail}
              disabled={resendDisabled}
              variant="outline"
              className="w-full"
            >
              {resendDisabled 
                ? `Resend email in ${countdown}s` 
                : "Resend verification email"}
            </Button>

            <Button
              onClick={() => auth.signOut()}
              variant="ghost"
              className="w-full text-gray-600 hover:text-gray-800"
            >
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 