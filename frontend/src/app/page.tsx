"use client";
<<<<<<< HEAD

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
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
=======

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // 1. Kiểm tra xem đã có thông tin đăng nhập chưa
    // Lưu ý: Cần check window để tránh lỗi server-side render
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("userRole");

    if (token && role) {
      // 2. Nếu ĐÃ đăng nhập -> Điều hướng vào Dashboard tương ứng
      if (role === "Owner") {
        router.push("/owner/dashboard");
      } else if (role === "Tenant") {
        router.push("/tenant/dashboard");
      } else {
        // Trường hợp role lạ (Admin hoặc lỗi) -> cứ cho về Login cho an toàn
        router.push("/public/login");
      }
    } else {
      // 3. Nếu CHƯA đăng nhập -> Đá về trang Login
      router.push("/public/login");
    }
  }, [router]);

  // Trong lúc chờ check, hiển thị màn hình chờ (Loading)
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner xoay xoay */}
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="text-gray-600 font-medium">Đang tải hệ thống...</p>
      </div>
    </div>
>>>>>>> origin/main
  );
}