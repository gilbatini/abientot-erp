"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@/types/app";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",  icon: "🏠" },
  { href: "/travellers", label: "Travellers", icon: "👥" },
  { href: "/invoices",   label: "Invoices",   icon: "🧾" },
  { href: "/receipts",   label: "Receipts",   icon: "💳" },
  { href: "/proformas",  label: "Proformas",  icon: "📋" },
  { href: "/quotations", label: "Quotations", icon: "💬" },
];

interface SidebarProps { role?: Role; userName?: string; }

export function Sidebar({ role, userName = "User" }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 w-60 bg-white border-r border-gray-200 flex flex-col z-10">
      {/* Brand */}
      <div className="px-4 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <Image src="/logo.svg" alt="AlgoriOffice" width={120} height={34} className="flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-display font-semibold text-sm text-gray-900 leading-tight">AlgoriOffice</p>
            <p className="text-xs text-gray-400 truncate">À Bientôt Travels</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                active
                  ? "bg-primary-light text-primary font-medium"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="text-base w-5 text-center">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}

        {role === "admin" && (
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors mt-2 ${
              pathname.startsWith("/settings")
                ? "bg-primary-light text-primary font-medium"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="text-base w-5 text-center">⚙️</span>
            Settings
          </Link>
        )}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
            style={{ backgroundColor: "#2BBFB3" }}
          >
            {userName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{userName}</p>
            <p className="text-xs text-gray-400 capitalize">{role ?? "viewer"}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
