# Monitoring Setup for SLA Tracking

This document outlines the monitoring infrastructure needed to track SLA uptime commitments and ensure service reliability.

---

## 1. Required Monitoring Components

### 1.1 Uptime Monitoring (SLA Metric)

The primary SLA metric is availability of the MCP Gateway endpoint.

**Endpoint to Monitor:**
```
POST https://{SUPABASE_URL}/functions/v1/mcp-gateway
```

**Health Check Configuration:**
```yaml
# Recommended: Use a service like Better Uptime, Pingdom, or UptimeRobot
endpoint: https://{your-project-ref}.supabase.co/functions/v1/mcp-gateway
method: POST
headers:
  Content-Type: application/json
  Authorization: Bearer {monitoring-api-key}
body: |
  {
    "jsonrpc": "2.0",
    "id": "health-check",
    "method": "tools/list"
  }
interval: 60 seconds
timeout: 30 seconds
expected_status: [200, 401]  # 401 is OK - means gateway is responding
alert_after: 3 consecutive failures
```

**Why 401 is acceptable:**
- A 401 response means the gateway is running and rejecting invalid auth
- This confirms the Edge Function is healthy
- For actual usage monitoring, use a dedicated monitoring API key

### 1.2 Error Rate Monitoring

Track the percentage of 5xx responses to detect degraded performance.

**Metric:** `error_rate = 5xx_responses / total_responses`

**Alert Thresholds:**
| Threshold | Action |
|-----------|--------|
| > 1% | Warning notification |
| > 5% | Critical alert, investigate |
| > 10% | Incident declared |

**Implementation Options:**

1. **Supabase Dashboard** - View edge function logs and errors
2. **Custom Logging** - Already implemented via usage_logs table
3. **External APM** - Datadog, New Relic, or similar

### 1.3 Latency Monitoring (Informational)

Track response times for performance visibility (not part of SLA).

**Metrics to Track:**
- P50 (median) response time
- P95 response time
- P99 response time

**Alert Thresholds:**
| Metric | Warning | Critical |
|--------|---------|----------|
| P95 | > 5s | > 10s |
| P99 | > 10s | > 30s |

---

## 2. Third-Party Dependency Monitoring

Since the SLA excludes third-party outages, tracking these helps explain issues.

### 2.1 John Deere API Status

**Status Page:** Check if John Deere provides one (none publicly available as of 2026)

**Synthetic Monitoring:**
- Make test API calls to John Deere with a test account
- Track success rate and latency separately
- Use this data to attribute failures correctly

### 2.2 Supabase Status

**Status Page:** https://status.supabase.com

**Subscribe to:**
- Email notifications
- RSS feed for status updates

**API Monitoring:**
```yaml
endpoint: https://{your-project-ref}.supabase.co/rest/v1/developers?select=count
method: HEAD
headers:
  apikey: {anon-key}
interval: 60 seconds
```

### 2.3 Stripe Status

**Status Page:** https://status.stripe.com

**Subscribe to:** Email notifications for your integration components

---

## 3. Internal Health Checks

### 3.1 Database Connectivity

Create a simple health check endpoint in the gateway:

```typescript
// Already exists in mcp-gateway at /health
// Returns: { status: 'ok' }
```

**Enhanced Health Check (Recommended):**
```typescript
// Add this to mcp-gateway/index.ts for comprehensive health
if (url.pathname.endsWith('/health') && req.method === 'GET') {
  const healthChecks = {
    gateway: 'ok',
    database: 'unknown',
    cache: 'unknown',
  };

  try {
    // Check database connectivity
    const { error: dbError } = await supabase
      .from('developers')
      .select('id')
      .limit(1);
    healthChecks.database = dbError ? 'error' : 'ok';
  } catch {
    healthChecks.database = 'error';
  }

  try {
    // Check cache connectivity
    const { error: cacheError } = await supabase
      .schema('cache')
      .from('rate_limits')
      .select('key')
      .limit(1);
    healthChecks.cache = cacheError ? 'error' : 'ok';
  } catch {
    healthChecks.cache = 'error';
  }

  const allHealthy = Object.values(healthChecks).every(v => v === 'ok');

  return new Response(JSON.stringify(healthChecks), {
    status: allHealthy ? 200 : 503,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

### 3.2 Token Refresh Success Rate

Track the success rate of automatic token refreshes:

**Query for Monitoring Dashboard:**
```sql
-- Token refresh success rate (last 24 hours)
SELECT
  COUNT(*) FILTER (WHERE needs_reauth = false) AS healthy,
  COUNT(*) FILTER (WHERE needs_reauth = true) AS failed,
  COUNT(*) AS total,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE needs_reauth = false) / COUNT(*),
    2
  ) AS success_rate_pct
