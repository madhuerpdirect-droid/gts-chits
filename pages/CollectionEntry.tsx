
import React, { useState, useMemo, useEffect } from 'react';
import { ChitGroup, Member, Payment } from '../types';
import { formatCurrency, calculateExpectedAmount, getWhatsAppUrl, cleanPhoneNumber } from '../utils';
import { Save, Search, Landmark, Share2, Smartphone, UserCheck, MessageCircle, QrCode, X, CalendarClock, TrendingUp } from 'lucide-react';

interface CollectionEntryProps {
  groups: ChitGroup[];
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  upiId: string;
}

const CollectionEntry: React.FC<CollectionEntryProps> = ({ groups, members, setMembers, payments, setPayments, upiId }) => {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeQrMember, setActiveQrMember] = useState<{ member: Member, amount: number } | null>(null);

  const [paymentInputs, setPaymentInputs] = useState<Record<string, { amount: string, mode: Payment['paymentMode'], remarks: string }>>({});

  const group = groups.find(g => g.id === selectedGroup);
  const activeUpiId = group?.upiId || upiId;
  
  const filteredGroupMembers = useMemo(() => {
    let list = members.filter(m => m.groupId === selectedGroup);
    if (searchTerm.trim()) {
      const lowSearch = searchTerm.toLowerCase();
      list = list.filter(m => 
        m.name.toLowerCase().includes(lowSearch) || 
        m.phone.includes(lowSearch) ||
        m.id.toLowerCase().includes(lowSearch)
      );
    }
    return list;
  }, [members, selectedGroup, searchTerm]);

  useEffect(() => {
    setPaymentInputs({});
  }, [selectedGroup, selectedMonth]);

  const handleInputChange = (memberId: string, field: 'amount' | 'mode' | 'remarks', value: any) => {
    const existing = paymentInputs[memberId] || { amount: '', mode: 'Cash', remarks: '' };
    setPaymentInputs({
      ...paymentInputs,
      [memberId]: { ...existing, [field]: value }
    });
  };

  const handleSavePayment = (memberId: string) => {
    const input = paymentInputs[memberId];
    const member = members.find(m => m.id === memberId);
    if (!member || !group) return;

    const expected = calculateExpectedAmount(group, member, selectedMonth);
    const existingPayment = payments.find(p => p.memberId === memberId && p.monthNumber === selectedMonth);
    
    if (existingPayment && existingPayment.amountPaid >= expected) {
      return alert('Installment already settled.');
    }

    const amountToSave = (input?.amount === '' || input?.amount === undefined) 
      ? expected 
      : Number(input.amount);

    if (amountToSave <= 0) return alert('Enter valid amount.');

    if (amountToSave !== expected) {
      return alert(`Strict Policy: Please collect exactly ${formatCurrency(expected)}.`);
    }
    
    const existingIdx = payments.findIndex(p => p.memberId === memberId && p.monthNumber === selectedMonth);
    
    const newPayment: Payment = {
      id: existingIdx >= 0 ? payments[existingIdx].id : Math.random().toString(36).substr(2, 9),
      memberId,
      groupId: selectedGroup,
      monthNumber: selectedMonth,
      amountPaid: amountToSave,
      expectedAmount: expected,
      paymentDate: collectionDate,
      paymentMode: input?.mode || 'Cash',
      receiptNumber: existingIdx >= 0 ? payments[existingIdx].receiptNumber : `GTS-${Date.now().toString().slice(-6)}`,
      remarks: input?.remarks || '',
    };

    const updatedPayments = existingIdx >= 0 
      ? payments.map((p, i) => i === existingIdx ? newPayment : p)
      : [...payments, newPayment];

    setPayments(updatedPayments);
    alert(`Success: Recorded for ${member.name}`);
  };

  const sendWhatsAppReceipt = (member: Member, payment: Payment) => {
    const phone = cleanPhoneNumber(member.phone);
    if (!phone || phone.length < 10) return alert('Error: Valid mobile number required.');
    
    const message = `*GTS CHITS - PAYMENT RECEIPT*\n\n` +
      `*Receipt #:* ${payment.receiptNumber}\n` +
      `*Date:* ${payment.paymentDate}\n` +
      `*Subscriber:* ${member.name}\n` +
      `*Group:* ${group?.name || '---'}\n` +
      `*Month:* M${payment.monthNumber}\n` +
      `*Amount:* ₹${payment.amountPaid.toLocaleString()}\n` +
      `*Status:* FULLY SETTLED\n\n` +
      `Thank you.\n*GTS CHITS*`;

    const url = getWhatsAppUrl(member.phone, message);
    // CRITICAL: Using window.location.href triggers the app intent on Android/iOS
    // while window.open often defaults to the web browser interface.
    window.location.href = url;
  };

  const sendUpiRequest = (member: Member, amount: number) => {
    if (!activeUpiId) return alert('Error: Global UPI ID missing in Settings.');
    const phone = cleanPhoneNumber(member.phone);
    if (!phone || phone.length < 10) return alert('Error: Valid mobile number required.');

    const upiLink = `upi://pay?pa=${activeUpiId}&pn=GTS%20CHITS&am=${amount}&cu=INR&tn=GTS_M${selectedMonth}`;
    const message = `*GTS CHITS - PAYMENT REQUEST*\n\n` +
      `Dear *${member.name}*,\n` +
      `Payment for *Month ${selectedMonth}* is now due.\n\n` +
      `*Portfolio:* ${group?.name || '---'}\n` +
      `*Amount:* ₹${amount.toLocaleString()}\n\n` +
      `*Tap to Pay:* ${upiLink}\n\n` +
      `_Note: Tap the link above to pay directly via GPay/PhonePe._\n\n` +
      `*GTS CHITS*`;
    
    const url = getWhatsAppUrl(member.phone, message);
    // Using location.href ensures the mobile device's app association system captures the request.
    window.location.href = url;
  };

  return (
    <div className="flex flex-col h-full text-[#323130] pb-24 sm:pb-20">
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-[60] bg-[#faf9f8] pt-2 pb-3 no-print">
        <div className="bg-white p-3 sm:p-4 rounded-sm border border-[#edebe9] shadow-md flex flex-col gap-3">
          <div className="flex gap-2">
             <div className="flex-1">
                <label className="block text-[9px] font-black text-[#605e5c] uppercase mb-1 tracking-widest">Portfolio Master</label>
                <select 
                  value={selectedGroup} 
                  onChange={e => setSelectedGroup(e.target.value)}
                  className="w-full h-12 px-3 bg-[#faf9f8] border border-[#edebe9] rounded-sm text-sm font-black text-[#0078d4] focus:ring-2 focus:ring-[#0078d4]"
                >
                  <option value="">Choose Group...</option>
                  {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
             </div>
             <div className="w-24">
                <label className="block text-[9px] font-black text-[#605e5c] uppercase mb-1 tracking-widest text-center">Month</label>
                <select 
                  value={selectedMonth} 
                  onChange={e => setSelectedMonth(Number(e.target.value))}
                  className="w-full h-12 px-2 bg-[#faf9f8] border border-[#edebe9] rounded-sm font-black text-sm text-center"
                >
                  {Array.from({ length: 48 }, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
                </select>
             </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#a19f9d]" />
            <input
              type="text"
              placeholder="Instant Lookup: Name or Mobile"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full h-14 pl-12 pr-4 bg-[#faf9f8] border border-[#edebe9] rounded-sm text-base font-bold placeholder:text-[#c8c6c4]"
            />
          </div>
        </div>
      </div>

      {selectedGroup ? (
        <div className="flex-1 space-y-4 overflow-y-visible">
          {filteredGroupMembers.map(member => {
            const expected = calculateExpectedAmount(group!, member, selectedMonth);
            const payment = payments.find(p => p.memberId === member.id && p.monthNumber === selectedMonth);
            const balance = expected - (payment?.amountPaid || 0);
            const inputState = paymentInputs[member.id] || { 
              amount: '', 
              mode: payment?.paymentMode || 'Cash', 
              remarks: payment?.remarks || ''
            };

            return (
              <div key={member.id} className="bg-white border border-[#edebe9] rounded-sm shadow-sm overflow-hidden flex flex-col scroll-mt-32">
                {/* Identity Area */}
                <div className="p-4 flex items-center justify-between bg-[#fcfcfc] border-b border-[#f3f2f1]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-sm flex items-center justify-center font-black text-xl sm:text-2xl shrink-0 ${member.isPrized ? 'bg-[#fff4ce] text-[#7a5e00]' : 'bg-[#deecf9] text-[#0078d4]'}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[15px] sm:text-[17px] font-black leading-tight tracking-tight truncate">{member.name}</h4>
                      <p className="text-[10px] sm:text-[11px] font-bold text-[#605e5c] uppercase tracking-tighter">{member.phone}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-base sm:text-xl font-black leading-none ${balance > 0 ? 'text-[#a4262c]' : 'text-[#107c10]'}`}>{formatCurrency(balance)}</p>
                    <p className="text-[8px] sm:text-[9px] font-black text-[#a19f9d] uppercase mt-1 tracking-widest">M{selectedMonth} DUE</p>
                  </div>
                </div>

                {/* Entry Interface */}
                <div className="p-4 space-y-4">
                   <div className="flex gap-3">
                      <div className="flex-1">
                         <label className="block text-[10px] font-black text-[#a19f9d] uppercase mb-1">Collect Amount</label>
                         <input 
                            type="number" 
                            inputMode="numeric"
                            value={inputState.amount}
                            placeholder={`Full: ${expected}`}
                            onChange={e => handleInputChange(member.id, 'amount', e.target.value)}
                            className="w-full h-12 sm:h-14 px-4 text-base sm:text-lg font-black bg-[#faf9f8] border border-[#edebe9] rounded-sm focus:border-[#0078d4] outline-none" 
                         />
                      </div>
                      <div className="w-28 sm:w-32">
                         <label className="block text-[10px] font-black text-[#a19f9d] uppercase mb-1">Mode</label>
                         <select 
                            value={inputState.mode}
                            onChange={e => handleInputChange(member.id, 'mode', e.target.value)}
                            className="w-full h-12 sm:h-14 px-2 text-[10px] sm:text-[12px] font-black uppercase bg-[#faf9f8] border border-[#edebe9] rounded-sm"
                         >
                            <option>Cash</option><option>UPI</option><option>Cheque</option><option>Other</option>
                         </select>
                      </div>
                   </div>
                   <input 
                      type="text" 
                      placeholder="Add Internal Audit Note..." 
                      value={inputState.remarks}
                      onChange={e => handleInputChange(member.id, 'remarks', e.target.value)}
                      className="w-full h-10 sm:h-12 px-4 text-[10px] sm:text-xs font-semibold bg-[#faf9f8] border border-[#edebe9] rounded-sm" 
                   />
                </div>

                {/* Action Bar */}
                <div className="grid grid-cols-4 border-t border-[#f3f2f1] h-16 sm:h-20">
                   <button onClick={() => setActiveQrMember({ member, amount: expected })} className="flex flex-col items-center justify-center gap-1 text-[#0078d4] border-r border-[#f3f2f1] active:bg-[#deecf9] transition-colors">
                      <QrCode className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-[7px] sm:text-[8px] font-black uppercase">QR Pay</span>
                   </button>
                   <button 
                     onClick={() => payment ? sendWhatsAppReceipt(member, payment) : sendUpiRequest(member, expected)} 
                     className="flex flex-col items-center justify-center gap-1 text-[#107c10] border-r border-[#f3f2f1] active:bg-[#dff6dd] transition-colors"
                   >
                      <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="text-[7px] sm:text-[8px] font-black uppercase">{payment ? 'Receipt' : 'Notify'}</span>
                   </button>
                   <button 
                     onClick={() => handleSavePayment(member.id)}
                     className={`col-span-2 flex items-center justify-center gap-2 sm:gap-3 font-black text-sm sm:text-base uppercase tracking-[0.1em] text-white active:opacity-80 transition-all ${balance <= 0 ? 'bg-[#107c10]' : 'bg-[#0078d4]'}`}
                   >
                      <Save className="w-5 h-5 sm:w-6 sm:h-6" /> Save
                   </button>
                </div>
              </div>
            );
          })}
          
          {filteredGroupMembers.length === 0 && (
             <div className="py-20 text-center opacity-40">
                <Search className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-[#a19f9d]" />
                <p className="text-xs sm:text-sm font-black uppercase tracking-widest">No Subscriber Found</p>
             </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-30 mt-10">
           <Landmark className="w-16 h-16 sm:w-20 sm:h-20 mb-6 text-[#a19f9d]" />
           <p className="text-sm sm:text-base font-black uppercase tracking-[0.2em]">Select Portfolio</p>
        </div>
      )}

      {/* QR MODAL */}
      {activeQrMember && (
        <div className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-sm w-full max-w-xs overflow-hidden shadow-2xl animate-in zoom-in-95">
             <div className="p-4 bg-[#0078d4] text-white flex justify-between items-center">
                <h3 className="font-black uppercase text-xs tracking-widest">Digital Payment</h3>
                <button onClick={() => setActiveQrMember(null)} className="p-1"><X className="w-6 h-6" /></button>
             </div>
             <div className="p-8 sm:p-10 text-center space-y-6">
                <div className="space-y-1">
                   <p className="text-[10px] sm:text-[11px] font-black text-[#605e5c] uppercase">{activeQrMember.member.name}</p>
                   <p className="text-3xl sm:text-4xl font-black text-[#323130]">{formatCurrency(activeQrMember.amount)}</p>
                </div>
                <div className="p-4 bg-white border border-[#edebe9] inline-block shadow-inner rounded-sm">
                   <img 
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${activeUpiId}&pn=GTS%20CHITS&am=${activeQrMember.amount}&cu=INR&tn=GTS_M${selectedMonth}`)}`} 
                     className="w-40 h-40 sm:w-48 sm:h-48 mix-blend-multiply"
                     alt="UPI QR"
                   />
                </div>
                <button 
                  onClick={() => { sendUpiRequest(activeQrMember.member, activeQrMember.amount); setActiveQrMember(null); }}
                  className="w-full bg-[#107c10] text-white h-14 sm:h-16 rounded-sm font-black text-[10px] sm:text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all"
                >
                  Notify via WhatsApp
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionEntry;
