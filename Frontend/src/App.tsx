import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import EventDetails from './pages/EventDetails';
import Dashboard from './pages/Dashboard';
import { WalletProvider } from './contexts/WalletContext';
import { EventsProvider } from './contexts/EventsContext';
import AdminPage from './pages/Admin';

function App() {
  return (
    <WalletProvider>
      <EventsProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/event/:id" element={<EventDetails />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<AdminPage />} />
          </Routes>
        </Layout>
      </EventsProvider>
    </WalletProvider>
  );
}

export default App;