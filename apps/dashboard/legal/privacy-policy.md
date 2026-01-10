# Privacy Policy

**Effective Date:** [EFFECTIVE_DATE]

**Last Updated:** January 10, 2026

---

## 1. Introduction

This Privacy Policy explains how [COMPANY_NAME] ("Company," "we," "us," or "our"), a Missouri limited liability company, collects, uses, shares, and protects information when you use the FieldMCP platform, APIs, dashboard, and related services (collectively, the "Service").

By using the Service, you agree to the collection and use of information as described in this Privacy Policy. If you do not agree, please do not use the Service.

**This Service is intended for users in the United States only.**

### What is Personal Information?

Personal information is any information that can be used to identify you. This includes information about you as a person (such as name and email address), your devices, payment details, and information about how you use the Service. It also includes any data that, when combined with other information, could identify you.

---

## 2. Information We Collect

### 2.1 Account Information

When you create an account, we collect:

| Data | Purpose |
|------|---------|
| **Email address** | Account identification, login, communications |
| **Password** | Authentication (stored as cryptographic hash by Supabase; we never see or store your plaintext password) |
| **Company name** | Account identification, billing |

### 2.2 API Key Data

When you create API keys, we store:

| Data | Purpose |
|------|---------|
| **Key name** | Your reference for identifying keys |
| **Key hash** | SHA-256 cryptographic hash for validation (we never store the actual key) |
| **Key prefix** | First portion of key for display purposes (e.g., `field_live_abc1...`) |
| **Last used timestamp** | Usage tracking and security monitoring |
| **Creation date** | Record keeping |

### 2.3 Farmer Connection Data

When you connect a farmer's account via OAuth, we store:

| Data | Purpose |
|------|---------|
| **Farmer identifier** | Your internal name for this connection |
| **OAuth access token** | API authentication (encrypted at rest) |
| **OAuth refresh token** | Token renewal (encrypted at rest) |
| **Token expiration** | Automatic refresh scheduling |
| **Scopes** | Permissions granted (e.g., ag1, ag2, ag3) |
| **Provider** | Which service (John Deere, etc.) |
| **Organization data** | Farms/organizations from provider |
| **Refresh status** | Success/failure of automatic refresh |
| **Last refresh timestamp** | Monitoring token health |
| **Re-auth flag** | Whether manual re-authorization needed |

### 2.4 Usage Data

For each API request, we log:

| Data | Purpose |
|------|---------|
| **Developer ID** | Associate usage with your account |
| **API key ID** | Track which key was used |
| **Farmer connection ID** | Track which connection was used |
| **Provider** | Which agricultural API (John Deere, etc.) |
| **Tool name** | Which MCP tool was called |
| **Timestamp** | When the request occurred |
| **Response time** | Performance monitoring (milliseconds) |
| **Status code** | Success/failure tracking |
| **Error type** | Debugging (if applicable) |

### 2.5 Billing Data

For paid subscriptions, we store:

| Data | Purpose |
|------|---------|
| **Stripe customer ID** | Link to your Stripe account |
| **Stripe subscription ID** | Track your subscription |
| **Subscription tier** | Determine your rate limits |
| **Subscription status** | Active, canceled, past due, etc. |
| **Billing period dates** | Track subscription cycle |

**Note:** We do not store payment card details. All payment information is handled directly by Stripe.

### 2.6 Security Data

For security and abuse prevention, we collect:

| Data | Purpose |
|------|---------|
| **IP addresses** | Rate limiting failed login attempts |
| **Failed login counts** | Prevent brute force attacks |
| **Request counts** | Enforce rate limits |

This data is stored temporarily in cache tables and automatically deleted.

### 2.7 Sensitive Information

"Sensitive information" refers to personal information that requires heightened protection, such as racial or ethnic origin, political opinions, religious beliefs, trade union membership, health information, sexual orientation, or biometric data.

**We do not collect sensitive information.** Our Service is designed for agricultural data management and does not require or process any sensitive personal information categories.

### 2.8 Information from Third Parties

When developers use our Service to connect farmer accounts via OAuth:

- **Developer responsibility**: Developers represent and warrant that they have obtained the farmer's informed consent before connecting their account to our Service.
- **Farmer data**: We receive OAuth tokens and basic account information from agricultural data providers (such as John Deere) on behalf of the farmer. This data is used solely to facilitate API access as directed by the developer.
- **Protection**: We protect all information received through these connections as described in this Privacy Policy.

If you are a farmer whose account has been connected by a developer and you have questions about how your data is being used, please contact both the developer who connected your account and us at [CONTACT_EMAIL].

---

## 3. How We Use Your Information

We only collect and use your personal information when we have a legitimate reason for doing so. We only collect personal information that is reasonably necessary to provide our services to you.

