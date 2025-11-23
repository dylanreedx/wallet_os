import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { BottomNav } from '@/components/navigation/BottomNav';
import LoginPage from '@/features/auth/LoginPage';
import VerifyPage from '@/features/auth/VerifyPage';
import Dashboard from '@/features/dashboard/Dashboard';
import ExpensesPage from '@/features/expenses/ExpensesPage';
import GoalsPage from '@/features/goals/GoalsPage';
import GoalDetailPage from '@/features/goals/GoalDetailPage';
import BudgetPage from '@/features/budget/BudgetPage';
import ProfilePage from '@/features/social/ProfilePage';
import InvitePage from '@/features/social/InvitePage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { sessionId, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!sessionId) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { sessionId } = useAuth();

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={sessionId ? <Navigate to="/" replace /> : <LoginPage />}
        />
        <Route path="/auth/verify" element={<VerifyPage />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <ExpensesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <GoalsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals/:id"
          element={
            <ProtectedRoute>
              <GoalDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/budget"
          element={
            <ProtectedRoute>
              <BudgetPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      {sessionId && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-background">
        <AppRoutes />
      </div>
    </AuthProvider>
  );
}
