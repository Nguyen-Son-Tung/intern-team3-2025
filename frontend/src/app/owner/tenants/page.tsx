"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users,
  Pencil,
  Trash2,
  X,
  Search,
  RefreshCw,
  CheckCircle2,
  Plus,
  FileText,
} from "lucide-react";

/* =============================
   CONFIG API
============================= */
function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "").replace(/\/api$/, "");
}

const AA_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_AA_API_URL || "http://localhost:5286"
);

const PROPERTY_API_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_PROPERTY_API_URL || "http://localhost:5018"
);

const SERVICE_API_KEY = process.env.NEXT_PUBLIC_USERS_SERVICE_API_KEY || "";

const CONTRACTS_PAGE_PATH = "/owner/tenant-contracts";


const UI = {
  page: "min-h-screen bg-slate-50",
  container: "px-8 pt-6 pb-8",

  headerWrap: "mb-5",
  title: "text-3xl font-extrabold text-slate-900 tracking-tight",

  panel: "rounded-2xl bg-white border border-slate-200 shadow-sm",
  panelInner: "p-4 md:p-5",

  tabsWrap: "inline-flex rounded-xl bg-slate-100 p-1 gap-1",
  tabBtn:
    "px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900",
  tabActive: "bg-white text-slate-900 shadow-sm border border-slate-200",

  input:
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-slate-900 disabled:bg-slate-100 disabled:text-slate-600 disabled:opacity-100",

  btnPrimary:
    "inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700",
  btnOutline:
    "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50",

  tableWrap:
    "rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden",
  tableHead: "bg-white border-b border-slate-200",
  th: "px-6 py-4 text-left text-xs font-extrabold uppercase tracking-wider text-slate-600",
  td: "px-6 py-4 text-sm text-slate-700 border-b border-slate-100",
  tdRight:
    "px-6 py-4 text-sm text-slate-700 border-b border-slate-100 text-right",

  actionBtnBase:
    "inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-bold text-white shadow-sm active:scale-[0.98] transition",
  actionEdit: "bg-violet-600 hover:bg-violet-700",
  actionDelete: "bg-red-600 hover:bg-red-700",
};

/* =============================
   TYPES
============================= */
type Tenant = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  createdAt: string;
};

type EditTenantForm = {
  fullName: string;
  email: string;
  phoneNumber: string;
};

type JsonObject = Record<string, unknown>;

type ContractApiDto = {
  id?: number;
  tenantId?: string;
  startDate?: string;
  endDate?: string | null;
  status?: string;
};

type ContractsApiResponse = {
  success?: boolean;
  data?: ContractApiDto[];
};

/* =============================
   HEADERS
============================= */
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

  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function redirectLoginIfAuthFail(status: number) {
  if (typeof window === "undefined") return;
  if (status === 401 || status === 403) window.location.href = "/public/login";
}

/* =============================
   SAFE JSON
============================= */
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

/* =============================
   JSON HELPERS
============================= */
function isJsonObject(v: unknown): v is JsonObject {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function getString(obj: JsonObject, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" ? v : undefined;
}

function pickString(obj: JsonObject, keys: string[]): string {
  for (const k of keys) {
    const s = getString(obj, k);
    if (s && s.trim() !== "") return s;
  }
  return "";
}

function pickDate(obj: JsonObject, keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v) return v;
  }
  return "";
}

function mapTenant(raw: unknown, fallbackId: string): Tenant {
  if (!isJsonObject(raw)) {
    return {
      id: fallbackId,
      fullName: "",
      email: "",
      phoneNumber: "",
      createdAt: "",
    };
  }

  return {
    id: pickString(raw, ["id", "userId", "tenantId"]) || fallbackId,
    fullName: pickString(raw, ["fullName", "full_name", "fullname", "name"]),
    email: pickString(raw, ["email"]),
    phoneNumber: pickString(raw, ["phoneNumber", "phone", "phone_number"]),
    createdAt: pickDate(raw, ["createdAt", "created_date", "createdDate"]),
  };
}

