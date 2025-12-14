"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
    getTenantDashboardData,
    formatVND
} from '@/services/tenantDashboardService';

interface TenantViewData {
    houseName: string;
    roomNumber: string;
    contractStatus: string;
    contractEndDate: string;
    isExpiringSoon: boolean;

    totalUnpaidAmount: string;
    unpaidInvoices: {
        invoiceId: number;
        month: string;
        amount: string;
        dueDate: string;
        isOverdue: boolean;
    }[];

    openIncidents: number;
    missingReadings: {
        month: string;
        type: string;
    }[];
}

const TenantInfoCard: React.FC<{ title: string; value: string; className?: string; apiEndpoint: string }> = ({ title, value, className = '' }) => (
    <div className={`bg-white p-5 rounded-xl shadow-lg border-l-4 border-blue-400 ${className}`}>
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className="text-2xl font-bold text-gray-800 mt-1">{value}</div>
    </div>
);

const TenantDashboardPage: React.FC = () => {
    // State lưu dữ liệu hiển thị
    const [data, setData] = useState<TenantViewData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

<<<<<<< HEAD
=======
// Định nghĩa Props cho Component InvoiceCard
interface InvoiceCardProps {
    invoice: Invoice
    setInvoice: (invoice: Invoice | null) => void
}

interface ApproveReadingPayload {
    electric: ReadingValue
    water: ReadingValue
}

interface ReadingValue {
    old: number
    new: number
    img: string
    status: string
}

interface InvoiceData {
    electricQty: number
    waterQty: number
}

interface ReadingCycle {
    month: number
    year: number
    deadline: string
}

/* ============================================
   FAKE API
=============================================== */
const FakeAPI = {
    getCurrentReadingCycle: async () => {
        return {
            month: 1,
            year: 2024,
            deadline: "2024-01-25"
        }
    },

    uploadImage: async (type: "electric" | "water", file: File) => {
        const formData = new FormData()
        formData.append("file", file)

        // GỌI ĐÚNG VÀO BACKEND THẬT
        const url = `http://localhost:5000/api/${type}/upload`

        const res = await fetch(url, {
            method: "POST",
            body: formData
        })

        const data = await res.json()

        if (!res.ok || data.success === false) {
            console.error(`Upload ${type} lỗi:`, data.error)
            throw new Error(data.error || "Upload thất bại")
        }

        // Convert ảnh local để hiển thị
        const imageUrl = URL.createObjectURL(file)

        return {
            imageUrl,
            aiValue: Number(data.reading)
        }
    },

    createInvoice: async (data: InvoiceData) => {
        await new Promise(r => setTimeout(r, 500))
        return {
            id: "inv_fake_001",
            month: "2024-01",
            status: "unpaid",
            items: [
                { name: "Tiền điện", qty: data.electricQty, price: 3500 },
                { name: "Tiền nước", qty: data.waterQty, price: 7000 }
            ]
        }
    },

    payInvoice: async () => {
        await new Promise(r => setTimeout(r, 500))
        return { status: "paid" }
    },

    approveReading: async (payload: ApproveReadingPayload) => {
        await new Promise(r => setTimeout(r, 500))
        return { success: true }
    }
}

/* ============================================
   MAIN COMPONENT
=============================================== */
export default function TenantDashboard() {
    const [cycle, setCycle] = useState<ReadingCycle | null>(null)
    const [uploadingElec, setUploadingElec] = useState(false)
    const [uploadingWater, setUploadingWater] = useState(false)
    const [electric, setElectric] = useState<ReadingValue>({
        old: 18050,
        new: 0,
        img: "",
        status: "pending"
    })

    const [water, setWater] = useState<ReadingValue>({
        old: 1850,
        new: 0,
        img: "",
        status: "pending"
    })

    const [invoice, setInvoice] = useState<Invoice | null>(null)
    /* LOAD KỲ THU */
>>>>>>> b43a51d (Thay đường dẫn API_URL)
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const apiData = await getTenantDashboardData();

                const viewData: TenantViewData = {
                    // Contract Info
                    houseName: apiData.contract?.houseName || "Đang cập nhật",
                    roomNumber: apiData.contract?.roomNumber || "---",
                    contractStatus: apiData.contract?.contractStatus || "Chưa có HĐ",
                    contractEndDate: apiData.contract?.contractEndDate
                        ? new Date(apiData.contract.contractEndDate).toLocaleDateString('vi-VN')
                        : "---",
                    isExpiringSoon: apiData.contract?.isExpiringSoon || false,

                    // Invoice Info
                    totalUnpaidAmount: formatVND(apiData.invoices.totalUnpaidAmount),
                    unpaidInvoices: apiData.invoices.unpaidInvoices.map(inv => ({
                        invoiceId: inv.invoiceId,
                        month: inv.month,
                        amount: formatVND(inv.amount),
                        dueDate: new Date(inv.dueDate).toLocaleDateString('vi-VN'),
                        isOverdue: inv.isOverdue
                    })),

                    // Incident Info
                    openIncidents: apiData.openIncidents,

                    // Reading Info
                    missingReadings: apiData.readings.missingReadings.map(r => ({
                        month: r.monthYear,
                        type: 'Both' // Backend chưa trả về type, mặc định hiển thị Both
                    }))
                };

                setData(viewData);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!data) return <div className="p-8 text-center text-red-500">Không thể tải dữ liệu</div>;

    const totalUnpaidColor = data.unpaidInvoices.some(inv => inv.isOverdue)
        ? 'text-red-600'
        : data.unpaidInvoices.length > 0
            ? 'text-orange-500'
            : 'text-green-600';

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Bảng Thông Tin Người thuê</h1>

            {/* Contract & Property Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 text-gray-800">
                <TenantInfoCard
                    title="Căn hộ/Phòng đang thuê"
                    value={`${data.houseName} - ${data.roomNumber}`}
                    apiEndpoint="/api/tenant/contracts/active-info"
                    className="lg:col-span-2"
                />
                <TenantInfoCard
                    title="Ngày kết thúc Hợp đồng"
                    value={data.contractEndDate}
                    apiEndpoint="/api/tenant/contracts/active-info"
                />
                <TenantInfoCard
                    title="Trạng thái Hợp đồng"
                    value={data.contractStatus}
                    apiEndpoint="/api/tenant/contracts/active-info"
                />
<<<<<<< HEAD
=======
                <div className="relative w-full h-[400px] border border-gray-200 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                    {isLoading ? (
                        <span className="animate-pulse text-blue-600 font-medium">
                            ⏳ Đang xử lý ảnh...
                        </span>
                    ) : imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt="meter"
                            fill
                            className="object-contain p-2"
                        />
                    ) : (
                        <span className="opacity-60 text-gray-700">
                            Chọn ảnh công tơ
                        </span>
                    )}
                </div>

            </label>

            <div className="mt-4 text-sm text-gray-700 space-y-1">
                <p>Chỉ số tháng trước: <b>{oldValue}</b></p>
                <p>Chỉ số tháng này (AI): <b>{newValue}</b></p>

                <p className="mt-1">
                    Trạng thái:{" "}
                    {status === "pending" ? (
                        <span className="text-yellow-600 font-semibold">Chờ xác nhận</span>
                    ) : (
                        <span className="text-green-600 font-semibold">Đã duyệt</span>
                    )}
                </p>
            </div>
        </div>
    )
}

/* ============================================
   COMPONENT: INVOICE
=============================================== */
function InvoiceCard({ invoice, setInvoice }: InvoiceCardProps) {
    const [showQR, setShowQR] = useState(false)
    const [paymentStatus, setPaymentStatus] = useState<"pending" | "success">("pending")
    const handlePay = async () => {
        const res = await FakeAPI.payInvoice()

        // trạng thái trong modal
        //setPaymentStatus("success")

        // cập nhật invoice sang paid
        setInvoice({
            ...invoice,
            status: res.status as "paid"
        })

        // Đợi trạng thái hiện 1 chút rồi đóng modal
        setTimeout(() => setShowQR(false), 700)
    }

    return (
        <div className="bg-white shadow p-5 rounded-xl">
            <h3 className="font-bold text-lg text-gray-700 mb-3">
                Hóa đơn tháng {invoice.month}
            </h3>

            <div className="space-y-2 text-gray-700">
                {invoice.items.map((i, idx) => (
                    <p key={idx}>
                        {i.name}: {i.qty} × {i.price.toLocaleString()}đ ={" "}
                        <b>{(i.qty * i.price).toLocaleString()}đ</b>
                    </p>
                ))}
>>>>>>> b43a51d (Thay đường dẫn API_URL)
            </div>

            {/* Financial & Incidents & Readings */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 text-gray-800" >

                {/* 1. Unpaid Invoices (Tổng tiền hóa đơn chưa thanh toán) */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-yellow-500 lg:col-span-2">
                    <h3 className="text-xl font-semibold mb-4 text-gray-700">💳 Tổng tiền Hóa đơn Chưa thanh toán</h3>

                    {/* Tổng số tiền */}
                    <div className="flex justify-between items-center border-b pb-3 mb-3">
                        <span className="text-lg font-medium">Tổng số dư cần trả:</span>
                        <span className={`text-3xl font-extrabold ${totalUnpaidColor}`}>
                            {data.totalUnpaidAmount}
                        </span>
                    </div>

                    {/* Danh sách các hóa đơn chưa thanh toán */}
                    <p className="text-sm font-semibold mt-4 mb-2">Chi tiết các tháng còn nợ:</p>
                    <div className="space-y-3">
                        {data.unpaidInvoices.length > 0 ? (
                            data.unpaidInvoices.map((invoice) => (
                                <div key={invoice.invoiceId} className="flex justify-between items-center text-sm py-2 border-b border-gray-100 last:border-b-0">
                                    <div className="flex flex-col">
                                        <span className={`font-semibold ${invoice.isOverdue ? 'text-red-500' : 'text-gray-700'}`}>
                                            {invoice.month}
                                        </span>
                                        <span className={`text-xs ${invoice.isOverdue ? 'text-red-400' : 'text-orange-400'}`}>
                                            {invoice.amount} {invoice.isOverdue ? '(QUÁ HẠN)' : `(Hạn: ${invoice.dueDate})`}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => router.push(`/tenant/payment/${invoice.invoiceId}`)}
                                        className={`px-3 py-1 rounded-lg font-bold text-xs text-white transition ${invoice.isOverdue ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
                                    >
                                        Thanh toán ngay
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-green-500 italic p-3 bg-green-50 rounded">
                                <span className="font-bold">🎉 Bạn đã thanh toán hết nợ!</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Payment Upload Link & Missing Readings */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500">
                    <h3 className="text-xl font-semibold mb-4 text-gray-700">⚡ Bạn đã nộp Chỉ số Điện/Nước?</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Vui lòng nộp chỉ số để hóa đơn tháng này được tính toán chính xác.
                    </p>

                    {/* WARNING: Các tháng chưa nộp chỉ số */}
                    {data.missingReadings.length > 0 && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                            <p className="font-bold text-red-700 text-sm mb-1">⚠️ Cảnh báo Chỉ số Thiếu:</p>
                            <ul className="list-disc list-inside text-xs text-red-600">
                                {data.missingReadings.map((reading, index) => (
                                    <li key={index} className="pl-1">
                                        {reading.month}: Chỉ số <span className="font-semibold">{reading.type === 'Both' ? "Điện & Nước" : ""}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <Link href="/tenant/submit" className="block w-full text-center bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition font-bold">
                        Đi tới trang nộp chỉ số
                    </Link>
                </div>

                {/* 3. Incidents/Requests Card */}
                <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500">
                    <h3 className="text-xl font-semibold mb-4 text-gray-700">🛠️ Yêu cầu Dịch vụ</h3>
                    <div className="flex justify-between items-center border-b pb-3 mb-3">
                        <span className="text-lg font-medium">Yêu cầu chưa xử lý:</span>
                        <span className="text-3xl font-extrabold text-red-600">{data.openIncidents}</span>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">Bạn có thể tạo yêu cầu sửa chữa/hỗ trợ mới.</p>
                    <button className="w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition">
                        Tạo Yêu cầu Mới
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TenantDashboardPage;