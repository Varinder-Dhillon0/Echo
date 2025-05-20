import { cn } from "@/lib/utils";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRef, useState, useEffect } from "react";
import FollowButton from "./FollowButton";
import Link from "next/link";
import { auth, db } from "../utils/firebase";
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc, addDoc, collection, serverTimestamp, getDoc } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { toast } from "react-toastify";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BsThreeDots } from "react-icons/bs";
import { useRouter } from "next/router";
import { format } from "date-fns";
import { RiVipCrownFill } from "react-icons/ri";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function Thought({ children, username, avatar, description, comments = [], id, likes = [], timestamp, uid, user, canEdit, retweets = [], isRetweet, originalPost, originalPostId, imageUrl, theme }) {
  const [open, setOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes.length);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [retweetCount, setRetweetCount] = useState(retweets?.length || 0);
  const [hasRetweeted, setHasRetweeted] = useState(false);
  const [isRetweeting, setIsRetweeting] = useState(false);
  const [authorData, setAuthorData] = useState(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const router = useRouter();

  console.log(canEdit);

  useEffect(() => {
    console.log('Thought Component Debug:', {
      currentUserUid: user?.uid,
      postUid: uid,
      isMatch: user?.uid === uid,
      user: user,
      description: description?.slice(0, 20) // first 20 chars of post for identification
    });
  }, [user, uid, description]);

  useEffect(() => {
    if (user && retweets) {
      setHasRetweeted(retweets.includes(user.uid));
      setRetweetCount(retweets.length);
    } else {
      setHasRetweeted(false);
      setRetweetCount(retweets?.length || 0);
    }
  }, [user, retweets]);

  useEffect(() => {
    if (user && likes) {
      setIsLiked(likes.includes(user.uid));
      setLikeCount(likes.length);
    } else {
      setIsLiked(false);
      setLikeCount(likes?.length || 0);
    }
  }, [user, likes]);

  // Fetch author data to get premium status and theme
  useEffect(() => {
    const fetchAuthorData = async () => {
      try {
        const authorDoc = await getDoc(doc(db, "users", uid));
        if (authorDoc.exists()) {
          setAuthorData(authorDoc.data());
        }
      } catch (error) {
        console.error("Error fetching author data:", error);
      }
    };

    fetchAuthorData();
  }, [uid]);

  const handleRetweet = async () => {
    if (!user) {
      toast.error("Please sign in to retweet", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
      return;
    }

    if (isRetweeting) return;
    setIsRetweeting(true);

    try {
      const postRef = doc(db, "posts", originalPostId || id);
      const newHasRetweeted = !hasRetweeted;

      // Update local state first
      setHasRetweeted(newHasRetweeted);
      setRetweetCount(prevCount => newHasRetweeted ? prevCount + 1 : prevCount - 1);

      if (newHasRetweeted) {
        // Create a new post as a retweet
        const retweetData = {
          description: description,
          timestamp: serverTimestamp(),
          uid: user.uid,
          avatar: user.photoURL,
          username: user.displayName,
          likes: [],
          comments: [],
          retweets: [],
          isRetweet: true,
          originalPostId: originalPostId || id,
          originalUser: originalPost || {
            uid,
            username,
            avatar
          }
        };

        await addDoc(collection(db, "posts"), retweetData);
      }

      // Update the original post's retweets array
      await updateDoc(postRef, {
        retweets: newHasRetweeted ? arrayUnion(user.uid) : arrayRemove(user.uid)
      });

      toast.success(newHasRetweeted ? "Post retweeted" : "Retweet removed", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
    } catch (error) {
      // Revert local state on error
      setHasRetweeted(!hasRetweeted);
      setRetweetCount(retweets?.length || 0);
      console.error("Error updating retweet:", error);
      toast.error("Failed to retweet", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
    } finally {
      setIsRetweeting(false);
    }
  };

  const handleLike = async () => {
    if (!user) {
      toast.error("Please sign in to like posts", {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 1500,
      });
      return;
    }

    if (isLiking) return;
    setIsLiking(true);

    try {
      const postRef = doc(db, "posts", id);
      const newIsLiked = !isLiked;
      
      // Update local state first
      setIsLiked(newIsLiked);
      setLikeCount(prevCount => newIsLiked ? prevCount + 1 : prevCount - 1);

      // Then update database
      await updateDoc(postRef, {
        likes: newIsLiked ? arrayUnion(user.uid) : arrayRemove(user.uid)
      });
    } catch (error) {
      // Revert local state on error
      setIsLiked(isLiked);
      setLikeCount(likes.length);
      console.error("Error updating like:", error);
      toast.error("Failed to update like", {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 1500,
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = () => {
    if (!canEdit) return;
    setShowDeleteConfirmation(true);
  };

  const handleDeleteConfirm = async () => {
    if (!canEdit || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "posts", id));
      toast.success("Post deleted successfully", {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 1500,
      });
      // If we're on the post's page, redirect to home
      if (router.pathname === '/[slug]') {
        router.push('/');
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post", {
        position: toast.POSITION.TOP_CENTER,
        autoClose: 1500,
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleEdit = async () => {
    if (!user) return;

    try {
      // Check premium status from Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const isPremium = userDoc.exists() ? userDoc.data().isPremium : false;

      if (!isPremium && !isRetweet) {
        toast.error("Editing posts is a premium feature", {
          position: toast.POSITION.BOTTOM_RIGHT,
          autoClose: 3000,
          hideProgressBar: true,
        });
        return;
      }

      router.push({
        pathname: '/post',
        query: { 
          id,
          description,
          edit: true
        }
      });
    } catch (error) {
      console.error("Error checking premium status:", error);
      toast.error("Unable to edit post at this time", {
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
    }
  };

  // Get initials from username
  const name_initials = username
    ? username
        .split(" ")
        .map((word) => word[0])
        .join("")
    : "";

  const timeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    timeoutRef.current = setTimeout(() => {
      setOpen(true);
      timeoutRef.current = null;
    }, 300);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    timeoutRef.current = setTimeout(() => {
      setOpen(false);
      timeoutRef.current = null;
    }, 300);
  };

  return (
    <article className="px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
      {/* Retweet indicator */}
      {/* {isRetweet && (
        <div className="flex items-center gap-2 mb-2 text-gray-500 text-13 pl-12">
          <svg className="w-3.5 h-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{username} reposted</span>
        </div>
      )} */}

      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <HoverCard open={open} onOpenChange={setOpen}>
            <HoverCardTrigger asChild>
              <Link href={`/user/${uid}`}>
                <Avatar 
                  className="w-12 h-12 cursor-pointer transition-opacity hover:opacity-90"
                  style={authorData?.customTheme ? {
                    borderWidth: `${authorData.customTheme.profileBorderWidth}px`,
                    borderStyle: authorData.customTheme.profileBorderStyle || 'solid',
                    borderColor: authorData.customTheme.profileBorder
                  } : {}}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <AvatarImage src={avatar} className="object-cover" />
                  <AvatarFallback className="bg-blue-500 text-white text-16">
                    {name_initials}
                  </AvatarFallback>
                </Avatar>
              </Link>
            </HoverCardTrigger>

            <HoverCardContent
              className="w-80 p-5 bg-white border border-gray-100 shadow-lg"
              side="right"
              align="start"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="space-y-4">
                {/* Header with Avatar and Follow Button */}
                <div className="flex justify-between items-start">
                  <Link href={`/user/${uid}`} className="flex items-center space-x-3 group">
                    <Avatar 
                      className="w-12 h-12 border-2 border-white ring-2 ring-gray-100"
                      style={authorData?.customTheme ? {
                        borderColor: authorData.customTheme.profileBorder,
                        borderWidth: `${authorData.customTheme.profileBorderWidth}px`,
                        borderStyle: authorData.customTheme.profileBorderStyle || 'solid',
                      } : {}}
                    >
                      <AvatarImage src={avatar} className="object-cover" />
                      <AvatarFallback className="bg-blue-500 text-white">
                        {name_initials}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <FollowButton targetUserId={uid} theme={authorData?.customTheme} />
                </div>

                {/* User Info */}
                <div className="space-y-2">
                  <Link href={`/user/${uid}`} className="group">
                    <div className="flex items-center gap-1">
                      <h4 className="text-16 font-bold group-hover:text-blue-500 transition-colors">
                        {username}
                      </h4>
                      {authorData?.isPremium && (
                        <RiVipCrownFill className="w-4 h-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-14 text-gray-500">@{uid.slice(0, 8)}</p>
                  </Link>
                  
                  {authorData?.bio && (
                    <p className="text-15 text-gray-700 line-clamp-2">
                      {authorData.bio}
                    </p>
                  )}

                  <div className="flex items-center gap-4 pt-2 text-14">
                    <div>
                      <span className="font-semibold text-gray-900">{authorData?.following?.length || 0}</span>{" "}
                      <span className="text-gray-500">Following</span>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">{authorData?.followers?.length || 0}</span>{" "}
                      <span className="text-gray-500">Followers</span>
                    </div>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Link href={`/user/${uid}`}>
                <div className="flex items-center gap-1">
                  <span className="font-semibold text-16 hover:underline truncate">
                    {username}
                  </span>
                  {authorData?.isPremium && (
                    <RiVipCrownFill className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  )}
                </div>
              </Link>
              <span className="text-14 text-gray-500 truncate">@{uid.slice(0, 8)}</span>
              <span className="text-14 text-gray-500">·</span>
              <time className="text-14 text-gray-500">
                {timestamp && typeof timestamp.toDate === 'function' 
                  ? format(timestamp.toDate(), 'MMM d') 
                  : ''}
              </time>
            </div>

            {/* Menu (if can edit) */}
            {canEdit && !isRetweet && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-blue-50 transition-colors">
                    <BsThreeDots className="w-4 h-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem 
                    onClick={handleEdit} 
                    className="text-15 py-2.5 cursor-pointer"
                  >
                    {user?.isPremium ? (
                      "Edit post"
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Edit post</span>
                        <RiVipCrownFill className="w-4 h-4 text-blue-500" />
                      </div>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-15 py-2.5 cursor-pointer text-red-600 focus:text-red-600"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete post"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Post content */}
          <div className="mt-1">
            <p 
              className="text-16 whitespace-pre-wrap break-words leading-normal"
              style={authorData?.customTheme ? {
                color: authorData.customTheme.text
              } : { color: 'rgb(17 24 39)' }}
            >
              {description}
            </p>
            
            {/* Media */}
            {(imageUrl || (originalPost && originalPost.imageUrl)) && (
              <div className="mt-3 rounded-2xl overflow-hidden bg-gray-50 border border-gray-100">
                <div className="relative" style={{ maxHeight: '512px' }}>
                  <img
                    src={imageUrl || originalPost.imageUrl}
                    alt="Post image"
                    className="w-full h-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
                    loading="lazy"
                    onClick={() => setShowImagePreview(true)}
                  />
                </div>
              </div>
            )}

            {/* Image Preview Dialog */}
            <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
              <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95">
                <div className="relative w-full h-full flex items-center justify-center">
                  <img
                    src={imageUrl || originalPost?.imageUrl}
                    alt="Full size image"
                    className="max-w-full max-h-[90vh] object-contain"
                  />
                  <button
                    onClick={() => setShowImagePreview(false)}
                    className="absolute top-4 right-4 text-white/80 hover:text-white p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-10 mt-3 justify-between">
            {/* Comment */}
            <Link href={{ pathname: `/${id}`}} className="group flex items-center text-gray-500">
              <div className="flex items-center justify-center w-8 h-8 rounded-full group-hover:bg-blue-50 transition-colors">
                <svg className="w-4 h-4 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span className="text-13 group-hover:text-blue-500 transition-colors">{comments?.length || 0}</span>
            </Link>

            {/* Retweet */}
            <button 
              onClick={handleRetweet}
              disabled={isRetweeting}
              className="group flex items-center text-gray-500"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full group-hover:bg-green-50 transition-colors">
                <svg 
                  className={`w-4 h-4 ${
                    hasRetweeted 
                      ? "text-green-500" 
                      : "group-hover:text-green-500 transition-colors"
                  }`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span className={`text-13 ${
                hasRetweeted ? "text-green-500" : "group-hover:text-green-500 transition-colors"
              }`}>{retweetCount}</span>
            </button>

            {/* Like */}
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className="group flex items-center text-gray-500"
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full group-hover:bg-red-50 transition-colors">
                <svg 
                  className={`w-4 h-4 ${
                    isLiked 
                      ? "text-red-500 fill-current" 
                      : "group-hover:text-red-500 transition-colors"
                  }`} 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                  fill={isLiked ? "currentColor" : "none"}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <span className={`text-13 ${
                isLiked ? "text-red-500" : "group-hover:text-red-500 transition-colors"
              }`}>{likeCount}</span>
            </button>

            {/* Share */}
            <button className="group flex items-center text-gray-500">
              <div className="flex items-center justify-center w-8 h-8 rounded-full group-hover:bg-blue-50 transition-colors">
                <svg className="w-4 h-4 group-hover:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>

      <ConfirmationDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        loading={isDeleting}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </article>
  );
}