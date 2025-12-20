"use client";

import { useEffect, useState, useMemo } from "react";
import { getMyInvoices, remindAllUnpaid, triggerInvoiceVisibility } from "@/services/invoiceService";
import { Invoice, InvoiceApiParams } from "@/types/invoice";
import InvoiceDetailModal from "@/components/invoice/InvoiceDetailModal";
import InvoiceStats from "@/components/invoice/InvoiceStats";
import InvoiceFilters from "@/components/invoice/InvoiceFilters";
import InvoiceTable from "@/components/invoice/InvoiceTable";
import InvoicePagination from "@/components/invoice/InvoicePagination";
import ConfirmModal from "@/components/common/ConfirmModal"; 

export default function OwnerInvoicesPage() {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalInvoices, setTotalInvoices] = useState(0);
    const pageSize = 20;

    // --- STATE BỘ LỌC ---
    const [statusFilter, setStatusFilter] = useState<"ALL" | "UNPAID" | "OVERDUE" | "PAID">("ALL");
    const [selectedMonth, setSelectedMonth] = useState<number | "ALL">(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedHouseName, setSelectedHouseName] = useState<string>("ALL");

    // --- STATE UI KHÁC ---
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isRemindingAll, setIsRemindingAll] = useState(false);
    const [isTriggeringVisibility, setIsTriggeringVisibility] = useState(false);
    
    // State Modal Xác nhận Nhắc nợ
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // --- STATE POPUP THÔNG BÁO ---
    const [popup, setPopup] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "success" | "error" | "info";
    }>({ isOpen: false, title: "", message: "", type: "info" });

    const closePopup = () => setPopup(prev => ({ ...prev, isOpen: false }));
    const showSuccess = (msg: string) => setPopup({ isOpen: true, title: "Thành công", message: msg, type: "success" });
    const showError = (msg: string) => setPopup({ isOpen: true, title: "Lỗi", message: msg, type: "error" });

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const params: InvoiceApiParams = { page: currentPage, pageSize };
                if (statusFilter !== "ALL") params.status = statusFilter;
                if (selectedYear) params.year = selectedYear;
                if (selectedMonth !== "ALL") params.month = selectedMonth;

                const data = await getMyInvoices(params);
                setInvoices(data);
                setTotalPages(Math.ceil(data.length / pageSize) || 1);
                setTotalInvoices(data.length);
            } catch (error) {
                console.error("Lỗi tải hóa đơn:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [currentPage, statusFilter, selectedMonth, selectedYear]);

    // --- DỮ LIỆU TÍNH TOÁN ---
    const uniqueHouses = useMemo(() => {
        const allHouseNames = invoices.map(inv => inv.houseName).filter((name): name is string => !!name);
        return Array.from(new Set(allHouseNames)).sort();
    }, [invoices]);

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            let matchStatus = true;
            if (statusFilter === "UNPAID") matchStatus = inv.status === "Unpaid";
            if (statusFilter === "OVERDUE") matchStatus = inv.status === "Overdue";
            if (statusFilter === "PAID") matchStatus = inv.status === "Paid";

            const invDate = new Date(inv.invoiceDate);
            const matchYear = invDate.getFullYear() === selectedYear;
            const matchMonth = selectedMonth === "ALL" || (invDate.getMonth() + 1) === selectedMonth;
            const matchHouse = selectedHouseName === "ALL" || inv.houseName === selectedHouseName;

            return matchStatus && matchYear && matchMonth && matchHouse;
        });
    }, [invoices, statusFilter, selectedYear, selectedMonth, selectedHouseName]);

    const stats = useMemo(() => ({
        totalCollected: filteredInvoices.filter(i => i.status === "Paid").reduce((acc, cur) => acc + cur.totalAmount, 0),
        totalPending: filteredInvoices.filter(i => i.status !== "Paid").reduce((acc, cur) => acc + cur.totalAmount, 0),
        countUnpaid: filteredInvoices.filter(i => i.status === "Unpaid").length,
        countOverdue: filteredInvoices.filter(i => i.status === "Overdue").length,
    }), [filteredInvoices]);

    const countRemindable = stats.countUnpaid + stats.countOverdue;

    // --- HANDLERS ---

    const openRemindModal = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        if (countRemindable === 0 || isRemindingAll) return;
        setShowConfirmModal(true); 
    }

    const executeRemindAll = async () => {
        try {
            setIsRemindingAll(true); 
            const success = await remindAllUnpaid();
            setShowConfirmModal(false);

            if (success) {
                showSuccess(`Đã gửi lệnh nhắc nợ thành công đến hệ thống.`);
            } else {
                showError("Có lỗi xảy ra khi gửi lệnh nhắc nợ. Vui lòng thử lại.");
            }
        } catch (error) {
            console.error(error);
            setShowConfirmModal(false);
            showError("Lỗi kết nối máy chủ.");
        } finally {
            setIsRemindingAll(false);
        }
    }

    const handleTriggerVisibility = async () => {
        try {
            setIsTriggeringVisibility(true);
            const result = await triggerInvoiceVisibility();
            if (result.success) {
                showSuccess("Đã cập nhật trạng thái hiển thị hóa đơn thành công.");
                
                // Refresh data
                const params: InvoiceApiParams = { page: currentPage, pageSize };
                if (statusFilter !== "ALL") params.status = statusFilter;
                if (selectedYear) params.year = selectedYear;
                if (selectedMonth !== "ALL") params.month = selectedMonth;

                const data = await getMyInvoices(params);
                setInvoices(data);
                setTotalPages(Math.ceil(data.length / pageSize) || 1);
                setTotalInvoices(data.length);
            } else {
                showError(`Lỗi: ${result.message}`);
            }
        } catch (error) {
            console.error(error);
            showError("Lỗi kết nối máy chủ.");
        } finally {
            setIsTriggeringVisibility(false);
        }
    };

    return (
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen text-gray-800">
            <div className="flex flex-col gap-6">
                
                {/* --- HEADER --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Quản lý hóa đơn</h2>
                        <p className="text-gray-500 text-sm">
                            Hóa đơn tháng {selectedMonth === "ALL" ? "Tất cả" : selectedMonth}/{selectedYear}
                        </p>
                    </div>

                    <button
                        onClick={handleTriggerVisibility}
                        disabled={isTriggeringVisibility}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm font-medium text-sm transition-all"
                    >
                        {isTriggeringVisibility ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : null}
                        {isTriggeringVisibility ? "Đang cập nhật..." : "Hiển thị hóa đơn"}
                    </button>
                </div>

                <InvoiceStats 
                    stats={stats} 
                    countRemindable={countRemindable} 
                    isRemindingAll={isRemindingAll} 
                    onRemindAll={openRemindModal} 
                />
            </div>

            <InvoiceFilters
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                selectedHouseName={selectedHouseName}
                setSelectedHouseName={setSelectedHouseName}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                uniqueHouses={uniqueHouses}
                onFilterChange={() => setCurrentPage(1)}
            />

            <InvoiceTable 
                invoices={filteredInvoices} 
                loading={loading} 
                onSelectInvoice={setSelectedInvoice} 
            />

            <InvoicePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalInvoices={totalInvoices}
                pageSize={pageSize}
                loading={loading}
                onPageChange={setCurrentPage}
            />

            {selectedInvoice && (
                <InvoiceDetailModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} role="Owner" />
            )}

            {/* Modal Xác nhận Nhắc nợ */}
            <ConfirmModal 
                isOpen={showConfirmModal}
                onClose={() => !isRemindingAll && setShowConfirmModal(false)} 
                onConfirm={executeRemindAll}
                title="Xác nhận nhắc thanh toán"
                message={`Gửi nhắc nhở thanh toán đến ${countRemindable} khách thuê?`}
                isLoading={isRemindingAll}
                confirmText="Gửi thông báo"
                cancelText="Quay lại"
            />

            {/* Modal Thông báo */}
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