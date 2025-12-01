import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-900 text-zinc-50 flex items-center justify-center">
      <div className="max-w-3xl w-full px-6 py-10">
        <h1 className="text-3xl font-bold mb-2">
          Intern Team 3 – Rental Management
        </h1>
        <p className="text-zinc-400 mb-8">
          Chọn khu vực để bắt đầu làm việc.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {/* Owner dashboard */}
          <Link
            href="/owner/dashboard"
            className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-6 hover:bg-zinc-800/80 transition flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold mb-2">Owner Dashboard</h2>
              <p className="text-sm text-zinc-400">
                Xem tổng quan tài sản, doanh thu và tình trạng phòng.
              </p>
            </div>
          </Link>

          {/* Tenant contracts CRUD */}
          <Link
            href="/owner/tenant-contracts"
            className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-6 hover:bg-zinc-800/80 transition flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold mb-2">Tenant Contracts</h2>
              <p className="text-sm text-zinc-400">
                Quản lý, tạo mới, chỉnh sửa & xóa hợp đồng thuê.
              </p>
            </div>
          </Link>

          {/* Tenant dashboard */}
          <Link
            href="/tenant/dashboard"
            className="rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-6 hover:bg-zinc-800/80 transition flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-semibold mb-2">Tenant Dashboard</h2>
              <p className="text-sm text-zinc-400">
                Giao diện cho người thuê xem hợp đồng & lịch sử thanh toán.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
