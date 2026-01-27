
import React, { useState } from 'react';
import { ChitGroup, Member, Payment, ReportType } from '../types';
import { formatCurrency, calculateExpectedAmount, getWhatsAppUrl, cleanPhoneNumber, generateReminderMessage } from '../utils';
import { exportToCSV } from '../storage';
import { User, Users, FileText, ClipboardList, XCircle, Share2, FileDown, CheckCircle2, MessageSquare } from 'lucide-react';

interface ReportsProps {
  groups: ChitGroup[];
  members: Member[];
  payments: Payment[];
}

const Reports: React.FC<ReportsProps> = ({ groups, members, payments }) => {
  const [activeReport, setActiveReport] = useState<ReportType>('Candidate');
  const [filters, setFilters] = useState({
    groupId: '',
    memberId: '',
    month: 1,
    fromDate: '',
    toDate: '',
    paymentMode: '' 
  });

  const handlePrint = () => {
    window.print();
  };

  const clearFilters = () => {
    setFilters({
      groupId: '',
      memberId: '',
      month: 1,
      fromDate: '',
      toDate: '',
      paymentMode: ''
    });
  };

  const getReportSummary = () => {
    const group = groups.find(g => g.id === filters.groupId);
    const member = members.find(m => m.id === filters.memberId);
    
    switch (activeReport) {
      case 'Due':
        if (!group) return null;
        const unpaid = members.filter(m => m.groupId === group.id && !payments.some(p => p.memberId === m.id && p.monthNumber === filters.month));
        const totalDue = unpaid.reduce((sum, m) => sum + calculateExpectedAmount(group, m, filters.month), 0);
        return { count: unpaid.length, total: totalDue, label: 'Total Outstanding' };
      case 'Candidate':
      case 'Individual':
        if (!member) return null;
        const collected = payments.filter(p => p.memberId === member.id).reduce((sum, p) => sum + p.amountPaid, 0);
        return { count: payments.filter(p => p.memberId === member.id).length, total: collected, label: 'Total Receipts' };
      case 'Consolidated':
        const allCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);
        return { count: groups.length, total: allCollected, label: 'Master Collection' };
      default:
        return null;
    }
  };

  const handleShareReport = () => {
    const summary = getReportSummary();
    const member = members.find(m => m.id === filters.memberId);
    
    let message = `*GTS CHITS - ${activeReport.toUpperCase()} REPORT*\n`;
    if (summary) message += `*${summary.label}:* ${formatCurrency(summary.total)}\n`;
    message += `Date: ${new Date().toLocaleDateString()}\n\n_Audit generated via GTS Cloud Management._`;
    
    const phone = member?.phone && cleanPhoneNumber(member.phone).length === 10 ? member.phone : '';
    const url = getWhatsAppUrl(phone, message);
    // Direct location assignment is better for mobile intent triggering
    window.location.href = url;
  };

  const renderReportContent = () => {
    switch (activeReport) {
      case 'Candidate':
        return <CandidateReport members={members} payments={payments} groups={groups} filters={filters} />;
      case 'Due':
        return <DueReport members={members} payments={payments} groups={groups} filters={filters} />;
      case 'Consolidated':
        return <ConsolidatedReport groups={groups} members={members} payments={payments} filters={filters} />;
      case 'Individual':
        return <IndividualReport members={members} payments={payments} groups={groups} filters={filters} />;
      default:
        return null;
    }
  };

  const summary = getReportSummary();

  return (
    <div className="space-y-4 sm:space-y-6 text-[#323130] pb-24">
      {/* Report Switcher - Horizontal scroll on mobile */}
      <div className="flex overflow-x-auto gap-2 no-print pb-2 -mx-1 px-1">
        {[
          { id: 'Candidate', icon: User },
          { id: 'Due', icon: ClipboardList },
          { id: 'Consolidated', icon: Users },
          { id: 'Individual', icon: FileText }
        ].map(report => (
          <button
            key={report.id}
            onClick={() => { setActiveReport(report.id as ReportType); clearFilters(); }}
            className={`
              flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-sm text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap
              ${activeReport === report.id ? 'bg-[#0078d4] text-white border-[#0078d4]' : 'bg-white text-[#605e5c] border-[#edebe9] hover:bg-[#f3f2f1]'}
            `}
          >
            <report.icon className="w-3.5 h-3.5" />
            {report.id}
          </button>
        ))}
      </div>

      {/* Filter Panel - Stacked on Mobile */}
      <div className="bg-white p-4 sm:p-6 rounded-sm border border-[#edebe9] shadow-sm no-print">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 items-end">
          {activeReport !== 'Individual' && (
            <div>
              <label className="block text-[9px] sm:text-[10px] font-black text-[#605e5c] uppercase tracking-widest mb-1">Portfolio</label>
              <select 
                value={filters.groupId} 
                onChange={e => setFilters({...filters, groupId: e.target.value})}
                className="w-full h-11 px-3 border border-[#edebe9] rounded-sm text-xs font-bold focus:ring-1 focus:ring-[#0078d4]"
              >
                <option value="">Global Search</option>
                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>
          )}
          
          {activeReport === 'Due' && (
            <div className="w-full sm:w-24">
              <label className="block text-[9px] sm:text-[10px] font-black text-[#605e5c] uppercase tracking-widest mb-1">Month</label>
              <select 
                value={filters.month} 
                onChange={e => setFilters({...filters, month: Number(e.target.value)})}
                className="w-full h-11 px-3 border border-[#edebe9] rounded-sm text-xs font-bold focus:ring-1 focus:ring-[#0078d4]"
              >
                {Array.from({ length: 48 }, (_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
              </select>
            </div>
          )}

          {(activeReport === 'Candidate' || activeReport === 'Individual') && (
            <div>
              <label className="block text-[9px] sm:text-[10px] font-black text-[#605e5c] uppercase tracking-widest mb-1">Subscriber</label>
              <select 
                value={filters.memberId} 
                onChange={e => setFilters({...filters, memberId: e.target.value})}
                className="w-full h-11 px-3 border border-[#edebe9] rounded-sm text-xs font-bold focus:ring-1 focus:ring-[#0078d4]"
              >
                <option value="">Choose...</option>
                {members.filter(m => !filters.groupId || m.groupId === filters.groupId).map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-2">
             <button onClick={handlePrint} className="flex-1 h-11 flex items-center justify-center gap-2 bg-[#0078d4] text-white px-4 rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-[#106ebe]">
               <FileDown className="w-4 h-4" /> Save
             </button>
             <button onClick={handleShareReport} className="flex-1 h-11 flex items-center justify-center gap-2 bg-[#107c10] text-white px-4 rounded-sm text-[9px] font-black uppercase tracking-widest hover:bg-[#0b5a0b]">
               <Share2 className="w-4 h-4" /> Share
             </button>
             <button onClick={clearFilters} className="h-11 px-3 text-[#a4262c] border border-[#fde7e9] rounded-sm hover:bg-[#fde7e9]">
               <XCircle className="w-5 h-5" />
             </button>
          </div>
        </div>
      </div>

      <div id="report-printable-area" className="bg-white rounded-sm border border-[#edebe9] shadow-sm flex flex-col sm:min-h-[600px] overflow-hidden">
        <div className="flex-1 overflow-x-hidden">
          {renderReportContent()}
        </div>
        
        {summary && (
          <div className="border-t border-[#edebe9] bg-[#faf9f8] p-4 sm:p-10 flex flex-row items-center justify-between sticky bottom-0 z-20">
            <div>
              <p className="text-[9px] sm:text-[10px] font-black text-[#605e5c] uppercase tracking-[0.2em]">{summary.label}</p>
              <h4 className="text-xl sm:text-3xl font-black text-[#0078d4] tracking-tight">{formatCurrency(summary.total)}</h4>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-[#107c10]">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="text-[10px] sm:text-sm font-black uppercase tracking-widest whitespace-nowrap">Verified</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CandidateReport: React.FC<any> = ({ members, payments, groups, filters }) => {
  const m = members.find((x: any) => x.id === filters.memberId);
  if (!m) return <EmptyState label="Search Subscriber First" icon={User} />;
  const g = groups.find((x: any) => x.id === m.groupId);
  const data = payments.filter((p: any) => p.memberId === m.id).sort((a: any, b: any) => a.monthNumber - b.monthNumber);

  return (
    <div className="p-4 sm:p-10 space-y-6 sm:space-y-8 text-[#323130]">
       <ReportHeader title="Subscriber Ledger" subtitle={m.name} groupName={g?.name} />
       <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead>
              <tr className="border-b-2 border-[#f3f2f1] text-[9px] text-[#605e5c] uppercase font-black">
                <th className="py-3">Month</th>
                <th className="py-3">Posted Date</th>
                <th className="py-3">Expected</th>
                <th className="py-3">Paid</th>
                <th className="py-3 text-right">Receipt #</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2f1]">
              {data.map((p: any) => (
                <tr key={p.id}>
                  <td className="py-4 font-black">M{p.monthNumber}</td>
                  <td className="py-4 text-[#605e5c]">{p.paymentDate}</td>
                  <td className="py-4 text-[#a19f9d]">{formatCurrency(p.expectedAmount)}</td>
                  <td className="py-4 font-black text-[#107c10]">{formatCurrency(p.amountPaid)}</td>
                  <td className="py-4 text-right font-mono text-[10px] text-[#a19f9d] uppercase">{p.receiptNumber}</td>
                </tr>
              ))}
            </tbody>
          </table>
       </div>
    </div>
  );
};

const DueReport: React.FC<any> = ({ members, payments, groups, filters }) => {
  const group = groups.find((g: any) => g.id === filters.groupId);
  if (!group) return <EmptyState label="Portfolio Selection Needed" icon={ClipboardList} />;
  const month = filters.month;
  const list = members.filter((m: any) => m.groupId === group.id && !payments.some((p: any) => p.memberId === m.id && p.monthNumber === month));

  const sendReminder = (member: Member) => {
    const amount = calculateExpectedAmount(group, member, month);
    const msg = generateReminderMessage(member, group, month, amount);
    const url = getWhatsAppUrl(member.phone, msg);
    // CRITICAL: window.location.href ensures the app is launched directly on Android
    window.location.href = url;
  };

  return (
    <div className="p-4 sm:p-10 space-y-6 sm:space-y-8 text-[#323130]">
       <ReportHeader title="Aging Dues Audit" subtitle={`Month ${month}`} groupName={group.name} />
       <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[400px]">
            <thead>
              <tr className="border-b-2 border-[#f3f2f1] text-[9px] text-[#605e5c] uppercase font-black">
                <th className="py-3">Subscriber</th>
                <th className="py-3">Contact</th>
                <th className="py-3">Outstanding</th>
                <th className="py-3 text-right no-print">Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2f1]">
              {list.map((m: any) => (
                <tr key={m.id}>
                  <td className="py-4 font-black">{m.name}</td>
                  <td className="py-4 text-[#605e5c] font-mono">{m.phone}</td>
                  <td className="py-4 font-black text-[#a4262c]">{formatCurrency(calculateExpectedAmount(group, m, month))}</td>
                  <td className="py-4 text-right no-print">
                      <button 
                        onClick={() => sendReminder(m)}
                        className="p-3 text-[#107c10] active:scale-90 transition-transform"
                      >
                        <MessageSquare className="w-5 h-5" />
                      </button>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center font-black text-[#107c10] uppercase text-[10px] tracking-widest">
                    Zero Outstanding Records
                  </td>
                </tr>
              )}
            </tbody>
          </table>
       </div>
    </div>
  );
};

const ConsolidatedReport: React.FC<any> = ({ groups, members, payments, filters }) => {
  return (
    <div className="p-4 sm:p-10 space-y-6 sm:space-y-8 text-[#323130]">
       <ReportHeader title="Master Audit" subtitle="Global Registry" groupName="All Portfolios" />
       <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-xs min-w-[500px]">
            <thead>
              <tr className="border-b-2 border-[#f3f2f1] text-[9px] text-[#605e5c] uppercase font-black">
                <th className="py-3">Portfolio Name</th>
                <th className="py-3">Subscribers</th>
                <th className="py-3">Receipts</th>
                <th className="py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2f1]">
              {groups.map((g: any) => (
                <tr key={g.id}>
                  <td className="py-4 font-black">{g.name}</td>
                  <td className="py-4 text-[#605e5c] font-bold">{members.filter((m: any) => m.groupId === g.id).length} Active</td>
                  <td className="py-4 font-black text-[#107c10]">{formatCurrency(payments.filter((p: any) => p.groupId === g.id).reduce((s: any, p: any) => s + p.amountPaid, 0))}</td>
                  <td className="py-4 text-right">
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-sm bg-[#dff6dd] text-[#107c10] border border-[#b1e5ad]">{g.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
       </div>
    </div>
  );
};

const IndividualReport: React.FC<any> = ({ members, payments, groups, filters }) => {
  const m = members.find((x: any) => x.id === filters.memberId);
  if (!m) return <EmptyState label="Subscriber Lookup Required" icon={FileText} />;
  const g = groups.find((x: any) => x.id === m.groupId);

  return (
    <div className="p-4 sm:p-10 space-y-6 sm:space-y-10 max-w-4xl mx-auto">
       <div className="text-center space-y-1 border-b-4 border-[#0078d4] pb-4">
          <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter">GTS CHITS</h1>
          <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-[#0078d4]">Statement of Account</p>
       </div>
       
       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-10">
          <div className="space-y-2">
             <p className="text-[9px] font-black text-[#605e5c] uppercase">Account Holder</p>
             <p className="text-base font-black">{m.name}</p>
             <p className="text-[10px] font-bold text-[#a19f9d] uppercase">ID: {m.id} | PH: {m.phone}</p>
          </div>
          <div className="sm:text-right space-y-2">
             <p className="text-[9px] font-black text-[#605e5c] uppercase">Linked Portfolio</p>
             <p className="text-base font-black text-[#0078d4]">{g?.name}</p>
          </div>
       </div>

       <div className="border border-[#edebe9] rounded-sm overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf9f8]">
              <tr className="text-[9px] text-[#605e5c] uppercase font-black border-b border-[#edebe9]">
                <th className="px-3 sm:px-4 py-3">Month</th>
                <th className="px-3 sm:px-4 py-3">Receipt</th>
                <th className="px-3 sm:px-4 py-3 text-right">Settled</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f2f1]">
              {payments.filter((p: any) => p.memberId === m.id).map((p: any) => (
                <tr key={p.id}>
                  <td className="px-3 sm:px-4 py-3 font-black">M{p.monthNumber}</td>
                  <td className="px-3 sm:px-4 py-3 text-[#a19f9d] uppercase font-mono text-[9px]">{p.receiptNumber}</td>
                  <td className="px-3 sm:px-4 py-3 text-right font-black">{formatCurrency(p.amountPaid)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-[#f3f2f1]">
              <tr className="font-black uppercase">
                <td colSpan={2} className="px-3 sm:px-4 py-4 text-[10px] sm:text-sm">Balance Closed</td>
                <td className="px-3 sm:px-4 py-4 text-right text-base sm:text-lg">{formatCurrency(payments.filter((p: any) => p.memberId === m.id).reduce((s: any, p: any) => s + p.amountPaid, 0))}</td>
              </tr>
            </tfoot>
          </table>
       </div>
    </div>
  );
};

const ReportHeader = ({ title, subtitle, groupName }: { title: string, subtitle: string, groupName?: string }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-[#f3f2f1] pb-4 sm:pb-6">
    <div className="space-y-1">
       <p className="text-[9px] sm:text-[10px] font-black text-[#0078d4] uppercase tracking-widest">{title}</p>
       <h2 className="text-xl sm:text-3xl font-black tracking-tight">{subtitle}</h2>
    </div>
    <div className="sm:text-right">
       <h3 className="text-sm sm:text-lg font-black uppercase tracking-tight">{groupName || 'Central Registry'}</h3>
       <p className="text-[9px] font-black text-[#a19f9d] uppercase tracking-widest">Branch: GTS Global</p>
    </div>
  </div>
);

const EmptyState = ({ label, icon: Icon }: any) => (
  <div className="flex flex-col items-center justify-center p-12 sm:p-24 text-center">
    <Icon className="w-12 h-12 sm:w-16 sm:h-16 text-[#f3f2f1] mb-4" />
    <h3 className="text-sm sm:text-lg font-black text-[#c8c6c4] uppercase tracking-widest">{label}</h3>
    <p className="text-[9px] font-black text-[#a19f9d] mt-2 uppercase">Adjust filters to generate ledger</p>
  </div>
);

export default Reports;
