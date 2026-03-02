import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportAPI } from '../api/services';
import Layout from '../components/Layout';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [summaries, setSummaries] = useState({
    project: [],
    sales: [],
    rp: [],
    cashBank: { cash: 0, bank: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummaries();
  }, []);

  const fetchSummaries = async () => {
    try {
      const [pRes, sRes, rpRes, cRes] = await Promise.all([
        reportAPI.getProjectSummary(),
        reportAPI.getSalesPosition(),
        reportAPI.getRPSummary(),
        reportAPI.getCashBook({ startDate: new Date().toISOString().split('T')[0] })
      ]);
      setSummaries({
        project: pRes.data.data || [],
        sales: sRes.data.data || [],
        rp: rpRes.data.data || [],
        cashBank: {
          cash: cRes.data.openingBalance || 0,
          bank: 0 // Placeholder
        }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      title: 'DATA ENTRY',
      cards: [
        { title: 'Customer Creation', description: 'Add and manage customers', link: '/customers', color: 'from-slate-700 to-slate-600', icon: '👤', roles: ['Executive', 'Head Executive', 'The Boss'] },
        { title: 'Project Entry', description: 'Manage all projects', link: '/projects', color: 'from-slate-700 to-slate-600', icon: '🏢', roles: ['Executive', 'Head Executive', 'The Boss'] },
        { title: 'Laser Creation', description: 'Manage money spend record books', link: '/ledger-accounts', color: 'from-slate-700 to-slate-600', icon: '💎', roles: ['Executive', 'Head Executive', 'The Boss'] },
        { title: 'Executive Detail', description: 'Manage executives and bank details', link: '/executives', color: 'from-slate-700 to-slate-600', icon: '👔', roles: ['The Boss', 'Head Executive'] },
        { title: 'Account Transaction', description: 'Record payments', link: '/transactions', color: 'from-slate-700 to-slate-600', icon: '💸', roles: ['Executive', 'Head Executive', 'The Boss'] },
        { title: 'User Creation', description: 'Create and manage system users', link: '/users', color: 'from-slate-700 to-slate-600', icon: '🛡️', roles: ['The Boss'] },
        { title: 'Customer Entry Modify', description: 'Update and view customer details', link: '/customer-status', color: 'from-slate-700 to-slate-600', icon: '📝', roles: ['Executive', 'Head Executive', 'The Boss'] },
        { title: 'Party Ledger', description: 'View transaction history', link: '/party-ledger', color: 'from-slate-700 to-slate-600', icon: '📔', roles: ['Executive', 'Head Executive', 'The Boss'] },
        { title: 'JV Entry', description: 'manage journal vouchers', link: '/jv-entry', color: 'from-slate-700 to-slate-600', icon: '📓', roles: ['Executive', 'Head Executive', 'The Boss'] },
      ]
    },
    {
      title: 'REPORT',
      cards: [
        { title: 'Customer Statement', description: 'Project & status wise summary', link: '/report/customer-statement', color: 'from-slate-700 to-slate-600', icon: '📜', roles: ['The Boss', 'Head Executive'] },
        { title: 'Sales Report', description: 'Detailed sales analytics', link: '/report/sales', color: 'from-slate-700 to-slate-600', icon: '📈', roles: ['The Boss', 'Head Executive'] },
        { title: 'Executive Sales Report', description: 'Executive business statement', link: '/report/executive-sales', color: 'from-slate-700 to-slate-600', icon: '👔', roles: ['The Boss', 'Head Executive'] },
        { title: 'Direct Customer Report', description: 'Individual customer ledger', link: '/report/direct-statement', color: 'from-slate-700 to-slate-600', icon: '🧾', roles: ['The Boss', 'Head Executive'] },
        { title: 'Customer Outstanding', description: 'Project wise pending dues', link: '/report/outstanding', color: 'from-slate-700 to-slate-600', icon: '⚠️', roles: ['The Boss', 'Head Executive'] },
        { title: 'Customer Dues Summary', description: 'EMI & payment tracking', link: '/report/dues', color: 'from-slate-700 to-slate-600', icon: '📅', roles: ['The Boss', 'Head Executive'] },
        { title: 'Cash Book', description: 'Daily receipts & payments', link: '/report/cash-book', color: 'from-slate-700 to-slate-600', icon: '📖', roles: ['The Boss', 'Head Executive'] },
        { title: 'Daily Collection Register', description: 'Detailed partner collection register', link: '/report/daily-collection', color: 'from-slate-700 to-slate-600', icon: '💵', roles: ['The Boss', 'Head Executive'] },
        { title: 'Monthly EMI Reminder', description: 'Monthly EMI due reminders', link: '/report/monthly-emi-reminder', color: 'from-slate-700 to-slate-600', icon: '🔔', roles: ['The Boss', 'Head Executive'] },
        { title: 'Customers Token by Exe', description: 'Token customers by executive', link: '/report/token-by-executive', color: 'from-slate-700 to-slate-600', icon: '🎟️', roles: ['The Boss', 'Head Executive'] },
        { title: 'Executive/Customer Reminder', description: 'Upcoming EMI follow-ups', link: '/report/executive-reminder', color: 'from-slate-700 to-slate-600', icon: '⏰', roles: ['The Boss', 'Head Executive'] },
        { title: 'Unit Calculation', description: 'Project-wise unit & area stats', link: '/report/unit-calculation', color: 'from-slate-700 to-slate-600', icon: '📐', roles: ['The Boss', 'Head Executive'] },
        { title: 'User Daily Collection', description: 'Executive-wise daily collection', link: '/report/user-daily-collection', color: 'from-slate-700 to-slate-600', icon: '👤', roles: ['The Boss', 'Head Executive'] },
        { title: 'Customer EMI Dues', description: 'Overdue EMI recovery tracker', link: '/report/customer-emi-dues', color: 'from-slate-700 to-slate-600', icon: '🚨', roles: ['The Boss', 'Head Executive'] },
        { title: 'Executive Tree', description: 'Visual hierarchy & commissions', link: '/report/executive-tree', color: 'from-slate-700 to-slate-600', icon: '🌳', roles: ['The Boss', 'Head Executive'] },
      ]
    },
    {
      title: 'CRM',
      cards: [
        { title: 'New CRM Client', description: 'Onboard potential leads', link: '/crm', color: 'from-slate-700 to-slate-600', icon: '🆕', roles: ['Executive', 'Head Executive', 'The Boss'] },
        { title: 'Follow-up(Leads)', description: 'Manage client communications', link: '/crm', color: 'from-slate-700 to-slate-600', icon: '📞', roles: ['Executive', 'Head Executive', 'The Boss'] },
        { title: 'Import Excel Data', description: 'Bulk lead ingestion', link: '/crm', color: 'from-slate-700 to-slate-600', icon: '📥', roles: ['The Boss', 'Head Executive'] },
      ]
    },
    {
      title: 'COMMISSION',
      cards: [
        { title: 'Sales Agent Commission', description: 'Payout processing v1', link: '/commissions', color: 'from-slate-700 to-slate-600', icon: '💰', roles: ['The Boss', 'Head Executive'] },
        { title: 'Sale Agent Commission 2', description: 'Advanced payout system', link: '/commissions', color: 'from-slate-700 to-slate-600', icon: '💸', roles: ['The Boss', 'Head Executive'] },
        { title: 'Executive Login', description: 'Commission portal access', link: '/commissions', color: 'from-slate-700 to-slate-600', icon: '🔑', roles: ['The Boss', 'Head Executive', 'Executive'] },
        { title: 'Agent Summary', description: 'Gross agent performance', link: '/commissions', color: 'from-slate-700 to-slate-600', icon: '📊', roles: ['The Boss', 'Head Executive'] },
        { title: 'New Sales Agent Commission', description: 'Create new agent payouts', link: '/commissions', color: 'from-slate-700 to-slate-600', icon: '✨', roles: ['The Boss', 'Head Executive'] },
      ]
    }
  ];

  const filteredSections = sections.map(section => ({
    ...section,
    cards: section.cards.filter(card => card.roles.includes(user?.role))
  })).filter(section => section.cards.length > 0);

  const totalSales = summaries.project.reduce((acc, p) => acc + p.totalSale, 0);
  const totalCollections = summaries.project.reduce((acc, p) => acc + p.totalReceived, 0);
  const totalBalance = summaries.project.reduce((acc, p) => acc + p.balance, 0);
  const liquidity = summaries.cashBank.cash + summaries.cashBank.bank;

  // Chart Data
  const totalSold = summaries.sales.reduce((acc, s) => acc + s.sold, 0);
  const totalBooked = summaries.sales.reduce((acc, s) => acc + s.booked, 0);
  const totalAvailable = summaries.sales.reduce((acc, s) => acc + s.available, 0);
  
  const inventoryData = {
      labels: ['Sold', 'Booked', 'Available'],
      datasets: [
          {
              data: [totalSold, totalBooked, totalAvailable],
              backgroundColor: ['#10B981', '#3B82F6', '#E2E8F0'],
              borderWidth: 0,
              cutout: '75%',
          },
      ],
  };

  return (
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 rounded-3xl shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F38C32]/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
            <div className="relative z-10">
                <h1 className="text-4xl font-black tracking-tighter">Welcome back, {user?.name}!</h1>
                <p className="text-[#F38C32] text-sm font-black uppercase tracking-[0.4em] mt-2">Dange Associates Enterprise Protocol | {user?.role}</p>
                
                <div className="mt-8 relative max-w-2xl">
                    <div className="flex gap-4">
                        <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-2xl border border-white/10 shadow-2xl shrink-0">
                            🤖
                        </div>
                        <div className="flex-1 flex items-center bg-white/5 border border-white/10 rounded-2xl transition-all focus-within:border-cyan-500 focus-within:bg-white/[0.08] focus-within:shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                            <input 
                                type="text" 
                                placeholder="Ask about your business intelligence..." 
                                className="flex-1 px-6 py-4 bg-transparent outline-none font-bold text-sm text-white placeholder:text-slate-600 transition-all"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.target.value.trim()) {
                                        navigate('/ai-assistant', { state: { autoQuery: e.target.value } });
                                    }
                                }}
                            />
                            <button 
                                className="px-8 py-3 mr-2 bg-white text-slate-950 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-[#F38C32] hover:text-white transition-all active:scale-95 shadow-2xl flex items-center gap-3 group"
                                onClick={(e) => {
                                    const input = e.currentTarget.closest('.flex-1').querySelector('input');
                                    if (input && input.value.trim()) {
                                        navigate('/ai-assistant', { state: { autoQuery: input.value } });
                                    }
                                }}
                            >
                                <span>Ask AI</span>
                                <span className="text-base group-hover:translate-x-1 transition-transform">➔</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* KPI High-Level Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
                <div className="flex justify-between items-center mb-1.5">
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors text-base">📊</div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-1.5 py-0.5 rounded-md">Target</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">₹{(totalSales / 10000000).toFixed(2)}Cr</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gross Sales Volume</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
                <div className="flex justify-between items-center mb-1.5">
                    <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-emerald-500 group-hover:text-white transition-colors text-base">💰</div>
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded-md">Inflow</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">₹{(totalCollections / 10000000).toFixed(2)}Cr</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Collections</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group">
                <div className="flex justify-between items-center mb-1.5">
                    <div className="p-2 bg-rose-50 rounded-lg group-hover:bg-rose-500 group-hover:text-white transition-colors text-base">⚠️</div>
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-1.5 py-0.5 rounded-md">Pending</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter">₹{(totalBalance / 10000000).toFixed(2)}Cr</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding Bal</p>
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="flex justify-between items-center mb-1.5 relative z-10">
                    <div className="p-2 bg-orange-50 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors text-base">💎</div>
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-1.5 py-0.5 rounded-md">Liquid</span>
                </div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tighter relative z-10">₹{(liquidity / 100000).toFixed(2)}L</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest relative z-10">Cash + Bank Assets</p>
            </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Box 1: Project Summary */}
            <div className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all duration-500 hover:shadow-xl">
                <div className="bg-slate-900 px-6 py-3.5 text-white font-black text-[12px] uppercase tracking-[0.3em] flex justify-between items-center">
                    <span className="flex items-center gap-2"><span>📂</span> Project Summary</span>
                    <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-orange-400 font-bold">Live</span>
                </div>
                <div className="p-5 bg-slate-50/50 flex-1">
                    <div className="overflow-x-auto text-[13px] uppercase font-black text-slate-500 tracking-tighter">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-3 text-left">Venture</th>
                                    <th className="pb-3 text-right">Sales</th>
                                    <th className="pb-3 text-right">Inflow</th>
                                    <th className="pb-3 text-right">Bal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {summaries.project.map((p, i) => (
                                    <tr key={i} className="group/row cursor-pointer hover:bg-white transition-colors" onClick={() => navigate(`/report/outstanding?projectId=${p._id}`)}>
                                        <td className="py-2.5 text-slate-700 group-hover/row:text-[#F38C32] transition-colors">{p.projectName}</td>
                                        <td className="py-2.5 text-right font-mono">₹{p.totalSale.toLocaleString('en-IN')}</td>
                                        <td className="py-2.5 text-right font-mono text-emerald-600">₹{p.totalReceived.toLocaleString('en-IN')}</td>
                                        <td className="py-2.5 text-right font-mono text-rose-500">₹{p.balance.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Box 2: Sales Position */}
            <div className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all duration-500 hover:shadow-xl">
                <div className="bg-slate-900 px-6 py-3.5 text-white font-black text-[12px] uppercase tracking-[0.3em] flex justify-between items-center">
                    <span className="flex items-center gap-2"><span>💹</span> Sales Position</span>
                    <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-orange-400 font-bold">Market</span>
                </div>
                <div className="p-5 bg-slate-50/50 flex-1">
                    <div className="overflow-x-auto text-[13px] uppercase font-black text-slate-500 tracking-tighter">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-3 text-left">Project</th>
                                    <th className="pb-3 text-center">Units</th>
                                    <th className="pb-3 text-center">Agr.</th>
                                    <th className="pb-3 text-center">Bk.</th>
                                    <th className="pb-3 text-center">Avail</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {summaries.sales.map((s, i) => (
                                    <tr key={i} className="group/row cursor-pointer hover:bg-white transition-colors" onClick={() => navigate(`/report/sales-position/${s._id}?name=${s.projectName}`)}>
                                        <td className="py-2.5 text-slate-700 group-hover/row:text-[#F38C32] transition-colors">{s.projectName}</td>
                                        <td className="py-2.5 text-center font-mono">{s.totalPlots}</td>
                                        <td className="py-2.5 text-center font-mono text-emerald-600">{s.sold}</td>
                                        <td className="py-2.5 text-center font-mono text-blue-500">{s.booked}</td>
                                        <td className="py-2.5 text-center font-mono text-rose-500">{s.available}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Box 3: Inventory Matrix (Chart) */}
            <div className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all duration-500 hover:shadow-xl">
                <div className="bg-slate-900 px-6 py-3.5 text-white font-black text-[12px] uppercase tracking-[0.3em] flex justify-between items-center">
                    <span className="flex items-center gap-2"><span>🏙️</span> Inventory Matrix</span>
                </div>
                <div className="p-6 flex items-center justify-around relative overflow-hidden h-64">
                    <div className="w-44 h-44 relative z-10">
                        <Doughnut 
                            data={inventoryData} 
                            options={{ 
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: { legend: { display: false }, tooltip: { enabled: true } } 
                            }} 
                        />
                         <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="block text-3xl font-black text-slate-800 tracking-tighter">{totalSold + totalBooked + totalAvailable}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Units</span>
                            </div>
                        </div>
                    </div>
                     <div className="space-y-4">
                        <div className="flex items-center gap-2.5">
                             <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/30"></span>
                             <div>
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sold</p>
                                 <p className="text-lg font-black text-slate-800 tracking-tighter">{totalSold}</p>
                             </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                             <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/30"></span>
                             <div>
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Booked</p>
                                 <p className="text-lg font-black text-slate-800 tracking-tighter">{totalBooked}</p>
                             </div>
                        </div>
                         <div className="flex items-center gap-2.5">
                             <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
                             <div>
                                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Avail</p>
                                 <p className="text-lg font-black text-slate-800 tracking-tighter">{totalAvailable}</p>
                             </div>
                        </div>
                     </div>
                </div>
            </div>

            {/* Box 4: Project Receipts & Payments */}
            <div className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all duration-500 hover:shadow-xl">
                <div className="bg-slate-900 px-6 py-3.5 text-white font-black text-[12px] uppercase tracking-[0.3em] flex justify-between items-center">
                    <span className="flex items-center gap-2"><span>🔄</span> Receipts & Pay</span>
                    <span className="text-[9px] bg-white/10 px-1.5 py-0.5 rounded text-orange-400 font-bold">Sync</span>
                </div>
                <div className="p-5 bg-slate-50/50 flex-1">
                    <div className="overflow-x-auto text-[13px] uppercase font-black text-slate-500 tracking-tighter">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-3 text-left">Profile</th>
                                    <th className="pb-3 text-right">In (Rec)</th>
                                    <th className="pb-3 text-right">Out (Pay)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {summaries.rp.map((r, i) => (
                                    <tr key={i} className="group/row cursor-pointer hover:bg-white transition-colors" onClick={() => navigate('/report/cash-book')}>
                                        <td className="py-2.5 text-slate-700 group-hover/row:text-[#F38C32] transition-colors">{r.projectName}</td>
                                        <td className="py-2.5 text-right font-mono text-emerald-600">₹{r.totalReceipt.toLocaleString('en-IN')}</td>
                                        <td className="py-2.5 text-right font-mono text-rose-500">₹{r.totalPayment.toLocaleString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        {/* Module Cards */}
        <div className="space-y-8 pb-16">
          {filteredSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                    <h2 className="text-[13px] font-black text-slate-900 uppercase tracking-[0.3em]">{section.title}</h2>
                    <div className="h-0.5 w-8 bg-[#F38C32] mt-0.5 rounded-full"></div>
                </div>
                <div className="h-px bg-slate-100 flex-1"></div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {section.cards.map((card, index) => (
                  <Link
                    key={index}
                    to={card.link}
                    className="group relative overflow-hidden px-4 py-3.5 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 bg-slate-900/5 rounded-full blur-2xl group-hover:bg-[#F38C32]/15 transition-all duration-500"></div>
                    
                    <div className="relative z-10 flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300 shadow-sm">
                            {card.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[14px] font-extrabold text-slate-800 tracking-tight leading-tight group-hover:text-[#F38C32] transition-colors truncate">{card.title}</h3>
                          <p className="text-slate-400 text-[11px] font-medium tracking-wide line-clamp-1 mt-1">{card.description}</p>
                        </div>
                        <div className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-all duration-300">
                            <span className="text-xs text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-all">→</span>
                        </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
  );
};

export default Dashboard;
