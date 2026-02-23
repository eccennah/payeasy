# Web Vitals Monitoring Guide

## Overview

This document describes PayEasy's comprehensive Web Vitals monitoring system, which tracks and optimizes the five core web performance metrics recommended by Google:

- **LCP** (Largest Contentful Paint) - When the largest visible element on the page is painted
- **FID** (First Input Delay) - Time from user input to browser response
- **CLS** (Cumulative Layout Shift) - Visual stability of the page
- **FCP** (First Contentful Paint) - When the first content appears
- **TTFB** (Time to First Byte) - Server response time for initial request

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Web Vitals Monitoring                     │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │   Browser    │  │   web-vitals │  │  VitalsTracker  │   │
│  │  Metrics     │→ │   Library    │→ │   Singleton     │   │
│  └──────────────┘  └──────────────┘  └────────┬────────┘   │
│                                                │              │
│       ┌────────────────────────────────────────┴────────┐   │
│       │                                                 │    │
│  ┌────▼──────┐  ┌────────────┐  ┌──────────────┐    │    │
│  │ Performance│  │ Analytics  │  │ Alert        │    │    │
│  │ Monitor    │  │ Service    │  │ Manager      │    │    │
│  └──────┬─────┘  └─────┬──────┘  └──────┬───────┘    │    │
│         │               │                │             │    │
│  ┌──────▼────┐  ┌──────▼───┐  ┌────────▼────────┐   │    │
│  │ Dashboard  │  │ API Post │  │ Browser Notify │   │    │
│  │ Metrics    │  │ /api/    │  │ Handlers       │   │    │
│  └────────────┘  │analytics │  └────────────────┘   │    │
│                  │ /vitals  │                         │    │
│  ┌──────────────┐ └──────────┘ ┌───────────────────┐│    │
│  │ Budget       │              │ Trend Analysis    ││    │
│  │ Manager      │              │ & Reporting       ││    │
│  └──────────────┘              └───────────────────┘│    │
│                                                       │    │
└───────────────────────────────────────────────────────┴────┘
```

## Core Components

### 1. **VitalsTracker** (`lib/performance/vitals.ts`)
Collects and rates metrics against Google's performance thresholds.

**Key Features:**
- Attaches listeners to web-vitals library
- Rates each metric: "good", "needs-improvement", "poor"
- Session-based tracking with unique IDs
- Configurable sample rate for production efficiency
- Real-time metric subscription

**Usage:**
```typescript
import { getVitalsTracker } from '@/lib/performance/vitals';
import { getVitalsConfig } from '@/lib/performance-config';

const tracker = getVitalsTracker(getVitalsConfig());
tracker.init();

tracker.subscribe((metrics) => {
  console.log('Updated metrics:', metrics);
});
```

### 2. **AnalyticsService** (`lib/performance/analytics.ts`)
Sends collected metrics to the backend analytics endpoint.

**Key Features:**
- Batch processing with configurable flush intervals (default: 30s)
- Automatic queue management
- keepalive flag for end-of-session data
- Environment-aware API endpoint selection
- Session metadata (userAgent, pageUrl, timestamp)

**API Endpoint:**
```
POST /api/analytics/vitals
Content-Type: application/json

{
  "sessionId": "uuid-v4",
  "metrics": { /* CoreWebVitals */ },
  "pageUrl": "https://payeasy.local/listings",
  "userAgent": "Mozilla/5.0...",
  "timestamp": 1234567890,
  "environment": "production"
}
```

**Usage:**
```typescript
import { getAnalytics } from '@/lib/performance/analytics';

const analytics = getAnalytics();
analytics.record(metrics);
// Automatically flushes every 30s or on page unload
```

### 3. **BudgetManager** (`lib/performance/budgets.ts`)
Enforces performance budgets and tracks violations.

**Default Budgets:**
- LCP: ≤ 2.5s
- FID: ≤ 100ms
- CLS: ≤ 0.1
- FCP: ≤ 1.8s
- TTFB: ≤ 600ms

**Usage:**
```typescript
import { BudgetManager } from '@/lib/performance/budgets';

