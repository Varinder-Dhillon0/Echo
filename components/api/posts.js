import {
    collection,
    query,
    where,
    onSnapshot,
    getDoc,
    getDocs,
    doc,
    orderBy
  } from "firebase/firestore";
  
import { db } from "@/utils/firebase";

export const getPosts = async (loading, user, setAllposts) => {
if (loading) return;
if (!user) return route.push("/auth/login");

const collectionRef = collection(db, "posts");
const q = query(collectionRef);

const unsubscribe = onSnapshot(q, async (snapshot) => {
    const posts = await Promise.all(
    snapshot.docs.map(async (docSnap) => {
        const postData = docSnap.data();
        const postId = docSnap.id;

        // 1. Get full user data for the post author
        const userDoc = await getDoc(doc(db, "users", postData.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;

        // 2. For each comment, fetch commenter user data
        const commentsWithUser = await Promise.all(
        (postData.comments || []).map(async (comment) => {
            if (!comment.uid) return comment;
            const commenterDoc = await getDoc(doc(db, "users", comment.uid));
            const commenterData = commenterDoc.exists()
            ? commenterDoc.data()
            : null;
            return {
            ...comment,
            user: commenterData,
            };
        })
        );

        return {
        ...postData,
        id: postId,
        user: userData,
        comments: commentsWithUser,
        };
    })
    );
    console.log(posts)
    setAllposts(posts);
});

return unsubscribe;
};

