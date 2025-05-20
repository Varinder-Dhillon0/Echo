import Link from "next/link";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../utils/firebase";
import { SiMinds } from "react-icons/si";
import { RiHome7Line, RiHome7Fill, RiUserFollowLine, RiVipCrownFill } from "react-icons/ri";
import { BiUser } from "react-icons/bi";
import { FiEdit } from "react-icons/fi";
import { MdOutlineExplore } from "react-icons/md";
import Image from 'next/image'
import logo from "../public/logo.png"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

export default function Sidebar() {
  const [user] = useAuthState(auth);
  const router = useRouter();
  const currentPath = router.pathname;

  const navigation = [
    {
      name: "Feed",
      href: "/",
      icon: RiUserFollowLine,
    },
    {
      name: "Explore",
      href: "/explore",
      icon: MdOutlineExplore,
    },
    {
      name: "Premium",
      href: "/premium",
      icon: RiVipCrownFill,
    },
  ];

  return (
    <div className="fixed left-0 h-screen w-64 border-r border-gray-200 bg-white">
      <div className="flex h-full items-center flex-col px-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 pt-10">
          <img className="w-20" src={logo.src} alt="echo"/>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center flex-1 flex-col space-y-2.5 flex-start pt-10 w-full">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-15 font-medium transition-colors ${
                  currentPath === item.href
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        {user ? (
          <div className="border-t border-gray-200 p-4 w-full">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <div className="flex items-center gap-3 hover:bg-gray-50 rounded-lg p-2 transition-colors">
                  <img
                    src={user.photoURL}
                    alt={user.displayName}
                    className="h-8 w-8 rounded-full"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-15 font-medium truncate">{user.displayName}</p>
                    <p className="text-13 text-gray-500 truncate">{user.email}</p>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px]">
                <Link href={`/user/${user.uid}`}>
                  <DropdownMenuItem className="cursor-pointer text-15">
                    <BiUser className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem 
                  className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50 text-15"
                  onClick={() => auth.signOut()}
                >
                  <FiEdit className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="border-t border-gray-200 p-4 w-full">
            <Link
              href="/auth/login"
              className="flex items-center justify-center rounded-lg bg-blue-500 px-4 py-2 text-15 font-medium text-white hover:bg-blue-600"
            >
              Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 