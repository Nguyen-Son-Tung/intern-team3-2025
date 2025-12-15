"use client";

<<<<<<< HEAD
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
=======
import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import RoleGuard from "@/components/auth/RoleGuard"
import NotificationDropdown from "@/components/noti/NotificationDropdown"
import ConfirmModal from "@/components/common/ConfirmModal"

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const router = useRouter()

    // Đăng xuất
    const performLogout = () => {
        if (typeof window !== "undefined") {
            localStorage.clear()
        }
        router.push("/public/login")
        setShowLogoutModal(false)
    }

    // Lấy tên người thuê
    const userFullName =
        typeof window !== "undefined"
            ? localStorage.getItem("userFullName")
            : "Tenant"

    return (
        <RoleGuard allowedRoles={["Tenant"]}>
            <div className="flex h-screen bg-gray-100">
                {/* SIDEBAR */}
                <aside
                    className={`${
                        isSidebarOpen ? "w-64" : "w-20"
                    } bg-gray-800 text-white transition-all duration-300 flex flex-col`}
                >
                    <div className="p-4 border-b border-gray-700 font-bold text-center truncate">
                        {isSidebarOpen ? "Cổng cư dân" : "Cư dân"}
                    </div>

                    <nav className="flex-1 p-4 space-y-2">
                        <Link href="/tenant/dashboard" className="block p-2 hover:bg-gray-700 rounded">
                            {isSidebarOpen && "Tổng quan"}
                        </Link>

                        <Link href="/tenant/contracts" className="block p-2 hover:bg-gray-700 rounded">
                            {isSidebarOpen && "Hợp đồng thuê"}
                        </Link>

                        <Link href="/tenant/bills" className="block p-2 hover:bg-gray-700 rounded">
                            {isSidebarOpen && "Hóa đơn"}
                        </Link>

                        <Link href="/tenant/readinghistory" className="block p-2 hover:bg-gray-700 rounded">
                            {isSidebarOpen && "Lịch sử nộp chỉ số"}
                        </Link>

                        <Link href="/tenant/tickets" className="block p-2 hover:bg-gray-700 rounded">
                            {isSidebarOpen && "Yêu cầu sửa chữa"}
                        </Link>

                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="w-full text-left block p-2 hover:bg-red-600 text-red-200 hover:text-white rounded mt-4"
                        >
                            {isSidebarOpen && "Đăng xuất"}
                        </button>
                    </nav>

                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-4 bg-gray-900 text-center hover:bg-gray-700"
                    >
                        {isSidebarOpen ? "Thu gọn" : ">"}
                    </button>
                </aside>

                {/* MAIN CONTENT */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    <header className="bg-white shadow p-4 flex justify-between items-center">
                        <h1 className="font-bold text-gray-700 text-xl">
                            Khu vực người thuê
                        </h1>

                        <div className="flex items-center gap-4">
                            <NotificationDropdown />

                            <div className="h-6 w-px bg-gray-300"></div>

                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-gray-800">
                                        {userFullName}
                                    </p>
                                    <p className="text-xs text-gray-500">Người thuê</p>
                                </div>

                                <div className="relative w-10 h-10">
                                    <Image
                                        src="/logo.png"
                                        alt="Avatar"
                                        fill
                                        className="rounded-full object-cover border"
                                    />
                                </div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-auto p-6 bg-gray-50">
                        {children}
                    </main>
                </div>

                <ConfirmModal 
                    isOpen={showLogoutModal}
                    onClose={() => setShowLogoutModal(false)}
                    onConfirm={performLogout}
                    title="Đăng xuất"
                    message="Bạn có chắc chắn muốn đăng xuất không?"
                    confirmText="Đăng xuất"
                    cancelText="Không"
                />
            </div>
        </RoleGuard>
    )
>>>>>>> origin/main
}
