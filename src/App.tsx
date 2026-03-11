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

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="players" element={<Players />} />
            <Route path="payments" element={<Payments />} />
            <Route path="summary" element={<MatchSummary />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="draw" element={<TeamDraw />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
