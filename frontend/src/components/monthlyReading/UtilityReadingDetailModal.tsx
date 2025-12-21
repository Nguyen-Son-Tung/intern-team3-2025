"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { MonthlyReading } from "@/types/monthlyReading";
import { Maximize } from "lucide-react";



interface UtilityReadingDetailModalProps {
  reading: MonthlyReading;
  onClose: () => void;
}

export default function UtilityReadingDetailModal({ reading, onClose }: UtilityReadingDetailModalProps) {
  const [signedElectricUrl, setSignedElectricUrl] = useState<string | null>(null);
  const [signedWaterUrl, setSignedWaterUrl] = useState<string | null>(null);

  // Tính toán lượng tiêu thụ
  const electricUsage = (reading.electricNew || 0) - (reading.electricOld || 0);
  const waterUsage = (reading.waterNew || 0) - (reading.waterOld || 0);

  useEffect(() => {
    const fetchSignedUrl = async (photoUrl: string | undefined, setUrl: (url: string) => void) => {
      if (!photoUrl) return;
      try {
        const url = new URL(photoUrl);
        const key = url.pathname.slice(1); // Remove leading /
        const response = await fetch(`${process.env.NEXT_PUBLIC_READING_API_URL}/monthlyreading/signed-url/${key}`);
        if (response.ok) {
          const data = await response.json();
          setUrl(data.signedUrl);
        } else {
          console.error('Failed to fetch signed URL');
        }
      } catch (error) {
        console.error('Error fetching signed URL:', error);
      }
    };

    fetchSignedUrl(reading.electricPhotoUrl, setSignedElectricUrl);
    fetchSignedUrl(reading.waterPhotoUrl, setSignedWaterUrl);
  }, [reading.electricPhotoUrl, reading.waterPhotoUrl]);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 animate-slideIn flex flex-col max-h-[90vh]" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4 shrink-0">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">Chi tiết Điện/Nước</h3>
            <p className="text-sm text-gray-500">{reading.houseName} - {reading.roomName}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 text-2xl font-light transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
            {/* Chỉ số Cũ */}
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-bold text-gray-500 mb-3 text-sm border-b border-gray-200 pb-1">CHỈ SỐ CŨ</h4>
              <div className="space-y-2">
                <p className="text-sm flex justify-between">
                  <span className="text-amber-600 font-medium">⚡ Điện:</span>
                  <span className="font-bold text-gray-700">{reading.electricOld}</span>
                </p>
                <p className="text-sm flex justify-between">
                  <span className="text-blue-600 font-medium">💧 Nước:</span>
                  <span className="font-bold text-gray-700">{reading.waterOld}</span>
                </p>
              </div>
            </div>

            {/* Chỉ số Mới */}
            <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
              <h4 className="font-bold text-blue-600 mb-3 text-sm border-b border-blue-200 pb-1">CHỈ SỐ MỚI</h4>
              <div className="space-y-2">
                <p className="text-sm flex justify-between">
                  <span className="text-amber-600 font-medium">⚡ Điện:</span>
                  <span className="font-bold text-blue-800">{reading.electricNew}</span>
                </p>
                <p className="text-sm flex justify-between">
                  <span className="text-blue-600 font-medium">💧 Nước:</span>
                  <span className="font-bold text-blue-800">{reading.waterNew}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Ảnh minh chứng */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            {reading.electricPhotoUrl && (
              <div className="text-center w-full">
                <div className="relative w-full aspect-square bg-gray-200 rounded border overflow-hidden">
                    {signedElectricUrl ? (
                    <Image 
                        src={signedElectricUrl} 
                        alt="Đồng hồ Điện" 
                        fill
                        className="object-cover" 
                    />
                    ) : (
                    <div className="flex items-center justify-center h-full">Loading...</div>
                    )}
                </div>
                <p className="text-sm text-gray-600 mt-1">Đồng hồ Điện</p>
              </div>
            )}
            {reading.waterPhotoUrl && (
              <div className="text-center w-full">
                <div className="relative w-full aspect-square bg-gray-200 rounded border overflow-hidden">
                    {signedWaterUrl ? (
                    <Image 
                        src={signedWaterUrl} 
                        alt="Đồng hồ Nước" 
                        fill
                        className="object-cover" 
                    />
                    ) : (
                    <div className="flex items-center justify-center h-full">Loading...</div>
                    )}
                </div>
                <p className="text-sm text-gray-600 mt-1">Đồng hồ Nước</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer (Tính toán) */}
        <div className="mt-6 pt-4 border-t text-sm shrink-0">
          <p className="flex justify-between font-medium">
            <span>⚡ Điện tiêu thụ:</span>
            <span className="font-bold text-gray-800">{electricUsage > 0 ? electricUsage : 0} kWh</span>
          </p>
          <p className="flex justify-between font-medium mt-1">
            <span>💧 Nước tiêu thụ:</span>
            <span className="font-bold text-gray-800">{waterUsage > 0 ? waterUsage : 0} m³</span>
          </p>
        </div>
      </div>
    </div>
  );
}