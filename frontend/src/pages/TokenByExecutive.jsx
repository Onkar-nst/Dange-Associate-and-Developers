import React, { useState, useEffect } from 'react';
import { reportAPI, projectAPI, userAPI } from '../api/services';

const TokenByExecutive = () => {
    const [data, setData] = useState([]);
    const [totalTokens, setTotalTokens] = useState(0);
    const [projects, setProjects] = useState([]);
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        projectId: '',
        executiveId: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => { fetchInitial(); }, []);

    const fetchInitial = async () => {
        try {
            const [pRes, eRes] = await Promise.all([projectAPI.getAll(), userAPI.getList()]);
            setProjects(pRes.data.data || []);
            setExecutives((eRes.data.data || []).filter(u => ['Executive', 'Head Executive'].includes(u.role)));
        } catch (err) { console.error(err); }
    };

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await reportAPI.getTokenByExecutive(filters);
            setData(res.data.data || []);
            setTotalTokens(res.data.totalTokens || 0);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB') : 'N/A';

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
                        <span>🎟️</span> Customers Token by Executive
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Token customers grouped by assigned executive</p>
                </div>
                {totalTokens > 0 && (
                    <div className="bg-amber-50 border border-amber-200 px-6 py-3 rounded-2xl">
                        <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">Total Tokens</p>
                        <p className="text-2xl font-black text-amber-800">{totalTokens}</p>
                    </div>
                )}
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-blue-900/10 text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-5 gap-6 items-end">
                    <div>
                        <Label icon="🏢">Project</Label>
                        <select name="projectId" value={filters.projectId} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[11px] uppercase">
                            <option value="" className="text-slate-800">ALL PROJECTS</option>
                            {projects.map(p => <option key={p._id} value={p._id} className="text-slate-800">{p.projectName}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label icon="👔">Executive</Label>
                        <select name="executiveId" value={filters.executiveId} onChange={handleChange} className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[11px] uppercase">
                            <option value="" className="text-slate-800">ALL EXECUTIVES</option>
                            {executives.map(e => <option key={e._id} value={e._id} className="text-slate-800">{e.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <Label icon="📅">Start Date</Label>
                        <input type="date" name="startDate" value={filters.startDate} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none font-black text-xs text-white" />
                    </div>
                    <div>
                        <Label icon="📅">End Date</Label>
                        <input type="date" name="endDate" value={filters.endDate} onChange={handleChange} className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl outline-none font-black text-xs text-white" />
                    </div>
                    <button onClick={fetchReport} className="btn-primary w-full !py-4 rounded-[2rem] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 text-[11px] font-black flex items-center justify-center gap-3">
                        🎟️ Fetch Tokens
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
                            <div className="flex gap-4">
                                <span className="text-[9px] bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg font-black uppercase">{group.customers.length} Tokens</span>
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-lg font-black uppercase">₹{group.totalTokenValue?.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="modern-table border !border-slate-50">
                                <thead>
                                    <tr>
                                        <th className="w-12">#</th>
                                        <th>Customer</th>
                                        <th>Phone</th>
                                        <th>Project</th>
                                        <th className="text-center">Plot No.</th>
                                        <th className="text-right">Deal Value</th>
                                        <th className="text-right">Paid</th>
                                        <th className="text-right">Balance</th>
                                        <th className="text-center">Booking Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.customers.map((c, i) => (
                                        <tr key={i} className="hover:bg-amber-50/30 transition-colors border-b border-slate-50">
                                            <td className="text-center font-bold text-slate-300">{i + 1}</td>
                                            <td className="font-black text-slate-800 uppercase tracking-tight text-[11px]">{c.name}</td>
                                            <td className="text-slate-500 font-mono text-[11px]">{c.phone}</td>
                                            <td className="text-[10px] font-black text-slate-600 uppercase">{c.project}</td>
                                            <td className="text-center font-black">{c.plotNo}</td>
                                            <td className="text-right font-black text-slate-800">₹{c.dealValue?.toLocaleString('en-IN')}</td>
                                            <td className="text-right font-black text-emerald-600">₹{c.paidAmount?.toLocaleString('en-IN')}</td>
                                            <td className="text-right font-black text-rose-600">₹{c.balanceAmount?.toLocaleString('en-IN')}</td>
                                            <td className="text-center text-[10px] font-bold text-blue-600">{formatDate(c.bookingDate)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
                {data.length === 0 && (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 py-40 text-center">
                        <div className="text-6xl mb-6 grayscale opacity-10">🎟️</div>
                        <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Token Registry Empty — Select Filters & Generate</p>
                    </div>
                )}
            </div>

            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">Dange Associates Token Analytics © 2026</p>
        </div>
    );
};

export default TokenByExecutive;
