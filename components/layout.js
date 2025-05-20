import Sidebar from "./Sidebar";
import SuggestedUsers from "./SuggestedUsers";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../utils/firebase";
import { RiUserFollowLine, RiHome7Line, RiVipCrownFill } from "react-icons/ri";
import { BiUser } from "react-icons/bi";
import { MdOutlineExplore } from "react-icons/md";
import Link from "next/link";

export default function Layout({ children }) {
  const router = useRouter();
  const [user] = useAuthState(auth);
  const isAuthPage = router.pathname.startsWith("/auth/");
  const currentPath = router.pathname;

  if (isAuthPage) {
    return children;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Header - Shows only on mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-50">
        <div className="flex items-center justify-center h-full">
          <img src="/logo.png" alt="echo" className="h-8" />
        </div>
      </div>

      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <div className="hidden lg:block fixed left-0 top-0 h-screen w-64">
        <Sidebar />
      </div>

      {/* Mobile Bottom Navigation - Shows only on mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-full">
          <Link 
            href="/" 
            className={`flex flex-col items-center justify-center p-2 rounded-full w-12 h-12 ${
              currentPath === "/" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <RiUserFollowLine className="h-6 w-6" />
          </Link>
          
          <Link 
            href="/explore" 
            className={`flex flex-col items-center justify-center p-2 rounded-full w-12 h-12 ${
              currentPath === "/explore" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <MdOutlineExplore className="h-6 w-6" />
          </Link>
          
          <Link 
            href="/premium" 
            className={`flex flex-col items-center justify-center p-2 rounded-full w-12 h-12 ${
              currentPath === "/premium" ? "text-blue-600" : "text-gray-600"
            }`}
          >
            <RiVipCrownFill className="h-6 w-6" />
          </Link>
          
          {user && (
            <Link 
              href={`/user/${user.uid}`}
              className={`flex flex-col items-center justify-center p-2 rounded-full w-12 h-12 ${
                currentPath.startsWith("/user/") ? "text-blue-600" : "text-gray-600"
              }`}
            >
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="h-6 w-6 rounded-full" />
              ) : (
                <BiUser className="h-6 w-6" />
              )}
            </Link>
          )}
          
          {!user && (
            <Link 
              href="/auth/login" 
              className={`flex flex-col items-center justify-center p-2 rounded-full w-12 h-12 ${
                currentPath.startsWith("/auth/") ? "text-blue-600" : "text-gray-600"
              }`}
            >
              <BiUser className="h-6 w-6" />
            </Link>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 lg:pl-64">
        <div className="container mx-auto px-4 py-4 lg:py-8 mt-14 mb-14 lg:my-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {children}
            </div>
            {/* Suggested Users - Hidden on mobile */}
            <div className="hidden lg:block">
              <div className="sticky top-8">
                <SuggestedUsers />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}