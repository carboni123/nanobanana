import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="text-2xl">🍌</div>
              <span className="text-xl font-bold text-gray-900">
                Nano<span className="text-banana-500">Banana</span>
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex space-x-4">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-banana-500 text-gray-900'
                  : 'text-gray-700 hover:bg-banana-100'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/api-keys"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/api-keys')
                  ? 'bg-banana-500 text-gray-900'
                  : 'text-gray-700 hover:bg-banana-100'
              }`}
            >
              API Keys
            </Link>
            <Link
              to="/usage"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/usage')
                  ? 'bg-banana-500 text-gray-900'
                  : 'text-gray-700 hover:bg-banana-100'
              }`}
            >
              Usage
            </Link>
          </nav>

          {/* User actions */}
          <div className="flex items-center space-x-4">
            <button className="text-gray-700 hover:text-gray-900 text-sm font-medium">
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
