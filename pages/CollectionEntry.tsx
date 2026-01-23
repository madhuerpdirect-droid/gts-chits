
import React, { useState, useMemo, useEffect } from 'react';
import { ChitGroup, Member, Payment } from '../types';
import { formatCurrency, calculateExpectedAmount, getWhatsAppUrl, cleanPhoneNumber, generateForecastMessage } from '../utils';
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
  const [activeForecast, setActiveForecast] = useState<Member | null>(null);

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

  const highlightedMember = filteredGroupMembers.length === 1 && searchTerm.trim() ? filteredGroupMembers[0] : null;

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
      return alert('This installment is already fully settled.');
    }

    const amountToSave = (input?.amount === '' || input?.amount === undefined) 
      ? expected 
      : Number(input.amount);

    if (amountToSave <= 0) return alert('Payment amount must be greater than zero.');

    if (amountToSave !== expected) {
      return alert(`STRICT POLICY: For this month, ${member.name} must pay exactly ${formatCurrency(expected)} based on their prized status.`);
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
    alert(`Entry Confirmed: ${formatCurrency(amountToSave)} recorded for ${member.name}`);
  };

  const sendWhatsAppReceipt = (member: Member, payment: Payment) => {
    const phone = cleanPhoneNumber(member.phone);
    if (!phone || phone.length < 10) return alert('Mobile missing.');
    const message = `*GTS CHITS - RECEIPT*\n\n*Receipt:* ${payment.receiptNumber}\n*Date:* ${payment.paymentDate}\n*Subscriber:* ${member.name}\n*Month:* M${payment.monthNumber}\n*Amount:* ₹${payment.amountPaid.toLocaleString()}\n*Status:* FULLY SETTLED\n\nThank you for choosing GTS.`;
    window.open(getWhatsAppUrl(member.phone, message), '_blank');
  };

  const sendWhatsAppForecast = (member: Member) => {
    if (!group) return;
    const message = generateForecastMessage(member, group, selectedMonth);
    window.open(getWhatsAppUrl(member.phone, message), '_blank');
  };

  const sendUpiRequest = (member: Member, amount: number) => {
    if (!activeUpiId) return alert('No UPI ID found.');
    const phone = cleanPhoneNumber(member.phone);
    if (!phone || phone.length < 10) return alert('Mobile missing.');
    
    const upiUrl = `upi://pay?pa=${activeUpiId}&pn=GTS%20CHITS&am=${amount}&cu=INR&tn=GTS_M${selectedMonth}`;
    const qrImageLink = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(upiUrl)}`;
    
    const message = `*GTS CHITS - PAYMENT REQUEST*\n\n*Subscriber:* ${member.name}\n*Month:* M${selectedMonth}\n*Full Due:* ₹${amount.toLocaleString()}\n*UPI:* ${activeUpiId}\n\n*Direct Pay:* ${upiUrl}\n\n*Scan QR:* ${qrImageLink}`;
    window.open(getWhatsAppUrl(member.phone, message), '_blank');
  };

  return (
    <div className="flex flex-col h-full space-y-4 text-[#323130] pb-10">
      <div className="bg-white p-6 rounded-sm border border-[#edebe9] shadow-sm flex flex-wrap gap-6 items-end shrink-0 no-print">
        <div className="flex-1 min-w-[280px]">
          <label className="block text-[10px] font-bold text-[#605e5c] uppercase tracking-widest mb-2">Portfolio Selection</label>
          <select 
            value={selectedGroup} 
            onChange={e => setSelectedGroup(e.target.value)}
            className="w-full px-4 py-2.5 bg-white border border-[#edebe9] rounded-sm text-sm font-bold text-[#0078d4]"
          >
            <option value="">Choose Portfolio Master...</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[10px] font-bold text-[#605e5c] uppercase tracking-widest mb-2">Quick Lookup</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#a19f9d]" />
            <input
              type="text"
              placeholder="Name/Mobile..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#edebe9] rounded-sm text-sm"
            />
          </div>
        </div>
        <div className="w-24">
          <label className="block text-[10px] font-bold text-[#605e5c] uppercase tracking-widest mb-2">Inst. #</label>
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(Number(e.target.value))}
            className="w-full px-3 py-2 bg-white border border-[#edebe9] rounded-sm font-bold text-sm text-center"
          >
            {Array.from({ length: 48 }, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
          </select>
        </div>
        <div className="w-40">
          <label className="block text-[10px] font-bold text-[#605e5c] uppercase tracking-widest mb-2">Journal Date</label>
          <input 
            type="date" 
            value={collectionDate}
            onChange={e => setCollectionDate(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-[#edebe9] rounded-sm font-semibold text-sm"
          />
        </div>
      </div>

      {highlightedMember && (
        <div className="bg-[#deecf9] border-l-4 border-[#0078d4] p-3 rounded-sm flex items-center justify-between no-print animate-in fade-in">
          <div className="flex items-center gap-3">
            <UserCheck className="w-4 h-4 text-[#0078d4]" />
            <div>
              <span className="text-[10px] font-bold text-[#0078d4] uppercase">Registry Match</span>
              <p className="text-sm font-bold text-[#323130] leading-none">{highlightedMember.name}</p>
            </div>
          </div>
          <button onClick={() => setSearchTerm('')} className="text-[10px] font-bold text-[#0078d4] hover:underline uppercase">Clear Search</button>
        </div>
      )}

      {selectedGroup ? (
        <div className="flex-1 bg-white border border-[#edebe9] rounded-sm overflow-hidden shadow-sm flex flex-col min-h-0">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead className="bg-[#faf9f8] border-b border-[#edebe9]">
                <tr className="text-[10px] font-bold text-[#605e5c] uppercase tracking-widest">
                  <th className="px-6 py-4">Subscriber</th>
                  <th className="px-6 py-4 text-center">Net Due</th>
                  <th className="px-6 py-4">3-Month Forecast</th>
                  <th className="px-6 py-4">Credit Journal Input</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f3f2f1]">
                {filteredGroupMembers.map(member => {
                  const expected = calculateExpectedAmount(group!, member, selectedMonth);
                  const payment = payments.find(p => p.memberId === member.id && p.monthNumber === selectedMonth);
                  const balance = expected - (payment?.amountPaid || 0);
                  
                  const inputState = paymentInputs[member.id] || { 
                    amount: '', 
                    mode: payment?.paymentMode || 'Cash', 
                    remarks: payment?.remarks || ''
                  };

                  // Forecast calculation
                  const forecast = [];
                  for(let i=1; i<=3; i++) {
                    const nextM = selectedMonth + i;
                    if (nextM <= group!.totalMonths) {
                      forecast.push({ m: nextM, amt: calculateExpectedAmount(group!, member, nextM) });
                    }
                  }

                  return (
                    <tr key={member.id} className={`hover:bg-[#fcfcfc] transition-colors ${highlightedMember?.id === member.id ? 'bg-[#f3f9ff]' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-sm flex items-center justify-center font-bold text-[10px] ${member.isPrized ? 'bg-[#fff4ce] text-[#7a5e00]' : 'bg-[#deecf9] text-[#0078d4]'}`}>
                            {member.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{member.name}</p>
                            <p className="text-[9px] text-[#605e5c] font-semibold uppercase">{member.phone}</p>
                            {member.isPrized && member.prizedMonth !== undefined && selectedMonth > member.prizedMonth && (
                               <span className="text-[8px] font-bold text-[#a4262c] uppercase block mt-0.5">Prized Rate Active</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`text-sm font-bold ${balance > 0 ? 'text-[#a4262c]' : 'text-[#107c10]'}`}>
                          {formatCurrency(balance)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="space-y-0.5">
                            {forecast.map(f => (
                              <div key={f.m} className="flex items-center gap-1.5 whitespace-nowrap">
                                <span className="text-[8px] font-bold text-[#a19f9d] uppercase">M{f.m}:</span>
                                <span className={`text-[9px] font-bold ${f.amt > group!.regularInstallment ? 'text-[#a4262c]' : 'text-[#323130]'}`}>{formatCurrency(f.amt)}</span>
                              </div>
                            ))}
                          </div>
                          <button 
                            onClick={() => sendWhatsAppForecast(member)}
                            className="p-1.5 text-[#0078d4] hover:bg-[#deecf9] rounded-full transition-all group"
                            title="Share Forecast to WhatsApp"
                          >
                            <CalendarClock className="w-3.5 h-3.5 group-hover:scale-110" />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <input 
                              type="number"
                              value={inputState.amount}
                              placeholder={`Full: ${expected}`}
                              onChange={e => handleInputChange(member.id, 'amount', e.target.value)}
                              className="w-24 px-2 py-1.5 border border-[#edebe9] rounded-sm text-xs font-bold outline-none"
                            />
                            <select 
                              value={inputState.mode}
                              onChange={e => handleInputChange(member.id, 'mode', e.target.value)}
                              className="px-2 py-1.5 border border-[#edebe9] rounded-sm text-[9px] font-bold uppercase"
                            >
                              <option>Cash</option><option>UPI</option><option>Cheque</option><option>Other</option>
                            </select>
                          </div>
                          <input 
                            type="text"
                            placeholder="Optional Journal Remarks..."
                            value={inputState.remarks}
                            onChange={e => handleInputChange(member.id, 'remarks', e.target.value)}
                            className="w-full px-2 py-1 border border-[#edebe9] rounded-sm text-[9px] outline-none"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setActiveQrMember({ member, amount: expected })} className="p-2 text-[#0078d4] hover:bg-[#deecf9] rounded-sm transition-colors">
                            <QrCode className="w-4 h-4" />
                          </button>
                          {payment ? (
                            <button onClick={() => sendWhatsAppReceipt(member, payment)} className="p-2 text-[#5c2d91] hover:bg-[#efe2ff] rounded-sm transition-colors">
                              <Share2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <button onClick={() => sendUpiRequest(member, expected)} className="p-2 text-[#107c10] hover:bg-[#dff6dd] rounded-sm transition-colors">
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={() => handleSavePayment(member.id)}
                            className={`p-2 rounded-sm shadow-sm active:scale-95 transition-all ${balance <= 0 ? 'bg-[#dff6dd] text-[#107c10]' : 'bg-[#0078d4] text-white hover:bg-[#106ebe]'}`}
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-white border-2 border-dashed border-[#edebe9] rounded-sm flex flex-col items-center justify-center p-12 text-center">
           <Landmark className="w-16 h-16 text-[#f3f2f1] mb-4" />
           <h3 className="text-lg font-bold text-[#323130]">Terminal Inactive</h3>
           <p className="text-[#605e5c] text-xs font-semibold mt-1 uppercase tracking-widest">Select a portfolio master to begin collection.</p>
        </div>
      )}

      {activeQrMember && (
        <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-sm w-full max-w-sm overflow-hidden shadow-2xl border border-[#edebe9]">
            <div className="bg-[#0078d4] p-6 text-white flex items-center justify-between">
               <h2 className="text-lg font-black tracking-tighter uppercase leading-none">Collect via UPI</h2>
               <button onClick={() => setActiveQrMember(null)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-8 space-y-8 text-center bg-white">
               <div className="space-y-1">
                  <h3 className="text-[10px] font-bold text-[#605e5c] uppercase tracking-widest">{activeQrMember.member.name}</h3>
                  <p className="text-3xl font-black text-[#323130]">{formatCurrency(activeQrMember.amount)}</p>
                  <p className="text-[9px] font-bold text-[#0078d4] uppercase tracking-wider">Installment M{selectedMonth}</p>
               </div>
               <div className="bg-[#faf9f8] p-6 rounded-sm border border-[#edebe9] inline-block shadow-sm">
                 <img 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${activeUpiId}&pn=GTS%20CHITS&am=${activeQrMember.amount}&cu=INR&tn=GTS_M${selectedMonth}`)}`} 
                   alt="Bank QR"
                   className="w-48 h-48 mix-blend-multiply"
                 />
               </div>
               <button onClick={() => { sendUpiRequest(activeQrMember.member, activeQrMember.amount); setActiveQrMember(null); }} className="w-full bg-[#107c10] text-white py-4 rounded-sm font-black text-xs uppercase tracking-widest shadow-lg hover:bg-[#0b5a0b] transition-all">
                  Send Link to WhatsApp
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionEntry;
