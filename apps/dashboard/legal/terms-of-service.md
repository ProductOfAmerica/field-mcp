# Terms of Service

**Effective Date:** [EFFECTIVE_DATE]

**Last Updated:** January 10, 2026

---

## 1. Introduction and Acceptance

These Terms of Service ("Terms") govern your access to and use of the FieldMCP platform, APIs, dashboard, and related services (collectively, the "Service") operated by [COMPANY_NAME], a Missouri limited liability company ("Company," "we," "us," or "our").

By creating an account, accessing the Service, or using our APIs, you agree to be bound by these Terms. If you are using the Service on behalf of an organization, you represent that you have authority to bind that organization to these Terms.

**If you do not agree to these Terms, do not use the Service.**

**If you signed a separate agreement with us to access the Service with the same account, and that agreement has not ended, that separate agreement applies to your use of the Service instead of these Terms.**

---

## 2. Service Description

FieldMCP is a Model Context Protocol (MCP) infrastructure platform that provides developers with unified access to agricultural data APIs. The Service includes:

- **API Gateway**: Authenticated access to agricultural data providers through a single interface
- **Provider Integrations**: Currently John Deere; future integrations may include Climate FieldView, CNHi, and others
- **Developer Dashboard**: Account management, API key creation, farmer connection management, usage analytics, and billing
- **Farmer Connection Management**: OAuth-based authorization flows for connecting farmer accounts
- **Token Management**: Automatic refresh and lifecycle management of OAuth credentials

The Service is designed for developers building agricultural applications and farmers who authorize access to their agricultural data.

### 2.1 Read-Only Data Access

**The Service currently provides read-only access to equipment and agricultural data.** The Service retrieves information from third-party providers but does not and cannot:

- Control, operate, or command any physical equipment
- Start, stop, or modify equipment operations
- Adjust machine settings or parameters
- Schedule autonomous operations
- Send commands to tractors, combines, sprayers, or any machinery
- Trigger any action on physical equipment

**Any future features involving equipment control or commands will be subject to additional terms and explicit user consent.**

---

## 3. Account Terms

### 3.1 Eligibility

To use the Service, you must:

- Be located in the United States (the Service is available to US-based users only)
- Be at least 18 years old
- Be capable of forming a binding contract
- Use the Service for lawful purposes
- Provide accurate and complete registration information

### 3.2 Account Registration

When you create an account, you must provide:

- A valid email address
- A password meeting our security requirements
- Your company or business name

You agree to keep this information accurate and up to date.

### 3.3 Account Security

You are responsible for:

- Maintaining the confidentiality of your account credentials
- All activities that occur under your account
- Notifying us immediately of any unauthorized access

We are not liable for any loss resulting from unauthorized use of your account.

### 3.4 One Account Per Entity

Each business entity may maintain only one account. Creating multiple accounts to circumvent rate limits, abuse free tiers, or evade termination is prohibited.

---

## 4. API Keys

### 4.1 Key Generation

API keys are generated in the format `field_live_` followed by 32 random characters. When you create an API key:

- The full key is displayed **once** and cannot be recovered
- We store only a cryptographic hash of the key
- You must securely store the key immediately upon creation

### 4.2 Key Security

You are solely responsible for the security of your API keys. You must:

- Store keys securely and never commit them to version control
- Never share keys publicly or with unauthorized parties
- Use environment variables or secure secret management systems
- Rotate keys if you suspect compromise

### 4.3 Key Revocation

We may revoke API keys without notice if we determine they are being used in violation of these Terms or pose a security risk. You may deactivate your own keys at any time through the dashboard.

---

## 5. Farmer Connections

### 5.1 Authorization Responsibility

When you connect a farmer's account through our OAuth flow:

- **You** are responsible for obtaining the farmer's informed consent
- **You** must have a lawful basis for accessing the farmer's data
- **You** must comply with all applicable privacy laws and regulations
- **You** must clearly explain to farmers what data you will access and how you will use it

### 5.2 Data Controller and Processor Roles

For farmer data accessed through the Service:

- **You** are the data controller responsible for determining the purposes and means of processing
- **We** act as a data processor, processing farmer data on your behalf according to your instructions
- **Farmers** retain ownership of their agricultural data

### 5.3 Token Storage

We store OAuth tokens (access and refresh tokens) for farmer connections to enable API access and automatic token refresh. These tokens are encrypted with AES-256-GCM and stored in our database with row-level security, ensuring only you can access your connections.

### 5.4 Connection Failures

