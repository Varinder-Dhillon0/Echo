import { useState } from "react";
import { useRouter } from "next/router";
import { auth, db } from "../../utils/firebase";
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification, 
  updateProfile, 
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "react-toastify";
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";
import Image from 'next/image';
import logo from "../../public/logo.png";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const generateUniqueUsername = (displayName) => {
    const baseName = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${baseName}${Math.floor(Math.random() * 10000)}`;
  };

  const checkUserExists = async (uid) => {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists();
  };

  const createUserProfile = async (user, username) => {
    try {
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        username: username,
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        emailVerified: user.emailVerified,
        followers: [],
        following: [],
      });
      return true;
    } catch (error) {
      console.error("Error creating user profile:", error);
      return false;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const googleProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userExists = await checkUserExists(user.uid);
      if (!userExists) {
        const username = generateUniqueUsername(user.displayName);
        await createUserProfile(user, username);
      }
      
      router.push("/");
    } catch (error) {
      console.error("Google sign-in error:", error);
      toast.error("Failed to sign in with Google", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        toast.error("Passwords do not match", {
          position: toast.POSITION.BOTTOM_RIGHT,
          autoClose: 3000,
          hideProgressBar: true,
        });
        setIsSubmitting(false);
        return;
      }

      // Create user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);

      // Update profile
      await updateProfile(user, {
        displayName: displayName,
      });

      // Create user document with proper data
      // We're calling createUserProfile after updateProfile, but we need to ensure
      // we're passing the updated user data since the Firebase Auth user object
      // might not reflect the changes immediately
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName, // Use the displayName from state directly
        username: username, // Use the username from state
        photoURL: user.photoURL || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        emailVerified: user.emailVerified,
        followers: [],
        following: [],
      });

      // Redirect to verification page
      router.push("/auth/verify-email");

    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "An error occurred during registration";
      
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already registered";
          break;
        case "auth/invalid-email":
          errorMessage = "Invalid email address";
          break;
        case "auth/weak-password":
          errorMessage = "Password should be at least 6 characters";
          break;
        case "auth/operation-not-allowed":
          errorMessage = "Email/Password sign up is not enabled. Please contact support.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Network error. Please check your internet connection.";
          break;
        default:
          errorMessage = "Failed to create account. Please try again later.";
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

  return (
    <div className="min-h-screen relative flex flex-col lg:flex-row">
      {/* Left side - Logo and Branding */}
      <div className="hidden sticky lg:block top-0 left-0 lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-600 py-12 lg:py-0">
        <div className="relative h-full">
          <div className="absolute w-full h-full inset-0 bg-black bg-opacity-20 lg:block hidden" />
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-white">
            <Image 
              src={logo} 
              alt="Creative Minds" 
              width={150} 
              height={150} 
              priority 
              className="mb-8 hidden lg:block lg:w-[150px]" 
            />
            <p className="text-lg lg:text-xl text-center text-blue-100 max-w-md hidden lg:block">
              Join our community of creative thinkers and share your thoughts with the world.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Join Creative Minds today
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
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

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <div className="mt-1">
                <input
                  id="displayName"
                  type="text"
                  required
                  className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm"
                  placeholder="Enter your full name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  type="text"
                  required
                  className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm"
                  placeholder="Choose a unique username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                />
              </div>
            </div>

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
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  minLength={6}
                  className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Must be at least 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  className="block w-full appearance-none rounded-lg border border-gray-300 px-3 py-2 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-blue-500 text-sm"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link 
              href="/auth/login" 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 