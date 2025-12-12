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

// =============================
// CONFIG API
// =============================

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
}

const PROPERTY_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:5018"
);

const AA_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_AA_API_URL || "http://localhost:5286"
);

// =============================
// API ROUTES
// =============================
const API_URLS = {
  TENANTS_BY_OWNER: `${AA_API_BASE_URL}/api/users/owner`,

  CONTRACTS: `${PROPERTY_API_BASE_URL}/api/Contracts/list-contracts`,
  CREATE_CONTRACT: `${PROPERTY_API_BASE_URL}/api/Contracts`,
  UPDATE_CONTRACT: (id: number) => `${PROPERTY_API_BASE_URL}/api/Contracts/${id}`,
  DELETE_CONTRACT: (id: number) => `${PROPERTY_API_BASE_URL}/api/Contracts/${id}`,

  ROOMS_AVAILABLE_BY_OWNER: `${PROPERTY_API_BASE_URL}/api/Rooms/owner`,
};

const SERVICE_API_KEY =
  process.env.NEXT_PUBLIC_USERS_SERVICE_API_KEY || "";

// =============================
// TYPES
// =============================
type ContractStatus = "active" | "ended" | "expired" | "terminated" | "pending";

type Tenant = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
};

type TenantApiDto = Partial<Tenant>;

type ContractApiDto = {
  id: number;
  code: string;
  propertyName: string;
  houseName: string;
  tenantId: string;
  tenantName?: string;
  startDate: string;
  endDate?: string | null;
  rentPrice: number;
  status: string;
};

type ContractsApiResponse = {
  success?: boolean;
  data?: ContractApiDto[];
};

type Contract = {
  id: number;
  code: string;
  roomId?: number;
  propertyName: string;
  houseName: string;
  tenantId: string;
  tenantName?: string;
  startDate: string;
  endDate?: string | null;
  rentPrice: number;
  status: ContractStatus;
};

type Room = {
  id: number;
  name: string;
  houseName?: string;
};

type RoomApiDto = {
  id?: number;
  name?: string;
  houseName?: string;
};

type ContractForm = {
  tenantId: string;
  roomId: number | "";
  startDate: string;
  endDate: string;
  rentPrice: string;
};

// =============================
// AUTH HEADERS
// =============================
function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("accessToken")
      : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

// =============================
// STATUS HELPERS
// =============================
function normalizeStatus(raw: string | undefined | null): ContractStatus {
  const s = (raw || "").toLowerCase();

  if (s === "active") return "active";
  if (s === "ended") return "ended";
  if (s === "expired") return "expired";
  if (s === "terminated") return "terminated";
  if (s === "pending") return "pending";

  return "active";
}

// TÍNH TRẠNG THÁI TỰ ĐỘNG THEO NGÀY
function computeStatusFromDates(
  startDateStr: string,
  endDateStr?: string | null,
  original: ContractStatus = "active"
): ContractStatus {
  // Nếu backend báo đã huỷ thì giữ nguyên
  if (original === "terminated") return "terminated";

  const now = new Date();

  const start = new Date(startDateStr);
  if (Number.isNaN(start.getTime())) {
    // Không parse được thì dùng trạng thái backend
    return original;
  }

  let end: Date | null = null;
  if (endDateStr) {
    const e = new Date(endDateStr);
    end = Number.isNaN(e.getTime()) ? null : e;
  }

  // Chưa tới ngày bắt đầu → Chờ hiệu lực
  if (now < start) {
    return "pending";
  }

  // Có ngày kết thúc
  if (end) {
    if (now > end) {
      return "ended"; // hoặc "expired" tuỳ bạn
    }
    // now nằm trong [start, end]
    return "active";
  }

  // Không có endDate, đã qua ngày start → đang hiệu lực
  return "active";
}

function statusBadge(status: ContractStatus) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
        ● Hiệu lực
      </span>
    );
  }
  if (status === "ended" || status === "expired") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
        ● Đã kết thúc
      </span>
    );
  }
  if (status === "terminated") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 border border-red-100">
        ● Đã huỷ
      </span>
    );
  }
  // pending
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 border border-amber-100">
      ● Chờ hiệu lực
    </span>
  );
}

