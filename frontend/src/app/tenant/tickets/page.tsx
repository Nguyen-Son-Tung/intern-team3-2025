<<<<<<< HEAD
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

// Raw DTO từ API
type TicketApiDto = {
  id?: number;
  roomId?: number;
  roomName?: string;
  title?: string;
  description?: string;
  status?: string;
  createdAt?: string;
};

const PROPERTY_API_BASE_URL =
  process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:5018";

const TENANT_TICKETS_API = `${PROPERTY_API_BASE_URL}/api/v1/ticket/tenant`;
const TENANT_CREATE_TICKET_API = `${PROPERTY_API_BASE_URL}/api/v1/ticket`;

// Dữ liệu fake fallback
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
        // nếu bị 401 thì redirect về login (nếu bạn dùng /public/login)
        if (res.status === 401 && typeof window !== "undefined") {
          window.location.href = "/public/login";
        }
        throw new Error(
          `Không thể tải danh sách yêu cầu sửa chữa (HTTP ${res.status})`
        );
      }

      const data = (await res.json()) as TicketApiDto[] | undefined;

      if (!data || !Array.isArray(data)) {
        throw new Error("Dữ liệu trả về không hợp lệ.");
      }

      const mapped: Ticket[] = data.map((item, index) => {
        const status =
          (item.status as TicketStatus) && ["pending", "processing", "done"].includes(
            item.status as TicketStatus
          )
            ? (item.status as TicketStatus)
            : "pending";

        return {
          id: item.id ?? index + 1,
          roomId: item.roomId ?? 0,
          roomName: item.roomName ?? "Không rõ phòng",
          title: item.title ?? "",
          description: item.description ?? "",
          status,
          createdAt: item.createdAt ?? new Date().toISOString(),
        };
      });

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
=======
'use client';

import { useState, useEffect } from 'react';
import { ticketService } from "@/services/ticketService";
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import TicketDetailModal from '@/components/ticket/TicketDetailModal';
import { Ticket } from '@/types/ticket';

const statusLabels = {
  0: 'Chờ xử lý',
  1: 'Đang xử lý',
  2: 'Hoàn thành'
};

const statusColors = {
  0: 'bg-yellow-100 text-yellow-800',
  1: 'bg-blue-100 text-blue-800',
  2: 'bg-green-100 text-green-800'
};

// Validation limits
const TITLE_MAX_LENGTH = 100;
const DESCRIPTION_MAX_LENGTH = 500;

export default function TenantTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ title: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ title?: string; description?: string }>({});

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const data = await ticketService.getMyTickets();
      setTickets(data);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
