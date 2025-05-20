import { useState, useRef, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/router";
import { toast } from "react-toastify";
import { addDoc, collection, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { BiError, BiImage, BiX } from "react-icons/bi";
import { FiCheck } from "react-icons/fi";
import Image from "next/image";

import AvatarImg from "./avatarimg";
import { auth, db } from "/utils/firebase";

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

export default function NewPost() {
  const [user, loading] = useAuthState(auth);
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const fileInputRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const checkPremiumStatus = async () => {
      if (!user) return;

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setIsPremium(userDoc.data().isPremium || false);
        }
      } catch (error) {
        console.error("Error checking premium status:", error);
      }
    };

    checkPremiumStatus();
  }, [user]);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size should be less than 5MB", {
          ...toastStyles.error,
          position: toast.POSITION.BOTTOM_RIGHT,
          autoClose: 3000,
          hideProgressBar: true,
        });
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.secure_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!description && !selectedImage) {
      toast.error("Please write something or add an image", {
        ...toastStyles.error,
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
      return;
    }

    const characterLimit = isPremium ? 2000 : 300;
    if (description.length > characterLimit) {
      toast.error(`Post is too long (${characterLimit} characters maximum)`, {
        ...toastStyles.error,
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
      return;
    }

    setIsUploading(true);

    try {
      let imageUrl = null;
      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage);
      }

      const collectionRef = collection(db, "posts");
      await addDoc(collectionRef, {
        description,
        timestamp: serverTimestamp(),
        uid: user.uid,
        avatar: user.photoURL,
        username: user.displayName,
        likes: [],
        imageUrl,
      });

      setDescription("");
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Post created successfully", {
        ...toastStyles.success,
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });

      router.push("/");
    } catch (error) {
      console.error("Error posting:", error);
      toast.error("Unable to create post", {
        ...toastStyles.error,
        position: toast.POSITION.BOTTOM_RIGHT,
        autoClose: 3000,
        hideProgressBar: true,
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="border-b border-gray-200 pb-3">
      <form
        onSubmit={handleSubmit}
        className="px-4 pt-3 flex flex-col gap-2 max-w-2xl mx-auto"
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <AvatarImg
              w={12}
              h={12}
              avatar={user.photoURL}
              username={user.displayName}
            />
          </div>

          {/* Text area and image preview */}
          <div className="flex-grow">
            <textarea
              className="w-full px-0 pt-2 text-16 placeholder:text-gray-500 border-0 resize-none outline-none min-h-[120px]"
              placeholder={isPremium ? "What's happening? (2000 characters)" : "What's happening? (300 characters)"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mb-3">
                <div className="relative w-full rounded-2xl overflow-hidden bg-gray-50 border border-gray-100" style={{ maxHeight: '512px' }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 left-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black/80 transition-opacity"
                  >
                    <BiX className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Twitter-style divider and icons */}
            <div className="border-t border-gray-100 pt-3 mt-2">
              <div className="flex items-center justify-between">
                <div className="flex space-x-1 text-blue-500">
                  {/* Image upload button */}
                  <div className="relative">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 rounded-full hover:bg-blue-50 transition-colors"
                      disabled={isUploading}
                    >
                      <BiImage className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Character count */}
                  <div className="relative">
                    <svg className="w-[26px] h-[26px]" viewBox="0 0 24 24">
                      <circle 
                        className="text-gray-200" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                      />
                      <circle 
                        className={`${
                          description.length > (isPremium ? 1800 : 270)
                            ? description.length > (isPremium ? 2000 : 300)
                              ? "text-red-500" 
                              : "text-yellow-500" 
                            : "text-blue-500"
                        }`} 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        strokeDasharray={`${(description.length / (isPremium ? 2000 : 300)) * 63} 63`}
                        strokeDashoffset="0"
                        transform="rotate(-90 12 12)"
                      />
                      {description.length > (isPremium ? 1800 : 270) && (
                        <text
                          x="12"
                          y="12"
                          textAnchor="middle"
                          dy=".3em"
                          className={`text-13 font-medium ${
                            description.length > (isPremium ? 2000 : 300) 
                              ? "fill-red-500" 
                              : "fill-yellow-500"
                          }`}
                        >
                          {(isPremium ? 2000 : 300) - description.length}
                        </text>
                      )}
                    </svg>
                  </div>
                  
                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={isUploading || (!description.trim() && !selectedImage)}
                    className={`rounded-full bg-blue-500 text-white font-semibold text-15 py-2 px-5 ${
                      isUploading || (!description.trim() && !selectedImage)
                        ? "opacity-50 cursor-not-allowed"
                        : "hover:bg-blue-600"
                    }`}
                  >
                    {isUploading ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}