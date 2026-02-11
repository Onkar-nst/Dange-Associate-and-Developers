const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const cors = require('cors');
const path = require('path');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Enable CORS
app.use(cors());

// Body parser middleware
app.use(express.json());

// Set static folder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route files
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const projectRoutes = require('./routes/projectRoutes');
const plotRoutes = require('./routes/plotRoutes');
const executiveRoutes = require('./routes/executiveRoutes');
const customerRoutes = require('./routes/customerRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const ledgerRoutes = require('./routes/ledgerRoutes');
const commissionRoutes = require('./routes/commissionRoutes');
const reportRoutes = require('./routes/reportRoutes');
const ledgerAccountRoutes = require('./routes/ledgerAccountRoutes');
const jvRoutes = require('./routes/jvRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// Mount routers
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/plots', plotRoutes);
app.use('/api/executives', executiveRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/currency', currencyRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ledger-accounts', ledgerAccountRoutes);
app.use('/api/jv', jvRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check route
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Land Developer Management System API',
        version: '1.0.0',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            projects: '/api/projects',
            plots: '/api/plots',
            executives: '/api/executives',
            customers: '/api/customers',
            transactions: '/api/transactions',
            currency: '/api/currency',
            ledger: '/api/ledger',
            commission: '/api/commission',
            reports: '/api/reports',
            ledgerAccounts: '/api/ledger-accounts'
        }
    });
});

// Error handler middleware (must be after routes)
app.use(errorHandler);

// Handle 404 routes
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found'
    });
});

// Export the app for Vercel
module.exports = app;

const PORT = process.env.PORT || 5000;

// Only listen if not in production/Vercel environment, or if on Render
if (process.env.NODE_ENV !== 'production' || process.env.RENDER) {
    app.listen(PORT, () => {
        console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
        console.log(`API Base URL: ${process.env.RENDER ? 'Render' : 'http://localhost:' + PORT}`);
    });
}
