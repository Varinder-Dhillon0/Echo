import Head from "next/head";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../utils/firebase";
import { collection, query, where, getDocs, orderBy, getDoc, doc, onSnapshot } from "firebase/firestore";
import Thought from "../components/thought";
import Link from "next/link";
import NewPost from "@/components/newPost";
import { ThoughtSkeleton } from "@/components/thoughtSkeleton";

export default function Home() {
  const [user, loading] = useAuthState(auth);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Query posts and order by timestamp
    const unsubscribe = onSnapshot(
      query(collection(db, "posts"), orderBy("timestamp", "desc")),
      async (snapshot) => {
        const postsData = [];
        
        for (const doc of snapshot.docs) {
          const post = { ...doc.data(), id: doc.id };
          
          // Fetch user data for each post
          try {
            const userDoc = await getDoc(doc(db, "users", post.uid));
            if (userDoc.exists()) {
              post.userData = userDoc.data();
            }
          } catch (error) {
            console.error("Error fetching user data:", error);
          }
          
          postsData.push(post);
        }
        
        setPosts(postsData);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <>
      <Head>
        <title>Creative thoughts</title>
        <meta name="description" content="Share your creative thoughts" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="space-y-4">
        <NewPost />
        
        {!user ? (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold">Welcome to Creative Minds</h2>
            <p className="text-gray-600 mt-2">Sign in to see posts from people you follow</p>
          </div>
        ) : isLoading ? (
          <div className="space-y-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <ThoughtSkeleton key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10">
            <h2 className="text-xl font-semibold">No posts yet</h2>
            <p className="text-gray-600 mt-2">
              Follow some creators to see their posts here, or{" "}
              <Link href="/explore" className="text-blue-500 hover:underline">
                explore new content
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {posts.map((post) => (
              <Thought
                key={post.id}
                id={post.id}
                {...post}
                user={user}
                theme={post.userData?.customTheme}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