If a farmer connection fails (e.g., farmer revokes access, token refresh fails), the connection will be marked as requiring re-authentication. You are responsible for guiding your users through the re-authorization process.

---

## 6. Acceptable Use Policy

You agree NOT to:

### 6.1 Illegal Activities
- Use the Service for any unlawful purpose
- Violate any applicable laws or regulations
- Infringe on intellectual property rights

### 6.2 System Abuse
- Attempt to circumvent rate limits or usage quotas
- Interfere with or disrupt the Service or servers
- Probe, scan, or test vulnerabilities without authorization
- Introduce malware, viruses, or malicious code

### 6.3 Data Misuse
- Access data you are not authorized to access
- Scrape or bulk extract data beyond normal API usage patterns
- Resell raw API access without adding substantial value
- Use farmer data in ways not consented to by the farmer

### 6.4 Reverse Engineering
- Reverse engineer, decompile, or disassemble any part of the Service
- Attempt to derive source code or underlying algorithms
- Create derivative works based on the Service

### 6.5 Misrepresentation
- Impersonate any person or entity
- Misrepresent your affiliation with any person or entity
- Provide false information during registration

---

## 7. Billing and Payment

### 7.1 Subscription Tiers

We offer multiple subscription tiers with varying request limits and rate limits. Current pricing, features, and limits for each tier are available on our [Pricing Page](/pricing).

The pricing page is incorporated by reference into these Terms. In the event of a conflict between these Terms and the pricing page, these Terms govern except with respect to current prices and usage limits.

### 7.2 Payment Processing

Payments are processed by Stripe. By subscribing to a paid tier, you agree to Stripe's terms of service. You authorize us to charge your payment method on a recurring monthly basis.

### 7.3 No Refunds

**All sales are final. We do not provide refunds for any reason**, including:

- Partial month usage
- Unused API requests
- Cancellation before period end
- Dissatisfaction with the Service

### 7.4 Automatic Renewal

Paid subscriptions automatically renew each billing cycle. To prevent renewal, you must cancel at least 30 days before your next billing date. Cancellation takes effect at the end of the current billing period.

### 7.5 Rate Limit Enforcement

If you exceed your tier's rate limits:

- Per-minute limits: Requests are rejected with HTTP 429 status
- Monthly limits: Requests are rejected until the next billing cycle

We do not charge overage fees; your service is simply rate-limited.

### 7.6 Price Changes

We may change our prices with 30 days' notice. Price changes take effect at the start of your next billing cycle after the notice period.

---

## 8. Service Availability

### 8.1 No Uptime Guarantee

The Service is provided on an "as available" basis. We do not guarantee any specific uptime or availability. We may perform maintenance that temporarily interrupts the Service.

### 8.2 Third-Party Dependency

The Service depends on third-party APIs (John Deere, etc.) that are outside our control. We are not responsible for:

- Third-party API outages or degraded performance
- Changes to third-party APIs that affect functionality
- Data accuracy or completeness from third-party sources

### 8.3 Token Refresh

We attempt to automatically refresh OAuth tokens before they expire. However, token refresh may fail due to:

- Provider API issues
- Revoked farmer authorization
- Network connectivity problems

You should implement error handling for expired or invalid tokens.

---

## 9. Intellectual Property

### 9.1 Our Intellectual Property

We retain all rights to:

- The FieldMCP platform, APIs, and documentation
- Our trademarks, logos, and branding
- Any software, tools, or technology we provide

### 9.2 Your Intellectual Property

You retain all rights to:

- Applications you build using our Service
- Your business logic and proprietary code
- Your trademarks and branding

### 9.3 Farmer Data

Farmers retain ownership of their agricultural data. Neither you nor we acquire ownership rights to farmer data by virtue of it passing through the Service.

### 9.4 License Grant

We grant you a limited, non-exclusive, non-transferable, revocable license to use the Service in accordance with these Terms. This license terminates when your account is terminated.

---

## 10. Third-Party Services

### 10.1 Provider Terms

Your use of data from third-party providers (John Deere, etc.) is subject to those providers' terms of service. You are responsible for complying with all applicable provider terms.

### 10.2 Payment Processor

We use Stripe for payment processing. Your payment information is handled directly by Stripe according to their privacy policy and terms of service.

### 10.3 Infrastructure

We use Supabase for database and authentication services, and Vercel for dashboard hosting. Our use of these services is governed by our agreements with them.

---

## 11. Limitation of Liability

### 11.1 Disclaimer of Warranties

THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:

