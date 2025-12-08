"use client";

import React, { useMemo, useState } from "react";
import { Search, Plus, Eye, Trash2, X } from "lucide-react";

// ====== TYPES ======
type TenantStatus = "active" | "inactive";
type ContractStatus = "active" | "expired";

type Tenant = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  status: TenantStatus;
  createdAt: string;
};

type Contract = {
  id: number;
  code: string;
  propertyName: string;
  houseName: string;
  tenantId: number;
  startDate: string;
  endDate: string;
  rentPrice: number;
  status: ContractStatus;
};

type SortKey =
  | "code"
  | "propertyName"
  | "startDate"
  | "endDate"
  | "rentPrice"
  | "status";

type SortDirection = "asc" | "desc";

type SortConfig = {
  key: SortKey;
  direction: SortDirection;
};

type FormContractState = {
  id?: number;
  code: string;
  propertyName: string;
  houseName: string;
  tenantId: string; // select binding
  startDate: string;
  endDate: string;
  rentPrice: string; // input number -> string
  status: ContractStatus;
};

// ====== MOCK USERS (ROLE = TENANT) ======
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

// ====== MOCK CONTRACTS (LINK TỚI TENANT BẰNG tenantId) ======
const CONTRACTS_DB: Contract[] = [
  {
    id: 1,
    code: "HD_001",
    propertyName: "Phòng 101",
    houseName: "Nhà An Phú",
    tenantId: 1,
    startDate: "2024-11-01",
    endDate: "2025-11-01",
    rentPrice: 3000000,
    status: "active",
  },
  {
    id: 2,
    code: "HD_002",
    propertyName: "Căn hộ A1",
    houseName: "Mini House",
    tenantId: 2,
    startDate: "2024-12-01",
    endDate: "2025-01-10",
    rentPrice: 4500000,
    status: "active",
  },
  {
    id: 3,
    code: "HD_003",
    propertyName: "Phòng 201",
    houseName: "Nhà An Phú",
    tenantId: 3,
    startDate: "2023-01-01",
    endDate: "2024-01-01",
    rentPrice: 2800000,
    status: "expired",
  },
];

