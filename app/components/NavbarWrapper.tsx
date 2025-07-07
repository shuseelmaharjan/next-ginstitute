"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import { SHOW_NAVBAR_ROUTES } from "./../constant/routes";

export default function NavbarWrapper() {
  const pathname = usePathname();

  const showNavbar = SHOW_NAVBAR_ROUTES.includes(pathname);
  if (!showNavbar) return null;

  return <Navbar />;
}
