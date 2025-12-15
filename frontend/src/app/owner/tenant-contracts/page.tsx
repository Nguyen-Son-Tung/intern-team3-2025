"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Pencil,
  X,
  CalendarDays,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* =============================
   CONFIG API
============================= */
function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
}

const PROPERTY_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:5018"
);

const AA_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_AA_API_URL || "http://localhost:5286"
);

const SERVICE_API_KEY = process.env.NEXT_PUBLIC_USERS_SERVICE_API_KEY || "";

/* =============================
   API ROUTES
============================= */
const API_URLS = {
  TENANTS_BY_OWNER: (ownerId: string) =>
    `${AA_API_BASE_URL}/api/Users/owner/${ownerId}/tenants`,

  CONTRACTS_LIST: `${PROPERTY_API_BASE_URL}/api/Contracts/list-contracts`,
  CONTRACTS_CREATE: `${PROPERTY_API_BASE_URL}/api/Contracts`,
  CONTRACTS_UPDATE: (id: number) => `${PROPERTY_API_BASE_URL}/api/Contracts/${id}`,
  CONTRACTS_DELETE: (id: number) => `${PROPERTY_API_BASE_URL}/api/Contracts/${id}`,

  HOUSES: `${PROPERTY_API_BASE_URL}/api/houses`,
  ROOMS_BY_HOUSE: (houseId: number) =>
    `${PROPERTY_API_BASE_URL}/api/houses/${houseId}/rooms`,
};

/* =============================
   TYPES
============================= */
type ContractStatus = "active" | "ended" | "expired" | "terminated" | "pending";

type Tenant = {
  id: string; // ✅ ID thật (GUID/string) để Contracts service verify
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
};

type TenantApiDto = {
  id?: string;
  Id?: string;

  // ✅ nhiều service trả userId là id thật
  userId?: string;
  UserId?: string;

  tenantId?: string;
  TenantId?: string;

  fullName?: string;
  FullName?: string;
  email?: string;
  Email?: string;
  phoneNumber?: string;
  phone?: string;

  createdAt?: string | null;
  createdDate?: string | null;
  registrationDate?: string | null;
};

type ContractApiDto = {
  // camelCase
  id?: number;
  roomId?: number;
  tenantId?: string;
  startDate?: string;
  endDate?: string | null;
  price?: number;
  status?: unknown;
  fileUrl?: string | null;
  createdAt?: string | null;

  // PascalCase
  Id?: number;
  RoomId?: number;
  TenantId?: string;
  StartDate?: string;
  EndDate?: string | null;
  Price?: number;
  Status?: unknown;
  FileUrl?: string | null;
  CreatedAt?: string | null;
};

type Contract = {
  id: number;
  roomId: number;
  tenantId: string;
  tenantName?: string;
  startDate: string;
  endDate?: string | null;
  price: number;
  status: ContractStatus;
  fileUrl?: string | null;
  createdAt?: string | null;
};

type House = {
  id: number;
  name: string;
};

type HouseApiDto = {
  id?: number;
  name?: string;
};

type Room = {
  id: number;
  houseId: number;
  houseName?: string;
  name: string;
  floor: number;
  status: string;
};

type RoomApiDto = {
  id?: number;
  houseId?: number;
  name?: string;
  floor?: number;
  status?: string;
};

type ContractForm = {
  tenantId: string;
  roomId: number | "";
  startDate: string;
  endDate: string;
  price: string;
  status: ContractStatus;
  fileUrl: string;
};

/* =============================
   UI CONSTANTS
============================= */
const UI = {
  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60 transition-colors",
  btnDanger:
    "inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 transition-colors",
  btnOutline:
    "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors",
  input:
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-900 text-sm font-medium outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-400",
  label: "mb-1.5 block text-sm font-bold uppercase tracking-wide text-slate-800",
};

/* =============================
   HEADERS & HELPERS
============================= */
function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

// ✅ FIX: User Service đang đòi auth → gửi cả Bearer + X-Service-Api-Key
function getAAServiceHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (SERVICE_API_KEY) headers["X-Service-Api-Key"] = SERVICE_API_KEY;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  return headers;
}

