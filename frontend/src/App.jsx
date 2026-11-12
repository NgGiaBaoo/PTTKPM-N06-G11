import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Jobs from './pages/Jobs'
import JobForm from './pages/JobForm'
import Applications from './pages/Applications'
import Employers from './pages/Employers'
import Candidates from './pages/Candidates'
import Users from './pages/Users'
import BrowseJobs from './pages/BrowseJobs'
import JobDetail from './pages/JobDetail'
import MyApplications from './pages/MyApplications'
import Profile from './pages/Profile'
import CompanyProfile from './pages/CompanyProfile'
import EmployerApplications from './pages/EmployerApplications'
import Programs from './pages/Programs'
import Notifications from './pages/Notifications'
import Security from './pages/Security'
import VerificationRequests from './pages/VerificationRequests'
import VerifyEmail from './pages/VerifyEmail'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ContentReports from './pages/ContentReports'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />

            <Route path="/jobs" element={<Jobs />} />
            <Route path="/jobs/new" element={<JobForm />} />
            <Route path="/jobs/:id/edit" element={<JobForm />} />
            <Route path="/jobs/browse" element={<BrowseJobs />} />
            <Route path="/jobs/:id" element={<JobDetail />} />

            <Route path="/applications" element={<Applications />} />
            <Route path="/candidate/applications" element={<MyApplications />} />
            <Route path="/employer/applications" element={<EmployerApplications />} />

            <Route path="/employers" element={<Employers />} />
            <Route path="/candidates" element={<Candidates />} />
            <Route path="/users" element={<Users />} />
            <Route path="/employer/company" element={<CompanyProfile />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/security" element={<Security />} />
            <Route path="/verification-requests" element={<VerificationRequests />} />
            <Route path="/content-reports" element={<ContentReports />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
