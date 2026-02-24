import React, { useState, useEffect } from 'react';
import { transactionAPI, customerAPI, projectAPI, ledgerAPI } from '../api/services';
import Layout from '../components/Layout';
import { numberToWords } from '../utils/numberToWords';
import './Customers.css';

const Transactions = () => {
    const [customers, setCustomers] = useState([]);
    const [ledgerAccounts, setLedgerAccounts] = useState([]);
    const [projects, setProjects] = useState([]);
    const [customerTransactions, setCustomerTransactions] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [mode, setMode] = useState('add');
    const [selectedId, setSelectedId] = useState(null);
    const [customBankName, setCustomBankName] = useState('');

    const BANK_OPTIONS = ['HDFC Bank', 'Union Bank', 'Bank of India (BOI)', 'Axis Bank', 'Canara Bank', 'Custom'];

    // Edit Modal State
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [editForm, setEditForm] = useState({});

    const initialFormState = {
        entryType: 'Receipt',
        transactionType: 'Select Type',
        transactionDate: new Date().toISOString().split('T')[0],
        customerId: '',
        projectId: '',
        amount: 0,
        paymentMode: 'Cash',
        referenceNumber: '',
        bankName: '',
        narration: '',
        receiptNumber: ''
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            const [custRes, projRes, ledgerRes] = await Promise.all([
                customerAPI.getAll(),
                projectAPI.getAll(),
                ledgerAPI.getAll()
            ]);
            setCustomers(custRes.data.data || []);
            setProjects(projRes.data.data || []);
            setLedgerAccounts((ledgerRes.data.data || []).filter(a => a.active !== false));
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch initial data');
            setLoading(false);
        }
    };

    const handleCustomerChange = async (e) => {
        const val = e.target.value;
        // val format: 'customer_<id>' or 'ledger_<id>'
        const [type, id] = val.split('_');
        setFormData(prev => ({ ...prev, customerId: val }));

        if (type === 'customer' && id) {
            const customer = customers.find(c => c._id === id);
            setSelectedCustomer(customer);
            if (customer?.projectId) {
                setFormData(prev => ({ ...prev, projectId: customer.projectId._id || customer.projectId }));
            }
            fetchCustomerHistory(id);
        } else {
            setSelectedCustomer(null);
            setCustomerTransactions([]);
        }
    };

    const fetchCustomerHistory = async (customerId) => {
        try {
            const res = await transactionAPI.getByCustomer(customerId);
            setCustomerTransactions(res.data.data || []);
        } catch (err) {
            setError('Failed to fetch transaction history');
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!formData.customerId || formData.transactionType === 'Select Type') {
            setError('Please select account and transaction type');
            return;
        }

        // Resolve actual customerId - strip prefix
        const [accType, accId] = formData.customerId.split('_');
        const finalBankName = formData.bankName === 'Custom' ? customBankName : formData.bankName;
        const submitData = { ...formData, customerId: accId, bankName: finalBankName };

        try {
            if (mode === 'add') {
                await transactionAPI.create(submitData);
                setSuccess('Transaction recorded successfully');
            }
            setFormData(initialFormState);
            setSelectedCustomer(null);
            setCustomerTransactions([]);
            setCustomBankName('');
            fetchInitialData();
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    // ─── Edit Functions ───────────────────────────────────────────────
    const handleOpenEdit = (transaction) => {
        setEditingTransaction(transaction);
        setEditForm({
            transactionDate: transaction.transactionDate ? new Date(transaction.transactionDate).toISOString().split('T')[0] : '',
            transactionType: transaction.transactionType || '',
            receiptNumber: transaction.receiptNumber || '',
            narration: transaction.narration || '',
            paymentMode: transaction.paymentMode || 'Cash',
            bankName: transaction.bankName || '',
            referenceNumber: transaction.referenceNumber || '',
            remarks: transaction.remarks || '',
        });
        setShowEditModal(true);
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveEdit = async () => {
        setError('');
        try {
            await transactionAPI.update(editingTransaction._id, editForm);
            setSuccess('Transaction updated successfully!');
            setShowEditModal(false);
            setEditingTransaction(null);
            // Refresh the history for the current customer
            if (formData.customerId) {
                fetchCustomerHistory(formData.customerId);
            }
            // Re-fetch customer to get updated balance info
            const custRes = await customerAPI.getAll();
            setCustomers(custRes.data.data || []);
            const updatedCust = (custRes.data.data || []).find(c => c._id === formData.customerId);
            if (updatedCust) setSelectedCustomer(updatedCust);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update transaction');
        }
    };

    // ─── Delete Functions ─────────────────────────────────────────────
    const handleDelete = async (transaction) => {
        const confirmMsg = `Transaction Delete karna chahte hain?\n\nType: ${transaction.transactionType}\nAmount: ₹${transaction.amount?.toLocaleString('en-IN')}\nDate: ${new Date(transaction.transactionDate).toLocaleDateString()}\n\n⚠️ Ye action customer ka balance reverse karega!`;
        if (!window.confirm(confirmMsg)) return;
        
        setError('');
        try {
            await transactionAPI.delete(transaction._id);
            setSuccess('Transaction deleted & balance reversed!');
            if (formData.customerId) {
                fetchCustomerHistory(formData.customerId);
                const custRes = await customerAPI.getAll();
                setCustomers(custRes.data.data || []);
                const updatedCust = (custRes.data.data || []).find(c => c._id === formData.customerId);
                if (updatedCust) setSelectedCustomer(updatedCust);
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to delete transaction');
        }
    };

    if (loading) return <div className="p-8 text-center font-bold">Loading Transactions...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-6 p-4 bg-gray-50 min-h-screen font-sans">
                {/* Left Side: Entry Form */}
                <div className="lg:w-1/3">
                    <form onSubmit={handleSubmit} className="bg-white border-2 border-gray-400 rounded p-4 shadow-md space-y-4">
                        <div className="bg-yellow-400 text-blue-900 font-bold px-4 py-1 text-sm text-center">
                            Customer Transaction Entry
                        </div>

                        <div className="flex justify-center gap-6">
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="entryType" 
                                    value="Receipt" 
                                    checked={formData.entryType === 'Receipt'} 
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600" 
                                />
                                Receipt
                            </label>
                            <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="entryType" 
                                    value="Payment" 
                                    checked={formData.entryType === 'Payment'} 
                                    onChange={handleChange}
                                    className="w-4 h-4 text-blue-600" 
                                />
                                Payment
                            </label>
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2 items-center text-[11px]">
                                <label className="font-bold text-gray-700">Transaction Type :</label>
                                <select 
                                    name="transactionType" 
                                    value={formData.transactionType} 
                                    onChange={handleChange}
                                    className="border border-red-300 p-1 rounded focus:ring-1 focus:ring-red-400 outline-none"
                                >
                                    <option value="Select Type">Select Type</option>
                                    <option value="down payment">down payment</option>
                                    <option value="EMI">EMI</option>
                                    <option value="Token">Token</option>
                                    <option value="Cash to bank">Cash to bank</option>
                                    <option value="other transaction">other transaction</option>
                                </select>

                                <label className="font-bold text-gray-700">Date :</label>
                                <input 
                                    type="date" 
                                    name="transactionDate" 
                                    value={formData.transactionDate} 
                                    onChange={handleChange}
                                    className="border border-gray-400 p-1 rounded"
                                />

                                <label className="font-bold text-gray-700">Select Account :</label>
                                <select 
                                    name="customerId" 
                                    value={formData.customerId} 
                                    onChange={handleCustomerChange}
                                    className="border border-sky-400 p-1 rounded outline-none"
                                >
                                    <option value="">-- Select Account --</option>
                                    {customers.length > 0 && (
                                        <optgroup label="── Customers ──">
                                            {customers.map(c => (
                                                <option key={c._id} value={`customer_${c._id}`}>{c.name}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                    {ledgerAccounts.length > 0 && (
                                        <optgroup label="── Ledger Accounts ──">
                                            {ledgerAccounts.map(a => (
                                                <option key={a._id} value={`ledger_${a._id}`}>{a.accountName}</option>
                                            ))}
                                        </optgroup>
                                    )}
                                </select>

                                <label className="font-bold text-gray-700">Project :</label>
                                <select 
                                    name="projectId" 
                                    value={formData.projectId} 
                                    onChange={handleChange}
                                    className="border border-gray-400 p-1 rounded"
                                >
                                    <option value="">Select Project</option>
                                    {projects.map(p => (
                                        <option key={p._id} value={p._id}>{p.projectName}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-gray-50 p-2 rounded border border-gray-200 text-[10px] font-bold text-gray-600">
                                <div>Unit No: <span className="text-gray-900">{selectedCustomer?.plotId?.plotNumber || '-'}</span></div>
                                <div>Project Name: <span className="text-gray-900">{selectedCustomer?.projectId?.projectName || '-'}</span></div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 items-center text-[11px]">
                                <label className="font-bold text-gray-700">Amount :</label>
                                <input 
                                    type="number" 
                                    name="amount" 
                                    value={formData.amount} 
                                    onChange={handleChange}
                                    className="border border-orange-400 p-1 rounded font-bold"
                                />

                                <label className="font-bold text-gray-700">In Words: Rs.</label>
                                <div className="text-[9px] font-bold text-blue-600 italic leading-tight">
                                    {numberToWords(formData.amount)}
                                </div>

                                <label className="font-bold text-gray-700">Payment Mode:</label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" name="paymentMode" value="Bank" checked={formData.paymentMode === 'Bank'} onChange={handleChange} /> Bank
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                        <input type="radio" name="paymentMode" value="Cash" checked={formData.paymentMode === 'Cash'} onChange={handleChange} /> Cash
                                    </label>
                                </div>

                                {/* Bank Options - only when Bank is selected */}
                                {formData.paymentMode === 'Bank' && (
                                    <>
                                        <label className="font-bold text-gray-700">Bank Name :</label>
                                        <div className="flex flex-col gap-1">
                                            <select
                                                name="bankName"
                                                value={formData.bankName}
                                                onChange={handleChange}
                                                className="border border-blue-300 p-1 rounded outline-none text-[11px] font-bold"
                                            >
                                                <option value="">-- Select Bank --</option>
                                                {BANK_OPTIONS.map(b => (
                                                    <option key={b} value={b}>{b}</option>
                                                ))}
                                            </select>
                                            {formData.bankName === 'Custom' && (
                                                <input
                                                    type="text"
                                                    placeholder="Bank ka naam type karo..."
                                                    value={customBankName}
                                                    onChange={(e) => setCustomBankName(e.target.value)}
                                                    className="border border-blue-200 p-1 rounded outline-none text-[11px] mt-1"
                                                />
                                            )}
                                        </div>
                                    </>
                                )}

                                <label className="font-bold text-gray-700">Narration :</label>
                                <input 
                                    type="text" 
                                    name="narration" 
                                    value={formData.narration} 
                                    onChange={handleChange}
                                    className="border border-orange-400 p-1 rounded"
                                />
                                
                                <label className="font-bold text-gray-700">Rec. No. :</label>
                                <input 
                                    type="text" 
                                    name="receiptNumber" 
                                    value={formData.receiptNumber} 
                                    onChange={handleChange}
                                    className="border border-gray-400 p-1 rounded"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-[10px] font-bold flex-1">Submit</button>
                            <button type="button" onClick={() => { setFormData(initialFormState); setSelectedCustomer(null); setCustomerTransactions([]); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-[10px] font-bold flex-1">Reset</button>
                        </div>
                        {error && <div className="text-red-500 text-[10px] font-bold text-center">{error}</div>}
                        {success && <div className="text-green-500 text-[10px] font-bold text-center">{success}</div>}
                    </form>
                </div>

                {/* Right Side: Summary and History */}
                <div className="lg:w-2/3 space-y-4">
                    {/* Summary Table */}
                    <div className="bg-white border border-gray-400 shadow-sm overflow-hidden">
                        <table className="w-full text-[10px] text-center">
                            <thead>
                                <tr className="bg-yellow-100 border-b border-gray-300">
                                    <th className="p-2 border-r border-gray-300">EMI Amt</th>
                                    <th className="p-2 border-r border-gray-300">Cost</th>
                                    <th className="p-2 border-r border-gray-300">Paid Amt</th>
                                    <th className="p-2 border-r border-gray-300">DP/Paid</th>
                                    <th className="p-2 border-r border-gray-300">No.EMI</th>
                                    <th className="p-2 border-r border-gray-300">BE Amt</th>
                                    <th className="p-2">EMI Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="font-bold">
                                    <td className="p-2 border-r border-gray-300">₹{selectedCustomer?.emiAmount?.toLocaleString('en-IN') || '0'}</td>
                                    <td className="p-2 border-r border-gray-300">₹{selectedCustomer?.dealValue?.toLocaleString('en-IN') || '0'}</td>
                                    <td className="p-2 border-r border-gray-300">₹{selectedCustomer?.paidAmount?.toLocaleString('en-IN') || '0'}</td>
                                    <td className="p-2 border-r border-gray-300">₹{selectedCustomer?.paidAmount?.toLocaleString('en-IN') || '0'}</td>
                                    <td className="p-2 border-r border-gray-300">{selectedCustomer?.tenure || '0'}</td>
                                    <td className="p-2 border-r border-gray-300 text-red-600">₹{selectedCustomer?.balanceAmount?.toLocaleString('en-IN') || '0'}</td>
                                    <td className="p-2">{selectedCustomer?.emiStartDate ? new Date(selectedCustomer.emiStartDate).toLocaleDateString() : '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* History Table */}
                    <div className="bg-white border border-gray-400 shadow-sm overflow-hidden">
                        <div className="bg-green-600 text-white text-[10px] font-bold px-3 py-1">
                            Transaction History — {customerTransactions.length} record(s)
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-[10px] text-center">
                                <thead>
                                    <tr className="bg-green-100 border-b border-gray-300">
                                        <th className="p-1 border-r border-gray-300 w-8">Sr.No.</th>
                                        <th className="p-1 border-r border-gray-300">Date</th>
                                        <th className="p-1 border-r border-gray-300">Particular</th>
                                        <th className="p-1 border-r border-gray-300">Rec.No.</th>
                                        <th className="p-1 border-r border-gray-300">Remark</th>
                                        <th className="p-1 border-r border-gray-300 text-red-600">Debit</th>
                                        <th className="p-1 border-r border-gray-300 text-green-700">Credit</th>
                                        <th className="p-1 border-r border-gray-300">Balance</th>
                                        <th className="p-1 border-r border-gray-300 text-blue-600">Edit</th>
                                        <th className="p-1 text-red-600">Delete</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customerTransactions.map((t, index) => (
                                        <tr key={t._id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                            <td className="p-1 border-r border-gray-200 text-gray-500">{index + 1}</td>
                                            <td className="p-1 border-r border-gray-200">{new Date(t.transactionDate).toLocaleDateString('en-GB')}</td>
                                            <td className="p-1 border-r border-gray-200 uppercase font-semibold">{t.transactionType}</td>
                                            <td className="p-1 border-r border-gray-200">{t.receiptNumber || '-'}</td>
                                            <td className="p-1 border-r border-gray-200 max-w-[80px] truncate" title={t.narration}>{t.narration || '-'}</td>
                                            <td className="p-1 border-r border-gray-200 font-bold text-red-600">
                                                {t.entryType === 'Payment' ? `₹${t.amount?.toLocaleString('en-IN')}` : '-'}
                                            </td>
                                            <td className="p-1 border-r border-gray-200 font-bold text-green-600">
                                                {t.entryType === 'Receipt' ? `₹${t.amount?.toLocaleString('en-IN')}` : '-'}
                                            </td>
                                            <td className="p-1 border-r border-gray-200 font-bold">
                                                ₹{t.balanceAtTime?.toLocaleString('en-IN') || '-'}
                                            </td>
                                            {/* Edit Button */}
                                            <td className="p-1 border-r border-gray-200">
                                                <button
                                                    onClick={() => handleOpenEdit(t)}
                                                    className="text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded p-0.5 transition-all font-bold text-xs"
                                                    title="Edit Transaction"
                                                >
                                                    ✏️
                                                </button>
                                            </td>
                                            {/* Delete Button */}
                                            <td className="p-1">
                                                <button
                                                    onClick={() => handleDelete(t)}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded p-0.5 transition-all font-bold text-xs"
                                                    title="Delete &amp; Reverse Transaction"
                                                >
                                                    ✕
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {customerTransactions.length === 0 && (
                                        <tr>
                                            <td colSpan="10" className="p-8 text-gray-500 italic">No transaction history for this account</td>
                                        </tr>
                                    )}
                                </tbody>
                                {/* Total Footer */}
                                {customerTransactions.length > 0 && (
                                    <tfoot>
                                        <tr className="bg-gray-100 font-bold border-t-2 border-gray-400">
                                            <td colSpan="5" className="p-1 text-right border-r border-gray-300 text-[9px] uppercase tracking-wider">Total :</td>
                                            <td className="p-1 border-r border-gray-300 text-red-600">
                                                ₹{customerTransactions.filter(t => t.entryType === 'Payment').reduce((s, t) => s + (t.amount || 0), 0).toLocaleString('en-IN')}
                                            </td>
                                            <td className="p-1 border-r border-gray-300 text-green-600">
                                                ₹{customerTransactions.filter(t => t.entryType === 'Receipt').reduce((s, t) => s + (t.amount || 0), 0).toLocaleString('en-IN')}
                                            </td>
                                            <td colSpan="3" className="p-1"></td>
                                        </tr>
                                    </tfoot>
                                )}
                            </table>
                        </div>
                    </div>
                </div>

            {/* ─── Edit Modal ─────────────────────────────────────────── */}
            {showEditModal && editingTransaction && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        {/* Modal Header */}
                        <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                            <div>
                                <h3 className="text-white font-black text-sm uppercase tracking-wider">Edit Transaction</h3>
                                <p className="text-blue-200 text-[10px] font-bold mt-0.5">
                                    Amount ₹{editingTransaction.amount?.toLocaleString('en-IN')} — cannot be changed
                                </p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="text-white hover:bg-white/20 w-8 h-8 rounded-lg flex items-center justify-center font-black transition-all">✕</button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-3 text-[11px]">
                                <div>
                                    <label className="font-black text-gray-600 uppercase tracking-wider block mb-1">Date</label>
                                    <input type="date" name="transactionDate" value={editForm.transactionDate} onChange={handleEditChange} className="border border-gray-300 rounded-lg p-2 w-full outline-none focus:ring-2 focus:ring-blue-400" />
                                </div>
                                <div>
                                    <label className="font-black text-gray-600 uppercase tracking-wider block mb-1">Payment Mode</label>
                                    <select name="paymentMode" value={editForm.paymentMode} onChange={handleEditChange} className="border border-gray-300 rounded-lg p-2 w-full outline-none focus:ring-2 focus:ring-blue-400">
                                        <option value="Cash">Cash</option>
                                        <option value="Bank">Bank</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-black text-gray-600 uppercase tracking-wider block mb-1">Transaction Type</label>
                                    <select name="transactionType" value={editForm.transactionType} onChange={handleEditChange} className="border border-gray-300 rounded-lg p-2 w-full outline-none focus:ring-2 focus:ring-blue-400">
                                        <option value="down payment">Down Payment</option>
                                        <option value="EMI">EMI</option>
                                        <option value="Token">Token</option>
                                        <option value="Cash to bank">Cash to bank</option>
                                        <option value="other transaction">Other Transaction</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="font-black text-gray-600 uppercase tracking-wider block mb-1">Rec. No.</label>
                                    <input type="text" name="receiptNumber" value={editForm.receiptNumber} onChange={handleEditChange} className="border border-gray-300 rounded-lg p-2 w-full outline-none focus:ring-2 focus:ring-blue-400" placeholder="Receipt Number" />
                                </div>
                                <div className="col-span-2">
                                    <label className="font-black text-gray-600 uppercase tracking-wider block mb-1">Narration / Remark</label>
                                    <input type="text" name="narration" value={editForm.narration} onChange={handleEditChange} className="border border-gray-300 rounded-lg p-2 w-full outline-none focus:ring-2 focus:ring-blue-400" placeholder="Enter narration..." />
                                </div>
                                <div className="col-span-2">
                                    <label className="font-black text-gray-600 uppercase tracking-wider block mb-1">Bank Name / Ref. No.</label>
                                    <input type="text" name="bankName" value={editForm.bankName} onChange={handleEditChange} className="border border-gray-300 rounded-lg p-2 w-full outline-none focus:ring-2 focus:ring-blue-400" placeholder="Bank name..." />
                                </div>
                            </div>

                            {/* Warning */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[9px] font-bold text-amber-700 uppercase tracking-wider">
                                ⚠️ Note: Amount change allowed nahi hai — balance integrity ke liye
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3">
                            <button onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-600 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-gray-50 transition-all">Cancel</button>
                            <button onClick={handleSaveEdit} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95">Save Changes</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Transactions;

