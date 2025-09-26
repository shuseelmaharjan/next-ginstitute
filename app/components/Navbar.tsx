"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RxHamburgerMenu } from "react-icons/rx";
import { FaXmark } from "react-icons/fa6";
import { FaEnvelope, FaPhone } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { FaArrowRight } from "react-icons/fa";
import { FaUser } from "react-icons/fa";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@radix-ui/react-dropdown-menu";
import { MdDashboard } from "react-icons/md";
import { IoMdLogOut } from "react-icons/io";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import apiHandler from "../api/apiHandler";
import { useAuthenticate } from "../context/AuthenticateContext";

type NavLink = {
  href: string;
  label: string;
};

const NAV_LINKS: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/language", label: "Language" },
  { href: "/tuition", label: "Tuition" },
  { href: "/bridge-course", label: "Bridge Course" },
  { href: "/syllabus", label: "Syllabus" },
  { href: "/contact", label: "Contact" },
];

function Navbar() {
  // Use the hook inside the component!
  const { isAuthenticated, loading: isLoading, clearAuth } = useAuthenticate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const encryptedData = Cookies.get("_ud");

  const decryptData = (data: string) => {
    try {
      return JSON.parse(atob(data));
    } catch (error) {
      console.error("Failed to decrypt data:", error);
      return null;
    }
  };
  const userData = encryptedData ? decryptData(encryptedData) : null;

  const username =
    typeof window !== "undefined"
      ? sessionStorage.getItem("username") || userData?.username || null
      : userData?.username || null;
  const router = useRouter();

  // Logout function
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await apiHandler({
        url: "/api/auth/logout",
        method: "POST",
        data: {},
      });
      clearAuth();
      router.push("/login");
      window.location.reload();
    } catch (error) {
      clearAuth();
      router.push("/login");
      window.location.reload();
    } finally {
      setIsLoggingOut(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <>
      <nav className="sticky top-0 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/95 shadow-sm z-50">
        <div className="bg-primary-color py-1 h-auto">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-white px-4 gap-y-2 md:gap-y-0">
            {/* Left Side: Contact Info */}
            <div className="hidden md:flex items-center space-x-6 text-sm">
              <span className="flex items-center">
                <FaPhone className="h-4 w-4 mr-2" />
                <a href="tel:+97701-5108166" className="hover:underline">01-5108166</a>,
                <a href="tel:+977-9813940696" className="hover:underline ml-2">9813940696</a>
              </span>
              <span className="flex items-center">
                <FaEnvelope className="h-4 w-4 mr-2" />
                <a href="mailto:goldenfutureinstitute1@gmail.com" className="hover:underline">goldenfutureinstitute1@gmail.com</a>
              </span>
            </div>

            {/* Right Side: Buttons and Menu */}
            <div className="flex items-center gap-2">
              {/* Apply Button - Only show when not authenticated */}
              {!isAuthenticated && (
                <Link href="/apply">
                  <Button
                    size="sm"
                    className="group bg-orange-400 text-white hover:bg-orange-500 font-semibold px-3 py-1 rounded inline-flex items-center transition-all duration-200 cursor-pointer"
                  >
                    <span className="hidden sm:inline">Apply Online</span>
                    <span className="sm:hidden">Apply Online</span>
                    <FaArrowRight className="ml-1 transition-transform duration-200 group-hover:translate-x-1" />
                  </Button>
                </Link>
              )}

              {/* Login / Dropdown */}
              {isLoading ? (
                <></>
              ) : isAuthenticated && username ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-orange-400 text-white bg-orange-400 hover:bg-orange-500 hover:text-white font-semibold px-3 py-1 rounded flex items-center gap-2 shadow focus:ring-2 focus:ring-orange-300 transition-all cursor-pointer"
                    >
                      <FaUser className="text-sm" />
                      <span className="truncate max-w-[120px] hidden sm:inline">Hi, {username}</span>
                      <span className="sm:hidden">Welcome, {username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-60 bg-white shadow-2xl rounded-xl text-gray-900 px-2 py-3 border border-orange-100">
                    <DropdownMenuLabel className="font-bold text-gray-800 text-base px-2">My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator className="my-2 border-orange-100" />
                    <DropdownMenuGroup className="space-y-1 px-2">
                      <DropdownMenuItem
                        asChild
                        className="rounded transition bg-transparent hover:bg-gray-200 border-0 focus:outline-none focus:ring-0"
                      >
                        <Link href="/dashboard" className="flex items-center w-full py-2 px-2">
                          <MdDashboard className="mr-3 text-md" />
                          <span className="font-normal">Dashboard</span>
                        </Link>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        asChild
                        className="rounded transition bg-transparent hover:bg-gray-200 border-0 focus:outline-none focus:ring-0 cursor-pointer"
                      >
                        <AlertDialog>
                          <AlertDialogTrigger asChild className="rounded transition bg-transparent hover:bg-gray-200 border-0 focus:outline-none focus:ring-0">
                            <button className="flex items-center w-full py-2 px-2 text-left">
                              <IoMdLogOut className="mr-3 text-md" />
                              <span className="font-normal">Logout</span>
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                              <AlertDialogDescription>
                                You will be signed out of your account and redirected to the login page.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isLoggingOut ? "Logging out..." : "Logout"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/login">
                  <Button
                    size="sm"
                    className="bg-orange-400 text-white hover:bg-orange-500 font-semibold px-3 py-1 rounded inline-flex items-center transition-all duration-200 cursor-pointer"
                  >
                    <FaUser className="mr-1 text-sm" />
                    <span className="inline">Login</span>
                  </Button>
                </Link>
              )}
            </div>

          </div>
        </div>
        <div className="container md:container-xl md:mx-auto flex h-16 items-center justify-between px-4 lg:px-2">
          <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
            <img
              src="/images/mainlogo.webp"
              alt="Golden Future Institute Logo"
              className="h-12 w-auto"
            />
          </Link>

          <div className="hidden md:flex flex-1 justify-center items-center space-x-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-black hover:text-blue-700 px-3 py-2 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex flex-shrink-0 items-center">
            <img
              src="/images/flag.gif"
              alt="Flag"
              className="h-12 w-auto hover:scale-105 transition-transform duration-200"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="md:hidden flex-shrink-0 p-2 rounded-xl bg-gradient-to-r from-[#0962c6]/10 to-[#f29200]/10 hover:from-[#0962c6]/20 hover:to-[#f29200]/20 focus:outline-none focus:ring-2 focus:ring-[#0962c6] focus:ring-offset-2 transition-all duration-200"
            onClick={() => setIsOpen(true)}
            aria-label="Toggle menu"
          >
            <RxHamburgerMenu className="h-6 w-6 text-primary-color" />
          </motion.button>
        </div>

        <AnimatePresence mode="wait">
          {isOpen && (
            <>
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{
                  duration: 0.15,
                  ease: "easeInOut"
                }}
                className="fixed inset-0 z-[200] bg-black backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              />

              {/* Full Width Mobile Menu */}
              <motion.div
                key="mobile-menu"
                initial={{ y: "-100%" }}
                animate={{ y: 0 }}
                transition={{
                  type: "tween",
                  duration: 0.25,
                  ease: "easeInOut"
                }}
                className="fixed top-0 left-0 w-full h-full bg-white z-[201] flex flex-col shadow-2xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-6 border-orange-400 border-b bg-primary-color shadow-lg">
                  <div className="flex items-center space-x-3">
                    <img
                      src="/images/whitelogo.webp"
                      alt="Logo"
                      className="h-12 w-auto"
                    />
                  </div>
                  <motion.button
                    whileTap={{ rotate: 180, scale: 1.1 }}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setIsOpen(false)}
                    aria-label="Close menu"
                    className="rounded-full p-3 transition-all hover:bg-white/10 active:bg-white/20"
                  >
                    <FaXmark className="h-7 w-7 text-white" />
                  </motion.button>
                </div>

                {/* Navigation Links */}
                <div className="flex-1 flex flex-col justify-center px-6 py-8 space-y-2 bg-gradient-to-b from-white to-gray-50">
                  {NAV_LINKS.map((link, index) => (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{
                        delay: index * 0.05,
                        duration: 0.2,
                        ease: "easeOut"
                      }}
                    >
                      <Link
                        href={link.href}
                        className="group relative block text-xl font-bold text-gray-800 hover:text-[#0962c6] rounded-2xl px-6 py-5 transition-all duration-300 transform hover:scale-105 hover:bg-gradient-to-r hover:from-blue-50 hover:to-orange-50 border-l-4 border-transparent hover:border-[#0962c6] active:scale-95"
                        onClick={() => setIsOpen(false)}
                      >
                        <span className="relative z-10">{link.label}</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#0962c6]/5 to-[#f29200]/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      </Link>
                    </motion.div>
                  ))}
                </div>
                <div className="px-6 py-6 border-t bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex flex-col space-y-5">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{
                        delay: 0.3,
                        duration: 0.2,
                        ease: "easeOut"
                      }}
                    >

                      {!isAuthenticated || !username ? (
                        <Link href="/apply" className="w-full">
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-orange-400 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                            onClick={() => setIsOpen(false)}
                          >
                            <span className="relative z-10">Apply Online</span>
                          </motion.button>
                        </Link>
                      ) : (
                        <></>
                      )}
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{
                        delay: 0.4,
                        duration: 0.2,
                        ease: "easeOut"
                      }}
                    >
                      {isAuthenticated && username ? (
                        <>
                          <Link href="/dashboard" className="w-full">
                            <motion.button
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                            >
                              <span className="relative z-10">Dashboard</span>
                            </motion.button>
                          </Link>
                        </>
                      ) : (
                        <Link href="/login" className="w-full">
                          <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                          >
                            <span className="relative z-10">Login</span>
                          </motion.button>
                        </Link>
                      )}
                    </motion.div>

                    {/* Logout button for mobile when authenticated */}
                    {isAuthenticated && username && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{
                          delay: 0.5,
                          duration: 0.2,
                          ease: "easeOut"
                        }}
                      >
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <motion.button
                              whileHover={{ scale: 1.02, y: -2 }}
                              whileTap={{ scale: 0.98 }}
                              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
                            >
                              <span className="relative z-10">Logout</span>
                            </motion.button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                              <AlertDialogDescription>
                                You will be signed out of your account and redirected to the login page.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={handleLogout}
                                disabled={isLoggingOut}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {isLoggingOut ? "Logging out..." : "Logout"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}

export default Navbar;