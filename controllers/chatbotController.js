const { GoogleGenerativeAI } = require('@google/generative-ai');
const Project = require('../models/Project');
const Plot = require('../models/Plot');
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const Executive = require('../models/Executive');
const LedgerAccount = require('../models/LedgerAccount');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Get database context for AI
// @route   GET /api/chatbot/context
// @access  Private
exports.getContext = async (req, res) => {
    try {
        // Fetch summary data from all collections
        const [projects, plots, customers, transactions, executives, ledgerAccounts] = await Promise.all([
            Project.find().select('projectName projectCode status totalPlots mauza taluka district').lean(),
            Plot.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalSize: { $sum: '$size' }
                    }
                }
            ]),
            Customer.find().select('customerName phone plotId totalAmount paidAmount status').populate('plotId', 'plotNumber projectId').lean(),
            Transaction.aggregate([
                {
                    $group: {
                        _id: '$transactionType',
                        count: { $sum: 1 },
                        totalAmount: { $sum: '$amount' }
                    }
                }
            ]),
            Executive.find().select('name phone role commission').lean(),
            LedgerAccount.find().select('accountName accountType balance').lean()
        ]);

        // Calculate business metrics
        const totalCustomers = customers.length;
        const totalOutstanding = customers.reduce((sum, c) => sum + ((c.totalAmount || 0) - (c.paidAmount || 0)), 0);
        const totalCollected = customers.reduce((sum, c) => sum + (c.paidAmount || 0), 0);

        const context = {
            timestamp: new Date().toISOString(),
            businessSummary: {
                totalProjects: projects.length,
                activeProjects: projects.filter(p => p.status === 'Active').length,
                totalCustomers,
                totalOutstanding,
                totalCollected,
                totalExecutives: executives.length
            },
            projects: projects.map(p => ({
                name: p.projectName,
                code: p.projectCode,
                status: p.status,
                plots: p.totalPlots,
                location: `${p.mauza}, ${p.taluka}, ${p.district}`
            })),
            plotStatus: plots,
            customerList: customers.slice(0, 50).map(c => ({
                name: c.customerName,
                phone: c.phone,
                plot: c.plotId?.plotNumber || 'N/A',
                totalAmount: c.totalAmount,
                paid: c.paidAmount,
                outstanding: (c.totalAmount || 0) - (c.paidAmount || 0),
                status: c.status
            })),
            transactionSummary: transactions,
            executives: executives.map(e => ({
                name: e.name,
                role: e.role,
                commission: e.commission
            })),
            ledgerAccounts: ledgerAccounts.map(l => ({
                name: l.accountName,
                type: l.accountType,
                balance: l.balance
            }))
        };

        res.status(200).json({
            success: true,
            data: context
        });
    } catch (error) {
        console.error('Context fetch error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch database context'
        });
    }
};

// @desc    Query AI with user question
// @route   POST /api/chatbot/query
// @access  Private
exports.query = async (req, res) => {
    try {
        const { question, context } = req.body;

        if (!question) {
            return res.status(400).json({
                success: false,
                error: 'Question is required'
            });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'GEMINI_API_KEY not configured'
            });
        }

        // Use smaller Gemma model with less demand
        const model = genAI.getGenerativeModel({ model: 'gemma-3-4b-it' });

        const systemPrompt = `You are a sophisticated Business Intelligence AI for "Dange Associates & Developers".

DATA CONTEXT:
${JSON.stringify(context, null, 2)}

ROLE & BEHAVIOR:
- You are a senior data analyst. Your goal is to provide actionable insights.
- When asked a question, analyze the data deeply before answering.
- If the user asks about "status", "performance", "list", or "summary", AUTOMATICALLY provide a visualization.

CRITICAL VISUALIZATION RULES:
- **NEVER** use Markdown tables (e.g. | Col1 | Col2 |).
- **ALWAYS** use the special JSON block for tables, lists, and charts.
- **ALWAYS** include a JSON block for ANY structured data (customer lists, transaction logs, etc).

JSON FORMAT STRUCTURE:
Format: |||CHART||| <JSON_DATA> |||END_CHART|||

Types:
1. "table" -> For lists, comparisons, logs.
2. "bar" -> For comparing projects, executives, revenue.
3. "pie" -> For status breakdowns (Paid vs Pending).

Example Table:
|||CHART|||
{"type":"table","title":"Customer List","headers":["Name","Mobile","Amount"],"rows":[["John Doe","9876543210","₹50,000"]]}
|||END_CHART|||

Example Bar Chart:
|||CHART|||
{"type":"bar","title":"Revenue by Project","labels":["Proj A","Proj B"],"data":[50000,75000],"label":"Revenue (₹)"}
|||END_CHART|||

FORMATTING:
- Format all currency in Indian Rupees (₹1.5L, ₹50k).
- Use professional executive tone.

User Question: ${question}`;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({
            success: true,
            data: {
                answer: text,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('AI Query error:', error);

        // Check for quota exceeded error
        if (error.message && error.message.includes('429')) {
            return res.status(429).json({
                success: false,
                error: 'API quota exceeded. Please wait a minute and try again, or upgrade your Gemini API plan at https://ai.google.dev/pricing'
            });
        }

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to process AI query'
        });
    }
};