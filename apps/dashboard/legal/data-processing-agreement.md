# Data Processing Agreement

**Effective Date:** [EFFECTIVE_DATE]

**Last Updated:** January 10, 2026

---

This Data Processing Agreement ("DPA") forms part of the Terms of Service between [COMPANY_NAME] ("Processor," "we," "us," or "our") and the entity agreeing to these terms ("Controller," "you," or "your") and governs the processing of personal data in connection with the FieldMCP platform and related services (the "Service").

---

## 1. Definitions

**"Data Protection Laws"** means all applicable laws relating to data protection and privacy, including the California Consumer Privacy Act (CCPA) and other US state privacy laws.

**"Personal Data"** means any information relating to an identified or identifiable natural person processed by the Processor on behalf of the Controller in connection with the Service.

**"Processing"** means any operation performed on Personal Data, including collection, recording, organization, storage, adaptation, retrieval, consultation, use, disclosure, erasure, or destruction.

**"Data Subject"** means the identified or identifiable natural person to whom Personal Data relates, including Farmers whose agricultural data is accessed through the Service.

**"Farmer"** means an individual or entity whose agricultural data account is connected to the Service through OAuth authorization.

**"Sub-processor"** means any third party engaged by the Processor to process Personal Data on behalf of the Controller.

**"Security Incident"** means any accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to Personal Data.

---

## 2. Scope and Roles

### 2.1 Roles of the Parties

- **Controller**: You determine the purposes and means of processing Farmer Personal Data. You are responsible for obtaining Farmer consent and ensuring lawful basis for processing.

- **Processor**: We process Personal Data solely on your behalf and according to your documented instructions as set forth in this DPA and the Service functionality.

- **Data Subjects**: Farmers whose agricultural data is accessed through connections you establish.

### 2.2 Subject Matter of Processing

The Processor processes Personal Data to provide the Service, which includes:

- Storing and managing OAuth tokens for Farmer connections
- Routing API requests to agricultural data providers
- Refreshing OAuth tokens automatically before expiration
- Logging usage data for billing and analytics
- Caching authentication and rate limit data

### 2.3 Duration of Processing

Processing begins when you create a Farmer connection and continues until:

- You delete the Farmer connection, or
- Your account is terminated, or
- You instruct us to delete the data

Post-termination, data is retained according to our Privacy Policy retention schedule.

### 2.4 Nature and Purpose of Processing

| Processing Activity | Purpose |
|---------------------|---------|
| Token storage | Enable API authentication with providers |
| Token encryption | Protect credentials at rest |
| Token refresh | Maintain continuous access |
| Request routing | Direct API calls to appropriate providers |
| Usage logging | Billing, analytics, debugging |
| Caching | Performance optimization, rate limiting |

### 2.5 Types of Personal Data

| Data Category | Examples |
|---------------|----------|
| OAuth credentials | Access tokens, refresh tokens |
| Account identifiers | Provider user IDs, organization IDs |
| Agricultural data (in transit) | Field names, equipment info, yield data |
| Usage metadata | Timestamps, tool names, response times |

### 2.6 Categories of Data Subjects

- Farmers who authorize OAuth connections
- Farm employees with provider account access
- Agricultural business operators

---

## 3. Controller Obligations

### 3.1 Lawful Basis

You represent and warrant that:

- You have a lawful basis for processing Farmer Personal Data
- You have obtained all necessary consents from Farmers before connecting their accounts
- You have provided Farmers with adequate privacy notices describing your use of their data
- Your use of the Service complies with all applicable Data Protection Laws

### 3.2 Instructions

Your instructions for processing are set forth in:

- This DPA
- The Terms of Service
- The Service documentation
- API requests you submit through the Service

You may provide additional written instructions, provided they are consistent with the Service functionality.

### 3.3 Farmer Communications

You are solely responsible for:

- Communicating with Farmers about data access and use
- Responding to Farmer inquiries about their data
- Notifying Farmers when connections require re-authentication
- Handling Farmer complaints or concerns

