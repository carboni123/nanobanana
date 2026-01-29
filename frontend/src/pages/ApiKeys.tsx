/**
 * API Keys Management Page
 *
 * Features:
 * - List all API keys with prefix, creation date, and status
 * - Create new API key with modal form
 * - Show full key value only once with copy-to-clipboard
 * - Delete/revoke key with confirmation dialog
 * - Empty state UI when no keys exist
 */

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { apiClient } from '../services/api';
import type { KeyResponse, CreateKeyResponse } from '../types/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

export default function ApiKeys() {
  const [keys, setKeys] = useState<KeyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create key modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // New key display state (show full key only once)
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<CreateKeyResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Delete confirmation state
  const [keyToDelete, setKeyToDelete] = useState<KeyResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  /**
   * Fetch all API keys from the server
   */
  const fetchKeys = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.listApiKeys();
      setKeys(response.keys);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API keys');
      console.error('Failed to fetch keys:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Create a new API key
   */
  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError(null);

    try {
      const response = await apiClient.createApiKey({
        name: newKeyName.trim() || undefined,
      });

      // Show the full key to the user (only time they'll see it)
      setNewlyCreatedKey(response);
      toast.success('API key created successfully!');

      // Close the create modal and refresh the list
      setIsCreateModalOpen(false);
      setNewKeyName('');
      await fetchKeys();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create API key';
      setCreateError(errorMsg);
      toast.error(errorMsg);
      console.error('Failed to create key:', err);
    } finally {
      setIsCreating(false);
    }
  };

  /**
   * Delete/revoke an API key
   */
  const handleDeleteKey = async () => {
    if (!keyToDelete) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await apiClient.deleteApiKey(keyToDelete.id);
      toast.success('API key revoked successfully');

      // Close the delete modal and refresh the list
      setKeyToDelete(null);
      await fetchKeys();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete API key';
      setDeleteError(errorMsg);
      toast.error(errorMsg);
      console.error('Failed to delete key:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Copy key to clipboard
   */
  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopied(true);
      toast.success('API key copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      toast.error('Failed to copy to clipboard. Please copy manually.');
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Load keys on component mount
   */
  useEffect(() => {
    fetchKeys();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">API Keys</h1>
          <div className="h-11 w-full sm:w-36 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <LoadingSkeleton variant="table" count={3} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="animate-in fade-in duration-300">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">API Keys</h1>
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Error loading API keys"
          description={error}
          action={{
            label: "Try Again",
            onClick: fetchKeys
          }}
        />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">API Keys</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium text-sm sm:text-base min-h-[44px] touch-manipulation w-full sm:w-auto"
        >
          Create New Key
        </button>
      </div>

      {/* Empty State */}
      {keys.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          }
          title="No API keys yet"
          description="Get started by creating your first API key to access the NanoBanana API."
          action={{
            label: "Create Your First Key",
            onClick: () => setIsCreateModalOpen(true)
          }}
        />
      ) : (
        /* API Keys Table */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Mobile Card View */}
          <div className="block sm:hidden divide-y divide-gray-200">
            {keys.map((key) => (
              <div key={key.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="text-sm font-medium text-gray-900 truncate mb-1">
                      {key.name || <span className="text-gray-400 italic">Unnamed</span>}
                    </div>
                    <code className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                      {key.prefix}...
                    </code>
                  </div>
                  <div>
                    {key.is_active ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Revoked
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div>
                    <div className="mb-0.5">Last used: {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}</div>
                    <div>Created: {formatDate(key.created_at)}</div>
                  </div>
                </div>
                <button
                  onClick={() => setKeyToDelete(key)}
                  className="w-full px-4 py-2 text-sm font-medium text-red-600 border border-red-300 rounded-md hover:bg-red-50 active:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                  disabled={!key.is_active}
                >
                  {key.is_active ? 'Revoke' : 'Delete'}
                </button>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key Prefix
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="hidden md:table-cell px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                  <th className="hidden lg:table-cell px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {keys.map((key) => (
                  <tr key={key.id} className="hover:bg-gray-50">
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 max-w-[150px] lg:max-w-none truncate">
                        {key.name || <span className="text-gray-400 italic">Unnamed</span>}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <code className="text-xs sm:text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                        {key.prefix}...
                      </code>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      {key.is_active ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="hidden md:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {key.last_used_at ? formatDate(key.last_used_at) : 'Never'}
                    </td>
                    <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(key.created_at)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setKeyToDelete(key)}
                        className="text-red-600 hover:text-red-900 transition-colors px-2 py-1 min-h-[36px] touch-manipulation"
                        disabled={!key.is_active}
                      >
                        {key.is_active ? 'Revoke' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Key Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 sm:p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Create New API Key</h2>

            <form onSubmit={handleCreateKey}>
              <div className="mb-4">
                <label htmlFor="keyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Key Name (Optional)
                </label>
                <input
                  id="keyName"
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API, Mobile App"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreating}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Give your key a memorable name to identify its purpose
                </p>
              </div>

              {createError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{createError}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setNewKeyName('');
                    setCreateError(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px] touch-manipulation"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Create Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Key Display Modal (Show full key only once) */}
      {newlyCreatedKey && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-5 sm:p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-gray-900">API Key Created Successfully</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Please copy your API key now. For security reasons, you won't be able to see it again.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
              <p className="text-sm font-semibold text-yellow-800 mb-2">🔒 Security Warning</p>
              <p className="text-sm text-yellow-700">
                Store this key securely and never share it publicly. Anyone with this key can access your
                account and consume your resources.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Key Name</label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm">
                {newlyCreatedKey.name || <span className="text-gray-400 italic">Unnamed</span>}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newlyCreatedKey.key}
                  readOnly
                  className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs sm:text-sm font-mono break-all"
                />
                <button
                  onClick={() => handleCopyKey(newlyCreatedKey.key)}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 active:bg-blue-800 transition-colors font-medium min-h-[44px] touch-manipulation whitespace-nowrap"
                >
                  {copied ? '✓ Copied!' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setNewlyCreatedKey(null);
                  setCopied(false);
                }}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 text-white rounded-md hover:bg-gray-800 active:bg-gray-700 transition-colors font-medium min-h-[44px] touch-manipulation"
              >
                I've Saved My Key
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {keyToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 sm:p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {keyToDelete.is_active ? 'Revoke' : 'Delete'} API Key
            </h2>

            <p className="text-gray-600 mb-4">
              Are you sure you want to {keyToDelete.is_active ? 'revoke' : 'delete'} this API key?
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
              <p className="text-sm font-medium text-gray-700">
                {keyToDelete.name || <span className="text-gray-400 italic">Unnamed</span>}
              </p>
              <p className="text-xs text-gray-500 mt-1 font-mono">{keyToDelete.prefix}...</p>
            </div>

            {keyToDelete.is_active && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-sm text-red-800">
                  ⚠️ This action cannot be undone. All applications using this key will immediately
                  lose access to the API.
                </p>
              </div>
            )}

            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{deleteError}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setKeyToDelete(null);
                  setDeleteError(null);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px] touch-manipulation"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteKey}
                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-md hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : keyToDelete.is_active ? 'Revoke Key' : 'Delete Key'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