/* =============================
   CONTRACT HELPERS
============================= */
function normalizeContractStatus(raw?: string | null): string {
  return String(raw || "")
    .toLowerCase()
    .trim();
}

function isActiveContractByStatusOrDates(c: ContractApiDto): boolean {
  const st = normalizeContractStatus(c.status);
  if (st === "terminated" || st === "ended" || st === "expired") return false;
  if (st === "active") return true;

  const start = c.startDate ? new Date(c.startDate) : null;
  if (!start || Number.isNaN(start.getTime())) return false;

  const now = new Date();
  const end = c.endDate ? new Date(c.endDate) : null;
  const endOk = !end || Number.isNaN(end.getTime()) ? null : end;

  if (now < start) return false;
  if (endOk && now > endOk) return false;

  return true;
}

/* =============================
   API CALLS
============================= */
async function fetchTenants(): Promise<Tenant[]> {
  const ownerId =
    typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  if (!ownerId) return [];

  const url = `${AA_API_BASE_URL}/api/Users/owner/${ownerId}/tenants`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      ...getServiceHeaders(),
      ...getAuthHeaders(),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Fetch tenants failed:", res.status, text);
    redirectLoginIfAuthFail(res.status);
    return [];
  }

  const parsed = await safeReadJson<unknown>(res);
  if (!parsed.ok) return [];

  const json = parsed.data;
  if (!Array.isArray(json)) return [];
  return json.map((t, i) => mapTenant(t, String(i + 1)));
}

async function fetchContractsForOwner(): Promise<ContractApiDto[]> {
  const url = `${PROPERTY_API_BASE_URL}/api/contracts/list-contracts`;

  const res = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    console.error("Fetch contracts failed:", res.status, raw);
    redirectLoginIfAuthFail(res.status);
    return [];
  }

  const parsed = await safeReadJson<unknown>(res);
  if (!parsed.ok) return [];

  const json = parsed.data;
  if (Array.isArray(json)) return json as ContractApiDto[];

  const obj = json as ContractsApiResponse;
  if (Array.isArray(obj?.data)) return obj.data;

  return [];
}

async function updateTenant(
  tenantId: string,
  payload: EditTenantForm
): Promise<void> {
  const url = `${AA_API_BASE_URL}/api/Users/${tenantId}`;

  const body: Record<string, string> = {
    fullName: payload.fullName,
    full_name: payload.fullName,
    email: payload.email,
    phoneNumber: payload.phoneNumber,
    phone_number: payload.phoneNumber,
    phone: payload.phoneNumber,
  };

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      ...getAuthHeaders(),
      "X-Service-Api-Key": SERVICE_API_KEY,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Update tenant error:", res.status, text);
    redirectLoginIfAuthFail(res.status);
    throw new Error("Update tenant failed");
  }
}

