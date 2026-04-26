"use client";

import { SIDEBAR_ROOT, SIDEBAR_NAV } from "../../formStyles.v2";

type SidebarProps = {
  children: React.ReactNode;
};

export default function Sidebar({ children }: SidebarProps) {
  return (
    <aside className={SIDEBAR_ROOT}>
      <div className={SIDEBAR_NAV}>{children}</div>
    </aside>
  );
}
