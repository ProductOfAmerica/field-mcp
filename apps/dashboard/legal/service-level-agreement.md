# Service Level Agreement

**Effective Date:** [EFFECTIVE_DATE]

**Last Updated:** January 10, 2026

---

This Service Level Agreement ("SLA") is part of the Terms of Service between [COMPANY_NAME] ("Company," "we," "us," or "our") and you ("Customer," "you," or "your") and describes our uptime commitments for the FieldMCP platform.

**This SLA applies only to paid subscription tiers. The Free tier has no uptime commitment.**

---

## 1. Definitions

**"Downtime"** means periods when the MCP Gateway endpoint (`/functions/v1/mcp-gateway`) is unavailable or returns HTTP 5xx errors to properly authenticated requests, excluding Scheduled Maintenance and Exclusions defined in Section 4.

**"Monthly Uptime Percentage"** means the total number of minutes in a calendar month minus Downtime minutes, divided by the total number of minutes in that month, expressed as a percentage.

**"Service Credit"** means a credit applied to your account as compensation for Downtime exceeding our commitment.

**"Scheduled Maintenance"** means planned maintenance announced at least 72 hours in advance via email to your registered address.

---

## 2. Uptime Commitment

### 2.1 Uptime Targets

| Subscription Tier | Monthly Uptime Target |
|-------------------|----------------------|
| Free | No commitment |
| Developer | 99.0% |
| Startup | 99.5% |
| Enterprise | 99.9% (or as negotiated) |

### 2.2 Uptime Calculation

```
Monthly Uptime % = ((Total Minutes - Downtime Minutes) / Total Minutes) x 100
```

**Example:** In a 30-day month (43,200 minutes), a Developer tier customer experiencing 432 minutes of Downtime would have:
- Monthly Uptime = (43,200 - 432) / 43,200 = 99.0%
- This meets the 99.0% target; no Service Credit is due.

### 2.3 Measurement

Downtime is measured by our monitoring systems. Downtime begins when our systems confirm the Service is returning 5xx errors to valid authenticated requests and ends when normal operation resumes.

---

## 3. Service Credits

### 3.1 Credit Schedule

If we fail to meet your tier's uptime commitment, you may request Service Credits:

| Monthly Uptime Achieved | Service Credit (% of Monthly Fee) |
|-------------------------|-----------------------------------|
| 99.0% - 99.49% | 10% |
| 95.0% - 98.99% | 25% |
| 90.0% - 94.99% | 50% |
| Below 90.0% | 100% |

### 3.2 Credit Limitations

- **Maximum Credit**: 100% of your monthly subscription fee for the affected month
- **Form**: Credits are applied to future invoices only; no cash refunds
- **Expiration**: Unused credits expire 12 months after issuance
- **Non-Transferable**: Credits cannot be transferred to other accounts

### 3.3 How to Request Credits

To request a Service Credit, email [CONTACT_EMAIL] within 30 days of the incident with:

1. Your account email address
2. Date(s) and time(s) of the Downtime (UTC)
3. Description of the impact on your application
4. Any error messages or logs you received

We will respond within 10 business days with our determination. If we confirm the Downtime, we will apply the appropriate Service Credit to your next invoice.

### 3.4 Disputes

If you disagree with our determination, you may request a review by providing additional evidence. We will make a final determination within 15 business days of receiving your dispute.

---

## 4. Exclusions

The following are NOT counted as Downtime and do not qualify for Service Credits:

### 4.1 Third-Party Service Outages

Unavailability or errors caused by services outside our control:

- **John Deere Operations Center API** unavailability, errors, or degraded performance
- **Supabase** infrastructure incidents (when we are also affected)
- **Stripe** payment processing issues
- **Internet backbone** or DNS infrastructure failures
- Any other third-party API or service provider outages

### 4.2 Scheduled Maintenance

- Maintenance announced at least 72 hours in advance
- Individual maintenance windows not exceeding 4 hours
- Maximum 8 hours of scheduled maintenance per calendar month
- Emergency security patches (announced as soon as practicable)

### 4.3 Force Majeure

Events beyond our reasonable control, including:

- Natural disasters (earthquakes, floods, hurricanes, etc.)
- Acts of war, terrorism, or civil unrest
- Government actions or court orders
- Pandemics or public health emergencies
- Power grid failures affecting data centers

### 4.4 Customer-Caused Issues

Issues attributable to your actions or systems:

- Invalid or revoked API keys
- Authentication failures due to incorrect credentials
- Requests exceeding your tier's rate limits (HTTP 429 responses)
- Malformed API requests (HTTP 4xx responses)
- Your network, infrastructure, or application issues
- Farmer connections requiring re-authentication

### 4.5 Abuse and Security

- Traffic exceeding 5x your tier's documented rate limits
- Distributed denial of service (DDoS) attacks targeting you or us
- Security incidents requiring protective measures
- Suspension of your account for Terms of Service violations

### 4.6 Beta Features

- Features marked as "beta," "preview," or "experimental"
- Newly launched features during their first 30 days
- Features explicitly excluded from SLA coverage in documentation

---