- MERCHANTABILITY
- FITNESS FOR A PARTICULAR PURPOSE
- NON-INFRINGEMENT
- ACCURACY OR COMPLETENESS OF DATA

### 11.2 Agricultural Data Accuracy Disclaimer

**WE DO NOT WARRANT THE ACCURACY, COMPLETENESS, TIMELINESS, OR RELIABILITY OF ANY AGRICULTURAL DATA ACCESSED THROUGH THE SERVICE.**

Specifically, we disclaim liability for:

- **Field boundary accuracy**: GeoJSON boundaries may not match legal property lines or actual field edges
- **Yield data accuracy**: Historical harvest data may contain sensor errors, calibration issues, or incomplete coverage
- **Planting data accuracy**: Seeding rates, dates, and varieties may be incorrectly recorded by equipment
- **Equipment information**: Machine status, specifications, and locations may be outdated or inaccurate
- **Map layers**: Prescription maps, yield maps, and spatial data may contain errors or gaps

You acknowledge that:

- Agricultural data originates from third-party equipment and providers
- Data may contain errors from sensors, calibration, connectivity, or human input
- Decisions based on this data are made at your sole risk
- We are not responsible for crop losses, equipment damage, input waste, yield reduction, or business decisions made using data from the Service
- You should verify critical data through independent sources before making significant agricultural decisions

### 11.3 Third-Party Service Dependency Disclaimer

**THE SERVICE DEPENDS ON THIRD-PARTY APIS AND INFRASTRUCTURE PROVIDERS OUTSIDE OUR CONTROL.**

We do not guarantee and are not responsible for:

- Availability or uptime of John Deere Operations Center APIs or any other agricultural data provider
- Changes to third-party API functionality, endpoints, or data formats
- Third-party authentication or OAuth service availability
- Data accuracy from agricultural equipment manufacturers
- Infrastructure provider (Supabase, Vercel) availability beyond their published SLAs
- Stripe payment processing availability

When third-party services are unavailable:

- API requests will fail or return errors
- Token refresh may not complete successfully
- Dashboard functionality may be limited
- Farmer connections may require re-authentication

You should:

- Implement error handling for failed API requests in your applications
- Cache critical data in your own systems where appropriate
- Not rely solely on our Service for time-sensitive or safety-critical operations
- Have contingency plans for service unavailability

### 11.4 Token Management Disclaimer

We attempt to automatically refresh OAuth tokens before expiration. However, token refresh may fail due to:

- Third-party API outages or rate limiting
- Farmer revoking authorization through the provider
- Network connectivity issues
- Token format or protocol changes by the provider
- Our infrastructure availability

When token refresh fails:

- Connections are marked as requiring re-authentication
- You are responsible for monitoring connection status
- You are responsible for notifying affected users and guiding them through re-authorization
- We do not send notifications directly to farmers
- Historical access is lost until re-authentication completes

### 11.5 No Agricultural Advice

**THE SERVICE DOES NOT PROVIDE AGRICULTURAL ADVICE, RECOMMENDATIONS, OR AGRONOMIC GUIDANCE.**

We do not:

- Recommend planting dates, varieties, or populations
- Advise on fertilizer, pesticide, or herbicide applications
- Suggest equipment settings or operational parameters
- Provide yield predictions or optimization recommendations
- Offer crop insurance, risk management, or financial guidance

For agricultural advice, consult qualified agronomists, extension services, or certified crop advisors.

### 11.6 Data Freshness Disclaimer

Agricultural data accessed through the Service may not reflect real-time conditions:

- **Equipment data**: May be hours or days old depending on connectivity and sync schedules
- **Field operations**: Recorded after completion, not during operations
- **Boundaries**: Reflect last known configuration, not necessarily current state
- **Telemetry**: Subject to equipment connectivity and provider update schedules

Do not use this Service for time-critical decisions requiring real-time data or for safety-critical applications.

### 11.7 Limitation of Damages

TO THE MAXIMUM EXTENT PERMITTED BY LAW:

- Our total liability for any claims arising from the Service shall not exceed the fees paid or payable by you to us in the 12 months immediately preceding the claim
- We shall not be liable for any indirect, incidental, special, consequential, or punitive damages
- We shall not be liable for lost profits, lost data, business interruption, or other commercial damages
- We shall not be liable for crop losses, yield reduction, equipment damage, input waste, or any agricultural losses

### 11.8 Essential Purpose

These limitations apply even if any remedy fails of its essential purpose.

---

## 12. Indemnification

### 12.1 Indemnification by You

You agree to indemnify, defend, and hold harmless the Company and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from:

