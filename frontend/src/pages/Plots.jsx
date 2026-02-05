import { useState, useEffect } from 'react';
import { plotAPI, projectAPI } from '../api/services';
import Layout from '../components/Layout';
import './Customers.css';

const Plots = () => {
  const [plots, setPlots] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingPlotId, setEditingPlotId] = useState(null);

  const initialFormState = {
    plotNumber: '',
    measurement: '',
    sqMtr: '',
    size: '', // Sq.Ft.
    east: '',
    west: '',
    north: '',
    south: '',
    rate: '',
    status: 'vacant',
  };

  const [formData, setFormData] = useState(initialFormState);

  const stats = plots.reduce((acc, plot) => {
    const size = parseFloat(plot.size) || 0;
    if (plot.status === 'hold') {
      acc.token.count++;
      acc.token.area += size;
    } else if (plot.status === 'booked') {
      acc.agreement.count++;
      acc.agreement.area += size;
    } else if (plot.status === 'sold') {
      acc.reg.count++;
      acc.reg.area += size;
    } else if (plot.status === 'vacant') {
      acc.balance.count++;
      acc.balance.area += size;
    }
    return acc;
  }, {
    token: { count: 0, area: 0 },
    agreement: { count: 0, area: 0 },
    reg: { count: 0, area: 0 },
    balance: { count: 0, area: 0 }
  });


  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(p => p._id === selectedProjectId);
      setSelectedProject(project);
      fetchPlots(selectedProjectId);
    } else {
      setSelectedProject(null);
      setPlots([]);
    }
  }, [selectedProjectId, projects]);

  const fetchProjects = async () => {
    try {
      const response = await projectAPI.getAll({ active: true });
      setProjects(response.data.data || []);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch projects');
      setLoading(false);
    }
  };

  const fetchPlots = async (projectId) => {
    try {
      const response = await plotAPI.getAll({ projectId });
      setPlots(response.data.data || []);
    } catch (err) {
      setError('Failed to fetch plots');
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

    if (!selectedProjectId) {
      setError('Please select a project first');
      return;
    }

    const submissionData = {
      ...formData,
      projectId: selectedProjectId,
      size: parseFloat(formData.size) || 0,
      rate: parseFloat(formData.rate) || 0,
      sqMtr: parseFloat(formData.sqMtr) || 0,
    };

    try {
      if (editingPlotId) {
        await plotAPI.update(editingPlotId, submissionData);
        setSuccess('Plot updated successfully!');
      } else {
        await plotAPI.create(submissionData);
        setSuccess('Plot added successfully!');
      }
      setFormData(initialFormState);
      setEditingPlotId(null);
      fetchPlots(selectedProjectId);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${editingPlotId ? 'update' : 'add'} plot`);
    }
  };

  const handleEdit = (plot) => {
    setEditingPlotId(plot._id);
    setFormData({
      plotNumber: plot.plotNumber || '',
      measurement: plot.measurement || '',
      sqMtr: plot.sqMtr || '',
      size: plot.size || '',
      east: plot.east || '',
      west: plot.west || '',
      north: plot.north || '',
      south: plot.south || '',
      rate: plot.rate || '',
      status: plot.status || 'vacant',
    });
    // Scroll to form for better UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingPlotId(null);
    setFormData(initialFormState);
  };

  const handleUpdateStatus = async (plotId, newStatus) => {
    try {
      await plotAPI.update(plotId, { status: newStatus });
      fetchPlots(selectedProjectId);
    } catch (err) {
      setError('Failed to update status');
    }
  };

  const handleDelete = async (plotId) => {
    if (window.confirm('Are you sure you want to delete this plot?')) {
      try {
        await plotAPI.deactivate(plotId);
        fetchPlots(selectedProjectId);
      } catch (err) {
        setError('Failed to delete plot');
      }
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-2 bg-gray-100 min-h-screen">
        
        {/* Section 1: Plot / Flat Details */}
        <div className="form-section mb-2 border-l-4 border-blue-500 shadow-sm">
          <div className="section-header">Plot / Flat Details</div>
          <div className="p-4 bg-white">
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="form-select w-full border-blue-300 focus:ring-blue-500 text-md py-2 font-semibold bg-blue-50/20"
            >
              <option value="">-- Select Project --</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.projectName}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-3 py-1 rounded mb-2 text-xs font-medium text-center shadow-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border-l-4 border-green-400 text-green-700 px-3 py-1 rounded mb-2 text-xs font-medium text-center shadow-sm">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
          
          {/* Section 2: Entry Form (Left) */}
          <div className="lg:col-span-3">
            <div className={`form-section border-t-2 ${editingPlotId ? 'border-orange-400' : 'border-blue-400'} shadow-sm`}>
              <div className="section-header flex justify-between items-center">
                <span>{editingPlotId ? 'Update Plot' : 'Plot/Unit Transaction'}</span>
                {editingPlotId && <button onClick={cancelEdit} className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-bold uppercase">Reset</button>}
              </div>
              <form onSubmit={handleSubmit} className="p-3 space-y-2 bg-white">
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 items-center">
                  <label className="form-label">Plot/Unit No.</label>
                  <input type="text" name="plotNumber" value={formData.plotNumber} onChange={handleChange} className="form-input font-bold text-blue-800" required />

                  <label className="form-label">Measurement</label>
                  <input type="text" name="measurement" value={formData.measurement} onChange={handleChange} className="form-input" />

                  <label className="form-label">Area Sq.Mtr.</label>
                  <input type="number" name="sqMtr" value={formData.sqMtr} onChange={handleChange} className="form-input" />

                  <label className="form-label">Area Sq.Ft.</label>
                  <input type="number" name="size" value={formData.size} onChange={handleChange} className="form-input font-semibold" required />

                  <label className="form-label">East</label>
                  <input type="text" name="east" value={formData.east} onChange={handleChange} className="form-input" />

                  <label className="form-label">West</label>
                  <input type="text" name="west" value={formData.west} onChange={handleChange} className="form-input" />

                  <label className="form-label">North</label>
                  <input type="text" name="north" value={formData.north} onChange={handleChange} className="form-input" />

                  <label className="form-label">South</label>
                  <input type="text" name="south" value={formData.south} onChange={handleChange} className="form-input" />

                  <label className="form-label text-blue-700 font-bold">Rate</label>
                  <input type="number" name="rate" value={formData.rate} onChange={handleChange} className="form-input border-blue-200" required />
                </div>
                <div className="pt-3">
                  <button type="submit" className={`${editingPlotId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#38bdf8] hover:bg-blue-500'} text-white w-full py-2 rounded font-black shadow-md transition-all active:scale-95 uppercase text-xs tracking-wider`}>
                    {editingPlotId ? 'Update Unit' : 'Submit'}
                  </button>
                  {editingPlotId && (
                    <button type="button" onClick={cancelEdit} className="mt-2 text-gray-500 text-[10px] font-bold uppercase w-full text-center">
                      Cancel Editing
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Section 3: Summary and Listing (Right) */}
          <div className="lg:col-span-9 space-y-2">
            <div className="form-section border-t-2 border-cyan-400 shadow-sm">
              <div className="section-header">Plot/Unit Transaction</div>
              
              <div className="overflow-x-auto p-2 bg-white">
                {/* Project Summary Table */}
                <table className="plots-summary-table w-full border-collapse text-[10px] text-center mb-4 ring-1 ring-gray-300">
                  <thead>
                    <tr>
                      <th className="border border-gray-400 p-1.5 uppercase font-black">Project Code</th>
                      <th className="border border-gray-400 p-1.5 uppercase font-black">Mauja</th>
                      <th className="border border-gray-400 p-1.5 uppercase font-black">Khasara</th>
                      <th className="border border-gray-400 p-1.5 uppercase font-black">Phn</th>
                      <th className="border border-gray-400 p-1.5 uppercase font-black">Taluka</th>
                      <th className="border border-gray-400 p-1.5 uppercase font-black">District</th>
                      <th className="border border-gray-400 p-1.5 uppercase font-black uppercase">No. of Plots</th>
                      <th className="border border-gray-400 p-1.5 uppercase font-black">Status</th>
                      <th className="border border-gray-400 p-1.5 uppercase font-black">Area</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="font-bold">
                      <td className="border border-gray-400 p-1 text-blue-900">{selectedProject?.projectCode || '-'}</td>
                      <td className="border border-gray-400 p-1">{selectedProject?.mauza || '-'}</td>
                      <td className="border border-gray-400 p-1">{selectedProject?.khasara || '-'}</td>
                      <td className="border border-gray-400 p-1">{selectedProject?.phn || '-'}</td>
                      <td className="border border-gray-400 p-1">{selectedProject?.taluka || '-'}</td>
                      <td className="border border-gray-400 p-1">{selectedProject?.district || '-'}</td>
                      <td className="border border-gray-400 p-1">{selectedProject?.totalPlots || '-'}</td>
                      <td className="border border-gray-400 p-1">{selectedProject?.status || '-'}</td>
                      <td className="border border-gray-400 p-1">{selectedProject?.area || '-'}</td>
                    </tr>
                    <tr className="font-bold text-red-600">
                      <td className="border border-gray-400 p-1 italic text-[8px]">Token</td>
                      <td className="border border-gray-400 p-1">{stats.token.count}</td>
                      <td className="border border-gray-400 p-1 italic text-[8px]">Agreement</td>
                      <td className="border border-gray-400 p-1">{stats.agreement.count}</td>
                      <td className="border border-gray-400 p-1 italic text-[8px]">Reg.</td>
                      <td className="border border-gray-400 p-1">{stats.reg.count}</td>
                      <td className="border border-gray-400 p-1 italic text-[8px]">Balance</td>
                      <td className="border border-gray-400 p-1 text-red-700 text-xs">{stats.balance.count}</td>
                      <td className="border border-gray-400 p-1"></td>
                    </tr>
                    <tr className="font-bold text-[#b45454]">
                      <td className="border border-gray-400 p-1 uppercase text-[8px]">Area(sq.ft.)</td>
                      <td className="border border-gray-400 p-1">{stats.token.area.toFixed(2)}</td>
                      <td className="border border-gray-400 p-1"></td>
                      <td className="border border-gray-400 p-1">{stats.agreement.area.toFixed(2)}</td>
                      <td className="border border-gray-400 p-1"></td>
                      <td className="border border-gray-400 p-1">{stats.reg.area.toFixed(2)}</td>
                      <td className="border border-gray-400 p-1"></td>
                      <td className="border border-gray-400 p-1">{stats.balance.area.toFixed(2)}</td>
                      <td className="border border-gray-400 p-1"></td>
                    </tr>
                  </tbody>
                </table>

                {/* Plot List Table */}
                <div className="section-header mb-1 text-[11px] py-1">Plot Unit List</div>
                <table className="plot-list-table w-full border-collapse text-[9px] text-center ring-1 ring-gray-300">
                  <thead>
                    <tr className="font-bold">
                      <th className="border border-gray-400 p-1">Plot No.</th>
                      <th className="border border-gray-400 p-1">Measure</th>
                      <th className="border border-gray-400 p-1">Area sq.mtr</th>
                      <th className="border border-gray-400 p-1">Area sq.ft</th>
                      <th className="border border-gray-400 p-1">East</th>
                      <th className="border border-gray-400 p-1">West</th>
                      <th className="border border-gray-400 p-1">North</th>
                      <th className="border border-gray-400 p-1">South</th>
                      <th className="border border-gray-400 p-1">Rate</th>
                      <th className="border border-gray-400 p-1">Status</th>
                      <th className="border border-gray-400 p-1 text-[8px]">Save Status</th>
                      <th className="border border-gray-400 p-1 text-[8px]">Edit</th>
                      <th className="border border-gray-400 p-1 text-[8px]">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plots.map((plot) => (
                      <tr key={plot._id} className={`transition-colors ${editingPlotId === plot._id ? 'bg-orange-50' : ''}`}>
                        <td className="border border-gray-400 p-1 font-bold text-gray-800">{plot.plotNumber}</td>
                        <td className="border border-gray-400 p-1">{plot.measurement || '-'}</td>
                        <td className="border border-gray-400 p-1">{plot.sqMtr || '-'}</td>
                        <td className="border border-gray-400 p-1 font-semibold">{plot.size}</td>
                        <td className="border border-gray-400 p-1 text-[8px]">{plot.east || '-'}</td>
                        <td className="border border-gray-400 p-1 text-[8px]">{plot.west || '-'}</td>
                        <td className="border border-gray-400 p-1 text-[8px]">{plot.north || '-'}</td>
                        <td className="border border-gray-400 p-1 text-[8px]">{plot.south || '-'}</td>
                        <td className="border border-gray-400 p-1 font-bold">{plot.rate}</td>
                        <td className="border border-gray-400 p-1">
                          <select 
                            value={plot.status} 
                            onChange={(e) => handleUpdateStatus(plot._id, e.target.value)}
                            className="bg-white border border-gray-300 rounded text-[8px] p-0 px-1 h-5 focus:ring-1 focus:ring-blue-400 outline-none"
                          >
                            <option value="vacant">Vacant</option>
                            <option value="booked">Booked</option>
                            <option value="sold">Sold</option>
                            <option value="hold">Hold</option>
                          </select>
                        </td>
                        <td className="border border-gray-400 p-1">
                          <button onClick={() => handleUpdateStatus(plot._id, plot.status)} className="action-btn-save hover:bg-gray-100 active:bg-gray-200 uppercase font-black text-[7px] px-1.5 py-0.5">Save</button>
                        </td>
                        <td className="border border-gray-400 p-1">
                          <button onClick={() => handleEdit(plot)} className={`transition-colors text-xs ${editingPlotId === plot._id ? 'text-orange-600 scale-125' : 'text-blue-500 hover:text-blue-700'}`}>✏️</button>
                        </td>
                        <td className="border border-gray-400 p-1">
                          <button onClick={() => handleDelete(plot._id)} className="text-red-500 hover:text-red-700 transition-all font-bold text-xs hover:scale-110">✕</button>
                        </td>
                      </tr>
                    ))}
                    {plots.length === 0 && (
                      <tr>
                        <td colSpan="12" className="p-10 text-gray-400 italic text-center font-medium">
                          No units mapped for this project. Start by adding one from the left panel.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Plots;
