"use client";

<<<<<<< HEAD
import Image from "next/image";
import { useState, useEffect } from "react";

/* ------------------------------
    INTERFACES GIỮ NGUYÊN
------------------------------ */
interface InvoiceItem {
    name: string;
    qty: number;
    price: number;
    amount: number;
}
interface Invoice {
    id: number;
    month: string;
    status: string;
    items: InvoiceItem[];
    total: number;
}
interface ReadingCardProps {
    title: string;
    icon: string;
    oldValue: number;
    newValue: number;
    usedValue?: number;
    status: string | number;
    imageUrl: string;
    isLoading?: boolean;
    onUpload: (file: File) => void;
}

interface ApiInvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
    productCode?: string;
}

interface ReadingValue {
    old: number;
    new: number;
    img: string;
    status: string | number;
}
interface ReadingCycle {
    id: number;
    cycleMonth: number;
    cycleYear: number;
}

/* ------------------------------
    API URL
------------------------------ */
const IMAGE_API = process.env.NEXT_PUBLIC_IMAGE_SCAN_API_URL;
const READING_API = process.env.NEXT_PUBLIC_READING_API_URL;
const INVOICE_API = process.env.NEXT_PUBLIC_INVOICE_API_URL;

function authHeaders() {
    return {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`
    };
}

// ✅ Hàm chuyển đổi trạng thái (Hỗ trợ cả số như 1 và chuỗi)
function mapStatusToVietnamese(status: string | number | null | undefined): string {
    if (status === null || status === undefined || status === "") {
        return "Đang tải...";
    }

    let statusString: string;

    if (typeof status === 'number') {
        statusString = status.toString();
    } else {
        // Tránh lỗi toLowerCase nếu status là chuỗi không hợp lệ
        statusString = status.toLowerCase().trim();
    }

    switch (statusString) {
        case "pending":
        case "0":
            return "Chờ xác nhận";
        case "approved":
        case "submitted":
        case "1":
            return "Đã xác nhận";
        default:
            return status.toString();
    }
}

/* ============================================
    MAIN COMPONENT
=============================================== */
export default function SubmitMeter() {
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [cycle, setCycle] = useState<ReadingCycle | null>(null);
    const [loadingCycle, setLoadingCycle] = useState(true);
    const [uploadingElec, setUploadingElec] = useState(false);
    const [uploadingWater, setUploadingWater] = useState(false);
    const [electricFile, setElectricFile] = useState<File | null>(null);
    const [waterFile, setWaterFile] = useState<File | null>(null);

    const [electric, setElectric] = useState<ReadingValue>({
        old: 0, new: 0, img: "", status: "pending"
    });

    const [water, setWater] = useState<ReadingValue>({
        old: 0, new: 0, img: "", status: "pending"
    });

    // Theo dõi trạng thái hóa đơn để quyết định disable nút
    const [invoiceStatus, setInvoiceStatus] = useState<'pending' | 'created' | 'paid'>('pending');
    const [invoice, setInvoice] = useState<Invoice | null>(null);

    /* ------------------------------
        1️⃣ LOAD CYCLE (chỉ 1 lần)
    --------------------------------*/
    useEffect(() => {
        async function fetchCycle() {
            const res = await fetch(`${READING_API}/ReadingCycle`, { headers: authHeaders() });
            const data = await res.json() as ReadingCycle[];
            if (data?.length) {
                const latest = data.sort((a: ReadingCycle, b: ReadingCycle) =>
                    b.cycleYear - a.cycleYear || b.cycleMonth - a.cycleMonth
                )[0];
                setCycle(latest);
            }
            setLoadingCycle(false);
        }
        fetchCycle();
    }, []);

    /* ------------------------------
        2️⃣ LOAD READING (chỉ 1 lần sau khi có cycle)
    --------------------------------*/
    useEffect(() => {
        if (!cycle) return;

        async function fetchReading(cycleId: number) {
            const res = await fetch(`${READING_API}/MonthlyReading/by-cycle/${cycleId}`, {
                headers: authHeaders(),
            });

            if (res.status === 404) return;

            const data = await res.json();

            // Helper: Lấy object key từ URL S3
            async function getPresignedUrl(photoUrl: string | null | undefined) {
                if (!photoUrl) return "";
                try {
                    const u = new URL(photoUrl);
                    const key = u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname;
                    const resp = await fetch(`${READING_API}/MonthlyReading/image-proxy?key=${encodeURIComponent(key)}`);
                    if (!resp.ok) return "";
                    const json = await resp.json();
                    return json.url || "";
                } catch {
                    return "";
                }
            }

            const [electricImg, waterImg] = await Promise.all([
                getPresignedUrl(data.electricPhotoUrl),
                getPresignedUrl(data.waterPhotoUrl)
            ]);

            setElectric({
                old: data.electricOld,
                new: data.electricNew,
                img: electricImg,
                status: data.status // Có thể là số 1 hoặc chuỗi "approved"
            });

            setWater({
                old: data.waterOld,
                new: data.waterNew,
                img: waterImg,
                status: data.status // Có thể là số 1 hoặc chuỗi "approved"
            });

            setIsInitialLoading(false);
        }

        fetchReading(cycle.id);
    }, [cycle]);


    /* ------------------------------
        3️⃣ UPLOAD ẢNH — chỉ cập nhật state
    --------------------------------*/
    async function handleUpload(type: "electric" | "water", file: File) {

        if (type === "electric") setUploadingElec(true);
        else setUploadingWater(true);

        // gửi file lên AI OCR để lấy số
        const form = new FormData();
        form.append("file", file);

        const res = await fetch(`${IMAGE_API}/${type}/upload`, {
            method: "POST",
            body: form
        });

        const data = await res.json();
        const aiValue = Number(data.reading);

        const preview = URL.createObjectURL(file);

        if (type === "electric") {
            setElectricFile(file);
            setElectric(p => ({ ...p, new: aiValue, img: preview, status: "pending" }));
        } else {
            setWaterFile(file);
            setWater(p => ({ ...p, new: aiValue, img: preview, status: "pending" }));
        }

        if (type === "electric") setUploadingElec(false);
        else setUploadingWater(false);
    }


    /* ------------------------------
        4️⃣ SUBMIT — đúng thời điểm, không auto
    --------------------------------*/
    async function handleApprove() {
        if (!cycle) return;
=======
import { useState, useEffect } from "react";
import { ReadingCycle, ReadingValue } from "@/types/reading";
import { readingService } from "@/services/readingService";
import { mapStatusToVietnamese } from "@/utils/formatters";
import ReadingCard from "@/components/submit/ReadingCard";
import AlertModal from "@/components/submit/AlertModal";
import ConfirmSubmitModal from "@/components/submit/ConfirmSubmitModal";

export default function SubmitMeterPage() {
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [cycle, setCycle] = useState<ReadingCycle | null>(null);
    const [uploadingElec, setUploadingElec] = useState(false);
    const [uploadingWater, setUploadingWater] = useState(false);

    // File state
    const [electricFile, setElectricFile] = useState<File | null>(null);
    const [waterFile, setWaterFile] = useState<File | null>(null);

    // Data state
    const [electric, setElectric] = useState<ReadingValue>({ old: 0, new: 0, img: "", status: "pending" });
    const [water, setWater] = useState<ReadingValue>({ old: 0, new: 0, img: "", status: "pending" });
    const [invoiceStatus, setInvoiceStatus] = useState<'pending' | 'created' | 'paid'>('pending');

    // UI state
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [alertState, setAlertState] = useState<{ isOpen: boolean; title: string; message: string; type: 'error' | 'success' | 'warning'; }>({ isOpen: false, title: "", message: "", type: 'error' });

    const showAlert = (title: string, message: string, type: 'error' | 'success' | 'warning' = 'error') => {
        setAlertState({ isOpen: true, title, message, type });
    };

    // 1️⃣ LOAD DATA
    useEffect(() => {
        async function init() {
            try {
                const cycles = await readingService.getCycles();
                if (cycles?.length) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const latest = cycles.sort((a: any, b: any) => b.cycleYear - a.cycleYear || b.cycleMonth - a.cycleMonth)[0];
                    setCycle(latest);
                }
            } catch (e) { console.error(e); }
        }
        init();
    }, []);

    useEffect(() => {
        if (!cycle) return;
        async function fetchReading() {
            try {
                const data = await readingService.getReadingByCycle(cycle!.id);
                if (!data) return;

                const [electricImg, waterImg] = await Promise.all([
                    readingService.getPresignedUrl(data.electricPhotoUrl),
                    readingService.getPresignedUrl(data.waterPhotoUrl)
                ]);

                setElectric({ old: data.electricOld, new: data.electricNew, img: electricImg, status: data.status });
                setWater({ old: data.waterOld, new: data.waterNew, img: waterImg, status: data.status });
                if (mapStatusToVietnamese(data.status) === "Đã xác nhận") setInvoiceStatus('created');
            } catch (e) { console.error(e); } finally {
                setIsInitialLoading(false);
            }
        }
        fetchReading();
    }, [cycle]);

    // 2️⃣ UPLOAD HANDLER
    async function handleUpload(type: "electric" | "water", file: File) {
        if (type === "electric") setUploadingElec(true); else setUploadingWater(true);

        try {
            const data = await readingService.uploadImage(type, file);
            const aiValue = Number(data.reading);
            const preview = URL.createObjectURL(file);
            const currentOld = type === "electric" ? electric.old : water.old;

            // Xử lý NaN
            if (isNaN(aiValue)) {
                showAlert("Lỗi đọc ảnh", "Không đọc được chỉ số vui lòng upload lại hình ảnh.", 'error');
                if (type === "electric") { setElectricFile(file); setElectric(p => ({ ...p, new: NaN, img: preview, status: "pending" })); }
                else { setWaterFile(file); setWater(p => ({ ...p, new: NaN, img: preview, status: "pending" })); }
            }
            // Xử lý số đọc được
            else {
                if (aiValue < currentOld) {
                    showAlert("Cảnh báo chỉ số", `Chỉ số mới (${aiValue}) nhỏ hơn chỉ số cũ (${currentOld})!`, 'warning');
                }
                if (type === "electric") { setElectricFile(file); setElectric(p => ({ ...p, new: aiValue, img: preview, status: "pending" })); }
                else { setWaterFile(file); setWater(p => ({ ...p, new: aiValue, img: preview, status: "pending" })); }
            }
        } catch {
            showAlert("Lỗi hệ thống", "Có lỗi khi đọc ảnh, vui lòng thử lại sau.", 'error');
        } finally {
            if (type === "electric") setUploadingElec(false); else setUploadingWater(false);
        }
    }

    // 3️⃣ PRE-SUBMIT
    function handlePreSubmit() {
        if (isNaN(electric.new) || isNaN(water.new)) { showAlert("Dữ liệu không hợp lệ", "Chỉ số không hợp lệ (NaN).", 'error'); return; }
        if (electric.new < electric.old) { showAlert("Lỗi chỉ số điện", "Chỉ số Điện mới nhỏ hơn cũ.", 'error'); return; }
        if (water.new < water.old) { showAlert("Lỗi chỉ số nước", "Chỉ số Nước mới nhỏ hơn cũ.", 'error'); return; }
        setShowConfirmModal(true);
    }

    // 4️⃣ FINAL SUBMIT
    async function handleFinalSubmit() {
        // Ngăn chặn double click ngay lập tức
        if (!cycle || isInitialLoading) return;

        setShowConfirmModal(false);
        setIsInitialLoading(true);
>>>>>>> origin/main

        const form = new FormData();
        form.append("electricNew", electric.new.toString());
        form.append("waterNew", water.new.toString());
<<<<<<< HEAD

        if (electricFile) {
            form.append("electricPhoto", electricFile);
        }

        if (waterFile) {
            form.append("waterPhoto", waterFile);
        }

        const res = await fetch(`${READING_API}/MonthlyReading/${cycle.id}/submit`, {
            method: "POST",
            headers: authHeaders(),
            body: form
        });

        if (res.ok) {
            // Cập nhật trạng thái hiển thị
            setElectric(p => ({ ...p, status: "approved" }));
            setWater(p => ({ ...p, status: "approved" }));

            // Gọi tạo hóa đơn
            createInvoice();
        }
    }


    /* ------------------------------
        5️⃣ Tạo hóa đơn — gọi duy nhất sau submit
    --------------------------------*/
    async function createInvoice() {
        if (!cycle) return;

        const body = {
            cycleId: cycle.id,
            electricUsage: electric.new - electric.old,
            waterUsage: water.new - water.old,
        };

        const res = await fetch(`${INVOICE_API}/invoices`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify(body)
        });

        const inv = await res.json();
        console.log("Invoice RAW:", inv);

        // Cập nhật trạng thái hóa đơn sau khi tạo thành công (Cách tiếp cận mới)
        if (res.ok) {
            setInvoiceStatus('created');
        }

        setInvoice({
            id: inv.id,
            month: `${cycle.cycleMonth}/${cycle.cycleYear}`,
            status: inv.status,
            total: Number(inv.totalAmount ?? 0),
            items: inv.items?.map((i: ApiInvoiceItem) => ({
                name: i.description ?? "",
                qty: Number(i.quantity ?? 0),
                price: Number(i.unitPrice ?? 0),
                amount: Number(i.amount ?? ((i.quantity ?? 0) * (i.unitPrice ?? 0))),
            })) ?? []
        });
    }

    const isConfirmedReading = mapStatusToVietnamese(electric.status) === "Đã xác nhận" && mapStatusToVietnamese(water.status) === "Đã xác nhận";
    /* ------------------------------
        UI ĐÃ CHỈNH SỬA
------------------------------ */
    return (
        <div className="space-y-7">
            {cycle && (
                <div className="bg-white p-5 rounded-xl shadow text-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg">
                            Kỳ thu tháng {cycle.cycleMonth}/{cycle.cycleYear}
                        </h2>
                        <div>
                            <button
                                onClick={handleApprove}
                                disabled={isInitialLoading || isConfirmedReading || invoiceStatus === 'created'}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isInitialLoading ? "Đang tải dữ liệu..." : "Xác nhận số liệu"}
                            </button>

                            {/* Thêm dòng thông báo nếu đã xác nhận hoặc hóa đơn đã tạo */}
                            {(isConfirmedReading || invoiceStatus === 'created') && (
                                <p className="mt-3 text-sm text-green-700 font-medium">
                                    ✅ Đã xác nhận chỉ số thành công. Hóa đơn đã được tạo.
                                </p>
                            )}
                        </div>
                    </div>

=======
        if (electricFile) form.append("electricPhoto", electricFile);
        if (waterFile) form.append("waterPhoto", waterFile);

        try {
            // ⭐️ CHỈ GỌI MỘT ENDPOINT: LƯU CHỈ SỐ ⭐️
            // (Và Server sẽ xử lý việc tạo hóa đơn)
            const res = await readingService.submitReadings(cycle.id, form);

            if (res.ok) {
                // Cập nhật UI thành công
                setElectric(p => ({ ...p, status: "approved" }));
                setWater(p => ({ ...p, status: "approved" }));

                setInvoiceStatus('created');
            } else {
                showAlert("Gửi thất bại", "Vui lòng thử lại.", 'error');
            }
        } catch {
            showAlert("Lỗi kết nối", "Không thể kết nối đến máy chủ.", 'error');
        } finally {
            setIsInitialLoading(false);
        }
    }

    // Logic tính toán cho UI
    const isConfirmedReading = mapStatusToVietnamese(electric.status) === "Đã xác nhận" && mapStatusToVietnamese(water.status) === "Đã xác nhận";
    const hasNegativeError = (electric.new < electric.old) || (water.new < water.old);
    const hasNaNError = isNaN(electric.new) || isNaN(water.new);
    const isSubmitDisabled = isInitialLoading || isConfirmedReading || invoiceStatus === 'created' || hasNegativeError || hasNaNError;

    // Logic cảnh báo
    const elecUsage = electric.new - electric.old;
    const waterUsage = water.new - water.old;
    const LIMIT_ELEC = 500;
    const LIMIT_WATER = 30;
    const isHighElec = !isNaN(electric.new) && elecUsage > LIMIT_ELEC;
    const isHighWater = !isNaN(water.new) && waterUsage > LIMIT_WATER;
    const hasWarning = isHighElec || isHighWater;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Nộp chỉ số điện nước</h2>
                    <p className="text-gray-500 text-sm">Gửi chỉ số tiêu thụ hàng tháng của bạn</p>
                </div>
            </div>

            {cycle && (
                <div className="bg-white p-5 rounded-xl shadow text-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-lg">Kỳ thu tháng {cycle.cycleMonth}/{cycle.cycleYear}</h2>
                        <button
                            onClick={handlePreSubmit}
                            disabled={isSubmitDisabled}
                            className={`px-4 py-2 rounded-lg text-white ${isSubmitDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}
                        >
                            {isInitialLoading ? "Đang xử lý..." : "Xác nhận số liệu"}
                        </button>
                    </div>
>>>>>>> origin/main
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-700">
<<<<<<< HEAD
                <ReadingCard {...{
                    title: "Chỉ số điện",
                    icon: "⚡",
                    oldValue: electric.old,
                    newValue: electric.new,
                    usedValue: electric.new - electric.old,
                    status: electric.status,
                    imageUrl: electric.img,
                    isLoading: uploadingElec,
                    onUpload: (f: File) => handleUpload("electric", f)
                }} />

                <ReadingCard {...{
                    title: "Chỉ số nước",
                    icon: "💧",
                    oldValue: water.old,
                    newValue: water.new,
                    usedValue: water.new - water.old,
                    status: water.status,
                    imageUrl: water.img,
                    isLoading: uploadingWater,
                    onUpload: (f: File) => handleUpload("water", f)
                }} />
            </div>
        </div>
    );
}

