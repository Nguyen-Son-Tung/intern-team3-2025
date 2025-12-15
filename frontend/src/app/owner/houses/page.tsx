"use client";
<<<<<<< HEAD
import { useEffect, useState } from "react";
=======

import { useEffect, useState, useMemo } from "react";
>>>>>>> origin/main
import Link from "next/link";
import { House, CreateHouseDto, UpdateHouseDto } from "@/types/property"; 
import { getHouses, createHouse, updateHouse, deleteHouse } from "@/services/propertyService";

<<<<<<< HEAD
// --- ICONS COMPONENTS
const EditIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
);
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
);
const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);

=======
>>>>>>> origin/main
export default function HousesPage() {
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  
<<<<<<< HEAD
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
  
  // State formData dùng chung, kiểu mặc định là CreateHouseDto
  // (Vì UpdateHouseDto và CreateHouseDto giống nhau về field nên có thể dùng chung ở đây)
=======
  // State tìm kiếm
  const [searchTerm, setSearchTerm] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHouse, setEditingHouse] = useState<House | null>(null);
>>>>>>> origin/main
  const [formData, setFormData] = useState<CreateHouseDto>({ name: "", address: "" });

  useEffect(() => {
    loadHouses();
  }, []);

  const loadHouses = async () => {
<<<<<<< HEAD
=======
    setLoading(true);
>>>>>>> origin/main
    try {
      const data = await getHouses();
      setHouses(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
=======
  // --- LOGIC LỌC DỮ LIỆU ---
  const filteredHouses = useMemo(() => {
      return houses.filter(h => 
        h.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        h.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [houses, searchTerm]);

  // --- FORM HANDLING ---
>>>>>>> origin/main
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingHouse) {
<<<<<<< HEAD
        // Ép kiểu formData sang UpdateHouseDto để đúng chuẩn khi gọi hàm update
=======
>>>>>>> origin/main
        const updateData: UpdateHouseDto = {
            name: formData.name,
            address: formData.address
        };
<<<<<<< HEAD
        // Hàm updateHouse
=======
>>>>>>> origin/main
        await updateHouse(editingHouse.id, updateData);
      } else {
        await createHouse(formData);
      }
      setIsModalOpen(false);
      resetForm();
      loadHouses();
    } catch { 
      alert("Đã có lỗi xảy ra");
    }
  };

  const handleEdit = (house: House) => {
    setEditingHouse(house);
    setFormData({ name: house.name, address: house.address });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Bạn chắc chắn muốn xóa nhà này? Hành động này không thể hoàn tác.")) {
      try {
        await deleteHouse(id);
        loadHouses();
      } catch {
<<<<<<< HEAD
        alert("Không thể xóa nhà này (có thể do đang chứa phòng/hợp đồng)");
=======
        alert("Không thể xóa nhà này");
>>>>>>> origin/main
      }
    }
  };

  const resetForm = () => {
    setEditingHouse(null);
    setFormData({ name: "", address: "" });
  };

  return (
<<<<<<< HEAD
    <div className="p-6 bg-gray-50 min-h-screen"> 
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Danh sách Nhà Trọ</h1>
          <p className="text-gray-500 mt-1 text-sm">Quản lý các tòa nhà và địa chỉ kinh doanh của bạn</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 transition shadow-sm font-medium"
        >
          <PlusIcon />
          Thêm Nhà Mới
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {houses.map((house) => (
            <div key={house.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200 flex flex-col justify-between h-full group">
              {/* Card Header */}
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-blue-50 text-blue-700 p-3 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4 8 4v14"/><path d="M9 10a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v11H9V10z"/></svg>
                  </div>
                  
                  {/* Action Buttons (Sửa/Xóa) */}
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(house)} 
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                      title="Sửa thông tin"
                    >
                      <EditIcon />
                    </button>
                    <button 
                      onClick={() => handleDelete(house.id)} 
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition"
                      title="Xóa nhà"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>

                <h2 className="text-lg font-bold text-gray-800 mb-1">{house.name}</h2>
                <div className="flex items-start gap-2 text-gray-500 text-sm mb-6">
                  <div className="mt-0.5"><MapPinIcon /></div>
                  <span className="line-clamp-2">{house.address}</span>
                </div>
              </div>

              {/* Card Footer: Nút Xem phòng */}
              <div className="mt-auto border-t pt-4">
                <Link 
                  href={`/owner/rooms?houseId=${house.id}`}
                  className="block w-full text-center py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition"
                >
                  Quản lý Phòng &rarr;
                </Link>
              </div>
            </div>
          ))}
          
          {/* Empty State nếu chưa có nhà */}
          {houses.length === 0 && (
             <div className="col-span-full text-center py-12 bg-white border border-dashed border-gray-300 rounded-xl">
                <p className="text-gray-500">Bạn chưa có nhà trọ nào.</p>
                <button onClick={() => setIsModalOpen(true)} className="text-green-600 font-medium mt-2 hover:underline">
                  Tạo nhà trọ đầu tiên
                </button>
             </div>
          )}
        </div>
      )}

      {/* Modal Form */}
