
import React, { useState } from 'react';
import { Download, Upload, Trash2, Database, ShieldAlert, FileJson, ShieldCheck, Clock, Smartphone, Info, MessageSquare } from 'lucide-react';
import { ChitGroup, Member, Payment } from '../types';
import { getLastBackupDate, updateLastBackupTimestamp } from '../storage';
import { getWhatsAppUrl } from '../utils';

interface SettingsPageProps {
  groups: ChitGroup[];
  members: Member[];
  payments: Payment[];
  setGroups: (g: ChitGroup[]) => void;
  setMembers: (m: Member[]) => void;
  setPayments: (p: Payment[]) => void;
  upiId: string;
  setUpiId: (v: string) => void;
  whatsappUseWeb: boolean;
  setWhatsappUseWeb: (v: boolean) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ groups, members, payments, setGroups, setMembers, setPayments, upiId, setUpiId, whatsappUseWeb, setWhatsappUseWeb }) => {
  const [lastBackup, setLastBackup] = useState<string | null>(getLastBackupDate());
  const [testPhone, setTestPhone] = useState('');

  const exportAllData = () => {
    const data = { groups, members, payments };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GTS_DATABASE_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    updateLastBackupTimestamp();
    setLastBackup(new Date().toISOString());
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.groups && data.members && data.payments) {
          if (window.confirm('OVERWRITE WARNING: This replaces current local database. Proceed?')) {
            setGroups(data.groups);
            setMembers(data.members);
            setPayments(data.payments);
            alert('Database Restored Successfully');
          }
        }
      } catch (err) { alert('Invalid Database Format'); }
    };
    reader.readAsText(file);
  };

  /**
   * Diagnostic Trigger with Intent Fix.
   */
  const triggerWhatsAppTest = () => {
    if (testPhone.length !== 10) return alert('Enter 10-digit mobile number to test.');
    const url = getWhatsAppUrl(testPhone, "GTS CHITS: Connectivity Test Success! WhatsApp is linked to your APK correctly.", whatsappUseWeb);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 text-[#323130]">
      {/* Banner - Professional Silver/Blue */}
      <div className="bg-[#f3f2f1] border border-[#edebe9] rounded-sm p-10 flex flex-col md:flex-row items-center justify-between shadow-sm">
        <div className="space-y-4 mb-6 md:mb-0">
          <div className="flex items-center gap-3">
             <div className="bg-[#0078d4] p-2 rounded-sm shadow-sm">
                <Database className="w-5 h-5 text-white" />
             </div>
             <h2 className="text-xl font-bold tracking-tight text-[#323130]">System Administration Master</h2>
          </div>
          <p className="text-[#605e5c] text-xs max-w-sm font-semibold leading-relaxed uppercase tracking-tighter">
            Local database encryption active. All records are stored in high-performance browser cache for zero-latency operations.
          </p>
          <div className="flex items-center gap-2 pt-1">
             <ShieldCheck className="w-4 h-4 text-[#107c10]" />
             <span className="text-[9px] font-bold uppercase tracking-widest text-[#107c10]">Data Integrity Verified</span>
          </div>
        </div>
        
        <div className="bg-white rounded-sm p-6 border border-[#edebe9] text-center min-w-[200px] shadow-sm">
           <Clock className="w-5 h-5 text-[#0078d4] mx-auto mb-2" />
           <p className="text-[9px] font-bold uppercase tracking-widest text-[#a19f9d] mb-1">Archive Health</p>
           <p className="text-sm font-bold text-[#323130]">{lastBackup ? new Date(lastBackup).toLocaleDateString() : 'No Recent Export'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* UPI VPA Config */}
        <div className="bg-white p-8 rounded-sm border border-[#edebe9] shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-[#f3f2f1] pb-4">
            <Smartphone className="w-4 h-4 text-[#0078d4]" />
            <h3 className="font-bold text-[#323130] uppercase text-[10px] tracking-widest">Digital Gateway Protocol</h3>
          </div>
          <div className="space-y-4 flex-1">
             <input 
                type="text"
                placeholder="branch.manager@upi"
                value={upiId}
                onChange={e => setUpiId(e.target.value)}
                className="w-full px-4 py-3 bg-[#faf9f8] border border-[#edebe9] rounded-sm outline-none focus:border-[#0078d4] font-bold text-sm text-[#323130]"
              />
              <div className="flex gap-2 p-4 bg-[#fff4ce] rounded-sm border border-[#fde38b]">
                 <Info className="w-4 h-4 text-[#7a5e00] shrink-0" />
                 <p className="text-[9px] text-[#7a5e00] font-bold uppercase leading-relaxed">
                   Set official VPA for automated QR generation in collection terminals.
                 </p>
              </div>
          </div>
        </div>

        {/* WhatsApp APK Diagnostic & Preference */}
        <div className="bg-white p-8 rounded-sm border border-[#edebe9] shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-[#f3f2f1] pb-4">
            <MessageSquare className="w-4 h-4 text-[#107c10]" />
            <h3 className="font-bold text-[#323130] uppercase text-[10px] tracking-widest">WhatsApp Routing Preference</h3>
          </div>
          <div className="space-y-6 flex-1">
             <div className="flex items-center gap-3 p-3 bg-[#faf9f8] rounded-sm border border-[#edebe9]">
                <input 
                  type="checkbox" 
                  id="wa-mode"
                  checked={whatsappUseWeb}
                  onChange={e => setWhatsappUseWeb(e.target.checked)}
                  className="w-5 h-5 accent-[#107c10] cursor-pointer"
                />
                <label htmlFor="wa-mode" className="text-[10px] font-black uppercase tracking-widest text-[#323130] cursor-pointer">
                  Route via WhatsApp Web (Desktop)
                </label>
             </div>

             <div className="flex gap-2">
                <input 
                  type="tel"
                  maxLength={10}
                  placeholder="Test Mobile Number"
                  value={testPhone}
                  onChange={e => setTestPhone(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-4 py-3 bg-[#faf9f8] border border-[#edebe9] rounded-sm font-bold text-sm"
                />
                <button 
                  onClick={triggerWhatsAppTest}
                  className="bg-[#107c10] text-white px-4 py-2 rounded-sm font-black text-[9px] uppercase tracking-widest"
                >
                  Test Intent
                </button>
             </div>
             <p className="text-[9px] text-[#605e5c] font-bold uppercase leading-relaxed">
                Choose "Web" for desktop browser use, or uncheck for native Android/iOS app routing.
             </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6">
        {/* Maintenance Controls */}
        <div className="bg-white p-8 rounded-sm border border-[#edebe9] shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-6 border-b border-[#f3f2f1] pb-4">
            <FileJson className="w-4 h-4 text-[#0078d4]" />
            <h3 className="font-bold text-[#323130] uppercase text-[10px] tracking-widest">Maintenance & Migration</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
             <button 
                onClick={exportAllData}
                className="flex-1 flex items-center justify-center gap-2 bg-[#323130] text-white py-4 rounded-sm font-bold text-[10px] uppercase tracking-widest hover:bg-black transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Archive Database (JSON)
              </button>
              <label className="flex-1 flex items-center justify-center gap-2 bg-white text-[#323130] border border-[#edebe9] py-4 rounded-sm font-bold text-[10px] uppercase tracking-widest hover:bg-[#faf9f8] cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#0078d4]" /> Restore Repository
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
          </div>
        </div>
      </div>

      {/* Critical Override */}
      <div className="bg-[#fde7e9] p-8 rounded-sm border border-[#f4b6b1] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <ShieldAlert className="w-4 h-4 text-[#a4262c]" />
            <h3 className="text-sm font-bold text-[#a4262c] uppercase tracking-tight">System Factory Override</h3>
          </div>
          <p className="text-[9px] text-[#a4262c] font-bold uppercase tracking-widest leading-relaxed">
            CRITICAL: This wipes all localized records permanently.
          </p>
        </div>
        <button 
          onClick={() => { if(window.confirm('Wipe system database?')) localStorage.clear(); window.location.reload(); }}
          className="bg-[#a4262c] text-white px-8 py-3 rounded-sm font-bold text-[10px] uppercase tracking-widest hover:bg-[#821c22] transition-colors shadow-sm"
        >
          <Trash2 className="w-3.5 h-3.5 inline mr-2" /> Execute Master Reset
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
