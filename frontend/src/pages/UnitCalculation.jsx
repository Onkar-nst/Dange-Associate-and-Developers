import React, { useState, useEffect } from 'react';
import { projectAPI, plotAPI } from '../api/services';

const UnitCalculation = () => {
    const [projects, setProjects] = useState([]);
    const [plots, setPlots] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [calc, setCalc] = useState({
        projectId: '',
        plotId: '',
        area: 0,
        rate: 0,
        total: 0,
        dp: 0,
        balance: 0,
        emiCount: 35,
        emiAmount: 0
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const res = await projectAPI.getAll();
            setProjects(res.data.data || []);
        } catch (err) { console.error(err); }
    };

    const fetchPlots = async (projectId) => {
        if (!projectId) return;
        setLoading(true);
        try {
            const res = await plotAPI.getAll({ project: projectId });
            setPlots(res.data.data || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleProjectChange = (e) => {
        const id = e.target.value;
        setCalc({ ...calc, projectId: id, plotId: '', area: 0 });
        fetchPlots(id);
    };

    const handlePlotChange = (e) => {
        const id = e.target.value;
        const plot = plots.find(p => p._id === id);
        if (plot) {
            const area = plot.size || 0;
            updateValues({ ...calc, plotId: id, area: area });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        updateValues({ ...calc, [name]: parseFloat(value) || 0 });
    };

    const updateValues = (newCalc) => {
        const total = newCalc.area * newCalc.rate;
        const dp = total * 0.20;
        const balance = total - dp;
        const emiAmount = newCalc.emiCount > 0 ? balance / newCalc.emiCount : 0;

        setCalc({
            ...newCalc,
            total,
            dp,
            balance,
            emiAmount
        });
    };

    const InputLabel = ({ children }) => (
        <label className="text-sm font-bold text-slate-700 block mb-1 text-center">{children}</label>
    );

    return (
        <div className="max-w-7xl mx-auto py-10 px-4 animate-fade-in">
            <div className="flex flex-col items-center gap-6">
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Unit Calculation</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Financial Planning Calculator</p>
                </div>

                <div className="w-full max-w-[300px] bg-white p-3 rounded-xl shadow-lg border border-slate-200">
                    <div className="space-y-1">
                        {/* Project Selection */}
                        <div className="flex items-center gap-2">
                            <label className="text-[9px] font-bold text-slate-500 w-16 uppercase">Project</label>
                            <select 
                                name="projectId" 
                                value={calc.projectId} 
                                onChange={handleProjectChange}
                                className="flex-1 border border-rose-300 rounded px-1.5 py-0.5 text-[9px] focus:outline-none bg-white font-medium"
                            >
                                <option value="">Select</option>
                                {projects.map(p => <option key={p._id} value={p._id}>{p.projectName}</option>)}
                            </select>
                        </div>

                        {/* Plot Selection */}
                        <div className="flex items-center gap-2">
                            <label className="text-[9px] font-bold text-slate-500 w-16 uppercase">Plot</label>
                            <select 
                                name="plotId" 
                                value={calc.plotId} 
                                onChange={handlePlotChange}
                                className="flex-1 border border-rose-300 rounded px-1.5 py-0.5 text-[9px] focus:outline-none bg-white font-medium"
                            >
                                <option value="">Select</option>
                                {plots.map(p => <option key={p._id} value={p._id}>{p.plotNumber}</option>)}
                            </select>
                        </div>

                        {/* Area */}
                        <div className="flex items-center gap-2">
                            <label className="text-[9px] font-bold text-slate-500 w-16 uppercase">Area Sq.Ft.</label>
                            <input 
                                type="number" 
                                name="area"
                                value={calc.area}
                                onChange={handleInputChange}
                                className="flex-1 border border-orange-300 bg-slate-50 rounded px-1.5 py-0.5 text-[9px] text-right font-black"
                            />
                        </div>

                        {/* Rate */}
                        <div className="flex items-center gap-2">
                            <label className="text-[9px] font-bold text-slate-500 w-16 uppercase">Rate</label>
                            <input 
                                type="number" 
                                name="rate"
                                placeholder="Rates"
                                value={calc.rate || ''}
                                onChange={handleInputChange}
                                className="flex-1 border-2 border-blue-400 rounded px-1.5 py-0.5 text-[9px] text-right font-black shadow-[0_0_5px_rgba(59,130,246,0.1)]"
                            />
                        </div>

                        <div className="h-px bg-slate-100 my-0.5"></div>

                        {/* Total */}
                        <div className="flex items-center gap-2">
                            <label className="text-[9px] font-black text-slate-700 w-16 uppercase tracking-tighter">Total</label>
                            <input 
                                type="text" 
                                readOnly
                                value={calc.total.toLocaleString('en-IN')}
                                className="flex-1 border border-orange-300 bg-slate-50 rounded px-1.5 py-0.5 text-[9px] text-right font-black"
                            />
                        </div>

                        {/* D.P. 20% */}
                        <div className="flex items-center gap-2">
                            <label className="text-[9px] font-black text-slate-700 w-16 uppercase tracking-tighter">D.P. 20%</label>
                            <input 
                                type="text"
                                readOnly
                                value={calc.dp.toLocaleString('en-IN')}
                                className="flex-1 border border-orange-300 bg-slate-50 rounded px-1.5 py-0.5 text-[9px] text-right font-black text-rose-600"
                            />
                        </div>

                        {/* Balance */}
                        <div className="flex items-center gap-2">
                            <label className="text-[9px] font-black text-slate-700 w-16 uppercase tracking-tighter">Balance</label>
                            <input 
                                type="text"
                                readOnly
                                value={calc.balance.toLocaleString('en-IN')}
                                className="flex-1 border border-orange-300 bg-slate-50 rounded px-1.5 py-0.5 text-[9px] text-right font-black"
                            />
                        </div>

                        {/* Nos. of EMI */}
                        <div className="flex items-center gap-2">
                            <label className="text-[9px] font-black text-slate-700 w-16 uppercase tracking-tighter">EMI Nos.</label>
                            <input 
                                type="number"
                                name="emiCount"
                                value={calc.emiCount}
                                onChange={handleInputChange}
                                className="flex-1 border border-orange-300 bg-slate-50 rounded px-1.5 py-0.5 text-[9px] text-right font-black"
                            />
                        </div>

                        {/* EMI Amount */}
                        <div className="flex items-center gap-2 bg-emerald-50 p-1 rounded border border-emerald-100">
                            <label className="text-[9px] font-black text-emerald-700 w-16 uppercase tracking-tighter">EMI Amt</label>
                            <input 
                                type="text"
                                readOnly
                                value={Math.round(calc.emiAmount).toLocaleString('en-IN')}
                                className="flex-1 bg-transparent text-[10px] text-right font-black text-emerald-800"
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] mt-10 pb-10">Dange Associates Financial Engine © 2026</p>
        </div>
    );
};

export default UnitCalculation;
