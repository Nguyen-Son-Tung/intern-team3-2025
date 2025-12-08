"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Wrench,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
} from "lucide-react";

// ================== TYPES ==================
type TicketStatus = "pending" | "processing" | "done";

type Ticket = {
  id: number;
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

type CurrentRoom = {
  id: number;
  name: string;
};

const PROPERTY_API_BASE_URL =
  process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:5018";

const TENANT_TICKETS_API = `${PROPERTY_API_BASE_URL}/api/v1/ticket/tenant`;
const TENANT_CREATE_TICKET_API = `${PROPERTY_API_BASE_URL}/api/v1/ticket`;

const FAKE_TICKETS: Ticket[] = [
  {
    id: 1,
    roomId: 1,
    roomName: "Phòng 101",
    title: "Máy lạnh không mát",
    description: "Máy lạnh chạy nhưng không mát, có tiếng ồn nhẹ.",
    status: "pending",
    createdAt: "2025-11-25T09:30:00",
  },
  {
    id: 2,
    roomId: 1,
    roomName: "Phòng 101",
    title: "Rò rỉ nước nhà vệ sinh",
    description: "Nước rò từ ống phía sau bồn cầu, sàn thường xuyên ướt.",
    status: "processing",
    createdAt: "2025-11-22T14:15:00",
  },
  {
    id: 3,
    roomId: 1,
    roomName: "Phòng 101",
    title: "Công tắc đèn bị chập",
    description: "Công tắc đèn phòng khách lúc bật được lúc không.",
    status: "done",
    createdAt: "2025-10-10T18:00:00",
  },
];

// ================== HELPERS ==================
function formatDateTime(value?: string | Date | null): string {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
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

// ================== PAGE COMPONENT ==================
export default function TenantTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [currentRoom, setCurrentRoom] = useState<CurrentRoom | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const [search, setSearch] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<"all" | TicketStatus>("all");

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [createForm, setCreateForm] = useState<{
    title: string;
    description: string;
  }>({
    title: "",
    description: "",
  });

  // =============== FETCH TICKETS (API + FALLBACK) ===============
  const fetchTicketsFromApi = async (): Promise<void> => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(TENANT_TICKETS_API, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // gửi cookie auth nếu có
      });

      if (!res.ok) {
        throw new Error(
          `Không thể tải danh sách yêu cầu sửa chữa (HTTP ${res.status})`
        );
      }

      const data = (await res.json()) as
        | {
            id: number;
            roomId: number;
            roomName: string;
            title: string;
            description?: string;
            status: TicketStatus;
            createdAt: string;
          }[]
        | undefined;

      if (!data || !Array.isArray(data)) {
        throw new Error("Dữ liệu trả về không hợp lệ.");
      }

      const mapped: Ticket[] = data.map((item) => ({
        id: item.id,
        roomId: item.roomId,
        roomName: item.roomName,
        title: item.title,
        description: item.description,
        status: item.status,
        createdAt: item.createdAt,
      }));

      setTickets(mapped);

      if (mapped.length > 0) {
        setCurrentRoom({
          id: mapped[0].roomId,
          name: mapped[0].roomName,
        });
      }
    } catch (err: unknown) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Đã xảy ra lỗi khi tải danh sách yêu cầu sửa chữa.";

      setError(message);

      // fallback: dùng dữ liệu ảo cho UI
      setTickets(FAKE_TICKETS);
      setCurrentRoom({
        id: FAKE_TICKETS[0].roomId,
        name: FAKE_TICKETS[0].roomName,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketsFromApi();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =============== SUMMARY (TỪ LIST TICKET) ===============
  const summary: TicketSummary = useMemo(() => {
    let pending = 0;
    let processing = 0;
    let done = 0;

    for (const t of tickets) {
      if (t.status === "pending") pending += 1;
      else if (t.status === "processing") processing += 1;
      else if (t.status === "done") done += 1;
    }

    return {
      total: tickets.length,
      pending,
      processing,
      done,
    };
  }, [tickets]);

  // =============== FILTER + SEARCH ===============
  const filteredTickets = useMemo<Ticket[]>(() => {
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
          t.roomName.toLowerCase().includes(lower)
        );
      });
    }

    data.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return data;
  }, [tickets, filterStatus, search]);

  // =============== CREATE TICKET (API + FALLBACK) ===============
  const handleCreateTicket = async (): Promise<void> => {
    try {
      if (!createForm.title.trim()) {
        alert("Vui lòng nhập tiêu đề yêu cầu.");
        return;
      }

      if (!currentRoom) {
        alert("Không xác định được phòng hiện tại của bạn.");
        return;
      }

      const payload = {
        roomId: currentRoom.id, // nếu backend không cần roomId thì có thể bỏ
        title: createForm.title.trim(),
        description: createForm.description.trim(),
      };

      const res = await fetch(TENANT_CREATE_TICKET_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error(`Không thể tạo yêu cầu (HTTP ${res.status})`);
      }

      // Option: dùng ticket trả về từ backend
      // const created = (await res.json()) as Ticket;
      // setTickets((prev) => [created, ...prev]);

      await fetchTicketsFromApi();

      setIsCreateModalOpen(false);
      setCreateForm({ title: "", description: "" });
    } catch (err: unknown) {
      console.error(err);

      // fallback: thêm vào list ảo để test UI
      const room: CurrentRoom =
        currentRoom ?? {
          id: FAKE_TICKETS[0].roomId,
          name: FAKE_TICKETS[0].roomName,
        };

      const fakeTicket: Ticket = {
        id: Date.now(),
        roomId: room.id,
        roomName: room.name,
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      setTickets((prev) => [fakeTicket, ...prev]);

      setIsCreateModalOpen(false);
      setCreateForm({ title: "", description: "" });

      alert(
        "Backend chưa phản hồi, đã thêm yêu cầu vào danh sách ảo để bạn xem giao diện."
      );
    }
  };

  // =============== RENDER JSX ===============
  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      {/* HEADER */}
      <div className="px-8 pt-6 pb-4 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-violet-100 text-violet-600">
            <Wrench className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Yêu cầu sửa chữa
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Gửi và theo dõi các yêu cầu sửa chữa cho phòng bạn đang thuê.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Phòng hiện tại:{" "}
              <span className="font-medium text-slate-800">
                {currentRoom ? currentRoom.name : "Đang xác định..."}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 px-8 py-6 space-y-4">
        {/* ERROR ALERT */}
        {error && (
          <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-2 text-sm text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {/* STATS + SEARCH + CREATE */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          {/* STATS */}
          <div className="flex flex-1 gap-4">
            <div className="flex-1 rounded-xl bg-white shadow-sm border border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">Tổng yêu cầu</p>
              <p className="mt-2 text-3xl font-semibold text-slate-800">
                {loading ? "…" : summary.total}
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-white shadow-sm border border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">Chờ xử lý</p>
              <p className="mt-2 text-3xl font-semibold text-amber-500">
                {loading ? "…" : summary.pending}
              </p>
            </div>
            <div className="flex-1 rounded-xl bg-white shadow-sm border border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">Đang xử lý</p>
              <p className="mt-2 text-3xl font-semibold text-sky-500">
                {loading ? "…" : summary.processing}
              </p>
            </div>
            <div className="hidden xl:block flex-1 rounded-xl bg-white shadow-sm border border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">Hoàn thành</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">
                {loading ? "…" : summary.done}
              </p>
            </div>
          </div>

          {/* SEARCH + FILTER + CREATE BUTTON */}
          <div className="flex flex-col gap-3 lg:w-96">
            <div className="relative">
              <Search className="absolute left-3.top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-0 focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                placeholder="Tìm theo tiêu đề, mô tả..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { key: "all" as const, label: "Tất cả" },
                { key: "pending" as const, label: "Chờ xử lý" },
                { key: "processing" as const, label: "Đang xử lý" },
                { key: "done" as const, label: "Hoàn thành" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setFilterStatus(item.key)}
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

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-violet-700"
            >
              <Plus className="h-4 w-4" />
              Gửi yêu cầu sửa chữa
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
              Đang tải danh sách yêu cầu...
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-slate-400">
              <AlertCircle className="mx-auto mb-2 h-6 w-6 text-slate-300" />
              Chưa có yêu cầu sửa chữa nào.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold text-slate-500">
                  <tr>
                    <th className="px-4 py-3 text-left">Mã</th>
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
                      <td className="px-4 py-3 text-sm text-slate-700">
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
                      <td className="px-4.py-3 text-xs text-slate-500">
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

      {/* MODAL CHI TIẾT TICKET */}
      {selectedTicket && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-lg border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h2 className="text-base font-semibold text-slate-900">
                Chi tiết yêu cầu #{selectedTicket.id}
              </h2>
              <button
                type="button"
                className="p-1 text-slate-500 hover:text-slate-700"
                onClick={() => setSelectedTicket(null)}
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">Phòng</p>
                  <p className="font-medium text-slate-800">
                    {selectedTicket.roomName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">Gửi lúc</p>
                  <p className="font-medium text-slate-800">
                    {formatDateTime(selectedTicket.createdAt)}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500">Tiêu đề</p>
                <p className="mt-1 font-medium text-slate-900">
                  {selectedTicket.title}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">Mô tả chi tiết</p>
                <p className="mt-1 text-slate-700 whitespace-pre-line">
                  {selectedTicket.description || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">Trạng thái</p>
                <StatusBadge status={selectedTicket.status} />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-3 border-t border-slate-200">
              <button
                type="button"
                className="rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                onClick={() => setSelectedTicket(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TẠO YÊU CẦU SỬA CHỮA */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-lg border border-slate-200">
            <div className="flex items-center justify-between border-b px-5 py-3">
              <h2 className="text-base font-semibold text-slate-900">
                Tạo yêu cầu sửa chữa
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-500 hover:text-slate-700"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4 text-sm">
              <div>
                <p className="text-xs text-slate-500 mb-1">Phòng</p>
                <p className="font-medium text-slate-800">
                  {currentRoom ? currentRoom.name : "Đang xác định..."}
                </p>
              </div>

              <div>
                <label className="text-sm text-slate-600">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  value={createForm.title}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                  placeholder="VD: Máy lạnh không mát"
                />
              </div>

              <div>
                <label className="text-sm text-slate-600">
                  Mô tả chi tiết
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="w-full border rounded-lg px-3 py-2 mt-1 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
                  rows={4}
                  placeholder="Mô tả rõ vấn đề, vị trí hỏng, thời điểm phát hiện..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-5 py-3 border-t">
              <button
                type="button"
                className="px-4 py-2 rounded-full border text-sm font-medium text-slate-600 hover:bg-slate-50"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-full bg-violet-600 text-white text-sm font-medium hover:bg-violet-700"
                onClick={handleCreateTicket}
              >
                Gửi yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
