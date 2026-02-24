import React, { useState, useEffect } from 'react';
import { reportAPI, userAPI } from '../api/services';

const UserDailyCollection = () => {
    const [data, setData] = useState([]);
    const [grandTotal, setGrandTotal] = useState(0);
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        date: new Date().toISOString().split('T')[0],
        executiveId: ''
    });

    useEffect(() => { fetchInitial(); }, []);

    const fetchInitial = async () => {
        try {
            const res = await userAPI.getList();
            setExecutives((res.data.data || []).filter(u => ['Executive', 'Head Executive'].includes(u.role)));
        } catch (err) { console.error(err); }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await reportAPI.getUserDailyCollection(filters);
            setData(res.data.data || []);
            setGrandTotal(res.data.grandTotal || 0);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
    const formatTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'N/A';

    const Label = ({ children, icon }) => (
        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-2">
            <span>{icon}</span> {children}
        </label>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 animate-fade-in px-4 pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-3">
                        <span>👤</span> User Daily Collection
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        Executive-wise collection for {new Date(filters.date).toLocaleDateString('en-GB')}
                    </p>
                </div>
                {grandTotal > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 px-6 py-3 rounded-2xl">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Grand Total</p>
                        <p className="text-2xl font-black text-emerald-700">₹{grandTotal.toLocaleString('en-IN')}</p>
                    </div>
                )}
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
                    <div>
                        <Label icon="📅">Date</Label>
                        <input type="date" name="date" value={filters.date} onChange={handleChange}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none font-black text-xs text-white" />
                    </div>
                    <div>
                        <Label icon="👔">Executive</Label>
                        <select name="executiveId" value={filters.executiveId} onChange={handleChange}
                            className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[11px] uppercase">
                            <option value="" className="text-slate-800">ALL EXECUTIVES</option>
                            {executives.map(e => <option key={e._id} value={e._id} className="text-slate-800">{e.name}</option>)}
                        </select>
                    </div>
                    <button onClick={fetchReport}
                        className="btn-primary w-full !py-4 rounded-[2rem] uppercase tracking-widest shadow-xl active:scale-95 text-[11px] font-black flex items-center justify-center gap-3">
                        📡 Fetch Collections
                    </button>
                </div>
            </div>

            <div className="space-y-8">
                {data.map((group, gIdx) => (
                    <div key={gIdx} className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="bg-slate-900 px-8 py-5 flex justify-between items-center">
                            <span className="text-white font-black text-[12px] uppercase tracking-[0.3em] flex items-center gap-3">
                                <span>👔</span> {group.executiveName}
                            </span>
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg font-black uppercase">
                                ₹{group.totalAmount?.toLocaleString('en-IN')}
                            </span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="modern-table border !border-slate-50">
                                <thead><tr>
                                    <th className="w-12">#</th><th>Customer</th><th>Phone</th>
                                    <th>Project</th><th className="text-right">Amount</th>
                                    <th className="text-center">Mode</th><th className="text-center">Receipt</th>
                                    <th className="text-center">Time</th>
                                </tr></thead>
                                <tbody>
                                    {group.collections.map((c, i) => (
                                        <tr key={i} className="hover:bg-emerald-50/30 transition-colors border-b border-slate-50">
                                            <td className="text-center font-bold text-slate-300">{i + 1}</td>
                                            <td className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{c.customerName}</td>
                                            <td className="text-slate-500 font-mono text-[11px]">{c.phone}</td>
                                            <td className="text-[10px] font-black text-slate-600 uppercase">{c.project}</td>
                                            <td className="text-right font-black text-emerald-600">₹{c.amount?.toLocaleString('en-IN')}</td>
                                            <td className="text-center"><span className="text-[9px] font-black uppercase text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{c.paymentMode}</span></td>
                                            <td className="text-center text-[10px] font-bold text-slate-500">{c.receiptNo}</td>
                                            <td className="text-center text-[10px] font-bold text-slate-400">{formatTime(c.time)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
                {data.length === 0 && (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 py-40 text-center">
                        <div className="text-6xl mb-6 grayscale opacity-10">👤</div>
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">No Collections Found — Select Date & Generate</p>
                    </div>
                )}
            </div>

            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">Dange Associates User Collection Audit © 2026</p>
        </div>
    );
};

export default UserDailyCollection;
