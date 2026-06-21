import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ProverList } from './pages/provers/ProverList';
import { ProverRegistration } from './pages/provers/ProverRegistration';
import { ProverDetail } from './pages/provers/ProverDetail';
import { ProviderList } from './pages/providers/ProviderList';
import { ProviderRegistration } from './pages/providers/ProviderRegistration';
import { BridgeConfiguration } from './pages/providers/BridgeConfiguration';
import { AnalyticsDashboard } from './pages/analytics/AnalyticsDashboard';
import { EmergencyPause } from './pages/emergency/EmergencyPause';
import { EditionSwitch } from './pages/edition/EditionSwitch';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        
        {/* Prover Management */}
        <Route path="provers" element={<ProverList />} />
        <Route path="provers/register" element={<ProverRegistration />} />
        <Route path="provers/:proverId" element={<ProverDetail />} />
        
        {/* Provider Management */}
        <Route path="providers" element={<ProviderList />} />
        <Route path="providers/register" element={<ProviderRegistration />} />
        <Route path="providers/bridge" element={<BridgeConfiguration />} />
        
        {/* Analytics */}
        <Route path="analytics" element={<AnalyticsDashboard />} />
        
        {/* System Management */}
        <Route path="emergency" element={<EmergencyPause />} />
        <Route path="edition" element={<EditionSwitch />} />
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;