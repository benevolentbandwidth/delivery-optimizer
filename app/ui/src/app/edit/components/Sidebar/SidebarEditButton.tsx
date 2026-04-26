"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SIDEBAR_NAV_ITEM,
  SIDEBAR_NAV_LABEL_ACTIVE,
  SIDEBAR_NAV_LABEL_INACTIVE,
  SIDEBAR_NAV_PILL_ACTIVE,
  SIDEBAR_NAV_PILL_INACTIVE,
} from "../../formStyles.v2";

export default function SidebarEditButton() {
  const pathname = usePathname();
  const isActive = pathname === "/edit";

  return (
    <Link href="/edit" className={SIDEBAR_NAV_ITEM}>
      <span className={isActive ? SIDEBAR_NAV_PILL_ACTIVE : SIDEBAR_NAV_PILL_INACTIVE}>
        <img src="/icons/sidebar/edit_square.png" alt="" width={24} height={24} />
      </span>
      <span className={isActive ? SIDEBAR_NAV_LABEL_ACTIVE : SIDEBAR_NAV_LABEL_INACTIVE}>
        Edit
      </span>
    </Link>
  );
}
