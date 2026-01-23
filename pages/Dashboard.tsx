
import React from 'react';
import { ChitGroup, Member, Payment } from '../types';
import { formatCurrency } from '../utils';
import { getLastBackupDate } from '../storage';
import { 
  Users, 
  Layers, 
  Wallet,
  IndianRupee,
  Database,
  History,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';

interface DashboardProps {
  groups: ChitGroup[];
  members: Member[];
  payments: Payment[];
}

const Dashboard: React.FC<DashboardProps> = ({ groups, members, payments }) => {
  const totalCollections = payments.reduce((sum, p) => sum + p.amountPaid, 0);
  const activeGroups = groups.filter(g => g.status === 'Active').length;
  const totalMembers = members.length;
  const lastBackup = getLastBackupDate();

  const stats = [
    { name: 'Active Portfolios', value: activeGroups, icon: Layers, color: 'bg-[#0078d4]', trend: 'LIVE' },
    { name: 'Total Subscribers', value: totalMembers, icon: Users, color: 'bg-[#004e8c]', trend: 'ACTIVE' },
    { name: 'Total Receipts', value: formatCurrency(totalCollections), icon: Wallet, color: 'bg-[#107c10]', trend: 'FY2024' },
    { name: 'Backup Health', value: lastBackup ? new Date(lastBackup).toLocaleDateString() : 'Pending', icon: Database, color: lastBackup ? 'bg-[#323130]' : 'bg-[#d83b01]', trend: lastBackup ? 'SYNCED' : 'WARNING' },
  ];

  const groupData = groups.map(g => ({
    name: g.name.length > 15 ? g.name.substring(0, 15) + '...' : g.name,
    members: members.filter(m => m.groupId === g.id).length
  }));

  return (
    <div className="space-y-6 text-[#323130]">
      {/* Critical Alert */}
      {!lastBackup && (
        <div className="bg-[#fde7e9] border border-[#f4b6b1] p-4 rounded-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-[#a4262c]" />
            <p className="text-[#a4262c] text-xs font-bold uppercase tracking-wider">Security Warning: No data backup detected. Export your database immediately.</p>
          </div>
          <button onClick={() => window.location.hash = '#Settings'} className="text-[10px] font-bold text-[#a4262c] uppercase border-b border-[#a4262c] hover:opacity-70">Security Master</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-sm border border-[#edebe9] shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.color} p-2 rounded-sm`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-sm border ${
                stat.trend === 'WARNING' ? 'bg-[#fde7e9] text-[#a4262c] border-[#f4b6b1]' : 'bg-[#f3f2f1] text-[#605e5c] border-[#edebe9]'
              }`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-[#605e5c] text-[10px] font-bold uppercase tracking-wider">{stat.name}</h3>
            <p className="text-xl font-bold text-[#323130] mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Analytics Card */}
        <div className="bg-white p-6 rounded-sm border border-[#edebe9] shadow-sm flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8 border-b border-[#f3f2f1] pb-4">
             <h3 className="text-xs font-bold text-[#323130] uppercase tracking-wider flex items-center gap-2">
               <ShieldCheck className="w-4 h-4 text-[#0078d4]" /> Subscription Distribution
             </h3>
             <span className="text-[10px] font-bold text-[#a19f9d] uppercase">By Portfolio</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={groupData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edebe9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#605e5c' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 9, fontWeight: 700, fill: '#605e5c' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f3f2f1' }}
                  contentStyle={{ 
                    borderRadius: '2px', 
                    border: '1px solid #edebe9', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#fff',
                    padding: '8px'
                  }}
                  labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#323130' }}
                  itemStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#0078d4' }}
                />
                <Bar dataKey="members" fill="#0078d4" radius={[2, 2, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Ledger Logs */}
        <div className="bg-white p-6 rounded-sm border border-[#edebe9] shadow-sm flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-8 border-b border-[#f3f2f1] pb-4">
             <h3 className="text-xs font-bold text-[#323130] uppercase tracking-wider flex items-center gap-2">
               <History className="w-4 h-4 text-[#0078d4]" /> Collection Ledger Logs
             </h3>
             <button onClick={() => window.location.hash = '#Collection'} className="text-[10px] font-bold text-[#0078d4] uppercase hover:underline">View Journal</button>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto">
            {payments.slice(-6).reverse().map((p) => {
              const member = members.find(m => m.id === p.memberId);
              return (
                <div key={p.id} className="flex items-center justify-between p-3 rounded-sm border border-[#f3f2f1] hover:bg-[#faf9f8] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-sm bg-[#f3f2f1] flex items-center justify-center text-[#0078d4]">
                      <IndianRupee className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#323130]">{member?.name || 'Archived User'}</p>
                      <p className="text-[9px] font-semibold text-[#605e5c] uppercase">{p.paymentDate} • {p.paymentMode}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-[#107c10]">+{formatCurrency(p.amountPaid)}</p>
                    <p className="text-[8px] font-bold text-[#a19f9d] uppercase">Installment {p.monthNumber}</p>
                  </div>
                </div>
              );
            })}
            {payments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-[#c8c6c4]">
                <Database className="w-10 h-10 mb-2 opacity-30" />
                <p className="text-[9px] font-bold uppercase tracking-widest">No Recent Activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
