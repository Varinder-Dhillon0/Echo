import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { auth, db } from "/utils/firebase";
import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Image from 'next/image';
import logo from "../../public/logo.png";
import { toast } from "react-toastify";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  const generateUniqueUsername = (displayName) => {
    const baseName = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${baseName}${Math.floor(Math.random() * 10000)}`;
  };

  const checkUserExists = async (uid) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists();
  };

  const createUserProfile = async (user) => {
    try {
      const username = generateUniqueUsername(user.displayName);
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        username: username,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(),
        followers: [],
        following: [],
      });
      return true;
    } catch (error) {
      console.error("Error creating user profile:", error);
      return false;
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      if (!result.user.emailVerified) {
        auth.signOut();
        toast.error("Please verify your email before logging in", {
          position: toast.POSITION.BOTTOM_RIGHT,
          autoClose: 3000,
          hideProgressBar: true,
        });
        router.push("/auth/verify-email");
        return;
      }

      toast.success("Successfully logged in!", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
      router.push("/");
    } catch (error) {
      console.error("Login error:", error);
      let errorMessage = "Failed to sign in";
      
      switch (error.code) {
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/user-disabled":
          errorMessage = "This account has been disabled";
          break;
        case "auth/user-not-found":
          errorMessage = "No account found with this email";
          break;
        case "auth/wrong-password":
          errorMessage = "Incorrect password";
          break;
        case "auth/too-many-requests":
          errorMessage = "Too many failed attempts. Please try again later";
          break;
        default:
          errorMessage = "Failed to sign in. Please try again";
      }

      toast.error(errorMessage, {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userExists = await checkUserExists(user.uid);
      if (!userExists) {
        await createUserProfile(user);
      }
      
      router.push("/");
    } catch (error) {
      console.error("Google login error:", error);
      toast.error("Failed to sign in with Google", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
    }
  };

  useEffect(() => {
    if (user) {
      router.push("/");
    }
  }, [user, router]);

  if (loading) return null;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side - Logo and Branding */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-600 py-12 lg:py-0">
        <div className="relative h-full">
          <div className="absolute inset-0 bg-black bg-opacity-20 lg:block hidden" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
            <Image 
              src={logo} 
              alt="Creative Minds" 
              width={150} 
              height={150} 
              priority 
              className="mb-8 w-24 lg:w-[150px]" 
            />
            <p className="text-lg lg:text-xl text-center text-blue-100 max-w-md hidden lg:block">
              Join our community of creative thinkers and share your thoughts with the world.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to continue to Creative Minds
            </p>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <FcGoogle className="w-5 h-5" />
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-gray-500 bg-white">or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  required
                  className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  required
                  className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
              <div className="mt-1 text-right">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link 
              href="/auth/register" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
