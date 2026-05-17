import { SIDEBAR_ROOT, SIDEBAR_NAV } from "@/app/edit/formStyles.v2";

type SidebarProps = {
  children: React.ReactNode;
  className?: string;
};

export default function Sidebar({ children, className }: SidebarProps) {
  return (
    <aside
      className={className ? `${SIDEBAR_ROOT} ${className}` : SIDEBAR_ROOT}
    >
      <div className={SIDEBAR_NAV}>{children}</div>
    </aside>
  );
}
