import { useState, useEffect } from 'react';
import { commissionAPI, userAPI, projectAPI } from '../api/services';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const Commissions = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [executives, setExecutives] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedExecutive, setSelectedExecutive] = useState(null);
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [ruleFormData, setRuleFormData] = useState({
    name: '',
    appliesToRole: 'Executive',
    type: 'percentage',
    value: '',
    triggerEvent: 'deal_closed',
    basis: 'full_deal_value',
    projectId: '',
  });

  const [payoutFormData, setPayoutFormData] = useState({
    executiveId: '',
    amount: '',
    remarks: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [rulesRes, execsRes, projectsRes] = await Promise.all([
        commissionAPI.getRules(),
        userAPI.getList(),
        projectAPI.getAll({ active: true }),
      ]);
      setRules(rulesRes.data.data || []);
      // Filter for roles that can earn commission
      const commissionableRoles = ['Executive', 'Head Executive'];
      setExecutives((execsRes.data.data || []).filter(u => commissionableRoles.includes(u.role)));
      setProjects(projectsRes.data.data || []);
    } catch (err) {
      setError('Failed to fetch commission data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async (execId) => {
    try {
      setLoading(true);
      const res = await commissionAPI.getExecutiveLedger(execId);
      setLedger(res.data);
      const exec = executives.find(e => e._id === execId);
      setSelectedExecutive(exec);
    } catch (err) {
      setError('Failed to fetch ledger');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await commissionAPI.createRule({
        ...ruleFormData,
        value: parseFloat(ruleFormData.value),
        projectId: ruleFormData.projectId || null,
      });
      setSuccess('Rule created successfully');
      setShowRuleForm(false);
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create rule');
    }
  };

  const handlePayout = async (e) => {
    e.preventDefault();
    try {
      setError('');
      await commissionAPI.pay({
        ...payoutFormData,
        amount: parseFloat(payoutFormData.amount),
      });
      setSuccess('Payment recorded successfully');
      setShowPayoutForm(false);
      if (selectedExecutive) fetchLedger(selectedExecutive._id);
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process payment');
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm('Are you sure you want to DELETE this commission rule? This will not affect existing ledger entries but no new commissions will be calculated using this rule.')) return;
    
    try {
      setError('');
      await commissionAPI.deleteRule(id);
      setSuccess('Rule deleted successfully');
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete rule');
    }
  };

  if (loading && !ledger) {
    return (
        <div className="text-center py-10">Loading Commission System...</div>
    );
  }

  return (
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Commission Management</h1>
          <div className="flex gap-2">
            {user?.role === 'The Boss' && (
              <>
                <button
                  onClick={() => setShowRuleForm(!showRuleForm)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                >
                  {showRuleForm ? 'Cancel' : 'New Commission Rule'}
                </button>
                <button
                  onClick={() => setShowPayoutForm(!showPayoutForm)}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                >
                  {showPayoutForm ? 'Cancel' : 'Record Payout'}
                </button>
              </>
            )}
          </div>
        </div>

        {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">{error}</div>}
        {success && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">{success}</div>}

        {/* Rule Form */}
        {showRuleForm && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-indigo-100">
            <h2 className="text-xl font-bold mb-4 text-indigo-800">Create New Commission Rule</h2>
            <form onSubmit={handleCreateRule} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Rule Name</label>
                <input 
                  type="text" 
                  className="w-full border rounded px-3 py-2" 
                  value={ruleFormData.name}
                  onChange={(e) => setRuleFormData({...ruleFormData, name: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Applies To</label>
                <select 
                  className="w-full border rounded px-3 py-2"
                  value={ruleFormData.appliesToRole}
                  onChange={(e) => setRuleFormData({...ruleFormData, appliesToRole: e.target.value})}
                >
                  <option value="Executive">Executive</option>
                  <option value="Head Executive">Head Executive</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Calculation Type</label>
                <select 
                  className="w-full border rounded px-3 py-2"
                  value={ruleFormData.type}
                  onChange={(e) => setRuleFormData({...ruleFormData, type: e.target.value})}
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed Amount (₹)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Value ({ruleFormData.type === 'percentage' ? '%' : '₹'})</label>
                <input 
                  type="number" 
                  className="w-full border rounded px-3 py-2" 
                  value={ruleFormData.value}
                  onChange={(e) => setRuleFormData({...ruleFormData, value: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trigger Event</label>
                <select 
                  className="w-full border rounded px-3 py-2"
                  value={ruleFormData.triggerEvent}
                  onChange={(e) => setRuleFormData({...ruleFormData, triggerEvent: e.target.value})}
                >
                  <option value="deal_closed">On Deal Closed (Booking)</option>
                  <option value="payment_received">On Every Payment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Basis</label>
                <select 
                  className="w-full border rounded px-3 py-2"
                  value={ruleFormData.basis}
                  onChange={(e) => setRuleFormData({...ruleFormData, basis: e.target.value})}
                >
                  <option value="full_deal_value">Full Deal Value</option>
                  <option value="received_amount">Actual Received Amount</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Scope</label>
                <select 
                  className="w-full border rounded px-3 py-2"
                  value={ruleFormData.projectId}
                  onChange={(e) => setRuleFormData({...ruleFormData, projectId: e.target.value})}
                >
                  <option value="">Global (All Projects)</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.projectName}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 w-full">
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Payout Form */}
        {showPayoutForm && (
          <div className="bg-white p-6 rounded-lg shadow-lg mb-8 border border-green-100">
            <h2 className="text-xl font-bold mb-4 text-green-800">Record Payout to Executive</h2>
            <form onSubmit={handlePayout} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Executive</label>
                <select 
                  className="w-full border rounded px-3 py-2"
                  value={payoutFormData.executiveId}
                  onChange={(e) => setPayoutFormData({...payoutFormData, executiveId: e.target.value})}
                  required
                >
                  <option value="">Select Executive</option>
                  {executives.map(ex => (
                    <option key={ex._id} value={ex._id}>{ex.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amount (₹)</label>
                <input 
                  type="number" 
                  className="w-full border rounded px-3 py-2" 
                  value={payoutFormData.amount}
                  onChange={(e) => setPayoutFormData({...payoutFormData, amount: e.target.value})}
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Remarks</label>
                <input 
                  type="text" 
                  className="w-full border rounded px-3 py-2" 
                  value={payoutFormData.remarks}
                  onChange={(e) => setPayoutFormData({...payoutFormData, remarks: e.target.value})}
                  placeholder="e.g. Monthly settlement"
                />
              </div>
              <div className="flex items-end">
                <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 w-full">
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Rules List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">Commission Rules</h2>
              {rules.length === 0 ? (
                <p className="text-gray-500 italic">No rules defined. Commissions will not be calculated.</p>
              ) : (
                <div className="space-y-4">
                  {rules.map(rule => (
                    <div key={rule._id} className="p-3 bg-gray-50 rounded border-l-4 border-indigo-400 group relative">
                      {user?.role === 'The Boss' && (
                        <button 
                          onClick={() => handleDeleteRule(rule._id)}
                          className="absolute top-2 right-2 text-rose-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete Rule"
                        >
                          🗑️
                        </button>
                      )}
                      <div className="font-bold text-gray-800 pr-6">{rule.name}</div>
                      <div className="text-sm text-gray-600">
                        {rule.type === 'percentage' ? `${rule.value}%` : `₹${rule.value}`} of {rule.basis.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs mt-1 text-indigo-600 font-medium">
                        Trigger: {rule.triggerEvent.replace(/_/g, ' ')}
                      </div>
                      <div className="text-xs text-gray-400">
                        Role: {rule.appliesToRole} | {rule.projectId ? 'Project Specific' : 'Global'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Executives List & Ledger */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4 border-b pb-2">Executives Performance</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {executives.filter(ex => ['Executive', 'Head Executive'].includes(ex.role)).map(ex => (
                  <button
                    key={ex._id}
                    onClick={() => fetchLedger(ex._id)}
                    className="flex items-center justify-between p-4 border rounded hover:bg-indigo-50 transition text-left group"
                  >
                    <div>
                      <div className="font-bold text-gray-800">{ex.name}</div>
                      <div className="text-xs text-gray-500 font-medium">{ex.role}</div>
                    </div>
                    <span className="text-indigo-400 group-hover:text-indigo-600">View Ledger →</span>
                  </button>
                ))}
              </div>
            </div>

            {ledger && (
              <div className="bg-white rounded-lg shadow-md p-6 border-t-4 border-indigo-500">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Ledger: {selectedExecutive?.name}</h2>
                    <p className="text-gray-500">Total transaction history and earnings</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 uppercase tracking-wider font-bold">Pending Balance</div>
                    <div className="text-3xl font-black text-indigo-600">₹{ledger.summary.balance.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-green-50 p-4 rounded text-center">
                    <div className="text-xs text-green-600 font-bold uppercase">Total Earned</div>
                    <div className="text-xl font-bold text-green-800">₹{ledger.summary.totalEarned.toLocaleString('en-IN')}</div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded text-center">
                    <div className="text-xs text-blue-600 font-bold uppercase">Total Paid</div>
                    <div className="text-xl font-bold text-blue-800">₹{ledger.summary.totalPaid.toLocaleString('en-IN')}</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-xs uppercase font-bold">
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Details</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                        <th className="px-4 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-sm">
                      {ledger.data.map(item => (
                        <tr key={item._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500">
                            {new Date(item.generatedAt || item.paidAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{item.description}</div>
                            {item.customerId && <div className="text-xs text-gray-400">Customer: {item.customerId.name}</div>}
                          </td>
                          <td className={`px-4 py-3 text-right font-bold ${item.status === 'earned' ? 'text-gray-800' : 'text-green-600'}`}>
                            {item.status === 'paid' ? '-' : ''}₹{item.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                              item.status === 'earned' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {ledger.data.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center py-8 text-gray-400 italic">No ledger entries found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  );
};

export default Commissions;
