"use client";
import React from "react";
import { MonthlyReading } from "@/types/monthlyReading";

interface ReadingTableProps {
  loading: boolean;
  readings: MonthlyReading[];
  onSelectReading: (reading: MonthlyReading) => void;
}

export default function ReadingTable({ loading, readings, onSelectReading }: ReadingTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px] md:min-w-full">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
            <tr>
              <th className="p-3 md:p-4 border-b whitespace-nowrap w-12 text-center">STT</th>
              <th className="p-3 md:p-4 border-b whitespace-nowrap w-1/12">NHÀ</th>
              <th className="p-3 md:p-4 border-b whitespace-nowrap w-1/12">PHÒNG</th>
              <th className="p-3 md:p-4 border-b whitespace-nowrap w-16 text-center">TẦNG</th>
              <th className="p-3 md:p-4 border-b whitespace-nowrap w-2/12">KHÁCH THUÊ</th>
              <th className="p-3 md:p-4 border-b whitespace-nowrap w-2/12 text-center">CHỈ SỐ (MỚI)</th>
              <th className="p-3 md:p-4 border-b whitespace-nowrap w-1/12 text-center">TRẠNG THÁI</th>
              <th className="p-3 md:p-4 border-b whitespace-nowrap w-1/12 text-center">HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {readings.length > 0 ? (
              readings.map((reading, index) => (
                <tr
                  key={reading.id}
                  className="hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    if (reading.status === "Confirmed") onSelectReading(reading);
                  }}
                  style={{ cursor: reading.status === "Confirmed" ? "pointer" : "default" }}
                >
                  <td className="p-3 md:p-4 font-mono text-gray-500 text-center">{index + 1}</td>
                  <td className="p-3 md:p-4 text-gray-600 whitespace-nowrap">{reading.houseName || "Chưa cập nhật"}</td>
                  <td className="p-3 md:p-4 font-medium text-blue-600 whitespace-nowrap">{reading.roomName || "N/A"}</td>
                  <td className="p-3 md:p-4 text-gray-600 text-center">{reading.floor}</td>
                  <td className="p-3 md:p-4 text-gray-900 whitespace-nowrap">{reading.tenantName || "Trống"}</td>

                  <td className="p-3 md:p-4 text-center text-xs whitespace-nowrap">
                    {reading.status === "Confirmed" ? (
                      <div className="flex flex-col gap-1 items-center">
                        <span className="text-amber-600 font-semibold">Điện: {reading.electricNew}</span>
                        <span className="text-blue-600 font-semibold">Nước: {reading.waterNew}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>

                  <td className="p-3 md:p-4 text-center whitespace-nowrap">
                    {reading.status === "Confirmed" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Đã nộp
                      </span>
                    )}
                    {reading.status === "Pending" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Chờ nộp
                      </span>
                    )}
                    {reading.status === "Overdue" && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Quá hạn
                      </span>
                    )}
                  </td>

                  <td className="p-3 md:p-4 text-center whitespace-nowrap">
                    {reading.status === "Confirmed" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectReading(reading);
                        }}
                        className="text-blue-600 text-xs font-semibold hover:text-blue-800 transition"
                      >
                        Chi tiết
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="p-10 text-center text-gray-400">
                  Không tìm thấy chỉ số điện nước nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}