const manager = new BudgetManager();
const violations = manager.checkBudgets(metrics);
const percentage = manager.getCompliancePercentage();
```

### 4. **AlertManager** (`lib/performance/alerts.ts`)
Triggers alerts when metrics exceed thresholds.

**Alert Severity Levels:**
- **critical**: Severe performance issues (>50% over budget)
- **warning**: Moderate issues (20-50% over budget)
- **info**: Minor issues or informational

**Features:**
- Throttled alerts (5s default) to prevent spam
- Alert subscription callbacks
- Severity-based filtering
- Alert history and statistics

**Usage:**
```typescript
import { AlertManager } from '@/lib/performance/alerts';

const manager = new AlertManager();
manager.subscribe((alert) => {
  if (alert.severity === 'critical') {
    notifyTeam(alert);
  }
});

manager.checkMetrics(metrics);
```

### 5. **TrendAnalyzer** (`lib/performance/trends.ts`)
Analyzes historical metric data and detects trends.

**Features:**
- Percentile calculations (p50, p75, p95, p99)
- Trend direction detection: improving | degrading | stable
- Historical data retention (max 1000 points per metric)
- Trend snapshots for comparison

**Usage:**
```typescript
import { TrendAnalyzer } from '@/lib/performance/trends';

const analyzer = new TrendAnalyzer();
analyzer.recordMetric('lcp', 2.1);
analyzer.recordMetric('lcp', 2.0);

const trend = analyzer.analyzeTrend('lcp');
// Returns: { direction: 'improving', improvement: 4.8%, ... }
```

### 6. **ReportGenerator** (`lib/performance/reports.ts`)
Generates comprehensive performance reports.

**Report Contents:**
- Current metrics and ratings
- Comparison with previous period
- Budget compliance status
- Actionable recommendations
- Data exports (JSON, CSV)

**Usage:**
```typescript
import { ReportGenerator } from '@/lib/performance/reports';

const generator = new ReportGenerator();
const report = generator.generate({ 
  currentMetrics: metrics,
  previousMetrics: oldMetrics,
  budgets: budgetsList,
  trends: trendData
});

// Export formats
generator.exportJSON(report);
generator.exportCSV(report);
```

### 7. **PerformanceMonitor** (`lib/performance/monitor.ts`)
Central orchestrator that coordinates all monitoring modules.

**Responsibilities:**
- Initialize and manage all modules
- Aggregate dashboard metrics
- Trigger update callbacks
- Generate unified reports
- Cleanup on page unload

**Usage:**
```typescript
import { initPerformanceMonitor } from '@/lib/performance/monitor';

const monitor = initPerformanceMonitor();
monitor.onUpdate((dashboardMetrics) => {
  updateUI(dashboardMetrics);
});

monitor.onAlert((alert) => {
  logAlert(alert);
});
```

## React Integration

### Available Hooks

#### `useWebVitals(config?)`
Complete monitoring integration for React components.

```typescript
import { useWebVitals } from '@/hooks/useWebVitals';

export function PerformanceDashboard() {
  const { metrics, alerts, report, compliance } = useWebVitals();

  if (!metrics) return <div>Loading...</div>;

  return (
    <div>
      <h2>Current Metrics</h2>
      <p>LCP: {metrics.lcp.rating}</p>
      <p>CLS: {metrics.cls.rating}</p>
      
      {alerts.filter(a => a.severity === 'critical').map(a => (
        <Alert key={a.metric} severity="critical">{a.message}</Alert>
      ))}
    </div>
  );
}
```

#### `useMetricMonitoring(metricName, config?)`
Track specific metrics with precision.

```typescript
const { metric, history, rating } = useMetricMonitoring('lcp');