FROM farmer_connections
WHERE is_active = true;

-- Recent refresh failures
SELECT
  id,
  farmer_identifier,
  last_refresh_error,
  updated_at
FROM farmer_connections
WHERE needs_reauth = true
  AND is_active = true
ORDER BY updated_at DESC
LIMIT 20;
```

---

## 4. Alerting Configuration

### 4.1 Alert Channels

Configure alerts to go to appropriate channels based on severity:

| Severity | Channel | Response Time |
|----------|---------|---------------|
| Critical | PagerDuty/Opsgenie + SMS | < 15 min |
| Warning | Slack/Email | < 1 hour |
| Info | Dashboard only | Next business day |

### 4.2 Alert Definitions

**Critical Alerts:**
- Gateway returning 5xx for > 5 minutes
- Health check failing for > 3 consecutive checks
- Database connectivity lost
- Error rate > 10%

**Warning Alerts:**
- Error rate > 1% for > 15 minutes
- P95 latency > 10s for > 10 minutes
- Token refresh failure rate > 5%
- Monthly usage approaching 90% of tier limit

**Info Alerts:**
- Third-party status page updates
- Scheduled maintenance reminders
- New error types detected

---

## 5. Dashboard Metrics

### 5.1 Real-Time Dashboard

Display these metrics on an operational dashboard:

**Primary Metrics (large display):**
- Current uptime status (up/down indicator)
- Error rate (last 5 minutes)
- Request volume (requests/minute)

**Secondary Metrics:**
- P95 latency trend (last hour)
- Active connections count
- Token refresh queue size

**Dependency Status:**
- Supabase status
- John Deere API status (if available)
- Stripe status

### 5.2 Historical Dashboard

For SLA reporting and trend analysis:

**Monthly SLA Report:**
- Total uptime percentage
- Downtime incidents (count and duration)
- Error rate trend
- Latency percentiles trend

**Query for Monthly Uptime:**
```sql
-- Calculate monthly uptime from usage logs
-- Assumes you log all requests including failures
WITH monthly_stats AS (
  SELECT
    DATE_TRUNC('month', request_timestamp) AS month,
    COUNT(*) AS total_requests,
    COUNT(*) FILTER (WHERE status_code >= 500) AS server_errors,
    COUNT(*) FILTER (WHERE status_code < 500 OR status_code IS NULL) AS successful
  FROM usage_logs
  WHERE request_timestamp >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '3 months')
  GROUP BY DATE_TRUNC('month', request_timestamp)
)
SELECT
  month,
  total_requests,
  server_errors,
  ROUND(100.0 * successful / NULLIF(total_requests, 0), 4) AS success_rate_pct
FROM monthly_stats
ORDER BY month DESC;
```

---

## 6. Incident Response

### 6.1 Incident Classification

| Level | Definition | Response |
|-------|------------|----------|
| P1 (Critical) | Complete service outage | Immediate response, all hands |
| P2 (Major) | Significant degradation (>10% errors) | Response within 30 min |
| P3 (Minor) | Partial degradation (<10% errors) | Response within 2 hours |
| P4 (Low) | Cosmetic or minor issues | Next business day |

### 6.2 Incident Workflow

```
1. Alert Triggered
   ↓
2. On-call acknowledges (within SLA response time)
   ↓
3. Initial assessment (5 min)
   - Is this us or a third-party?
   - What's the blast radius?
   ↓
4. Communication
   - Update status page
   - Notify affected customers (if P1/P2)
   ↓
5. Investigation & Mitigation
   - Check logs, metrics, recent deploys
   - Apply mitigation (rollback, scale, etc.)
   ↓
6. Resolution
   - Confirm service restored
   - Update status page
   ↓
7. Post-Incident
   - Write incident report (P1/P2)
   - Update runbooks
   - Implement preventive measures
