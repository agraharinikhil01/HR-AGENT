import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthProvider.js';
import { RequireAuth } from './components/RequireAuth.js';
import { ErrorBoundary } from './components/ErrorBoundary.js';
import { AppLayout } from './components/AppLayout.js';

// Pages
import { Login } from './pages/Login.js';
import { RegisterOrg } from './pages/RegisterOrg.js';
import { Dashboard } from './pages/Dashboard.js';
import { JobsList } from './pages/JobsList.js';
import { CreateJob } from './pages/CreateJob.js';
import { CandidatesPipeline } from './pages/CandidatesPipeline.js';
import { CandidateDetail } from './pages/CandidateDetail.js';
import { InterviewsList } from './pages/InterviewsList.js';
import { OffersList } from './pages/OffersList.js';
import { CreateOffer } from './pages/CreateOffer.js';
import { PublicJobApply } from './pages/PublicJobApply.js';
import { PublicCandidateOfferPortal } from './pages/PublicCandidateOfferPortal.js';
import { PublicCareers } from './pages/PublicCareers.js';
import { CandidateDashboard } from './pages/CandidateDashboard.js';
import { BatchAtsScreener } from './pages/BatchAtsScreener.js';
import { Settings } from './pages/Settings.js';
import { useAuth } from './auth/AuthProvider.js';

const MainDashboardRouter: React.FC = () => {
  const { user } = useAuth();
  if (user?.role === 'CANDIDATE') {
    return <CandidateDashboard />;
  }
  return <Dashboard />;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Unauthenticated Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<RegisterOrg />} />
            <Route path="/careers" element={<PublicCareers />} />
            <Route path="/careers/:orgSlug/:jobSlug" element={<PublicJobApply />} />
            <Route path="/offers/view/:token" element={<PublicCandidateOfferPortal />} />

            {/* Authenticated Workspace Routes */}
            <Route
              path="/*"
              element={
                <RequireAuth>
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<MainDashboardRouter />} />
                      <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
                      <Route path="/jobs" element={<JobsList />} />
                      <Route path="/jobs/create" element={<CreateJob />} />
                      <Route path="/candidates" element={<CandidatesPipeline />} />
                      <Route path="/candidates/:id" element={<CandidateDetail />} />
                      <Route path="/ats-screener" element={<BatchAtsScreener />} />
                      <Route path="/interviews" element={<InterviewsList />} />
                      <Route path="/offers" element={<OffersList />} />
                      <Route path="/offers/create" element={<CreateOffer />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </AppLayout>
                </RequireAuth>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};