## 5. What This SLA Does NOT Cover

This SLA provides commitments for **Service availability only**. It does not guarantee:

### 5.1 Data Accuracy

- Accuracy, completeness, or timeliness of agricultural data from third-party providers
- Correctness of field boundaries, yield data, or equipment information
- Data quality from John Deere or other connected services

### 5.2 Token Refresh Success

- Successful automatic refresh of OAuth tokens
- Continuous access to Farmer connections
- Token refresh when Farmers revoke authorization or providers are unavailable

### 5.3 Performance

- Response time or latency targets
- Throughput or request processing speed
- Query performance for any specific operation

### 5.4 Dashboard Availability

- The web dashboard (`app.fieldmcp.com`) availability
- Dashboard features or functionality
- Account management interface uptime

### 5.5 Third-Party API Functionality

- Availability of specific John Deere API endpoints
- Data returned by agricultural providers
- Changes to third-party API functionality or data formats

---

## 6. Support Response Times

### 6.1 Support Tiers

| Priority Level | Description | Developer | Startup | Enterprise |
|----------------|-------------|-----------|---------|------------|
| **Critical** | Service completely unavailable | 8 hours | 4 hours | 1 hour |
| **High** | Major feature non-functional | 24 hours | 8 hours | 4 hours |
| **Medium** | Feature impaired, workaround exists | 48 hours | 24 hours | 8 hours |
| **Low** | General questions, minor issues | 72 hours | 48 hours | 24 hours |

### 6.2 Priority Definitions

- **Critical**: Complete Service unavailability affecting production applications
- **High**: Major functionality broken with significant business impact
- **Medium**: Functionality impaired but workaround available
- **Low**: General questions, documentation requests, minor issues

### 6.3 Support Hours

- **Developer/Startup**: Business hours (9 AM - 5 PM Central, Monday-Friday)
- **Enterprise**: 24/7 for Critical issues; business hours for others

### 6.4 Support Channels

- **Email**: [CONTACT_EMAIL]
- **Enterprise**: Dedicated support contact (if applicable)

---

## 7. Maintenance Windows

### 7.1 Scheduled Maintenance

We perform routine maintenance to ensure Service reliability. Scheduled maintenance:

- Is announced at least 72 hours in advance via email
- Typically occurs during low-traffic periods (Sundays 2-6 AM Central)
- Does not exceed 4 hours per window
- Is limited to 8 hours total per calendar month

### 7.2 Emergency Maintenance

We may perform emergency maintenance without advance notice for:

- Critical security vulnerabilities
- Imminent threat of data loss
- Legal or regulatory compliance requirements

We will provide notice as soon as practicable and minimize disruption.

### 7.3 Maintenance Notifications

Maintenance notifications are sent to the email address associated with your account. Ensure your contact information is current in the dashboard.

---

## 8. Incident Communication

### 8.1 Status Updates

During Service disruptions, we will:

- Acknowledge the incident within 30 minutes of detection
- Provide status updates at least every 60 minutes during ongoing incidents
- Send notification when the incident is resolved
- Publish a post-incident summary for significant outages

### 8.2 Communication Channels

- **Email**: Direct notification to affected customers
- **Status Page**: [STATUS_PAGE_URL] (if available)
- **Dashboard**: Banner notifications for active incidents

---

## 9. Your Responsibilities

To benefit from this SLA, you must:

### 9.1 Maintain Valid Credentials

- Keep API keys active and properly secured
- Monitor and maintain Farmer connections
- Re-authenticate connections when required

### 9.2 Implement Error Handling

- Handle API errors gracefully in your applications
- Implement appropriate retry logic for transient failures
- Respect rate limits and back off when receiving 429 responses

### 9.3 Stay Informed

- Keep your account email address current
- Monitor maintenance notifications
- Review status updates during incidents

### 9.4 Report Issues Promptly

- Report suspected Downtime within 24 hours
- Provide requested diagnostic information
- Cooperate with troubleshooting efforts

---

## 10. SLA Modifications

### 10.1 Changes

We may modify this SLA with 30 days' advance notice. Changes take effect at the start of your next billing cycle after the notice period.

### 10.2 Notification

SLA changes will be communicated via:

- Email to your registered address
- Dashboard notification
- Updated "Last Updated" date on this document

### 10.3 Acceptance

Continued use of the Service after changes take effect constitutes acceptance. If you do not agree to changes, you may cancel your subscription before they take effect.

---

## 11. Entire SLA

This SLA, together with the Terms of Service, constitutes the complete agreement regarding Service availability. This SLA supersedes any prior availability commitments.

---

## 12. Contact Information

For SLA-related inquiries, Service Credit requests, or to report Downtime:

**[COMPANY_NAME]**

Email: [CONTACT_EMAIL]

Address: [PHYSICAL_ADDRESS]

---

## Appendix: Uptime History

We will maintain a public record of monthly uptime percentages and significant incidents. This appendix will be updated monthly.

| Month | Uptime % | Incidents | Notes |
|-------|----------|-----------|-------|
| *To be populated* | - | - | - |

---

*This Service Level Agreement is effective as of the date listed at the top of this document.*