function redirectLoginIfAuthFail(status: number) {
  if (typeof window === "undefined") return;
  if (status === 401 || status === 403) window.location.href = "/public/login";
}

async function safeReadJson<T = unknown>(
  res: Response
): Promise<{ ok: true; data: T } | { ok: false; text: string }> {
  const text = await res.text().catch(() => "");
  try {
    const data = JSON.parse(text) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, text };
  }
}

function extractArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object") {
    const maybeData = (value as Record<string, unknown>)["data"];
    if (Array.isArray(maybeData)) return maybeData as T[];
  }
  return [];
}

/* =============================
   STATUS LOGIC
============================= */
function normalizeStatus(raw: unknown): ContractStatus {
  if (typeof raw === "number") {
    const map: Record<number, ContractStatus> = {
      0: "pending",
      1: "active",
      2: "ended",
      3: "expired",
      4: "terminated",
    };
    return map[raw] ?? "active";
  }

  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    if (s === "active") return "active";
    if (s === "ended") return "ended";
    if (s === "expired" || s === "expire") return "expired";
    if (s === "terminated" || s === "terminate") return "terminated";
    if (s === "pending") return "pending";
    return "active";
  }

  return "active";
}

function computeStatusFromDates(
  startDateStr: string,
  endDateStr?: string | null,
  original: ContractStatus = "active"
): ContractStatus {
  if (original === "terminated") return "terminated";

  const now = new Date();
  const start = new Date(startDateStr);
  if (Number.isNaN(start.getTime())) return original;

  let end: Date | null = null;
  if (endDateStr) {
    const e = new Date(endDateStr);
    end = Number.isNaN(e.getTime()) ? null : e;
  }

  if (now < start) return "pending";
  if (end) return now > end ? "ended" : "active";
  return "active";
}

function statusBadge(status: ContractStatus) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
        HIỆU LỰC
      </span>
    );
  }
  if (status === "ended" || status === "expired") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 border border-slate-300">
        <span className="h-1.5 w-1.5 rounded-full bg-slate-500"></span>
        KẾT THÚC
      </span>
    );
  }
  if (status === "terminated") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800 border border-red-200">
        <span className="h-1.5 w-1.5 rounded-full bg-red-600"></span>
        ĐÃ HUỶ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-200">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-600"></span>
      CHỜ HIỆU LỰC
    </span>
  );
}

function toBackendStatusNumber(status: ContractStatus): number {
  const map: Record<ContractStatus, number> = {
    pending: 0,
    active: 1,
    ended: 2,
    expired: 3,
    terminated: 4,
  };
  return map[status];
}

