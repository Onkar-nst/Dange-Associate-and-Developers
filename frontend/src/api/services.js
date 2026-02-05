import axiosInstance from './axios';

// Authentication
export const authAPI = {
    login: (credentials) => axiosInstance.post('/auth/login', credentials),
    getCurrentUser: () => axiosInstance.get('/auth/me'),
};

// Projects
export const projectAPI = {
    getAll: (params) => axiosInstance.get('/projects', { params }),
    getById: (id) => axiosInstance.get(`/projects/${id}`),
    create: (data) => axiosInstance.post('/projects', data),
    update: (id, data) => axiosInstance.put(`/projects/${id}`, data),
    delete: (id) => axiosInstance.delete(`/projects/${id}`),
};

// Plots
export const plotAPI = {
    getAll: (params) => axiosInstance.get('/plots', { params }),
    getById: (id) => axiosInstance.get(`/plots/${id}`),
    getStats: (projectId) => axiosInstance.get(`/plots/stats/${projectId}`),
    create: (data) => axiosInstance.post('/plots', data),
    bulkCreate: (data) => axiosInstance.post('/plots/bulk', data),
    update: (id, data) => axiosInstance.put(`/plots/${id}`, data),
};

// Customers
export const customerAPI = {
    getAll: (params) => axiosInstance.get('/customers', { params }),
    getById: (id) => axiosInstance.get(`/customers/${id}`),
    getSummary: (id) => axiosInstance.get(`/customers/${id}/summary`),
    create: (data) => axiosInstance.post('/customers', data),
    update: (id, data) => axiosInstance.put(`/customers/${id}`, data),
    delete: (id) => axiosInstance.delete(`/customers/${id}`),
};

// Transactions
export const transactionAPI = {
    getAll: (params) => axiosInstance.get('/transactions', { params }),
    getByCustomer: (customerId) => axiosInstance.get(`/transactions/${customerId}`),
    create: (data) => axiosInstance.post('/transactions', data),
};

// Executives
export const executiveAPI = {
    getAll: (params) => axiosInstance.get('/executives', { params }),
    getById: (id) => axiosInstance.get(`/executives/${id}`),
    create: (data) => axiosInstance.post('/executives', data),
    update: (id, data) => axiosInstance.put(`/executives/${id}`, data),
    delete: (id) => axiosInstance.delete(`/executives/${id}`),
};

// Users
export const userAPI = {
    getAll: (params) => axiosInstance.get('/users', { params }),
    getList: () => axiosInstance.get('/users/list'),
    create: (data) => axiosInstance.post('/users', data),
    update: (id, data) => axiosInstance.put(`/users/${id}`, data),
    delete: (id) => axiosInstance.delete(`/users/${id}`),
    resetPassword: (id, newPassword) =>
        axiosInstance.put(`/users/${id}/resetpassword`, { newPassword }),
};

// Commissions
export const commissionAPI = {
    getRules: () => axiosInstance.get('/commission/rules'),
    createRule: (data) => axiosInstance.post('/commission/rules', data),
    getExecutiveLedger: (id) => axiosInstance.get(`/commission/executive/${id}`),
    pay: (data) => axiosInstance.post('/commission/pay', data),
};

// Ledger Accounts
export const ledgerAPI = {
    getAll: () => axiosInstance.get('/ledger-accounts'),
    create: (data) => axiosInstance.post('/ledger-accounts', data),
    update: (id, data) => axiosInstance.put(`/ledger-accounts/${id}`, data),
    getTransactions: (id) => axiosInstance.get(`/ledger-accounts/${id}/transactions`),
    createEntry: (data) => axiosInstance.post('/ledger', data),
};

// Reports
export const reportAPI = {
    getLedger: (params) => axiosInstance.get('/reports/ledger', { params }),
    getSales: (params) => axiosInstance.get('/reports/sales', { params }),
    getCollection: (params) => axiosInstance.get('/reports/collection', { params }),
    getOutstanding: (params) => axiosInstance.get('/reports/outstanding', { params }),
    getExecutivePerformance: (params) => axiosInstance.get('/reports/executive-performance', { params }),
    getCustomerStatement: (params) => axiosInstance.get('/reports/customer-statement', { params }),
    getDues: (params) => axiosInstance.get('/reports/dues', { params }),
    getCashBook: (params) => axiosInstance.get('/reports/cash-book', { params }),
    getProjectSummary: () => axiosInstance.get('/reports/dashboard-project-summary'),
    getSalesPosition: () => axiosInstance.get('/reports/dashboard-sales-position'),
    getRPSummary: () => axiosInstance.get('/reports/dashboard-rp-summary'),
    getDailyCollection: (params) => axiosInstance.get('/reports/daily-collection', { params }),
};

// JV Entry
export const jvAPI = {
    getAll: () => axiosInstance.get('/jv'),
    create: (data) => axiosInstance.post('/jv', data),
    delete: (id) => axiosInstance.delete(`/jv/${id}`),
};