// =============================
// FETCH TENANTS (AA SERVICE)
// =============================
async function fetchTenants(): Promise<Tenant[]> {
  const ownerId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId")
      : null;

  if (!ownerId) {
    console.warn(
      "Không tìm thấy userId trong localStorage → không gọi tenants API"
    );
    return [];
  }

  const url = `${API_URLS.TENANTS_BY_OWNER}/${ownerId}/tenants`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Service-Api-Key": SERVICE_API_KEY,
    },
  });

  if (!res.ok) {
    console.error(
      "Tenants API error:",
      res.status,
      await res.text().catch(() => "")
    );
    return [];
  }

  const dataUnknown = (await res.json()) as unknown;

  if (!Array.isArray(dataUnknown)) {
    console.warn("Tenants API trả về không phải array");
    return [];
  }

  const data = dataUnknown as TenantApiDto[];

  return data.map((t, index): Tenant => ({
    id: t.id ?? String(index + 1),
    fullName: t.fullName ?? "",
    email: t.email ?? "",
    phoneNumber: t.phoneNumber ?? "",
    createdAt: t.createdAt ?? "",
  }));
}

// =============================
// FETCH ROOMS (PROPERTY SERVICE)
// =============================
async function fetchAvailableRooms(): Promise<Room[]> {
  const ownerId =
    typeof window !== "undefined"
      ? localStorage.getItem("userId")
      : null;

  if (!ownerId) {
    console.warn(
      "Không tìm thấy userId → không gọi API rooms trống"
    );
    return [];
  }

  const url = `${API_URLS.ROOMS_AVAILABLE_BY_OWNER}/${ownerId}/available`;

  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    console.error(
      "Rooms API error:",
      res.status,
      await res.text().catch(() => "")
    );
    return [];
  }

  const dataUnknown = (await res.json()) as unknown;

  if (!Array.isArray(dataUnknown)) {
    console.warn("Rooms API trả về không phải array");
    return [];
  }

  const raw = dataUnknown as RoomApiDto[];

  return raw.map((r, index): Room => ({
    id: typeof r.id === "number" ? r.id : index + 1,
    name: r.name ?? `Phòng #${index + 1}`,
    houseName: r.houseName ?? "",
  }));
}

// =============================
// FETCH CONTRACTS (PROPERTY SERVICE)
// =============================
async function fetchContracts(): Promise<Contract[]> {
  const res = await fetch(API_URLS.CONTRACTS, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("Contracts API error:", res.status, body);

    if (res.status === 401 && typeof window !== "undefined") {
      window.location.href = "/public/login";
    }

    throw new Error(`Contracts API failed: STATUS ${res.status}`);
  }

  const json = (await res.json()) as ContractsApiResponse;

  const rawData: ContractApiDto[] = Array.isArray(json.data)
    ? json.data!
    : [];

  return rawData.map((c, index): Contract => {
    const normalizedStatus = normalizeStatus(c.status);
    const computedStatus = computeStatusFromDates(
      c.startDate,
      c.endDate ?? null,
      normalizedStatus
    );

    return {
      id: c.id ?? index + 1,
      code: c.code,
      roomId: undefined, // hiện tại API chưa trả roomId
      propertyName: c.propertyName ?? "",
      houseName: c.houseName ?? "",
      tenantId: String(c.tenantId),
      tenantName: c.tenantName,
      startDate: c.startDate,
      endDate: c.endDate ?? null,
      rentPrice: c.rentPrice ?? 0,
      status: computedStatus,
    };
  });
}

// =============================
// HELPERS
// =============================
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

