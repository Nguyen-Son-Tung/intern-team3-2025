import { API_URLS } from "@/utils/config";
import { TenantUser } from "@/types/contract";

const AA_API_URL = process.env.NEXT_PUBLIC_AA_API_URL;

const getAuthHeaders = () => {
    const token = localStorage.getItem("accessToken");
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export interface UserInfo {
    id: string;
    fullName: string;
    email: string;
    ownerId?: string;
}

export const getCurrentUser = async (): Promise<UserInfo | null> => {
    try {
        const userId = localStorage.getItem("userId");
        if (!userId) {
            throw new Error("User ID not found in localStorage");
        }

        const res = await fetch(`${AA_API_URL}/Users/${userId}`, {
            method: 'GET',
            headers: {
                ...getAuthHeaders(),
                'X-Service-Api-Key': 'InternalService_SecretKey_2024_ChangeMeInProduction'
            },
        });

        if (!res.ok) {
            if (res.status === 401) {
                window.location.href = '/public/login';
            }
            throw new Error("Không thể tải thông tin người dùng");
        }

        const data = await res.json();
        
        // Update localStorage with fresh data
        if (data.fullName) {
            localStorage.setItem("fullName", data.fullName);
        }
        
        return data;
    } catch (error) {
        console.error("Lỗi fetch user info:", error);
        return null;
    }
};

export const getTenants = async (): Promise<TenantUser[]> => {
  try {
    const ownerId = localStorage.getItem("userId");

    if (!ownerId) {
      console.warn("Không tìm thấy Owner ID trong localStorage");
      return [];
    }

    const res = await fetch(`${API_URLS.AA}/Users/owner/${ownerId}/tenants`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Service-Api-Key": "InternalService_SecretKey_2024_ChangeMeInProduction", 
      },
    });

    if (!res.ok) {
      console.warn(`Lỗi tải danh sách khách thuê: ${res.status}`);
      return [];
    }

    const data = await res.json();

    // 3. Map dữ liệu trả về
    if (Array.isArray(data)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return data.map((u: any) => ({
            id: u.id,
            fullName: u.fullName,
            email: u.email,
            phoneNumber: u.phoneNumber || "N/A"
        }));
    }
    
    return [];
  } catch (error) {
    console.error("Lỗi kết nối AA Service:", error);
    return [];
  }
};