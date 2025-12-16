export enum ContractStatus {
  Active = 0,
  Ended = 1,
}

// Helper để lấy text hiển thị & màu sắc từ Status code
export const getStatusInfo = (status: number) => {
    switch (status) {
        case ContractStatus.Active:
            return { label: "Đang hiệu lực", color: "bg-green-100 text-green-700" };
        case ContractStatus.Ended:
            return { label: "Đã kết thúc", color: "bg-gray-200 text-gray-600" };
        default:
            return { label: "Không xác định", color: "bg-gray-100 text-gray-500" };
    }
};


export interface Contract {
  id: number;
  roomId: number;
  tenantId: string;
  startDate: string; 
  endDate: string;  
  price: number;
  status: ContractStatus | number;
  fileUrl?: string;
  createdAt: string;
  houseName?: string;
  roomName?: string;
  tenantName?: string;
}

export interface CreateContractDto {
  roomId: number;
  tenantId: string;
  startDate: string;
  endDate: string;
  price: number;
  fileUrl?: string;
}

export interface UpdateContractDto {
  status?: ContractStatus;
  startDate?: string;
  endDate?: string;
  price?: number;
  roomId?: number;
  tenantId?: string;
  fileUrl?: string;
}

export interface TenantUser {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
}