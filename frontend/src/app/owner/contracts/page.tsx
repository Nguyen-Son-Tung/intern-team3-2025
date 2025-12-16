"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Contract, CreateContractDto, UpdateContractDto, TenantUser, ContractStatus } from "@/types/contract";
import { House, Room } from "@/types/property";
import { getOwnerContracts, createContract, updateContract, deleteContract } from "@/services/contractService";
import { getHouses, getRooms } from "@/services/propertyService";
import { getTenants } from "@/services/userService";

import ContractFilterBar from "@/components/contract/ContractFilterBar";
import ContractTable from "@/components/contract/ContractTable";
import ContractModal from "@/components/contract/ContractModal";
import ConfirmModal from "@/components/common/ConfirmModal";

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tenants, setTenants] = useState<TenantUser[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [selectedHouseId, setSelectedHouseId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);

  // 1. Modal Xóa
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    contractId: 0,
    isProcessing: false
  });

  // 2. Modal Thông báo
  const [notifyModal, setNotifyModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    isError: false
  });
  
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [h, c, t] = await Promise.all([getHouses(), getOwnerContracts(), getTenants()]);
        setHouses(h);
        setContracts(c);
        setTenants(t);
        if (h.length > 0) setSelectedHouseId(h[0].id);
      } catch (e) { console.error("Lỗi tải data:", e); } 
      finally { setLoading(false); }
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedHouseId) {
      getRooms(selectedHouseId).then(setRooms).catch(console.error);
    } else {
      setRooms([]);
    }
  }, [selectedHouseId]);

  const enrichedContracts = useMemo(() => {
    return contracts.map(contract => {
        const tenantInfo = tenants.find(t => t.id === contract.tenantId);
        return {
            ...contract,
            tenantName: tenantInfo ? tenantInfo.fullName : (contract.tenantName || "Không xác định")
        };
    });
  }, [contracts, tenants]);

  const filteredData = useMemo(() => {
    return enrichedContracts.filter(c => {
      const currentHouseRoomIds = rooms.map(r => r.id);
      if (selectedHouseId && !currentHouseRoomIds.includes(c.roomId)) return false;
      if (statusFilter !== "ALL" && c.status !== Number(statusFilter)) return false;
      const s = searchTerm.toLowerCase();
      const tName = c.tenantName ? c.tenantName.toLowerCase() : "";
      const rName = c.roomName ? c.roomName.toLowerCase() : "";
      return (tName.includes(s) || rName.includes(s));
    });
  }, [enrichedContracts, rooms, selectedHouseId, statusFilter, searchTerm]);


  const handleSave = async (dto: CreateContractDto & { status?: ContractStatus }) => {
    try {
      if (editingContract) {
        // UPDATE
        const updateDto: UpdateContractDto = { 
            endDate: dto.endDate, 
            price: Number(dto.price),
            status: dto.status !== undefined ? dto.status : editingContract.status,
            roomId: editingContract.roomId,
            tenantId: editingContract.tenantId,
            startDate: editingContract.startDate
        };
        await updateContract(editingContract.id, updateDto);
      } else {
        // CREATE
        const createPayload = {
            ...dto,
            roomId: Number(dto.roomId),
            price: Number(dto.price),
        };
        await createContract(createPayload);
      }
      
      setIsModalOpen(false);
      setLoading(true);
      const [newContracts, newRooms] = await Promise.all([
          getOwnerContracts(),
          selectedHouseId ? getRooms(selectedHouseId) : Promise.resolve([])
      ]);
      setContracts(newContracts);
      setRooms(newRooms); 
      
      setNotifyModal({
        isOpen: true,
        title: "Thành công",
        message: editingContract ? "Cập nhật hợp đồng thành công!" : "Tạo hợp đồng mới thành công!",
        isError: false
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) { 
        console.error(e);
        setNotifyModal({
            isOpen: true,
            title: "Thất bại",
            message: e.message || "Có lỗi xảy ra.",
            isError: true
        });
    } finally {
        setLoading(false);
    }
  };

  const handleRequestDelete = (id: number) => {
    setDeleteModal({
        isOpen: true,
        contractId: id,
        isProcessing: false
    });
  };

  // Hàm thực thi xóa
  const executeDelete = async () => {
    if (!deleteModal.contractId) return;
    
    // Set loading trên nút xác nhận
    setDeleteModal(prev => ({ ...prev, isProcessing: true }));

    try {
      await deleteContract(deleteModal.contractId);
      
      // Refresh Data
      const newContracts = await getOwnerContracts();
      setContracts(newContracts);
      if (selectedHouseId) {
          const newRooms = await getRooms(selectedHouseId);
          setRooms(newRooms);
      }

      // Đóng modal xóa
      setDeleteModal({ isOpen: false, contractId: 0, isProcessing: false });

      // Hiện thông báo thành công
      setNotifyModal({
        isOpen: true,
        title: "Đã xóa",
        message: "Hợp đồng đã được xóa và phòng đã trống.",
        isError: false
      });

    } catch {
      setDeleteModal(prev => ({ ...prev, isProcessing: false })); // Tắt loading nếu lỗi
      setNotifyModal({
        isOpen: true,
        title: "Lỗi",
        message: "Không thể xóa hợp đồng. Vui lòng thử lại.",
        isError: true
      });
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-800">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Quản lý Hợp Đồng</h2>
           <p className="text-gray-500 text-sm">Theo dõi và tạo mới hợp đồng thuê phòng</p>
        </div>
        {selectedHouseId && (
          <button 
            onClick={() => { setEditingContract(null); setIsModalOpen(true); }} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium shadow-sm"
          >
            + Tạo Hợp Đồng
          </button>
        )}
      </div>

      <ContractFilterBar 
        houses={houses} 
        selectedHouseId={selectedHouseId} 
        onSelectHouse={setSelectedHouseId}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <ContractTable 
        contracts={filteredData} 
        loading={loading} 
        onEdit={(c) => { setEditingContract(c); setIsModalOpen(true); }}
        // Thay đổi sự kiện delete: gọi hàm mở modal
        onDelete={handleRequestDelete}
      />

      <ContractModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        editingContract={editingContract}
        rooms={rooms}
        tenants={tenants}
        activeContracts={contracts}
      />

      {/* MODAL XÁC NHẬN XÓA */}
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={executeDelete}
        title="Xóa hợp đồng"
        message="Bạn có chắc chắn muốn xóa hợp đồng này? Phòng sẽ trở về trạng thái TRỐNG."
        isLoading={deleteModal.isProcessing}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
      />

      {/* MODAL THÔNG BÁO KẾT QUẢ */}
      <ConfirmModal 
        isOpen={notifyModal.isOpen}
        onClose={() => setNotifyModal({ ...notifyModal, isOpen: false })}
        onConfirm={() => setNotifyModal({ ...notifyModal, isOpen: false })}
        title={notifyModal.title}
        message={notifyModal.message}
        hideCancel={true} // Chỉ hiện 1 nút Đóng
        confirmText="Đóng"
      />
    </div>
  );
}
