import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CRM from './pages/CRM';
import Projects from './pages/Projects';
import Plots from './pages/Plots';
import Customers from './pages/Customers';
import Transactions from './pages/Transactions';
import Users from './pages/Users';
import Commissions from './pages/Commissions';
import Executives from './pages/Executives';
import LedgerAccounts from './pages/LedgerAccounts';
import CustomerStatus from './pages/CustomerStatus';
import PartyLedger from './pages/PartyLedger';
import JVEntry from './pages/JVEntry';
import CustomerStatementReport from './pages/CustomerStatementReport';
import SalesReportDetailed from './pages/SalesReportDetailed';
import ExecutiveSalesReport from './pages/ExecutiveSalesReport';
import DirectCustomerStatement from './pages/DirectCustomerStatement';
import CustomerOutstandingReport from './pages/CustomerOutstandingReport';
import CustomerDuesReport from './pages/CustomerDuesReport';
import CashBook from './pages/CashBook';
import SalesPositionDetailed from './pages/SalesPositionDetailed';
import DailyCollectionRegister from './pages/DailyCollectionRegister';
import CustomerDetail from './pages/CustomerDetail';
import ProjectStatus from './pages/ProjectStatus';
import Explore from './pages/Explore';
import PublicProjectStatus from './pages/PublicProjectStatus';
import AIChatbot from './pages/AIChatbot';
import MonthlyEMIReminder from './pages/MonthlyEMIReminder';
import TokenByExecutive from './pages/TokenByExecutive';
import ExecutiveCustomerReminder from './pages/ExecutiveCustomerReminder';
import ProjectSummary from './pages/ProjectSummary';
import UnitCalculation from './pages/UnitCalculation';
import UserDailyCollection from './pages/UserDailyCollection';
import CustomerEMIDues from './pages/CustomerEMIDues';

const RootRedirect = () => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? "/dashboard" : "/explore"} replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/explore/:id" element={<PublicProjectStatus />} />

          {/* Root Redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* Protected Routes with Persistent Layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/crm" element={<CRM />} />
            <Route path="/projects/:id/status" element={<ProjectStatus />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/plots" element={<Plots />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/commissions" element={<Commissions />} />
            <Route path="/executives" element={<Executives />} />
            <Route path="/ledger-accounts" element={<LedgerAccounts />} />
            <Route path="/customer-status" element={<CustomerStatus />} />
            <Route path="/party-ledger" element={<PartyLedger />} />
            <Route path="/jv-entry" element={<JVEntry />} />
            <Route path="/report/customer-statement" element={<CustomerStatementReport />} />
            <Route path="/report/sales" element={<SalesReportDetailed />} />
            <Route path="/report/executive-sales" element={<ExecutiveSalesReport />} />
            <Route path="/report/direct-statement" element={<DirectCustomerStatement />} />
            <Route path="/report/outstanding" element={<CustomerOutstandingReport />} />
            <Route path="/report/dues" element={<CustomerDuesReport />} />
            <Route path="/report/cash-book" element={<CashBook />} />
            <Route path="/report/daily-collection" element={<DailyCollectionRegister />} />
            <Route path="/report/sales-position/:projectId" element={<SalesPositionDetailed />} />
            <Route path="/report/monthly-emi-reminder" element={<MonthlyEMIReminder />} />
            <Route path="/report/token-by-executive" element={<TokenByExecutive />} />
            <Route path="/report/executive-reminder" element={<ExecutiveCustomerReminder />} />
            <Route path="/report/project-summary" element={<ProjectSummary />} />
            <Route path="/report/unit-calculation" element={<UnitCalculation />} />
            <Route path="/report/user-daily-collection" element={<UserDailyCollection />} />
            <Route path="/report/customer-emi-dues" element={<CustomerEMIDues />} />
            <Route path="/ai-assistant" element={<AIChatbot />} />
            
            {/* Restricted Routes */}
            <Route element={<ProtectedRoute allowedRoles={['The Boss']} />}>
                <Route path="/users" element={<Users />} />
            </Route>
          </Route>
          
          {/* Catch all - redirect based on auth */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
