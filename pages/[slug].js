import Thought from "../components/thought";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { auth, db } from "../utils/firebase";
import { toast } from "react-toastify";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  arrayRemove,
} from "firebase/firestore";
import { ThoughtSkeleton } from "@/components/thoughtSkeleton";
import { CommentListSkeleton } from "@/components/CommentSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from "date-fns";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from "next/link";
import { IoSendSharp } from "react-icons/io5";
import { BiError } from "react-icons/bi";
import { FiCheck } from "react-icons/fi";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

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

export default function Details() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [allMessage, setAllMessages] = useState([]);
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(true);
  const [user] = useAuthState(auth);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);

  // Get post data
  useEffect(() => {
    if (!router.isReady) return;

    const getPost = async () => {
      try {
        const docRef = doc(db, "posts", router.query.slug);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          router.push("/404");
          return;
        }

        setPost({ ...docSnap.data(), id: docSnap.id });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching post:", error);
        setLoading(false);
      }
    };

    getPost();
  }, [router.isReady, router.query.slug]);

  //Submit a message
  const submitMessage = async () => {
    if (!user) {
      router.push("/auth/login");
      return;
    }

    if (!message.trim()) {
      toast.error("Please write something first", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
        ...toastStyles.error,
      });
      return;
    }

    try {
      const docRef = doc(db, "posts", router.query.slug);
      await updateDoc(docRef, {
        comments: arrayUnion({
          message,
          avatar: user.photoURL,
          userName: user.displayName,
          uid: user.uid,
          time: Timestamp.now(),
        }),
      });
      toast.success("Comment posted successfully", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
        ...toastStyles.success,
      });
      setMessage("");
    } catch (error) {
      console.error("Error posting comment:", error);
      toast.error("Unable to post comment", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
        ...toastStyles.error,
      });
    }
  };

  const handleDeleteClick = (comment) => {
    setCommentToDelete(comment);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !commentToDelete || isDeletingComment) return;

    setIsDeletingComment(true);

    try {
      const docRef = doc(db, "posts", router.query.slug);
      
      // Convert comment timestamp to milliseconds for comparison
      const commentTimeMs = commentToDelete.time instanceof Date 
        ? commentToDelete.time.getTime() 
        : (commentToDelete.time?.toDate?.().getTime() || commentToDelete.time?.seconds * 1000);
      
      await updateDoc(docRef, {
        comments: arrayRemove(commentToDelete)
      });
      
      toast.success("Comment deleted successfully", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
        ...toastStyles.success,
      });
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
        ...toastStyles.error,
      });
    } finally {
      setIsDeletingComment(false);
      setShowDeleteConfirmation(false);
      setCommentToDelete(null);
    }
  };

  //Get Comments
  useEffect(() => {
    if (!router.isReady) return;

    const getComments = async () => {
      const docRef = doc(db, "posts", router.query.slug);
    
      const unsubscribe = onSnapshot(docRef, async (snapshot) => {
        setLoadingComments(true);
        try {
          const postData = snapshot.data();
          const comments = postData?.comments || [];
      
          const commentsWithUser = await Promise.all(
            comments.map(async (comment) => {
              if (!comment.uid) return comment;
      
              const userRef = doc(db, "users", comment.uid);
              const userSnap = await getDoc(userRef);
              const userData = userSnap.exists() ? userSnap.data() : null;
      
              return {
                ...comment,
                // Use the latest user data if available, fallback to comment data
                userName: userData?.displayName || comment.userName,
                avatar: userData?.photoURL || comment.avatar,
                user: userData,
              };
            })
          );
      
          setAllMessages(commentsWithUser.sort((a, b) => b.time - a.time));
        } catch (error) {
          console.error("Error fetching comments:", error);
        } finally {
          setLoadingComments(false);
        }
      });
    
      return unsubscribe;
    };

    getComments();
  }, [router.isReady, router.query.slug]);

  if (loading || !post) {
    return <ThoughtSkeleton />;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg">
        {/* Post content */}
        <div className="p-4">
          <div className="flex items-start space-x-3">
            <Link href={`/user/${post.uid}`}>
              <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                <AvatarImage src={post.avatar} alt={post.username} />
                <AvatarFallback>{post.username?.charAt(0)?.toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <Link href={`/user/${post.uid}`}>
                  <h3 className="text-16 font-semibold hover:text-blue-500 transition-colors cursor-pointer">
                    {post.username}
                  </h3>
                </Link>
                <span className="text-14 text-gray-500">
                  {format(post.timestamp?.toDate(), 'MMM d, yyyy')}
                </span>
              </div>
              <p className="mt-2 text-16 whitespace-pre-wrap break-words">{post.description}</p>
              
              {/* Image display */}
              {post.imageUrl && (
                <div className="mt-3 rounded-2xl overflow-hidden bg-gray-100">
                  <div className="relative" style={{ maxHeight: '512px' }}>
                    <img
                      src={post.imageUrl}
                      alt="Post image"
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Comments section */}
        <div className="border-t border-gray-100">
          {/* Comment Input */}
          <div className="p-4 border-b">
            <div className="flex items-start space-x-3">
              {user ? (
                <Avatar>
                  <AvatarImage src={user.photoURL} />
                  <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
                </Avatar>
              ) : (
                <Avatar>
                  <AvatarFallback>?</AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <div className="relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={user ? "Write a comment..." : "Sign in to comment"}
                    disabled={!user}
                    className="w-full px-3 py-2 pr-10 text-15 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                    rows={2}
                  />
                  <button
                    onClick={submitMessage}
                    disabled={!user || !message.trim()}
                    className="absolute bottom-2 right-2 p-1.5 text-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-full hover:bg-blue-50 transition-colors"
                    title="Send comment"
                  >
                    <IoSendSharp className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="divide-y divide-gray-100">
            {loadingComments ? (
              <CommentListSkeleton />
            ) : allMessage.length > 0 ? (
              allMessage.map((comment) => (
                <div key={comment.time} className="flex items-start space-x-3 p-4">
                  <Link href={`/user/${comment.uid}`}>
                    <Avatar className="cursor-pointer hover:opacity-80 transition-opacity">
                      <AvatarImage src={comment.avatar} alt={comment.userName} />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {comment.userName?.charAt(0)?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Link href={`/user/${comment.uid}`}>
                          <h3 className="text-15 font-semibold hover:text-blue-500 transition-colors cursor-pointer">
                            {comment.userName}
                          </h3>
                        </Link>
                        <span className="text-14 text-gray-500">
                          {format(comment.time.toDate(), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {user?.uid === comment.uid && (
                        <button
                          onClick={() => handleDeleteClick(comment)}
                          disabled={isDeletingComment}
                          className="p-1.5 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                          title="Delete comment"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                    <p className="text-15 text-gray-700">{comment.message}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-15 text-gray-500">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        title="Delete Comment"
        description="Are you sure you want to delete this comment? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        loading={isDeletingComment}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
