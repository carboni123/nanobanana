import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Usage from './pages/Usage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes (no layout) */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes (with layout) */}
        <Route
          path="/dashboard"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/api-keys"
          element={
            <Layout>
              <div className="text-center py-12">
                <h1 className="text-3xl font-bold text-gray-900">API Keys</h1>
                <p className="mt-4 text-gray-600">API Keys page - Coming soon</p>
              </div>
            </Layout>
          }
        />
        <Route
          path="/usage"
          element={
            <Layout>
              <Usage />
            </Layout>
          }
        />

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
