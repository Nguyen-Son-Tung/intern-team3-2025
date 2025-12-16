import React, { useState, useEffect, useMemo } from "react";
import { Contract, CreateContractDto, ContractStatus, TenantUser } from "@/types/contract";
import { Room } from "@/types/property";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateContractDto & { status?: ContractStatus }) => Promise<void>;
  editingContract: Contract | null;
  rooms: Room[];
  tenants: TenantUser[];
  activeContracts: Contract[];
}

const calculateEndDate = (start: string, months: number) => {
  if (!start) return "";
  const date = new Date(start);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split("T")[0];
};

const calculateDurationFromDates = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
  
  if ([3, 6, 12].includes(diffMonths) && startDate.getDate() === endDate.getDate()) {
      return diffMonths;
  }
  return 0; 
};

export default function ContractModal({ isOpen, onClose, onSubmit, editingContract, rooms, tenants, activeContracts }: Props) {
  
  const [formData, setFormData] = useState<CreateContractDto & { status?: ContractStatus }>({
    roomId: 0,
    tenantId: "",
    startDate: "",
    endDate: "",
    price: 0,
    status: ContractStatus.Active
  });
  const [duration, setDuration] = useState<number>(12);

  // --- LOGIC LỌC PHÒNG ---
  const availableRooms = useMemo(() => {
    const occupiedRoomIds = activeContracts
        .filter(c => c.status === ContractStatus.Active)
        .map(c => c.roomId);

    return rooms.filter(r => {
      if (editingContract && r.id === editingContract.roomId) return true;
      return !occupiedRoomIds.includes(r.id);
    });
  }, [rooms, activeContracts, editingContract]);

  // --- LOGIC LỌC KHÁCH ---
  const availableTenants = useMemo(() => {
    return tenants.filter(t => {
      const hasActive = activeContracts.some(c => 
        c.tenantId === t.id && 
        c.status === ContractStatus.Active &&
        (!editingContract || c.id !== editingContract.id)
      );
      return !hasActive;
    });
  }, [tenants, activeContracts, editingContract]);

  // --- INIT DATA ---
  useEffect(() => {
    if (isOpen) {
        const today = new Date().toISOString().split("T")[0];

        if (editingContract) {
            // --- EDIT MODE ---
            let sDate = today;
            let eDate = today;
            try {
                if (editingContract.startDate) sDate = editingContract.startDate.split("T")[0];
                if (editingContract.endDate) eDate = editingContract.endDate.split("T")[0];
            } catch (e) { console.error("Lỗi parse ngày:", e); }

            setFormData({
                roomId: editingContract.roomId,
                tenantId: editingContract.tenantId,
                startDate: sDate,
                endDate: eDate,
                price: editingContract.price,
                status: editingContract.status
            });
            setDuration(calculateDurationFromDates(sDate, eDate));
        } else {
            // --- CREATE MODE ---
            const end = calculateEndDate(today, 12);
            setFormData({
                roomId: 0,
                tenantId: "",
                startDate: today,
                endDate: end,
                price: 0,
                status: ContractStatus.Active
            });
            setDuration(12);
        }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editingContract?.id]); 

  // --- HANDLERS ---
  const handleDurationChange = (months: number) => {
    setDuration(months);
    if (months > 0 && formData.startDate) {
      setFormData(prev => ({ ...prev, endDate: calculateEndDate(prev.startDate, months) }));
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition";
  const disabledClass = "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-200";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800">
            {editingContract ? "Cập nhật Hợp Đồng" : "Tạo Hợp Đồng Mới"}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-6 space-y-4">
          
          {/* PHÒNG & KHÁCH */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
                Phòng {editingContract ? "(Không thể đổi)" : <span className="text-red-500">*</span>}
            </label>
            <select 
              className={`${inputClass} ${editingContract ? disabledClass : 'bg-white'}`}
              value={formData.roomId} 
              onChange={e => setFormData({...formData, roomId: Number(e.target.value)})}
              required disabled={!!editingContract}
            >
              <option value={0}>-- Chọn Phòng --</option>
              {availableRooms.map(r => (
                  <option key={r.id} value={r.id}>
                      {r.name} - Tầng {r.floor} {editingContract && r.id === editingContract.roomId ? "(Hiện tại)" : ""}
                  </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
                Khách thuê {editingContract ? "(Không thể đổi)" : <span className="text-red-500">*</span>}
            </label>
            <select 
              className={`${inputClass} ${editingContract ? disabledClass : 'bg-white'}`}
              value={formData.tenantId} 
              onChange={e => setFormData({...formData, tenantId: e.target.value})}
              required disabled={!!editingContract}
            >
              <option value="">-- Chọn Khách --</option>
              {availableTenants.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName} ({t.email})</option>
              ))}
            </select>
          </div>

          {/* GIÁ & THỜI HẠN */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Giá thuê (VNĐ)</label>
              <input type="number" className={inputClass} value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required min={0}/>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Thời hạn</label>
              <select className={inputClass} value={duration} onChange={e => handleDurationChange(Number(e.target.value))}>
                <option value={3}>3 Tháng</option>
                <option value={6}>6 Tháng</option>
                <option value={12}>1 Năm</option>
                <option value={0}>Tùy chỉnh</option>
              </select>
            </div>
          </div>

          {/* NGÀY THÁNG */}
          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày bắt đầu</label>
               <input type="date" className={`${inputClass} ${editingContract ? disabledClass : ''}`}
                 value={formData.startDate} 
                 onChange={e => {
                    if(!editingContract) {
                        setFormData(prev => {
                            const newStart = e.target.value;
                            return { ...prev, startDate: newStart, endDate: duration > 0 ? calculateEndDate(newStart, duration) : prev.endDate };
                        });
                    }
                 }} 
                 required readOnly={!!editingContract} 
               />
            </div>
            <div>
               <label className="block text-sm font-semibold text-gray-700 mb-1">Ngày kết thúc</label>
               <input type="date" className={`${inputClass} ${duration !== 0 ? disabledClass : 'bg-white'}`}
                 value={formData.endDate} readOnly={duration !== 0} 
                 onChange={e => { setFormData({...formData, endDate: e.target.value}); setDuration(0); }} 
                 required 
               />
            </div>
          </div>

          {editingContract && (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-semibold text-gray-700 mb-1">Trạng thái hợp đồng</label>
                <select 
                    className={`${inputClass} font-medium ${formData.status === ContractStatus.Active}`}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
                >
                    <option value={ContractStatus.Active} className="text-gray-800">Hoạt động</option>
                    <option value={ContractStatus.Ended} className="text-gray-800">Kết thúc</option>
                </select>
                <p className="text-xs text-gray-500 mt-1 italic">
                </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2.5 bg-gray-100 rounded-lg text-gray-700 font-medium">Hủy</button>
            <button 
                type="submit" 
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
                disabled={!editingContract && (availableRooms.length === 0 || availableTenants.length === 0)}
            >
                {editingContract ? "Lưu thay đổi" : "Tạo Hợp Đồng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}