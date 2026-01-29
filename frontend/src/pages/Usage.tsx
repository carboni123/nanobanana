/**
 * Usage Analytics Dashboard
 *
 * Features:
 * - Summary statistics cards (total calls, avg daily calls)
 * - Daily usage line/bar chart with time range selector (7/30/90 days)
 * - Per-key breakdown table showing usage by API key
 * - Loading states, error handling, and empty states
 * - Recharts integration for data visualization
 */

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { apiClient } from '../services/api';
import type {
  UsageSummaryResponse,
  KeyUsageResponse,
  KeyResponse,
  DailyUsageEntry,
} from '../types/api';

type TimeRange = 7 | 30 | 90;
type ChartType = 'line' | 'bar';

interface KeyUsageData {
  key: KeyResponse;
  usage: KeyUsageResponse;
}

export default function Usage() {
  // Data state
  const [summary, setSummary] = useState<UsageSummaryResponse | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsageEntry[]>([]);
  const [keyUsageData, setKeyUsageData] = useState<KeyUsageData[]>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRange>(30);
  const [chartType, setChartType] = useState<ChartType>('line');

  /**
   * Fetch all usage data
   */
  const fetchUsageData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch summary, daily usage, and API keys in parallel
      const [summaryResponse, dailyResponse, keysResponse] = await Promise.all([
        apiClient.getUsageSummary(),
        apiClient.getDailyUsage(timeRange),
        apiClient.listApiKeys(),
      ]);

      setSummary(summaryResponse);
      setDailyUsage(dailyResponse.days);

      // Fetch usage data for each key
      const keyUsagePromises = keysResponse.keys.map(async (key) => {
        try {
          const usage = await apiClient.getKeyUsage(key.id);
          return { key, usage };
        } catch (err) {
          console.error(`Failed to fetch usage for key ${key.id}:`, err);
          return null;
        }
      });

      const keyUsageResults = await Promise.all(keyUsagePromises);
      const validKeyUsage = keyUsageResults.filter(
        (result): result is KeyUsageData => result !== null
      );
      setKeyUsageData(validKeyUsage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
      console.error('Failed to fetch usage data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [timeRange]);

  /**
   * Load usage data on component mount and when time range changes
   */
  useEffect(() => {
    fetchUsageData();
  }, [fetchUsageData]);

  /**
   * Calculate average daily calls
   */
  const calculateAverageDailyCalls = (): number => {
    if (dailyUsage.length === 0) return 0;
    const totalCalls = dailyUsage.reduce((sum, day) => sum + day.image_count, 0);
    return Math.round(totalCalls / dailyUsage.length);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  /**
   * Format full date for display
   */
  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Usage Analytics</h1>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Loading usage analytics...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Usage Analytics</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-semibold">Error loading usage analytics</p>
          <p className="text-red-600 mt-2">{error}</p>
          <button
            onClick={fetchUsageData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Empty state (no usage data)
  if (!summary || summary.total_images === 0) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Usage Analytics</h1>
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No usage data yet</h3>
          <p className="mt-2 text-gray-600">
            Start making API calls to see your usage analytics here.
          </p>
          {summary && summary.total_keys === 0 && (
            <button
              onClick={() => (window.location.href = '/api-keys')}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Create Your First API Key
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Usage Analytics</h1>
        <p className="mt-2 text-gray-600">
          Monitor your API usage and track performance over time.
        </p>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total API Calls"
          value={summary.total_images}
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
          subtitle="all time"
        />

        <StatCard
          title="Avg Daily Calls"
          value={calculateAverageDailyCalls()}
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          }
          bgColor="bg-green-50"
          iconColor="text-green-600"
          subtitle={`last ${timeRange} days`}
        />

        <StatCard
          title="Active API Keys"
          value={summary.active_keys}
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
          }
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
          subtitle={`${summary.total_keys} total keys`}
        />

        <StatCard
          title="Peak Daily Usage"
          value={Math.max(...dailyUsage.map((d) => d.image_count), 0)}
          icon={
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
              />
            </svg>
          }
          bgColor="bg-orange-50"
          iconColor="text-orange-600"
          subtitle={`last ${timeRange} days`}
        />
      </div>

      {/* Daily Usage Chart */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Daily Usage</h2>
            <p className="text-sm text-gray-600 mt-1">API calls over time</p>
          </div>

          <div className="flex gap-2 mt-4 md:mt-0">
            {/* Chart Type Selector */}
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setChartType('line')}
                className={`px-4 py-2 text-sm font-medium border rounded-l-md transition-colors ${
                  chartType === 'line'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Line
              </button>
              <button
                type="button"
                onClick={() => setChartType('bar')}
                className={`px-4 py-2 text-sm font-medium border-t border-r border-b rounded-r-md transition-colors ${
                  chartType === 'bar'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Bar
              </button>
            </div>

            {/* Time Range Selector */}
            <div className="inline-flex rounded-md shadow-sm" role="group">
              <button
                type="button"
                onClick={() => setTimeRange(7)}
                className={`px-4 py-2 text-sm font-medium border rounded-l-md transition-colors ${
                  timeRange === 7
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                7D
              </button>
              <button
                type="button"
                onClick={() => setTimeRange(30)}
                className={`px-4 py-2 text-sm font-medium border-t border-b transition-colors ${
                  timeRange === 30
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                30D
              </button>
              <button
                type="button"
                onClick={() => setTimeRange(90)}
                className={`px-4 py-2 text-sm font-medium border rounded-r-md transition-colors ${
                  timeRange === 90
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                90D
              </button>
            </div>
          </div>
        </div>

        {/* Chart */}
        {dailyUsage.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart
                  data={dailyUsage}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="usage_date"
                    tickFormatter={formatDate}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    labelFormatter={(label) => formatFullDate(label as string)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      fontSize: '14px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '14px' }} />
                  <Line
                    type="monotone"
                    dataKey="image_count"
                    name="API Calls"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: '#2563eb', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : (
                <BarChart
                  data={dailyUsage}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="usage_date"
                    tickFormatter={formatDate}
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                  <Tooltip
                    labelFormatter={(label) => formatFullDate(label as string)}
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      fontSize: '14px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '14px' }} />
                  <Bar dataKey="image_count" name="API Calls" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">
            <p>No usage data available for the selected time range</p>
          </div>
        )}
      </div>

      {/* Per-Key Breakdown Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Usage by API Key</h2>
          <p className="text-sm text-gray-600 mt-1">Detailed breakdown of usage per key</p>
        </div>

        {keyUsageData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key Prefix
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Calls
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Used
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {keyUsageData
                  .sort((a, b) => b.usage.total_images - a.usage.total_images)
                  .map(({ key, usage }) => (
                    <tr key={key.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {key.name || <span className="text-gray-400 italic">Unnamed</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">
                          {key.prefix}...
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {key.is_active ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Revoked
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 font-medium">
                        {usage.total_images.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                        {key.last_used_at ? formatFullDate(key.last_used_at) : 'Never'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No API keys found</h3>
            <p className="mt-2 text-gray-600">Create an API key to start tracking usage.</p>
            <button
              onClick={() => (window.location.href = '/api-keys')}
              className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Manage API Keys
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  bgColor: string;
  iconColor: string;
  subtitle?: string;
}

function StatCard({ title, value, icon, bgColor, iconColor, subtitle }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`${bgColor} ${iconColor} p-3 rounded-lg`}>{icon}</div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