---

## 4. Processor Obligations

### 4.1 Processing Limitations

We will:

- Process Personal Data only on your documented instructions
- Not process Personal Data for our own purposes beyond providing the Service
- Not sell Personal Data to third parties
- Not share Personal Data for cross-context behavioral advertising

### 4.2 Confidentiality

We ensure that personnel authorized to process Personal Data:

- Are subject to confidentiality obligations
- Process Personal Data only as necessary to provide the Service
- Receive appropriate training on data protection

### 4.3 Security Measures

We implement and maintain appropriate technical and organizational measures to protect Personal Data, including:

**Encryption:**
- OAuth tokens encrypted at rest using ChaCha20-Poly1305 authenticated encryption
- Encryption keys stored in Supabase Vault (isolated from database)
- Automated quarterly key rotation with natural token migration
- All data transmitted over HTTPS/TLS 1.2+

**Access Controls:**
- Row-level security (RLS) ensuring tenant isolation
- API key authentication with SHA-256 hashing
- Rate limiting on authentication endpoints
- Automatic lockout after repeated authentication failures

**Infrastructure:**
- Managed infrastructure with SOC 2 Type II certified providers
- Database backups with point-in-time recovery
- Automatic cache expiration and cleanup

**Monitoring:**
- Error logging and alerting
- Authentication failure tracking
- Usage monitoring for anomaly detection

### 4.4 Sub-processors

#### 4.4.1 Authorized Sub-processors

You authorize the use of the following Sub-processors:

| Sub-processor | Purpose | Location | Data Processed |
|---------------|---------|----------|----------------|
| Supabase, Inc. | Database, authentication, edge functions | United States | All Personal Data |
| John Deere & Company | Agricultural data API provider | United States | OAuth tokens, API requests |
| Stripe, Inc. | Payment processing | United States | Controller email, billing data |
| Vercel, Inc. | Dashboard hosting | United States | Session data, cookies |

#### 4.4.2 Sub-processor Changes

We will:

- Notify you at least 30 days before adding or replacing Sub-processors
- Provide you an opportunity to object to new Sub-processors
- If you object and we cannot accommodate your objection, you may terminate the affected Service

#### 4.4.3 Sub-processor Obligations

We ensure that Sub-processors:

- Are bound by data protection obligations no less protective than this DPA
- Implement appropriate security measures
- Process Personal Data only as necessary to provide their services

### 4.5 Data Subject Rights

We will assist you in responding to Data Subject requests to exercise their rights under applicable Data Protection Laws, including requests to:

- Access their Personal Data
- Correct inaccurate Personal Data
- Delete their Personal Data
- Restrict processing
- Data portability

**Response Process:**

1. If we receive a request directly from a Data Subject, we will promptly notify you
2. We will provide reasonable assistance to help you respond within required timeframes
3. Assistance beyond standard Service functionality may be subject to additional fees

### 4.6 Security Incident Response

#### 4.6.1 Notification

If we become aware of a Security Incident affecting Personal Data, we will:

- Notify you without undue delay and in any event within 72 hours
- Provide notification to [CONTACT_EMAIL] or your designated security contact

#### 4.6.2 Notification Content

Our notification will include, to the extent known:

- Description of the nature of the Security Incident
- Categories and approximate number of Data Subjects affected
- Categories and approximate number of Personal Data records affected
- Name and contact details of our data protection contact
- Likely consequences of the Security Incident
- Measures taken or proposed to address the Security Incident

#### 4.6.3 Cooperation

We will:

- Cooperate with your investigation of the Security Incident
- Take reasonable steps to mitigate effects and prevent recurrence
- Not notify Data Subjects directly without your prior approval, unless required by law

### 4.7 Audits and Assessments

#### 4.7.1 Information Provision

Upon your reasonable request (no more than once per year), we will provide:

- Documentation of our security measures
- Summary of recent security assessments or certifications
- Answers to reasonable security questionnaires

