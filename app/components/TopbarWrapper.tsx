"use client";

import { usePathname } from "next/navigation";
import { SHOW_NAVBAR_ROUTES } from "./../constant/routes";
import Topbar from "./Topbar";

export default function TopbarWrapper() {
  const pathname = usePathname();

  const showNavbar = SHOW_NAVBAR_ROUTES.includes(pathname);
  if (!showNavbar) return null;

  return <Topbar />;
}
