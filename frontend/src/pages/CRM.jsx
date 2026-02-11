import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI, projectAPI } from '../api/services';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const CRM = () => {
    const navigate = useNavigate();
    const [customers, setCustomers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProject, setFilterProject] = useState('ALL');

    const statuses = ['Token', 'Booked', 'Agreement', 'Registered', 'Cancelled'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [custRes, projRes] = await Promise.all([
                customerAPI.getAll(),
                projectAPI.getAll({ active: true })
            ]);
            setCustomers(custRes.data.data || []);
            setProjects(projRes.data.data || []);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch CRM data:', err);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            await customerAPI.update(id, { transactionStatus: newStatus });
            setCustomers(prev => prev.map(c => c._id === id ? { ...c, transactionStatus: newStatus } : c));
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Failed to transition lead stage');
        }
    };

    const filteredCustomers = customers.filter(customer => {
        const matchesProject = filterProject === 'ALL' || customer.projectId?._id === filterProject;
        const matchesSearch = customer.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            customer.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            customer.phone?.includes(searchTerm);
        return matchesProject && matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Syncing Lead Pipeline...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-10 animate-fade-in pb-20 px-4">
                
                {/* Header Strategy */}
                <div className="bg-gradient-to-br from-slate-900 via-[#1B315A] to-slate-900 rounded-[3rem] p-12 shadow-2xl text-white relative overflow-hidden group border border-white/5">
                    <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] -mr-64 -mt-64 group-hover:bg-orange-600/20 transition-all duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-[100px] -ml-32 -mb-32"></div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-8">
                            <button 
                                onClick={() => navigate('/dashboard')}
                                className="w-16 h-16 bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[2rem] flex items-center justify-center text-2xl hover:bg-white hover:text-slate-900 transition-all active:scale-90 group/home shadow-2xl"
                                title="Return to Dashboard"
                            >
                                <span className="group-hover/home:-translate-y-1 transition-transform">🏠</span>
                            </button>
                            <div className="space-y-3">
                                <h1 className="text-5xl font-black tracking-tighter uppercase italic leading-none">
                                    CRM <span className="text-[#F38C32]">Pipeline</span>
                                </h1>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.5em] flex items-center gap-2">
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                                    Real-Time Lifecycle Matrix
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-6">
                            <div className="px-10 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl text-center group-hover:bg-white/10 transition-all border-b-4 border-b-blue-500/50 shadow-xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Outreach</p>
                                <p className="text-4xl font-black text-white leading-none whitespace-nowrap">{filteredCustomers.length} <span className="text-[10px] text-slate-500">LEADS</span></p>
                            </div>
                            <div className="px-10 py-6 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-xl text-center group-hover:bg-white/10 transition-all border-b-4 border-b-emerald-500/50 shadow-xl">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Projected Value</p>
                                <p className="text-4xl font-black text-emerald-400 leading-none">
                                    ₹{(filteredCustomers.reduce((acc, curr) => acc + (curr.dealValue || 0), 0) / 100000).toFixed(1)}L
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Command & Control Bar */}
                <div className="flex flex-col xl:flex-row gap-6">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none">
                            <span className="text-slate-400 group-focus-within:text-blue-500 transition-colors text-xl">🔍</span>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Identify lead by name, phone or identity number..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-8 py-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm outline-none font-black text-[13px] text-slate-900 uppercase tracking-tight focus:ring-[12px] focus:ring-blue-500/5 focus:border-blue-500 transition-all duration-500 placeholder:text-slate-300"
                        />
                    </div>

                    <div className="w-full xl:w-96 relative">
                        <select 
                            value={filterProject}
                            onChange={(e) => setFilterProject(e.target.value)}
                            className="w-full pl-8 pr-12 py-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm outline-none font-black text-[13px] text-slate-900 uppercase tracking-tight appearance-none cursor-pointer focus:border-[#F38C32] transition-all duration-500"
                        >
                            <option value="ALL">ALL VENTURES / PROJECTS</option>
                            {projects.map(p => (
                                <option key={p._id} value={p._id}>{p.projectName}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-8 flex items-center pointer-events-none text-slate-400">
                            ▼
                        </div>
                    </div>

                    <button 
                        onClick={() => navigate('/customers?add=true')}
                        className="px-12 py-6 bg-[#F38C32] text-white rounded-[2.5rem] font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl shadow-orange-500/30 hover:bg-[#1B315A] hover:scale-105 active:scale-95 transition-all duration-500"
                    >
                        + DEPLOY NEW LEAD
                    </button>
                </div>

                {/* Pipeline Visualizer */}
                <div className="overflow-x-auto pb-12 scrollbar-hide -mx-4 px-4">
                    <div className="flex gap-8 min-w-[1400px]">
                        {statuses.map((status) => (
                            <div key={status} className="w-80 flex-shrink-0 flex flex-col gap-6">
                                {/* Status Pillar Header */}
                                <div className="flex items-center justify-between px-8 py-5 bg-slate-900 rounded-[2rem] text-white shadow-xl group/pillar relative overflow-hidden">
                                    <div className={`absolute top-0 left-0 h-full w-1 ${status === 'Token' ? 'bg-orange-400' : status === 'Booked' ? 'bg-blue-400' : status === 'Agreement' ? 'bg-indigo-400' : status === 'Registered' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                    <span className="text-[11px] font-black uppercase tracking-[0.3em] font-jakarta italic">{status}</span>
                                    <span className="bg-white/10 px-3 py-1 rounded-xl text-[11px] font-black border border-white/5">
                                        {filteredCustomers.filter(c => (c.transactionStatus || 'Token') === status).length}
                                    </span>
                                </div>

                                {/* Status Pillar Cards */}
                                <div className="flex-1 space-y-6 min-h-[500px] p-2 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                                    {filteredCustomers
                                        .filter(c => (c.transactionStatus || 'Token') === status)
                                        .map((customer) => (
                                            <div 
                                                key={customer._id}
                                                onClick={() => navigate(`/customers/${customer._id}`)}
                                                className="group bg-white rounded-[2.5rem] p-7 border border-slate-100 shadow-sm hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 cursor-pointer relative overflow-hidden"
                                            >
                                                <div className={`absolute top-0 right-0 w-2 h-full ${status === 'Token' ? 'bg-orange-400' : status === 'Booked' ? 'bg-blue-400' : status === 'Agreement' ? 'bg-indigo-400' : status === 'Registered' ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                                                
                                                <div className="space-y-5">
                                                    <div>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">ID: CP-{customer._id.slice(-4).toUpperCase()}</p>
                                                            <div className="flex gap-0.5">
                                                                {statuses.map((s, idx) => (
                                                                    <div 
                                                                        key={idx} 
                                                                        className={`w-4 h-1 rounded-full ${statuses.indexOf(customer.transactionStatus || 'Token') >= idx ? (status === 'Registered' ? 'bg-emerald-500' : 'bg-blue-500') : 'bg-slate-100'}`}
                                                                    ></div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-tight group-hover:text-blue-600 transition-colors">
                                                            {customer.firstName} {customer.lastName}
                                                        </h3>
                                                    </div>

                                                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl group-hover:bg-blue-50/30 transition-colors">
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs grayscale group-hover:grayscale-0 transition-all">🏢</span>
                                                            <span className="text-[10px] font-black text-slate-600 uppercase italic truncate">{customer.projectId?.projectName || 'No Project'}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs grayscale group-hover:grayscale-0 transition-all">⛳</span>
                                                                <span className="text-[10px] font-black text-slate-500 uppercase">P-{customer.plotId?.plotNumber || 'NA'}</span>
                                                            </div>
                                                            <p className="text-[10px] font-black text-blue-500 tracking-tighter">{customer.phone}</p>
                                                        </div>
                                                    </div>

                                                    <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                                        <div className="flex gap-2">
                                                            {statuses.indexOf(status) > 0 && (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const prevStatus = statuses[statuses.indexOf(status) - 1];
                                                                        handleStatusUpdate(customer._id, prevStatus);
                                                                    }}
                                                                    className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"
                                                                >
                                                                    ←
                                                                </button>
                                                            )}
                                                            {statuses.indexOf(status) < statuses.length - 1 && (
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const nextStatus = statuses[statuses.indexOf(status) + 1];
                                                                        handleStatusUpdate(customer._id, nextStatus);
                                                                    }}
                                                                    className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-90"
                                                                >
                                                                    →
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Investment</p>
                                                            <p className="text-sm font-black text-slate-900 tracking-tighter">₹{(customer.dealValue || 0).toLocaleString('en-IN')}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    
                                    {filteredCustomers.filter(c => (c.transactionStatus || 'Token') === status).length === 0 && (
                                        <div className="h-64 flex flex-col items-center justify-center opacity-20 grayscale scale-90">
                                            <div className="text-4xl mb-4">📭</div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Empty Sector</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Performance Footprint Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-blue-400 italic">Conversion Velocity</h4>
                                <span className="text-2xl">⚡</span>
                            </div>
                            <div>
                                <p className="text-5xl font-black italic tracking-tighter">
                                    {((filteredCustomers.filter(c => c.transactionStatus === 'Registered').length / (filteredCustomers.length || 1)) * 100).toFixed(1)}%
                                </p>
                                <div className="w-full h-2 bg-white/10 rounded-full mt-6 overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000" 
                                        style={{ width: `${(filteredCustomers.filter(c => c.transactionStatus === 'Registered').length / (filteredCustomers.length || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-emerald-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-emerald-100 italic">Successful Registry</h4>
                                <span className="text-2xl">🏆</span>
                            </div>
                            <div>
                                <p className="text-5xl font-black italic tracking-tighter">
                                    {filteredCustomers.filter(c => c.transactionStatus === 'Registered').length} <span className="text-lg font-bold opacity-60">UNITS</span>
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-widest mt-4 text-emerald-100">Capital Safeguarded effectively</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1B315A] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-white/5">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#F38C32]/10 rounded-full blur-[80px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[11px] font-black uppercase tracking-[0.4em] text-orange-400 italic">Nett Deal Flow</h4>
                                <span className="text-2xl">💰</span>
                            </div>
                            <div>
                                <p className="text-5xl font-black italic tracking-tighter">
                                    ₹{(filteredCustomers.reduce((acc, curr) => acc + (curr.dealValue || 0), 0) / 100000).toFixed(1)}L
                                </p>
                                <p className="text-[10px] font-bold uppercase tracking-widest mt-4 text-slate-400">Aggregated Pipeline Valuation</p>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
    );
};

export default CRM;
