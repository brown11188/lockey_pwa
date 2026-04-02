"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, LogOut, Shield } from "lucide-react";
import { signOut } from "next-auth/react";

const nav = [
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="flex w-56 flex-col border-r"
      style={{
        background: "#0d0d0d",
        borderColor: "rgba(245,158,11,0.12)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b" style={{ borderColor: "rgba(245,158,11,0.12)" }}>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-black text-gray-950"
          style={{ background: "#f59e0b" }}
        >
          L
        </div>
        <div>
          <div className="text-xs font-bold text-white tracking-widest uppercase">Lockey</div>
          <div className="flex items-center gap-1 mt-0.5">
            <Shield size={9} className="text-amber-400" />
            <span className="text-[10px] text-amber-400 font-mono tracking-wider">ADMIN</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-2 mb-2 text-[9px] font-mono tracking-[0.2em] text-gray-600 uppercase">Navigation</p>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-all"
              style={{
                background: active ? "rgba(245,158,11,0.1)" : "transparent",
                color: active ? "#f59e0b" : "#9ca3af",
                borderLeft: active ? "2px solid #f59e0b" : "2px solid transparent",
              }}
            >
              <Icon size={15} />
              <span className="font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="px-3 pb-5 border-t pt-4" style={{ borderColor: "rgba(245,158,11,0.12)" }}>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm text-gray-500 transition-colors hover:text-gray-300"
        >
          <LogOut size={15} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
}