useEffect(() => {
  console.log(`Current LCP: ${metric.value}ms`);
}, [metric]);
```

#### `usePerformanceAlerts(config?)`
Subscribe to alerts with filtering.

```typescript
const { alerts, critical, warnings, dismiss } = usePerformanceAlerts();

return (
  <AlertPanel>
    {critical.map(alert => (
      <CriticalAlert 
        key={alert.id}
        message={alert.message}
        onDismiss={() => dismiss(alert.id)}
      />
    ))}
  </AlertPanel>
);
```

#### `useBudgetCompliance(config?)`
Monitor budget objectives and compliance percentage.

```typescript
const { status, compliancePercentage, violations } = useBudgetCompliance();

return <Progress value={compliancePercentage} />;
```

#### `usePerformanceTrends(metricNames?, config?)`
Visualize performance trends.

```typescript
const { trends, analyzer } = usePerformanceTrends(['lcp', 'cls']);

const direction = trends.lcp?.direction; // 'improving' | 'degrading' | 'stable'
```

## Configuration

### Environment-Based Config (`lib/performance-config.ts`)

**Development:**
```typescript
{
  enabled: true,
  sampleRate: 1.0,        // 100% - all metrics
  flushInterval: 10000,   // Flush every 10s
  sendAnalytics: false,   // Don't send to backend
  debug: true
}
```

**Staging:**
```typescript
{
  enabled: true,
  sampleRate: 0.5,        // 50% - representative sample
  flushInterval: 30000,   // Flush every 30s
  sendAnalytics: true,
  debug: false
}
```

**Production:**
```typescript
{
  enabled: true,
  sampleRate: 0.1,        // 10% - minimal overhead
  flushInterval: 30000,   // Flush every 30s
  sendAnalytics: true,
  debug: false
}
```

### Custom Configuration

```typescript
import { getVitalsConfig } from '@/lib/performance-config';

const config = getVitalsConfig();
config.sampleRate = 0.05; // Override to 5%

const monitor = initPerformanceMonitor(config);
```

## Performance Metrics

### Google Thresholds (CrUX)

| Metric | Good | Needs Work | Poor |
|--------|------|-----------|------|
| **LCP** | ≤ 2.5s | 2.5 - 4.0s | > 4.0s |
| **FID** | ≤ 100ms | 100 - 300ms | > 300ms |
| **CLS** | ≤ 0.1 | 0.1 - 0.25 | > 0.25 |
| **FCP** | ≤ 1.8s | 1.8 - 3.0s | > 3.0s |
| **TTFB** | ≤ 600ms | 600 - 1800ms | > 1800ms |

## API Reference

### TypeScript Interfaces

#### CoreWebVitals
```typescript
interface CoreWebVitals {
  lcp: WebVitalMetric;    // Largest Contentful Paint
  fid: WebVitalMetric;    // First Input Delay
  cls: WebVitalMetric;    // Cumulative Layout Shift
  fcp: WebVitalMetric;    // First Contentful Paint
  ttfb: WebVitalMetric;   // Time to First Byte
}

interface WebVitalMetric {
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
  delta?: number;
}
```

#### PerformanceAlert
```typescript
interface PerformanceAlert {
  id: string;
  metric: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  exceededPercent: number;
  timestamp: number;
}
```

#### MetricTrend
```typescript
interface MetricTrend {
  metric: string;
  direction: 'improving' | 'degrading' | 'stable';
  improvement: number;      // Percentage change
  p50: number;              // Median
  p95: number;              // 95th percentile
  p99: number;              // 99th percentile
  dataPoints: number;
}
```

#### PerformanceReport
```typescript
interface PerformanceReport {
  generatedAt: number;
  metrics: CoreWebVitals;
  previousMetrics?: CoreWebVitals;
  budgetStatus: BudgetStatus;
  trends: MetricTrend[];
  recommendations: string[];
}
```

## Implementation Guide

### 1. Initialize Monitoring

**In your `app/layout.tsx` or root component:**

```typescript
'use client';

