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

    if (loading && data.length === 0) return <div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Auditing Cash Flow Archive...</div>;

    return (
        <>
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

                <div className="max-w-7xl mx-auto space-y-6 pb-20">
                    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-[12px]">
                                <thead>
                                    <tr className="bg-slate-900 text-white font-black uppercase tracking-tighter">
                                        <th className="p-4 text-left w-32 border-r border-slate-700">Date</th>
                                        <th className="p-4 text-left w-40 border-r border-slate-700">Ref / Type</th>
                                        <th className="p-4 text-left border-r border-slate-700">Particulars</th>
                                        <th className="p-4 text-right w-36 border-r border-slate-700">Receipt (+)</th>
                                        <th className="p-4 text-right w-36 border-r border-slate-700">Payment (-)</th>
                                        <th className="p-4 text-right w-40">Running Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.length > 0 ? (
                                        data.map((day, dIdx) => (
                                            <React.Fragment key={dIdx}>
                                                {/* Daily Opening Header */}
                                                <tr className="bg-slate-50 border-y border-slate-200">
                                                    <td className="p-3 font-black text-slate-900 bg-orange-50 border-r border-slate-200">
                                                        {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                                    </td>
                                                    <td colSpan="2" className="p-3 font-bold text-slate-500 uppercase italic border-r border-slate-200">
                                                        <span>🏦</span> Opening Balance B/F
                                                    </td>
                                                    <td className="p-3 text-right font-black text-slate-400 border-r border-slate-200">-</td>
                                                    <td className="p-3 text-right font-black text-slate-400 border-r border-slate-200">-</td>
                                                    <td className="p-3 text-right font-black text-blue-600 bg-blue-50/30">
                                                        ₹{day.openingBalance.toLocaleString('en-IN')}
                                                    </td>
                                                </tr>

                                                {/* Transactions for the day */}
                                                {day.items.map((item, iIdx) => {
                                                    const isReceipt = item.debit > 0;
                                                    return (
                                                        <tr key={iIdx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                                                            <td className="p-3 border-r border-slate-100"></td>
                                                            <td className="p-3 border-r border-slate-100">
                                                                <div className="font-black text-slate-400 uppercase text-[9px]">
                                                                    {item.referenceType === 'other' ? 'JV' : 'CD'}-SYNC-{item._id.toString().slice(-4).toUpperCase()}
                                                                </div>
                                                            </td>
                                                            <td className="p-3 border-r border-slate-100">
                                                                <div className="font-black text-slate-800 uppercase tracking-tight">{item.description}</div>
                                                                <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">Automated Asset Posting</div>
                                                            </td>
                                                            <td className={`p-3 text-right font-black border-r border-slate-100 ${isReceipt ? 'text-emerald-600 bg-emerald-50/20' : 'text-slate-200'}`}>
                                                                {isReceipt ? `₹${item.debit.toLocaleString('en-IN')}` : '-'}
                                                            </td>
                                                            <td className={`p-3 text-right font-black border-r border-slate-100 ${!isReceipt ? 'text-rose-500 bg-rose-50/20' : 'text-slate-200'}`}>
                                                                {!isReceipt ? `₹${item.credit.toLocaleString('en-IN')}` : '-'}
                                                            </td>
                                                            <td className="p-3 text-right font-bold text-slate-400 italic">
                                                                {/* Optional: Add per-row running balance if needed */}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}

                                                {/* Daily Closing Footer */}
                                                <tr className="bg-slate-900 text-white font-black border-b-4 border-white">
                                                    <td className="p-4 border-r border-slate-800"></td>
                                                    <td colSpan="2" className="p-4 text-right uppercase tracking-[0.2em] text-[9px] text-orange-400 pr-6 italic">
                                                        Nett Closing on {new Date(day.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} ➔
                                                    </td>
                                                    <td className="p-4 text-right text-emerald-400 bg-emerald-900/20 border-r border-slate-800">
                                                        ₹{day.totalReceipt.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="p-4 text-right text-rose-400 bg-rose-900/20 border-r border-slate-800">
                                                        ₹{day.totalPayment.toLocaleString('en-IN')}
                                                    </td>
                                                    <td className="p-4 text-right text-xl font-mono tracking-tighter text-orange-500">
                                                        ₹{day.closingBalance.toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="py-20 text-center">
                                                <div className="text-4xl mb-4 grayscale">📂</div>
                                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Audit Trail Locked / Select Date Cycle</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Final Summary Card */}
                {data.length > 0 && (
                    <div className="pb-20 flex justify-center">
                        <div className="bg-slate-900 rounded-[3rem] p-12 text-white shadow-2xl shadow-blue-900/10 border border-white/5 w-full max-w-5xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                            <h3 className="text-xs font-black uppercase tracking-[0.4em] mb-12 text-blue-400 text-center flex items-center justify-center gap-4">
                                <span>🧬</span> Master Fiscal Audit Summary
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
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nett Cash Delta</p>
                                    <div className="bg-orange-600 px-6 py-4 rounded-[2rem] shadow-2xl shadow-orange-500/20">
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
        </>
    );
};

export default CashBook;