- Your use of the Service
- Your violation of these Terms
- Your violation of any third-party rights
- Your applications built using the Service
- Your content, including farmer data you access through the Service
- Claims by farmers or other third parties related to your use of the Service
- Any claim that your content or your use of the Service in violation of these Terms infringes, misappropriates, or otherwise violates any third party's intellectual property or other proprietary rights

### 12.2 Indemnification by Us

We agree to indemnify, defend, and hold harmless you and your officers, directors, employees, and agents from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from any claim that the Service, when used by you in accordance with these Terms, infringes, misappropriates, or otherwise violates any third party's intellectual property or other proprietary rights.

**Exceptions:** We have no obligation under this section for claims arising from: (a) your modification of the Service; (b) your combination of the Service with materials not provided by us; (c) your use of the Service in violation of these Terms; or (d) third-party components, APIs, or data (including John Deere and other agricultural data providers).

### 12.3 Indemnification Procedure

The indemnified party must: (a) promptly notify the indemnifying party of the claim; (b) give the indemnifying party sole control of the defense and settlement; and (c) provide reasonable cooperation at the indemnifying party's expense. The indemnified party may participate in the defense at its own expense. The indemnifying party may not settle any claim that admits fault or imposes obligations on the indemnified party without the indemnified party's prior written consent.

---

## 13. Termination

### 13.1 Termination by You

You may cancel your account at any time through the dashboard or by contacting us. Cancellation takes effect at the end of your current billing period. No refunds are provided.

### 13.2 Termination by Us

We may suspend or terminate your account immediately, without notice, if:

- You violate these Terms
- You fail to pay fees when due
- Your use poses a security risk
- We are required to do so by law
- We discontinue the Service

### 13.3 Effect of Termination

Upon termination:

- Your API keys are immediately deactivated
- Your access to the dashboard is revoked
- Your data is deleted according to our retention policy:
  - OAuth tokens: Deleted immediately
  - API keys: Deleted immediately
  - Account profile: Deleted after 90 days
  - Usage logs: Deleted after 1 year
  - Billing records: Retained for 3 years (tax compliance)

### 13.4 Survival

The following sections survive termination: Intellectual Property, Limitation of Liability, Indemnification, Dispute Resolution, and any other provisions that by their nature should survive.

---

## 14. Dispute Resolution

### 14.1 Governing Law

These Terms are governed by the laws of the State of Missouri, without regard to conflict of law principles.

### 14.2 Informal Resolution

Before filing any legal action, you agree to attempt informal resolution by contacting us at [CONTACT_EMAIL]. We will attempt to resolve the dispute within 30 days.

### 14.3 Binding Arbitration

If informal resolution fails, any dispute shall be resolved by binding arbitration administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules. The arbitration shall take place in Missouri.

### 14.4 Class Action Waiver

YOU AGREE TO RESOLVE DISPUTES ONLY ON AN INDIVIDUAL BASIS AND WAIVE ANY RIGHT TO PARTICIPATE IN CLASS ACTIONS, CLASS ARBITRATIONS, OR REPRESENTATIVE ACTIONS.

### 14.5 Small Claims Exception

Either party may bring claims in small claims court if the claim qualifies.

### 14.6 Injunctive Relief

Notwithstanding the above, either party may seek injunctive relief in any court of competent jurisdiction to prevent irreparable harm.

---

## 15. Changes to Terms

### 15.1 Modifications

We may modify these Terms at any time. We will provide notice of material changes by:

- Email to your registered address
- Prominent notice on the dashboard
- At least 30 days before changes take effect

### 15.2 Acceptance

Your continued use of the Service after changes take effect constitutes acceptance of the modified Terms. If you do not agree to the changes, you must stop using the Service before they take effect.

---

## 16. General Provisions

### 16.1 Entire Agreement

These Terms, together with our Privacy Policy, constitute the entire agreement between you and the Company regarding the Service.

### 16.2 Severability

If any provision of these Terms is found unenforceable, the remaining provisions remain in effect.

### 16.3 Waiver

Our failure to enforce any right or provision does not constitute a waiver of that right or provision.

### 16.4 Assignment

You may not assign these Terms without our consent. We may assign these Terms without restriction.

### 16.5 No Agency

Nothing in these Terms creates a partnership, agency, or employment relationship.

---

## 17. Contact Information

If you have questions about these Terms, please contact us:

**[COMPANY_NAME]**

Email: [CONTACT_EMAIL]

Address: [PHYSICAL_ADDRESS]

---

*By using FieldMCP, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.*
