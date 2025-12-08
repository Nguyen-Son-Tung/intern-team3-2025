'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

interface NavItem {
  readonly href: string;
  readonly label: string;
  readonly short: string;
}

const navItems: readonly NavItem[] = [
  { href: '/owner/dashboard', label: 'Tổng quan', short: 'TQ' },
  { href: '/owner/houses', label: 'Danh sách nhà', short: 'Nhà' },
  { href: '/owner/rooms', label: 'Danh sách phòng', short: 'P' },
  { href: '/owner/tenants', label: 'Danh sách người thuê', short: 'NT' },
  { href: '/owner/tenant-contracts', label: 'Danh sách hợp đồng', short: 'HĐ' },
  { href: '/owner/invoices', label: 'Danh sách hóa đơn', short: 'HD' },
  { href: '/owner/tenants/tickets', label: 'Danh sách yêu cầu sửa chữa', short: 'SC' },
  { href: '/owner/notification', label: 'Thông báo', short: 'TB' },
  { href: '/owner/profile', label: 'Thông tin cá nhân', short: 'CN' },
];

interface OwnerLayoutProps {
  readonly children: ReactNode;
}

export default function OwnerLayout({ children }: OwnerLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* SIDEBAR */}
      <aside
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-800 text-white transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-700 font-bold text-center text-sm">
          {isSidebarOpen ? 'Trang của bạn' : 'Chủ trọ'}
        </div>

        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded px-2 py-2 text-sm transition-colors
                  ${
                    isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'hover:bg-gray-700/80'
                  }`}
              >
                {/* icon / chữ viết tắt khi thu gọn */}
                <span
                  className={`flex h-8 w-8 min-w-[2rem] items-center justify-center rounded-full text-xs font-semibold border
                    ${
                      isActive
                        ? 'bg-white text-gray-900 border-transparent'
                        : 'bg-gray-700 text-gray-200 border-gray-600'
                    }`}
                >
                  {item.short ?? item.label.charAt(0)}
                </span>

                {isSidebarOpen && (
                  <span className="whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setIsSidebarOpen((prev) => !prev)}
          className="p-4 bg-gray-900 text-center hover:bg-gray-700 text-xs font-medium border-t border-gray-700"
        >
          {isSidebarOpen ? 'Thu gọn' : 'Mở rộng'}
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-3 flex justify-between items-center z-10">
          <h1 className="font-bold text-gray-950 text-sm md:text-base">
            Khu vực chủ nhà
          </h1>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center"
            >
              <Image
                src="/bell.svg" // Đảm bảo bạn có file icon này trong public
                alt="Notification"
                width={24}
                height={24}
                className="w-6 h-6"
                onError={(e) => {
                  // Ẩn ảnh nếu lỗi
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Dot đỏ thông báo */}
              <span className="absolute top-1.5 right-2 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <div className="h-6 w-px bg-gray-300" />
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold leading-tight">Owner</p>
                <p className="text-xs text-gray-500 leading-tight">Chủ nhà</p>
              </div>

              <div className="relative w-10 h-10">
                <Image
                  src="/logo.png" // Đảm bảo bạn có file logo này
                  alt="Avatar"
                  fill
                  sizes="40px"
                  className="rounded-full object-cover border border-gray-200 bg-gray-200"
                />
              </div>
            </div>
          </div>
        </header>

        {/* CHILDREN */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50 relative">
          {children}
        </main>
      </div>
    </div>
  );
}
