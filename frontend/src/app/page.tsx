"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Dùng globalThis.window cho SonarLint + tránh lỗi SSR
    if (typeof globalThis.window === "undefined") return;

    const token = globalThis.window.localStorage.getItem("accessToken");
    const role = globalThis.window.localStorage.getItem("userRole");

    if (token && role) {
      if (role === "Owner") {
        router.push("/owner/dashboard");
      } else if (role === "Tenant") {
        router.push("/tenant/dashboard");
      } else {
        router.push("/public/login");
      }
    } else {
      router.push("/public/login");
    }
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-zinc-900 text-zinc-50">
      <div className="flex flex-col items-center gap-6">
        {/* Loader */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
        <p className="text-gray-300 font-medium">Đang tải hệ thống...</p>

        {/* 
          Giao diện chọn Dashboard chỉ hiển thị nếu redirect không chạy.
          Bình thường user sẽ chỉ thấy lướt qua màn này rất nhanh.
        */}

        <div className="max-w-3xl w-full px-6 py-10">
          <h1 className="text-3xl font-bold mb-2 text-center">
            Intern Team 3 – Rental Management
          </h1>
          <p className="text-zinc-400 mb-8 text-center">
            Chọn khu vực để bắt đầu làm việc.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              href="/owner/dashboard"
              className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-6 hover:bg-zinc-800/80 transition flex flex-col"
            >
              <h2 className="text-lg font-semibold mb-2">Owner Dashboard</h2>
              <p className="text-sm text-zinc-400">
                Xem tổng quan tài sản, doanh thu và tình trạng phòng.
              </p>
            </Link>

            <Link
              href="/owner/tenant-contracts"
              className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-6 hover:bg-zinc-800/80 transition flex flex-col"
            >
              <h2 className="text-lg font-semibold mb-2">Tenant Contracts</h2>
              <p className="text-sm text-zinc-400">
                Quản lý, tạo mới, chỉnh sửa & xóa hợp đồng thuê.
              </p>
            </Link>

            <Link
              href="/tenant/dashboard"
              className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-6 hover:bg-zinc-800/80 transition flex flex-col"
            >
              <h2 className="text-lg font-semibold mb-2">Tenant Dashboard</h2>
              <p className="text-sm text-zinc-400">
                Giao diện cho người thuê xem hợp đồng & lịch sử thanh toán.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
