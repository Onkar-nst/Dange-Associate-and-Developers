import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerAPI } from '../api/services';
import Layout from '../components/Layout';

const CustomerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const response = await customerAPI.getById(id);
        setCustomer(response.data.data);
      } catch (err) {
        setError('Failed to fetch customer details');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomer();
  }, [id]);

  if (loading) return <Layout><div className="flex justify-center items-center h-96 font-black uppercase text-slate-400">Loading Intelligence...</div></Layout>;
  if (error) return <Layout><div className="p-10 text-rose-500 font-black uppercase text-center">{error}</div></Layout>;
  if (!customer) return <Layout><div className="p-10 text-slate-500 font-black uppercase text-center">Customer not found in directory.</div></Layout>;

  return (
    <Layout>
      <div className="p-1 max-w-7xl mx-auto pb-20">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-8 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => navigate('/customers')}
              className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-600 rounded-2xl border border-slate-100 hover:bg-[#1B315A] hover:text-white transition-all group"
            >
              <span className="text-xl group-hover:-translate-x-1 transition-transform">←</span>
            </button>
            <div>
              <h1 className="text-2xl font-black text-[#1B315A] tracking-tighter uppercase leading-none">
                {customer.firstName} {customer.lastName}
              </h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Strategic Asset Portfolio • {customer.transactionStatus || 'Token'}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
             <button className="flex items-center gap-3 px-8 py-4 bg-[#1B315A] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-[#F38C32] transition-all shadow-xl shadow-blue-900/10">
               <span>🧾</span> View Ledger
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Core Person Details */}
          <div className="lg:col-span-1 space-y-8">
             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-[#1B315A] px-8 py-4 text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-3">
                  <span>👤</span> Personal Identity
                </div>
                <div className="p-8 space-y-6">
                  <DetailItem label="Full Name" value={`${customer.title} ${customer.firstName} ${customer.middleName || ''} ${customer.lastName}`} />
                  <DetailItem label="Occupation" value={customer.occupation} />
                  <DetailItem label="Birth Date" value={customer.birthDate ? new Date(customer.birthDate).toLocaleDateString() : 'N/A'} />
                  <DetailItem label="Contact No." value={customer.phone} isHighlight />
                  <DetailItem label="Email" value={customer.email || 'N/A'} />
                  <DetailItem label="Address" value={customer.address} isMultiLine />
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <DetailItem label="City" value={customer.city} />
                    <DetailItem label="State" value={customer.state} />
                  </div>
                  <DetailItem label="PIN Code" value={customer.pinCode} />
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-[#1B315A] px-8 py-4 text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-3">
                  <span>🆔</span> KYC Registry
                </div>
                <div className="p-8 space-y-6">
                  <DetailItem label="PAN Card No." value={customer.panNo || 'NOT PROVIDED'} />
                  <DetailItem label="Aadhar No." value={customer.aadharNo || 'NOT PROVIDED'} />
                </div>
             </div>
          </div>

          {/* Column 2: Transaction & Asset Details */}
          <div className="lg:col-span-1 space-y-8">
             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-[#F38C32] px-8 py-4 text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-3">
                  <span>🎯</span> Strategic Asset
                </div>
                <div className="p-8 space-y-6">
                  <DetailItem label="Project Venture" value={customer.projectId?.projectName} isAccent />
                  <DetailItem label="Plot Number" value={customer.plotId?.plotNumber} isHighlight />
                  <div className="grid grid-cols-2 gap-4">
                    <DetailItem label="Sq. Ft." value={customer.sqFt} />
                    <DetailItem label="Sq. Mtr." value={customer.sqMtr} />
                  </div>
                  <DetailItem label="Measurement" value={customer.measurement} />
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-[#1B315A] px-8 py-4 text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-3">
                  <span>🧬</span> Nominee Detail
                </div>
                <div className="p-8 space-y-6">
                  <DetailItem label="Nominee Name" value={customer.nomineeName || 'N/A'} />
                  <DetailItem label="Relation" value={customer.nomineeRelation || 'N/A'} />
                  <DetailItem label="Nominee Age" value={customer.nomineeAge || 'N/A'} />
                  <DetailItem label="Aadhar No." value={customer.nomineeAadharNo || 'N/A'} />
                </div>
             </div>
          </div>

          {/* Column 3: Financial Matrix */}
          <div className="lg:col-span-1 space-y-8">
             <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-[80px] -mr-20 -mt-20"></div>
                <div className="relative z-10">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-8">Financial Position Matrix</h3>
                  
                  <div className="space-y-8">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Transaction Value</p>
                      <p className="text-3xl font-black tracking-tighter italic">₹{(customer.dealValue || 0).toLocaleString()}</p>
                    </div>

                    <div className="flex justify-between items-end border-l-4 border-emerald-500 pl-6 py-2">
                       <div>
                         <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Recovered Capital</p>
                         <p className="text-xl font-black tracking-tighter">₹{(customer.paidAmount || 0).toLocaleString()}</p>
                       </div>
                    </div>

                    <div className="flex justify-between items-end border-l-4 border-rose-500 pl-6 py-2">
                       <div>
                         <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Outstanding Liability</p>
                         <p className="text-xl font-black tracking-tighter">₹{(customer.balanceAmount || 0).toLocaleString()}</p>
                       </div>
                    </div>

                    <div className="pt-4">
                       <div className="flex justify-between items-center mb-2">
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Recovery Progress</span>
                         <span className="text-[10px] font-black text-blue-400">{Math.round((customer.paidAmount / (customer.dealValue || 1)) * 100)}%</span>
                       </div>
                       <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/5">
                         <div 
                           className="h-full bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-1000"
                           style={{ width: `${(customer.paidAmount / (customer.dealValue || 1)) * 100}%` }}
                         ></div>
                       </div>
                    </div>
                  </div>
                </div>
             </div>

             <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="bg-[#1B315A] px-8 py-4 text-white font-black text-[11px] uppercase tracking-widest flex items-center gap-3">
                  <span>📅</span> Timeline Intelligence
                </div>
                <div className="p-8 space-y-6">
                  <DetailItem label="Booking Anniversary" value={customer.bookingDate ? new Date(customer.bookingDate).toLocaleDateString() : 'N/A'} />
                  <DetailItem label="Agreement Finalisation" value={customer.agreementDate ? new Date(customer.agreementDate).toLocaleDateString() : 'PENDING'} />
                  <DetailItem label="EMI Commencement" value={customer.emiStartDate ? new Date(customer.emiStartDate).toLocaleDateString() : 'N/A'} />
                  <DetailItem label="Payment Tenure" value={`${customer.tenure || 0} Months`} />
                  <DetailItem label="Monthly Installment" value={`₹${(customer.emiAmount || 0).toLocaleString()}`} />
                </div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const DetailItem = ({ label, value, isHighlight, isAccent, isMultiLine }) => (
  <div className="space-y-1.5">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <p className={`font-black uppercase tracking-tighter leading-tight ${
      isHighlight ? 'text-lg text-slate-900' : 
      isAccent ? 'text-sm text-[#F38C32]' : 
      'text-[11px] text-slate-700'
    } ${isMultiLine ? 'normal-case tracking-normal' : ''}`}>
      {value || '---'}
    </p>
  </div>
);

export default CustomerDetail;