>>>>>>> origin/main
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  useEffect(() => {
    fetchTicketsFromApi();
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
        // xử lý 401 nếu cần
        if (res.status === 401 && typeof window !== "undefined") {
          window.location.href = "/public/login";
        }
        throw new Error(`Không thể tạo yêu cầu (HTTP ${res.status})`);
      }

      // Nếu backend trả ticket đã tạo, bạn có thể xài:
      // const created = (await res.json()) as TicketApiDto;
      // map sang Ticket rồi setTickets((prev) => [mapped, ...prev]);
      // Ở đây mình gọi lại fetch để sync chắc ăn:
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
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
=======
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await ticketService.create(createForm);
      setCreateForm({ title: '', description: '' });
      setIsCreateDialogOpen(false);
      setValidationErrors({});
      fetchTickets(); // Refresh the list
    } catch (error) {
      console.error('Error creating ticket:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async (ticketId: number) => {
    try {
      await ticketService.close(ticketId);
      fetchTickets(); // Refresh the list
    } catch (error) {
      console.error('Error closing ticket:', error);
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsDetailModalOpen(true);
  };

  const validateForm = () => {
    const errors: { title?: string; description?: string } = {};

    if (!createForm.title.trim()) {
      errors.title = 'Tiêu đề không được để trống';
    } else if (createForm.title.length > TITLE_MAX_LENGTH) {
      errors.title = `Tiêu đề không được vượt quá ${TITLE_MAX_LENGTH} ký tự`;
    }

    if (!createForm.description.trim()) {
      errors.description = 'Mô tả không được để trống';
    } else if (createForm.description.length > DESCRIPTION_MAX_LENGTH) {
      errors.description = `Mô tả không được vượt quá ${DESCRIPTION_MAX_LENGTH} ký tự`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: 'title' | 'description', value: string) => {
    // Enforce max length
    const maxLength = field === 'title' ? TITLE_MAX_LENGTH : DESCRIPTION_MAX_LENGTH;
    const truncatedValue = value.slice(0, maxLength);

    setCreateForm(prev => ({ ...prev, [field]: truncatedValue }));

    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const formatDate = (dateString: string) => {
    // Check if it's the default DateTime value from C# (0001-01-01)
    const date = new Date(dateString);
    if (date.getFullYear() === 1 && date.getMonth() === 0 && date.getDate() === 1) {
      return '';
    }
    return date.toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Quản lý yêu cầu</h2>
            <p className="text-gray-500 text-sm">Xem và tạo yêu cầu hỗ trợ</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="p-4 border-b">Tiêu đề</th>
                  <th className="p-4 border-b">Trạng thái</th>
                  <th className="p-4 border-b">Ngày tạo</th>
                  <th className="p-4 border-b text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-6 bg-gray-200 rounded-full animate-pulse w-20"></div>
                    </td>
                    <td className="p-4">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="h-8 bg-gray-200 rounded animate-pulse w-24 mx-auto"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Quản lý yêu cầu</h2>
          <p className="text-gray-500 text-sm">Xem và tạo yêu cầu hỗ trợ</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Tạo yêu cầu mới</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tạo yêu cầu mới</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <Label htmlFor="title">Tiêu đề</Label>
                <Input
                  id="title"
                  value={createForm.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('title', e.target.value)}
                  required
                  maxLength={TITLE_MAX_LENGTH}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span className={validationErrors.title ? 'text-red-500' : ''}>
                    {validationErrors.title}
                  </span>
                  <span>{createForm.title.length}/{TITLE_MAX_LENGTH}</span>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={createForm.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
                  required
                  maxLength={DESCRIPTION_MAX_LENGTH}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span className={validationErrors.description ? 'text-red-500' : ''}>
                    {validationErrors.description}
                  </span>
                  <span>{createForm.description.length}/{DESCRIPTION_MAX_LENGTH}</span>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Đang tạo...' : 'Tạo yêu cầu'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              Chưa có yêu cầu nào.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 text-gray-600 uppercase text-xs">
                  <TableHead className="p-4 border-b">Tiêu đề</TableHead>
                  <TableHead className="p-4 border-b">Trạng thái</TableHead>
                  <TableHead className="p-4 border-b">Ngày tạo</TableHead>
                  <TableHead className="p-4 border-b text-center">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-sm">
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="border-b last:border-0 cursor-pointer hover:bg-gray-50"
                    onClick={() => handleTicketClick(ticket)}
                  >
                    <TableCell className="p-4 font-medium">{ticket.title}</TableCell>
                    <TableCell className="p-4">
                      <Badge className={statusColors[ticket.status as keyof typeof statusColors]}>
                        {statusLabels[ticket.status as keyof typeof statusLabels]}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-4">{formatDate(ticket.createdAt)}</TableCell>
                    <TableCell className="p-4 text-center">
                      {ticket.status !== 2 && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseTicket(ticket.id);
                          }}
                          variant="outline"
                        >
                          Đóng yêu cầu
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
>>>>>>> origin/main
          )}
        </div>
      </div>

<<<<<<< HEAD
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
=======
      <TicketDetailModal
        ticket={selectedTicket}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        onCloseTicket={handleCloseTicket}
      />
>>>>>>> origin/main
    </div>
  );
}
