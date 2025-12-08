"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Wrench,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";

type TicketStatus = "pending" | "processing" | "done";

type Ticket = {
  id: number;
  tenantId: number;
  tenantName: string;
  tenantPhone?: string;
  roomId: number;
  roomName: string;
  title: string;
  description?: string;
  status: TicketStatus;
  createdAt: string;
};

type TicketSummary = {
  total: number;
  pending: number;
  processing: number;
  done: number;
};

const PROPERTY_API_BASE_URL =
  process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:5018";

const OWNER_TICKET_SUMMARY_API = `${PROPERTY_API_BASE_URL}/api/v1/ticket/owner/summary`;

const FAKE_TICKETS: Ticket[] = [
  {
    id: 1,
    tenantId: 2,
    tenantName: "Nguyễn Văn A",
    tenantPhone: "0901 234 567",
    roomId: 1,
    roomName: "Phòng 101",
    title: "Hư máy lạnh",
    description: "Máy lạnh phát tiếng ồn lớn và không lạnh",
    status: "pending",
    createdAt: "2025-11-25T09:30:00",
  },
  {
    id: 2,
    tenantId: 2,
    tenantName: "Nguyễn Văn A",
    tenantPhone: "0901 234 567",
    roomId: 11,
    roomName: "Phòng 201",
    title: "Rò rỉ nước",
    description: "Ống nước dưới bồn rửa bị rò",
    status: "processing",
    createdAt: "2025-11-20T14:10:00",
  },
  {
    id: 3,
    tenantId: 3,
    tenantName: "Trần Thị B",
    tenantPhone: "0902 345 678",
    roomId: 21,
    roomName: "Căn hộ A1",
    title: "Hư công tắc đèn",
    description: "Công tắc chập chờn, lúc bật lúc không",
    status: "done",
    createdAt: "2025-10-10T18:00:00",
  },
];

function formatDateTime(value?: string | Date | null) {
  if (!value) return "-";
  const d = new Date(value);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: TicketStatus }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-3 py-0.5 text-xs font-medium text-amber-700">
        <Clock className="h-3 w-3" />
        Chờ xử lý
      </span>
    );
  }
  if (status === "processing") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-sky-100 bg-sky-50 px-3 py-0.5 text-xs font-medium text-sky-700">
        <Loader2 className="h-3 w-3 animate-spin" />
        Đang xử lý
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-0.5 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="h-3 w-3" />
      Hoàn thành
    </span>
  );
}

