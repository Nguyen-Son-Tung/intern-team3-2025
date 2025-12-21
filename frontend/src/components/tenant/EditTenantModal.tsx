"use client";

import React, { useState } from "react";
import { TenantUser } from "@/types/contract";
import { UpdateTenantDto } from "@/services/userService";

interface EditTenantModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (userId: string, data: UpdateTenantDto) => Promise<void>;
    tenant: TenantUser | null;
    isSaving: boolean;
}

export default function EditTenantModal({ 
    isOpen, onClose, onSave, tenant, isSaving 
}: EditTenantModalProps) {

    const [formData, setFormData] = useState<UpdateTenantDto>({
        fullName: tenant?.fullName || "",
        email: tenant?.email || ""
    });

    if (!isOpen || !tenant) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(tenant.id, formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            {/* RESPONSIVE: Width full trên mobile, max-w-md trên desktop */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">Cập nhật khách thuê</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-gray-600 font-bold text-2xl leading-none"
                    >
                        &times;
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                        <input
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email (Tên đăng nhập)</label>
                        <input
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                            required
                        />
                    </div>

                    {/* Footer */}
                    <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:bg-blue-400 transition"
                        >
                            {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}