import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportAPI } from '../api/services';
import Layout from '../components/Layout';

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
        { title: 'Customer Creation', description: 'Add and manage customers', link: '/customers', color: 'from-blue-600 to-blue-400', roles: ['Executive', 'Head Executive', 'The Boss'] },
        { title: 'Project Entry', description: 'Manage all projects', link: '/projects', color: 'from-sky-600 to-sky-400', roles: ['Executive', 'Head Executive', 'The Boss'] },
        { title: 'Laser Creation', description: 'Manage money spend record books', link: '/ledger-accounts', color: 'from-rose-600 to-rose-400', roles: ['Executive', 'Head Executive', 'The Boss'] },
        { title: 'Executive Detail', description: 'Manage executives and bank details', link: '/executives', color: 'from-cyan-600 to-cyan-400', roles: ['The Boss', 'Head Executive'] },
        { title: 'Account Transaction', description: 'Record payments', link: '/transactions', color: 'from-orange-500 to-yellow-400', roles: ['Executive', 'Head Executive', 'The Boss'] },
        { title: 'User Creation', description: 'Create and manage system users', link: '/users', color: 'from-red-600 to-red-400', roles: ['The Boss'] },
        { title: 'Customer Entry Modify', description: 'Update and view customer details', link: '/customer-status', color: 'from-emerald-600 to-emerald-400', roles: ['Executive', 'Head Executive', 'The Boss'] },
        { title: 'Party Ledger', description: 'View transaction history', link: '/party-ledger', color: 'from-amber-600 to-amber-400', roles: ['Executive', 'Head Executive', 'The Boss'] },
        { title: 'JV Entry', description: 'manage journal vouchers', link: '/jv-entry', color: 'from-teal-600 to-teal-400', roles: ['Executive', 'Head Executive', 'The Boss'] },
      ]
    },
    {
      title: 'REPORT',
      cards: [
        { title: 'Cash Book', description: 'Daily receipts & payments', link: '/report/cash-book', color: 'from-orange-600 to-orange-400', roles: ['The Boss', 'Head Executive'] },
        { title: 'Customer Statement', description: 'Project & status wise summary', link: '/report/customer-statement', color: 'from-sky-700 to-sky-500', roles: ['The Boss', 'Head Executive'] },
        { title: 'Sales Report', description: 'Detailed sales analytics', link: '/report/sales', color: 'from-rose-700 to-rose-500', roles: ['The Boss', 'Head Executive'] },
        { title: 'Direct Statement', description: 'Individual customer ledger', link: '/report/direct-statement', color: 'from-blue-700 to-blue-500', roles: ['The Boss', 'Head Executive'] },
        { title: 'Outstanding Report', description: 'Project wise pending dues', link: '/report/outstanding', color: 'from-amber-700 to-amber-500', roles: ['The Boss', 'Head Executive'] },
        { title: 'Customer Dues', description: 'EMI & payment tracking', link: '/report/dues', color: 'from-indigo-700 to-indigo-500', roles: ['The Boss', 'Head Executive'] },
        { title: 'Daily Collection', description: 'Detailed partner collection register', link: '/report/daily-collection', color: 'from-emerald-700 to-emerald-500', roles: ['The Boss', 'Head Executive'] },
      ]
    }
  ];

  const filteredSections = sections.map(section => ({
    ...section,
    cards: section.cards.filter(card => card.roles.includes(user?.role))
  })).filter(section => section.cards.length > 0);

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#1B315A] to-[#2a4a85] p-10 rounded-3xl shadow-2xl text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#F38C32]/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
            <div className="relative z-10">
                <h1 className="text-4xl font-black tracking-tighter">Welcome back, {user?.name}!</h1>
                <p className="text-[#F38C32] text-xs font-black uppercase tracking-[0.4em] mt-2">Dange Associates Enterprise Protocol | {user?.role}</p>
            </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Box 1: Project Summary */}
            <div className="group relative bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl">
                <div className="bg-[#1B315A] px-8 py-5 text-white font-black text-[12px] uppercase tracking-[0.4em] flex justify-between items-center">
                    <span className="flex items-center gap-3"><span>📂</span> Project Summary</span>
                    <span className="text-[8px] bg-white/10 px-2 py-1 rounded text-orange-400 font-bold">Live Matrix</span>
                </div>
                <div className="p-8 bg-slate-50/50 flex-1">
                    <div className="overflow-x-auto text-[13px] uppercase font-black text-slate-500 tracking-tighter">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-4 text-left">Strategic Venture</th>
                                    <th className="pb-4 text-right">Gross Sales</th>
                                    <th className="pb-4 text-right">Inflow</th>
                                    <th className="pb-4 text-right">Delta (Bal)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {summaries.project.map((p, i) => (
                                    <tr key={i} className="group/row cursor-pointer hover:bg-white transition-colors" onClick={() => navigate(`/report/outstanding?projectId=${p._id}`)}>
                                        <td className="py-4 text-slate-800 group-hover/row:text-[#F38C32] transition-colors">{p.projectName}</td>
                                        <td className="py-4 text-right font-mono">₹{p.totalSale.toLocaleString()}</td>
                                        <td className="py-4 text-right font-mono text-emerald-600">₹{p.totalReceived.toLocaleString()}</td>
                                        <td className="py-4 text-right font-mono text-rose-500 italic">₹{p.balance.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-[#1B315A] text-slate-900">
                                    <td className="pt-4 font-black">Consolidated Metrics :</td>
                                    <td className="pt-4 text-right font-mono">₹{summaries.project.reduce((acc, p) => acc + p.totalSale, 0).toLocaleString()}</td>
                                    <td className="pt-4 text-right font-mono">₹{summaries.project.reduce((acc, p) => acc + p.totalReceived, 0).toLocaleString()}</td>
                                    <td className="pt-4 text-right font-mono text-rose-600">₹{summaries.project.reduce((acc, p) => acc + p.balance, 0).toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>

            {/* Box 2: Sales Position */}
            <div className="group relative bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl">
                <div className="bg-[#1B315A] px-8 py-5 text-white font-black text-[12px] uppercase tracking-[0.4em] flex justify-between items-center">
                    <span className="flex items-center gap-3"><span>💹</span> Sales Position</span>
                    <span className="text-[8px] bg-white/10 px-2 py-1 rounded text-orange-400 font-bold">Market Sync</span>
                </div>
                <div className="p-8 bg-slate-50/50 flex-1">
                    <div className="overflow-x-auto text-[13px] uppercase font-black text-slate-500 tracking-tighter">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-4 text-left">Project Entity</th>
                                    <th className="pb-4 text-center">Units</th>
                                    <th className="pb-4 text-center">Agree.</th>
                                    <th className="pb-4 text-center">Book.</th>
                                    <th className="pb-4 text-center">Liquidity (BAL)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {summaries.sales.map((s, i) => (
                                    <tr key={i} className="group/row cursor-pointer hover:bg-white transition-colors" onClick={() => navigate(`/report/sales-position/${s._id}?name=${s.projectName}`)}>
                                        <td className="py-4 text-slate-800 group-hover/row:text-[#F38C32] transition-colors">{s.projectName}</td>
                                        <td className="py-4 text-center font-mono">{s.totalPlots}</td>
                                        <td className="py-4 text-center font-mono text-emerald-600">{s.sold}</td>
                                        <td className="py-4 text-center font-mono text-blue-500">{s.booked}</td>
                                        <td className="py-4 text-center font-mono text-rose-500">{s.available}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Box 3: Liquid Assets */}
            <div className="group relative bg-[#1B315A] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col transition-all duration-500 shadow-blue-900/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#F38C32]/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="px-8 py-5 text-white font-black text-[12px] uppercase tracking-[0.4em] flex justify-between items-center border-b border-white/5 relative z-10">
                    <span className="flex items-center gap-3"><span>💎</span> Liquid Assets</span>
                    <span className="text-[8px] bg-white/10 px-2 py-1 rounded text-[#F38C32] font-black">Vault Secure</span>
                </div>
                <div className="p-10 space-y-6 relative z-10">
                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Cash In Registry</p>
                            <p className="text-3xl font-black text-white tracking-tighter italic uppercase">Consolidated</p>
                        </div>
                        <p className="text-4xl font-black text-emerald-400 font-mono italic tracking-tighter">₹{summaries.cashBank.cash.toLocaleString()}</p>
                    </div>
                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 flex justify-between items-center hover:bg-white/10 transition-colors">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Bank Clearing</p>
                            <p className="text-3xl font-black text-white tracking-tighter italic uppercase">Asset Liquid</p>
                        </div>
                        <p className="text-4xl font-black text-[#F38C32] font-mono italic tracking-tighter">₹{summaries.cashBank.bank.toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Box 4: Project Receipts & Payments */}
            <div className="group relative bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col transition-all duration-500 hover:shadow-2xl">
                <div className="bg-[#1B315A] px-8 py-5 text-white font-black text-[12px] uppercase tracking-[0.4em] flex justify-between items-center">
                    <span className="flex items-center gap-3"><span>🔄</span> Receipts & Disbursements</span>
                    <span className="text-[8px] bg-white/10 px-2 py-1 rounded text-orange-400 font-bold">Delta Sync</span>
                </div>
                <div className="p-8 bg-slate-50/50 flex-1">
                    <div className="overflow-x-auto text-[13px] uppercase font-black text-slate-500 tracking-tighter">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="pb-4 text-left">Venture Profile</th>
                                    <th className="pb-4 text-right">Inflow (Rec)</th>
                                    <th className="pb-4 text-right">Outflow (Pay)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {summaries.rp.map((r, i) => (
                                    <tr key={i} className="group/row cursor-pointer hover:bg-white transition-colors" onClick={() => navigate('/report/cash-book')}>
                                        <td className="py-4 text-slate-800 group-hover/row:text-[#F38C32] transition-colors uppercase italic">{r.projectName}</td>
                                        <td className="py-4 text-right font-mono text-emerald-600 italic">₹{r.totalReceipt.toLocaleString()}</td>
                                        <td className="py-4 text-right font-mono text-rose-500 italic">₹{r.totalPayment.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2 border-[#1B315A] text-slate-900">
                                    <td className="pt-4 font-black">Aggregate Flow :</td>
                                    <td className="pt-4 text-right font-mono text-emerald-600">₹{summaries.rp.reduce((acc, r) => acc + r.totalReceipt, 0).toLocaleString()}</td>
                                    <td className="pt-4 text-right font-mono text-rose-600">₹{summaries.rp.reduce((acc, r) => acc + r.totalPayment, 0).toLocaleString()}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>

        {/* Module Cards */}
        <div className="space-y-12">
          {filteredSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-6">
              <div className="flex items-center gap-4">
                <h2 className="text-[11px] font-black text-[#1B315A] uppercase tracking-[0.3em] whitespace-nowrap">{section.title}</h2>
                <div className="h-px bg-slate-200 w-full"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {section.cards.map((card, index) => (
                  <Link
                    key={index}
                    to={card.link}
                    className="group relative overflow-hidden p-6 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                  >
                    <div className={`absolute top-0 right-0 -mr-4 -mt-4 w-20 h-20 bg-gradient-to-br ${card.color} opacity-5 rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-500`}></div>
                    
                    <div className="relative z-10">
                        <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-2xl mb-4 flex items-center justify-center text-white text-xl shadow-lg shadow-blue-500/10 group-hover:scale-110 transition-transform`}>
                            {index === 0 ? '👤' : index === 1 ? '🏢' : index === 2 ? '💎' : '🛠️'}
                        </div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter mb-1 group-hover:text-[#1B315A] transition-colors">{card.title}</h3>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest line-clamp-1">{card.description}</p>
                    </div>
                    
                    <div className="mt-6 flex justify-between items-center relative z-10 border-t border-slate-50 pt-4">
                        <span className="text-[9px] font-black uppercase tracking-widest text-[#F38C32]">Access Module</span>
                        <span className="text-slate-300 group-hover:text-[#1B315A] group-hover:translate-x-1 transition-all">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
};

export default Dashboard;
