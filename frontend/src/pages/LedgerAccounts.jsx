import React, { useState, useEffect } from 'react';
import { ledgerAPI } from '../api/services';
import Layout from '../components/Layout';

const LedgerAccounts = () => {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'transactions'
    const [showTransactionForm, setShowTransactionForm] = useState(false);
    const [transactionData, setTransactionData] = useState({
        amount: 0,
        description: '',
        entryType: 'Payment', // Most likely for spending money
        date: new Date().toISOString().split('T')[0]
    });

    const initialFormState = {
        accountName: '',
        branch: 'MAIN BRANCH',
        address: '',
        openingBalance: 0,
        balanceType: 'Dr',
        type: 'OTHER LEGERS',
        group: 'INDIRECT EXPENSES',
        mode: 'Ledger'
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            const res = await ledgerAPI.getAll();
            setAccounts(res.data.data || []);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch accounts');
            setLoading(false);
        }
    };

    const fetchTransactions = async (accountId) => {
        try {
            const res = await ledgerAPI.getTransactions(accountId);
            setTransactions(res.data.data || []);
        } catch (err) {
            setError('Failed to fetch transactions');
        }
    };

    const handleSelectAccount = (account) => {
        setSelectedAccount(account);
        fetchTransactions(account._id);
        setViewMode('transactions');
        setShowTransactionForm(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTransactionChange = (e) => {
        const { name, value } = e.target;
        setTransactionData(prev => ({ ...prev, [name]: value }));
    };

    const handleTransactionSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await ledgerAPI.createEntry({
                partyType: 'ledger_account',
                partyId: selectedAccount._id,
                credit: transactionData.entryType === 'Receipt' ? transactionData.amount : 0,
                debit: transactionData.entryType === 'Payment' ? transactionData.amount : 0,
                description: transactionData.description,
                transactionDate: transactionData.date
            });
            setShowTransactionForm(false);
            setTransactionData({ amount: 0, description: '', entryType: 'Payment', date: new Date().toISOString().split('T')[0] });
            fetchTransactions(selectedAccount._id);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to record transaction');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            await ledgerAPI.create(formData);
            setSuccess('Account created successfully');
            setFormData(initialFormState);
            fetchAccounts();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create account');
        }
    };

    const accountGroups = [
        'INDIRECT EXPENSES',
        'BANK ACCOUNTS',
        'CAPITAL ACCOUNT',
        'INDIRECT INCOMES',
        'SUNDRY CREDITORS',
        'CASH AND BANK BALANCES',
        'BANK BOOK'
    ];

    if (loading) return <Layout><div className="flex items-center justify-center min-h-screen text-xl font-semibold">Loading Ledger Data...</div></Layout>;

    return (
        <Layout>
            <div className="p-6 max-w-7xl mx-auto font-sans">
                {/* Header Section */}
                <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div>
                        <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">Laser Creation</h1>
                        <p className="text-gray-500 mt-1 font-medium">Manage your financial books and expenditure records</p>
                    </div>
                    {viewMode === 'transactions' && (
                        <button 
                            onClick={() => setViewMode('list')}
                            className="bg-blue-50 text-blue-600 px-6 py-2.5 rounded-xl font-bold hover:bg-blue-100 transition-all flex items-center gap-2"
                        >
                            <span>←</span> Back to Accounts
                        </button>
                    )}
                </div>

                {viewMode === 'list' ? (
                    <div className="flex flex-col xl:flex-row gap-8">
                        {/* Creation Form */}
                        <div className="xl:w-1/3">
                            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden sticky top-6">
                                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
                                    <h2 className="text-white text-xl font-bold">New Ledger Account</h2>
                                    <p className="text-blue-100 text-sm mt-1">Fill in the details to create a new book</p>
                                </div>
                                <form onSubmit={handleSubmit} className="p-8 space-y-5">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Name</label>
                                            <input 
                                                type="text" 
                                                name="accountName" 
                                                value={formData.accountName} 
                                                onChange={handleChange}
                                                required
                                                placeholder="e.g. Office Rent, Petrol Exp"
                                                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all placeholder:text-gray-300"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Branch</label>
                                            <select 
                                                name="branch" 
                                                value={formData.branch} 
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                                            >
                                                <option value="MAIN BRANCH">MAIN BRANCH</option>
                                                <option value="BRANCH 1">BRANCH 1</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Opening Bal</label>
                                                <input 
                                                    type="number" 
                                                    name="openingBalance" 
                                                    value={formData.openingBalance} 
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Type (Dr/Cr)</label>
                                                <select 
                                                    name="balanceType" 
                                                    value={formData.balanceType} 
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                                                >
                                                    <option value="Dr">Debit (Dr)</option>
                                                    <option value="Cr">Credit (Cr)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Account Group</label>
                                            <select 
                                                name="group" 
                                                value={formData.group} 
                                                onChange={handleChange}
                                                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all"
                                            >
                                                {accountGroups.map(g => (
                                                    <option key={g} value={g}>{g}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Address / Remark</label>
                                            <textarea 
                                                name="address" 
                                                value={formData.address} 
                                                onChange={handleChange}
                                                rows="2"
                                                className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:border-blue-500 focus:bg-white outline-none transition-all resize-none"
                                            />
                                        </div>
                                    </div>

                                    <button 
                                        type="submit" 
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-[0.98] mt-4"
                                    >
                                        Create Ledger Book
                                    </button>

                                    {error && <div className="text-red-500 text-sm font-bold text-center mt-2 p-3 bg-red-50 rounded-lg border border-red-100">{error}</div>}
                                    {success && <div className="text-green-500 text-sm font-bold text-center mt-2 p-3 bg-green-50 rounded-lg border border-green-100">{success}</div>}
                                </form>
                            </div>
                        </div>

                        {/* Account List */}
                        <div className="xl:w-2/3">
                            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
                                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="text-xl font-bold text-gray-800">Available Ledger Books</h3>
                                    <span className="bg-blue-100 text-blue-700 text-xs font-black px-3 py-1 rounded-full">{accounts.length} ACCOUNTS</span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                                <th className="px-8 py-5">Account Name</th>
                                                <th className="px-6 py-5">Group</th>
                                                <th className="px-6 py-5">Opening Bal</th>
                                                <th className="px-6 py-5 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {accounts.map((account) => (
                                                <tr key={account._id} className="hover:bg-blue-50/30 transition-colors group">
                                                    <td className="px-8 py-5">
                                                        <div className="font-bold text-gray-800 text-sm group-hover:text-blue-600 transition-colors">{account.accountName}</div>
                                                        <div className="text-[10px] text-gray-400 font-medium">Branch: {account.branch}</div>
                                                    </td>
                                                    <td className="px-6 py-5">
                                                        <span className="text-[11px] font-bold px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg uppercase tracking-wider">{account.group}</span>
                                                    </td>
                                                    <td className="px-6 py-5 font-mono text-xs font-bold text-gray-700">
                                                        ₹{account.openingBalance.toLocaleString('en-IN')} <span className={account.balanceType === 'Dr' ? 'text-blue-500' : 'text-red-500'}>{account.balanceType}</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right">
                                                        <button 
                                                            onClick={() => handleSelectAccount(account)}
                                                            className="text-xs font-black text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-all"
                                                        >
                                                            VIEW LEDGER
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {accounts.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" className="px-8 py-20 text-center text-gray-400 italic font-medium">
                                                        No ledger accounts found. Create one to get started.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Ledger Book View (Transactions) */
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div>
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Statement for</span>
                                <h3 className="text-3xl font-extrabold text-blue-900 mt-2">{selectedAccount.accountName}</h3>
                                <div className="flex gap-4 mt-2 text-sm text-gray-500 font-medium">
                                    <span>Group: {selectedAccount.group}</span>
                                    <span>•</span>
                                    <span>Opening: ₹{selectedAccount.openingBalance} ({selectedAccount.balanceType})</span>
                                </div>
                            </div>
                            <div className="bg-blue-600 p-6 rounded-2xl text-white shadow-lg shadow-blue-600/20 md:w-64">
                                <div className="text-blue-200 text-xs font-bold uppercase tracking-wider">Current Balance</div>
                                <div className="text-2xl font-black mt-1">₹{transactions.length > 0 ? transactions[transactions.length - 1].balance.toLocaleString('en-IN') : '0'}</div>
                            </div>
                        </div>

                        {/* Transaction Recording Form (Collapsible) */}
                        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
                            <div 
                                className="p-6 border-b border-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setShowTransactionForm(!showTransactionForm)}
                            >
                                <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-sm">💰</span>
                                    Customer Transaction Entry
                                </h4>
                                <span className="text-gray-400 font-bold">{showTransactionForm ? '−' : '+'}</span>
                            </div>
                            
                            {showTransactionForm && (
                                <form onSubmit={handleTransactionSubmit} className="p-8 grid grid-cols-1 md:grid-cols-5 gap-6 items-end bg-gray-50/30">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Select Account</label>
                                        <select 
                                            name="linkedAccount" 
                                            value={transactionData.linkedAccount || ''} 
                                            onChange={handleTransactionChange}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold text-sm"
                                        >
                                            <option value="">Select Account...</option>
                                            {accounts.filter(acc => ['BANK ACCOUNTS', 'CASH AND BANK BALANCES', 'BANK BOOK'].includes(acc.group)).map(acc => (
                                                <option key={acc._id} value={acc._id}>{acc.accountName}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Entry Type</label>
                                        <select 
                                            name="entryType" 
                                            value={transactionData.entryType} 
                                            onChange={handleTransactionChange}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-bold"
                                        >
                                            <option value="Payment">Payment (Spend)</option>
                                            <option value="Receipt">Receipt (Income)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount (₹)</label>
                                        <input 
                                            type="number" 
                                            name="amount" 
                                            value={transactionData.amount} 
                                            onChange={handleTransactionChange}
                                            required
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 outline-none font-mono font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Description</label>
                                        <input 
                                            type="text" 
                                            name="description" 
                                            value={transactionData.description} 
                                            onChange={handleTransactionChange}
                                            placeholder="Reason for spend..."
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                                        />
                                    </div>
                                    <button 
                                        type="submit" 
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-500/20 transition-all"
                                    >
                                        SAVE ENTRY
                                    </button>
                                </form>
                            )}
                        </div>

                        <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] border-b border-gray-100">
                                            <th className="px-8 py-6">Date</th>
                                            <th className="px-6 py-6">Description</th>
                                            <th className="px-6 py-6">Reference</th>
                                            <th className="px-6 py-6 text-right">Debit (Dr)</th>
                                            <th className="px-6 py-6 text-right">Credit (Cr)</th>
                                            <th className="px-8 py-6 text-right">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 font-medium text-gray-700">
                                        {transactions.map((t) => (
                                            <tr key={t._id} className="hover:bg-blue-50/20 transition-colors">
                                                <td className="px-8 py-5 text-xs font-bold">{new Date(t.transactionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                <td className="px-6 py-5 text-sm">{t.description}</td>
                                                <td className="px-6 py-5 text-xs text-gray-400 uppercase tracking-wider font-bold">{t.referenceType}</td>
                                                <td className="px-6 py-5 text-right font-mono text-sm text-blue-600 font-bold">{t.debit > 0 ? `+ ₹${t.debit.toLocaleString('en-IN')}` : '-'}</td>
                                                <td className="px-6 py-5 text-right font-mono text-sm text-red-500 font-bold">{t.credit > 0 ? `- ₹${t.credit.toLocaleString('en-IN')}` : '-'}</td>
                                                <td className="px-8 py-5 text-right font-mono text-sm font-black text-gray-900 border-l border-gray-50 bg-gray-50/30">₹{t.balance.toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                        {transactions.length === 0 && (
                                            <tr>
                                                <td colSpan="6" className="px-8 py-20 text-center text-gray-400 italic">No transactions recorded for this account</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default LedgerAccounts;