```

### 6.3 Runbook Links

Create runbooks for common scenarios:

- **Gateway 5xx errors** - Check Supabase Edge Function logs, recent deployments
- **High latency** - Check database queries, John Deere API latency
- **Token refresh failures** - Check John Deere auth endpoint, credential validity
- **Rate limit issues** - Check cache table, monthly usage counter

---

## 7. Recommended Monitoring Stack

### Option A: Budget-Friendly

| Component | Tool | Cost |
|-----------|------|------|
| Uptime Monitoring | Better Uptime (free tier) | $0 |
| Error Tracking | Supabase Logs | Included |
| Alerting | Email + Slack webhook | $0 |
| Dashboard | Supabase Dashboard | Included |

**Total: $0/month**

### Option B: Production-Ready

| Component | Tool | Cost |
|-----------|------|------|
| Uptime Monitoring | Better Uptime Pro | $20/mo |
| Error Tracking | Sentry | $26/mo |
| APM/Metrics | Datadog | $15/mo (per host) |
| Incident Management | PagerDuty | $21/mo (per user) |
| Status Page | Instatus | $20/mo |

**Total: ~$100-150/month**

### Option C: Enterprise

| Component | Tool | Cost |
|-----------|------|------|
| Full Stack Observability | Datadog | Custom |
| Incident Management | PagerDuty + StatusPage | Custom |
| Log Management | Datadog Logs | Custom |
| Synthetic Monitoring | Datadog Synthetics | Custom |

**Total: ~$500-2000/month** (depends on scale)

---

## 8. Implementation Checklist

### Phase 1: Basic Monitoring (Week 1)

- [ ] Set up uptime monitoring for gateway endpoint
- [ ] Configure email alerts for downtime
- [ ] Subscribe to Supabase status page
- [ ] Create Slack channel for alerts

### Phase 2: Error Tracking (Week 2)

- [ ] Implement enhanced health check endpoint
- [ ] Set up error rate alerting
- [ ] Create dashboard for key metrics
- [ ] Document incident response process

### Phase 3: Advanced Monitoring (Week 3-4)

- [ ] Add latency monitoring
- [ ] Set up token refresh monitoring
- [ ] Create monthly SLA report query
- [ ] Implement status page for customers

### Phase 4: Optimization (Ongoing)

- [ ] Review and tune alert thresholds
- [ ] Add runbooks for common issues
- [ ] Conduct incident response drills
- [ ] Regular SLA review meetings

---

## 9. SLA Calculation Automation

### 9.1 Monthly SLA Report Generator

Create a scheduled function to generate monthly SLA reports:

```typescript
// supabase/functions/generate-sla-report/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const monthStart = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
  const monthEnd = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);

  // Query usage logs for the month
  const { data: logs, error } = await supabase
    .from('usage_logs')
    .select('status_code')
    .gte('request_timestamp', monthStart.toISOString())
    .lte('request_timestamp', monthEnd.toISOString());

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const total = logs?.length ?? 0;
  const serverErrors = logs?.filter(l => l.status_code >= 500).length ?? 0;
  const successRate = total > 0 ? ((total - serverErrors) / total) * 100 : 100;

  const report = {
    month: `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`,
    totalRequests: total,
    serverErrors,
    successRate: successRate.toFixed(4),
    uptimePercentage: successRate.toFixed(2),
    slaTarget: '99.0%',
    slaMet: successRate >= 99.0,
  };

  // Store report
  await supabase.from('sla_reports').insert(report);

  return new Response(JSON.stringify(report), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

### 9.2 SLA Reports Table

Add a migration for storing SLA reports:

```sql
-- migrations/00020_add_sla_reports_table.sql
CREATE TABLE IF NOT EXISTS sla_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL UNIQUE,
  total_requests BIGINT NOT NULL DEFAULT 0,
  server_errors BIGINT NOT NULL DEFAULT 0,
  success_rate DECIMAL(7,4) NOT NULL,
  uptime_percentage DECIMAL(5,2) NOT NULL,
  sla_target TEXT NOT NULL DEFAULT '99.0%',
  sla_met BOOLEAN NOT NULL,
  incidents JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_sla_reports_month ON sla_reports(month DESC);
```

---

*This monitoring setup ensures you can accurately track and report on SLA commitments while providing visibility into system health.*
