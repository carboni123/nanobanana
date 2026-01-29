/**
 * Dashboard Home Page
 *
 * Features:
 * - Key metrics overview cards
 * - Total API keys count
 * - Total API calls (images generated)
 * - Active keys count
 * - Current month usage
 * - Loading and error states
 * - Banana-themed styling
 */

import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';

interface DashboardStats {
  totalKeys: number;
  activeKeys: number;
  totalCalls: number;
  currentMonthCalls: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch dashboard statistics from API
   */
  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch usage summary from API
      const usageSummary = await apiClient.getUsageSummary();

      // Calculate current month usage (for now, we'll use total_images)
      // In a future enhancement, this could be calculated from daily usage data
      const currentMonthCalls = usageSummary.total_images;

      setStats({
        totalKeys: usageSummary.total_keys,
        activeKeys: usageSummary.active_keys,
        totalCalls: usageSummary.total_images,
        currentMonthCalls,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Load dashboard data on component mount
   */
  useEffect(() => {
    fetchDashboardStats();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="animate-in fade-in duration-300">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <p className="text-gray-600 mb-6">
          Welcome to NanoBanana! Here's an overview of your API usage.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <LoadingSkeleton variant="stat" count={4} />
        </div>
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="animate-in fade-in duration-300">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <EmptyState
          icon={
            <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Error loading dashboard"
          description={error}
          action={{
            label: "Try Again",
            onClick: fetchDashboardStats
          }}
        />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome to NanoBanana! Here's an overview of your API usage.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total API Keys */}
        <StatCard
          title="Total API Keys"
          value={stats?.totalKeys ?? 0}
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
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />

        {/* Active Keys */}
        <StatCard
          title="Active Keys"
          value={stats?.activeKeys ?? 0}
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
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
          bgColor="bg-green-50"
          iconColor="text-green-600"
        />

        {/* Total API Calls */}
        <StatCard
          title="Total API Calls"
          value={stats?.totalCalls ?? 0}
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
          bgColor="bg-banana-50"
          iconColor="text-banana-700"
          subtitle="images generated"
        />

        {/* Current Month Usage */}
        <StatCard
          title="Current Month"
          value={stats?.currentMonthCalls ?? 0}
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
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          }
          bgColor="bg-purple-50"
          iconColor="text-purple-600"
          subtitle="API calls this month"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickActionCard
            title="Manage API Keys"
            description="Create, view, and revoke your API keys"
            icon="🔑"
            href="/api-keys"
          />
          <QuickActionCard
            title="View Usage Analytics"
            description="Detailed analytics and usage charts"
            icon="📊"
            href="/usage"
          />
          <QuickActionCard
            title="API Documentation"
            description="Learn how to integrate NanoBanana"
            icon="📖"
            href="/docs"
            external
          />
        </div>
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
        <div className={`${bgColor} ${iconColor} p-3 rounded-lg`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

/**
 * Quick Action Card Component
 */
interface QuickActionCardProps {
  title: string;
  description: string;
  icon: string;
  href: string;
  external?: boolean;
}

function QuickActionCard({ title, description, icon, href, external }: QuickActionCardProps) {
  const handleClick = () => {
    if (external) {
      window.open(href, '_blank');
    } else {
      window.location.href = href;
    }
  };

  return (
    <button
      onClick={handleClick}
      className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-banana-500 hover:bg-banana-50 transition-all duration-200 group"
    >
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-banana-700">
        {title}
      </h3>
      <p className="text-sm text-gray-600">{description}</p>
    </button>
  );
}
