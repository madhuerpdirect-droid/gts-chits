
import React, { useState, useMemo } from 'react';
import { Member, ChitGroup, Payment } from '../types';
import { Plus, Search, Trash2, Award, CheckCircle2, X, AlertCircle, ShieldAlert, Users, LayoutList, ArrowLeft } from 'lucide-react';
import { formatCurrency, getCurrentChitMonth, cleanPhoneNumber } from '../utils';

interface CandidatesProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  groups: ChitGroup[];
  payments: Payment[];
}

const Candidates: React.FC<CandidatesProps> = ({ members, setMembers, groups, payments }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Member>>({
    name: '', groupId: '', phone: '', address: '', email: '', idProofType: 'Aadhar',
    idProofNumber: '', nomineeName: '', nomineeRelation: '',
    joiningDate: new Date().toISOString().split('T')[0], isPrized: false, status: 'Active'
  });

  const selectedGroup = groups.find(g => g.id === formData.groupId);
  const currentMemberCount = useMemo(() => {
    if (!formData.groupId) return 0;
    return members.filter(m => m.groupId === formData.groupId).length;
  }, [members, formData.groupId]);

  const isSlotFull = selectedGroup ? currentMemberCount >= selectedGroup.memberCount : false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.groupId || !formData.phone) {
      return alert('Error: Mandatory fields must be completed.');
    }
    if (isSlotFull) {
      return alert('REGISTRATION BLOCKED: Group capacity exceeded.');
    }

    const sanitizedPhone = cleanPhoneNumber(formData.phone);
    const newMember: Member = {
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name || '',
      groupId: formData.groupId || '',
      phone: sanitizedPhone,
      address: formData.address || '',
      email: formData.email || '',
      idProofType: formData.idProofType || '',
      idProofNumber: formData.idProofNumber || '',
      nomineeName: formData.nomineeName || '',
      nomineeRelation: formData.nomineeRelation || '',
      joiningDate: formData.joiningDate || '',
      isPrized: !!formData.isPrized,
      prizedMonth: formData.isPrized ? Number(formData.prizedMonth) : undefined,
      status: formData.status as 'Active' | 'Inactive' || 'Active'
    };

    setMembers([...members, newMember]);
    setIsModalOpen(false);
    setFormData({ name: '', groupId: '', phone: '', address: '', email: '', joiningDate: new Date().toISOString().split('T')[0], isPrized: false, status: 'Active' });
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print bg-white p-4 rounded-sm border border-[#edebe9] shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a19f9d]" />
          <input
            type="text"
            placeholder="Search Subscriber Registry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm outline-none"
          />
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#0078d4] text-white px-8 py-2.5 rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-[#106ebe] transition-all shadow-md active:scale-95"
        >
          <Plus className="w-4 h-4" /> Add Subscriber
        </button>
      </div>

      <div className="bg-white border border-[#edebe9] rounded-sm overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#faf9f8] border-b border-[#edebe9]">
              <tr className="text-[10px] font-bold text-[#605e5c] uppercase tracking-widest">
                <th className="px-6 py-4">Identity Profile</th>
                <th className="px-6 py-4">Portfolio Assignment</th>
                <th className="px-6 py-4 text-center">Ledger Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2f1]">
              {filteredMembers.map(member => {
                const group = groups.find(g => g.id === member.groupId);
                const currentMonth = group ? getCurrentChitMonth(group.startDate) : 1;
                const hasPaidCurrent = payments.some(p => p.memberId === member.id && p.monthNumber === currentMonth);
                return (
                  <tr key={member.id} className="hover:bg-[#fcfcfc] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-sm bg-[#deecf9] flex items-center justify-center text-[#0078d4] font-bold text-xs">{member.name.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-bold text-[#323130]">{member.name}</p>
                          <p className="text-[10px] text-[#605e5c] font-semibold uppercase">{member.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-bold text-[#323130]">{group?.name || 'Unassigned'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {hasPaidCurrent ? (
                        <span className="text-[10px] font-bold text-[#107c10] uppercase flex items-center justify-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Settled</span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#a4262c] uppercase flex items-center justify-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Due</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <button onClick={() => setMembers(members.filter(m => m.id !== member.id))} className="text-[#a19f9d] hover:text-[#a4262c] p-2 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                );
              })}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Users className="w-12 h-12 text-[#f3f2f1] mx-auto mb-4" />
                    <p className="text-[10px] font-bold text-[#c8c6c4] uppercase tracking-widest">No matching subscribers in registry</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm overflow-y-auto flex items-start justify-center pt-2 sm:pt-6 pb-20 px-4">
          <div className="bg-white rounded-sm w-full max-w-2xl shadow-2xl border border-[#edebe9] animate-in fade-in zoom-in-95 relative flex flex-col min-h-0 max-h-[95vh]">
            {/* Modal Header - High Visibility */}
            <div className="bg-[#faf9f8] px-8 py-5 border-b border-[#edebe9] flex items-center justify-between sticky top-0 z-20 shadow-sm">
              <div className="flex items-center gap-3">
                 <div className="bg-[#0078d4] p-1.5 rounded-sm shadow-sm"><LayoutList className="w-4 h-4 text-white" /></div>
                 <h2 className="text-lg font-bold text-[#323130] uppercase tracking-tighter">Subscriber Registry Entry</h2>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-[#a19f9d] hover:text-[#323130] p-2 transition-colors"><X className="w-6 h-6" /></button>
            </div>

            {/* Error Blocking Overlay */}
            {isSlotFull && (
              <div className="absolute inset-0 z-30 bg-white/95 backdrop-blur-sm flex items-center justify-center p-8 text-center animate-in fade-in">
                <div className="max-w-xs space-y-6">
                  <div className="bg-[#fde7e9] w-20 h-20 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-lg">
                    <ShieldAlert className="w-10 h-10 text-[#a4262c]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-[#a4262c] uppercase tracking-tight">Slot Capacity Overflow</h3>
                    <p className="text-xs font-bold text-[#605e5c] uppercase leading-relaxed">
                      Enrollment for "{selectedGroup?.name}" is prohibited. Capacity: {currentMemberCount}/{selectedGroup?.memberCount}.
                    </p>
                  </div>
                  <button 
                    onClick={() => setFormData({...formData, groupId: ''})}
                    className="w-full bg-[#323130] text-white py-4 rounded-sm font-bold text-xs uppercase tracking-widest shadow-md active:scale-95 transition-all"
                  >
                    Select Alternative Portfolio
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-8 space-y-8 overflow-y-auto flex-1 scroll-smooth">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* TOP FIELDS MUST BE FIRST & CLEAR */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-2 tracking-widest">Full Subscriber Name*</label>
                    <input 
                      required 
                      type="text" 
                      placeholder="Legal Identity Name" 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})} 
                      className="w-full px-4 py-3 text-sm font-bold text-[#323130] bg-white border border-[#edebe9] focus:bg-white shadow-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-2 tracking-widest">Target Portfolio Assignment*</label>
                    <select 
                      required 
                      value={formData.groupId} 
                      onChange={e => setFormData({...formData, groupId: e.target.value})} 
                      className="w-full px-4 py-3 text-sm font-bold text-[#0078d4] bg-white border border-[#edebe9] shadow-sm"
                    >
                      <option value="">Select Target Portfolio...</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name} (Max: {g.memberCount})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-2 tracking-widest">Mobile Contact Number*</label>
                    <input 
                      required 
                      type="tel" 
                      maxLength={10} 
                      placeholder="10 Digits Mandatory" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} 
                      className="w-full px-4 py-3 text-sm font-bold text-[#323130] bg-white border border-[#edebe9] shadow-sm" 
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-[#605e5c] uppercase mb-2 tracking-widest">Physical Residential Address*</label>
                    <textarea 
                      required 
                      rows={2} 
                      placeholder="House, Street, Area" 
                      value={formData.address} 
                      onChange={e => setFormData({...formData, address: e.target.value})} 
                      className="w-full px-4 py-3 text-sm font-bold text-[#323130] bg-white border border-[#edebe9] shadow-sm"
                    ></textarea>
                  </div>
                  <div className="flex items-center gap-4 py-4 bg-[#faf9f8] px-5 rounded-sm border border-[#edebe9]">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox" 
                        checked={formData.isPrized} 
                        onChange={e => setFormData({...formData, isPrized: e.target.checked})} 
                        className="w-4 h-4 rounded-sm text-[#0078d4] cursor-pointer" 
                      />
                      <span className="text-[10px] font-bold text-[#323130] uppercase tracking-widest group-hover:text-[#0078d4]">Already Prized?</span>
                    </label>
                    {formData.isPrized && (
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-[#605e5c] uppercase">Month:</span>
                        <input type="number" placeholder="M#" value={formData.prizedMonth} onChange={e => setFormData({...formData, prizedMonth: Number(e.target.value)})} className="w-16 px-2 py-1.5 text-xs border border-[#edebe9] rounded-sm font-bold text-[#a4262c]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[#f3f2f1] sticky bottom-0 bg-white">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 border border-[#edebe9] rounded-sm font-bold text-[10px] uppercase tracking-[0.2em] text-[#605e5c] hover:bg-[#faf9f8] transition-colors">Abort Entry</button>
                <button 
                  type="submit" 
                  disabled={isSlotFull}
                  className={`flex-1 py-4 rounded-sm font-bold text-[10px] uppercase tracking-[0.2em] shadow-lg transition-all active:scale-95 ${isSlotFull ? 'bg-[#c8c6c4] text-[#f3f2f1] cursor-not-allowed' : 'bg-[#0078d4] text-white hover:bg-[#106ebe]'}`}
                >
                  Finalize Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Candidates;
