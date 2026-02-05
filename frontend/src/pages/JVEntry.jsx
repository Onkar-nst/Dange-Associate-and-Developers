import React, { useState, useEffect } from 'react';
import { jvAPI, ledgerAPI, userAPI, customerAPI } from '../api/services';
import Layout from '../components/Layout';

const JVEntry = () => {
    const [jvs, setJvs] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [executives, setExecutives] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const initialFormState = {
        branch: 'MAIN BRANCH',
        transactionDate: new Date().toISOString().split('T')[0],
        debitAccount: '',
        creditAccount: '',
        amount: 0,
        narration: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [jvRes, accRes, execRes, custRes] = await Promise.all([
                jvAPI.getAll(),
                ledgerAPI.getAll(),
                userAPI.getList(),
                customerAPI.getAll()
            ]);
            
            setJvs(jvRes.data.data || []);
            setAccounts(accRes.data.data || []);
            setExecutives((execRes.data.data || []).filter(u => ['Executive', 'Head Executive', 'The Boss'].includes(u.role)));
            setCustomers(custRes.data.data || []);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch initial data matrix');
            setLoading(false);
        }
    };

    const fetchJVs = async () => {
        try {
            const res = await jvAPI.getAll();
            setJvs(res.data.data || []);
        } catch (err) {
            setError('Failed to refresh JV synchronization');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const combinedAccounts = [
        ...accounts.map(a => ({ id: a._id, name: a.accountName, type: 'ledger_account', code: a.branch.slice(0,3).toUpperCase(), icon: '🏦' })),
        ...executives.map(e => ({ id: e._id, name: e.name, type: 'executive', code: e.userId, icon: '👔' })),
        ...customers.map(c => ({ id: c._id, name: c.name, type: 'customer', code: 'CUST', icon: '👤' }))
    ];

    const filteredJVs = jvs.filter(jv => {
        if (!formData.debitAccount && !formData.creditAccount) return true;
        const isMatched = (partyId) => 
            (formData.debitAccount && partyId === formData.debitAccount) || 
            (formData.creditAccount && partyId === formData.creditAccount);
        return isMatched(jv.debitAccount.partyId) || isMatched(jv.creditAccount.partyId);
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.debitAccount === formData.creditAccount) {
            setError('Operational Error: Debit and Credit entities must be distinct');
            return;
        }
        if (formData.amount <= 0) {
            setError('Fiscal Error: Transaction amount must be positive');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const debitParty = combinedAccounts.find(a => a.id === formData.debitAccount);
            const creditParty = combinedAccounts.find(a => a.id === formData.creditAccount);

            const payload = {
                branch: formData.branch,
                transactionDate: formData.transactionDate,
                amount: parseFloat(formData.amount),
                narration: formData.narration,
                debitAccount: {
                    partyType: debitParty.type,
                    partyId: debitParty.id,
                    accountName: `${debitParty.name} - ${debitParty.code}`
                },
                creditAccount: {
                    partyType: creditParty.type,
                    partyId: creditParty.id,
                    accountName: `${creditParty.name} - ${creditParty.code}`
                }
            };

            await jvAPI.create(payload);
            setSuccess('Protocol Success: JV Ledger Posting Complete');
            setFormData(initialFormState);
            fetchJVs();
        } catch (err) {
            setError(err.response?.data?.error || 'System Error: Ledger Posting Failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to DEACTIVATE this JV record?')) return;
        try {
            await jvAPI.delete(id);
            fetchJVs();
        } catch (err) {
            setError('Operational Failure: JV Deletion Protocol Terminated');
        }
    };

    const Label = ({ children, icon }) => (
        <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest ml-1 mb-2 block flex items-center gap-2">
            <span>{icon}</span> {children}
        </label>
    );

    if (loading) return <Layout><div className="flex items-center justify-center min-h-[400px] font-black text-slate-300 uppercase tracking-widest animate-pulse">Syncing Journal Matrix...</div></Layout>;

    return (
        <Layout>
            <div className="max-w-7xl mx-auto space-y-12 animate-fade-in px-4 pb-20">
                
                {/* Protocol Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase flex items-center gap-4">
                            <span>📓</span> Journal Voucher Entry
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Double-Entry Fiscal Integrity & Internal Multi-Entity Transfers</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    
                    {/* Entry Form Section */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl shadow-blue-900/10 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px] -mr-32 -mt-32"></div>
                            
                            <form onSubmit={handleSubmit} className="relative z-10 space-y-8">
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <Label icon="🏢">Operational Branch</Label>
                                        <select 
                                            name="branch"
                                            value={formData.branch}
                                            onChange={handleChange}
                                            className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[10px] uppercase"
                                        >
                                            <option value="MAIN BRANCH" className="text-slate-800">CENTRAL HUB</option>
                                            <option value="SUB BRANCH" className="text-slate-800">REGIONAL UNIT</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label icon="📅">Posting Date</Label>
                                        <input 
                                            type="date"
                                            name="transactionDate"
                                            value={formData.transactionDate}
                                            onChange={handleChange}
                                            className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[10px]"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-6 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                                        <div>
                                            <Label icon="➖">Debit Account (From)</Label>
                                            <select 
                                                name="debitAccount"
                                                value={formData.debitAccount}
                                                onChange={handleChange}
                                                required
                                                className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[11px] uppercase"
                                            >
                                                <option value="" className="text-slate-800">-- SELECT SOURCE ENTITY --</option>
                                                {combinedAccounts.map(a => (
                                                    <option key={a.id} value={a.id} className="text-slate-800">{a.icon} {a.name} ({a.code})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label icon="💎">Transaction Amount (₹)</Label>
                                            <input 
                                                type="number"
                                                name="amount"
                                                value={formData.amount}
                                                onChange={handleChange}
                                                className="w-full bg-transparent border-b-2 border-white/10 py-4 text-4xl font-black text-blue-400 outline-none focus:border-blue-500 transition-all placeholder:text-white/5"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-white/5 p-8 rounded-[2rem] border border-white/5 space-y-6 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                                        <div>
                                            <Label icon="➕">Credit Account (To)</Label>
                                            <select 
                                                name="creditAccount"
                                                value={formData.creditAccount}
                                                onChange={handleChange}
                                                required
                                                className="modern-input !bg-white/5 !border-white/10 !text-white !py-4 font-black text-[11px] uppercase"
                                            >
                                                <option value="" className="text-slate-800">-- SELECT TARGET ENTITY --</option>
                                                {combinedAccounts.map(a => (
                                                    <option key={a.id} value={a.id} className="text-slate-800">{a.icon} {a.name} ({a.code})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <Label icon="✍️">Audit Narration</Label>
                                            <input 
                                                type="text"
                                                name="narration"
                                                value={formData.narration}
                                                onChange={handleChange}
                                                className="w-full bg-transparent border-b border-white/10 py-2 text-sm font-bold text-slate-300 outline-none focus:border-blue-500 transition-all placeholder:text-slate-600"
                                                placeholder="Explain transaction purpose..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button 
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-white text-slate-900 py-5 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 disabled:opacity-30"
                                    >
                                        {submitting ? 'Post-Post...' : 'Post Entry'}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData(initialFormState)}
                                        className="px-10 bg-white/5 border border-white/10 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-all"
                                    >
                                        Abort
                                    </button>
                                </div>

                                {error && <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-shake leading-relaxed">{error}</div>}
                                {success && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center animate-fade-in">{success}</div>}
                            </form>
                        </div>
                    </div>

                    {/* JV Audit Table Section */}
                    <div className="lg:col-span-7 space-y-8">
                        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[800px]">
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
                                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 flex items-center gap-3">
                                    <span>🔍</span> JV Audit Registry
                                </h2>
                                <div className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full uppercase">
                                    Records Managed: {filteredJVs.length}
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto flex-1">
                                <table className="modern-table border-none">
                                    <thead>
                                        <tr className="!bg-slate-50/50">
                                            <th className="w-16 pl-8">Admin</th>
                                            <th>Date & Sync ID</th>
                                            <th className="text-center">Protocol</th>
                                            <th>Account Entity</th>
                                            <th className="text-right pr-8">Fiscal Flow</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredJVs.map((jv) => (
                                            <React.Fragment key={jv._id}>
                                                {/* Debit Row */}
                                                <tr className="border-b border-slate-50/50 group hover:bg-slate-50/30 transition-colors">
                                                    <td className="pl-8 py-6" rowSpan="2">
                                                        <button 
                                                            onClick={() => handleDelete(jv._id)}
                                                            className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </td>
                                                    <td className="py-6" rowSpan="2">
                                                        <div className="font-black text-slate-800 uppercase text-[11px] tracking-tight">{new Date(jv.transactionDate).toLocaleDateString('en-GB')}</div>
                                                        <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest mt-1">#JV-{jv.jvNumber}</div>
                                                    </td>
                                                    <td className="text-center py-4">
                                                        <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase italic tracking-tighter shadow-sm border border-blue-100">DR (➖)</span>
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="font-black text-slate-700 uppercase tracking-tighter text-[11px]">{jv.debitAccount.accountName}</div>
                                                        <div className="text-[8px] font-bold text-slate-300 uppercase italic mt-0.5 max-w-[150px] truncate">{jv.narration}</div>
                                                    </td>
                                                    <td className="text-right pr-8 font-black text-blue-600 text-base">₹{jv.amount.toLocaleString()}</td>
                                                </tr>
                                                {/* Credit Row */}
                                                <tr className="border-b border-slate-50 group-hover:bg-slate-50/30 transition-colors">
                                                    <td className="text-center py-4">
                                                        <span className="px-2 py-1 bg-rose-50 text-rose-500 rounded text-[9px] font-black uppercase italic tracking-tighter shadow-sm border border-rose-100">CR (➕)</span>
                                                    </td>
                                                    <td className="py-4">
                                                        <div className="font-black text-slate-500 uppercase tracking-tighter text-[11px] italic">{jv.creditAccount.accountName}</div>
                                                        <div className="text-[8px] font-black text-slate-200 uppercase tracking-[0.2em] mt-0.5">Automated Double Entry Post</div>
                                                    </td>
                                                    <td className="text-right pr-8 font-black text-slate-300">₹{jv.amount.toLocaleString()}</td>
                                                </tr>
                                            </React.Fragment>
                                        ))}
                                        {filteredJVs.length === 0 && (
                                            <tr>
                                                <td colSpan="5" className="py-40 text-center">
                                                    <div className="text-6xl mb-6 grayscale opacity-10">📜</div>
                                                    <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">Audit Trail Clean / No Postings Found</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>

                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] pb-10">Dange Associates Enterprise Ledger Infrastructure © 2026</p>
            </div>
        </Layout>
    );
};

export default JVEntry;
