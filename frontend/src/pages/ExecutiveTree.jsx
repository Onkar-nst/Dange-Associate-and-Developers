import React, { useState, useEffect, useMemo } from 'react';
import { reportAPI } from '../api/services';
import Layout from '../components/Layout';

const ExecutiveTree = () => {
    const [treeData, setTreeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchTree();
    }, []);

    const fetchTree = async () => {
        try {
            const res = await reportAPI.getExecutiveTree();
            setTreeData(res.data.data || []);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch executive hierarchy');
            setLoading(false);
        }
    };

    // Recursive search in the tree
    const findSubtree = (nodes, term) => {
        if (!term) return nodes;
        
        const lowerTerm = term.toLowerCase();
        
        for (const node of nodes) {
            // Check if current node matches
            if (node.label.toLowerCase().includes(lowerTerm) || (node.code && node.code.toLowerCase().includes(lowerTerm))) {
                return [node]; // Found the match, return it as the new root
            }
            
            // Search in children
            if (node.children && node.children.length > 0) {
                const result = findSubtree(node.children, term);
                if (result.length > 0) return result;
            }
        }
        return [];
    };

    const filteredData = useMemo(() => {
        if (!searchTerm) return treeData;
        return findSubtree(treeData, searchTerm);
    }, [treeData, searchTerm]);

    const TreeNode = ({ node, isLast = false, isRoot = false }) => {
        const [isExpanded, setIsExpanded] = useState(true);
        const hasChildren = node.children && node.children.length > 0;

        return (
            <div className="relative pl-10 h-auto">
                {/* Vertical line: from top to midway if not root */}
                {!isRoot && (
                    <div 
                        className={`absolute left-0 top-0 w-[2px] bg-white/50 ${isLast ? 'h-6' : 'h-full'}`}
                    ></div>
                )}
                
                {/* Horizontal line: from vertical line to box */}
                {!isRoot && (
                    <div className="absolute left-0 top-6 w-10 h-[2px] bg-white/50"></div>
                )}

                <div className="mb-6">
                    <div className="inline-flex items-center gap-2">
                        {/* Box Holder */}
                        <div 
                            className={`relative border-2 rounded-lg px-5 py-3 transition-all duration-300 shadow-lg min-w-[240px] max-w-[320px] ${
                                isRoot 
                                ? 'bg-white border-white' 
                                : 'bg-transparent border-white/80 hover:bg-white/10'
                            }`}
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            <div className="flex flex-col">
                                <span className={`${isRoot ? 'text-orange-600' : 'text-white'} font-black text-sm uppercase tracking-wide truncate`}>
                                    {node.label} {node.code ? `- ${node.code}` : ''}
                                </span>
                                
                                <div className={`flex flex-wrap gap-x-4 gap-y-1 mt-2 border-t pt-2 ${isRoot ? 'border-orange-100' : 'border-white/20'}`}>
                                    <div className={`text-[10px] font-bold uppercase ${isRoot ? 'text-gray-500' : 'text-white/70'}`}>
                                        Earned: <span className={isRoot ? 'text-gray-900 font-black' : 'text-white font-black'}>₹{node.stats.earned.toLocaleString()}</span>
                                    </div>
                                    <div className={`text-[10px] font-bold uppercase ${isRoot ? 'text-gray-500' : 'text-white/70'}`}>
                                        Bal: <span className={isRoot ? 'text-emerald-600 font-black' : 'text-white font-black'}>₹{node.stats.balance.toLocaleString()}</span>
                                    </div>
                                    {node.percentage > 0 && (
                                        <div className={`text-[10px] font-black uppercase ${isRoot ? 'text-blue-600' : 'text-yellow-300'}`}>
                                            Comm: {node.percentage}%
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expand/Collapse Indicator */}
                            {hasChildren && (
                                <div className={`absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] cursor-pointer shadow-md ${
                                    isRoot ? 'bg-orange-600 border-white text-white' : 'bg-white border-transparent text-orange-600'
                                }`}>
                                    {isExpanded ? '−' : '+'}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recursive Descent */}
                    {hasChildren && isExpanded && (
                        <div className="mt-2">
                            {node.children.map((child, idx) => (
                                <TreeNode 
                                    key={child.id} 
                                    node={child} 
                                    isLast={idx === node.children.length - 1} 
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh] bg-[#E66754]">
            <div className="text-white font-black animate-pulse uppercase tracking-[0.4em]">Rendering Hierarchy...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#E66754] font-sans selection:bg-white/30">
            {/* Top Toolbar */}
            <div className="sticky top-0 z-50 bg-[#E66754]/95 backdrop-blur-md px-6 py-4 border-b border-white/20 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🌲</span>
                    <h2 className="text-white font-black uppercase tracking-widest text-lg">Executive Network</h2>
                </div>
                
                {/* Search Box */}
                <div className="relative w-full md:w-96">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50">🔍</span>
                    <input 
                        type="text" 
                        placeholder="Search by Name or DAB Code..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/10 border border-white/30 rounded-full py-2.5 pl-11 pr-4 text-white placeholder:text-white/50 focus:outline-none focus:bg-white/20 focus:border-white transition-all text-sm font-bold shadow-inner"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-red-300 transition-colors font-black"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            <div className="p-8 md:p-12 overflow-x-auto">
                {error && (
                    <div className="max-w-2xl mx-auto p-4 bg-red-900/30 text-white rounded-xl border border-red-500/50 text-sm font-bold shadow-2xl backdrop-blur-sm animate-shake">
                        ⚠️ ERROR: {error}
                    </div>
                )}

                <div className="relative pb-32">
                    {filteredData.length > 0 ? (
                        <div className="flex flex-col gap-16">
                            {filteredData.map((root) => (
                                <div key={root.id} className="relative">
                                    <TreeNode node={root} isRoot={true} />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-48 text-center bg-black/10 rounded-3xl border border-white/10 border-dashed">
                            <p className="text-white font-black uppercase tracking-widest text-lg opacity-40">Record Not Found</p>
                            <p className="text-white/40 text-[11px] mt-2 font-bold italic">"${searchTerm}" ke liye koi result nahi mila.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExecutiveTree;
