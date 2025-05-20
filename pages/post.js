import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../utils/firebase";
import { toast } from "react-toastify";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { RiVipCrownFill } from "react-icons/ri";

export default function Post() {
  const [post, setPost] = useState({ description: "" });
  const [user, loading] = useAuthState(auth);
  const [isPremium, setIsPremium] = useState(false);
  const router = useRouter();
  const { id, description: routeDescription, edit } = router.query;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checkPremiumStatus = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setIsPremium(userDoc.data().isPremium || false);
      } else {
        setIsPremium(false);
      }
    } catch (error) {
      console.error("Error checking premium status:", error);
      setIsPremium(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkPremiumStatus();
    }
  }, [user]);

  // Check if we're editing an existing post
  useEffect(() => {
    if (edit && id) {
      const fetchPost = async () => {
        try {
          const postDoc = await getDoc(doc(db, "posts", id));
          if (postDoc.exists() && postDoc.data().uid === user?.uid) {
            setPost({
              ...postDoc.data(),
              id: postDoc.id
            });
          } else {
            toast.error("Post not found or unauthorized");
            router.push("/");
          }
        } catch (error) {
          console.error("Error fetching post:", error);
          toast.error("Error fetching post");
          router.push("/");
        }
      };
      fetchPost();
    }
  }, [edit, id, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!post.description) {
      toast.error("Description is empty! 😅", {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 1500,
      });
      return;
    }

    const characterLimit = isPremium ? 2000 : 300;
    if (post.description.length > characterLimit) {
      toast.error(`Description too long! Maximum ${characterLimit} characters`, {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 1500,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (edit && id) {
        if (!isPremium) {
          toast.error("Editing posts is a premium feature", {
            position: toast.POSITION.TOP_CENTER,
            autoClose: 1500,
          });
          return;
        }

        // Update existing post
        const docRef = doc(db, "posts", id);
        await updateDoc(docRef, {
          description: post.description,
          edited: true,
          editedAt: serverTimestamp(),
        });
        toast.success("Post updated ✍️", {
          position: toast.POSITION.TOP_CENTER,
          autoClose: 1500,
        });
        router.push(`/user/${user.uid}`);
      } else {
        // Create new post
        const collectionRef = collection(db, "posts");
        await addDoc(collectionRef, {
          description: post.description,
          timestamp: serverTimestamp(),
          uid: user.uid,
          avatar: user.photoURL,
          username: user.displayName,
          likes: [],
        });
        toast.success("Post has been made 🚀", {
          position: toast.POSITION.TOP_CENTER,
          autoClose: 1500,
        });
        router.push("/");
      }
    } catch (error) {
      console.error("Error submitting post:", error);
      toast.error("Something went wrong 😓");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">
          {edit ? "Update your post" : "Create new post"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              What's on your mind?
            </label>
            <textarea
              id="description"
              value={post.description}
              onChange={(e) => setPost({ ...post, description: e.target.value })}
              rows="4"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm resize-none"
              placeholder={`Share your thoughts... (${isPremium ? '2000' : '300'} characters max)`}
            />
            <div className="flex justify-between items-center text-sm">
              <p className={`${
                post.description.length > (isPremium ? 2000 : 300) ? "text-red-500" : "text-gray-500"
              }`}>
                {post.description.length}/{isPremium ? '2000' : '300'}
              </p>
              {edit && !isPremium && (
                <div className="flex items-center gap-2 text-blue-500">
                  <RiVipCrownFill className="w-4 h-4" />
                  <span className="text-sm">Premium feature</span>
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmitting || !post.description.trim() || (edit && !isPremium)}
                className={`inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  (isSubmitting || !post.description.trim() || (edit && !isPremium)) && "opacity-50 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "Submitting..." : edit ? "Update" : "Post"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
