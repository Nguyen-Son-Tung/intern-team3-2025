"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, usePathname } from "next/navigation"
import { Menu, X } from "lucide-react" 
import RoleGuard from "@/components/auth/RoleGuard"
import NotificationDropdown from "@/components/noti/NotificationDropdown"
import ConfirmModal from "@/components/common/ConfirmModal"

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const router = useRouter()
    const pathname = usePathname()
    const [userFullName, setUserFullName] = useState("Owner")

    // Tự động đóng mobile menu khi chuyển trang
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsMobileMenuOpen(false)
        }, 0)
        return () => clearTimeout(timer)
    }, [pathname])

    // Đăng xuất
    const performLogout = () => {
        if (typeof window !== "undefined") {
            localStorage.clear()
        }
        router.push("/public/login")
        setShowLogoutModal(false)
    }

    // Lấy tên chủ nhà từ localStorage
    useEffect(() => {
        if (typeof window !== "undefined") {
            const name = localStorage.getItem("userFullName") || "Owner"
            const timer = setTimeout(() => {
                setUserFullName(name)
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [])

    return (
        <RoleGuard allowedRoles={["Owner"]}>
            <div className="flex h-screen bg-gray-100">
                
                {/* --- MOBILE OVERLAY --- */}
                {isMobileMenuOpen && (
                    <div 
                        className="fixed inset-0 z-30 bg-black/50 md:hidden transition-opacity"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}

                {/* --- SIDEBAR --- */}
                <aside
                    className={`
                        fixed inset-y-0 left-0 z-40 bg-gray-800 text-white transition-all duration-300 flex flex-col
                        transform md:translate-x-0 md:static
                        ${isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full md:w-auto"}
                        ${isSidebarOpen ? "md:w-64" : "md:w-20"}
                    `}
                >
                    {/* Header Sidebar */}
                    <div className="p-4 border-b border-gray-700 font-bold flex justify-between items-center h-16">
                        <span className={`truncate ${!isSidebarOpen ? "md:hidden" : "block"} mx-auto md:mx-0`}>
                            {isSidebarOpen || isMobileMenuOpen ? "Cổng chủ nhà" : "CN"}
                        </span>
                        {/* Nút đóng menu chỉ hiện trên mobile */}
                        <button 
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="md:hidden text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Navigation Links */}
                    <nav className="flex-1 p-2 space-y-2 overflow-y-auto">
                        <SidebarLink href="/owner/dashboard" label="Tổng quan" isOpen={isSidebarOpen} />
                        <SidebarLink href="/owner/houses" label="Quản lý toà nhà" isOpen={isSidebarOpen} />
                        <SidebarLink href="/owner/rooms" label="Quản lý phòng" isOpen={isSidebarOpen} />
                        <SidebarLink href="/owner/tenants" label="Quản lý khách thuê" isOpen={isSidebarOpen} />
                        <SidebarLink href="/owner/contracts" label="Quản lý hợp đồng" isOpen={isSidebarOpen} />
                        <SidebarLink href="/owner/invoices" label="Quản lý hóa đơn" isOpen={isSidebarOpen} />
                        <SidebarLink href="/owner/monthlyreading" label="Quản lý nộp chỉ số" isOpen={isSidebarOpen} />
                        <SidebarLink href="/owner/tickets" label="Yêu cầu hỗ trợ" isOpen={isSidebarOpen} />

                        <button
                            onClick={() => setShowLogoutModal(true)}
                            className="w-full text-left block p-2 hover:bg-red-600 text-red-200 hover:text-white rounded mt-4 transition-colors whitespace-nowrap"
                        >
                            <span className={!isSidebarOpen ? "md:hidden" : "block"}>Đăng xuất</span>
                            {!isSidebarOpen && <span className="hidden md:block text-center text-xs">Exit</span>}
                        </button>
                    </nav>

                    {/* Desktop Toggle Button */}
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="hidden md:block p-4 bg-gray-900 text-center hover:bg-gray-700 transition-colors"
                    >
                        {isSidebarOpen ? "Thu gọn" : ">"}
                    </button>
                </aside>

                {/* --- MAIN CONTENT --- */}
                <div className="flex-1 flex flex-col overflow-hidden w-full">
                    <header className="bg-white shadow p-4 flex justify-between items-center h-16 shrink-0">
                        <div className="flex items-center gap-3">
                            {/* Nút Hamburger mở menu trên mobile */}
                            <button 
                                onClick={() => setIsMobileMenuOpen(true)}
                                className="md:hidden p-1 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                <Menu size={24} />
                            </button>
                            
                            <h1 className="font-bold text-gray-700 text-lg md:text-xl truncate">
                                Khu vực chủ nhà
                            </h1>
                        </div>

                        <div className="flex items-center gap-2 md:gap-4">
                            <NotificationDropdown />

                            <div className="h-6 w-px bg-gray-300 mx-1"></div>

                            <div className="flex items-center gap-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-sm font-bold text-gray-800">
                                        {userFullName}
                                    </p>
                                    <p className="text-xs text-gray-500">Chủ nhà</p>
                                </div>

                                <div className="relative w-8 h-8 md:w-10 md:h-10 shrink-0">
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

                    <main className="flex-1 overflow-auto bg-gray-50">
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
}

// Component phụ để render Link gọn gàng hơn và xử lý responsive text
function SidebarLink({ href, label, isOpen }: { href: string, label: string, isOpen: boolean }) {
    return (
        <Link 
            href={href} 
            className="block p-2 hover:bg-gray-700 rounded transition-colors whitespace-nowrap min-h-[40px] flex items-center"
            title={!isOpen ? label : ""} // Tooltip khi thu gọn
        >
            <span className={!isOpen ? "md:hidden" : "block"}>
                {label}
            </span>
            {!isOpen && <span className="hidden md:block text-xl font-bold w-full text-center">{label.charAt(0)}</span>}
        </Link>
    )
}