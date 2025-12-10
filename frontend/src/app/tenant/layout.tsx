"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import RoleGuard from "@/components/auth/RoleGuard";

type TenantLayoutProps = {
  children: React.ReactNode;
};

export default function TenantLayout({ children }: TenantLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  const navItems = [
    {
      href: "/tenant/dashboard",
      label: "Tổng quan",
    },
    {
      href: "/tenant/contracts",
      label: "Hợp đồng",
    },
    {
      href: "/tenant/tickets",
      label: "Yêu cầu sửa chữa",
    },
    {
      href: "/tenant/payments",
      label: "Thanh toán",
    },
  ];

  return (
    // Bọc RoleGuard: chỉ Tenant mới vào được layout này
    <RoleGuard allowedRoles={["Tenant"]}>
      <div className="flex h-screen bg-gray-100">
        {/* SIDEBAR */}
        <aside
          className={`${
            isSidebarOpen ? "w-64" : "w-0 md:w-16"
          } bg-gray-900 text-white transition-all duration-200 overflow-hidden flex flex-col`}
        >
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-800">
            <span className="font-semibold tracking-wide text-sm">
              Tenant Portal
            </span>
            <button
              type="button"
              className="md:hidden p-1 rounded hover:bg-gray-800"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex-1 px-2 py-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${
                    isActive
                      ? "bg-gray-800 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Nút thu gọn sidebar ở desktop */}
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden md:block px-4 py-3 text-xs text-gray-400 hover:bg-gray-800 border-t border-gray-800 text-center"
          >
            {isSidebarOpen ? "Thu gọn" : "Mở rộng"}
          </button>
        </aside>

        {/* MAIN CONTENT */}
        <div className="flex-1 flex flex-col">
          {/* TOP BAR */}
          <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
            <div className="flex items-center gap-2">
              {/* Nút mở sidebar trên mobile */}
              <button
                type="button"
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:bg-gray-100"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                Khu vực Khách thuê
              </h1>
            </div>

            <div className="text-xs text-gray-500">
              {/* chỗ này sau có thể show tên user, avatar, v.v. */}
              Đăng nhập với vai trò: <span className="font-semibold">Tenant</span>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
            {children}
          </main>
        </div>
      </div>
    </RoleGuard>
  );
}
