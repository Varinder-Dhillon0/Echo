import Thought from "@/components/thought";
import Link from "next/link";
import { ThoughtSkeleton } from "@/components/thoughtSkeleton";
import { useAuthState } from "react-firebase-hooks/auth";
import { getPosts } from "@/components/api/posts";
import { useState } from "react";
import { useEffect } from "react";
import { auth } from "/utils/firebase";

export default function Thoughts() {
  const [allPosts, setAllposts] = useState();

  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    console.log(allPosts);
    getPosts(loading, user, setAllposts);
  }, [getPosts]);

  return (
    <>
      <div className=" border-gray-200 border-[2px]">
        {allPosts
          ? allPosts.map((posts) => (
              <Thought key={posts.id} {...posts} />
            ))
          : [1, 2, 3, 4, 5, 6].map((_, i) => {
              return <ThoughtSkeleton key={i} />;
            })}
      </div>
    </>
  );
}
