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
        });

        if (!res.ok) {
            if (res.status === 401) {
                window.location.href = '/public/login';
                return [];
            }
            console.error(`Error ${res.status}: ${res.statusText}`);
            throw new Error("Không thể tải danh sách hóa đơn");
        }

        const invoices = await res.json();
        return invoices.map((invoice: Invoice) => ({
            ...invoice,
            items: []
        }));
    } catch (error) {
        console.error("Lỗi fetch invoice:", error);
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
};

export const triggerInvoiceVisibility = async (): Promise<{ success: boolean; message: string }> => {
    try {
        const url = `${API_URLS.INVOICE}/InvoiceJob/trigger-visibility`;
        console.log('Calling API:', url);

        const res = await fetch(url, {
            method: 'POST',
            headers: getAuthHeaders(),
        });

        console.log('Response status:', res.status);
        console.log('Response ok:', res.ok);

        if (!res.ok) {
            let errorMessage = `Error ${res.status}`;
            try {
                const errorData = await res.json();
                console.log('Error data:', errorData);
                errorMessage = errorData.message || errorMessage;
            } catch (jsonError) {
                console.log('Failed to parse error response as JSON:', jsonError);
                // Try to get text response
                try {
                    const textResponse = await res.text();
                    console.log('Text response:', textResponse);
                    if (textResponse) {
                        errorMessage = textResponse;
                    }
                } catch (textError) {
                    console.log('Failed to get text response:', textError);
                }
            }
            return { success: false, message: errorMessage };
        }

        const data = await res.json();
        console.log('Success data:', data);
        return { success: true, message: data.message };
    } catch (error) {
        console.error("Error triggering invoice visibility:", error);
        return { success: false, message: "Network error" };
    }
};

export const triggerAutoInvoice = async (): Promise<{ success: boolean; message: string }> => {
    try {
        const res = await fetch(`${API_URLS.READING}/monthlyreading/trigger-auto-invoice`, {
            method: 'POST',
            headers: getAuthHeaders(),
        });

        if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
            return { success: false, message: errorData.message || `Error ${res.status}` };
        }

        const data = await res.json();
        return { success: true, message: data.message };
    } catch (error) {
        console.error("Error triggering auto invoice:", error);
        return { success: false, message: "Network error" };
    }
};