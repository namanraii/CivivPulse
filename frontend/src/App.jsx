import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import IssueMap from './components/IssueMap';
import ReportForm from './components/ReportForm';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="map" element={<IssueMap />} />
          <Route path="report" element={<ReportForm />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