#### 4.7.2 On-Site Audits

For Enterprise customers with appropriate contractual arrangements:

- We will allow audits by you or your designated third-party auditor
- Audits require 30 days' advance notice
- Audits must be conducted during normal business hours
- Audit scope is limited to processing activities covered by this DPA
- You bear the costs of audits you initiate

### 4.8 Data Deletion and Return

Upon termination of the Service or your written request:

**Immediate Deletion:**
- OAuth tokens (access and refresh)
- API keys
- Active cache entries

**Retained per Privacy Policy:**
- Account profile data: 90 days
- Usage logs: 1 year
- Billing records: 3 years (legal compliance)

We will certify deletion upon your request.

---

## 5. Data Transfers

### 5.1 Location of Processing

Personal Data is processed in the United States. All Sub-processors process data within the United States.

### 5.2 International Transfers

If you require data transfers subject to additional legal requirements (e.g., transfers from the EU), please contact us to discuss appropriate transfer mechanisms.

---

## 6. Liability

### 6.1 Allocation of Liability

Each party's liability under this DPA is subject to the limitations of liability in the Terms of Service.

### 6.2 Controller Liability

You are liable for:

- Ensuring lawful basis for processing
- Obtaining necessary Farmer consents
- Accuracy of instructions provided to us
- Your applications' compliance with Data Protection Laws

### 6.3 Processor Liability

We are liable for:

- Processing Personal Data contrary to your documented instructions
- Failure to implement agreed security measures
- Unauthorized Sub-processor engagement
- Security Incidents caused by our negligence

---

## 7. Term and Termination

### 7.1 Term

This DPA is effective from the Effective Date and continues for the duration of your use of the Service.

### 7.2 Survival

The following obligations survive termination:

- Confidentiality (indefinitely)
- Data deletion and return (until completed)
- Liability provisions
- Any obligation that by its nature should survive

---

## 8. General Provisions

### 8.1 Conflicts

In the event of a conflict between this DPA and the Terms of Service, this DPA governs with respect to Personal Data processing.

### 8.2 Amendments

We may update this DPA to reflect changes in Data Protection Laws or our processing activities. Material changes will be notified with 30 days' advance notice.

### 8.3 Governing Law

This DPA is governed by the laws specified in the Terms of Service.

---

## 9. Contact Information

For questions about this DPA or to exercise rights under it:

**Data Protection Contact:**

[COMPANY_NAME]

Email: [CONTACT_EMAIL]

Address: [PHYSICAL_ADDRESS]

---

## Appendix A: Technical and Organizational Security Measures

### A.1 Encryption

| Data | Method | Key Management |
|------|--------|----------------|
| OAuth tokens at rest | ChaCha20-Poly1305 | Supabase Vault (quarterly rotation) |
| Data in transit | TLS 1.2+ | Managed certificates |
| API keys | SHA-256 hash | Not reversible |
| Passwords | bcrypt (Supabase Auth) | Per-user salt |

### A.2 Access Controls

| Control | Implementation |
|---------|----------------|
| Authentication | Email/password via Supabase Auth |
| Authorization | Row-level security policies |
| API access | Hashed API keys with prefix identification |
| Rate limiting | Per-minute and monthly limits by tier |
| Brute force protection | IP-based lockout after failures |

### A.3 Infrastructure Security

| Measure | Provider |
|---------|----------|
| Database hosting | Supabase (AWS infrastructure) |
| Edge functions | Supabase (Deno runtime) |
| Dashboard hosting | Vercel |
| DDoS protection | Cloudflare (via providers) |
| Backups | Automated daily with PITR |

### A.4 Operational Security

| Practice | Description |
|----------|-------------|
| Logging | Request logging with error tracking |
| Monitoring | Uptime and error rate monitoring |
| Incident response | Documented response procedures |
| Access reviews | Periodic review of access permissions |

---

*By using the FieldMCP Service, you acknowledge that you have read and agree to this Data Processing Agreement.*
