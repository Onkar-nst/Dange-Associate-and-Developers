import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/explore/:id" element={<PublicProjectStatus />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:id/status"
            element={
              <ProtectedRoute>
                <ProjectStatus />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />

          <Route
            path="/plots"
            element={
              <ProtectedRoute>
                <Plots />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <ProtectedRoute>
                <Customers />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customers/:id"
            element={
              <ProtectedRoute>
                <CustomerDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/transactions"
            element={
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/commissions"
            element={
              <ProtectedRoute>
                <Commissions />
              </ProtectedRoute>
            }
          />

          <Route
            path="/executives"
            element={
              <ProtectedRoute>
                <Executives />
              </ProtectedRoute>
            }
          />

          <Route
            path="/ledger-accounts"
            element={
              <ProtectedRoute>
                <LedgerAccounts />
              </ProtectedRoute>
            }
          />

          <Route
            path="/customer-status"
            element={
              <ProtectedRoute>
                <CustomerStatus />
              </ProtectedRoute>
            }
          />

          <Route
            path="/party-ledger"
            element={
              <ProtectedRoute>
                <PartyLedger />
              </ProtectedRoute>
            }
          />

          <Route
            path="/jv-entry"
            element={
              <ProtectedRoute>
                <JVEntry />
              </ProtectedRoute>
            }
          />

          <Route path="/report/customer-statement" element={<ProtectedRoute><CustomerStatementReport /></ProtectedRoute>} />
          <Route path="/report/sales" element={<ProtectedRoute><SalesReportDetailed /></ProtectedRoute>} />
          <Route path="/report/direct-statement" element={<ProtectedRoute><DirectCustomerStatement /></ProtectedRoute>} />
          <Route path="/report/outstanding" element={<ProtectedRoute><CustomerOutstandingReport /></ProtectedRoute>} />
          <Route path="/report/dues" element={<ProtectedRoute><CustomerDuesReport /></ProtectedRoute>} />
          <Route path="/report/cash-book" element={<ProtectedRoute><CashBook /></ProtectedRoute>} />
          <Route path="/report/daily-collection" element={<ProtectedRoute><DailyCollectionRegister /></ProtectedRoute>} />
          <Route path="/report/sales-position/:projectId" element={<ProtectedRoute><SalesPositionDetailed /></ProtectedRoute>} />

          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['The Boss']}>
                <Users />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