async function deleteTenant(tenantId: string): Promise<void> {
  const url = `${AA_API_BASE_URL}/api/Users/${tenantId}`;

  const res = await fetch(url, {
    method: "DELETE",
    headers: {
      ...getAuthHeaders(),
      "X-Service-Api-Key": SERVICE_API_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Delete tenant error:", res.status, text);
    redirectLoginIfAuthFail(res.status);
    throw new Error("Delete tenant failed");
  }
}

/* =============================
   HELPERS
============================= */
function formatDate(dateStr: string): string {
  if (!dateStr) return "Chưa cập nhật";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "Chưa cập nhật";
  return d.toLocaleDateString("vi-VN");
}

/* =============================
   COMPONENT
============================= */
type ContractFilter = "all" | "has" | "none";

export default function OwnerTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [contracts, setContracts] = useState<ContractApiDto[]>([]);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ContractFilter>("all");

  const [editing, setEditing] = useState<Tenant | null>(null);
  const [editForm, setEditForm] = useState<EditTenantForm>({
    fullName: "",
    email: "",
    phoneNumber: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map tenantId -> hasActiveContract
  const hasActiveContractMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const c of contracts) {
      const tid = String(c.tenantId ?? "");
      if (!tid) continue;
      if (isActiveContractByStatusOrDates(c)) map.set(tid, true);
      else if (!map.has(tid)) map.set(tid, false);
    }
    return map;
  }, [contracts]);

  const reload = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const [t, c] = await Promise.all([
        fetchTenants(),
        fetchContractsForOwner(),
      ]);
      setTenants(t);
      setContracts(c);
    } catch (e) {
      console.error(e);
      setErrorMessage("Không thể tải danh sách khách thuê / hợp đồng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const [t, c] = await Promise.all([
          fetchTenants(),
          fetchContractsForOwner(),
        ]);
        if (!alive) return;
        setTenants(t);
        setContracts(c);
      } catch (e) {
        console.error(e);
        if (alive)
          setErrorMessage("Không thể tải danh sách khách thuê / hợp đồng.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    return tenants.filter((t) => {
      const matchText =
        !term ||
        (t.fullName || "").toLowerCase().includes(term) ||
        (t.email || "").toLowerCase().includes(term) ||
        (t.phoneNumber || "").toLowerCase().includes(term);

      if (!matchText) return false;

      const hasActive = hasActiveContractMap.get(t.id) === true;
      if (filter === "has") return hasActive;
      if (filter === "none") return !hasActive;
      return true;
    });
  }, [tenants, search, filter, hasActiveContractMap]);

  const openEdit = (t: Tenant) => {
    setEditing(t);
    setEditForm({
      fullName: t.fullName ?? "",
      email: t.email ?? "",
      phoneNumber: t.phoneNumber ?? "",
    });
  };

  const closeEdit = () => {
    if (isSubmitting) return;
    setEditing(null);
  };

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;

    if (!editForm.fullName.trim() || !editForm.email.trim()) {
      alert("Vui lòng nhập Họ tên và Email.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTenant(editing.id, {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        phoneNumber: editForm.phoneNumber.trim(),
      });

      await reload();
      alert("Cập nhật khách thuê thành công.");
      setEditing(null);
    } catch (err) {
      console.error(err);
      alert("Cập nhật thất bại. Kiểm tra token/role/endpoint backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeTenant = async (t: Tenant) => {
    if (!confirm(`Xoá khách thuê "${t.fullName || t.email}"?`)) return;

    setIsSubmitting(true);
    try {
      await deleteTenant(t.id);
      await reload();
      alert("Đã xoá khách thuê.");
    } catch (err) {
      console.error(err);
      alert("Xoá thất bại. Kiểm tra token/role/endpoint backend.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={UI.page}>
      <div className={UI.container}>
        {/* TITLE */}
        <div className={UI.headerWrap}>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Quản lý Khách thuê</h2>
            </div>
          </div>
        </div>

        {/* FILTER PANEL */}
        <div className={`${UI.panel} mb-6`}>
          <div
            className={`${UI.panelInner} flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between`}
          >
            {/* Tabs */}
            <div className={UI.tabsWrap}>
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`${UI.tabBtn} ${
                  filter === "all" ? UI.tabActive : ""
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setFilter("has")}
                className={`${UI.tabBtn} ${
                  filter === "has" ? UI.tabActive : ""
                }`}
              >
                Đã có HĐ
              </button>
              <button
                type="button"
                onClick={() => setFilter("none")}
                className={`${UI.tabBtn} ${
                  filter === "none" ? UI.tabActive : ""
                }`}
              >
                Chưa có HĐ
              </button>
            </div>

            {/* Search + reload */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-96">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className={`${UI.input} pl-10`}
                  placeholder="Tìm theo tên / email / SĐT..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={reload}
                className={UI.btnOutline}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4" />
                Tải lại
              </button>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-700">
            Đang tải dữ liệu...
          </div>
        ) : (
          <div className={UI.tableWrap}>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className={UI.tableHead}>
                  <tr>
                    <th className={UI.th}>STT</th>
                    <th className={UI.th}>Họ tên</th>
                    <th className={UI.th}>Email</th>
                    <th className={UI.th}>SĐT</th>
                    <th className={UI.th}>Ngày tạo</th>
                    <th className={UI.th}>Hợp đồng</th>
                    <th className={`${UI.th} text-right`}>Hành động</th>
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {filtered.map((t, index) => {
                    const hasActive = hasActiveContractMap.get(t.id) === true;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70">
                        {/* ✅ STT */}
                        <td className={UI.td}>
                          <span className="font-extrabold text-slate-700">
                            {index + 1}
                          </span>
                        </td>

                        {/* ✅ Họ tên (đã bỏ ID) */}
                        <td className={UI.td}>
                          <div className="font-semibold text-slate-900">
                            {t.fullName || "—"}
                          </div>
                        </td>

                        <td className={UI.td}>{t.email || "—"}</td>

                        <td className={UI.td}>
                          {t.phoneNumber || "Chưa cập nhật"}
                        </td>

                        <td className={UI.td}>{formatDate(t.createdAt)}</td>

                        {/* ✅ CỘT HỢP ĐỒNG */}
                        <td className={UI.td}>
                          {hasActive ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-100">
                              <CheckCircle2 className="h-4 w-4" />
                              Đang hiệu lực
                            </span>
                          ) : (
                            <Link
                              className={`${UI.btnPrimary} !px-3 !py-2 text-xs`}
                              href={`${CONTRACTS_PAGE_PATH}?tenantId=${encodeURIComponent(
                                t.id
                              )}`}
                              title="Thêm hợp đồng cho khách thuê"
                            >
                              <Plus className="h-4 w-4" />
                              Thêm hợp đồng
                            </Link>
                          )}
                        </td>

                        {/* ✅ NÚT SỬA/XOÁ giống ảnh */}
                        <td className={UI.tdRight}>
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEdit(t)}
                              className={`${UI.actionBtnBase} ${UI.actionEdit}`}
                              disabled={isSubmitting}
                            >
                              <Pencil className="h-4 w-4" />
                              Sửa
                            </button>

                            <button
                              type="button"
                              onClick={() => removeTenant(t)}
                              className={`${UI.actionBtnBase} ${UI.actionDelete}`}
                              disabled={isSubmitting}
                            >
                              <Trash2 className="h-4 w-4" />
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filtered.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-14 text-center text-slate-400"
                      >
                        Không có khách thuê nào phù hợp.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500 flex items-center justify-between">
              <div className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" />
                Tổng:{" "}
                <span className="font-semibold text-slate-700">
                  {filtered.length}
                </span>{" "}
                khách thuê
              </div>
              <Link
                href={CONTRACTS_PAGE_PATH}
                className="text-indigo-600 hover:text-indigo-700 font-semibold"
              >
                Đi tới quản lý hợp đồng →
              </Link>
            </div>
          </div>
        )}

        {/* MODAL EDIT */}
        {editing && (
          <form
            onSubmit={submitEdit}
            className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
          >
            <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 p-6">
              <div className="flex items-start justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Cập nhật khách thuê
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Chỉnh sửa thông tin cơ bản của khách thuê
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-full bg-slate-50 p-2 text-slate-500 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  disabled={isSubmitting}
                  title="Đóng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Họ tên
                  </label>
                  <input
                    className={UI.input}
                    value={editForm.fullName}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Email
                  </label>
                  <input
                    type="email"
                    className={UI.input}
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, email: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-extrabold uppercase tracking-wider text-slate-600">
                    Số điện thoại
                  </label>
                  <input
                    className={UI.input}
                    value={editForm.phoneNumber}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        phoneNumber: e.target.value,
                      }))
                    }
                    placeholder="VD: 0909xxxxxx"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-5">
                <button
                  type="button"
                  onClick={closeEdit}
                  className={UI.btnOutline}
                  disabled={isSubmitting}
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className={UI.btnPrimary}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
