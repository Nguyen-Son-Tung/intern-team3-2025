import React from 'react';
import { TenantUser } from "@/types/contract";

interface TenantTableProps {
    tenants: TenantUser[];
    loading: boolean;
    onDelete: (tenant: TenantUser) => void;
    onEdit: (tenant: TenantUser) => void;
}

export default function TenantTable({ tenants, loading, onDelete, onEdit }: TenantTableProps) {
    if (loading) {
        return (
            <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-200">
                <p className="text-gray-500">Đang tải danh sách...</p>
            </div>
        );
    }

    if (tenants.length === 0) {
        return (
            <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-200">
                <p className="text-gray-500">Chưa có khách thuê nào.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4 w-16">STT</th>
                            <th className="px-6 py-4">Họ và tên</th>
                            <th className="px-6 py-4">Email (Tài khoản)</th>
                            <th className="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {tenants.map((tenant, index) => (
                            <tr key={tenant.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                                <td className="px-6 py-4 font-medium text-gray-800">
                                    {tenant.fullName}
                                </td>
                                <td className="px-6 py-4 text-gray-600 font-mono">
                                    {tenant.email}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-3">
                                        <button
                                            onClick={() => onEdit(tenant)}
                                            className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                        >
                                            Sửa
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button
                                            onClick={() => onDelete(tenant)}
                                            className="font-medium text-red-600 hover:text-red-800 hover:underline"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
                Hiển thị {tenants.length} khách thuê
            </div>
        </div>
    );
}