We use your information to:

### 3.1 Provide the Service
- Authenticate your account and API requests
- Process API calls to agricultural data providers
- Manage and refresh OAuth tokens automatically
- Display your usage statistics and connection status

### 3.2 Process Payments
- Create and manage your Stripe customer account
- Process subscription payments
- Track your subscription status and tier

### 3.3 Enforce Limits and Security
- Apply rate limits based on your subscription tier
- Prevent abuse and unauthorized access
- Block repeated failed authentication attempts
- Detect and prevent fraudulent activity

### 3.4 Improve the Service
- Monitor system performance and reliability
- Identify and fix bugs
- Analyze usage patterns to improve features

### 3.5 Communicate with You
- Send service-related announcements
- Notify you of security issues affecting your account
- Respond to your support requests

### 3.6 Comply with Legal Obligations
- Maintain records required by law
- Respond to legal requests
- Enforce our Terms of Service

---

## 4. How We Share Your Information

### 4.1 Service Providers

We share information with third-party service providers who help us operate the Service:

| Provider | Purpose | Data Shared |
|----------|---------|-------------|
| **Supabase** | Database, authentication, edge functions | All account data, usage logs, farmer connections |
| **Stripe** | Payment processing | Email, subscription metadata, developer ID |
| **John Deere** | Agricultural data API | OAuth tokens, API requests made on your behalf |
| **Vercel** | Dashboard hosting | Session cookies, page requests |

These providers are contractually obligated to protect your information and use it only for the purposes we specify.

### 4.2 Agricultural Data Providers

When you make API requests, we transmit:
- OAuth access tokens to authenticate with the provider
- Your API requests to retrieve farmer data

The farmer data returned passes through our Service but we do not store it beyond request processing.

### 4.3 Legal Requirements

We may disclose your information if required to:
- Comply with applicable law, regulation, or legal process
- Respond to lawful requests from public authorities
- Protect our rights, privacy, safety, or property
- Enforce our Terms of Service
- Protect against legal liability

### 4.4 Business Transfers

If we are involved in a merger, acquisition, bankruptcy, or sale of assets, your information may be transferred as part of that transaction. You acknowledge that such transfers may occur. Any party that acquires us or our assets will be required to honor this Privacy Policy as the basis for any ownership or use rights over your information, and may only use your personal information according to this policy. We will notify you of any change in ownership or control.

### 4.5 With Your Consent

We may share information with your explicit consent for purposes not described here.

### 4.6 What We Do NOT Do

We do NOT:
- Sell your personal information to third parties
- Share your information for third-party advertising
- Use your farmer connection data for our own purposes beyond providing the Service

---

## 5. Data Security

We implement security measures to protect your information:

### 5.1 Technical Safeguards

| Measure | Description |
|---------|-------------|
| **Token encryption** | OAuth tokens are encrypted at rest before storage |
| **API key hashing** | Only SHA-256 hashes stored, never plaintext keys |
| **Row-level security** | Database policies ensure you can only access your own data |
| **HTTPS** | All data transmitted over encrypted connections |
| **Rate limiting** | Authentication endpoints protected against brute force |
| **Automatic cleanup** | Cache data automatically deleted every 5 minutes |

### 5.2 Operational Safeguards

- Access to production systems is restricted
- We use managed infrastructure providers with strong security practices
- We monitor for suspicious activity
- Our infrastructure providers (Supabase, Vercel, Stripe) maintain SOC2 Type II certifications and undergo regular independent security audits

### 5.3 Security Limitations

No system is perfectly secure. We cannot guarantee absolute security. You are responsible for:
- Keeping your account credentials confidential
- Securing your API keys
- Notifying us of suspected security incidents

### 5.4 Data Breach Notification

In the event of a data breach that affects your personal information, we will:
- Investigate the breach promptly
- Take steps to mitigate any harm
- Notify affected users as required by applicable law
- Report to relevant authorities where legally required

We will provide notification within the timeframes required by law (typically 72 hours for significant breaches) and will include information about what data was affected and steps you can take to protect yourself.

---

## 6. Data Retention

We retain your information for different periods based on the type of data:

| Data Type | Retention Period | Reason |
|-----------|-----------------|--------|
| **OAuth tokens** | Deleted immediately upon account deletion | Sensitive third-party credentials |
| **API keys** | Deleted immediately upon account deletion | Security-sensitive |
| **Account profile** (email, company) | 90 days after account deletion | Grace period for account recovery |
| **Usage logs** | 1 year after account deletion | Analytics, debugging, dispute resolution |
| **Billing records** | 3 years after account deletion | Tax compliance, legal requirements |

### 6.1 Active Accounts

While your account is active, we retain all data necessary to provide the Service.

### 6.2 Cached Data

