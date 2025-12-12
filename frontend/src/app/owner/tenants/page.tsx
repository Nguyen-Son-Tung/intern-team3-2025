"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  Info,
  Phone,
  Mail,
  CalendarDays,
  ArrowUpDown,
  Pencil,
  Trash2,
  X,
} from "lucide-react";

// =============================
// CONFIG API
// =============================
function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
}

const AA_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_AA_API_URL || "http://localhost:5286"
);

const SERVICE_API_KEY = process.env.NEXT_PUBLIC_USERS_SERVICE_API_KEY || "";

// =============================
// TYPES
// =============================
type Tenant = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: string; // ISO string
};

type TenantApiDto = {
  id?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  phone?: string;
  createdAt?: string | null;  
  createdDate?: string | null;
  registrationDate?: string | null;
};

type EditTenantForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
};

// =============================
// HEADERS
// =============================
function getServiceHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    "X-Service-Api-Key": SERVICE_API_KEY,
  };
}

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

function redirectLoginIfAuthFail(status: number) {
  if (typeof window === "undefined") return;
  if (status === 401 || status === 403) window.location.href = "/public/login";
}

// =============================
// API CALLS
// =============================
async function fetchTenants(): Promise<Tenant[]> {
  const ownerId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  if (!ownerId) {
    console.warn(
      "Không tìm thấy userId trong localStorage → không gọi tenants API"
    );
    return [];
  }

  const url = `${AA_API_BASE_URL}/api/users/owner/${ownerId}/tenants`;

  const res = await fetch(url, {
    method: "GET",
    headers: getServiceHeaders(),
    cache: "no-store",
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
    phoneNumber: t.phoneNumber ?? t.phone ?? "",
    
    createdAt:
      t.createdAt ??
      t.createdDate ??
      t.registrationDate ??
      "",
  }));
}

async function updateTenant(
  tenantId: string,
  payload: EditTenantForm
): Promise<void> {
  const url = `${AA_API_BASE_URL}/api/users/${tenantId}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),           // Bearer token
      "X-Service-Api-Key": SERVICE_API_KEY, // service key giống GET tenants
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await res.text().catch(() => "");

  if (!res.ok) {
    console.error("Update tenant error:", res.status, bodyText);
    redirectLoginIfAuthFail(res.status);
    throw new Error(`Update tenant failed: ${res.status} - ${bodyText}`);
  }

  console.log("Update tenant success:", bodyText || "(no body)");
}

async function deleteTenant(tenantId: string): Promise<void> {
  const url = `${AA_API_BASE_URL}/api/users/${tenantId}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
      "X-Service-Api-Key": SERVICE_API_KEY,
    },
  });

  const bodyText = await res.text().catch(() => "");

  if (!res.ok) {
    console.error("Delete tenant error:", res.status, bodyText);
    redirectLoginIfAuthFail(res.status);
    throw new Error(`Delete tenant failed: ${res.status} - ${bodyText}`);
  }

  console.log("Delete tenant success:", bodyText || "(no body)");
}


