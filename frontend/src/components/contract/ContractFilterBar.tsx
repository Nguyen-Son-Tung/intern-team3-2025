import React from "react";
import { House } from "@/types/property";
import { ContractStatus } from "@/types/contract";

interface Props {
  houses: House[];
  selectedHouseId: number | null;
  onSelectHouse: (id: number) => void;
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusChange: (val: string) => void;
}

export default function ContractFilterBar({
  houses,
  selectedHouseId,
  onSelectHouse,
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
}: Props) {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border mb-6 flex flex-col md:flex-row gap-4 items-end justify-between">
      <div className="flex flex-col md:flex-row gap-4 w-full">
        {/* Chọn Nhà */}
        <div className="w-full md:w-64">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Nhà trọ</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={selectedHouseId || ""}
            onChange={(e) => onSelectHouse(Number(e.target.value))}
          >
            {houses.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>

        {/* Tìm kiếm */}
        <div className="w-full md:w-64">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Tìm kiếm</label>
          <input
            type="text"
            placeholder="Tên phòng hoặc tên khách..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Trạng thái */}
        <div className="w-full md:w-48">
          <label className="block text-xs font-semibold text-gray-500 mb-1">Trạng thái</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            value={statusFilter}
            onChange={(e) => onStatusChange(e.target.value)}
          >
            <option value="ALL">Tất cả</option>
            <option value={ContractStatus.Active}>Hoạt động</option>
            <option value={ContractStatus.Ended}>Kết thúc</option>
          </select>
        </div>
      </div>
    </div>
  );
}
