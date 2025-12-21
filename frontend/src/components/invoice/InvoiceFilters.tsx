"use client";

import { useMemo } from "react";

interface InvoiceFiltersProps {
    statusFilter: string;
    setStatusFilter: (status: "ALL" | "UNPAID" | "OVERDUE" | "PAID") => void;
    selectedHouseName: string;
    setSelectedHouseName: (name: string) => void;
    selectedMonth: number | "ALL";
    setSelectedMonth: (month: number | "ALL") => void;
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    uniqueHouses: string[];
    onFilterChange: () => void; 
}

export default function InvoiceFilters({
    statusFilter, setStatusFilter,
    selectedHouseName, setSelectedHouseName,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    uniqueHouses,
    onFilterChange
}: InvoiceFiltersProps) {

    const years = useMemo(() => {
        return Array.from({ length: 6 }, (_, i) => 2020 + i);
    }, []);

    const handleStatusChange = (status: "ALL" | "UNPAID" | "OVERDUE" | "PAID") => {
        setStatusFilter(status);
        onFilterChange();
    };

    return (
        <div className="flex flex-col xl:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border items-start xl:items-center justify-between">
            {/* Bộ lọc Trạng thái */}
            <div className="flex bg-gray-100 p-1 rounded-md overflow-x-auto w-full xl:w-auto scrollbar-hide">
                {[
                    { key: "ALL", label: "Tất cả", activeClass: "text-gray-900", baseClass: "text-gray-500" },
                    { key: "UNPAID", label: "Chưa thanh toán", activeClass: "text-orange-600", baseClass: "text-gray-500" },
                    { key: "PAID", label: "Đã thanh toán", activeClass: "text-green-600", baseClass: "text-gray-500" }
                ].map((item) => (
                    <button
                        key={item.key}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        onClick={() => handleStatusChange(item.key as any)}
                        className={`px-3 py-2 rounded text-sm font-medium transition-colors whitespace-nowrap flex-1 md:flex-none text-center ${
                            statusFilter === item.key 
                            ? `bg-white shadow-sm ${item.activeClass}` 
                            : `${item.baseClass} hover:text-gray-700`
                        }`}
                    >
                        {item.label}
                    </button>
                ))}
            </div>

            {/* Các Dropdown select */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 w-full xl:w-auto">
                <select 
                    value={selectedHouseName} 
                    onChange={(e) => setSelectedHouseName(e.target.value)} 
                    className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full sm:w-auto min-w-[150px]"
                >
                    <option value="ALL">Tất cả các Nhà</option>
                    {uniqueHouses.map((name, index) => (<option key={index} value={name}>{name}</option>))}
                </select>

                <select
                    value={selectedMonth}
                    onChange={(e) => {
                        setSelectedMonth(e.target.value === "ALL" ? "ALL" : Number(e.target.value));
                        onFilterChange();
                    }}
                    className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full sm:w-auto"
                >
                    <option value="ALL">Cả năm</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (<option key={m} value={m}>Tháng {m}</option>))}
                </select>

                <select
                    value={selectedYear}
                    onChange={(e) => {
                        setSelectedYear(Number(e.target.value));
                        onFilterChange();
                    }}
                    className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white w-full sm:w-auto"
                >
                    {years.map(y => (<option key={y} value={y}>{y}</option>))}
                </select>
            </div>
        </div>
    );
}