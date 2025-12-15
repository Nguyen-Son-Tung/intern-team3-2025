<<<<<<< HEAD
// src/services/invoiceService.ts

import { Invoice } from "@/types/invoice";
// 1. Import từ config
import { API_URLS, getAuthHeaders } from "@/utils/config";

// 2. Sử dụng API_URLS.INVOICE thay vì process.env
const BASE_URL = `${API_URLS.INVOICE}/Invoices`;

export const getMyInvoices = async (): Promise<Invoice[]> => {
    try {
        const res = await fetch(BASE_URL, {
            method: 'GET',
            headers: getAuthHeaders(), // 3. Sử dụng helper từ config
=======
import { Invoice } from "@/types/invoice";
import { API_URLS, getAuthHeaders } from "@/utils/config";

const BASE_URL = `${API_URLS.INVOICE}/invoices`;

export const getMyInvoices = async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    year?: number;
    month?: number;
}): Promise<Invoice[]> => {
    try {
        const queryParams = new URLSearchParams();
        
        if (params?.page) queryParams.append('page', params.page.toString());
        if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params?.status) queryParams.append('status', params.status);
        if (params?.year) queryParams.append('year', params.year.toString());
        if (params?.month) queryParams.append('month', params.month.toString());

        const url = queryParams.toString() ? `${BASE_URL}?${queryParams.toString()}` : BASE_URL;
        
        const res = await fetch(url, {
            method: 'GET',
            headers: getAuthHeaders(),
>>>>>>> origin/main
        });

        if (!res.ok) {
            if (res.status === 401) {
<<<<<<< HEAD
                // Xử lý hết hạn token
                window.location.href = '/public/login';
                return [];
            }
            // Log status text để debug dễ hơn
=======
                window.location.href = '/public/login';
                return [];
            }
>>>>>>> origin/main
            console.error(`Error ${res.status}: ${res.statusText}`);
            throw new Error("Không thể tải danh sách hóa đơn");
        }

<<<<<<< HEAD
        return await res.json();
    } catch (error) {
        console.error("Lỗi fetch invoice:", error);
        // Trả về mảng rỗng thay vì throw để UI không bị crash trắng trang
=======
        const invoices = await res.json();
        return invoices.map((invoice: Invoice) => ({
            ...invoice,
            items: []
        }));
    } catch (error) {
        console.error("Lỗi fetch invoice:", error);
>>>>>>> origin/main
        return [];
    }
};

export const getInvoiceDetail = async (id: number): Promise<Invoice | null> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!res.ok) return null;
        return await res.json();
    } catch (error) {
        console.error("Lỗi fetch detail:", error);
        return null;
    }
};

export const markInvoiceAsPaid = async (id: number): Promise<boolean> => {
    try {
        const res = await fetch(`${BASE_URL}/${id}/mark-paid`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });

        if (!res.ok) return false;
        return true;
    } catch (error) {
        console.error("Lỗi mark paid:", error);
        return false;
    }
<<<<<<< HEAD
=======
};

export const remindAllUnpaid = async (): Promise<boolean> => {
    try {
        // Gọi API: POST /api/invoices/remind-unpaid
        const res = await fetch(`${BASE_URL}/remind-unpaid`, {
            method: 'POST',
            headers: getAuthHeaders(), 
        });

        if (!res.ok) {
            // Log chi tiết lỗi nếu có (ví dụ 401, 500)
            console.error(`Failed to remind unpaid invoices. Status: ${res.status}`);
            return false;
        }
        return true;
    } catch (error) {
        console.error("Error calling remind API:", error);
        return false;
    }
>>>>>>> origin/main
};