export default function OwnerTicketsPage() {
  const [tickets] = useState<Ticket[]>(FAKE_TICKETS); // tạm
  const [summary, setSummary] = useState<TicketSummary>({
    total: 0,
    pending: 0,
    processing: 0,
    done: 0,
  });
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [errorSummary, setErrorSummary] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] =
    useState<"all" | TicketStatus>("all");

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // ======================
  // CALL API SUMMARY OWNER
  // ======================
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoadingSummary(true);
        setErrorSummary("");

        const res = await fetch(OWNER_TICKET_SUMMARY_API, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // nếu auth cookie
        });

        if (!res.ok) {
          throw new Error(
            `Không thể tải thống kê ticket (HTTP ${res.status})`
          );
        }

        const data = await res.json();

        setSummary({
          total: data.total ?? 0,
          pending: data.pending ?? 0,
          processing: data.processing ?? 0,
          done: data.done ?? 0,
        });
      } catch (err) {
        console.error(err);

        const message =
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi khi tải thống kê ticket.";

        setErrorSummary(message);
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, []);

  // Filter + search cho fake list
  const filteredTickets = useMemo(() => {
    let data = [...tickets];

    if (filterStatus !== "all") {
      data = data.filter((t) => t.status === filterStatus);
    }

    if (search.trim()) {
      const lower = search.toLowerCase();
      data = data.filter((t) => {
        return (
          t.title.toLowerCase().includes(lower) ||
          (t.description || "").toLowerCase().includes(lower) ||
          t.roomName.toLowerCase().includes(lower) ||
          t.tenantName.toLowerCase().includes(lower)
        );
      });
    }

    data.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return data;
  }, [tickets, filterStatus, search]);

  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Quản lý yêu cầu sửa chữa
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Theo dõi yêu cầu sửa chữa của tất cả tenant trong tòa nhà.
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-6 space-y-4">
        {/* Error summary */}
        {errorSummary && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{errorSummary}</span>
          </div>
        )}

        {/* Stats + Search */}
        <div className="grid gap-4 lg:grid-cols-[2fr,3fr]">
          {/* Stats */}
          <div className="flex gap-4">
            <div className="flex-1 rounded-xl bg-white shadow-sm border border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">Tổng ticket</p>
              <p className="mt-2 text-3xl font-semibold text-slate-800">
                {loadingSummary ? "…" : summary.total}
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-white shadow-sm border border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">Chờ xử lý</p>
              <p className="mt-2 text-3xl font-semibold text-amber-500">
                {loadingSummary ? "…" : summary.pending}
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-white shadow-sm border border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">Đang xử lý</p>
              <p className="mt-2 text-3xl font-semibold text-sky-500">
                {loadingSummary ? "…" : summary.processing}
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-white shadow-sm border border-slate-200 px-5 py-4 hidden xl:block">
              <p className="text-sm text-slate-500">Hoàn thành</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">
                {loadingSummary ? "…" : summary.done}
              </p>
            </div>
          </div>

          {/* Search + filter status */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-0 focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                placeholder="Tìm theo tenant, phòng, tiêu đề, mô tả..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "all", label: "Tất cả" },
                { key: "pending", label: "Chờ xử lý" },
                { key: "processing", label: "Đang xử lý" },
                { key: "done", label: "Hoàn thành" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    setFilterStatus(item.key as "all" | TicketStatus)
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                    filterStatus === item.key
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bảng ticket (fake) */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          {filteredTickets.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">
              <AlertCircle className="mx-auto mb-2 h-6 w-6 text-slate-300" />
              Không có ticket nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Mã</th>
                    <th className="px-4 py-3 text-left">Tenant</th>
                    <th className="px-4 py-3 text-left">Phòng</th>
                    <th className="px-4 py-3 text-left">Tiêu đề</th>
                    <th className="px-4 py-3 text-left">Ngày gửi</th>
                    <th className="px-4 py-3 text-left">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-4 py-3 text-xs text-slate-500">
                        #{ticket.id}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">
                            {ticket.tenantName}
                          </span>
                          {ticket.tenantPhone && (
                            <span className="text-xs text-slate-400">
                              {ticket.tenantPhone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {ticket.roomName}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="line-clamp-2">
                          <span className="font-medium text-slate-800">
                            {ticket.title}
                          </span>
                          {ticket.description && (
                            <span className="block text-xs text-slate-500 mt-0.5">
                              {ticket.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDateTime(ticket.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedTicket(ticket)}
                          className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal chi tiết ticket (CSS mới, gọn hơn) */}
      {selectedTicket && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg border border-slate-200 overflow-hidden">
            {/* Header modal */}
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3 bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-700">
                  <Wrench className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Chi tiết yêu cầu #{selectedTicket.id}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Gửi lúc {formatDateTime(selectedTicket.createdAt)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500"
                onClick={() => setSelectedTicket(null)}
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            {/* Nội dung modal */}
            <div className="px-5 py-4 space-y-4 text-sm">
              {/* Tenant + phòng + trạng thái */}
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-medium uppercase text-slate-500 tracking-wide">
                    Tenant
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedTicket.tenantName}
                  </p>
                  {selectedTicket.tenantPhone && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {selectedTicket.tenantPhone}
                    </p>
                  )}
                </div>

                <div className="rounded-lg bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-medium uppercase text-slate-500 tracking-wide">
                    Phòng
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {selectedTicket.roomName}
                  </p>
                </div>

                <div className="rounded-lg bg-slate-50 px-3 py-2 flex flex-col justify-between">
                  <p className="text-[11px] font-medium uppercase text-slate-500 tracking-wide mb-1">
                    Trạng thái
                  </p>
                  <StatusBadge status={selectedTicket.status} />
                </div>
              </div>

              {/* Tiêu đề */}
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase text-slate-500 tracking-wide">
                  Tiêu đề
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedTicket.title}
                </p>
              </div>

              {/* Mô tả chi tiết */}
              <div className="space-y-1">
                <p className="text-[11px] font-medium uppercase text-slate-500 tracking-wide">
                  Mô tả chi tiết
                </p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 max-h-48 overflow-y-auto">
                  <p className="text-sm text-slate-700 whitespace-pre-line">
                    {selectedTicket.description || "Không có mô tả thêm."}
                  </p>
                </div>
              </div>
            </div>

            {/* Footer modal */}
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
                onClick={() => setSelectedTicket(null)}
              >
                Đóng
              </button>
              {/* Chỗ này sau này bạn có thể thêm nút Đổi trạng thái, Gán nhân viên... */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
