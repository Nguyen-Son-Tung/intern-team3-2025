"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";

import { getTenants, deleteTenantAPI, updateTenantAPI, UpdateTenantDto } from "@/services/userService";
import { TenantUser } from "@/types/contract";

import TenantFilters from "@/components/tenant/TenantFilters";
import TenantTable from "@/components/tenant/TenantTable";
import EditTenantModal from "@/components/tenant/EditTenantModal";
import ConfirmModal from "@/components/common/ConfirmModal";

export default function OwnerTenantsPage() {
    // --- STATE DỮ LIỆU ---
    const [tenants, setTenants] = useState<TenantUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    // --- STATE MODAL XỬ LÝ (SỬA/XÓA) ---
    const [isDeleting, setIsDeleting] = useState(false);
    const [tenantToDelete, setTenantToDelete] = useState<TenantUser | null>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [tenantToEdit, setTenantToEdit] = useState<TenantUser | null>(null);

    // --- STATE THÔNG BÁO ---
    const [popup, setPopup] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "success" | "error"; 
    }>({ isOpen: false, title: "", message: "", type: "success" });

    // --- FETCH DATA ---
    const fetchTenants = async () => {
        setLoading(true);
        try {
            const data = await getTenants();
            setTenants(data);
        } catch (error) {
            console.error("Lỗi tải tenants:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenants();
    }, []);

    // --- FILTER LOGIC ---
    const filteredTenants = useMemo(() => {
        return tenants.filter(t => {
            const nameMatch = t.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
            const emailMatch = t.email?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
            return nameMatch || emailMatch;
        });
    }, [tenants, searchTerm]);

    // --- HELPER: MỞ POPUP THÔNG BÁO ---
    const showSuccess = (message: string) => {
        setPopup({ isOpen: true, title: "Thành công", message, type: "success" });
    };

    const showError = (message: string) => {
        setPopup({ isOpen: true, title: "Lỗi", message, type: "error" });
    };

    const closePopup = () => {
        setPopup(prev => ({ ...prev, isOpen: false }));
    };

    // --- HANDLERS ---
    
    // Xử lý Xóa
    const handleDeleteClick = (tenant: TenantUser) => setTenantToDelete(tenant);

    const handleConfirmDelete = async () => {
        if (!tenantToDelete) return;
        setIsDeleting(true);
        try {
            const result = await deleteTenantAPI(tenantToDelete.id);
            if (result.success) {
                // Đóng modal xóa trước
                setTenantToDelete(null);
                // Hiện Popup thông báo thành công
                showSuccess("Đã xóa khách thuê thành công!");
                // Reload dữ liệu
                await fetchTenants();
            } else {
                setTenantToDelete(null); 
                showError(result.message || "Xóa thất bại.");
            }
        } catch (error) {
            console.error(error);
            setTenantToDelete(null);
            showError("Lỗi kết nối hệ thống.");
        } finally {
            setIsDeleting(false);
        }
    };

    // Xử lý Sửa
    const handleEditClick = (tenant: TenantUser) => {
        setTenantToEdit(tenant);
        setIsEditing(true);
    };

    const handleSaveEdit = async (userId: string, data: UpdateTenantDto) => {
        setIsSaving(true);
        try {
            const result = await updateTenantAPI(userId, data);
            if (result.success) {
                setIsEditing(false);
                setTenantToEdit(null);
                // Hiện Popup thông báo thành công
                showSuccess("Đã chỉnh sửa thông tin thành công!");
                await fetchTenants();
            } else {
                showError(result.message || "Cập nhật thất bại.");
            }
        } catch (error) {
            console.error(error);
            showError("Lỗi kết nối hệ thống.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 p-6 bg-gray-50 min-h-screen text-gray-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Quản lý khách thuê</h2>
                    <p className="text-gray-500 text-sm mt-1">Danh sách tài khoản khách thuê</p>
                </div>

                <Link 
                    href="/owner/createtenant"
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-2"
                >
                    <Plus className="w-5 h-5" />
                    Thêm khách thuê mới
                </Link>
            </div>

            {/* Filter & Table */}
            <TenantFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

            <TenantTable 
                tenants={filteredTenants} 
                loading={loading} 
                onDelete={handleDeleteClick} 
                onEdit={handleEditClick}
            />

            {/* --- CÁC MODAL --- */}

            <ConfirmModal 
                isOpen={!!tenantToDelete}
                onClose={() => !isDeleting && setTenantToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Xóa khách thuê"
                message={`Bạn có chắc chắn muốn xóa khách thuê: \n"${tenantToDelete?.fullName}"?`}
                isLoading={isDeleting}
                confirmText="Xóa tài khoản"
                cancelText="Hủy bỏ"
            />

            <EditTenantModal
                key={tenantToEdit ? tenantToEdit.id : 'edit-modal'} 
                isOpen={isEditing}
                onClose={() => !isSaving && setIsEditing(false)}
                tenant={tenantToEdit}
                onSave={handleSaveEdit}
                isSaving={isSaving}
            />

            <ConfirmModal 
                isOpen={popup.isOpen}
                onClose={closePopup}
                onConfirm={closePopup} 
                title={popup.title}
                message={popup.message}
                confirmText="Đóng"   
                hideCancel={true}   
            />
        </div>
    );
}