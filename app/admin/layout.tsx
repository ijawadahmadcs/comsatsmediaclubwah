"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Menu,
  Shield,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";

type Admin = {
  name?: string;
  registrationNumber: string;
  role: "admin" | "superadmin";
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    fetch("/api/auth/me")
      .then(async (response) => {
        if (!response.ok) {
          router.replace("/admin/login");
          return;
        }
        const result = await response.json();
        setAdmin(result.admin);
      })
      .catch(() => router.replace("/admin/login"));
  }, [pathname, router]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  if (pathname === "/admin/login") return <>{children}</>;

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/applications", label: "Applications", icon: Shield },
    { href: "/admin/team", label: "Team", icon: Users },
    { href: "/admin/work", label: "Work Gallery", icon: ImageIcon },
    ...(admin?.role === "superadmin"
      ? [
          { href: "/admin/admins", label: "Admins", icon: Shield },
          { href: "/admin/team-leads", label: "Team Leads", icon: Users },
        ]
      : []),
  ];

  return (
    <div className="admin-shell min-h-screen bg-[#08090b] text-[13px] text-white">
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(18rem,88vw)] border-r border-white/10 bg-[#0b0d10] p-4 shadow-2xl transition-transform lg:translate-x-0 lg:p-5 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between">
          <Link
            href="/admin"
            className="text-sm font-semibold tracking-[0.2em]"
          >
            <div className="flex items-center justify-center gap-4">
              <Image
                src="/logo.jpg"
                alt="COMSATS Media Club"
                width={35}
                height={35}
                className="rounded-xl"
              />
              <span>Admin Panel</span>
            </div>
          </Link>
          <button
            className="lg:hidden"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>
        <p className="mt-3 text-xs leading-5 text-white/35">
          Manage the people, stories and applications behind the club.
        </p>
        <nav className="mt-8 space-y-1.5">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${pathname === href ? "bg-white text-black" : "text-white/55 hover:bg-white/10 hover:text-white"}`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4 border-t border-white/10 pt-4 lg:bottom-5 lg:left-5 lg:right-5">
          <p className="truncate text-xs text-white/60">
            {admin?.name || admin?.registrationNumber || "Loading..."}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.15em] text-white/30">
            {admin?.role}
          </p>
          <button
            onClick={logout}
            className="mt-4 flex items-center gap-2 text-sm text-white/45 transition hover:text-white"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </aside>
      <div className="lg:pl-72">
        <button
          onClick={() => setOpen(true)}
          className="fixed left-3 top-25 z-30 rounded-lg border border-white/10 bg-[#0b0d10] p-2 text-white shadow-lg lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={19} />
        </button>
        {children}
      </div>
    </div>
  );
}