function formatCurrency(value: number | null | undefined): string {
  if (value == null) return "-";
  return value.toLocaleString("vi-VN") + " đ";
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

export default function TenantContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>(CONTRACTS_DB);
  const [search, setSearch] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "code",
    direction: "asc",
  });

  const [tenants] = useState<Tenant[]>(TENANTS_DB);

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [formContract, setFormContract] = useState<FormContractState>({
    id: undefined,
    code: "",
    propertyName: "",
    houseName: "",
    tenantId: "",
    startDate: "",
    endDate: "",
    rentPrice: "",
    status: "active",
  });

  const today = new Date();

  // ====== STATS (for...of theo SonarLint) ======
  const stats = useMemo(() => {
    let active = 0;
    let nearlyExpired = 0;
    const now = new Date();

    for (const c of contracts) {
      if (c.status === "active") {
        active += 1;
        if (c.endDate) {
          const end = new Date(c.endDate);
          const diffDay =
            (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          const isFiniteDiff = Number.isFinite(diffDay);
          if (isFiniteDiff && diffDay >= 0 && diffDay <= 30) {
            nearlyExpired += 1;
          }
        }
      }
    }

    return { active, nearlyExpired };
  }, [contracts]);

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

  // ====== SORT KHÔNG DÙNG any ======
  const sortedContracts = useMemo<Contract[]>(() => {
    const data = [...contracts];

    data.sort((a, b) => {
      const { key, direction } = sortConfig;
      let valA: string | number = "";
      let valB: string | number = "";

      switch (key) {
        case "startDate":
          valA = new Date(a.startDate).getTime();
          valB = new Date(b.startDate).getTime();
          break;
        case "endDate":
          valA = new Date(a.endDate).getTime();
          valB = new Date(b.endDate).getTime();
          break;
        case "rentPrice":
          valA = a.rentPrice;
          valB = b.rentPrice;
          break;
        case "propertyName":
          valA = (a.propertyName ?? "").toLowerCase();
          valB = (b.propertyName ?? "").toLowerCase();
          break;
        case "status":
          valA = (a.status ?? "").toLowerCase();
          valB = (b.status ?? "").toLowerCase();
          break;
        case "code":
        default:
          valA = (a.code ?? "").toLowerCase();
          valB = (b.code ?? "").toLowerCase();
          break;
      }

      if (valA < valB) return direction === "asc" ? -1 : 1;
      if (valA > valB) return direction === "asc" ? 1 : -1;
      return 0;
    });

    return data;
  }, [contracts, sortConfig]);

  function renderSortIndicator(columnKey: SortKey) {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === "asc" ? " ↑" : " ↓";
  }

  // ====== FILTER + SEARCH ======
  const filteredContracts = useMemo<Contract[]>(() => {
    if (!search.trim()) return sortedContracts;

    const lower = search.toLowerCase();
    return sortedContracts.filter((c) => {
      const tenant = tenants.find((t) => t.id === c.tenantId);
      const tenantName = tenant?.fullName || "";
      const tenantPhone = tenant?.phoneNumber || "";

      return (
        c.code.toLowerCase().includes(lower) ||
        c.propertyName.toLowerCase().includes(lower) ||
        c.houseName.toLowerCase().includes(lower) ||
        tenantName.toLowerCase().includes(lower) ||
        tenantPhone.toLowerCase().includes(lower)
      );
    });
  }, [sortedContracts, search, tenants]);

  // ====== DELETE: dùng globalThis theo SonarLint ======
  function handleDelete(id: number) {
    const target = contracts.find((c) => c.id === id);
    if (!target) return;

    type GlobalWithConfirm = typeof globalThis & {
      confirm?: (message?: string) => boolean;
    };

    const globalWithConfirm = globalThis as GlobalWithConfirm;
    const confirmFn = globalWithConfirm.confirm;

    const ok = confirmFn
      ? confirmFn(`Bạn có chắc chắn muốn xóa hợp đồng ${target.code}?`)
      : true;

    if (!ok) return;

    setContracts((prev) => prev.filter((c) => c.id !== id));
  }

  function openCreateModal() {
    setModalMode("create");
    setFormContract({
      id: undefined,
      code: "",
      propertyName: "",
      houseName: "",
      tenantId: "",
      startDate: "",
      endDate: "",
      rentPrice: "",
      status: "active",
    });
    setIsModalOpen(true);
  }

  function openEditModal(contract: Contract) {
    setModalMode("edit");
    setFormContract({
      id: contract.id,
      code: contract.code,
      propertyName: contract.propertyName,
      houseName: contract.houseName,
      tenantId: contract.tenantId ? String(contract.tenantId) : "",
      startDate: contract.startDate,
      endDate: contract.endDate,
      rentPrice: contract.rentPrice.toString(),
      status: contract.status,
    });
    setIsModalOpen(true);
  }

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setFormContract((prev) => ({ ...prev, [name]: value }));
  }

  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!formContract.code.trim()) {
      alert("Vui lòng nhập Mã hợp đồng.");
      return;
    }

    if (!formContract.tenantId) {
      alert("Vui lòng chọn Khách thuê (user role TENANT).");
      return;
    }

    const tenantId = Number(formContract.tenantId);
    const rentPriceNum = Number(formContract.rentPrice || 0);

    if (Number.isNaN(tenantId)) {
      alert("Tenant không hợp lệ.");
      return;
    }

    if (modalMode === "create") {
      const maxId = contracts.length
        ? Math.max(...contracts.map((c) => c.id))
        : 0;

      const newContract: Contract = {
        id: maxId + 1,
        code: formContract.code.trim(),
        propertyName: formContract.propertyName.trim(),
        houseName: formContract.houseName.trim(),
        tenantId,
        startDate: formContract.startDate || "",
        endDate: formContract.endDate || "",
        rentPrice: rentPriceNum,
        status: formContract.status,
      };

      setContracts((prev) => [...prev, newContract]);
    } else {
      setContracts((prev) =>
        prev.map((c) => {
          if (c.id !== formContract.id) return c;
          return {
            ...c,
            code: formContract.code.trim(),
            propertyName: formContract.propertyName.trim(),
            houseName: formContract.houseName.trim(),
            tenantId,
            startDate: formContract.startDate || "",
            endDate: formContract.endDate || "",
            rentPrice: rentPriceNum,
            status: formContract.status,
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
          Danh sách Hợp đồng
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Quản lý hiệu lực và hồ sơ thuê phòng (liên kết User role Tenant)
        </p>
      </div>

      {/* Nội dung */}
      <div className="flex-1 px-8 py-6 space-y-4">
        {/* Cards + Search */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
          <div className="flex flex-1 gap-4">
            {/* Card Đang hiệu lực */}
            <div className="flex-1 rounded-xl bg-white shadow-sm border border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">Đang hiệu lực</p>
              <p className="mt-2 text-3xl font-semibold text-emerald-600">
                {stats.active}
              </p>
            </div>

            {/* Card Sắp hết hạn */}
            <div className="flex-1 rounded-xl bg-white shadow-sm border border-slate-200 px-5 py-4">
              <p className="text-sm text-slate-500">
                Sắp hết hạn <span className="text-xs">(30 ngày)</span>
              </p>
              <p className="mt-2 text-3xl font-semibold text-amber-500">
                {stats.nearlyExpired}
              </p>
            </div>
          </div>

          {/* Search + Tạo hợp đồng */}
          <div className="flex flex-col gap-3 lg:w-96">
            <div className="relative">
              <Search className="absolute.left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="contract-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-full border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none ring-0 focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                placeholder="Tìm mã HĐ, phòng, tên khách thuê, SĐT..."
              />
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-sky-600"
              onClick={openCreateModal}
            >
              <Plus className="h-4 w-4" />
              Tạo Hợp Đồng
            </button>
          </div>
        </div>

        {/* Bảng hợp đồng */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-500 cursor-pointer select-none"
                    onClick={() => handleSort("code")}
                  >
                    MÃ HĐ{renderSortIndicator("code")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-500 cursor-pointer select-none"
                    onClick={() => handleSort("propertyName")}
                  >
                    PHÒNG / NHÀ{renderSortIndicator("propertyName")}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500">
                    KHÁCH THUÊ
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-500 cursor-pointer select-none"
                    onClick={() => handleSort("startDate")}
                  >
                    THỜI HẠN{renderSortIndicator("startDate")}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-500.cursor-pointer select-none"
                    onClick={() => handleSort("rentPrice")}
                  >
                    GIÁ THUÊ{renderSortIndicator("rentPrice")}
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
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-6 text-center text-sm text-slate-400"
                    >
                      Không tìm thấy hợp đồng nào phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => {
                    const tenant = tenants.find(
                      (t) => t.id === contract.tenantId
                    );
                    const tenantName = tenant?.fullName || "—";
                    const tenantPhone = tenant?.phoneNumber || "—";

                    const end = contract.endDate
                      ? new Date(contract.endDate)
                      : null;
                    const diffDay =
                      end != null
                        ? (end.getTime() - today.getTime()) /
                          (1000 * 60 * 60 * 24)
                        : Number.NaN;
                    const isFiniteDiff = Number.isFinite(diffDay);

                    let statusLabel = "Hiệu lực";
                    let statusClass =
                      "bg-emerald-50 text-emerald-700 border-emerald-100";

                    if (contract.status === "expired" || (end && end < today)) {
                      statusLabel = "Hết hạn";
                      statusClass =
                        "bg-amber-50 text-amber-700 border-amber-100";
                    } else if (
                      isFiniteDiff &&
                      diffDay >= 0 &&
                      diffDay <= 30
                    ) {
                      statusLabel = "Sắp hết hạn";
                      statusClass =
                        "bg-orange-50 text-orange-700 border-orange-100";
                    }

                    return (
                      <tr
                        key={contract.id}
                        className="border-b border-slate-100 hover:bg-slate-50/60"
                      >
                        <td className="px-6 py-4 align-top text-sm font-medium text-slate-800">
                          {contract.code}
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-slate-700">
                          <div className="font-medium">
                            {contract.propertyName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {contract.houseName}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-slate-700">
                          <div className="font-medium">{tenantName}</div>
                          <div className="text-xs text-slate-400">
                            {tenantPhone}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-slate-700">
                          <div>{formatDate(contract.startDate)}</div>
                          <div className="text-xs text-sky-500">
                            {formatDate(contract.endDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-slate-700">
                          {formatCurrency(contract.rentPrice)}
                        </td>
                        <td className="px-6 py-4 align-top text-sm">
                          <span
                            className={
                              "inline-flex rounded-full border px-3 py-1 text-xs font-medium " +
                              statusClass
                            }
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 align-top text-sm text-right">
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-sky-600 hover:bg-sky-50"
                              onClick={() => openEditModal(contract)}
                            >
                              <Eye className="h-3 w-3" />
                              Chi tiết
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center justify-center rounded-full border border-red-100 bg-red-50 p-1 text-red-500 hover:bg-red-100"
                              onClick={() => handleDelete(contract.id)}
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

      {/* Modal Tạo / Chỉnh sửa Hợp đồng */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-lg border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
              <h2 className="text-base font-semibold text-slate-900">
                {modalMode === "create"
                  ? "Tạo Hợp Đồng mới"
                  : "Chi tiết / Chỉnh sửa Hợp Đồng"}
              </h2>
              <button
                type="button"
                className="p-1 text-slate-500 hover:text-slate-700"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              className="px-5 py-4 space-y-4 max-h-[80vh] overflow-y-auto"
              onSubmit={handleFormSubmit}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="code"
                    className="text-sm font-medium text-slate-700"
                  >
                    Mã Hợp đồng <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="code"
                    name="code"
                    value={formContract.code}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                    placeholder="VD: HD_004"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="propertyName"
                    className="text-sm font-medium text-slate-700"
                  >
                    Phòng / Căn hộ
                  </label>
                  <input
                    id="propertyName"
                    name="propertyName"
                    value={formContract.propertyName}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                    placeholder="VD: Phòng 101, Căn hộ A1"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="houseName"
                    className="text-sm font-medium text-slate-700"
                  >
                    Tên nhà / tòa
                  </label>
                  <input
                    id="houseName"
                    name="houseName"
                    value={formContract.houseName}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                    placeholder="VD: Nhà An Phú"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="tenantId"
                    className="text-sm font-medium text-slate-700"
                  >
                    Khách thuê (User role Tenant){" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="tenantId"
                    name="tenantId"
                    value={formContract.tenantId}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 bg-white"
                    required
                  >
                    <option value="">-- Chọn khách thuê --</option>
                    {tenants
                      .filter((t) => t.status === "active")
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.phoneNumber})
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="startDate"
                    className="text-sm font-medium text-slate-700"
                  >
                    Ngày bắt đầu
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    name="startDate"
                    value={formContract.startDate}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="endDate"
                    className="text-sm font-medium text-slate-700"
                  >
                    Ngày kết thúc
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    name="endDate"
                    value={formContract.endDate}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="rentPrice"
                    className="text-sm font-medium text-slate-700"
                  >
                    Giá thuê (VND/tháng)
                  </label>
                  <input
                    id="rentPrice"
                    name="rentPrice"
                    type="number"
                    min={0}
                    value={formContract.rentPrice}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                    placeholder="VD: 3000000"
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="status"
                    className="text-sm font-medium text-slate-700"
                  >
                    Trạng thái
                  </label>
                  <select
                    id="status"
                    name="status"
                    value={formContract.status}
                    onChange={handleFormChange}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-200 bg-white"
                  >
                    <option value="active">Hiệu lực</option>
                    <option value="expired">Hết hạn</option>
                  </select>
                </div>
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
                  className="rounded-full bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-600"
                >
                  {modalMode === "create"
                    ? "Lưu Hợp Đồng"
                    : "Cập nhật Hợp Đồng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
