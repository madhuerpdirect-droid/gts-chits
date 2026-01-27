
import React, { useState, useMemo, useRef } from 'react';
import { Member, ChitGroup, Payment } from '../types';
import { Plus, Search, Trash2, X, Users, User, FileDown, Upload, FileSpreadsheet, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { getCurrentChitMonth, cleanPhoneNumber } from '../utils';
import * as XLSX from 'xlsx';

interface CandidatesProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  groups: ChitGroup[];
  payments: Payment[];
}

const Candidates: React.FC<CandidatesProps> = ({ members, setMembers, groups, payments }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [bulkTargetGroup, setBulkTargetGroup] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      return alert('Complete mandatory fields.');
    }
    if (isSlotFull) {
      return alert('Error: Group capacity exceeded.');
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

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Full Name": "John Doe",
        "Phone Number": "9876543210",
        "Chit Group Name": groups[0]?.name || "Example Group A",
        "Address": "123 Street, City",
        "Email": "john@example.com",
        "ID Proof Type": "Aadhar",
        "ID Proof Number": "1234-5678-9012",
        "Nominee Name": "Jane Doe",
        "Nominee Relation": "Spouse"
      }
    ];
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "GTS_Bulk_Onboarding_Template.xlsx");
  };

  const handleExcelImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const newMembers: Member[] = [];
      const currentCounts: Record<string, number> = {};
      
      // Pre-calculate current member counts for capacity check
      groups.forEach(g => {
        currentCounts[g.id] = members.filter(m => m.groupId === g.id).length;
      });

      data.forEach((row: any) => {
        const name = row["Full Name"] || row["Name"];
        const phone = row["Phone Number"] || row["Phone"] || row["Mobile"];
        const rowGroupName = row["Chit Group Name"] || row["Group Name"] || row["Group"];
        
        // Find group by name from Excel row
        const groupFromRow = groups.find(g => 
          g.name.toLowerCase().trim() === String(rowGroupName || '').toLowerCase().trim()
        );
        
        // Fallback to bulkTargetGroup if row group name is missing or invalid
        const finalGroupId = groupFromRow ? groupFromRow.id : bulkTargetGroup;
        
        if (name && phone && finalGroupId) {
          const group = groups.find(g => g.id === finalGroupId);
          const capacity = group?.memberCount || 100000;
          
          if ((currentCounts[finalGroupId] || 0) < capacity) {
            newMembers.push({
              id: Math.random().toString(36).substr(2, 9),
              name: String(name),
              groupId: finalGroupId,
              phone: cleanPhoneNumber(String(phone)),
              address: String(row["Address"] || ''),
              email: String(row["Email"] || ''),
              idProofType: String(row["ID Proof Type"] || 'Aadhar'),
              idProofNumber: String(row["ID Proof Number"] || ''),
              nomineeName: String(row["Nominee Name"] || ''),
              nomineeRelation: String(row["Nominee Relation"] || ''),
              joiningDate: new Date().toISOString().split('T')[0],
              isPrized: false,
              status: 'Active'
            });
            currentCounts[finalGroupId] = (currentCounts[finalGroupId] || 0) + 1;
          }
        }
      });

      if (newMembers.length > 0) {
        setMembers(prev => [...prev, ...newMembers]);
        alert(`Bulk Action Success: Onboarded ${newMembers.length} subscribers across chosen groups.`);
        setIsBulkModalOpen(false);
      } else {
        alert("Import Failed: No valid subscriber data found or all selected groups are already at full capacity.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-4 pb-20">
      {/* Mobile Top Controls */}
      <div className="bg-white p-4 rounded-sm border border-[#edebe9] shadow-sm space-y-3 no-print">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a19f9d]" />
          <input
            type="text"
            placeholder="Search Registry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-10 pr-4 bg-[#faf9f8] border border-[#edebe9] rounded-sm text-sm font-semibold"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="h-12 bg-[#0078d4] text-white flex items-center justify-center gap-2 rounded-sm font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95"
          >
            <Plus className="w-4 h-4" /> Single Entry
          </button>
          <button 
            onClick={() => setIsBulkModalOpen(true)}
            className="h-12 bg-[#323130] text-white flex items-center justify-center gap-2 rounded-sm font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" /> Bulk XL
          </button>
        </div>
      </div>

      {/* Registry List */}
      <div className="space-y-3">
        {filteredMembers.map(member => {
          const group = groups.find(g => g.id === member.groupId);
          const currentMonth = group ? getCurrentChitMonth(group.startDate) : 1;
          const hasPaidCurrent = payments.some(p => p.memberId === member.id && p.monthNumber === currentMonth);
          
          return (
            <div key={member.id} className="bg-white p-4 rounded-sm border border-[#edebe9] shadow-sm flex items-center justify-between">
               <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#deecf9] text-[#0078d4] flex items-center justify-center rounded-sm font-black text-xl">
                    {member.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-black">{member.name}</h4>
                    <p className="text-[10px] font-bold text-[#605e5c] uppercase">{group?.name || 'Pending Group'}</p>
                    <div className="flex items-center gap-2 mt-1">
                       <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase ${hasPaidCurrent ? 'bg-[#dff6dd] text-[#107c10]' : 'bg-[#fde7e9] text-[#a4262c]'}`}>
                         {hasPaidCurrent ? 'Settled' : 'Unpaid'}
                       </span>
                       <span className="text-[9px] font-bold text-[#a19f9d] uppercase">{member.phone}</span>
                    </div>
                  </div>
               </div>
               <button onClick={() => setMembers(members.filter(m => m.id !== member.id))} className="p-3 text-[#a19f9d] active:text-[#a4262c]">
                  <Trash2 className="w-5 h-5" />
               </button>
            </div>
          );
        })}
        {filteredMembers.length === 0 && (
          <div className="py-20 text-center opacity-30">
            <Users className="w-16 h-16 mx-auto mb-4" />
            <p className="font-black uppercase text-xs tracking-widest">Registry Empty</p>
          </div>
        )}
      </div>

      {/* SINGLE ENTRY MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg h-[90vh] sm:h-auto rounded-t-xl sm:rounded-sm overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="p-5 border-b border-[#edebe9] flex justify-between items-center bg-[#faf9f8]">
               <div className="flex items-center gap-2">
                 <User className="w-5 h-5 text-[#0078d4]" />
                 <h3 className="font-black uppercase text-sm tracking-tight">Manual Enrollment</h3>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="p-2"><X className="w-6 h-6 text-[#605e5c]" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-container">
               <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-[#605e5c] uppercase mb-1 tracking-widest">Full Name*</label>
                    <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-12 px-4 bg-[#faf9f8] border-none font-bold text-base" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#605e5c] uppercase mb-1 tracking-widest">Portfolio*</label>
                    <select required value={formData.groupId} onChange={e => setFormData({...formData, groupId: e.target.value})} className="w-full h-12 px-4 bg-[#faf9f8] border-none font-black text-sm text-[#0078d4]">
                      <option value="">Choose Portfolio Master...</option>
                      {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#605e5c] uppercase mb-1 tracking-widest">Phone Number*</label>
                    <input required type="tel" maxLength={10} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} className="w-full h-12 px-4 bg-[#faf9f8] border-none font-black text-base" />
                  </div>
                  <div className="p-4 bg-[#faf9f8] rounded-sm flex items-center justify-between">
                     <span className="text-[10px] font-black uppercase text-[#605e5c]">Prize Holder?</span>
                     <input type="checkbox" checked={formData.isPrized} onChange={e => setFormData({...formData, isPrized: e.target.checked})} className="w-6 h-6 rounded-sm text-[#0078d4]" />
                  </div>
               </div>
               <div className="pt-6 space-y-3">
                  <button type="submit" disabled={isSlotFull} className="w-full h-14 bg-[#0078d4] text-white font-black uppercase text-sm tracking-[0.2em] shadow-xl active:scale-95 transition-all">
                    Finalize Entry
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK ONBOARDING MODAL */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center">
          <div className="bg-white w-full max-w-lg h-[90vh] sm:h-auto rounded-t-xl sm:rounded-sm overflow-hidden flex flex-col shadow-2xl animate-in slide-in-from-bottom-10">
            <div className="p-5 border-b border-[#edebe9] flex justify-between items-center bg-[#323130] text-white">
               <div className="flex items-center gap-2">
                 <FileSpreadsheet className="w-5 h-5" />
                 <h3 className="font-black uppercase text-sm tracking-tight">Advanced Bulk Onboarding</h3>
               </div>
               <button onClick={() => setIsBulkModalOpen(false)} className="p-2"><X className="w-6 h-6" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-container">
               <div className="space-y-4">
                  <div className="bg-[#f3f2f1] p-5 rounded-sm border-l-4 border-[#0078d4] flex gap-4">
                     <Info className="w-5 h-5 text-[#0078d4] shrink-0" />
                     <p className="text-[11px] font-bold text-[#605e5c] uppercase leading-relaxed">
                        NEW: Add a <span className="text-[#0078d4]">"Chit Group Name"</span> column in your Excel to automatically assign members to different groups in one upload!
                     </p>
                  </div>

                  <div>
                     <label className="block text-[10px] font-black text-[#605e5c] uppercase mb-1 tracking-widest">1. Default Portfolio (Fallback)</label>
                     <select 
                        value={bulkTargetGroup} 
                        onChange={e => setBulkTargetGroup(e.target.value)} 
                        className="w-full h-14 px-4 bg-[#faf9f8] border-2 border-[#edebe9] font-black text-sm text-[#0078d4] focus:border-[#0078d4] outline-none"
                     >
                        <option value="">Select fallback group...</option>
                        {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                     </select>
                     <p className="text-[9px] font-bold text-[#a19f9d] uppercase mt-2">Used if "Chit Group Name" column is missing in file.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                     <button 
                        onClick={handleDownloadTemplate}
                        className="w-full h-14 bg-white border-2 border-[#edebe9] text-[#323130] flex items-center justify-center gap-3 rounded-sm font-black text-[10px] uppercase tracking-widest hover:bg-[#faf9f8]"
                     >
                        <FileDown className="w-5 h-5 text-[#0078d4]" /> Download Advanced Template
                     </button>
                  </div>

                  <div className="pt-6 border-t border-[#edebe9]">
                     <label className="block text-[10px] font-black text-[#605e5c] uppercase mb-4 tracking-widest">2. Upload Completed File</label>
                     <label className="w-full h-32 border-2 border-dashed border-[#edebe9] flex flex-col items-center justify-center gap-2 rounded-sm cursor-pointer hover:bg-[#faf9f8] transition-colors">
                        <Upload className="w-8 h-8 text-[#a19f9d]" />
                        <span className="text-[10px] font-black uppercase text-[#605e5c]">Click to Choose .xlsx File</span>
                        <input 
                           type="file" 
                           accept=".xlsx, .xls, .csv" 
                           onChange={handleExcelImport} 
                           ref={fileInputRef}
                           className="hidden" 
                        />
                     </label>
                  </div>
               </div>

               <div className="bg-[#faf9f8] p-4 flex items-center gap-3 rounded-sm">
                  <AlertCircle className="w-4 h-4 text-[#a19f9d]" />
                  <p className="text-[9px] font-bold text-[#a19f9d] uppercase">System maps names automatically. Ensure Portfolio Names match exactly.</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Candidates;