/* =============================
   DATA FETCHING FUNCTIONS
============================= */
async function fetchTenants(): Promise<Tenant[]> {
  const ownerId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;
  if (!ownerId) return [];

  const res = await fetch(API_URLS.TENANTS_BY_OWNER(ownerId), {
    method: "GET",
    headers: getAAServiceHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    // ✅ đúng flow: unauthorized thì đá login
    redirectLoginIfAuthFail(res.status);
    const t = await res.text().catch(() => "");
    console.error("fetchTenants failed:", res.status, t);
    return [];
  }

  const parsed = await safeReadJson<unknown>(res);
  if (!parsed.ok) {
    console.error("fetchTenants non-json:", parsed.text);
    return [];
  }

  const data = extractArray<TenantApiDto>(parsed.data);

  // ✅ CHỈ GIỮ TENANT CÓ ID THẬT (ưu tiên userId/tenantId)
  return data
    .map((t): Tenant => {
      const realId = String(
        t.userId ?? t.UserId ?? t.tenantId ?? t.TenantId ?? t.id ?? t.Id ?? ""
      ).trim();

      return {
        id: realId,
        fullName: t.fullName ?? t.FullName ?? "Khách thuê",
        email: t.email ?? t.Email ?? "",
        phoneNumber: t.phoneNumber ?? t.phone ?? "",
        createdAt: t.createdAt ?? t.createdDate ?? t.registrationDate ?? "",
      };
    })
    .filter((t) => t.id !== "");
}

async function fetchHouses(): Promise<House[]> {
  const res = await fetch(API_URLS.HOUSES, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    redirectLoginIfAuthFail(res.status);
    return [];
  }
  const parsed = await safeReadJson<unknown>(res);
  if (!parsed.ok) return [];
  const rawArr = extractArray<HouseApiDto>(parsed.data);
  return rawArr.map((h, i): House => ({
    id: typeof h.id === "number" ? h.id : i + 1,
    name: h.name ?? `Nhà #${i + 1}`,
  }));
}

async function fetchRoomsByHouse(house: House): Promise<Room[]> {
  const res = await fetch(API_URLS.ROOMS_BY_HOUSE(house.id), {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    redirectLoginIfAuthFail(res.status);
    return [];
  }
  const parsed = await safeReadJson<unknown>(res);
  if (!parsed.ok) return [];
  const rawArr = extractArray<RoomApiDto>(parsed.data);
  return rawArr.map((r, idx): Room => ({
    id: typeof r.id === "number" ? r.id : idx + 1,
    houseId: typeof r.houseId === "number" ? r.houseId : house.id,
    houseName: house.name,
    name: r.name ?? `Phòng #${idx + 1}`,
    floor: typeof r.floor === "number" ? r.floor : 0,
    status: r.status ?? "",
  }));
}

async function fetchAllRooms(): Promise<Room[]> {
  const houses = await fetchHouses();
  if (houses.length === 0) return [];
  const lists = await Promise.all(houses.map((h) => fetchRoomsByHouse(h)));
  return lists.flat();
}

async function fetchContracts(): Promise<Contract[]> {
  const res = await fetch(API_URLS.CONTRACTS_LIST, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    redirectLoginIfAuthFail(res.status);
    throw new Error(`Contracts API failed: ${res.status}`);
  }
  const parsed = await safeReadJson<unknown>(res);
  if (!parsed.ok) throw new Error("Contracts returned non-JSON");

  const rawData = extractArray<ContractApiDto>(parsed.data);
  return rawData.map((c, index): Contract => {
    const id =
      typeof c.id === "number" ? c.id : typeof c.Id === "number" ? c.Id : index + 1;

    const roomId =
      typeof c.roomId === "number"
        ? c.roomId
        : typeof c.RoomId === "number"
        ? c.RoomId
        : 0;

    const tenantId = String(c.tenantId ?? c.TenantId ?? "").trim();
    const startDate = c.startDate ?? c.StartDate ?? "";
    const endDate = (c.endDate ?? c.EndDate ?? null) as string | null;

    const priceRaw = (c.price ?? c.Price ?? 0) as unknown;
    const price = typeof priceRaw === "number" ? priceRaw : Number(priceRaw) || 0;

    const serverStatus = c.status ?? c.Status;
    const normalized = normalizeStatus(serverStatus);

    const shouldCompute =
      serverStatus === null ||
      serverStatus === undefined ||
      (typeof serverStatus === "string" && serverStatus.trim() === "");

    const finalStatus = shouldCompute
      ? computeStatusFromDates(startDate, endDate, normalized)
      : normalized;

    return {
      id,
      roomId,
      tenantId,
      startDate,
      endDate,
      price,
      status: finalStatus,
      fileUrl: (c.fileUrl ?? c.FileUrl ?? null) as string | null,
      createdAt: (c.createdAt ?? c.CreatedAt ?? null) as string | null,
    };
  });
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("vi-VN");
}

function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "0 đ";
  return value.toLocaleString("vi-VN") + " đ";
}

/* =============================
   MAIN COMPONENT
============================= */
export default function TenantContractsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<ContractForm>({
    tenantId: "",
    roomId: "",
    startDate: "",
    endDate: "",
    price: "",
    status: "active",
    fileUrl: "",
  });

  // Load Data
  useEffect(() => {
    let alive = true;
    const run = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [tenantsFromApi, contractsFromApi, roomsFromApi] = await Promise.all([
          fetchTenants(),
          fetchContracts(),
          fetchAllRooms(),
        ]);

        if (!alive) return;

        const tenantMap = new Map(tenantsFromApi.map((t) => [t.id.trim(), t]));
        const contractsWithTenantName = contractsFromApi.map((c) => ({
          ...c,
          tenantName: tenantMap.get(String(c.tenantId).trim())?.fullName ?? "",
        }));

        setTenants(tenantsFromApi);
        setContracts(contractsWithTenantName);
        setRooms(roomsFromApi);
      } catch (err) {
        console.error(err);
        if (alive) setErrorMessage("Không thể tải dữ liệu từ server.");
      } finally {
        if (alive) setIsLoading(false);
      }
    };
    run();
    return () => {
      alive = false;
    };
  }, []);

  // Filter & Pagination
  const filteredContracts = useMemo(() => {
    let data = [...contracts];
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter((c) => {
        const tenantName = (c.tenantName ?? "").toLowerCase();
        const tenantId = (c.tenantId ?? "").toLowerCase();
        const room = rooms.find((r) => r.id === c.roomId);
        const roomName = (room?.name ?? "").toLowerCase();
        const houseName = (room?.houseName ?? "").toLowerCase();
        return (
          tenantName.includes(term) ||
          tenantId.includes(term) ||
          roomName.includes(term) ||
          houseName.includes(term)
        );
      });
    }
    data.sort((a, b) => {
      const da = new Date(a.startDate).getTime();
      const db = new Date(b.startDate).getTime();
      return (Number.isNaN(db) ? 0 : db) - (Number.isNaN(da) ? 0 : da);
    });
    return data;
  }, [contracts, searchTerm, rooms]);

  const totalItems = filteredContracts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * PAGE_SIZE;
  const pagedContracts = filteredContracts.slice(startIndex, startIndex + PAGE_SIZE);

  const handleChangePage = (direction: "prev" | "next") => {
    setCurrentPage((prev) => {
      if (direction === "prev") return Math.max(1, prev - 1);
      return Math.min(totalPages, prev + 1);
    });
  };

  const refreshContracts = async (tenantsSnapshot: Tenant[]) => {
    const updated = await fetchContracts();
    const tenantMap = new Map(tenantsSnapshot.map((t) => [t.id.trim(), t]));
    setContracts(
      updated.map((c) => ({
        ...c,
        tenantName: tenantMap.get(String(c.tenantId).trim())?.fullName ?? "",
      }))
    );
  };

  // Handlers
  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({
      tenantId: "",
      roomId: "",
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      price: "",
      status: "active",
      fileUrl: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (contract: Contract) => {
    setIsEditing(true);
    setEditingId(contract.id);
    setForm({
      tenantId: String(contract.tenantId).trim(),
      roomId: contract.roomId,
      startDate: contract.startDate?.split("T")[0] ?? contract.startDate,
      endDate: (contract.endDate ?? "").split("T")[0] || "",
      price: String(contract.price ?? 0),
      status: contract.status ?? "active",
      fileUrl: contract.fileUrl ?? "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.tenantId || !form.startDate) {
      alert("Vui lòng chọn đầy đủ: Khách thuê và Ngày bắt đầu.");
      return;
    }

    // ✅ chặn cứng roomId
    if (!form.roomId || Number(form.roomId) <= 0) {
      alert("Vui lòng chọn phòng hợp lệ.");
      return;
    }

    const priceNum = Number(String(form.price).replaceAll(",", "").trim());
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      alert("Giá thuê phải là số và lớn hơn 0");
      return;
    }

    setIsSubmitting(true);
    try {
      const url =
        isEditing && editingId !== null
          ? API_URLS.CONTRACTS_UPDATE(editingId)
          : API_URLS.CONTRACTS_CREATE;

      const method = isEditing ? "PUT" : "POST";

      const tenantIdTrim = String(form.tenantId).trim();
      const roomIdNum = Number(form.roomId);

      // ✅ gửi camelCase + PascalCase
      const payload = {
        tenantId: tenantIdTrim,
        roomId: roomIdNum,
        startDate: form.startDate,
        endDate: form.endDate || null,
        price: priceNum,
        status: toBackendStatusNumber(form.status),
        fileUrl: form.fileUrl?.trim() || null,

        TenantId: tenantIdTrim,
        RoomId: roomIdNum,
        StartDate: form.startDate,
        EndDate: form.endDate || null,
        Price: priceNum,
        Status: toBackendStatusNumber(form.status),
        FileUrl: form.fileUrl?.trim() || null,
      };

      console.log("Submitting payload:", payload);

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        redirectLoginIfAuthFail(res.status);
        const errorText = await res.text();
        console.error("API Error:", errorText);
        try {
          const errJson = JSON.parse(errorText);
          alert(`Lỗi: ${errJson.message || errJson.title || "Thao tác thất bại"}`);
        } catch {
          alert(`Lỗi server (${res.status}). Vui lòng kiểm tra console.`);
        }
        return;
      }

      alert(isEditing ? "Cập nhật thành công!" : "Tạo hợp đồng thành công!");
      await refreshContracts(tenants);
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Lỗi hệ thống hoặc mất kết nối.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (contract: Contract) => {
    if (!window.confirm("Bạn có chắc muốn xóa hợp đồng này?")) return;
    try {
      const res = await fetch(API_URLS.CONTRACTS_DELETE(contract.id), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        redirectLoginIfAuthFail(res.status);
        alert("Xóa thất bại.");
        return;
      }
      alert("Đã xóa hợp đồng.");
      setContracts((prev) => prev.filter((c) => c.id !== contract.id));
    } catch (error) {
      console.error(error);
      alert("Lỗi khi xóa.");
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans text-slate-900">
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-md text-white">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Quản lý Hợp đồng</h1>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 shadow-sm transition-all"
              placeholder="Tìm theo nhà, phòng, tên khách..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <button type="button" onClick={openCreateModal} className={UI.btnPrimary}>
            <Plus className="h-5 w-5" />
            Thêm mới
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="rounded-lg bg-sky-50 border border-sky-200 px-4 py-3 text-sm font-medium text-sky-800 flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-sky-600 border-t-transparent"></div>
          Đang tải dữ liệu...
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm font-medium text-amber-800">
          {errorMessage}
        </div>
      )}

      {/* TABLE */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="max-h-[600px] overflow-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-100 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-5 py-3.5 font-bold text-slate-800 uppercase tracking-wider whitespace-nowrap">
                  STT
                </th>
                <th className="px-5 py-3.5 font-bold text-slate-800 uppercase tracking-wider">
                  Nhà / Phòng
                </th>
                <th className="px-5 py-3.5 font-bold text-slate-800 uppercase tracking-wider">
                  Khách thuê
                </th>
                <th className="px-5 py-3.5 font-bold text-slate-800 uppercase tracking-wider whitespace-nowrap">
                  Ngày Bắt Đầu
                </th>
                <th className="px-5 py-3.5 font-bold text-slate-800 uppercase tracking-wider whitespace-nowrap">
                  Ngày Kết Thúc
                </th>
                <th className="px-5 py-3.5 font-bold text-slate-800 uppercase tracking-wider whitespace-nowrap">
                  Giá Thuê
                </th>
                <th className="px-5 py-3.5 font-bold text-slate-800 uppercase tracking-wider">
                  Trạng Thái
                </th>
                <th className="px-5 py-3.5 text-right font-bold text-slate-800 uppercase tracking-wider">
                  Thao Tác
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {pagedContracts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500 font-medium">
                    Không tìm thấy hợp đồng nào phù hợp.
                  </td>
                </tr>
              ) : (
                pagedContracts.map((c, idx) => {
                  const tenant = tenants.find((t) => t.id === String(c.tenantId).trim());
                  const room = rooms.find((r) => r.id === c.roomId);
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-indigo-50/50 transition-colors duration-150"
                    >
                      <td className="px-5 py-4 text-slate-900 font-semibold">
                        {startIndex + idx + 1}
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-indigo-900">
                          {room?.houseName ? `${room.houseName}` : "—"}
                        </div>
                        <div className="text-xs font-semibold text-slate-600 mt-0.5">
                          {room?.name ?? `ID: ${c.roomId}`}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">
                          {tenant?.fullName ?? c.tenantName ?? c.tenantId}
                        </div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">
                          {tenant?.phoneNumber ?? "—"}
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-800 font-medium whitespace-nowrap">
                        {formatDate(c.startDate)}
                      </td>
                      <td className="px-5 py-4 text-slate-800 font-medium whitespace-nowrap">
                        {formatDate(c.endDate)}
                      </td>
                      <td className="px-5 py-4 text-slate-900 font-bold whitespace-nowrap">
                        {formatPrice(c.price)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">{statusBadge(c.status)}</td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Sửa"
                          >
                            <Pencil className="h-5 w-5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700">
            <div>
              Hiển thị{" "}
              <span className="font-bold text-slate-900">
                {startIndex + 1} - {Math.min(startIndex + PAGE_SIZE, totalItems)}
              </span>{" "}
              trên tổng số{" "}
              <span className="font-bold text-slate-900">{totalItems}</span> hợp đồng
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleChangePage("prev")}
                disabled={currentPageSafe === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <span className="px-2 font-bold text-slate-800">
                Trang {currentPageSafe} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => handleChangePage("next")}
                disabled={currentPageSafe === totalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg text-indigo-600">
                  {isEditing ? <Pencil className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </div>
                {isEditing ? "CHỈNH SỬA HỢP ĐỒNG" : "THÊM HỢP ĐỒNG MỚI"}
              </h2>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-slate-100 p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors"
                disabled={isSubmitting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className={UI.label}>Khách thuê</label>
                  <select
                    className={UI.input}
                    value={form.tenantId}
                    onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                    disabled={isEditing}
                  >
                    <option value="">-- Chọn khách thuê --</option>
                    {tenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName} {t.phoneNumber ? `- ${t.phoneNumber}` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={UI.label}>
                    Phòng <span className="text-red-600">*</span>
                  </label>
                  <select
                    className={UI.input}
                    value={form.roomId}
                    onChange={(e) =>
                      setForm({ ...form, roomId: e.target.value ? Number(e.target.value) : "" })
                    }
                  >
                    <option value="">-- Chọn phòng --</option>
                    {rooms.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.houseName ? `${r.houseName}` : "..."} - {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className={UI.label}>
                      Ngày bắt đầu <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="date"
                      className={UI.input}
                      value={form.startDate}
                      onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className={UI.label}>Ngày kết thúc</label>
                    <input
                      type="date"
                      className={UI.input}
                      value={form.endDate}
                      onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className={UI.label}>
                    Giá thuê (VNĐ) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    className={UI.input}
                    placeholder="Ví dụ: 3000000"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>

                <div>
                  <label className={UI.label}>File Hợp đồng (URL)</label>
                  <input
                    type="text"
                    className={UI.input}
                    placeholder="https://..."
                    value={form.fileUrl}
                    onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
                  />
                </div>

                <div>
                  <label className={UI.label}>Trạng thái</label>
                  <select
                    className={UI.input}
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as ContractStatus })}
                  >
                    <option value="pending">Chờ hiệu lực</option>
                    <option value="active">Hiệu lực</option>
                    <option value="ended">Đã kết thúc</option>
                    <option value="expired">Đã hết hạn</option>
                    <option value="terminated">Đã huỷ</option>
                  </select>
                </div>

                <div className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                  <CalendarDays className="h-5 w-5 text-slate-500 mt-0.5" />
                  <div className="text-sm font-medium text-slate-600">
                    <p>
                      Lưu ý: Kiểm tra kỹ thông tin{" "}
                      <span className="text-slate-900 font-bold">Phòng</span> và{" "}
                      <span className="text-slate-900 font-bold">Khách thuê</span> trước khi lưu.
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-end gap-3 pt-2">
                  <button type="button" onClick={closeModal} className={UI.btnOutline} disabled={isSubmitting}>
                    Huỷ bỏ
                  </button>
                  <button type="submit" className={UI.btnPrimary} disabled={isSubmitting}>
                    {isSubmitting ? "Đang xử lý..." : isEditing ? "Lưu thay đổi" : "Tạo hợp đồng"}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
