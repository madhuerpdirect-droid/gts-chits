
import React, { useMemo } from 'react';
import { ChitGroup, Member, Payment } from '../types';
import { formatCurrency, getCurrentChitMonth, calculateExpectedAmount } from '../utils';
import { getLastBackupDate } from '../storage';
import { 
  Users, 
  Layers, 
  Wallet,
  IndianRupee,
  Database,
  History,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Clock
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

  // Group-wise performance data for the CURRENT MONTH
  const currentMonthStats = useMemo(() => {
    return groups.filter(g => g.status === 'Active').map(group => {
      const currentMonth = getCurrentChitMonth(group.startDate);
      const groupMembers = members.filter(m => m.groupId === group.id);
      
      // Calculate Total Expected for this group for current month
      const totalExpected = groupMembers.reduce((sum, m) => {
        return sum + calculateExpectedAmount(group, m, currentMonth);
      }, 0);

      // Calculate Total Received for this group for current month
      const totalReceived = payments
        .filter(p => p.groupId === group.id && p.monthNumber === currentMonth)
        .reduce((sum, p) => sum + p.amountPaid, 0);

      const totalPending = Math.max(0, totalExpected - totalReceived);
      const progress = totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0;

      return {
        id: group.id,
        name: group.name,
        month: currentMonth,
        expected: totalExpected,
        received: totalReceived,
        pending: totalPending,
        progress: Math.min(100, progress)
      };
    });
  }, [groups, members, payments]);

  const stats = [
    { name: 'Active Portfolios', value: activeGroups, icon: Layers, color: 'bg-[#0078d4]', trend: 'LIVE' },
    { name: 'Total Subscribers', value: totalMembers, icon: Users, color: 'bg-[#004e8c]', trend: 'ACTIVE' },
    { name: 'Total Receipts', value: formatCurrency(totalCollections), icon: Wallet, color: 'bg-[#107c10]', trend: 'TOTAL' },
    { name: 'Backup Health', value: lastBackup ? new Date(lastBackup).toLocaleDateString() : 'Pending', icon: Database, color: lastBackup ? 'bg-[#323130]' : 'bg-[#d83b01]', trend: lastBackup ? 'SYNCED' : 'WARNING' },
  ];

  const chartData = groups.map(g => ({
    name: g.name.length > 12 ? g.name.substring(0, 10) + '...' : g.name,
    members: members.filter(m => m.groupId === g.id).length
  }));

  return (
    <div className="space-y-4 sm:space-y-6 text-[#323130] pb-24 sm:pb-10">
      {/* Critical Alert */}
      {!lastBackup && (
        <div className="bg-[#fde7e9] border border-[#f4b6b1] p-3 sm:p-4 rounded-sm flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[#a4262c] shrink-0" />
            <p className="text-[#a4262c] text-[9px] sm:text-xs font-bold uppercase tracking-wider leading-tight">Backup Warning: No data export detected.</p>
          </div>
          <button onClick={() => window.location.hash = '#Settings'} className="text-[9px] font-bold text-[#a4262c] uppercase border-b border-[#a4262c] whitespace-nowrap">Settings</button>
        </div>
      )}

      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-3 sm:p-6 rounded-sm border border-[#edebe9] shadow-sm">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className={`${stat.color} p-1.5 sm:p-2 rounded-sm`}>
                <stat.icon className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              </div>
              <span className={`text-[7px] sm:text-[9px] font-bold px-1 py-0.5 rounded-sm border whitespace-nowrap ${
                stat.trend === 'WARNING' ? 'bg-[#fde7e9] text-[#a4262c] border-[#f4b6b1]' : 'bg-[#f3f2f1] text-[#605e5c] border-[#edebe9]'
              }`}>
                {stat.trend}
              </span>
            </div>
            <h3 className="text-[#605e5c] text-[8px] sm:text-[10px] font-black uppercase tracking-widest leading-none mb-1">{stat.name}</h3>
            <p className="text-xs sm:text-xl font-black text-[#323130] truncate">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Collection Health Table (Current Month) */}
      <div className="bg-white rounded-sm border border-[#edebe9] shadow-sm overflow-hidden">
        <div className="p-3 sm:p-6 border-b border-[#f3f2f1] flex items-center justify-between bg-[#faf9f8]">
          <div className="flex items-center gap-2 text-[#0078d4]">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            <h3 className="text-[9px] sm:text-xs font-black uppercase tracking-widest">Monthly Collection Monitor</h3>
          </div>
          <span className="text-[8px] sm:text-[10px] font-bold text-[#a19f9d] uppercase">Real-time Recovery Audit</span>
        </div>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full text-left text-xs min-w-[550px]">
            <thead>
              <tr className="bg-[#fcfcfc] border-b border-[#f3f2f1] text-[8px] sm:text-[9px] text-[#a19f9d] font-black uppercase tracking-widest">
                <th className="px-4 sm:px-6 py-3 sm:py-4">Portfolio Master</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-center">Month</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Receipts</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4">Pending</th>
                <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">Recovery %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2f1]">
              {currentMonthStats.map((stat) => (
                <tr key={stat.id} className="hover:bg-[#fcfcfc] transition-colors">
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <div className="flex flex-col">
                      <span className="font-black text-[#323130] leading-tight mb-0.5">{stat.name}</span>
                      <span className="text-[8px] text-[#a19f9d] font-bold uppercase">Target: {formatCurrency(stat.expected)}</span>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-center">
                    <span className="px-2 py-0.5 sm:py-1 bg-[#f3f2f1] rounded-sm font-black text-[#605e5c] text-[10px]">M{stat.month}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className="font-black text-[#107c10]">{formatCurrency(stat.received)}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5">
                    <span className={`font-black ${stat.pending > 0 ? 'text-[#a4262c]' : 'text-[#a19f9d]'}`}>
                      {stat.pending > 0 ? formatCurrency(stat.pending) : 'CLEARED'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 sm:py-5 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <span className="font-black text-[#0078d4]">{stat.progress.toFixed(0)}%</span>
                      <div className="w-16 sm:w-24 h-1 sm:h-1.5 bg-[#f3f2f1] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${stat.progress === 100 ? 'bg-[#107c10]' : 'bg-[#0078d4]'}`} 
                          style={{ width: `${stat.progress}%` }} 
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {currentMonthStats.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center opacity-30">
                    <Clock className="w-8 h-8 mx-auto mb-2" />
                    <p className="font-black uppercase text-[9px] tracking-widest">No Active Portfolios Found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Analytics Card */}
        <div className="bg-white p-4 sm:p-6 rounded-sm border border-[#edebe9] shadow-sm flex flex-col min-h-[300px] sm:min-h-[350px]">
          <div className="flex items-center justify-between mb-6 border-b border-[#f3f2f1] pb-3 sm:pb-4">
             <h3 className="text-[9px] sm:text-[10px] font-black text-[#323130] uppercase tracking-widest flex items-center gap-2">
               <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0078d4]" /> Subscriber Distribution
             </h3>
             <span className="text-[8px] sm:text-[9px] font-bold text-[#a19f9d] uppercase">Portfolio Density</span>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edebe9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 900, fill: '#605e5c' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 8, fontWeight: 900, fill: '#605e5c' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f3f2f1' }}
                  contentStyle={{ 
                    borderRadius: '2px', 
                    border: '1px solid #edebe9', 
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#fff',
                    padding: '6px'
                  }}
                  labelStyle={{ fontSize: '9px', fontWeight: 'bold', color: '#323130' }}
                  itemStyle={{ fontSize: '9px', fontWeight: 'bold', color: '#0078d4' }}
                />
                <Bar dataKey="members" fill="#0078d4" radius={[2, 2, 0, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Ledger Logs */}
        <div className="bg-white p-4 sm:p-6 rounded-sm border border-[#edebe9] shadow-sm flex flex-col min-h-[300px] sm:min-h-[350px]">
          <div className="flex items-center justify-between mb-6 border-b border-[#f3f2f1] pb-3 sm:pb-4">
             <h3 className="text-[9px] sm:text-[10px] font-black text-[#323130] uppercase tracking-widest flex items-center gap-2">
               <History className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0078d4]" /> Journal Activity
             </h3>
             <button onClick={() => window.location.hash = '#Collection'} className="text-[8px] sm:text-[9px] font-black text-[#0078d4] uppercase hover:underline">Full Access</button>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {payments.slice(-5).reverse().map((p) => {
              const member = members.find(m => m.id === p.memberId);
              return (
                <div key={p.id} className="flex items-center justify-between p-2.5 rounded-sm border border-[#f3f2f1] hover:bg-[#faf9f8] transition-colors group">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-sm bg-[#f3f2f1] group-hover:bg-[#deecf9] flex items-center justify-center text-[#0078d4] transition-colors shrink-0">
                      <IndianRupee className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] sm:text-xs font-black text-[#323130] truncate">{member?.name || 'Archived User'}</p>
                      <p className="text-[8px] font-bold text-[#605e5c] uppercase tracking-tighter truncate">{p.paymentDate} • {p.paymentMode}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[11px] sm:text-xs font-black text-[#107c10]">+{formatCurrency(p.amountPaid)}</p>
                    <p className="text-[8px] font-black text-[#a19f9d] uppercase leading-none mt-0.5">M{p.monthNumber}</p>
                  </div>
                </div>
              );
            })}
            {payments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-[#c8c6c4]">
                <Database className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-[9px] font-black uppercase tracking-widest">No Logs Found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
