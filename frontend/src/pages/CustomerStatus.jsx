import React, { useState, useEffect } from 'react';
import { customerAPI, projectAPI, userAPI, uploadAPI } from '../api/services';
import Layout from '../components/Layout';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:3000';

const CustomerStatus = () => {
    const [customers, setCustomers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeDocNaming, setActiveDocNaming] = useState({ customerId: null, name: '' });
    
    // Filters
    const [filterCustomer, setFilterCustomer] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [filterType, setFilterType] = useState('First Name');

    // Report Modal
    const [showReportModal, setShowReportModal] = useState(false);

    // Advanced Edit Modal (Edit Exec)
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [modalExecs, setModalExecs] = useState([]); 
    const [selectedExecToAdd, setSelectedExecToAdd] = useState('');
    const [customerRate, setCustomerRate] = useState(0);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [custRes, projRes, execRes] = await Promise.all([
                customerAPI.getAll(),
                projectAPI.getAll({ active: true }),
                userAPI.getList()
            ]);
            setCustomers(custRes.data.data || []);
            setProjects(projRes.data.data || []);
            setExecutives((execRes.data.data || []).filter(u => ['Executive', 'Head Executive', 'The Boss'].includes(u.role)));
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch data matrix');
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params = {};
            if (filterProject) params.projectId = filterProject;
            const res = await customerAPI.getAll(params);
            let filtered = res.data.data || [];
            
            if (filterCustomer) {
                const searchLower = filterCustomer.toLowerCase();
                filtered = filtered.filter(c => {
                    if (filterType === 'First Name') return c.firstName?.toLowerCase().includes(searchLower) || c.name?.toLowerCase().includes(searchLower);
                    if (filterType === 'Last Name') return c.lastName?.toLowerCase().includes(searchLower);
                    if (filterType === 'Phone') return c.phone?.includes(searchLower);
                    return c.name?.toLowerCase().includes(searchLower);
                });
            }
            setCustomers(filtered);
            setLoading(false);
        } catch (err) {
            setError('Search protocol failed');
            setLoading(false);
        }
    };

    const openEditModal = (customer) => {
        setEditingCustomer(customer);
        setModalExecs(customer.assignedExecutives || []);
        setCustomerRate(customer.rate || 0);
        setShowEditModal(true);
    };

    const handleAddExecToModal = () => {
        if (!selectedExecToAdd) return;
        const exists = modalExecs.find(e => e.executiveId?._id === selectedExecToAdd || e.executiveId === selectedExecToAdd);
        if (exists) return;

        const execObj = executives.find(e => e._id === selectedExecToAdd);
        setModalExecs([...modalExecs, { executiveId: execObj, percentage: 0 }]);
        setSelectedExecToAdd('');
    };

    const handleRemoveExecFromModal = (id) => {
        setModalExecs(modalExecs.filter(e => (e.executiveId?._id || e.executiveId) !== id));
    };

    const handlePercentageChange = (id, val) => {
        setModalExecs(modalExecs.map(e => {
            const execId = e.executiveId?._id || e.executiveId;
            if (execId === id) return { ...e, percentage: parseFloat(val) || 0 };
            return e;
        }));
    };

    const handleSaveEditChanges = async () => {
        try {
            const formattedExecs = modalExecs.map(e => ({
                executiveId: e.executiveId?._id || e.executiveId,
                percentage: e.percentage
            }));

            await customerAPI.update(editingCustomer._id, {
                assignedExecutives: formattedExecs,
                rate: customerRate,
                dealValue: customerRate * (editingCustomer.sqFt || 0) 
            });

            setShowEditModal(false);
            fetchInitialData();
        } catch (err) {
            setError('Failed to persist synchronization changes');
        }
    };

    const handleDeleteCustomer = async (id) => {
        if (!window.confirm('Are you sure you want to ARCHIVE this operational data?')) return;
        try {
            await customerAPI.delete(id);
            fetchInitialData();
        } catch (err) {
            setError('Operational deactivation failed');
        }
    };

    const handleExportCSV = () => {
        if (customers.length === 0) {
            setError('Data archive is empty');
            return;
        }
        
        const headers = ["Customer Name", "Phone", "Project", "Plot No", "Status", "Area (SqFt)", "Rate", "Total Deal Value"];
        const rows = customers.map(c => [
            `"${c.name}"`,
            `"${c.phone}"`,
            `"${c.projectId?.projectName || 'NA'}"`,
            `"${c.plotId?.plotNumber || 'NA'}"`,
            `"${c.transactionStatus || 'Token'}"`,
            c.sqFt || 0,
            c.rate || 0,
            (c.sqFt || 0) * (c.rate || 0)
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Dange_Cust_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const stats = {
        total: customers.length,
        registered: customers.filter(c => c.transactionStatus === 'Registered').length,
        pending: customers.filter(c => c.transactionStatus !== 'Registered').length,
        totalSqFt: customers.reduce((acc, curr) => acc + (curr.sqFt || 0), 0)
    };

    const StatCard = ({ label, value, icon, color }) => (
        <div className="group relative bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 opacity-[0.03] transition-transform duration-700 group-hover:scale-150 ${color === 'blue' ? 'bg-blue-600' : color === 'emerald' ? 'bg-emerald-600' : 'bg-slate-900'} rounded-full blur-3xl -mr-16 -mt-16`}></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 shadow-lg ${color === 'blue' ? 'bg-blue-600 shadow-blue-500/20 text-white' : color === 'emerald' ? 'bg-emerald-600 shadow-emerald-500/20 text-white' : 'bg-slate-900 shadow-slate-900/10 text-white'}`}>
                    {icon}
                </div>
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-widest px-2 py-1 bg-slate-50 rounded-lg">Operational</div>
            </div>
            <div className="relative z-10">
                <div className="text-3xl font-black text-slate-800 mb-1 tracking-tighter uppercase">{value}</div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none border-l-2 border-slate-100 pl-3">{label}</div>
            </div>
        </div>
    );

    if (loading) return <Layout><div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Scanning Client Matrix...</div></Layout>;

    const handleStatusChange = async (customerId, newStatus) => {
        try {
            await customerAPI.update(customerId, { transactionStatus: newStatus });
            // Optimistic update or refetch
            setCustomers(customers.map(c => c._id === customerId ? { ...c, transactionStatus: newStatus } : c));
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleFileUpload = async (customerId, docName, file) => {
        if (!file || !docName) return;
        
        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const res = await uploadAPI.upload(formData);
            const filePath = res.data.data;

            const customer = customers.find(c => c._id === customerId);
            const newDoc = { name: docName, path: filePath };
            const updatedDocuments = [...(customer.documents || []), newDoc];

            await customerAPI.update(customerId, { documents: updatedDocuments });
            
            setCustomers(customers.map(c => 
                c._id === customerId 
                ? { ...c, documents: updatedDocuments } 
                : c
            ));
            
            setActiveDocNaming({ customerId: null, name: '' });
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to upload document');
            setLoading(false);
            setActiveDocNaming({ customerId: null, name: '' });
        }
    };

    const handleFileDelete = async (customerId, docPath) => {
        if (!window.confirm(`Are you sure you want to REMOVE this document?`)) return;

        try {
            setLoading(true);
            const customer = customers.find(c => c._id === customerId);
            const updatedDocuments = (customer.documents || []).filter(d => d.path !== docPath);

            await customerAPI.update(customerId, { documents: updatedDocuments });
            
            setCustomers(customers.map(c => 
                c._id === customerId 
                ? { ...c, documents: updatedDocuments } 
                : c
            ));
            
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError('Failed to remove document');
            setLoading(false);
        }
    };

    return (
        <Layout>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 lg:p-10 gap-6">
          <div>
            <h1 className="text-4xl font-black text-slate-900 uppercase italic tracking-tighter flex items-center gap-3">
              <span className="text-blue-600">Client</span> Status Matrix
            </h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
              Operational Oversight • Registry Control
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleExportCSV}
              className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-slate-900/10 hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-3"
            >
              <span>📥</span> Export CSV Log
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-12 pb-20 animate-fade-in px-4">
            
            {/* Filter Control Console */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-8 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150"></div>
               <div className="relative z-10 flex flex-col xl:flex-row gap-6 items-end">
                  
                  {/* Search Engine */}
                  <div className="flex-1 w-full space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Search Registry</label>
                    <div className="flex gap-2">
                      <select 
                        value={filterType} 
                        onChange={(e) => setFilterType(e.target.value)}
                        className="bg-slate-50 border border-slate-100 text-[11px] font-black uppercase tracking-widest rounded-2xl px-4 outline-none focus:border-blue-500 transition-colors"
                      >
                        <option>First Name</option>
                        <option>Last Name</option>
                        <option>Phone</option>
                      </select>
                      <input 
                        type="text" 
                        placeholder="ENTER SEARCH QUERY..." 
                        value={filterCustomer}
                        onChange={(e) => setFilterCustomer(e.target.value)}
                        className="flex-1 h-14 bg-slate-50 border border-slate-100 rounded-2xl px-6 text-sm font-bold placeholder:text-slate-300 outline-none focus:bg-white focus:border-blue-500 transition-all shadow-inner"
                      />
                    </div>
                  </div>

                  {/* Project Intelligence Filter */}
                  <div className="w-full xl:w-80 space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Project Deployment</label>
                    <select 
                      value={filterProject} 
                      onChange={(e) => setFilterProject(e.target.value)}
                      className="w-full h-14 bg-blue-50/50 border border-blue-100 rounded-2xl px-6 text-[11px] font-black text-blue-900 uppercase tracking-widest outline-none focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none cursor-pointer"
                    >
                      <option value="">-- ALL ACTIVE VENTURES --</option>
                      {projects.map(p => (
                        <option key={p._id} value={p._id}>{p.projectName}</option>
                      ))}
                    </select>
                  </div>

                  <button 
                    onClick={handleSearch}
                    className="h-14 px-10 bg-blue-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl shadow-blue-500/20 hover:bg-slate-900 transition-all active:scale-95"
                  >
                    Initiate Search
                  </button>
               </div>
            </div>

                {/* Enterprise Table */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                    <table className="modern-table">
                        <thead>
                            <tr className="bg-slate-50/50">
                                <th className="pl-10 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Client Profile</th>
                                <th className="text-center py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Venture & Log</th>
                                <th className="py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Sales Deployment</th>
                                <th className="py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Fiscal Documents</th>
                                <th className="text-right pr-10 py-4 text-[11px] font-black uppercase tracking-widest text-slate-500">Administration</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c) => (
                                <tr key={c._id} className="group hover:bg-slate-50/50 transition-colors border-b border-slate-50 last:border-none">
                                    <td className="pl-10 py-4">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center font-black text-white text-lg transition-transform group-hover:scale-110 shadow-lg">
                                                {c.name?.[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-black text-slate-800 uppercase tracking-tight text-sm mb-1">{c.name}</div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-black text-slate-400 font-mono tracking-tighter">{c.phone}</span>
                                                    <a href={`https://wa.me/${c.phone}`} target="_blank" className="text-[9px] font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-md transition-all flex items-center gap-1 border border-emerald-100 shadow-sm">
                                                        <span>💬</span> WhatsApp
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="text-center italic py-4">
                                        <div className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1 tracking-tight">{c.projectId?.projectName || 'NA'}</div>
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-[8px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded-lg uppercase tracking-widest border border-slate-200">UNIT: {c.plotId?.plotNumber || 'NA'}</span>
                                            <select 
                                                value={c.transactionStatus || 'Token'} 
                                                onChange={(e) => handleStatusChange(c._id, e.target.value)}
                                                className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest outline-none border transition-all cursor-pointer text-center appearance-none shadow-sm ${
                                                    c.transactionStatus === 'Registered' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                                    c.transactionStatus === 'Agreement' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    c.transactionStatus === 'Booked' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    'bg-slate-50 text-slate-700 border-slate-200'
                                                }`}
                                            >
                                                <option value="Token">Token</option>
                                                <option value="Booked">Booked</option>
                                                <option value="Agreement">Agreement</option>
                                                <option value="Registered">Registered</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex flex-wrap gap-1 max-w-[160px]">
                                                {c.assignedExecutives && c.assignedExecutives.length > 0 ? c.assignedExecutives.map((e, idx) => (
                                                    <span key={idx} className="bg-slate-900 text-white px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tight shadow-sm">{e.executiveId?.name}</span>
                                                )) : <span className="text-[9px] font-black text-slate-300 uppercase italic tracking-widest">Unassigned Personnel</span>}
                                            </div>
                                            <button onClick={() => openEditModal(c)} className="text-[8px] font-black text-blue-600 uppercase tracking-[0.2em] flex items-center gap-2 hover:translate-x-1 transition-transform bg-blue-50/50 w-fit px-2 py-1 rounded-lg border border-blue-100 shadow-sm">
                                                <span>⚙️</span> Sync Executives
                                            </button>
                                        </div>
                                    </td>
                                    <td className="py-4">
                                        <div className="flex flex-col gap-2 min-w-[140px]">
                                            {/* Registered Documents */}
                                            {(c.documents || []).map((doc, idx) => (
                                                <div key={idx} className="flex items-center gap-2 group/doc">
                                                    <a 
                                                        href={`${API_BASE_URL}${doc.path}`} 
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex-1 text-[9px] font-black px-3 py-1.5 rounded-lg transition-all uppercase tracking-widest text-center shadow-sm border bg-slate-900 text-white border-slate-900 hover:bg-emerald-600 hover:border-emerald-600"
                                                    >
                                                        {doc.name}
                                                    </a>
                                                    <button 
                                                        onClick={() => handleFileDelete(c._id, doc.path)}
                                                        className="bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-sm border border-rose-100"
                                                        title="Delete Document"
                                                    >
                                                        <span className="text-[10px]">🗑️</span>
                                                    </button>
                                                </div>
                                            ))}

                                            {/* Add New Document Option */}
                                            {activeDocNaming.customerId === c._id ? (
                                                <div className="flex flex-col gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in slide-in-from-top-1">
                                                    <input 
                                                        autoFocus
                                                        type="text" 
                                                        placeholder="DOC NAME (e.g. Agreement)" 
                                                        className="text-[9px] font-black uppercase tracking-widest px-2 py-1.5 rounded-lg border border-slate-200 outline-none w-full"
                                                        value={activeDocNaming.name}
                                                        onChange={(e) => setActiveDocNaming({...activeDocNaming, name: e.target.value})}
                                                    />
                                                    <div className="flex gap-1">
                                                        <button 
                                                            onClick={() => setActiveDocNaming({ customerId: null, name: '' })}
                                                            className="flex-1 py-1 text-[8px] font-black uppercase text-slate-400 hover:bg-slate-100 rounded"
                                                        >
                                                            Cancel
                                                        </button>
                                                        <label className={`flex-1 flex items-center justify-center py-1 text-[8px] font-black uppercase rounded cursor-pointer transition-all ${activeDocNaming.name ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400 pointer-events-none'}`}>
                                                            <span>Upload</span>
                                                            <input 
                                                                type="file" 
                                                                className="hidden" 
                                                                accept=".pdf,.jpg,.jpeg,.png"
                                                                onChange={(e) => handleFileUpload(c._id, activeDocNaming.name, e.target.files[0])}
                                                            />
                                                        </label>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => {
                                                        const hasAgreement = c.documents?.some(d => d.name.toLowerCase().includes('agreement'));
                                                        setActiveDocNaming({ customerId: c._id, name: hasAgreement ? '' : 'Agreement' });
                                                    }}
                                                    className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all font-black text-[9px] uppercase tracking-widest group"
                                                >
                                                    <span className="group-hover:rotate-90 transition-transform">+</span> Add Document
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-right pr-10 py-4">
                                        <div className="flex justify-end gap-3">
                                            <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all hover:bg-blue-600 shadow-sm active:scale-95">Update Log</button>
                                            <button onClick={() => handleDeleteCustomer(c._id)} className="w-10 h-10 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all flex items-center justify-center shadow-sm">🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* High-End Edit Modal */}
                {showEditModal && editingCustomer && (
                    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-start justify-center z-[100] p-4 pt-4 md:pt-8 animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-white/20 animate-in zoom-in-95 duration-300">
                            
                            {/* Left Panel (Dark) - Customer Context */}
                            <div className="md:w-80 bg-[#0F172A] p-10 text-white relative flex flex-col justify-between overflow-hidden">
                                {/* Ambient Background */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-[80px] -ml-32 -mb-32"></div>
                                
                                <div className="relative z-10 space-y-8">
                                    <div>
                                        <div className="bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[9px] font-black px-3 py-1.5 rounded-lg w-fit uppercase tracking-widest mb-6 backdrop-blur-sm">Audit Active</div>
                                        <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter leading-none">{editingCustomer.name}</h3>
                                        <div className="flex items-center gap-2 opacity-60">
                                            <span className="text-xs uppercase tracking-widest font-bold">ID:</span>
                                            <span className="font-mono text-xs">{editingCustomer._id.slice(-6).toUpperCase()}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4 backdrop-blur-sm">
                                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project</span>
                                                <span className="text-xs font-black uppercase">{editingCustomer.projectId?.projectName}</span>
                                            </div>
                                            <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit ID</span>
                                                <span className="text-xs font-black text-blue-400">{editingCustomer.plotId?.plotNumber}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Area</span>
                                                <span className="text-xs font-black text-emerald-400">{editingCustomer.sqFt} sqft</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 pt-4 border-t border-white/5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Proposed Rate (₹)</label>
                                            <div className="relative group">
                                                <input 
                                                    type="number" 
                                                    value={customerRate} 
                                                    onChange={(e) => setCustomerRate(parseFloat(e.target.value) || 0)}
                                                    className="w-full pl-5 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl outline-none font-black text-2xl text-white shadow-inner focus:border-blue-500/50 focus:bg-white/10 transition-all text-right"
                                                />
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">₹</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="relative z-10 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center mt-8">
                                    Secure Transaction Environment
                                </div>
                            </div>

                            {/* Right Panel (Light) - Executives Management */}
                            <div className="flex-1 flex flex-col bg-[#F8FAFC]">
                                {/* Header */}
                                <div className="px-10 py-8 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-20">
                                    <div>
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                            <span>🧬</span> Incentive Matrix
                                        </h3>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Configure Sales Hierarchy</p>
                                    </div>
                                    <button onClick={() => setShowEditModal(false)} className="w-10 h-10 bg-slate-50 hover:bg-rose-50 hover:text-rose-500 rounded-xl flex items-center justify-center font-black transition-all text-slate-400">✕</button>
                                </div>

                                {/* Content Scroll Area */}
                                <div className="flex-1 overflow-y-auto p-10 space-y-8">
                                    
                                    {/* Add New Section */}
                                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
                                        <div className="flex-1 w-full space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deploy Personnel</label>
                                            <select 
                                                value={selectedExecToAdd} 
                                                onChange={(e) => setSelectedExecToAdd(e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3.5 font-bold uppercase outline-none"
                                            >
                                                <option value="">Select Executive...</option>
                                                {executives.map(e => <option key={e._id} value={e._id}>{e.name} ({e.userId})</option>)}
                                            </select>
                                        </div>
                                        <button 
                                            onClick={handleAddExecToModal} 
                                            disabled={!selectedExecToAdd}
                                            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-slate-900/10 active:scale-95"
                                        >
                                            + Add
                                        </button>
                                    </div>

                                    {/* Executive List Cards */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Deployments ({modalExecs.length})</span>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target: 100%</span>
                                        </div>
                                        
                                        {modalExecs.length === 0 ? (
                                            <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                                                <span className="text-4xl mb-2 opacity-20">👥</span>
                                                <p className="text-xs font-bold uppercase tracking-widest opacity-50">No Personnel Assigned</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {modalExecs.map((item, idx) => {
                                                    const exec = item.executiveId;
                                                    const execId = exec?._id || exec;
                                                    const potential = (customerRate * (editingCustomer.sqFt || 0) * (item.percentage / 100));
                                                    
                                                    return (
                                                        <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-100 transition-all">
                                                            <div className="flex items-center gap-4">
                                                                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black text-sm uppercase group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                                                    {exec?.name?.[0] || '?'}
                                                                </div>
                                                                <div>
                                                                    <div className="font-black text-slate-800 text-sm uppercase tracking-tight">{exec?.name || 'Unknown'}</div>
                                                                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {exec?.userId}</div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-8">
                                                                <div className="text-right hidden sm:block">
                                                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Incentive</div>
                                                                    <div className="font-black text-slate-700">₹{potential.toLocaleString('en-IN')}</div>
                                                                </div>
                                                                
                                                                <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
                                                                    <input 
                                                                        type="number" 
                                                                        value={item.percentage} 
                                                                        onChange={(e) => handlePercentageChange(execId, e.target.value)}
                                                                        className="w-12 bg-transparent text-center font-black text-blue-600 outline-none"
                                                                        placeholder="0"
                                                                    />
                                                                    <span className="text-xs font-bold text-slate-400 pr-2">%</span>
                                                                </div>

                                                                <button 
                                                                    onClick={() => handleRemoveExecFromModal(execId)}
                                                                    className="w-8 h-8 rounded-lg text-rose-300 hover:bg-rose-50 hover:text-rose-500 flex items-center justify-center transition-all"
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Summary Footer */}
                                    <div className="mt-auto bg-slate-900 text-white p-5 rounded-2xl flex justify-between items-center shadow-lg shadow-slate-900/5">
                                        <div>
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Allocation</div>
                                            <div className="text-xl font-black">{modalExecs.reduce((acc, curr) => acc + (parseFloat(curr.percentage) || 0), 0)}%</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Value</div>
                                            <div className="text-xl font-black text-emerald-400">₹{(customerRate * (editingCustomer.sqFt || 0)).toLocaleString('en-IN')}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Footer */}
                                <div className="p-6 bg-white border-t border-slate-100 flex gap-4 sticky bottom-0 z-20">
                                    <button onClick={() => setShowEditModal(false)} className="px-8 py-4 bg-white text-slate-500 font-bold rounded-xl border border-slate-200 uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">Cancel</button>
                                    <button onClick={handleSaveEditChanges} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl shadow-xl shadow-blue-500/20 uppercase text-[10px] tracking-[0.2em] hover:bg-blue-500 active:scale-95 transition-all">Save Changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default CustomerStatus;
