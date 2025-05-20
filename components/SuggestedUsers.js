import { useEffect, useState } from "react";
import { collection, query, limit, getDocs, where } from "firebase/firestore";
import { db } from "../utils/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../utils/firebase";
import Link from "next/link";
import FollowButton from "./FollowButton";

export default function SuggestedUsers() {
  const [user] = useAuthState(auth);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSuggestedUsers = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get all posts to find active users
        const postsRef = collection(db, "posts");
        const postsQuery = query(postsRef, limit(20));
        const postsSnapshot = await getDocs(postsQuery);

        // Create a map of unique users from posts
        const usersMap = new Map();
        postsSnapshot.docs.forEach(doc => {
          const post = doc.data();
          if (post.user && post.user !== user.uid && !usersMap.has(post.user)) {
            usersMap.set(post.user, {
              uid: post.user,
              displayName: post.username,
              photoURL: post.avatar,
              email: post.email
            });
          }
        });

        // Convert map to array and limit to 5 suggestions
        const suggestions = Array.from(usersMap.values()).slice(0, 5);
        setSuggestedUsers(suggestions);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching suggested users:", error);
        setLoading(false);
      }
    };

    fetchSuggestedUsers();
  }, [user]);

  if (!user || loading || suggestedUsers.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-100">
        <h2 className="text-16 font-bold">You might know</h2>
      </div>
      <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
        <div className="p-4 space-y-4">
          {suggestedUsers.map((suggestedUser) => (
            <div
              key={suggestedUser.uid}
              className="flex items-center justify-between group"
            >
              <Link
                href={`/user/${suggestedUser.uid}`}
                className="flex items-center space-x-3 flex-1 min-w-0"
              >
                <img
                  src={suggestedUser.photoURL}
                  alt={suggestedUser.displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-15 font-medium truncate group-hover:text-blue-500 transition-colors">
                    {suggestedUser.displayName}
                  </p>
                  <p className="text-13 text-gray-500 truncate">
                    @{suggestedUser.email?.split("@")[0] || 
                      suggestedUser.displayName?.toLowerCase().replace(/\s+/g, '')}
                  </p>
                </div>
              </Link>
              <div className="ml-2">
                <FollowButton targetUserId={suggestedUser.uid} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 