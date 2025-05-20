import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../utils/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
} from "firebase/firestore";
import Loader from "./loader";

export default function FollowButton({ targetUserId }) {
  const [user] = useAuthState(auth);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || !targetUserId || user.uid === targetUserId) {
        setLoading(false);
        return;
      }

      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setIsFollowing(userData.following?.includes(targetUserId) || false);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error checking follow status:", error);
        setLoading(false);
      }
    };

    checkFollowStatus();
  }, [user, targetUserId]);

  const handleFollow = async () => {
    setLoading(true)
    if (!user || !targetUserId || user.uid === targetUserId) return;


    try {
      const userDocRef = doc(db, "users", user.uid);
      const targetUserDocRef = doc(db, "users", targetUserId);

      // Create or update current user's document
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          email: user.email,
          following: arrayUnion(targetUserId),
        },
        { merge: true }
      );

      // Create or update target user's document
      await setDoc(
        targetUserDocRef,
        {
          followers: arrayUnion(user.uid),
        },
        { merge: true }
      );

      setLoading(false);
      setIsFollowing(true);
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleUnfollow = async () => {
    if (!user || !targetUserId || user.uid === targetUserId) return;
    setLoading(true)

    try {
      const userDocRef = doc(db, "users", user.uid);
      const targetUserDocRef = doc(db, "users", targetUserId);

      await updateDoc(userDocRef, {
        following: arrayRemove(targetUserId),
      });

      await updateDoc(targetUserDocRef, {
        followers: arrayRemove(user.uid),
      });

      setLoading(false)
      setIsFollowing(false);
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  if (!user || user.uid === targetUserId) {
    return null;
  }

  return (
    <button
      onClick={isFollowing ? handleUnfollow : handleFollow}
      className={`px-5 w-[80px] h-7 py-1 flex items-center justify-center rounded-full text-sm font-medium transition-colors  ${
        loading ? "bg-gray-100 text-gray-800 hover:bg-gray-200" :
        isFollowing
          ? "bg-gray-100 text-gray-800 hover:bg-gray-200"
          : "bg-blue-500 text-white hover:bg-blue-600"
      }`}
    >
      {/* <Loader/> */}
      {loading ? <Loader/> : isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
} 