// =============================
// COMPONENT
// =============================
export default function TenantContractsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search + pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<ContractForm>({
    tenantId: "",
    roomId: "",
    startDate: "",
    endDate: "",
    rentPrice: "",
  });

  // =============================
  // LOAD DATA
  // =============================
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [tenantsFromApi, contractsFromApi, roomsFromApi] =
          await Promise.all([
            fetchTenants(),
            fetchContracts(),
            fetchAvailableRooms(),
          ]);

        if (!isMounted) return;

        setTenants(tenantsFromApi);
        setContracts(contractsFromApi);
        setRooms(roomsFromApi);
      } catch (err) {
        console.error(err);
        if (isMounted) {
          setErrorMessage("Không thể tải dữ liệu hợp đồng từ server.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // =============================
  // FILTER TENANTS CHƯA CÓ HĐ
  // =============================
  const tenantsWithoutContract = useMemo(() => {
    const tenantIdsWithContract = new Set(
      contracts.map((c) => c.tenantId)
    );
    return tenants.filter(
      (t) => !tenantIdsWithContract.has(t.id)
    );
  }, [tenants, contracts]);

  // =============================
  // FILTER + SEARCH
  // =============================
  const filteredContracts = useMemo(() => {
    let data = [...contracts];

    if (searchTerm.trim().length > 0) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter((c) => {
        const code = c.code?.toLowerCase() ?? "";
        const room = c.propertyName?.toLowerCase() ?? "";
        const house = c.houseName?.toLowerCase() ?? "";
        const tenantName = c.tenantName?.toLowerCase() ?? "";
        return (
          code.includes(term) ||
          room.includes(term) ||
          house.includes(term) ||
          tenantName.includes(term)
        );
      });
    }

    data.sort((a, b) => {
      const da = new Date(a.startDate).getTime();
      const db = new Date(b.startDate).getTime();
      if (Number.isNaN(da) || Number.isNaN(db)) return 0;
      return db - da;
    });

    return data;
  }, [contracts, searchTerm]);

  // =============================
  // PAGINATION
  // =============================
  const totalItems = filteredContracts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * PAGE_SIZE;
  const pagedContracts = filteredContracts.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const handleChangePage = (direction: "prev" | "next") => {
    setCurrentPage((prev) => {
      if (direction === "prev") return Math.max(1, prev - 1);
      return Math.min(totalPages, prev + 1);
    });
  };

  // =============================
  // OPEN MODAL
  // =============================
  const openCreateModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setForm({
      tenantId: "",
      roomId: "",
      startDate: "",
      endDate: "",
      rentPrice: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (contract: Contract) => {
    setIsEditing(true);
    setEditingId(contract.id);
    setForm({
      tenantId: contract.tenantId,
      // API hiện không trả roomId, nên khi sửa sẽ yêu cầu chọn lại phòng
      roomId: "",
      startDate: contract.startDate.split("T")[0] ?? contract.startDate,
      endDate: (contract.endDate ?? "").split("T")[0] || "",
      rentPrice: contract.rentPrice.toString(),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
  };

  // =============================
  // SUBMIT (CREATE / UPDATE)
  // =============================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tenantId || !form.roomId || !form.startDate) {
      alert("Vui lòng chọn khách thuê, phòng và ngày bắt đầu.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        tenantId: form.tenantId,
        roomId: Number(form.roomId),
        startDate: form.startDate,
        endDate: form.endDate || null,
        rentPrice: Number(form.rentPrice) || 0,
      };

      if (isEditing && editingId !== null) {
        const res = await fetch(API_URLS.UPDATE_CONTRACT(editingId), {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error("Update contract error:", res.status, body);
          alert("Cập nhật hợp đồng thất bại.");
        } else {
          alert("Cập nhật hợp đồng thành công.");
          const updated = await fetchContracts();
          setContracts(updated);
          setIsModalOpen(false);
        }
      } else {
        const res = await fetch(API_URLS.CREATE_CONTRACT, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.text().catch(() => "");
          console.error("Create contract error:", res.status, body);
          alert("Tạo hợp đồng thất bại.");
        } else {
          alert("Tạo hợp đồng thành công.");
          const updated = await fetchContracts();
          setContracts(updated);
          setIsModalOpen(false);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi gọi API hợp đồng.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // =============================
  // DELETE
  // =============================
  const handleDelete = async (contract: Contract) => {
    if (
      !window.confirm(
        `Xóa hợp đồng ${contract.code}? Hành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(API_URLS.DELETE_CONTRACT(contract.id), {
        method: "DELETE",
        headers: getAuthHeaders(),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("Delete contract error:", res.status, body);
        alert("Xóa hợp đồng thất bại.");
      } else {
        alert("Đã xóa hợp đồng.");
        setContracts((prev) =>
          prev.filter((c) => c.id !== contract.id)
        );
      }
    } catch (error) {
      console.error(error);
      alert("Có lỗi xảy ra khi xóa hợp đồng.");
    }
  };

  // =============================
  // RENDER
  // =============================
  return (
    <div className="p-6 space-y-4">
      {/* HEADER */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">
                Danh sách Hợp đồng
              </h1>
              <p className="text-sm text-slate-500">
                Quản lý hợp đồng thuê phòng của chủ nhà
              </p>
            </div>
          </div>
        </div>

        {/* Search + Add */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Tìm theo mã HĐ, phòng, khách thuê..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" />
            Thêm hợp đồng
          </button>
        </div>
      </div>

      {/* STATUS */}
      {isLoading && (
        <div className="rounded-md bg-sky-50 border border-sky-100 px-4 py-2 text-sm text-sky-700">
          Đang tải dữ liệu hợp đồng & khách thuê...
        </div>
      )}

      {errorMessage && (
        <div className="rounded-md bg-amber-50 border border-amber-100 px-4 py-2 text-sm text-amber-700">
          {errorMessage}
        </div>
      )}

      {/* DEBUG */}
      <div className="rounded-md bg-slate-50 border border-slate-200 px-4 py-2 text-xs text-slate-600">
        <div>Tenants loaded: {tenants.length}</div>
        <div>Contracts loaded: {contracts.length}</div>
        <div>Available rooms loaded: {rooms.length}</div>
      </div>

      {/* TABLE */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="max-h-[520px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-2 text-left font-semibold text-slate-600 text-xs uppercase">
                  STT
                </th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600 text-xs uppercase">
                  Mã HĐ
                </th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600 text-xs uppercase">
                  Phòng / Nhà
                </th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600 text-xs uppercase">
                  Khách thuê
                </th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600 text-xs uppercase">
                  Ngày bắt đầu
                </th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600 text-xs uppercase">
                  Ngày kết thúc
                </th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600 text-xs uppercase">
                  Giá thuê
                </th>
                <th className="px-4 py-2 text-left font-semibold text-slate-600 text-xs uppercase">
                  Trạng thái
                </th>
                <th className="px-4 py-2 text-right font-semibold text-slate-600 text-xs uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {pagedContracts.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-4 text-center text-slate-400"
                  >
                    Chưa có hợp đồng nào.
                  </td>
                </tr>
              ) : (
                pagedContracts.map((c, idx) => {
                  const tenant = tenants.find(
                    (t) => t.id === c.tenantId
                  );
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-slate-100 hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-2 text-slate-700">
                        {startIndex + idx + 1}
                      </td>
                      <td className="px-4 py-2 font-medium text-slate-800">
                        {c.code}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        <div className="font-medium">
                          {c.propertyName}
                        </div>
                        <div className="text-xs text-slate-400">
                          {c.houseName}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        <div className="font-medium">
                          {tenant?.fullName ??
                            c.tenantName ??
                            "—"}
                        </div>
                        <div className="text-xs text-slate-400">
                          {tenant?.phoneNumber ?? ""}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {formatDate(c.startDate)}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {formatDate(c.endDate)}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {formatPrice(c.rentPrice)}
                      </td>
                      <td className="px-4 py-2 text-slate-700">
                        {statusBadge(c.status)}
                      </td>
                      <td className="px-4 py-2 text-right text-xs">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            className="inline-flex items-center justify-center rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Xoá
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-600">
            <div>
              Hiển thị{" "}
              <span className="font-semibold">
                {startIndex + 1} -{" "}
                {Math.min(startIndex + PAGE_SIZE, totalItems)}
              </span>{" "}
              trên{" "}
              <span className="font-semibold">{totalItems}</span>{" "}
              hợp đồng
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleChangePage("prev")}
                disabled={currentPageSafe === 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 text-xs">
                Trang{" "}
                <span className="font-semibold">
                  {currentPageSafe}
                </span>{" "}
                /{" "}
                <span className="font-semibold">{totalPages}</span>
              </span>
              <button
                type="button"
                onClick={() => handleChangePage("next")}
                disabled={currentPageSafe === totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL TẠO / SỬA HỢP ĐỒNG */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-start justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-500" />
                  {isEditing
                    ? "Chỉnh sửa hợp đồng"
                    : "Thêm hợp đồng mới"}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Thêm hợp đồng: chọn khách chưa có HĐ và một phòng trống.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-500 hover:bg-red-50 hover:text-red-500"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSubmit}
              className="space-y-4 overflow-y-auto pr-1"
            >
              {/* Tenant */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Khách thuê{" "}
                  {!isEditing && (
                    <span className="text-amber-500">
                      (chỉ khách chưa có HĐ)
                    </span>
                  )}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  value={form.tenantId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      tenantId: e.target.value,
                    }))
                  }
                  required
                >
                  <option value="">
                    -- Chọn khách thuê --
                  </option>
                  {(isEditing ? tenants : tenantsWithoutContract).map(
                    (t) => (
                      <option key={t.id} value={t.id}>
                        {t.fullName}{" "}
                        {t.phoneNumber
                          ? `- ${t.phoneNumber}`
                          : ""}
                      </option>
                    )
                  )}
                </select>
              </div>

              {/* Room */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Phòng trống{" "}
                  <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                  value={form.roomId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      roomId: e.target.value
                        ? Number(e.target.value)
                        : "",
                    }))
                  }
                  required
                >
                  <option value="">
                    -- Chọn phòng trống --
                  </option>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                      {r.houseName ? ` - ${r.houseName}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dates */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Ngày bắt đầu{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        startDate: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        endDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Giá thuê (VNĐ / tháng){" "}
                  <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 pr-16 text-sm outline-none focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                    placeholder="Ví dụ: 5000000"
                    value={form.rentPrice}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        rentPrice: e.target.value,
                      }))
                    }
                    required
                  />
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-400">
                    VNĐ
                  </span>
                </div>
              </div>

              {/* Info box */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600 flex items-center gap-2">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Hợp đồng mới sẽ được tính từ ngày bắt đầu và
                  áp dụng cho phòng đã chọn.
                </span>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang lưu...
                    </>
                  ) : isEditing ? (
                    "Lưu thay đổi"
                  ) : (
                    "Tạo hợp đồng"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
