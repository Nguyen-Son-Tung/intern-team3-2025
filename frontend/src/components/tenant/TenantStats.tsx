import React from 'react';
import { Users, UserCheck } from 'lucide-react';

interface TenantStatsProps {
    totalTenants: number;
}

export default function TenantStats({ totalTenants }: TenantStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">Tổng khách thuê</p>
                    <h3 className="text-2xl font-bold text-gray-800 mt-1">{totalTenants}</h3>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">Trạng thái</p>
                    <h3 className="text-2xl font-bold text-green-600 mt-1">Hoạt động</h3>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                    <UserCheck className="w-6 h-6 text-green-600" />
                </div>
            </div>
        </div>
    );
}