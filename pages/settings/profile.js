import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../../utils/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { toast } from "react-toastify";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export default function ProfileSettings() {
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setDisplayName(userData.displayName || "");
          setUsername(userData.username || "");
          setBio(userData.bio || "");
          setOriginalData(userData);
        }
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load profile", {
          ...toastStyles.error,
          position: toast.POSITION.BOTTOM_RIGHT,
          autoClose: 3000,
          hideProgressBar: true,
        });
      }
    };

    fetchUserProfile();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Basic validation
    if (!displayName.trim()) {
      toast.error("Display name is required", {
        ...toastStyles.error,
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
      return;
    }

    if (!username.trim()) {
      toast.error("Username is required", {
        ...toastStyles.error,
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        displayName,
        username,
        bio,
      });

      toast.success("Profile updated successfully", {
        ...toastStyles.success,
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });

      router.push(`/user/${user.uid}`);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile", {
        ...toastStyles.error,
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = () => {
    if (!originalData) return false;
    return (
      displayName !== originalData.displayName ||
      username !== originalData.username ||
      bio !== originalData.bio
    );
  };

  if (loading) return null;
  if (!user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h1 className="text-xl font-bold mb-6">Edit Profile</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture Display */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.photoURL} />
                <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-sm font-medium">Profile Picture</h3>
                <p className="text-xs text-gray-500">
                  Using Google profile picture
                </p>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm">
                Display Name
              </Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="text-sm"
                placeholder="Your display name"
              />
              <p className="text-xs text-gray-500">
                This is how your name will appear publicly
              </p>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm">
                Username
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                className="text-sm"
                placeholder="your-username"
              />
              <p className="text-xs text-gray-500">
                This unique username will be used in your profile URL
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm">
                Bio
              </Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="text-sm resize-none"
                placeholder="Tell us about yourself"
                rows={4}
              />
              <p className="text-xs text-gray-500">
                Brief description for your profile
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !hasChanges()}
                className={`text-sm ${
                  (!hasChanges() || isSubmitting) && "opacity-50 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 