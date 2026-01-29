/**
 * NotFound 404 Page
 *
 * Displays when a user navigates to a route that doesn't exist.
 *
 * Features:
 * - Friendly error message with banana theme
 * - Navigation links to common pages
 * - Search suggestion
 * - Responsive design
 */

import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Large 404 with banana emoji */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="text-8xl sm:text-9xl font-bold text-banana-500 mb-4">
            404
          </div>
          <div className="text-6xl mb-6">🍌</div>

          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Oops! This banana has gone missing. The page you're looking for doesn't exist.
          </p>
        </div>

        {/* Navigation Options */}
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-banana-500"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Go Back
            </button>
            <Link
              to="/dashboard"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-banana-600 hover:bg-banana-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-banana-500"
            >
              <svg
                className="h-5 w-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Go to Dashboard
            </Link>
          </div>

          {/* Quick Links */}
          <div className="pt-8">
            <p className="text-sm text-gray-500 mb-4">
              Or try one of these popular pages:
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                to="/api-keys"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-banana-700 bg-banana-50 hover:bg-banana-100 rounded-md transition-colors"
              >
                🔑 API Keys
              </Link>
              <Link
                to="/usage"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-banana-700 bg-banana-50 hover:bg-banana-100 rounded-md transition-colors"
              >
                📊 Usage Analytics
              </Link>
              <Link
                to="/settings"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-banana-700 bg-banana-50 hover:bg-banana-100 rounded-md transition-colors"
              >
                ⚙️ Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <div className="pt-8 text-sm text-gray-500 animate-in fade-in duration-1000">
          <p>
            If you believe this is an error, please{' '}
            <a
              href="https://github.com/carboni123/nanobanana/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-banana-600 hover:text-banana-700 underline"
            >
              report it on GitHub
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
