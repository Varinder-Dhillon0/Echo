import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../utils/firebase";
import Link from "next/link";
import { BiCheck } from "react-icons/bi";
import { RiVipCrownFill } from "react-icons/ri";
import { handlePayment } from "../utils/razorpay";
import { toast } from "react-toastify";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";

export default function Premium() {
  const [user, userLoading] = useAuthState(auth);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/login");
      return;
    }

    const checkPremiumStatus = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setIsPremium(userDoc.data().isPremium || false);
        }
      } catch (error) {
        console.error("Error checking premium status:", error);
      } finally {
        setLoading(false);
      }
    };

    checkPremiumStatus();
  }, [user, userLoading, router]);

  const features = [
    {
      title: "Longer Posts",
      description: "Write posts up to 2,000 characters"
    },
    {
      title: "Edit Posts",
      description: "Edit your posts anytime after publishing"
    },
    {
      title: "Custom Themes",
      description: "Personalize your profile with custom colors"
    },
    {
      title: "Premium Badge",
      description: "Stand out with a premium badge on your profile"
    },
    {
      title: "Priority Support",
      description: "Get faster responses from our support team"
    }
  ];

  const handleUpgrade = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    try {
      await handlePayment({
        amount: 799, // Amount in INR (will be converted to paise in the API)
        user,
        onSuccess: () => {
          toast.success("Welcome to Premium! 🎉", {
            position: toast.POSITION.BOTTOM_RIGHT,
            autoClose: 3000,
            hideProgressBar: true,
          });
          setIsPremium(true);
          // Refresh the page to update the UI
          router.reload();
        },
        onError: (error) => {
          console.error("Payment error:", error);
          toast.error("Payment failed. Please try again.", {
            position: toast.POSITION.BOTTOM_RIGHT,
            autoClose: 3000,
            hideProgressBar: true,
          });
        },
      });
    } catch (error) {
      console.error("Error handling payment:", error);
      toast.error("Something went wrong. Please try again.", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
    }
  };

  if (userLoading || loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="animate-pulse">
          <div className="h-40 bg-gray-200 rounded-xl mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="relative">
          {/* Premium Banner */}
          <div className="h-40 bg-gradient-to-r from-blue-500 to-blue-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/pattern.png')] opacity-10"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <RiVipCrownFill className="w-20 h-20 text-white/20" />
            </div>
          </div>

          {/* Premium Content */}
          <div className="px-8 py-8">
            <div className="flex items-center gap-3 mb-3">
              <RiVipCrownFill className="w-7 h-7 text-blue-500" />
              <h1 className="text-2xl font-bold">
                {isPremium ? "Premium Member" : "Upgrade to Premium"}
              </h1>
            </div>
            <p className="text-16 text-gray-600">
              {isPremium
                ? "Thank you for being a premium member. Enjoy all the exclusive features!"
                : "Take your social experience to the next level with exclusive features and benefits."}
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="p-8">
          <h2 className="text-18 font-bold mb-6">Premium Features</h2>
          <div className="grid gap-5">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className={`flex items-start gap-4 p-5 rounded-lg ${
                  isPremium 
                    ? "bg-blue-50" 
                    : "bg-gray-50 hover:bg-gray-100"
                } transition-colors`}
              >
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full ${
                    isPremium 
                      ? "bg-blue-100" 
                      : "bg-gray-100"
                  } flex items-center justify-center`}>
                    <BiCheck className={`w-6 h-6 ${
                      isPremium 
                        ? "text-blue-600" 
                        : "text-gray-600"
                    }`} />
                  </div>
                </div>
                <div>
                  <h3 className="text-16 font-semibold text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="text-15 text-gray-600 mt-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing Card */}
      {!isPremium && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-baseline">
                <span className="text-4xl font-bold">₹799</span>
                <span className="text-20 text-gray-600">/month</span>
              </div>
              <p className="text-15 text-gray-600 mt-2">
                Cancel anytime. No commitments.
              </p>
            </div>

            <button
              onClick={handleUpgrade}
              className="w-full bg-blue-500 text-white text-16 font-semibold rounded-full py-4 px-6 hover:bg-blue-600 transition-colors"
            >
              Upgrade to Premium
            </button>

            <div className="mt-5 text-center">
              <Link 
                href="/premium/learn-more"
                className="text-14 text-gray-500 hover:text-blue-500 transition-colors"
              >
                Learn more about Premium features
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-13 text-gray-500 text-center">
                By upgrading, you agree to our{" "}
                <Link href="/terms" className="text-blue-500 hover:underline">
                  Terms of Service
                </Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-blue-500 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 