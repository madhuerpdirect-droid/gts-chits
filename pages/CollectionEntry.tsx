
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
  whatsappUseWeb: boolean;
}

const CollectionEntry: React.FC<CollectionEntryProps> = ({ groups, members, setMembers, payments, setPayments, upiId, whatsappUseWeb }) => {
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

  /**
   * Universal WhatsApp trigger.
   * Respects the whatsappUseWeb preference from settings.
   */
  const triggerWhatsApp = (phone: string, message: string) => {
    const url = getWhatsAppUrl(phone, message, whatsappUseWeb);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShareReceipt = (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    const payment = payments.find(p => p.memberId === memberId && p.monthNumber === selectedMonth);
    if (!member || !group || !payment) return;

    const message = `*GTS CHITS - PAYMENT RECEIPT*\n\n` +
      `Dear *${member.name}*,\n\n` +
      `We have received your payment for *Month ${selectedMonth}*.\n\n` +
      `*Group:* ${group.name}\n` +
      `*Amount:* ₹${payment.amountPaid.toLocaleString()}\n` +
      `*Date:* ${payment.paymentDate}\n` +
      `*Receipt #:* ${payment.receiptNumber}\n\n` +
      `Thank you for your prompt payment!\n\n` +
      `*GTS CHITS*`;

    triggerWhatsApp(member.phone, message);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="bg-white p-4 sm:p-6 rounded-sm border border-[#edebe9] shadow-sm space-y-4 no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] font-black text-[#605e5c] uppercase mb-1 tracking-widest">Select Portfolio</label>
            <select 
              value={selectedGroup} 
              onChange={e => setSelectedGroup(e.target.value)}
              className="w-full h-11 px-3 bg-[#faf9f8] border border-[#edebe9] rounded-sm text-sm font-black text-[#0078d4]"
            >
              <option value="">Choose...</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#605e5c] uppercase mb-1 tracking-widest">Installment Month</label>
            <select 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(Number(e.target.value))}
              className="w-full h-11 px-3 bg-[#faf9f8] border border-[#edebe9] rounded-sm text-sm font-black"
            >
              {Array.from({ length: 48 }, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#605e5c] uppercase mb-1 tracking-widest">Collection Date</label>
            <input 
              type="date" 
              value={collectionDate} 
              onChange={e => setCollectionDate(e.target.value)}
              className="w-full h-11 px-3 bg-[#faf9f8] border border-[#edebe9] rounded-sm text-sm font-black"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-[#605e5c] uppercase mb-1 tracking-widest">Search Member</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a19f9d]" />
              <input 
                type="text" 
                placeholder="Name or Phone..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full h-11 pl-10 pr-4 bg-[#faf9f8] border border-[#edebe9] rounded-sm text-sm font-semibold"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {selectedGroup ? (
          filteredGroupMembers.map(member => {
            const expected = calculateExpectedAmount(group!, member, selectedMonth);
            const payment = payments.find(p => p.memberId === member.id && p.monthNumber === selectedMonth);
            const input = paymentInputs[member.id] || { amount: '', mode: 'Cash', remarks: '' };
            const isSettled = !!payment;

            return (
              <div key={member.id} className={`bg-white rounded-sm border ${isSettled ? 'border-[#b1e5ad] bg-[#fafffa]' : 'border-[#edebe9]'} shadow-sm overflow-hidden transition-all`}>
                <div className="p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className={`w-12 h-12 flex items-center justify-center rounded-sm font-black text-xl ${isSettled ? 'bg-[#dff6dd] text-[#107c10]' : 'bg-[#deecf9] text-[#0078d4]'}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-[15px] font-black leading-tight">{member.name}</h4>
                      <p className="text-[10px] font-bold text-[#a19f9d] uppercase tracking-tighter mt-1">{member.phone}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black text-[#605e5c] uppercase">DUE: {formatCurrency(expected)}</span>
                        {isSettled && <span className="text-[9px] font-black text-[#107c10] uppercase flex items-center gap-1"><UserCheck className="w-3 h-3" /> SETTLED</span>}
                      </div>
                    </div>
                  </div>

                  {!isSettled ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[8px] font-black text-[#a19f9d] uppercase mb-1">Amount</label>
                        <input 
                          type="number" 
                          placeholder={expected.toString()}
                          value={input.amount}
                          onChange={e => handleInputChange(member.id, 'amount', e.target.value)}
                          className="w-full h-10 px-3 border border-[#edebe9] rounded-sm text-sm font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-black text-[#a19f9d] uppercase mb-1">Mode</label>
                        <select 
                          value={input.mode}
                          onChange={e => handleInputChange(member.id, 'mode', e.target.value)}
                          className="w-full h-10 px-2 border border-[#edebe9] rounded-sm text-xs font-bold"
                        >
                          <option value="Cash">Cash</option>
                          <option value="UPI">UPI</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div className="flex items-end gap-2">
                        <button 
                          onClick={() => handleSavePayment(member.id)}
                          className="flex-1 h-10 bg-[#0078d4] text-white flex items-center justify-center gap-2 rounded-sm font-black text-[10px] uppercase tracking-widest"
                        >
                          <Save className="w-4 h-4" /> Save
                        </button>
                        <button 
                          onClick={() => setActiveQrMember({ member, amount: Number(input.amount) || expected })}
                          className="h-10 w-10 bg-[#323130] text-white flex items-center justify-center rounded-sm"
                        >
                          <QrCode className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex items-center justify-end gap-3">
                      <div className="text-right mr-4">
                        <p className="text-[10px] font-bold text-[#a19f9d] uppercase">Received via {payment.paymentMode}</p>
                        <p className="text-sm font-black text-[#107c10]">{formatCurrency(payment.amountPaid)}</p>
                      </div>
                      <button 
                        onClick={() => handleShareReceipt(member.id)}
                        className="h-12 px-6 bg-[#107c10] text-white flex items-center justify-center gap-2 rounded-sm font-black text-[10px] uppercase tracking-widest shadow-md active:scale-95 transition-all"
                      >
                        <Share2 className="w-4 h-4" /> Share Receipt
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-24 bg-white rounded-sm border border-[#edebe9] text-center shadow-inner">
            <Landmark className="w-16 h-16 text-[#f3f2f1] mx-auto mb-4" />
            <h3 className="text-sm font-black uppercase tracking-widest text-[#a19f9d]">Select a Portfolio to begin collection</h3>
          </div>
        )}
      </div>

      {activeQrMember && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xs rounded-sm overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-4 border-b border-[#edebe9] flex justify-between items-center bg-[#faf9f8]">
              <h3 className="font-black text-[10px] uppercase tracking-widest">Instant UPI Payment</h3>
              <button onClick={() => setActiveQrMember(null)} className="p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 text-center space-y-4">
              <div className="aspect-square bg-[#faf9f8] border-2 border-[#edebe9] rounded-sm flex items-center justify-center relative group">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${activeUpiId}&pn=GTS%20CHITS&am=${activeQrMember.amount}&cu=INR`)}`}
                  alt="Payment QR"
                  className="w-full h-full p-2"
                />
              </div>
              <div>
                <p className="text-xs font-bold text-[#323130]">{activeQrMember.member.name}</p>
                <p className="text-xl font-black text-[#0078d4] mt-1">{formatCurrency(activeQrMember.amount)}</p>
                <p className="text-[9px] font-bold text-[#a19f9d] uppercase mt-2 font-mono">VPA: {activeUpiId}</p>
              </div>
              <button 
                onClick={() => {
                  const msg = `*GTS CHITS - QUICK PAY*\n\n` +
                    `Hello *${activeQrMember.member.name}*,\n\n` +
                    `Please pay *${formatCurrency(activeQrMember.amount)}* for *Month ${selectedMonth}* using the UPI details below:\n\n` +
                    `*VPA:* ${activeUpiId}\n` +
                    `*Amount:* ${formatCurrency(activeQrMember.amount)}\n\n` +
                    `Thank you,\n` +
                    `*GTS CHITS*`;
                  triggerWhatsApp(activeQrMember.member.phone, msg);
                }}
                className="w-full h-12 bg-[#107c10] text-white flex items-center justify-center gap-2 rounded-sm font-black text-[10px] uppercase tracking-widest shadow-lg"
              >
                <MessageCircle className="w-4 h-4" /> Send UPI via WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionEntry;
