"use client";

import React, {
  useMemo,
  useState,
  ChangeEvent,
  FormEvent,
  FC,
} from "react";
import { Search, Plus, Pencil, Trash2, X } from "lucide-react";

type TenantStatus = "active" | "inactive";

interface Tenant {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  status: TenantStatus;
  createdAt: string;
}

type SortKey = "fullName" | "email" | "phoneNumber" | "createdAt" | "status";

interface SortConfig {
  key: SortKey;
  direction: "asc" | "desc";
}

// --- MOCK DATA: giống bảng Users (role = TENANT) ---
const TENANTS_DB: Tenant[] = [
  {
    id: 1,
    fullName: "Nguyễn Văn A",
    email: "nguyenvana@example.com",
    phoneNumber: "0909123456",
    status: "active",
    createdAt: "2024-01-10",
  },
  {
    id: 2,
    fullName: "Trần Thị B",
    email: "tranthib@example.com",
    phoneNumber: "0912345678",
    status: "active",
    createdAt: "2024-02-05",
  },
  {
    id: 3,
    fullName: "Lê Văn C",
    email: "levanc@example.com",
    phoneNumber: "0988777666",
    status: "inactive",
    createdAt: "2023-11-20",
  },
];

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("vi-VN");
}

const TenantsPage: FC = () => {
  const [tenants, setTenants] = useState<Tenant[]>(TENANTS_DB);
  const [search, setSearch] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "fullName",
    direction: "asc",
  });

  // modal dùng chung cho Create + Edit
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [formTenant, setFormTenant] = useState<{
    id?: number;
    fullName: string;
    email: string;
    phoneNumber: string;
    status: TenantStatus;
  }>({
    id: undefined,
    fullName: "",
    email: "",
    phoneNumber: "",
    status: "active",
  });

  function handleSort(key: SortKey) {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  }

  const sortedTenants = useMemo(() => {
    const data = [...tenants];

    data.sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA: string | number = a[key] as unknown as string | number;
      let valB: string | number = b[key] as unknown as string | number;

      if (key === "createdAt") {
        valA = new Date(a.createdAt).getTime();
        valB = new Date(b.createdAt).getTime();
      } else {
        valA = (String(valA ?? "")).toLowerCase();
        valB = (String(valB ?? "")).toLowerCase();
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [tenants, sortConfig]);

  const filteredTenants = useMemo(() => {
    if (!search.trim()) return sortedTenants;

    const lower = search.toLowerCase();
    return sortedTenants.filter((t) => {
      return (
        t.fullName.toLowerCase().includes(lower) ||
        t.email.toLowerCase().includes(lower) ||
        t.phoneNumber.toLowerCase().includes(lower)
      );
    });
  }, [sortedTenants, search]);

  function handleDelete(id: number) {
    const target = tenants.find((t) => t.id === id);
    if (!target) return;

    const ok = window.confirm(
      `Bạn có chắc chắn muốn xóa khách thuê ${target.fullName}?`
    );
    if (!ok) return;

    setTenants((prev) => prev.filter((t) => t.id !== id));
  }

  function renderSortIndicator(columnKey: SortKey) {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  }

  // --- OPEN MODAL: CREATE ---
  function openCreateModal() {
    setModalMode("create");
    setFormTenant({
      id: undefined,
      fullName: "",
      email: "",
      phoneNumber: "",
      status: "active",
    });
    setIsModalOpen(true);
  }

  // --- OPEN MODAL: EDIT ---
  function openEditModal(tenant: Tenant) {
    setModalMode("edit");
    setFormTenant({
      id: tenant.id,
      fullName: tenant.fullName,
      email: tenant.email,
      phoneNumber: tenant.phoneNumber,
      status: tenant.status,
    });
    setIsModalOpen(true);
  }

  function handleFormChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormTenant((prev) => ({
      ...prev,
      [name]:
        name === "status" ? (value as TenantStatus) : value,
    }));
  }

  function handleFormSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!formTenant.fullName.trim() || !formTenant.email.trim()) {
      alert("Vui lòng nhập ít nhất Họ tên và Email.");
      return;
    }

    if (modalMode === "create") {
      const maxId = tenants.length
        ? Math.max(...tenants.map((t) => t.id))
        : 0;
      const todayStr = new Date().toISOString().slice(0, 10);

      const newTenant: Tenant = {
        id: maxId + 1,
        fullName: formTenant.fullName.trim(),
        email: formTenant.email.trim(),
        phoneNumber: formTenant.phoneNumber.trim(),
        status: formTenant.status,
        createdAt: todayStr,
      };

      setTenants((prev) => [...prev, newTenant]);
    } else {
      // edit
      setTenants((prev) =>
        prev.map((t) => {
          if (t.id !== formTenant.id) return t;
          return {
            ...t,
            fullName: formTenant.fullName.trim(),
            email: formTenant.email.trim(),
            phoneNumber: formTenant.phoneNumber.trim(),
            status: formTenant.status,
          };
        })
      );
    }

    setIsModalOpen(false);
  }

  return (
    <div className="flex flex-col h-full w-full bg-slate-50">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-slate-200 bg-white">
        <h1 className="text-2xl font-semibold text-slate-900">
          Danh sách Người thuê
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Quản lý thông tin tài khoản người dùng có vai trò Tenant
        </p>
      </div>

      {/* Nội dung */}
      <div className="flex-1 px-8 py-6 space-y-4">
        {/* Search + Thêm khách mới */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-0 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
              placeholder="Tìm theo tên, email, số điện thoại..."
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-600"
            onClick={openCreateModal}
          >
            <Plus className="h-4 w-4" />
            Thêm Khách Mới
          </button>
        </div>

        {/* Bảng người thuê */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-500 cursor-pointer select-none"
                    onClick={() => handleSort("fullName")}
                  >
                    HỌ VÀ TÊN{renderSortIndicator("fullName")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-500 cursor-pointer select-none"
                    onClick={() => handleSort("email")}
                  >
                    EMAIL{renderSortIndicator("email")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-500 cursor-pointer select-none"
                    onClick={() => handleSort("phoneNumber")}
                  >
                    SỐ ĐIỆN THOẠI{renderSortIndicator("phoneNumber")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-500 cursor-pointer select-none"
                    onClick={() => handleSort("createdAt")}
                  >
                    NGÀY TẠO{renderSortIndicator("createdAt")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-500 cursor-pointer select-none"
                    onClick={() => handleSort("status")}
                  >
                    TRẠNG THÁI{renderSortIndicator("status")}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500">
                    TÁC VỤ
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-6 text-center text-sm text-slate-400"
                    >
                      Không tìm thấy khách thuê nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => {
                    const isActive = tenant.status === "active";
                    return (
                      <tr
                        key={tenant.id}
                        className="border-b border-slate-100 hover:bg-slate-50/60"
                      >
                        <td className="px-6 py-4 align-top text-sm text-slate-800">
                          <div className="font-medium">{tenant.fullName}</div>
                          <div className="text-xs text-slate-400">
                            ID: {tenant.id}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-slate-700">
                          {tenant.email}
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-slate-700">
                          {tenant.phoneNumber}
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-slate-700">
                          {formatDate(tenant.createdAt)}
                        </td>
                        <td className="px-6 py-4 align-top text-sm">
                          {isActive ? (
                            <span className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-3 py-0.5 text-xs font-medium text-emerald-700">
                              Đang hoạt động
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-0.5 text-xs font-medium text-slate-500">
                              Đã khóa
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white p-1 text-slate-600 hover:bg-slate-50"
                              onClick={() => openEditModal(tenant)}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-full border border-red-100 bg-red-50 p-1 text-red-500 hover:bg-red-100"
                              onClick={() => handleDelete(tenant.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
        </div>
      </div>

      {/* Modal Thêm / Chỉnh sửa Khách Thuê */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-lg border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h2 className="text-base font-semibold text-slate-900">
                {modalMode === "create"
                  ? "Thêm khách thuê mới"
                  : "Chỉnh sửa khách thuê"}
              </h2>
              <button
                type="button"
                className="p-1 text-slate-500 hover:text-slate-700"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form className="px-5 py-4 space-y-4" onSubmit={handleFormSubmit}>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  name="fullName"
                  value={formTenant.fullName}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  placeholder="Nhập họ tên khách thuê"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  name="email"
                  type="email"
                  value={formTenant.email}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Số điện thoại
                </label>
                <input
                  name="phoneNumber"
                  value={formTenant.phoneNumber}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  placeholder="VD: 0909123456"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Trạng thái
                </label>
                <select
                  name="status"
                  value={formTenant.status}
                  onChange={handleFormChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 bg-white"
                >
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Đã khóa</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                  onClick={() => setIsModalOpen(false)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
                >
                  {modalMode === "create"
                    ? "Lưu khách thuê"
                    : "Cập nhật khách thuê"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantsPage;
