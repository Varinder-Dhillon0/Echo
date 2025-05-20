import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc, collection, query, where, getDocs, orderBy, limit, setDoc, updateDoc } from "firebase/firestore";
import { db } from "../../utils/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../../utils/firebase";
import Thought from "../../components/thought";
import Link from "next/link";
import FollowButton from "../../components/FollowButton";
import { ThoughtSkeleton } from "@/components/thoughtSkeleton";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BiRepost } from "react-icons/bi";
import { RiVipCrownFill } from "react-icons/ri";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

export default function UserProfile() {
  const router = useRouter();
  const { id } = router.query;
  const [currentUser] = useAuthState(auth);
  const [userProfile, setUserProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [retweets, setRetweets] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFollowDialog, setShowFollowDialog] = useState(false);
  const [followDialogType, setFollowDialogType] = useState("following"); // "following" or "followers"
  const [followList, setFollowList] = useState([]);
  const [loadingFollowList, setLoadingFollowList] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!id) return;
      setLoading(true);
      console.log("Fetching data for user ID:", id);

      try {
        // Fetch user profile first
        const userDoc = await getDoc(doc(db, "users", id));
        if (!userDoc.exists()) {
          console.error("User not found");
          setLoading(false);
          return;
        }
        
        const userData = { ...userDoc.data(), id: userDoc.id };
        setUserProfile(userData);

        // Fetch original posts (non-retweets)
        const postsQuery = query(
          collection(db, "posts"),
          where("uid", "==", id),
          orderBy("timestamp", "desc")
        );
        const postsSnapshot = await getDocs(postsQuery);
        const postsData = postsSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
          timestamp: doc.data().timestamp?.toDate()
        })).filter(post => !post.isRetweet);
        setPosts(postsData);

        // Fetch retweets
        const retweetsQuery = query(
          collection(db, "posts"),
          where("uid", "==", id),
          where("isRetweet", "==", true),
          orderBy("timestamp", "desc")
        );
        const retweetsSnapshot = await getDocs(retweetsQuery);
        
        // Also check posts where this user is in the retweets array
        const retweetedPostsQuery = query(
          collection(db, "posts"),
          where("retweets", "array-contains", id)
        );
        const retweetedPostsSnapshot = await getDocs(retweetedPostsQuery);
        
        const allRetweetsData = [];

        // Process retweets created by this user
        for (const doc of retweetsSnapshot.docs) {
          const retweetData = doc.data();
          
          if (retweetData.originalPostId) {
            try {
              const originalPostDoc = await getDoc(doc(db, "posts", retweetData.originalPostId));
              if (originalPostDoc.exists()) {
                const originalPostData = originalPostDoc.data();
                allRetweetsData.push({
                  ...originalPostData,
                  id: retweetData.originalPostId,
                  retweetId: doc.id,
                  timestamp: originalPostData.timestamp?.toDate(),
                  retweetTimestamp: retweetData.timestamp?.toDate(),
                  isRetweet: true,
                  retweetedBy: {
                    uid: retweetData.uid,
                    username: userData.displayName,
                    avatar: userData.photoURL
                  }
                });
              }
            } catch (error) {
              console.error("Error fetching original post:", error);
            }
          }
        }

        // Process posts that this user has retweeted
        for (const doc of retweetedPostsSnapshot.docs) {
          const postData = doc.data();
          allRetweetsData.push({
            ...postData,
            id: doc.id,
            retweetId: doc.id + '_' + id,
            timestamp: postData.timestamp?.toDate(),
            retweetTimestamp: postData.timestamp?.toDate(),
            isRetweet: true,
            retweetedBy: {
              uid: id,
              username: userData.displayName,
              avatar: userData.photoURL
            }
          });
        }
        
        // Sort retweets by retweet timestamp
        const sortedRetweets = allRetweetsData.sort((a, b) => 
          (b.retweetTimestamp || b.timestamp) - (a.retweetTimestamp || a.timestamp)
        );
        setRetweets(sortedRetweets);

        // Fetch all posts to find comments by this user
        const allPostsQuery = query(
          collection(db, "posts"),
          orderBy("timestamp", "desc")
        );
        const allPostsSnapshot = await getDocs(allPostsQuery);
        
        const commentsData = [];

        // Process each post to find comments by this user
        allPostsSnapshot.docs.forEach(doc => {
          const postData = doc.data();
          const postComments = postData.comments || [];
          
          // Find comments by this user and normalize their timestamp
          const userComments = postComments
            .filter(comment => comment?.uid === id)
            .map(comment => ({
              ...comment,
              time: comment.time instanceof Date 
                ? comment.time 
                : comment.time?.toDate?.() 
                  ? comment.time.toDate() 
                  : new Date(comment.time?.seconds * 1000 || Date.now())
            }));
          
          if (userComments.length > 0) {
            commentsData.push({
              ...postData,
              id: doc.id,
              timestamp: postData.timestamp?.toDate(),
              userComments
            });
          }
        });

        // Sort by the most recent comment time
        const sortedComments = commentsData.sort((a, b) => {
          const latestCommentA = Math.max(...a.userComments.map(c => c.time.getTime()));
          const latestCommentB = Math.max(...b.userComments.map(c => c.time.getTime()));
          return latestCommentB - latestCommentA;
        });
        
        setComments(sortedComments);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [id]);

  const fetchFollowList = async (type) => {
    if (!userProfile) return;
    
    setLoadingFollowList(true);
    try {
      const userIds = type === "following" ? userProfile.following : userProfile.followers;
      if (!userIds || userIds.length === 0) {
        setFollowList([]);
        return;
      }

      const usersData = await Promise.all(
        userIds.map(async (userId) => {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            return { id: userDoc.id, ...userDoc.data() };
          }
          return null;
        })
      );

      setFollowList(usersData.filter(Boolean));
    } catch (error) {
      console.error(`Error fetching ${type} list:`, error);
    } finally {
      setLoadingFollowList(false);
    }
  };

  const handleFollowClick = async (type) => {
    setFollowDialogType(type);
    setShowFollowDialog(true);
    await fetchFollowList(type);
  };

  const handleDeleteClick = (postId, comment) => {
    setCommentToDelete({ postId, comment });
    setShowDeleteConfirmation(true);
  };

  const handleDeleteConfirm = async () => {
    if (!commentToDelete || !currentUser || isDeletingComment) return;

    const { postId, comment } = commentToDelete;
    setIsDeletingComment(true);
    
    try {
      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        toast.error("Post not found");
        setShowDeleteConfirmation(false);
        setCommentToDelete(null);
        return;
      }

      // Get post data
      const postData = postDoc.data();
      
      // Convert comment timestamp to milliseconds for comparison
      const commentTimeMs = comment.time instanceof Date 
        ? comment.time.getTime() 
        : (comment.time?.toDate?.().getTime() || comment.time?.seconds * 1000);
      
      // Filter out the comment to delete
      const updatedComments = postData.comments.filter(c => {
        // Convert each comment timestamp to milliseconds
        const cTimeMs = c.time instanceof Date
          ? c.time.getTime()
          : (c.time?.toDate?.().getTime() || c.time?.seconds * 1000);
        
        // Keep comments that don't match both UID and timestamp
        return !(c.uid === comment.uid && Math.abs(cTimeMs - commentTimeMs) < 1000);
      });

      // Update Firestore
      await updateDoc(postRef, {
        comments: updatedComments
      });

      // Update local state
      setComments(prevComments => 
        prevComments
          .map(post => {
            if (post.id === postId) {
              // Filter out the deleted comment
              const updatedUserComments = post.userComments.filter(c => {
                const cTimeMs = c.time instanceof Date
                  ? c.time.getTime()
                  : (c.time?.toDate?.().getTime() || c.time?.seconds * 1000);
                
                return !(c.uid === comment.uid && Math.abs(cTimeMs - commentTimeMs) < 1000);
              });
              
              // Return updated post or null if no comments left
              return updatedUserComments.length > 0 
                ? { ...post, userComments: updatedUserComments }
                : null;
            }
            return post;
          })
          .filter(Boolean) // Remove null entries (posts with no comments left)
      );

      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    } finally {
      setIsDeletingComment(false);
      setShowDeleteConfirmation(false);
      setCommentToDelete(null);
    }
  };

  if (loading || !userProfile) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="mt-4 h-8 w-1/3 bg-gray-200 rounded"></div>
          <div className="mt-2 h-4 w-1/4 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-4 mt-8">
          {[1, 2, 3].map((_, i) => (
            <ThoughtSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Banner */}
        <div 
          className="h-28 relative"
          style={{ 
            backgroundColor: userProfile?.customTheme?.banner || 'bg-gradient-to-r from-blue-400 to-blue-600'
          }}
        >
          {userProfile?.coverPhoto && (
            <img
              src={userProfile.coverPhoto}
              alt="Cover photo"
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Profile Info Section */}
        <div className="px-4 pb-4">
          {/* Profile Picture and Action Button Row */}
          <div className="flex justify-between items-start relative">
            {/* Profile Picture */}
            <div className="-mt-[54px]">
              <div 
                className="w-[92px] h-[92px] rounded-full border-4 border-white bg-white shadow-md overflow-hidden"
                style={userProfile?.customTheme ? {
                  borderWidth: `${userProfile.customTheme.profileBorderWidth}px`,
                  borderStyle: userProfile.customTheme.profileBorderStyle || 'solid',
                  borderColor: userProfile.customTheme.profileBorder
                } : {}}
              >
                <img
                  src={userProfile?.photoURL}
                  alt={userProfile?.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Follow/Edit Button */}
            <div className="pt-2 flex gap-2">
              {currentUser?.uid === id ? (
                <>
                  <Link
                    href="/settings/profile"
                    className="inline-flex items-center px-4 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    style={userProfile?.customTheme ? {
                      borderColor: userProfile.customTheme.primary,
                      color: userProfile.customTheme.primary
                    } : {}}
                  >
                    Edit profile
                  </Link>
                  {userProfile?.isPremium && (
                    <Link
                      href="/settings/theme"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                      style={userProfile?.customTheme ? {
                        borderColor: userProfile.customTheme.primary,
                        color: userProfile.customTheme.primary
                      } : {}}
                    >
                      <RiVipCrownFill className="w-4 h-4" />
                      Edit theme
                    </Link>
                  )}
                </>
              ) : (
                <FollowButton targetUserId={id} theme={userProfile?.customTheme} />
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold leading-tight">
                {userProfile?.displayName}
              </h1>
              {userProfile?.isPremium && (
                <RiVipCrownFill className="w-5 h-5 text-blue-500" />
              )}
            </div>
            <p className="text-gray-500 text-[15px]">
              @{userProfile?.username || userProfile?.displayName?.toLowerCase().replace(/\s+/g, '')}
            </p>
          </div>

          {/* Bio */}
          {userProfile?.bio && (
            <p 
              className="text-[19px] whitespace-pre-wrap break-words leading-normal mt-3"
              style={userProfile?.customTheme ? {
                color: userProfile.customTheme.text
              } : {}}
            >
              {userProfile.bio}
            </p>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-gray-500 mt-2">
            {userProfile?.location && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{userProfile.location}</span>
              </div>
            )}

            {userProfile?.website && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <a 
                  href={userProfile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 text-sm hover:underline"
                >
                  {userProfile.website.replace(/^https?:\/\/(www\.)?/, '')}
                </a>
              </div>
            )}

            <div className="flex items-center gap-1 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Joined {userProfile?.createdAt?.toDate() ? format(userProfile.createdAt.toDate(), 'MMMM yyyy') : ''}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 pt-3 mt-3 border-t border-gray-100">
            <button 
              onClick={() => handleFollowClick("following")}
              className="hover:underline"
              style={userProfile?.customTheme ? {
                color: userProfile.customTheme.primary
              } : {}}
            >
              <span className="font-bold text-sm">{userProfile?.following?.length || 0}</span>{" "}
              <span className="text-gray-500 text-sm">Following</span>
            </button>
            <button 
              onClick={() => handleFollowClick("followers")}
              className="hover:underline"
              style={userProfile?.customTheme ? {
                color: userProfile.customTheme.primary
              } : {}}
            >
              <span className="font-bold text-sm">{userProfile?.followers?.length || 0}</span>{" "}
              <span className="text-gray-500 text-sm">Followers</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="w-full justify-start border-b rounded-none h-10 bg-transparent p-0">
          <TabsTrigger 
            value="posts"
            className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent"
          >
            Posts
          </TabsTrigger>
          <TabsTrigger 
            value="comments"
            className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent"
          >
            Comments
          </TabsTrigger>
          <TabsTrigger 
            value="retweets"
            className="text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent"
          >
            Reposts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="space-y-4">
          {loading ? (
            <div className="space-y-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <ThoughtSkeleton key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No posts yet
            </div>
          ) : (
            posts.map((post) => (
              <Thought
                key={post.id}
                {...post}
                user={currentUser}
                canEdit={currentUser?.uid === post.uid}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="retweets" className="space-y-4">
          {loading ? (
            <div className="space-y-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <ThoughtSkeleton key={i} />
              ))}
            </div>
          ) : retweets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No reposts yet
            </div>
          ) : (
            retweets.map((retweet) => (
              <div key={retweet.retweetId} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2 text-gray-500 text-13 border-b border-gray-100">
                  <BiRepost className="w-4 h-4" />
                  <span>{userProfile.displayName} reposted</span>
                  <span>·</span>
                  <time>{format(retweet.retweetTimestamp || retweet.timestamp || new Date(), 'MMM d')}</time>
                </div>
                <Thought
                  {...retweet}
                  user={currentUser}
                  canEdit={false}
                  retweetedBy={retweet.retweetedBy}
                />
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="comments" className="space-y-6">
          {loading ? (
            <div className="space-y-1">
              {Array.from({ length: 3 }).map((_, i) => (
                <ThoughtSkeleton key={i} />
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No comments yet
            </div>
          ) : (
            comments.map((post) => (
              <div key={post.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                {/* Original Post */}
                <div className="border-b border-gray-100">
                  <Thought
                    {...post}
                    user={currentUser}
                    canEdit={currentUser?.uid === post.uid}
                  />
                </div>

                {/* User's Comments Section */}
                <div className="p-4">
                  
                  <div className="space-y-3 pl-10">
                    {post.userComments.map((comment, index) => (
                      <div 
                        key={`${post.id}-${index}`} 
                        className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        {/* Comment Author Avatar */}
                        <Avatar 
                          className="h-8 w-8 border border-gray-200"
                          style={userProfile?.customTheme ? {
                            borderColor: userProfile.customTheme.profileBorder,
                            borderWidth: `${userProfile.customTheme.profileBorderWidth}px`,
                            borderStyle: userProfile.customTheme.profileBorderStyle || 'solid',
                          } : {}}
                        >
                          <AvatarImage src={userProfile.photoURL} />
                          <AvatarFallback>
                            {userProfile.displayName?.charAt(0)?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Comment Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">
                                {userProfile.displayName}
                              </span>
                              {userProfile.isPremium && (
                                <RiVipCrownFill className="w-4 h-4 text-blue-500" />
                              )}
                              <span className="text-sm text-gray-500">
                                {format(comment.time || new Date(), 'MMM d, yyyy')}
                              </span>
                            </div>
                            {currentUser?.uid === comment.uid && (
                              <button
                                onClick={() => handleDeleteClick(post.id, comment)}
                                disabled={isDeletingComment}
                                className="p-1.5 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors disabled:opacity-50"
                                title="Delete comment"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                          <p 
                            className="text-sm text-gray-700 whitespace-pre-wrap break-words"
                            style={userProfile?.customTheme ? {
                              color: userProfile.customTheme.text
                            } : {}}
                          >
                            {comment.message}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Follow Dialog */}
      <Dialog open={showFollowDialog} onOpenChange={setShowFollowDialog}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader className="border-b border-gray-100 pb-4">
            <DialogTitle className="text-lg font-semibold">
              {followDialogType === "following" ? "Following" : "Followers"}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {loadingFollowList ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : followList.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No {followDialogType} yet
              </div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto px-1">
                {followList.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <Link 
                      href={`/user/${user.id}`}
                      className="flex items-center gap-3 flex-1 min-w-0 group"
                      onClick={() => setShowFollowDialog(false)}
                    >
                      <Avatar className="h-10 w-10 border border-gray-100">
                        <AvatarImage src={user.photoURL} />
                        <AvatarFallback className="bg-blue-50 text-blue-600">
                          {user.displayName?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-sm truncate group-hover:text-blue-500 transition-colors">
                            {user.displayName}
                          </p>
                          {user.isPremium && (
                            <RiVipCrownFill className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          @{user.username || user.displayName?.toLowerCase().replace(/\s+/g, '')}
                        </p>
                      </div>
                    </Link>
                    <div className="ml-4">
                      <FollowButton targetUserId={user.id} theme={user.customTheme} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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