/* ------------------------------
    ReadingCard ĐÃ CHỈNH SỬA (Thêm chuyển đổi tiếng Việt và disable input)
------------------------------ */
function ReadingCard({
    title,
    icon,
    oldValue,
    newValue,
    usedValue,
    status,
    imageUrl,
    isLoading,
    onUpload
}: ReadingCardProps) {

    // Sử dụng hàm chuyển đổi đã fix lỗi để hiển thị trạng thái bằng tiếng Việt
    const statusVietnamese = mapStatusToVietnamese(status);

    // Kiểm tra trạng thái để disable input file
    const isApproved = statusVietnamese === "Đã xác nhận";

    return (
        <div className="bg-white shadow p-5 rounded-xl">
            <h3 className="font-bold">{icon} {title}</h3>

            <label className="block cursor-pointer">
                <input
                    type="file"
                    hidden
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUpload(file);
                    }}
                    // Disable input file nếu đã xác nhận
                    disabled={isApproved}
                />

                <div className="relative w-full h-[300px] bg-gray-100 flex items-center justify-center rounded-lg">
                    {isLoading ? (
                        "Đang xử lý ảnh..."
                    ) : imageUrl ? (
                        <Image src={imageUrl} alt="Ảnh đồng hồ chỉ số"
                            width={400}
                            height={300}
                            className="object-contain w-full h-full rounded-lg" />
                    ) : (
                        "Chọn ảnh"
                    )}
                </div>
            </label>

            <p>Chỉ số tháng trước: {oldValue}</p>
            <p>Chỉ số tháng này: {newValue}</p>
            <p>Chỉ tố tiêu thụ: {usedValue}</p>
            <p>Trạng thái: {statusVietnamese}</p>
=======
                <ReadingCard title="Chỉ số điện" icon="⚡" oldValue={electric.old} newValue={electric.new} usedValue={electric.new - electric.old} status={electric.status} imageUrl={electric.img} isLoading={uploadingElec} onUpload={(f) => handleUpload("electric", f)} />
                <ReadingCard title="Chỉ số nước" icon="💧" oldValue={water.old} newValue={water.new} usedValue={water.new - water.old} status={water.status} imageUrl={water.img} isLoading={uploadingWater} onUpload={(f) => handleUpload("water", f)} />
            </div>

            <ConfirmSubmitModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleFinalSubmit}
                hasWarning={hasWarning}
                isHighElec={isHighElec}
                isHighWater={isHighWater}
                elecUsage={elecUsage}
                waterUsage={waterUsage}
                limits={{ elec: LIMIT_ELEC, water: LIMIT_WATER }}
            />

            <AlertModal
                isOpen={alertState.isOpen}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
                onClose={() => setAlertState(p => ({ ...p, isOpen: false }))}
            />
>>>>>>> origin/main
        </div>
    );
}