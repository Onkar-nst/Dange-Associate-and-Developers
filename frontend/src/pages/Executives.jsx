import React, { useState, useEffect, useMemo } from 'react';
import { executiveAPI } from '../api/services';
import Layout from '../components/Layout';
import './Customers.css';

// Generate a random 6-char password
const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 6; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    return pwd;
};

// Get today's date as YYYY-MM-DD
const getTodayDate = () => new Date().toISOString().split('T')[0];

const Executives = () => {
    const [executives, setExecutives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [mode, setMode] = useState('add');
    const [selectedId, setSelectedId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('All');
    const [sortConfig, setSortConfig] = useState({ key: 'code', direction: 'asc' });

    // Helper to calculate next DAD code
    const calculateNextCode = (list) => {
        const dadCodes = list
            .map(e => e.code)
            .filter(c => /^DAD\d+$/.test(c))
            .map(c => parseInt(c.replace('DAD', ''), 10));
        const maxNum = dadCodes.length > 0 ? Math.max(...dadCodes) : 100;
        return `DAD${maxNum + 1}`;
    };

    const nextCode = useMemo(() => calculateNextCode(executives), [executives]);

    const getInitialFormState = () => ({
        senior: '',
        code: nextCode,
        role: 'Executive',
        rexPerSqFt: 0,
        name: '',
        branch: 'MAIN BRANCH',
        address: '',
        phone: '',
        percentage: 0,
        rsPerSqFt: 0,
        joiningDate: getTodayDate(),
        birthDate: '',
        panCard: '',
        designation: '',
        password: generatePassword(),
        bankDetails: {
            accountHolderName: '',
            bankName: '',
            accountNo: '',
            ifscCode: '',
            status: 'YES'
        }
    });

    const [formData, setFormData] = useState({
        senior: '',
        code: '',
        role: 'Executive',
        rexPerSqFt: 0,
        name: '',
        branch: 'MAIN BRANCH',
        address: '',
        phone: '',
        percentage: 0,
        rsPerSqFt: 0,
        joiningDate: getTodayDate(),
        birthDate: '',
        panCard: '',
        designation: '',
        password: '',
        bankDetails: {
            accountHolderName: '',
            bankName: '',
            accountNo: '',
            ifscCode: '',
            status: 'YES'
        }
    });

    useEffect(() => {
        fetchExecutives();
    }, []);

    // Sync code and password when data is loaded or nextCode changes
    useEffect(() => {
        if (mode === 'add' && !loading) {
            setFormData(prev => ({
                ...prev,
                code: nextCode,
                password: prev.password || generatePassword(),
            }));
        }
    }, [nextCode, mode, loading]);

    const fetchExecutives = async () => {
        try {
            // Fetch all (including inactive) to ensure E-Code remains unique and sequential
            const response = await executiveAPI.getAll();
            const data = response.data.data || [];
            setExecutives(data);
            setLoading(false);
            return data;
        } catch (err) {
            setError('Failed to fetch executives');
            setLoading(false);
            return [];
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'senior') {
            if (value) {
                const seniorExec = executives.find(ex => ex._id === value);
                if (seniorExec) {
                    setFormData(prev => ({
                        ...prev,
                        senior: value,
                        percentage: seniorExec.percentage || prev.percentage,
                        rsPerSqFt: seniorExec.rsPerSqFt || prev.rsPerSqFt,
                    }));
                    return;
                }
            } else {
                setFormData(prev => ({ ...prev, senior: '', percentage: 0, rsPerSqFt: 0 }));
                return;
            }
        }
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({
                ...prev,
                [parent]: { ...prev[parent], [child]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            if (mode === 'add') {
                await executiveAPI.create(formData);
                setSuccess('Executive created successfully');
            } else {
                await executiveAPI.update(selectedId, formData);
                setSuccess('Executive updated successfully');
            }
            
            const latestExecutives = await fetchExecutives();
            
            // If we just added a new executive, reset the form with next code & password
            if (mode === 'add') {
                const updatedCode = calculateNextCode(latestExecutives);
                setFormData({
                    ...getInitialFormState(),
                    code: updatedCode,
                    password: generatePassword(),
                });
            } else {
                handleCancel();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleEdit = (exec) => {
        setMode('edit');
        setSelectedId(exec._id);
        setFormData({
            ...exec,
            senior: exec.senior?._id || '',
            joiningDate: exec.joiningDate ? exec.joiningDate.split('T')[0] : '',
            birthDate: exec.birthDate ? exec.birthDate.split('T')[0] : '',
            bankDetails: exec.bankDetails || getInitialFormState().bankDetails
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setMode('add');
        setSelectedId(null);
        setFormData(getInitialFormState());
        setError('');
        setSuccess('');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to PERMANENTLY delete this executive? This will also delete their login account.')) {
            try {
                await executiveAPI.delete(id);
                fetchExecutives();
            } catch (err) {
                setError('Failed to delete executive');
            }
        }
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // For display in table: only show active ones
    const activeExecutives = executives.filter(e => e.active !== false);

    const sortedExecutives = useMemo(() => {
        let sortableItems = [...activeExecutives];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue, bValue;

                // Handle nested objects or special cases
                if (sortConfig.key === 'senior') {
                    aValue = a.senior?.name || '';
                    bValue = b.senior?.name || '';
                } else {
                    aValue = a[sortConfig.key];
                    bValue = b[sortConfig.key];
                }

                if (typeof aValue === 'string') {
                    aValue = aValue.toLowerCase();
                    bValue = bValue.toLowerCase();
                    
                    // Special handling for DAD codes (DAD101, DAD102) to sort numerically
                    if (sortConfig.key === 'code' && aValue.startsWith('dad') && bValue.startsWith('dad')) {
                        const aNum = parseInt(aValue.replace('dad', ''), 10);
                        const bNum = parseInt(bValue.replace('dad', ''), 10);
                        return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
                    }
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [activeExecutives, sortConfig]);

    const filteredExecutives = searchTerm === 'All' 
        ? sortedExecutives 
        : sortedExecutives.filter(e => e._id === searchTerm || e.name.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading) return <div className="p-8 text-center font-bold">Loading Executives...</div>;

    // Shared input styles
    const inputCls = "w-full border border-gray-200 rounded px-2.5 py-1.5 text-[11px] text-gray-700 bg-white focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-100 transition-all";
    const labelCls = "text-[11px] font-bold text-gray-600 text-right pr-4";
    const rowCls = "grid grid-cols-[110px_1fr] items-center py-1.5 border-b border-gray-50 last:border-b-0";

    return (
        <div className="flex flex-col lg:flex-row gap-5 p-4 bg-gray-50 min-h-screen font-sans">
                {/* Left Side: Forms */}
                <div className="lg:w-[340px] shrink-0 space-y-3">
                    <form onSubmit={handleSubmit} className="space-y-3">
                        {/* Executive/Advisor Entry Section */}
                        <div className="bg-white border border-sky-200 rounded-lg shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-4 py-2 text-[11px] font-bold tracking-wide">
                                Executive/Advisor Entry
                            </div>
                            <div className="px-4 py-2">
                                {/* Senior */}
                                <div className={rowCls}>
                                    <label className={labelCls}>Senior</label>
                                    <select 
                                        name="senior" 
                                        value={formData.senior} 
                                        onChange={handleChange}
                                        className={inputCls}
                                    >
                                        <option value="">Select an Option</option>
                                        {executives
                                            .filter(e => e._id !== selectedId)
                                            .map(e => (
                                                <option key={e._id} value={e._id}>{e.name} ({e.code})</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                {/* Senior info mini-table */}
                                {formData.senior && (() => {
                                    const s = executives.find(e => e._id === formData.senior);
                                    return s ? (
                                        <div className="my-1.5 border border-gray-200 rounded overflow-hidden">
                                            <div className="flex text-[10px] bg-gray-50 border-b border-gray-200">
                                                <span className="flex-1 px-2 py-1 font-semibold text-gray-600 border-r border-gray-200">Code</span>
                                                <span className="w-16 px-2 py-1 text-center font-bold text-gray-800">{s.code || '#'}</span>
                                            </div>
                                            <div className="flex text-[10px] bg-gray-50">
                                                <span className="flex-1 px-2 py-1 font-semibold text-gray-600 border-r border-gray-200">Per.</span>
                                                <span className="w-16 px-2 py-1 text-center font-bold text-gray-800">{s.percentage || 0}%</span>
                                            </div>
                                        </div>
                                    ) : null;
                                })()}

                                {/* Code (auto-generated, read-only) */}
                                <div className={rowCls}>
                                    <label className={labelCls}>Code</label>
                                    <input 
                                        type="text" 
                                        name="code" 
                                        value={formData.code} 
                                        readOnly
                                        className={`${inputCls} bg-gray-50 font-bold border-gray-100 cursor-not-allowed`}
                                    />
                                </div>

                                {/* Executive Name */}
                                <div className={rowCls}>
                                    <label className={labelCls}>Executive Name</label>
                                    <input 
                                        type="text" 
                                        name="name" 
                                        value={formData.name} 
                                        onChange={handleChange}
                                        className={inputCls}
                                        required
                                        placeholder="Enter name"
                                    />
                                </div>

                                {/* Branch */}
                                <div className={rowCls}>
                                    <label className={labelCls}>Branch</label>
                                    <select 
                                        name="branch" 
                                        value={formData.branch} 
                                        onChange={handleChange}
                                        className={inputCls}
                                    >
                                        <option value="MAIN BRANCH">MAIN BRANCH</option>
                                        <option value="SUB BRANCH">SUB BRANCH</option>
                                    </select>
                                </div>

                                {/* Address */}
                                <div className={rowCls}>
                                    <label className={labelCls}>Address</label>
                                    <textarea 
                                        name="address" 
                                        value={formData.address} 
                                        onChange={handleChange}
                                        className={`${inputCls} h-12 resize-none`}
                                        placeholder="Enter address"
                                    />
                                </div>

                                {/* Contact No */}
                                <div className={rowCls}>
                                    <label className={labelCls}>Contact No.</label>
                                    <input 
                                        type="text" 
                                        name="phone" 
                                        value={formData.phone} 
                                        onChange={handleChange}
                                        className={inputCls}
                                        placeholder="Mobile Number"
                                    />
                                </div>

                                {/* Role */}
                                <div className={rowCls}>
                                    <label className={labelCls}>Role</label>
                                    <select 
                                        name="role" 
                                        value={formData.role || 'Executive'} 
                                        onChange={handleChange}
                                        className={inputCls}
                                    >
                                        <option value="Executive">Executive</option>
                                        <option value="Head Executive">Head Executive</option>
                                        <option value="The Boss">The Boss</option>
                                    </select>
                                </div>

                                {/* Percentage + Rs Per Sq.Ft in one row */}
                                <div className={rowCls}>
                                    <label className={labelCls}>Percentage</label>
                                    <div className="flex items-center gap-1 flex-1">
                                        <input 
                                            type="number" 
                                            name="percentage" 
                                            value={formData.percentage} 
                                            onChange={handleChange}
                                            className={inputCls}
                                        />
                                        <span className="text-[10px] font-bold text-red-500">%</span>
                                    </div>
                                </div>

                                <div className={rowCls}>
                                    <label className={labelCls}>Rs.(Sq.Ft.)</label>
                                    <div className="flex items-center gap-1 flex-1">
                                        <input 
                                            type="number" 
                                            name="rsPerSqFt" 
                                            value={formData.rsPerSqFt} 
                                            onChange={handleChange}
                                            className={inputCls}
                                        />
                                        <span className="text-[10px] font-bold text-red-500">(Sq.ft)</span>
                                    </div>
                                </div>

                                {/* Joining Date (auto today) */}
                                <div className={rowCls}>
                                    <label className={labelCls}>Joining Date</label>
                                    <input 
                                        type="date" 
                                        name="joiningDate" 
                                        value={formData.joiningDate} 
                                        onChange={handleChange}
                                        className={inputCls}
                                    />
                                </div>

                                {/* Birth Date */}
                                <div className={rowCls}>
                                    <label className={labelCls}>Birth Date</label>
                                    <input 
                                        type="date" 
                                        name="birthDate" 
                                        value={formData.birthDate} 
                                        onChange={handleChange}
                                        className={inputCls}
                                    />
                                </div>

                                {/* PAN Card */}
                                <div className={rowCls}>
                                    <label className={labelCls}>PAN Card</label>
                                    <input 
                                        type="text" 
                                        name="panCard" 
                                        value={formData.panCard} 
                                        onChange={handleChange}
                                        className={inputCls}
                                    />
                                </div>

                                {/* Designation */}
                                <div className={rowCls}>
                                    <label className={labelCls}>Designation</label>
                                    <input 
                                        type="text" 
                                        name="designation" 
                                        value={formData.designation} 
                                        onChange={handleChange}
                                        className={inputCls}
                                    />
                                </div>

                                {/* Password (auto-generated, read-only) */}
                                <div className={rowCls}>
                                    <label className={labelCls}>Password</label>
                                    <input 
                                        type="text" 
                                        name="password" 
                                        value={formData.password} 
                                        readOnly
                                        className={`${inputCls} bg-gray-50 font-bold border-gray-100 cursor-not-allowed`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Bank Detail Section */}
                        <div className="bg-white border border-sky-200 rounded-lg shadow-sm overflow-hidden">
                            <div className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-4 py-2 text-[11px] font-bold tracking-wide text-center">
                                Bank Detail
                            </div>
                            <div className="px-4 py-2">
                                <div className={rowCls}>
                                    <label className={labelCls}>A/c Holder Name</label>
                                    <input 
                                        type="text" 
                                        name="bankDetails.accountHolderName" 
                                        value={formData.bankDetails.accountHolderName} 
                                        onChange={handleChange}
                                        className={inputCls}
                                    />
                                </div>

                                <div className={rowCls}>
                                    <label className={labelCls}>Bank Name</label>
                                    <input 
                                        type="text" 
                                        name="bankDetails.bankName" 
                                        value={formData.bankDetails.bankName} 
                                        onChange={handleChange}
                                        className={inputCls}
                                    />
                                </div>

                                <div className={rowCls}>
                                    <label className={labelCls}>A/c No.</label>
                                    <input 
                                        type="text" 
                                        name="bankDetails.accountNo" 
                                        value={formData.bankDetails.accountNo} 
                                        onChange={handleChange}
                                        className={inputCls}
                                    />
                                </div>

                                <div className={rowCls}>
                                    <label className={labelCls}>IFSC Code</label>
                                    <input 
                                        type="text" 
                                        name="bankDetails.ifscCode" 
                                        value={formData.bankDetails.ifscCode} 
                                        onChange={handleChange}
                                        className={inputCls}
                                    />
                                </div>

                                <div className={rowCls}>
                                    <label className={labelCls}>Status</label>
                                    <select 
                                        name="bankDetails.status" 
                                        value={formData.bankDetails.status} 
                                        onChange={handleChange}
                                        className={inputCls}
                                    >
                                        <option value="YES">YES</option>
                                        <option value="NO">NO</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                            <button 
                                type="submit" 
                                className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-[11px] font-bold shadow-sm flex-1 transition-colors"
                            >
                                {mode === 'add' ? 'Save' : 'Update'}
                            </button>
                            <button 
                                type="button" 
                                onClick={handleCancel}
                                className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded-lg text-[11px] font-bold shadow-sm flex-1 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>

                        {error && <div className="text-red-500 text-[10px] font-bold text-center bg-red-50 border border-red-200 rounded p-1.5">{error}</div>}
                        {success && <div className="text-green-600 text-[10px] font-bold text-center bg-green-50 border border-green-200 rounded p-1.5">{success}</div>}
                    </form>
                </div>

                {/* Right Side: Table */}
                <div className="flex-1 space-y-3">
                    <div className="flex justify-between bg-white p-2 border border-gray-200 rounded-lg shadow-sm">
                        <select 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-200 p-1.5 rounded text-[11px] focus:outline-none w-64"
                        >
                            <option value="All">All Executives</option>
                            {executives.map(e => (
                                <option key={e._id} value={e._id}>{e.name} ({e.code})</option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-[10px]">
                            <thead>
                                <tr className="bg-gradient-to-r from-sky-50 to-cyan-50 text-gray-600 border-b border-gray-200">
                                    <th className="p-1.5 border-r border-gray-100 font-semibold cursor-pointer hover:bg-sky-100 transition-colors" onClick={() => requestSort('code')}>
                                        <div className="flex items-center justify-between">
                                            E-Code {sortConfig.key === 'code' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                                        </div>
                                    </th>
                                    <th className="p-1.5 border-r border-gray-100 font-semibold cursor-pointer hover:bg-sky-100 transition-colors" onClick={() => requestSort('name')}>
                                        <div className="flex items-center justify-between">
                                            E-Name {sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                                        </div>
                                    </th>
                                    <th className="p-1.5 border-r border-gray-100 font-semibold cursor-pointer hover:bg-sky-100 transition-colors" onClick={() => requestSort('panCard')}>
                                        <div className="flex items-center justify-between">
                                            PAN No. {sortConfig.key === 'panCard' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                                        </div>
                                    </th>
                                    <th className="p-1.5 border-r border-gray-100 font-semibold cursor-pointer hover:bg-sky-100 transition-colors" onClick={() => requestSort('senior')}>
                                        <div className="flex items-center justify-between">
                                            Senior {sortConfig.key === 'senior' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                                        </div>
                                    </th>
                                    <th className="p-1.5 border-r border-gray-100 font-semibold cursor-pointer hover:bg-sky-100 transition-colors" onClick={() => requestSort('percentage')}>
                                        <div className="flex items-center justify-between">
                                            Per {sortConfig.key === 'percentage' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                                        </div>
                                    </th>
                                    <th className="p-1.5 border-r border-gray-100 font-semibold cursor-pointer hover:bg-sky-100 transition-colors" onClick={() => requestSort('branch')}>
                                        <div className="flex items-center justify-between">
                                            Branch {sortConfig.key === 'branch' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                                        </div>
                                    </th>
                                    <th className="p-1.5 border-r border-gray-100 font-semibold text-center">Send Msg</th>
                                    <th className="p-1.5 border-r border-gray-100 font-semibold text-center">Show PWD</th>
                                    <th className="p-1.5 border-r border-gray-100 font-semibold text-center">Edit</th>
                                    <th className="p-1.5 font-semibold text-center">Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExecutives.map((exec) => (
                                    <tr key={exec._id} className="border-b border-gray-50 hover:bg-sky-50/50 transition-colors">
                                        <td className="p-1.5 border-r border-gray-50 font-bold text-sky-700">{exec.code}</td>
                                        <td className="p-1.5 border-r border-gray-50">{exec.name}</td>
                                        <td className="p-1.5 border-r border-gray-50 uppercase">{exec.panCard || '-'}</td>
                                        <td className="p-1.5 border-r border-gray-50 font-medium">{exec.senior?.name || '-'}</td>
                                        <td className="p-1.5 border-r border-gray-50 text-center">{exec.percentage}%</td>
                                        <td className="p-1.5 border-r border-gray-50 text-[8px] font-semibold text-gray-600">{exec.branch}</td>
                                        <td className="p-1.5 border-r border-gray-50 text-center">
                                            {exec.phone ? (
                                                <a 
                                                    href={`https://wa.me/${exec.phone.replace(/\D/g, '')}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="bg-green-500 hover:bg-green-600 text-white px-2 py-0.5 rounded text-[8px] font-bold transition-colors inline-block"
                                                >
                                                    WhatsApp
                                                </a>
                                            ) : (
                                                <span className="text-gray-300 text-[8px]">No No.</span>
                                            )}
                                        </td>
                                        <td className="p-1.5 border-r border-gray-50 text-center">
                                            <button 
                                                onClick={() => alert(`Code: ${exec.code}\nPassword: ${exec.password || 'Not Set'}`)}
                                                className="bg-orange-400 hover:bg-orange-500 text-white px-2 py-0.5 rounded text-[8px] font-bold transition-colors"
                                            >
                                                Show
                                            </button>
                                        </td>
                                        <td className="p-1.5 border-r border-gray-50 text-center">
                                            <button 
                                                onClick={() => handleEdit(exec)}
                                                className="bg-sky-400 hover:bg-sky-500 text-white px-2 py-0.5 rounded text-[8px] font-bold transition-colors"
                                            >
                                                Edit
                                            </button>
                                        </td>
                                        <td className="p-1.5 text-center">
                                            <button 
                                                onClick={() => handleDelete(exec._id)}
                                                className="bg-red-500 hover:bg-red-600 text-white px-2 py-0.5 rounded text-[8px] font-bold transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
    );
};

export default Executives;
