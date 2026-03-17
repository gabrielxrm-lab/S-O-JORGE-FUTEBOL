/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Players } from './pages/Players';
import { Payments } from './pages/Payments';
import { MatchSummary } from './pages/MatchSummary';
import { Ranking } from './pages/Ranking';
import { TeamDraw } from './pages/TeamDraw';
import { Login } from './pages/Login';
import { Users } from './pages/Users';
import { History } from './pages/History';
import { Toaster } from 'react-hot-toast';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
          success: {
            iconTheme: { primary: '#10b981', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }} />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="players" element={<Players />} />
            <Route path="payments" element={<Payments />} />
            <Route path="summary" element={<MatchSummary />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="draw" element={<TeamDraw />} />
            <Route path="login" element={<Login />} />
            <Route path="users" element={<Users />} />
            <Route path="history" element={<History />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
