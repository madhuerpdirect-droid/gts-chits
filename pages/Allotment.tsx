
import React, { useState, useMemo } from 'react';
import { ChitGroup, Member } from '../types';
import { Search, Award, CheckCircle2, UserCheck, Calendar, Info, ArrowLeft, ShieldCheck, AlertCircle, X } from 'lucide-react';
import { formatCurrency } from '../utils';

interface AllotmentProps {
  groups: ChitGroup[];
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  onBack?: () => void;
}

const Allotment: React.FC<AllotmentProps> = ({ groups, members, setMembers, onBack }) => {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmingMember, setConfirmingMember] = useState<Member | null>(null);
  const [lastAlloted, setLastAlloted] = useState<string | null>(null);

  const group = groups.find(g => g.id === selectedGroup);
  
  const groupMembers = useMemo(() => {
    return members.filter(m => m.groupId === selectedGroup);
  }, [members, selectedGroup]);

  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return groupMembers;
    return groupMembers.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.phone.includes(searchTerm)
    );
  }, [groupMembers, searchTerm]);

  const handleFinalizeAllotment = () => {
    if (!confirmingMember || !group) return;

    setMembers(prev => prev.map(m => 
      m.id === confirmingMember.id ? { ...m, isPrized: true, prizedMonth: selectedMonth } : m
    ));
    
    setLastAlloted(confirmingMember.name);
    setConfirmingMember(null);
    setSearchTerm('');
    
    // Auto-clear success message after 5 seconds
    setTimeout(() => setLastAlloted(null), 5000);
  };

  return (
    <div className="space-y-6 text-[#323130] pb-20">
      {/* Success Notification Banner */}
      {lastAlloted && (
        <div className="bg-[#dff6dd] border border-[#b1e5ad] p-4 rounded-sm flex items-center justify-between shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3">
             <ShieldCheck className="w-5 h-5 text-[#107c10]" />
             <p className="text-[10px] font-bold text-[#107c10] uppercase tracking-widest">Master Ledger Sync Complete: {lastAlloted} confirmed for Month {selectedMonth}</p>
          </div>
          <button onClick={() => setLastAlloted(null)} className="text-[#107c10]"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Control Panel */}
      <div className="bg-white p-6 rounded-sm border border-[#edebe9] shadow-sm flex flex-wrap gap-6 items-end no-print relative overflow-hidden">
        <div className="flex-1 min-w-[280px]">
          <label className="block text-[10px] font-bold text-[#605e5c] uppercase tracking-widest mb-2">Portfolio Master Selection</label>
          <select 
            value={selectedGroup} 
            onChange={e => setSelectedGroup(e.target.value)}
            className="w-full px-3 py-2.5 border border-[#edebe9] rounded-sm text-sm font-bold text-[#0078d4] outline-none focus:ring-1 focus:ring-[#0078d4] transition-all"
          >
            <option value="">Choose Portfolio Master...</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="w-28">
          <label className="block text-[10px] font-bold text-[#605e5c] uppercase tracking-widest mb-2">Inst. Month</label>
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="w-full px-3 py-2.5 border border-[#edebe9] rounded-sm text-sm font-bold text-center bg-[#faf9f8]"
          >
            {Array.from({ length: 48 }, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Member Registry List */}
        <div className="lg:col-span-2 space-y-4">
           {selectedGroup ? (
             <div className="bg-white border border-[#edebe9] rounded-sm shadow-sm flex flex-col min-h-[500px]">
                <div className="p-5 border-b border-[#f3f2f1] flex items-center justify-between bg-[#faf9f8]">
                   <div>
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#605e5c]">Portfolio Registry</h3>
                      <p className="text-[9px] font-semibold text-[#a19f9d] uppercase">Winners are grayed and restricted</p>
                   </div>
                   <div className="relative w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#a19f9d]" />
                      <input 
                        type="text" 
                        placeholder="Filter by Name/Mobile..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white border border-[#edebe9] rounded-sm text-[11px] outline-none font-semibold focus:border-[#0078d4]"
                      />
                   </div>
                </div>
                <div className="overflow-y-auto flex-1">
                   <table className="w-full text-left">
                     <thead className="bg-[#fcfcfc] text-[9px] font-bold uppercase text-[#a19f9d] border-b border-[#f3f2f1]">
                       <tr>
                         <th className="px-6 py-4">Subscriber Identity</th>
                         <th className="px-6 py-4">Status</th>
                         <th className="px-6 py-4 text-right">Master Control</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-[#f3f2f1]">
                       {filteredMembers.map(m => (
                         <tr key={m.id} className={`transition-all ${m.isPrized ? 'opacity-40 bg-[#faf9f8]' : 'hover:bg-[#f3f9ff] group'}`}>
                           <td className="px-6 py-5">
                             <div className="flex items-center gap-3">
                               <div className={`w-8 h-8 rounded-sm flex items-center justify-center font-bold text-[10px] transition-colors ${m.isPrized ? 'bg-[#c8c6c4] text-white' : 'bg-[#edebe9] text-[#323130] group-hover:bg-[#0078d4] group-hover:text-white'}`}>
                                 {m.name.charAt(0)}
                               </div>
                               <div>
                                 <p className="text-sm font-bold text-[#323130]">{m.name}</p>
                                 <p className="text-[10px] font-semibold text-[#605e5c] uppercase tracking-tighter">{m.phone}</p>
                               </div>
                             </div>
                           </td>
                           <td className="px-6 py-5">
                             {m.isPrized ? (
                               <span className="inline-flex items-center gap-1.5 text-[9px] font-bold text-[#7a5e00] bg-[#fff4ce] px-2 py-0.5 rounded-sm uppercase border border-[#fde38b]">
                                 <Award className="w-3 h-3" /> Winner Month {m.prizedMonth}
                               </span>
                             ) : (
                               <span className="text-[9px] font-bold text-[#107c10] uppercase flex items-center gap-1.5 opacity-60">
                                 <CheckCircle2 className="w-3 h-3" /> Eligible
                               </span>
                             )}
                           </td>
                           <td className="px-6 py-5 text-right">
                             {m.isPrized ? (
                               <button disabled className="bg-[#f3f2f1] text-[#a19f9d] border border-[#edebe9] px-4 py-2 rounded-sm text-[9px] font-bold uppercase cursor-not-allowed">
                                 Account Closed
                               </button>
                             ) : (
                               <button 
                                 onClick={() => setConfirmingMember(m)}
                                 className="bg-white text-[#0078d4] border border-[#0078d4] px-6 py-2 rounded-sm text-[10px] font-bold uppercase hover:bg-[#0078d4] hover:text-white transition-all shadow-sm active:scale-95"
                               >
                                 Allot Prize
                               </button>
                             )}
                           </td>
                         </tr>
                       ))}
                       {filteredMembers.length === 0 && (
                         <tr><td colSpan={3} className="px-6 py-24 text-center">
                            <UserCheck className="w-12 h-12 text-[#f3f2f1] mx-auto mb-4" />
                            <p className="text-[10px] font-bold text-[#c8c6c4] uppercase tracking-widest">No matching subscribers in registry</p>
                         </td></tr>
                       )}
                     </tbody>
                   </table>
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center p-24 bg-white border border-[#edebe9] rounded-sm text-center shadow-inner">
                <Calendar className="w-16 h-16 text-[#f3f2f1] mb-6" />
                <h3 className="text-base font-bold uppercase tracking-widest text-[#323130]">Portfolio Master Required</h3>
                <p className="text-[10px] font-bold text-[#a19f9d] mt-2 uppercase max-w-xs mx-auto leading-relaxed">
                  Select a portfolio from the top master selector to load candidate subscribers for allotment.
                </p>
             </div>
           )}
        </div>

        {/* Audit Sidebar */}
        <div className="space-y-6">
           <div className="bg-[#deecf9] p-7 rounded-sm border border-[#71afe5] shadow-sm">
              <div className="flex items-center gap-3 text-[#0078d4] mb-6">
                 <Award className="w-5 h-5" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest">Ledger Impact Audit</h3>
              </div>
              <div className="space-y-4">
                 <div className="bg-white/70 p-4 rounded-sm border border-white/50">
                    <p className="text-[9px] font-bold text-[#605e5c] uppercase mb-1">Portfolio Value</p>
                    <p className="text-sm font-black text-[#323130]">{group ? formatCurrency(group.totalValue) : '---'}</p>
                 </div>
                 <div className="bg-white/70 p-4 rounded-sm border border-white/50">
                    <p className="text-[9px] font-bold text-[#605e5c] uppercase mb-3 tracking-widest text-center">Rate Progression</p>
                    <div className="flex items-center justify-between px-2">
                       <div className="text-center">
                          <span className="block text-[8px] font-bold uppercase text-[#605e5c] mb-1">Before Win</span>
                          <span className="text-sm font-black text-[#107c10]">{group ? formatCurrency(group.regularInstallment) : '---'}</span>
                       </div>
                       <div className="h-8 w-px bg-[#71afe5] opacity-30"></div>
                       <div className="text-center">
                          <span className="block text-[8px] font-bold uppercase text-[#605e5c] mb-1">After Win</span>
                          <span className="text-sm font-black text-[#a4262c]">{group ? formatCurrency(group.prizedInstallment) : '---'}</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="bg-white p-7 rounded-sm border border-[#edebe9] shadow-sm relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#0078d4]"></div>
              <div className="flex items-center gap-3 text-[#323130] mb-4">
                 <Info className="w-4 h-4 text-[#0078d4]" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest">Protocol Memo</h3>
              </div>
              <p className="text-[11px] font-semibold text-[#605e5c] leading-relaxed uppercase">
                Prize Allotment for Month {selectedMonth} is a permanent ledger entry. The subscriber's installment will increase from Month {selectedMonth + 1} onwards.
              </p>
           </div>
        </div>
      </div>

      {/* MODAL: FINAL CONFIRMATION OVERLAY */}
      {confirmingMember && (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-sm w-full max-w-md shadow-2xl border border-[#edebe9] overflow-hidden transform animate-in zoom-in-95">
            <div className="bg-[#a4262c] p-6 text-white flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6" />
                  <h2 className="text-lg font-black uppercase tracking-tighter">Confirm Allotment</h2>
               </div>
               <button onClick={() => setConfirmingMember(null)} className="p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="p-8 space-y-6 bg-white">
               <div className="space-y-2 text-center pb-4 border-b border-[#f3f2f1]">
                  <p className="text-[10px] font-bold text-[#605e5c] uppercase tracking-widest">Declare Winner for Month {selectedMonth}</p>
                  <p className="text-2xl font-black text-[#323130]">{confirmingMember.name}</p>
                  <p className="text-xs font-bold text-[#0078d4] font-mono">{confirmingMember.phone}</p>
               </div>

               <div className="bg-[#faf9f8] p-5 rounded-sm border border-[#edebe9] space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-bold text-[#605e5c] uppercase">Current Rate</span>
                     <span className="text-sm font-bold text-[#107c10]">{formatCurrency(group?.regularInstallment || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                     <span className="text-[10px] font-bold text-[#605e5c] uppercase">Future Rate (M{selectedMonth+1}+)</span>
                     <span className="text-sm font-bold text-[#a4262c]">{formatCurrency(group?.prizedInstallment || 0)}</span>
                  </div>
               </div>

               <div className="flex flex-col gap-3 pt-4">
                  <button 
                    onClick={handleFinalizeAllotment}
                    className="w-full bg-[#0078d4] text-white py-4 rounded-sm font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#106ebe] transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" /> Finalize Registry Update
                  </button>
                  <button 
                    onClick={() => setConfirmingMember(null)}
                    className="w-full bg-white text-[#605e5c] border border-[#edebe9] py-3 rounded-sm font-bold text-[10px] uppercase tracking-widest hover:bg-[#faf9f8] transition-colors"
                  >
                    Discard Changes
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Allotment;
