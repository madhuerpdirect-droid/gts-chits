
import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  IndianRupee, 
  FileText, 
  Settings, 
  Menu, 
  X, 
  ShieldCheck,
  AlertTriangle,
  Download,
  Award,
  ShieldAlert,
  ArrowLeft
} from 'lucide-react';
import { ChitGroup, Member, Payment, Page } from './types';
import { loadData, saveData, getLastBackupDate, getLastChangeDate, updateLastBackupTimestamp } from './storage';

// --- Pages ---
import Dashboard from './pages/Dashboard';
import ChitGroups from './pages/ChitGroups';
import Candidates from './pages/Candidates';
import Allotment from './pages/Allotment';
import CollectionEntry from './pages/CollectionEntry';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';

const App: React.FC = () => {
  const [activePage, setActivePage] = useState<Page>('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Core Data State
  const [groups, setGroups] = useState<ChitGroup[]>(() => loadData('gts_chits_groups', []));
  const [members, setMembers] = useState<Member[]>(() => loadData('gts_chits_members', []));
  const [payments, setPayments] = useState<Payment[]>(() => loadData('gts_chits_payments', []));
  const [upiId, setUpiId] = useState<string>(() => localStorage.getItem('gts_chits_upi') || '');
  const [whatsappUseWeb, setWhatsappUseWeb] = useState<boolean>(() => localStorage.getItem('gts_chits_wa_web') === 'true');

  // Safety Monitor State
  const [needsBackup, setNeedsBackup] = useState(false);
  const isInitialLoad = useRef(true);

  // Persist Data & Monitor Changes
  useEffect(() => {
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      checkBackupStatus();
      return;
    }
    saveData('gts_chits_groups', groups);
    setNeedsBackup(true);
  }, [groups]);

  useEffect(() => {
    if (isInitialLoad.current) return;
    saveData('gts_chits_members', members);
    setNeedsBackup(true);
  }, [members]);

  useEffect(() => {
    if (isInitialLoad.current) return;
    saveData('gts_chits_payments', payments);
    setNeedsBackup(true);
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('gts_chits_upi', upiId);
  }, [upiId]);

  useEffect(() => {
    localStorage.setItem('gts_chits_wa_web', String(whatsappUseWeb));
  }, [whatsappUseWeb]);

  const checkBackupStatus = () => {
    const lastBackup = getLastBackupDate();
    const lastChange = getLastChangeDate();
    if (!lastBackup && (groups.length > 0 || members.length > 0 || payments.length > 0)) {
      setNeedsBackup(true);
    } else if (lastBackup && lastChange) {
      setNeedsBackup(new Date(lastChange) > new Date(lastBackup));
    }
  };

  const triggerFullBackup = () => {
    const data = { groups, members, payments };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GTS_DATABASE_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    updateLastBackupTimestamp();
    setNeedsBackup(false);
  };

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const renderPage = () => {
    switch (activePage) {
      case 'Dashboard':
        return <Dashboard groups={groups} members={members} payments={payments} />;
      case 'ChitGroups':
        return <ChitGroups groups={groups} setGroups={setGroups} />;
      case 'Candidates':
        return <Candidates members={members} setMembers={setMembers} groups={groups} payments={payments} />;
      case 'Allotment':
        return <Allotment groups={groups} members={members} setMembers={setMembers} onBack={() => setActivePage('Dashboard')} />;
      case 'Collection':
        return <CollectionEntry 
          groups={groups} 
          members={members} 
          setMembers={setMembers}
          payments={payments} 
          setPayments={setPayments} 
          upiId={upiId}
          whatsappUseWeb={whatsappUseWeb}
        />;
      case 'Reports':
        return <Reports groups={groups} members={members} payments={payments} whatsappUseWeb={whatsappUseWeb} />;
      case 'Settings':
        return <SettingsPage 
          groups={groups} 
          members={members} 
          payments={payments} 
          setGroups={setGroups} 
          setMembers={setMembers} 
          setPayments={setPayments} 
          upiId={upiId}
          setUpiId={setUpiId}
          whatsappUseWeb={whatsappUseWeb}
          setWhatsappUseWeb={setWhatsappUseWeb}
        />;
      default:
        return <Dashboard groups={groups} members={members} payments={payments} />;
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, id: 'Dashboard' as Page },
    { name: 'Chit Groups', icon: Layers, id: 'ChitGroups' as Page },
    { name: 'Candidates', icon: Users, id: 'Candidates' as Page },
    { name: 'Prize Allotment', icon: Award, id: 'Allotment' as Page },
    { name: 'Collection Entry', icon: IndianRupee, id: 'Collection' as Page },
    { name: 'Reports', icon: FileText, id: 'Reports' as Page },
    { name: 'Settings', icon: Settings, id: 'Settings' as Page },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f8] flex text-[#323130] flex-col overflow-hidden">
      {needsBackup && (groups.length > 0 || members.length > 0 || payments.length > 0) && (
        <div className="bg-[#fff4ce] border-b border-[#fde38b] px-6 py-2 flex items-center justify-between no-print z-[70]">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-[#7a5e00]" />
            <p className="text-[11px] font-bold text-[#7a5e00] uppercase">
              Database not synced. Export for safety.
            </p>
          </div>
          <button onClick={triggerFullBackup} className="bg-[#7a5e00] text-white px-3 py-1 rounded-sm text-[10px] font-bold uppercase">
            <Download className="w-3.5 h-3.5 inline mr-1" /> Export
          </button>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={toggleSidebar} />}
        <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#edebe9] transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="h-full flex flex-col">
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActivePage('Dashboard')}>
                <div className="bg-[#0078d4] p-2 rounded-md"><IndianRupee className="w-5 h-5 text-white" /></div>
                <span className="text-xl font-bold tracking-tight">GTS CHITS</span>
              </div>
              <button onClick={toggleSidebar} className="lg:hidden text-[#605e5c]"><X className="w-6 h-6" /></button>
            </div>
            <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setActivePage(item.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold rounded-md transition-colors ${activePage === item.id ? 'bg-[#f3f2f1] text-[#0078d4] border-l-4 border-[#0078d4]' : 'text-[#605e5c] hover:bg-[#f3f2f1] hover:text-[#323130]'}`}
                >
                  <item.icon className="w-5 h-5" /> {item.name}
                </button>
              ))}
            </nav>
            <div className="p-4 mt-auto">
              <div className={`rounded-lg p-4 border ${needsBackup ? 'bg-[#fde7e9] border-[#f4b6b1]' : 'bg-[#f3f2f1] border-[#edebe9]'}`}>
                <div className="flex items-center gap-2">
                  {needsBackup ? <ShieldAlert className="w-4 h-4 text-[#a4262c]" /> : <ShieldCheck className="w-4 h-4 text-[#0078d4]" />}
                  <p className="text-[10px] uppercase font-bold tracking-wider">{needsBackup ? 'Backup Needed' : 'Registry Safe'}</p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-14 bg-white border-b border-[#edebe9] flex items-center justify-between px-6 lg:px-8 shrink-0 no-print">
            <div className="flex items-center gap-4">
              <button onClick={toggleSidebar} className="lg:hidden text-[#605e5c] hover:text-[#0078d4]"><Menu className="w-5 h-5" /></button>
              {activePage !== 'Dashboard' && (
                <button 
                  onClick={() => setActivePage('Dashboard')}
                  className="flex items-center gap-1.5 text-[#0078d4] hover:text-[#106ebe] transition-colors pr-4 border-r border-[#edebe9] py-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Back</span>
                </button>
              )}
              <h1 className="text-sm font-bold uppercase tracking-wider">{activePage.replace(/([A-Z])/g, ' $1').trim()}</h1>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#0078d4] flex items-center justify-center text-white font-bold text-xs shadow-sm">AD</div>
          </header>
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#faf9f8]">
            <div className="max-w-7xl mx-auto">{renderPage()}</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
