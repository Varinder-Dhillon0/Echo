import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";
import { db } from "../utils/firebase";
import Thought from "../components/thought";
import { ThoughtSkeleton } from "@/components/thoughtSkeleton";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../utils/firebase";

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchRandomPosts = async () => {
      try {
        const postsRef = collection(db, "posts");
        // Get recent posts excluding current user's posts
        const q = query(
          postsRef, 
          where("uid", "!=", user?.uid || ""), // Filter out current user's posts
          orderBy("uid"), // Required for != query
          orderBy("timestamp", "desc"), 
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        
        const fetchedPosts = await Promise.all(querySnapshot.docs.map(async doc => {
          const postData = doc.data();
          const postId = doc.id;

          // If this is a retweet, fetch the original post data
          if (postData.isRetweet && postData.originalPostId) {
            try {
              const originalPostRef = doc(db, "posts", postData.originalPostId);
              const originalPostSnap = await getDocs(originalPostRef);
              
              if (originalPostSnap.docs.length > 0) {
                const originalPostData = originalPostSnap.docs[0].data();
                return {
                  ...postData,
                  id: postId,
                  retweets: postData.retweets || [],
                  originalPost: {
                    ...originalPostData,
                    id: postData.originalPostId
                  }
                };
              }
            } catch (error) {
              console.error("Error fetching original post:", error);
            }
          }

          // Return regular post data
          return {
            ...postData,
            id: postId,
            retweets: postData.retweets || []
          };
        }));
        
        // Filter out any undefined posts (failed retweet fetches)
        const validPosts = fetchedPosts.filter(post => post !== undefined);
        
        // Shuffle the posts for randomization
        const shuffledPosts = validPosts.sort(() => Math.random() - 0.5);
        setPosts(shuffledPosts);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching random posts:", error);
        setLoading(false);
      }
    };

    if (user) { // Only fetch posts if user is logged in
      fetchRandomPosts();
    }
  }, [user]); // Add user to dependency array

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold mb-6">Explore</h1>
      {/* {
        [10,<p>1</p>,<p>1</p>,<p>2</p>].map((item) => console.log(item))
      } */}
      <div className="grid gap-4">
        {loading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <ThoughtSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-600">No posts available</p>
          </div>
        ) : (
          posts.map((post) => (
            <Thought 
              key={post.id} 
              {...post} 
              user={user}
              canEdit={user?.uid === post.uid}
            />
          ))
        )}
      </div>
    </div>
  );
} 