Temporary cache data (rate limits, validated API keys) expires automatically and is cleaned up every 5 minutes.

---

## 7. Your Rights

### 7.1 Access Your Data

You can access most of your data through the dashboard:
- Account information in settings
- API keys and their metadata
- Farmer connections and their status
- Usage logs and analytics

### 7.2 Correct Your Data

You can update your account information (email, company name) through the dashboard.

### 7.3 Delete Your Data

You can delete:
- Individual API keys through the dashboard
- Individual farmer connections through the dashboard
- Your entire account by contacting us at [CONTACT_EMAIL]

Upon account deletion, data is removed according to our retention schedule above.

### 7.4 Export Your Data

Usage data is viewable in the dashboard. Contact us at [CONTACT_EMAIL] if you need a data export.

### 7.5 File a Complaint

If you believe we have violated your privacy rights or breached a data protection law, please contact us at [CONTACT_EMAIL] with full details of your concern. We will:
- Acknowledge your complaint within 5 business days
- Investigate your complaint promptly
- Respond in writing within 30 days, explaining our findings and any steps we will take

You also have the right to file a complaint with a regulatory body or data protection authority in your jurisdiction.

### 7.6 Opt Out of Communications

To unsubscribe from our emails:
- Click the "unsubscribe" link at the bottom of any email
- Or contact us at [CONTACT_EMAIL]

**Note**: You cannot opt out of essential service communications, including:
- Security alerts affecting your account
- Billing and payment notifications
- Changes to our Terms of Service or Privacy Policy
- Account verification messages

We may need to verify your identity before processing opt-out requests.

---

## 8. California Privacy Rights

If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA):

### 8.1 Right to Know

You have the right to request:
- What personal information we have collected
- The sources of that information
- Our business purpose for collecting it
- The categories of third parties with whom we share it
- The specific pieces of personal information we hold about you

### 8.2 Right to Delete

You have the right to request deletion of your personal information, subject to certain exceptions (e.g., legal compliance, completing transactions).

### 8.3 Right to Opt-Out of Sale

**We do not sell your personal information.** Therefore, there is no need to opt out.

### 8.4 Right to Non-Discrimination

We will not discriminate against you for exercising your privacy rights.

### 8.5 How to Exercise Your Rights

To exercise your CCPA rights, contact us at [CONTACT_EMAIL]. We will respond within 45 days. We may need to verify your identity before processing your request.

### 8.6 Authorized Agents

You may designate an authorized agent to make requests on your behalf. We may require verification of both your identity and the agent's authorization.

---

## 9. Children's Privacy

The Service is intended for business use by adults. We do not knowingly collect personal information from anyone under 18 years of age.

If you believe we have collected information from a minor, please contact us immediately at [CONTACT_EMAIL], and we will delete that information.

---

## 10. Third-Party Links

The dashboard may contain links to third-party websites (e.g., John Deere, Stripe, documentation sites). We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.

---

## 11. International Users

This Service is intended for users in the United States. If you access the Service from outside the United States, you do so at your own risk and are responsible for compliance with your local laws.

We do not specifically target users in the European Union or other jurisdictions with additional data protection requirements (such as GDPR).

---

## 12. Changes to This Policy

We may update this Privacy Policy from time to time. When we make changes:

- We will update the "Last Updated" date at the top
- For material changes, we will provide notice via:
  - Email to your registered address
  - Prominent notice on the dashboard

If we intend to use your personal information for new purposes not described in this policy, we will notify you and, where required by law, obtain your consent before doing so. You will have the opportunity to opt out of such new uses where legally required.

Your continued use of the Service after changes take effect constitutes acceptance of the updated policy.

---

## 13. Contact Us

If you have questions about this Privacy Policy or our data practices, please contact us:

**[COMPANY_NAME]**

Email: [CONTACT_EMAIL]

Address: [PHYSICAL_ADDRESS]

---

## 14. Summary of Data Practices

### What We Collect

- Account info (email, company name)
- API key metadata (names, hashes, usage)
- Farmer connection data (identifiers, OAuth tokens, status)
- Usage logs (requests, performance, errors)
- Billing data (Stripe IDs, subscription status)

### How We Use It

- Provide and improve the Service
- Process payments
- Enforce rate limits and prevent abuse
- Communicate with you

### Who We Share With

- Supabase (infrastructure)
- Stripe (payments)
- John Deere (agricultural API)
- Vercel (hosting)
- Legal authorities (when required)

### How Long We Keep It

- OAuth tokens: Deleted immediately on account deletion
- Account data: 90 days after deletion
- Usage logs: 1 year after deletion
- Billing records: 3 years after deletion

### Your Rights

- Access, correct, and delete your data
- California residents: Additional CCPA rights

---

*This Privacy Policy is effective as of the date listed at the top of this document.*