import { useWebVitals } from '@/hooks/useWebVitals';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Initialize monitoring on app start
  useWebVitals();

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

### 2. Display Dashboard

**Create `components/PerformanceDashboard.tsx`:**

```typescript
'use client';

import { useWebVitals } from '@/hooks/useWebVitals';

export function PerformanceDashboard() {
  const { metrics, compliance, trends, alerts } = useWebVitals();

  if (!metrics) return null;

  return (
    <div className="performance-dashboard">
      <h2>Web Vitals</h2>
      
      <MetricsCard metrics={metrics} />
      <BudgetProgress compliance={compliance} />
      <TrendChart trends={trends} />
      <AlertsSummary alerts={alerts} />
    </div>
  );
}
```

### 3. Handle Alerts

**In your admin or monitoring panel:**

```typescript
'use client';

import { usePerformanceAlerts } from '@/hooks/useWebVitals';

export function AlertMonitor() {
  const { critical, warnings, dismiss } = usePerformanceAlerts();

  return (
    <div className="alerts">
      {critical.map(alert => (
        <ErrorNotification
          key={alert.id}
          message={alert.message}
          onClose={() => dismiss(alert.id)}
        />
      ))}
    </div>
  );
}
```

## Best Practices

1. **Sample Rate in Production**: Set to 10% (0.1) to minimize overhead
2. **Batch Analytics**: Use default 30s flush interval for efficiency
3. **Alert Throttling**: Default 5s throttle prevents alert spam
4. **Error Handling**: Wrap monitor initialization in try-catch
5. **Cleanup**: Monitor.destroy() called automatically on page unload
6. **Session Tracking**: Each session gets unique UUID for correlation
7. **Privacy**: Session IDs are anonymous; no PII collected
8. **Performance**: Budget configurations use strict thresholds

## Troubleshooting

### Metrics Not Appearing

1. Check that `web-vitals` package is installed: `npm ls web-vitals`
2. Verify 'use client' directive is present in components using hooks
3. Check browser console for errors: `console.error` statements
4. Ensure analytics endpoint is accessible: `/api/analytics/vitals`

### High Sample Rate Impact

1. Reduce `sampleRate` in production config (default is 0.1)
2. Increase `flushInterval` to batch more data
3. Disable non-critical features (trends, detailed reports) in production

### Alert Spam

1. Increase `throttleMs` in AlertManager (default 5000ms)
2. Adjust alert severity thresholds
3. Implement alert aggregation on dashboard

## File Structure

```
lib/performance/
├── types.ts              # Type definitions
├── vitals.ts             # Core tracking
├── analytics.ts          # Backend integration
├── budgets.ts            # Budget management
├── alerts.ts             # Alert system
├── trends.ts             # Trend analysis
├── reports.ts            # Report generation
└── monitor.ts            # Main orchestrator

apps/web/
├── hooks/
│   └── useWebVitals.ts   # React hooks
└── lib/
    └── performance-config.ts  # Configuration
```

## Future Enhancements

1. **Custom Metrics**: Support application-specific metrics
2. **Historical Dashboard**: Time-series visualization
3. **Comparative Analysis**: Compare against competitors
4. **ML Predictions**: Predict performance trends
5. **Mobile-Specific Alerts**: Device-aware thresholds
6. **Geographic Distribution**: Per-region performance tracking
7. **User Segmentation**: Performance by user cohort
8. **Integration**: Slack/Teams notifications for critical alerts

## References

- [Google Web Vitals](https://web.dev/vitals/)
- [Core Web Vitals Update](https://developers.google.com/search/blog/2020/11/core-web-vitals)
- [web-vitals Library](https://github.com/GoogleChrome/web-vitals)
- [PageSpeed Insights](https://pagespeed.web.dev/)
