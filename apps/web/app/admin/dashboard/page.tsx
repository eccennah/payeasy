"use client";

import React from "react";
import useSWR from "swr";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivity, Activity } from "@/components/dashboard/RecentActivity";
import { StatusIndicator, StatusType } from "@/components/StatusIndicator";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Users,
  Home,
  CreditCard,
  Activity as ActivityIcon,
  Settings,
  Eye,
  UserCog,
} from "lucide-react";

type SystemStatusKey = "database" | "blockchain" | "authentication" | "payments";

type AdminDashboardSummary = {
  stats: {
    totalUsers: number;
    activeListings: number;
    totalPayments: number;
    revenue: string;
  };
  recentActivities: Activity[];
  systemStatus: Record<SystemStatusKey, string>;
};

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch admin dashboard data");
    return res.json();
  });

function getStatusType(status: string): StatusType {
  switch (status) {
    case "operational":
      return "success";
    case "degraded":
      return "warning";
    case "down":
      return "error";
    default:
      return "info";
  }
}

const systemServiceLabels: Record<SystemStatusKey, string> = {
  database: "Database",
  blockchain: "Blockchain",
  authentication: "Authentication",
  payments: "Payment Gateway",
};

export default function AdminDashboardPage() {
  const { data, error, isLoading } = useSWR<AdminDashboardSummary>(
    "/api/admin/dashboard/summary",
    fetcher
  );

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="glass-card p-4 text-center border-red-500/20">
          <p className="text-red-400">
            Failed to load admin dashboard data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white to-primary/80 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <p className="text-gray-400 mt-1">{currentDate}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-32 w-full bg-white/5 dark:bg-white/5 border border-white/5 rounded-xl" />
              <Skeleton className="h-32 w-full bg-white/5 dark:bg-white/5 border border-white/5 rounded-xl" />
              <Skeleton className="h-32 w-full bg-white/5 dark:bg-white/5 border border-white/5 rounded-xl" />
              <Skeleton className="h-32 w-full bg-white/5 dark:bg-white/5 border border-white/5 rounded-xl" />
            </>
          ) : (
            <>
              <StatCard
                title="Total Users"
                value={data?.stats.totalUsers || 0}
                description="Registered accounts"
                icon={Users}
                className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-none hover:shadow-none glass-glow"
              />
              <StatCard
                title="Active Listings"
                value={data?.stats.activeListings || 0}
                description="Published properties"
                icon={Home}
                className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-none hover:shadow-none glass-glow"
              />
              <StatCard
                title="Total Payments"
                value={data?.stats.totalPayments || 0}
                description="Processed transactions"
                icon={CreditCard}
                className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-none hover:shadow-none glass-glow"
              />
              <StatCard
                title="Revenue"
                value={data?.stats.revenue || "$0"}
                description="Total platform revenue"
                icon={ActivityIcon}
                className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-none hover:shadow-none glass-glow"
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card glass-glow admin-quick-action">
              <QuickActionCard
                title="Manage Users"
                description="View and manage user accounts"
                href="/admin/users"
                icon={UserCog}
              />
            </div>
            <div className="glass-card glass-glow admin-quick-action">
              <QuickActionCard
                title="Manage Listings"
                description="Review and moderate listings"
                href="/admin/listings"
                icon={Home}
              />
            </div>
            <div className="glass-card glass-glow admin-quick-action">
              <QuickActionCard
                title="View Payments"
                description="Monitor payment transactions"
                href="/admin/payments"
                icon={Eye}
              />
            </div>
            <div className="glass-card glass-glow admin-quick-action">
              <QuickActionCard
                title="System Settings"
                description="Configure platform settings"
                href="/admin/settings"
                icon={Settings}
              />
            </div>
          </div>
        </div>

        {/* Recent Activity + System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <Skeleton className="h-96 w-full bg-white/5 dark:bg-white/5 border border-white/5 rounded-xl" />
            ) : (
              <div className="glass-card glass-glow overflow-hidden admin-activity">
                <RecentActivity activities={data?.recentActivities || []} />
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="lg:col-span-1">
            {isLoading ? (
              <Skeleton className="h-96 w-full bg-white/5 dark:bg-white/5 border border-white/5 rounded-xl" />
            ) : (
              <div className="glass-card glass-glow p-6 h-full">
                <h2 className="text-lg font-semibold text-white mb-6">
                  System Status
                </h2>
                <div className="space-y-4">
                  {data?.systemStatus &&
                    (Object.entries(data.systemStatus) as [SystemStatusKey, string][]).map(
                      ([key, status]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
                        >
                          <span className="text-sm font-medium text-gray-300">
                            {systemServiceLabels[key]}
                          </span>
                          <StatusIndicator
                            status={getStatusType(status)}
                            label={status.charAt(0).toUpperCase() + status.slice(1)}
                            size="sm"
                          />
                        </div>
                      )
                    )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
