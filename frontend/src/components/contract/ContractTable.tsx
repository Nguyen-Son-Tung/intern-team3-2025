import React from "react";
import { Contract, ContractStatus } from "@/types/contract";

interface Props {
  contracts: Contract[];
  onEdit: (c: Contract) => void;
  onDelete: (id: number) => void;
  loading: boolean;
}

export default function ContractTable({ contracts, onEdit, onDelete, loading }: Props) {
  const renderStatus = (status: ContractStatus) => {
    return status === ContractStatus.Active ? (
      <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">Hoạt động</span>
    ) : (
      <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold">Kết thúc</span>
    );
  };

  if (loading) return <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>;
  if (contracts.length === 0) return <div className="text-center py-10 text-gray-500">Không có dữ liệu hợp đồng.</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
            <tr>
              <th className="p-4 border-b">Phòng</th>
              <th className="p-4 border-b">Khách thuê</th>
              <th className="p-4 border-b text-center">Ngày bắt đầu</th>
              <th className="p-4 border-b text-center">Ngày kết thúc</th>
              <th className="p-4 border-b text-right">Giá thuê</th>
              <th className="p-4 border-b text-center">Trạng thái</th>
              <th className="p-4 border-b text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-gray-100">
            {contracts.map((contract) => (
              <tr key={contract.id} className="hover:bg-gray-50 transition">
                <td className="p-4 font-bold text-gray-800">{contract.roomName}</td>
                <td className="p-4">{contract.tenantName || <span className="text-gray-400 italic">--</span>}</td>
                <td className="p-4 text-center text-gray-600">{new Date(contract.startDate).toLocaleDateString('vi-VN')}</td>
                <td className="p-4 text-center text-gray-600">{new Date(contract.endDate).toLocaleDateString('vi-VN')}</td>
                <td className="p-4 text-right font-medium">{contract.price.toLocaleString('vi-VN')} đ</td>
                <td className="p-4 text-center">{renderStatus(contract.status)}</td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => onEdit(contract)} className="text-blue-600 hover:text-blue-800 font-medium text-xs px-2 py-1 bg-blue-50 rounded">Sửa</button>
                    <button onClick={() => onDelete(contract.id)} className="text-red-600 hover:text-red-800 font-medium text-xs px-2 py-1 bg-red-50 rounded">Xóa</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}