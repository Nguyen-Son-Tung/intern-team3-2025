

import { API_URLS, getAuthHeaders } from "@/utils/config";
import { Contract, CreateContractDto, UpdateContractDto } from "@/types/contract";

const PROP_API_URL = process.env.NEXT_PUBLIC_PROPERTY_API_URL;

export const getMyContracts = async (): Promise<Contract[]> => {
    try {
        const res = await fetch(`${PROP_API_URL}/Contracts/my-contracts`, {
            method: 'GET',
            headers: getAuthHeaders(), 
        });

        if (!res.ok) {
            if (res.status === 401) {
                 if (typeof window !== "undefined") window.location.href = '/public/login';
            }
            throw new Error("Không thể tải danh sách hợp đồng");
        }

        const json = await res.json();
        // API Backend trả về { success: true, data: [...] }
        return json.data || [];
        
    } catch (error) {
        console.error("Lỗi fetch contracts:", error);
        return [];
    }
};

export const getContractDetail = async (id: number): Promise<Contract | null> => {
    try {
        const res = await fetch(`${PROP_API_URL}/Contracts/${id}`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (!res.ok) return null;
        
        const json = await res.json();
        return json.data || null;
    } catch (error) {
        console.error("Lỗi fetch contract detail:", error);
        return null;
    }
};


const BASE_URL = `${API_URLS.PROPERTY}/contracts`;

export const getOwnerContracts = async (): Promise<Contract[]> => {
  const res = await fetch(`${BASE_URL}/list-contracts`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Không thể tải danh sách hợp đồng");
  const json = await res.json();
  return json.data || [];
};

export const createContract = async (data: CreateContractDto): Promise<Contract> => {
  const res = await fetch(`${BASE_URL}`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || "Lỗi tạo hợp đồng");
  }
  return json.data;
};

export const updateContract = async (id: number, data: UpdateContractDto): Promise<Contract> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Lỗi cập nhật hợp đồng");
  const json = await res.json();
  return json.data;
};

export const deleteContract = async (id: number): Promise<void> => {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Lỗi xóa hợp đồng");
};