// =============================
// HELPERS
// =============================
function formatDate(dateStr: string): string {
  if (!dateStr) return "Chưa cập nhật";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Chưa cập nhật";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return "Chưa cập nhật";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Chưa cập nhật";
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// =============================
// COMPONENT
// =============================
export default function OwnerTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search + Sort + Pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 6;

  // Modal detail
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Modal edit
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editForm, setEditForm] = useState<EditTenantForm>({
    fullName: "",
    email: "",
    phoneNumber: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const reload = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchTenants();
      setTenants(data);
    } catch (e) {
      console.error(e);
      setErrorMessage("Không thể tải danh sách khách thuê từ server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await fetchTenants();
        if (!isMounted) return;
        setTenants(data);
      } catch (e) {
        console.error(e);
        if (isMounted)
          setErrorMessage("Không thể tải danh sách khách thuê từ server.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // FILTER + SORT
  const filteredAndSortedTenants = useMemo(() => {
    let data = [...tenants];

    if (searchTerm.trim().length > 0) {
      const term = searchTerm.trim().toLowerCase();
      data = data.filter((t) => {
        const name = t.fullName?.toLowerCase() ?? "";
        const phone = t.phoneNumber?.toLowerCase() ?? "";
        const email = t.email?.toLowerCase() ?? "";
        return (
          name.includes(term) || phone.includes(term) || email.includes(term)
        );
      });
    }

    data.sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();

      // nếu createdAt rỗng/null -> đẩy xuống cuối cho ổn định
      if (Number.isNaN(da) && Number.isNaN(db)) return 0;
      if (Number.isNaN(da)) return 1;
      if (Number.isNaN(db)) return -1;

      return sortOrder === "asc" ? da - db : db - da;
    });

    return data;
  }, [tenants, searchTerm, sortOrder]);

  // PAGINATION
  const totalItems = filteredAndSortedTenants.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const startIndex = (currentPageSafe - 1) * PAGE_SIZE;
  const pagedTenants = filteredAndSortedTenants.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const stats = useMemo(
    () => ({
      totalTenants: tenants.length,
      filteredTenants: totalItems,
    }),
    [tenants.length, totalItems]
  );

  const handleChangePage = (direction: "prev" | "next") => {
    setCurrentPage((prev) => {
      if (direction === "prev") return Math.max(1, prev - 1);
      return Math.min(totalPages, prev + 1);
    });
  };

  const handleToggleSort = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  // EDIT
  const openEdit = (t: Tenant) => {
    setEditingTenant(t);
    setEditForm({
      fullName: t.fullName ?? "",
      email: t.email ?? "",
      phoneNumber: t.phoneNumber ?? "",
    });
    setIsEditOpen(true);
  };

  const closeEdit = () => {
    if (isSubmitting) return;
    setIsEditOpen(false);
    setEditingTenant(null);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;

    if (!editForm.fullName.trim() || !editForm.email.trim()) {
      alert("Vui lòng nhập Họ tên và Email.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTenant(editingTenant.id, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
      });

      alert("Cập nhật khách thuê thành công.");
      await reload();
      closeEdit();
    } catch (err) {
      console.error(err);
      alert("Cập nhật thất bại. Kiểm tra quyền Owner / token / backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // DELETE
  const handleDeleteTenant = async (t: Tenant) => {
    if (
      !window.confirm(
        `Xoá khách thuê "${t.fullName || t.email}"?\nHành động này không thể hoàn tác.`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      await deleteTenant(t.id);
      alert("Đã xoá khách thuê.");
      setTenants((prev) => prev.filter((x) => x.id !== t.id));
    } catch (err) {
      console.error(err);
      alert("Xoá thất bại. Kiểm tra quyền Owner / token / backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-5 md:px-6 lg:px-10 lg:py-7">
      {/* Header */}
      <header className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Danh sách khách thuê
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Tất cả khách thuê thuộc các căn nhà / phòng của bạn
            </p>
          </div>
        </div>

        {/* Search + Sort */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              placeholder="Tìm theo tên / SĐT / email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>

          <button
            type="button"
            onClick={handleToggleSort}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:border-indigo-300 hover:text-indigo-700"
          >
            <ArrowUpDown className="mr-1 h-3.5 w-3.5" />
            Ngày tạo:{" "}
            <span className="ml-1 font-semibold">
              {sortOrder === "desc" ? "Mới nhất" : "Cũ nhất"}
            </span>
          </button>
        </div>
      </header>

      {/* Status & Error */}
      {isLoading && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-2 text-sm text-sky-700">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          Đang tải danh sách khách thuê...
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {errorMessage}
        </div>
      )}

      {/* Stats */}
      <section className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-indigo-700">
            Tổng số khách thuê
          </p>
          <p className="mt-2 text-3xl font-semibold text-indigo-700">
            {stats.totalTenants}
          </p>
          {stats.filteredTenants !== stats.totalTenants && (
            <p className="mt-1 text-xs text-indigo-600">
              Đang lọc: {stats.filteredTenants} kết quả
            </p>
          )}
        </div>
      </section>

      {/* Table */}
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="max-h-[520px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50/90 backdrop-blur">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  STT
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Họ tên
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Số điện thoại
                </th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ngày tạo
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Thao tác
                </th>
              </tr>
            </thead>

            <tbody>
              {pagedTenants.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-6 text-center text-sm text-slate-400"
                  >
                    Chưa có khách thuê nào.
                  </td>
                </tr>
              ) : (
                pagedTenants.map((t, index) => (
                  <tr
                    key={t.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-3 align-top text-sm text-slate-700">
                      {startIndex + index + 1}
                    </td>
                    <td className="px-5 py-3 align-top text-sm font-medium text-slate-900">
                      {t.fullName || "—"}
                    </td>
                    <td className="px-5 py-3 align-top text-sm text-slate-700">
                      {t.email || "—"}
                    </td>
                    <td className="px-5 py-3 align-top text-sm text-slate-700">
                      {t.phoneNumber || "Chưa cập nhật"}
                    </td>
                    <td className="px-5 py-3 align-top text-sm text-slate-700">
                      {formatDate(t.createdAt)}
                    </td>
                    <td className="px-5 py-3 align-top text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedTenant(t)}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <Info className="h-3.5 w-3.5" />
                          Chi tiết
                        </button>

                        <button
                          type="button"
                          onClick={() => openEdit(t)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700 disabled:opacity-60"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Sửa
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteTenant(t)}
                          disabled={isSubmitting}
                          className="inline-flex items-center gap-1 rounded-full border border-red-100 bg-red-50 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Xoá
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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
              trên <span className="font-semibold">{totalItems}</span> khách thuê
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
                Trang <span className="font-semibold">{currentPageSafe}</span>{" "}
                / <span className="font-semibold">{totalPages}</span>
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
      </section>

      {/* MODAL CHI TIẾT */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Info className="h-4 w-4 text-indigo-500" />
                  Thông tin khách thuê
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  Chi tiết khách thuê đang chọn
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTenant(null)}
                className="rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-500 hover:bg-red-50 hover:text-red-500"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Họ tên
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {selectedTenant.fullName || "—"}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Email
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-slate-800 break-all">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    {selectedTenant.email || "—"}
                  </p>
                </div>

                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Số điện thoại
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-slate-800">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    {selectedTenant.phoneNumber || "Chưa cập nhật"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Ngày tạo tài khoản
                </p>
                <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-slate-800">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  {formatDateTime(selectedTenant.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedTenant(null)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SỬA */}
      {isEditOpen && editingTenant && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between mb-4 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <Pencil className="h-4 w-4 text-amber-500" />
                  Cập nhật khách thuê
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  ID: <span className="font-mono">{editingTenant.id}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-500 hover:bg-red-50 hover:text-red-500"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={submitEdit}
              className="space-y-4 overflow-y-auto pr-1"
            >
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Họ tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                  value={editForm.fullName}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, fullName: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, email: e.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100"
                  value={editForm.phoneNumber}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, phoneNumber: e.target.value }))
                  }
                  placeholder="VD: 0909xxxxxx"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={isSubmitting}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu thay đổi"
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
