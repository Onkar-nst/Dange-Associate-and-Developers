import React, { useState, useEffect } from 'react';
import { reportAPI } from '../api/services';
import Layout from '../components/Layout';

const CashBook = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dates, setDates] = useState({
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0]
    });

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await reportAPI.getCashBook(dates);
            setData(res.data.data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setDates({ ...dates, [e.target.name]: e.target.value });
    };

    const handlePrint = () => {
        window.print();
    };

    const Label = ({ children }) => <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 mb-2 block">{children}</label>;

    if (loading && data.length === 0) return <Layout><div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Auditing Cash Flow Archive...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-10 animate-fade-in px-4 print:p-0">
                
                {/* Header Filter Bar */}
                <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-blue-900/20 text-white relative overflow-hidden group print:hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-orange-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-10">
                        <div className="flex-1 space-y-2">
                             <h1 className="text-2xl font-black tracking-tighter uppercase flex items-center gap-3">
                                <span>📖</span> Cash Book Daily Audit
                            </h1>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Operator: Admin_Dange <span className="mx-2 text-white/10">|</span> Terminal Active</p>
                        </div>
                        <div className="flex flex-wrap gap-6 items-end">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>📅 Start Cycle</Label>
                                    <input type="date" name="startDate" value={dates.startDate} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 !px-6" />
                                </div>
                                <div>
                                    <Label>📅 End Cycle</Label>
                                    <input type="date" name="endDate" value={dates.endDate} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-3 !px-6" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={fetchReport} className="bg-orange-600 hover:bg-orange-500 text-white px-10 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-orange-500/20 active:scale-95">📡 Sync</button>
                                <button onClick={handlePrint} className="w-12 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-all">🖨️</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="max-w-6xl mx-auto space-y-12 pb-20">
                    {data.length > 0 ? (
                        data.map((day, idx) => (
                            <div key={idx} className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden group hover:shadow-2xl transition-all duration-500">
                                {/* Day Header */}
                                <div className="bg-slate-50 p-8 flex justify-between items-center border-b border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-orange-500/20">🗓️</div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 group-hover:text-slate-500 uppercase tracking-widest">Settlement Date</p>
                                            <h3 className="text-xl font-black uppercase tracking-tighter">
                                                {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
                                            </h3>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-slate-400 group-hover:text-slate-500 uppercase tracking-widest">Daily Closing</p>
                                        <p className="text-2xl font-black text-orange-600 group-hover:text-orange-400">₹{day.closingBalance.toLocaleString('en-IN')}</p>
                                    </div>
                                </div>

                                <div className="p-8 overflow-x-auto">
                                    <table className="modern-table border !border-slate-50">
                                        <thead>
                                            <tr>
                                                <th className="w-40">Entry Key</th>
                                                <th>Particular Details</th>
                                                <th className="text-right">Cash Inflow (+)</th>
                                                <th className="text-right">Cash Outflow (-)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* Opening Balance */}
                                            <tr className="bg-slate-50/50">
                                                <td className="font-bold text-slate-400">Archive B/F</td>
                                                <td className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                                    <span>🏦</span> Opening Statement Balance
                                                </td>
                                                <td className="text-right font-black text-emerald-600">₹{day.openingBalance.toLocaleString('en-IN')}</td>
                                                <td className="text-right font-black text-slate-200">₹0</td>
                                            </tr>

                                            {/* Transactions */}
                                            {day.items.map((item, iIdx) => (
                                                <tr key={iIdx} className="group hover:bg-orange-50/20 transition-colors border-b border-slate-100/50">
                                                    <td>
                                                        <div className="font-black text-slate-800 uppercase text-[10px] tracking-widest">
                                                            {item.referenceType === 'other' ? 'JV' : 'CD'}-SYNC-{item._id.toString().slice(-4).toUpperCase()}
                                                        </div>
                                                        <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Audit Code:Verified</div>
                                                    </td>
                                                    <td>
                                                        <div className="font-black text-slate-900 uppercase tracking-tight leading-tight">{item.description}</div>
                                                        <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">Automated System Posting</div>
                                                    </td>
                                                    <td className={`text-right font-black text-base ${item.debit > 0 ? 'text-emerald-600 bg-emerald-50/10' : 'text-slate-200'}`}>
                                                        {item.debit > 0 ? `₹${item.debit.toLocaleString('en-IN')}` : '₹0'}
                                                    </td>
                                                    <td className={`text-right font-black text-base ${item.credit > 0 ? 'text-rose-500 bg-rose-50/10' : 'text-slate-200'}`}>
                                                        {item.credit > 0 ? `₹${item.credit.toLocaleString('en-IN')}` : '₹0'}
                                                    </td>
                                                </tr>
                                            ))}

                                            {/* Closing Balance Row */}
                                            <tr className="bg-slate-900 text-white font-black">
                                                <td></td>
                                                <td className="text-right uppercase text-[9px] tracking-widest opacity-50 pr-4 italic">Nett Daily Closing Balance ➔</td>
                                                <td className="text-right font-black text-slate-600 tracking-widest opacity-20">₹0</td>
                                                <td className="text-right font-black text-orange-400 py-6">₹{day.closingBalance.toLocaleString('en-IN')}</td>
                                            </tr>
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-slate-50 border-t border-slate-100">
                                                <td colSpan="2" className="py-6 text-right uppercase text-[10px] font-black text-slate-400 pr-4">Nett Daily Aggregate Flow:</td>
                                                <td className="text-right py-6 font-black text-emerald-900">₹{(day.openingBalance + day.totalReceipt).toLocaleString('en-IN')}</td>
                                                <td className="text-right py-6 font-black text-rose-900 font-mono">₹{(day.closingBalance + day.totalPayment).toLocaleString('en-IN')}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-[3rem] border border-dashed border-slate-200 animate-fade-in group hover:bg-slate-50 transition-colors">
                            <div className="text-6xl mb-6 grayscale group-hover:grayscale-0 transition-all duration-500">📂</div>
                            <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Audit Trail Locked / Select Date Cycle</p>
                        </div>
                    )}
                </div>

                {/* Final Summary Card */}
                {data.length > 0 && (
                    <div className="pb-20 flex justify-center">
                        <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl shadow-blue-900/10 border border-white/5 w-full max-w-4xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                            <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-12 text-blue-400 text-center flex items-center justify-center gap-4">
                                <span>🧬</span> Period Audit Convergence
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                                <div className="text-center space-y-2">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Receipts</p>
                                    <p className="text-3xl font-black text-emerald-400">₹{data.reduce((acc, d) => acc + d.totalReceipt, 0).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="text-center space-y-2 border-x border-white/5">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Payments</p>
                                    <p className="text-3xl font-black text-rose-500">₹{data.reduce((acc, d) => acc + d.totalPayment, 0).toLocaleString('en-IN')}</p>
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Period Balance</p>
                                    <div className="bg-blue-600 px-6 py-4 rounded-[2rem] shadow-2xl shadow-blue-500/20">
                                        <p className="text-3xl font-black font-mono">₹{(data.reduce((acc, d) => acc + d.totalReceipt, 0) - data.reduce((acc, d) => acc + d.totalPayment, 0)).toLocaleString('en-IN')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    body * { visibility: hidden; background: white !important; }
                    .max-w-7xl, .max-w-7xl * { visibility: visible; }
                    .max-w-7xl { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
                    header, footer, nav, aside, button, .print\\:hidden { display: none !important; }
                    .bg-slate-900 { background: #0f172a !important; color: white !important; -webkit-print-color-adjust: exact; }
                }
            `}} />
        </Layout>
    );
};

export default CashBook;
