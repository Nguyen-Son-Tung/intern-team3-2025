"use client";

import React, { useState, useEffect, useMemo } from "react";
import { MonthlyReading, ReadingStatus } from "@/types/monthlyReading";
import { getAllMonthlyReadings, sendRemindSubmission, triggerNewCycleNotification } from "@/services/monthlyReadingService";
import { triggerAutoInvoice } from "@/services/invoiceService";
import UtilityReadingDetailModal from "@/components/monthlyReading/UtilityReadingDetailModal";
import ReadingStats from "@/components/monthlyReading/ReadingStats";
import ReadingFilterBar from "@/components/monthlyReading/ReadingFilterBar";
import ReadingTable from "@/components/monthlyReading/ReadingTable";
import ConfirmModal from "@/components/common/ConfirmModal";
import { Info } from "lucide-react";

export default function OwnerUtilitiesPage() {
  const [readings, setReadings] = useState<MonthlyReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"ALL" | ReadingStatus>("ALL");

  // State thời gian
  const [selectedMonth, setSelectedMonth] = useState<number | "ALL">(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const [selectedHouseName, setSelectedHouseName] = useState<string>("ALL");
  const [selectedReading, setSelectedReading] = useState<MonthlyReading | null>(null);

  // State xử lý hành động
  const [actionType, setActionType] = useState<"REMIND_SUBMISSION" | "NEW_CYCLE" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTriggeringAutoInvoice, setIsTriggeringAutoInvoice] = useState(false);

  // --- STATE POPUP THÔNG BÁO ---
  const [popup, setPopup] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "success" | "error" | "warning";
  }>({ isOpen: false, title: "", message: "", type: "success" });

  const closePopup = () => setPopup(prev => ({ ...prev, isOpen: false }));
  const showSuccess = (msg: string) => setPopup({ isOpen: true, title: "Thành công", message: msg, type: "success" });
  const showError = (msg: string) => setPopup({ isOpen: true, title: "Lỗi", message: msg, type: "error" });
  const showWarning = (msg: string) => setPopup({ isOpen: true, title: "Lưu ý", message: msg, type: "warning" });

  // --- LOGIC: TẠO DANH SÁCH NĂM ĐỘNG ---
  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = 2020;
    const endYear = currentYear + 5;
    const list = [];
    for (let y = startYear; y <= endYear; y++) {
      list.push(y);
    }
    return list;
  }, []);

  // --- Helper: Tính toán trạng thái ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calculateStatus = (item: any): ReadingStatus => {
    if (item.status === 1 || item.status === "Confirmed" || item.status === "confirmed") {
      return "Confirmed";
    }
    const readingDate = new Date(item.createdAt || item.CreatedAt);
    const rMonth = readingDate.getMonth() + 1;
    const rYear = readingDate.getFullYear();
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const currentDay = now.getDate();
    const DEADLINE_DAY = 20;

    if (rYear < currentYear) return "Overdue";
    if (rYear === currentYear && rMonth < currentMonth) return "Overdue";
    if (rYear === currentYear && rMonth === currentMonth && currentDay > DEADLINE_DAY) return "Overdue";

    return "Pending";
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawData: any[] = await getAllMonthlyReadings();

        const mappedData: MonthlyReading[] = rawData.map((item) => ({
          id: item.id || item.Id,
          cycleId: item.cycleId || item.CycleId,
          houseName: item.houseName || item.HouseName,
          roomName: item.roomName || item.RoomName,
          floor: item.floor || item.Floor,
          tenantName: item.tenantName || item.TenantName,
          tenantContractId: item.tenantContractId || item.TenantContractId,
          status: calculateStatus(item),
          electricOld: item.electricOld || item.ElectricOld || 0,
          electricNew: item.electricNew || item.ElectricNew || 0,
          electricPhotoUrl: item.electricPhotoUrl || item.ElectricPhotoUrl,
          waterOld: item.waterOld || item.WaterOld || 0,
          waterNew: item.waterNew || item.WaterNew || 0,
          waterPhotoUrl: item.waterPhotoUrl || item.WaterPhotoUrl,
          createdAt: item.createdAt || item.CreatedAt,
          updatedAt: item.updatedAt || item.UpdatedAt,
        }));

        setReadings(mappedData);
      } catch (error) {
        console.error("Lỗi tải chỉ số từ API:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const uniqueHouses = useMemo(() => {
    const allHouseNames = readings.map((r) => r.houseName).filter((name): name is string => !!name);
    return Array.from(new Set(allHouseNames)).sort();
  }, [readings]);

  const filteredReadings = useMemo(() => {
    return readings.filter((reading) => {
      let matchStatus = true;
      if (statusFilter !== "ALL") matchStatus = reading.status === statusFilter;

      const matchHouse = selectedHouseName === "ALL" || reading.houseName === selectedHouseName;

      let matchDate = true;
      if (reading.createdAt) {
        const date = new Date(reading.createdAt);
        const rMonth = date.getMonth() + 1;
        const rYear = date.getFullYear();
        const matchMonth = selectedMonth === "ALL" || rMonth === Number(selectedMonth);
        const matchYear = rYear === Number(selectedYear);
        matchDate = matchMonth && matchYear;
      }
      return matchStatus && matchHouse && matchDate;
    });
  }, [readings, statusFilter, selectedHouseName, selectedMonth, selectedYear]);

  const stats = useMemo(() => {
    return {
      countConfirmed: filteredReadings.filter((i) => i.status === "Confirmed").length,
      countNotSubmitted: filteredReadings.filter((i) => i.status === "Pending" || i.status === "Overdue").length,
      countOverdue: filteredReadings.filter((i) => i.status === "Overdue").length,
      totalRooms: filteredReadings.length,
    };
  }, [filteredReadings]);

  const isCurrentMonthView = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    return Number(selectedMonth) === currentMonth && Number(selectedYear) === currentYear;
  }, [selectedMonth, selectedYear]);

  // --- HANDLER: Mở Modal ---

  const openRemindModal = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!isCurrentMonthView) {
      showWarning("Bạn chỉ có thể gửi nhắc nhở cho kỳ thu tiền hiện tại.");
      return;
    }
    if (stats.countNotSubmitted === 0) return;
    setActionType("REMIND_SUBMISSION");
  };

  const openNewCycleModal = () => {
    setActionType("NEW_CYCLE");
  };

  // --- HANDLER: Thực thi hành động ---
  const handleConfirmAction = async () => {
    if (!actionType) return;
    setIsProcessing(true);

    try {
      let success = false;

      if (actionType === "REMIND_SUBMISSION") {
        success = await sendRemindSubmission();
        setActionType(null); 
        if (success) showSuccess(`Đã gửi thông báo nhắc nộp đến các phòng chưa hoàn thành.`);
        else showError("Gửi thất bại. Vui lòng thử lại.");
      }
      else if (actionType === "NEW_CYCLE") {
        const now = new Date();
        success = await triggerNewCycleNotification(now.getMonth() + 1, now.getFullYear());
        setActionType(null);
        if (success) showSuccess(`Đã phát động chu kỳ mới và gửi thông báo cho cư dân.`);
        else showError("Có lỗi xảy ra (Có thể chu kỳ đã tồn tại).");
      }

    } catch (error) {
      console.error(error);
      showError("Lỗi kết nối máy chủ.");
      setActionType(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTriggerAutoInvoice = async () => {
    try {
      setIsTriggeringAutoInvoice(true);
      const result = await triggerAutoInvoice();
      if (result.success) {
        showSuccess("Đã cập nhật hóa đơn thành công.");
      } else {
        showError(`Lỗi: ${result.message}`);
      }
    } catch (error) {
      console.error(error);
      showError("Lỗi kết nối máy chủ.");
    } finally {
      setIsTriggeringAutoInvoice(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen text-gray-800">
      <div className="flex flex-col gap-6">
        {/* Header Title & Manual Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">Quản lý Chỉ số Điện Nước</h2>
            <p className="text-gray-500 text-sm">
              Thống kê tháng {selectedMonth === "ALL" ? "Tất cả" : selectedMonth}/{selectedYear}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
            <div className="relative group flex items-center justify-center h-full hidden sm:flex">
              <Info className="w-5 h-6 text-gray-500 cursor-pointer hover:text-gray-700 transition" />
              <div className="absolute left-1/2 bottom-full transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-60">
                <p>Nếu như tháng này các khách đã được tạo bản nộp chỉ số thì sẽ được bỏ qua.</p>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-gray-800"></div>
              </div>
            </div>
            
            <button
              onClick={handleTriggerAutoInvoice}
              disabled={isTriggeringAutoInvoice}
              className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition shadow flex items-center justify-center gap-2"
            >
              {isTriggeringAutoInvoice ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : null}
              {isTriggeringAutoInvoice ? "Đang tạo..." : "Tạo hóa đơn tự động"}
            </button>
            <button
              onClick={openNewCycleModal}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition shadow flex items-center justify-center gap-2"
            >
              Tạo kỳ thu tiền mới
            </button>
          </div>
        </div>

        {/* Component Thống kê */}
        <ReadingStats
          stats={stats}
          isCurrentMonthView={isCurrentMonthView}
          onRemindAllPending={openRemindModal}
          isLoading={isProcessing && actionType === "REMIND_SUBMISSION"}
        />
      </div>

      <ReadingFilterBar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        selectedHouseName={selectedHouseName}
        setSelectedHouseName={setSelectedHouseName}
        uniqueHouses={uniqueHouses}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedYear={selectedYear}
        setSelectedYear={setSelectedYear}
        years={years}
      />

      <ReadingTable
        loading={loading}
        readings={filteredReadings}
        onSelectReading={setSelectedReading}
      />

      {selectedReading && (
        <UtilityReadingDetailModal reading={selectedReading} onClose={() => setSelectedReading(null)} />
      )}

      <ConfirmModal
        isOpen={!!actionType}
        onClose={() => !isProcessing && setActionType(null)}
        onConfirm={handleConfirmAction}
        isLoading={isProcessing}
        title={actionType === "NEW_CYCLE" ? "Nhắc kỳ mới" : "Nhắc nộp chỉ số"}
        message={
          actionType === "NEW_CYCLE"
            ? `Bạn có chắc chắn muốn tạo chu kỳ mới cho tháng hiện tại và gửi thông báo đến tất cả?`
            : `Gửi nhắc nhở đến ${stats.countNotSubmitted} phòng chưa nộp chỉ số?`
        }
        confirmText="Xác nhận gửi"
        cancelText="Hủy bỏ"
      />

      <ConfirmModal 
        isOpen={popup.isOpen}
        onClose={closePopup} 
        onConfirm={closePopup}
        title={popup.title}
        message={popup.message}
        confirmText="Đóng"
        hideCancel={true}
      />
    </div>
  );
}