=======
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen text-gray-800"> 
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-start">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Danh sách Nhà Trọ</h2>
                <p className="text-gray-500 text-sm">Quản lý các tòa nhà và địa chỉ kinh doanh</p>
            </div>
             <button 
                onClick={() => { resetForm(); setIsModalOpen(true); }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm font-medium text-sm"
            >
                 + Thêm Nhà Mới
            </button>
        </div>
      </div>

      {/* --- TOOLBAR / FILTER --- */}
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="w-full md:w-96">
              <input 
                  type="text"
                  placeholder="Tìm kiếm theo tên nhà hoặc địa chỉ..."
                  className="px-4 py-2 border rounded-md text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="text-sm text-gray-500">
              Hiển thị {filteredHouses.length} kết quả
          </div>
      </div>

      {/* --- TABLE VIEW --- */}
      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
                        <tr>
                            <th className="p-4 border-b w-16 text-center">STT</th>
                            <th className="p-4 border-b">Tên Nhà</th>
                            <th className="p-4 border-b">Địa chỉ</th>
                            <th className="p-4 border-b text-center">Quản lý</th>
                            <th className="p-4 border-b text-center">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm divide-y divide-gray-100">
                        {filteredHouses.length > 0 ? filteredHouses.map((house, index) => (
                            <tr key={house.id} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4 text-center font-mono text-gray-500">{index + 1}</td>
                                <td className="p-4 font-bold text-gray-800">
                                    {house.name}
                                </td>
                                <td className="p-4 text-gray-600">{house.address}</td>
                                <td className="p-4 text-center">
                                     <Link 
                                        href={`/owner/rooms?houseId=${house.id}`}
                                        className="text-blue-600 hover:text-blue-800 text-xs font-semibold bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition"
                                    >
                                        Xem danh sách phòng
                                    </Link>
                                </td>
                                <td className="p-4 text-center">
                                    <div className="flex justify-center gap-2">
                                        <button 
                                            onClick={() => handleEdit(house)} 
                                            className="px-3 py-1.5 text-xs font-medium text-white bg-blue-500 rounded hover:bg-blue-600 transition"
                                        >
                                            Sửa
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(house.id)} 
                                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded hover:bg-red-600 transition"
                                        >
                                            Xóa
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={5} className="p-10 text-center text-gray-400">
                                    Không tìm thấy nhà trọ nào phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* --- MODAL FORM --- */}
>>>>>>> origin/main
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-800">{editingHouse ? "Cập nhật thông tin" : "Thêm Nhà Mới"}</h2>
<<<<<<< HEAD
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">✕</button>
=======
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
>>>>>>> origin/main
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên nhà trọ <span className="text-red-500">*</span></label>
                <input 
<<<<<<< HEAD
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
=======
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="Ví dụ: Nhà trọ Hạnh Phúc 1"
>>>>>>> origin/main
                  required 
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Địa chỉ <span className="text-red-500">*</span></label>
                <input 
<<<<<<< HEAD
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition" 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
=======
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  placeholder="Ví dụ: 123 đường ABC, Quận XYZ..."
>>>>>>> origin/main
                  required 
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
<<<<<<< HEAD
                  className="px-5 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 shadow-sm transition"
=======
                  className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition"
>>>>>>> origin/main
                >
                  {editingHouse ? "Lưu thay đổi" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}