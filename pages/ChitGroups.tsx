
import React, { useState } from 'react';
import { ChitGroup } from '../types';
import { Plus, Search, Layers, X, Trash2, Info, Smartphone } from 'lucide-react';
import { formatCurrency, calculateChitEndDate } from '../utils';

interface ChitGroupsProps {
  groups: ChitGroup[];
  setGroups: React.Dispatch<React.SetStateAction<ChitGroup[]>>;
}

const ChitGroups: React.FC<ChitGroupsProps> = ({ groups, setGroups }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<ChitGroup>>({
    name: '',
    totalValue: 100000,
    totalMonths: 20,
    memberCount: 20,
    regularInstallment: 5000,
    prizedInstallment: 6000,
    startDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    upiId: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.startDate || !formData.regularInstallment || !formData.prizedInstallment) {
      return alert('Financial parameters are mandatory.');
    }
    
    const start = new Date(formData.startDate);
    const months = Number(formData.totalMonths);
    
    const newGroup: ChitGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name || '',
      totalValue: Number(formData.totalValue),
      totalMonths: months,
      memberCount: Number(formData.memberCount) || months,
      regularInstallment: Number(formData.regularInstallment),
      prizedInstallment: Number(formData.prizedInstallment),
      startDate: formData.startDate || '',
      endDate: calculateChitEndDate(formData.startDate, months),
      allotmentDay: start.getDate(),
      status: formData.status as 'Active' | 'Closed' || 'Active',
      upiId: formData.upiId
    };

    setGroups([...groups, newGroup]);
    setIsModalOpen(false);
    setFormData({
      name: '', totalValue: 100000, totalMonths: 20, memberCount: 20, regularInstallment: 5000, prizedInstallment: 6000,
      startDate: new Date().toISOString().split('T')[0], status: 'Active', upiId: ''
    });
  };

  const deleteGroup = (id: string) => {
    if (window.confirm('Delete this portfolio master? This will hide all linked data.')) {
      setGroups(groups.filter(g => g.id !== id));
    }
  };

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print bg-white p-4 rounded-sm border border-[#edebe9] shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a19f9d]" />
          <input
            type="text"
            placeholder="Filter Portfolio Registry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#0078d4] text-white px-8 py-2.5 rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-[#106ebe] transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> Create Portfolio
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map(group => (
          <div key={group.id} className="bg-white border border-[#edebe9] rounded-sm p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-5">
              <div className="bg-[#deecf9] p-3 rounded-sm">
                <Layers className="w-5 h-5 text-[#0078d4]" />
              </div>
              <button onClick={() => deleteGroup(group.id)} className="text-[#a19f9d] hover:text-[#a4262c] p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <h3 className="text-base font-bold text-[#323130] mb-4">{group.name}</h3>
            <div className="space-y-3">
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#605e5c] uppercase">Fund Value</span>
                  <span className="text-sm font-bold">{formatCurrency(group.totalValue)}</span>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#605e5c] uppercase">Collection VPA</span>
                  <span className="text-[10px] font-bold text-[#0078d4] font-mono">{group.upiId || 'SYSTEM GLOBAL'}</span>
               </div>
               <div className="flex items-center justify-between pt-2 border-t border-[#f3f2f1]">
                  <span className="text-[10px] font-bold text-[#605e5c] uppercase">Capacity</span>
                  <span className="text-xs font-bold text-[#0078d4]">{group.memberCount} Subscribers</span>
               </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/40 backdrop-blur-sm p-4 overflow-y-auto pt-10 pb-10">
          <div className="bg-white rounded-sm w-full max-w-lg p-8 shadow-2xl border border-[#edebe9] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-[#323130] uppercase tracking-tighter">Portfolio Master Setup</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#a19f9d] hover:text-[#323130]"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-1.5 tracking-widest">Group Designation*</label>
                  <input required type="text" placeholder="e.g. Executive Group - Series A" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 text-sm font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-1.5 tracking-widest">Total Fund (₹)*</label>
                      <input required type="number" value={formData.totalValue} onChange={e => setFormData({...formData, totalValue: Number(e.target.value)})} className="w-full px-3 py-2 text-sm" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-1.5 tracking-widest">Subscriber Capacity*</label>
                      <input required type="number" value={formData.memberCount} onChange={e => setFormData({...formData, memberCount: Number(e.target.value)})} className="w-full px-3 py-2 text-sm font-bold text-[#0078d4]" />
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-1.5 tracking-widest">Reg. Installment*</label>
                      <input required type="number" value={formData.regularInstallment} onChange={e => setFormData({...formData, regularInstallment: Number(e.target.value)})} className="w-full px-3 py-2 text-sm" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-1.5 tracking-widest">Prized Rate*</label>
                      <input required type="number" value={formData.prizedInstallment} onChange={e => setFormData({...formData, prizedInstallment: Number(e.target.value)})} className="w-full px-3 py-2 text-sm" />
                   </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-1.5 tracking-widest flex items-center gap-2">
                    <Smartphone className="w-3 h-3 text-[#0078d4]" /> Portfolio UPI ID (VPA)
                  </label>
                  <input type="text" placeholder="upi-id@bank (Optional)" value={formData.upiId} onChange={e => setFormData({...formData, upiId: e.target.value})} className="w-full px-3 py-2 text-sm font-bold text-[#0078d4]" />
                </div>
              </div>

              <div className="bg-[#faf9f8] p-4 rounded-sm border border-[#edebe9] flex gap-3">
                 <Info className="w-4 h-4 text-[#0078d4] shrink-0" />
                 <p className="text-[10px] font-semibold text-[#605e5c] uppercase leading-relaxed">
                   Providing a Portfolio UPI ID will override the system global UPI for all collections in this specific group.
                 </p>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-[#edebe9] rounded-sm text-[10px] font-bold uppercase tracking-widest text-[#605e5c] hover:bg-[#faf9f8]">Discard</button>
                <button type="submit" className="flex-1 py-3 bg-[#0078d4] text-white rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-[#106ebe] shadow-md">Finalize Master</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChitGroups;
