"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SIDEBAR_NAV_ITEM,
  SIDEBAR_NAV_ITEM_INACTIVE,
  SIDEBAR_NAV_LABEL_ACTIVE,
  SIDEBAR_NAV_LABEL_INACTIVE,
  SIDEBAR_NAV_PILL_ACTIVE,
  SIDEBAR_NAV_PILL_INACTIVE,
} from "../../formStyles.v2";

const SVG_EDIT_ICON = (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 18 18" fill="none">
    <path d="M8 13H0V16C0 16.55 0.195833 17.0208 0.5875 17.4125C0.979167 17.8042 1.45 18 2 18H8V13ZM10 13V18H16C16.55 18 17.0208 17.8042 17.4125 17.4125C17.8042 17.0208 18 16.55 18 16V13H10ZM8 11V6H0V11H8ZM10 11H18V6H10V11ZM0 4H18V2C18 1.45 17.8042 0.979167 17.4125 0.5875C17.0208 0.195833 16.55 0 16 0H2C1.45 0 0.979167 0.195833 0.5875 0.5875C0.195833 0.979167 0 1.45 0 2V4Z" 
      fill="var(--edit-teal-600)"/>
  </svg>
)

export default function SidebarEditButton() {
  const pathname = usePathname();
  const isActive = pathname === "/edit";

  return (
    <Link href="/edit" className={isActive ? SIDEBAR_NAV_ITEM : SIDEBAR_NAV_ITEM_INACTIVE}>
      <span className={isActive ? SIDEBAR_NAV_PILL_ACTIVE : SIDEBAR_NAV_PILL_INACTIVE}>
        {SVG_EDIT_ICON}
      </span>
      <span className={isActive ? SIDEBAR_NAV_LABEL_ACTIVE : SIDEBAR_NAV_LABEL_INACTIVE}>
        Manage
      </span>
    </Link>
  );
}
