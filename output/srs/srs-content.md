# Software Requirements Specification — E-Commerce Platform

**Version:** 1.0 | **Author:** Engineering Team | **Date:** 2026-05-29

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the functional and non-functional requirements for the E-Commerce Platform. It serves as the basis for design, development, and testing activities. The document is intended for stakeholders including product owners, architects, developers, QA engineers, and operations teams.

### 1.2 Scope

The system covers the customer-facing ordering workflow: product browsing, shopping cart management, checkout, payment processing, and order tracking. The system integrates with external Payment Service Providers (PSPs) for transaction processing and an internal Notification Service for email/SMS alerts.

**In scope:**
- User authentication and registration
- Product catalog browsing and search
- Cart management (add, view, modify, save)
- Checkout flow (address, shipping, review)
- Payment processing with idempotency
- Voucher/discount application
- Order tracking and status updates

**Out of scope:**
- Inventory management (separate SRS)
- Fulfillment and shipping logistics
- Customer support ticketing
- Back-office analytics dashboard
- Third-party marketplace integration

### 1.3 Definitions and Acronyms

| Term | Definition |
|------|-----------|
| SKU | Stock Keeping Unit — unique product identifier |
| PII | Personally Identifiable Information |
| PSP | Payment Service Provider — external payment gateway |
| UC | Use Case |
| JWT | JSON Web Token |
| TOTP | Time-Based One-Time Password |
| MFA | Multi-Factor Authentication |
| PCI-DSS | Payment Card Industry Data Security Standard |
| TLS | Transport Layer Security |

### 1.4 References

| Reference | Description |
|-----------|-------------|
| IEEE 830-1998 | IEEE Recommended Practice for Software Requirements Specifications |
| BABOK Guide v3 | IIBA Business Analysis Body of Knowledge |
| PCI-DSS v4.0 | Payment Card Industry Data Security Standard |
| GDPR | EU General Data Protection Regulation |

### 1.5 Document Overview

| Section | Content |
|---------|---------|
| 1. Introduction | Purpose, scope, definitions, references |
| 2. Overall Description | Product perspective, functions, users, constraints |
| 3. Use Case Diagram | Visual overview of actor-UC relationships |
| 4. Use Case Specifications | Detailed UC specs with flow tables |
| 5. Sequence Diagrams | Interaction diagrams per use case |
| 6. Data Requirements | Data entities, storage, retention |
| 7. External Interface Requirements | User interfaces, hardware, software, communication |
| 8. Non-Functional Requirements | Performance, security, reliability, usability |
| 9. Appendices | Assumptions log, issue tracker |

---

## 2. Overall Description

### 2.1 Product Perspective

The E-Commerce Platform is a greenfield web application replacing a legacy monolithic ordering system. It follows a microservices architecture deployed on Kubernetes. The system integrates with:

| External System | Interface | Protocol |
|----------------|-----------|----------|
| Stripe PSP | REST API | HTTPS/TLS 1.3 |
| SendGrid Email Service | SMTP | TLS 1.2 |
| Twilio SMS Gateway | REST API | HTTPS/TLS 1.3 |
| Identity Provider (Auth0) | OAuth 2.0 / OIDC | HTTPS |
| Inventory Management System | gRPC | mTLS |
| Tax Calculation Service | REST API | HTTPS |

### 2.2 Product Functions

| Function Category | Description |
|------------------|-------------|
| User Management | Registration, authentication, profile management, password reset |
| Catalog Browsing | Product listing, search, filtering, detail view |
| Cart Management | Add, remove, update quantities, save for later |
| Checkout & Ordering | Address selection, shipping method, order review, placement |
| Payment Processing | Authorization, capture, refund, voucher application |
| Order Tracking | Status history, estimated delivery, notifications |
| Notifications | Email and SMS for order confirmation, shipping, delivery |

### 2.3 User Characteristics

| User Role | Technical Level | Usage Frequency | Key Needs |
|-----------|----------------|-----------------|-----------|
| Customer | Basic computer literacy | Daily–weekly | Browse, purchase, track orders |
| Guest | Basic computer literacy | Occasional | Browse catalog, register |
| Platform Admin | Advanced | Daily | Monitor orders, manage catalog |
| Operations Staff | Intermediate | Hourly | Review payment exceptions |

### 2.4 Constraints

| Constraint | Description |
|-----------|-------------|
| Platform | Web application, responsive (mobile/tablet/desktop) |
| Browser Support | Chrome 90+, Firefox 90+, Safari 15+, Edge 90+ |
| Language | English (primary); I18n-ready architecture for future locales |
| Payment | Stripe PSP only (v1.0); PSP abstraction layer for future providers |
| Deployment | Kubernetes clusters in AWS (us-east-1 primary, eu-west-1 DR) |
| Compliance | PCI-DSS Level 1, GDPR, CCPA |
| Budget | Operational cost ≤ $50K/month at launch |

### 2.5 Assumptions and Dependencies

| ID | Description | Impact if Invalid |
|----|-------------|-------------------|
| AS-01 | Stripe API availability ≥ 99.95% | Payment processing fails; fallback queue |
| AS-02 | AWS infrastructure meets SLA | Service degradation; DR plan activated |
| AS-03 | Customers have internet access and modern browser | Reduced user base |
| AS-04 | Inventory system gRPC endpoint available | Cart/checkout shows stale inventory |
| AS-05 | Tax rates updated quarterly by finance team | Incorrect tax collected; manual correction |

---

## 3. Actors

| Actor | Type | Description |
|-------|------|-------------|
| Customer | Primary | Registered user browsing and purchasing products |
| Guest | Primary | Unauthenticated user with limited access (browse, register) |
| Admin | Primary | Platform administrator managing catalog, orders, users |
| Payment Gateway | Secondary | External PSP processing payment transactions |
| Notification Service | Secondary | Internal service sending email/SMS alerts |
| Inventory System | Secondary | Internal service managing stock levels |
| Tax Service | Secondary | Internal service calculating applicable taxes |

---

## 4. Use Case Index

| UC ID | UC Name | Primary Actor | Priority | Status |
|-------|---------|---------------|----------|--------|
| UC-AUTH-01 | Authenticate User | Customer, Admin | High | Draft |
| UC-AUTH-02 | Register Account | Guest | High | Draft |
| UC-CART-01 | Add Item to Cart | Customer, Guest | High | Draft |
| UC-CART-02 | View Cart | Customer, Guest | Medium | Draft |
| UC-ORDER-01 | Place Order | Customer | High | Specified |
| UC-ORDER-02 | Track Order | Customer | Medium | Draft |
| UC-PAY-01 | Process Payment | Customer | High | Specified |
| UC-PAY-02 | Apply Voucher | Customer | Low | Specified |

**Status legend:** Draft = identified, not detailed | Specified = fully documented with flows

---

## 5. Use Case Diagram

![Diagram:usecase](diagrams/usecase-diagram.svg)

*Figure 5-1: System Use Case Diagram — shows actor relationships and include/extend dependencies.*

**Include relationships:**
- UC-ORDER-01 (Place Order) always includes UC-AUTH-01 (Authenticate User) and UC-PAY-01 (Process Payment)

**Extend relationships:**
- UC-PAY-02 (Apply Voucher) optionally extends UC-ORDER-01 (Place Order) — voucher application is conditional

---

## 6. Use Case Specifications

### UC-ORDER-01: Place Order

| **Use Case ID:**        | UC-ORDER-01 |
| **Use Case Name:**      | Place Order |
| **Created By:**         | BA Team | **Last Updated By:** | BA Team |
| **Date Created:**       | 2026-05-29 | **Date Last Updated:** | 2026-05-29 |

| **Actor:**              | Customer (primary) / Payment Gateway, Notification Service (secondary) |
| **Description:**        | Customer finalizes cart contents, selects shipping method, provides delivery address, and confirms purchase. System validates inventory, processes payment, creates order record, and sends confirmation. Successful outcome: order created with unique ID, payment authorized, inventory reserved. |
| **Trigger:**            | Customer clicks "Proceed to Checkout" from the cart page. |
| **Preconditions:**      | 1. Customer is authenticated. 2. Cart contains at least one item. 3. All cart items have available inventory. |
| **Postconditions:**     | 1. Order record created with status "Pending Fulfillment". 2. Payment authorized and funds held. 3. Inventory reserved for ordered items. 4. Order confirmation email sent to customer. 5. Cart contents cleared. |
| **Priority:**           | High |
| **Frequency of Use:**   | 500–2,000 times per day (peak: 5,000/day during promotions) |
| **Includes:**           | UC-AUTH-01 (Authenticate User), UC-PAY-01 (Process Payment) |
| **Special Requirements:** | 1. Page load ≤ 1.5s for checkout flow. 2. Payment data encrypted via TLS 1.3. 3. PCI-DSS Level 1 compliance. 4. Order processing ≤ 5s from confirmation click. 5. Idempotent submission (duplicate click protection). |
| **Assumptions:**        | 1. Customer has valid payment method. 2. Shipping is available to delivery address. 3. Tax calculation rules are current. 4. Inventory system operational. |
| **Notes and Issues:**   | TBD-1: Multi-currency support — Product Owner — Q3 2026. TBD-2: Split shipment logic — Architect — Q4 2026. |

#### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Customer clicks "Proceed to Checkout" from cart page | |
| 2 | | System validates customer is authenticated (includes UC-AUTH-01) |
| 3 | | System displays checkout page: order summary, shipping options, saved addresses |
| 4 | Customer selects or enters delivery address | |
| 5 | | System validates address format and calculates shipping cost + estimated delivery |
| 6 | Customer selects shipping method (Standard / Express / Next Day) | |
| 7 | | System recalculates order total: subtotal + shipping + tax − discounts |
| 8 | Customer reviews order summary and clicks "Place Order" | |
| 9 | | System validates inventory availability for all cart items |
| 10 | | System processes payment via Payment Gateway (includes UC-PAY-01) |
| 11 | | System creates order record with status "Pending Fulfillment" and unique order ID |
| 12 | | System reserves inventory for all ordered items |
| 13 | | System sends order confirmation email via Notification Service |
| 14 | | System displays order confirmation page: order ID, items, total, estimated delivery |
| 15 | | System clears customer's cart |

#### Alternative Courses

**AC.1: Save Cart for Later** — At step 1, if customer chooses to defer checkout:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1.1 | Customer clicks "Save for Later" | |
| AC.1.2 | | System persists cart state with "Saved" flag |
| AC.1.3 | | System redirects to product browsing page |
| **Resume:** Customer can retrieve saved cart from account menu > Saved Carts | | |

**AC.2: Switch Payment Method** — At step 8, if customer changes payment:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.2.1 | Customer clicks "Change Payment Method" | |
| AC.2.2 | | System displays saved payment methods + "Add New" option |
| AC.2.3 | Customer selects alternative payment method | |
| AC.2.4 | | System updates selected payment and returns to step 8 |
| **Resume:** Continue checkout with new payment method | | |

**AC.3: Edit Cart from Checkout** — At step 3, if customer modifies cart:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.3.1 | Customer clicks "Edit Cart" | |
| AC.3.2 | | System returns to cart page, preserving address/shipping selections |
| AC.3.3 | Customer modifies items or quantities | |
| AC.3.4 | Customer clicks "Proceed to Checkout" | |
| AC.3.5 | | System returns to step 3 with updated order summary |
| **Resume:** Continue checkout with modified cart | | |

#### Exceptions

**EX.1: Inventory Unavailable** — At step 9, if any item no longer in stock:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System highlights out-of-stock items with "Unavailable" badge |
| EX.1.2 | | System offers options: Remove item, Save for later, Notify when available |
| **Final state:** Customer cannot proceed without removing unavailable items |

**EX.2: Payment Declined** — At step 10, if payment gateway declines:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System displays decline reason (insufficient funds, expired card, etc.) |
| EX.2.2 | | System prompts customer to try different payment method |
| EX.2.3 | | System returns to step 8, preserving all entered information |
| **Final state:** Order not created; cart and selections preserved |

**EX.3: Checkout Session Timeout** — At any step, if session expires (30 min inactivity):

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System displays "Session expired — please log in again" message |
| EX.3.2 | | System redirects to login page (UC-AUTH-01) |
| **Final state:** Cart preserved in database; customer resumes after re-authentication |

**EX.4: Concurrent Inventory Conflict** — At step 11, if another order reserved same item between step 9 and step 12:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.4.1 | | System detects inventory reservation conflict |
| EX.4.2 | | System rolls back payment authorization |
| EX.4.3 | | System displays "Some items are no longer available" message |
| **Final state:** Order not created; customer returns to step 3 with updated availability |

---

### UC-PAY-01: Process Payment

| **Use Case ID:**        | UC-PAY-01 |
| **Use Case Name:**      | Process Payment |
| **Created By:**         | BA Team | **Last Updated By:** | BA Team |
| **Date Created:**       | 2026-05-29 | **Date Last Updated:** | 2026-05-29 |

| **Actor:**              | Customer (primary) / Payment Gateway (secondary) |
| **Description:**        | System charges customer's selected payment method via external PSP. Transaction is authorized (funds held) for physical goods or captured immediately for digital goods. Successful outcome: payment authorized, transaction ID recorded. |
| **Trigger:**            | Called by UC-ORDER-01 (Place Order) at payment step. |
| **Preconditions:**      | 1. Customer is authenticated. 2. Order total calculated. 3. Valid payment method selected. |
| **Postconditions:**     | 1. Payment authorized and funds held. 2. Transaction ID recorded in order. 3. Payment status "Authorized". |
| **Priority:**           | High |
| **Frequency of Use:**   | 500–2,000 times per day |
| **Includes:**           | None |
| **Special Requirements:** | 1. PCI-DSS Level 1 compliance. 2. No raw card data stored on platform. 3. Idempotency key prevents duplicate charges. 4. PSP response timeout: 10s. |
| **Assumptions:**        | 1. PSP API available and responsive. 2. Payment method valid and has sufficient funds. |
| **Notes and Issues:**   | TBD-3: BNPL (Buy Now Pay Later) support — Product Owner — Q1 2027. |

#### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | | System sends authorization request to Payment Gateway: amount, currency, payment token, order reference, idempotency key |
| 2 | | Payment Gateway processes authorization and returns result with transaction ID |
| 3 | | System validates response signature and integrity |
| 4 | | System records transaction: transaction ID, amount, currency, status, timestamp |
| 5 | | System updates order payment status to "Authorized" |

#### Exceptions

**EX.1: Payment Declined** — At step 2, if gateway returns decline:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System records decline reason and code from gateway |
| EX.1.2 | | System returns decline to calling UC (UC-ORDER-01 EX.2) |
| **Final state:** Payment not processed; calling UC handles user notification |

**EX.2: Gateway Timeout** — At step 1, if gateway does not respond within 10s:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System retries once with same idempotency key |
| EX.2.2 | | If still no response, system marks payment "Pending Review" |
| EX.2.3 | | System creates operations ticket for manual reconciliation |
| **Final state:** Payment status "Pending Review"; order not created |

**EX.3: Idempotency Duplicate** — At step 1, if same idempotency key already processed:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System returns original transaction result without re-processing |
| EX.3.2 | | System logs "duplicate payment attempt prevented" event |
| **Final state:** No duplicate charge; original transaction referenced |

---

### UC-PAY-02: Apply Voucher

| **Use Case ID:**        | UC-PAY-02 |
| **Use Case Name:**      | Apply Voucher |
| **Created By:**         | BA Team | **Last Updated By:** | BA Team |
| **Date Created:**       | 2026-05-29 | **Date Last Updated:** | 2026-05-29 |

| **Actor:**              | Customer |
| **Description:**        | Customer enters a voucher code during checkout to receive a discount on the order total. System validates the voucher against business rules, calculates the discount amount, and updates the order total. Successful outcome: discount applied and reflected in order summary. |
| **Trigger:**            | Customer enters voucher code in checkout voucher field and clicks "Apply". |
| **Preconditions:**      | 1. Customer is in checkout flow. 2. Order subtotal > 0. |
| **Postconditions:**     | 1. Voucher discount applied to order total. 2. Voucher marked "Used" (if single-use). 3. Updated order total displayed. |
| **Priority:**           | Low |
| **Frequency of Use:**   | 50–200 times per day |
| **Includes:**           | None |
| **Special Requirements:** | 1. Voucher validation ≤ 200ms. 2. Support percentage (10% off) and fixed-amount ($5 off) types. 3. Stackable logic: maximum 2 vouchers per order. |
| **Assumptions:**        | 1. Vouchers pre-generated by marketing team. 2. Voucher rules stored in Voucher Service database. |
| **Notes and Issues:**   | None |

#### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Customer enters voucher code in Voucher field, clicks "Apply" | |
| 2 | | System queries Voucher Service with code, customer ID, order subtotal |
| 3 | | System validates: not expired, not exceeded usage limit, meets minimum order |
| 4 | | System calculates discount: percentage-based or fixed-amount |
| 5 | | System recalculates order total: subtotal − discount + shipping + tax |
| 6 | | System displays success message: "Voucher applied! You saved $X.XX" |
| 7 | | System updates order summary with discount line item |

#### Exceptions

**EX.1: Invalid Voucher Code** — At step 2, if code not found:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System displays "Invalid voucher code — please check and try again" |
| EX.1.2 | | System highlights voucher input field, preserves entered text for correction |
| **Final state:** No discount applied; customer can retry |

**EX.2: Voucher Expired** — At step 3, if expiry date passed:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System displays "This voucher expired on [date]" |
| **Final state:** No discount applied |

**EX.3: Minimum Order Not Met** — At step 3, if subtotal below threshold:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System displays "Minimum order of $X.XX required for this voucher" |
| **Final state:** No discount applied; customer may increase cart subtotal |

**EX.4: Voucher Already Used** — At step 3, if single-use and customer has prior usage:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.4.1 | | System displays "You have already used this voucher on order #ORD-XXXXX" |
| **Final state:** No discount applied |

---

## 7. Sequence Diagrams

### SD for UC-ORDER-01: Place Order

![Diagram:sequence](diagrams/sd-UC-ORDER-01.svg)

*Figure 7-1: Sequence diagram for Place Order — covers main flow and payment decline alternative.*

### SD for UC-PAY-01: Process Payment

![Diagram:sequence](diagrams/sd-UC-PAY-01.svg)

*Figure 7-2: Sequence diagram for Process Payment — covers authorization, decline, timeout, and idempotency.*

### SD for UC-PAY-02: Apply Voucher

![Diagram:sequence](diagrams/sd-UC-PAY-02.svg)

*Figure 7-3: Sequence diagram for Apply Voucher — covers validation, discount calculation, and error paths.*

---

## 8. Data Requirements

### 8.1 Core Entities

| Entity | Description | Key Attributes |
|--------|-------------|----------------|
| Customer | Registered user account | customerId, email, passwordHash, createdAt, status |
| Product | Catalog item available for purchase | productId, sku, name, price, inventoryCount, categoryId |
| Cart | Customer's shopping session | cartId, customerId, items[], createdAt, updatedAt |
| CartItem | Item within a cart | cartItemId, cartId, productId, quantity, unitPrice |
| Order | Completed purchase | orderId, customerId, status, subtotal, shipping, tax, discount, total, createdAt |
| OrderItem | Item within an order | orderItemId, orderId, productId, quantity, unitPrice |
| Payment | Payment transaction | paymentId, orderId, transactionId, amount, currency, status, gatewayResponse |
| Voucher | Discount code | voucherId, code, type, value, minOrder, expiryDate, usageLimit |
| VoucherUsage | Record of voucher use | usageId, voucherId, customerId, orderId, usedAt |

### 8.2 Data Retention

| Data Category | Retention Period | Justification |
|--------------|-----------------|---------------|
| Order records | 7 years | Tax/audit compliance |
| Payment transactions | 7 years | Financial record keeping |
| Customer PII | Until account deletion + 30 days | GDPR right to erasure |
| Cart data | 90 days (abandoned), cleared on order | Storage optimization |
| Voucher usage | 2 years | Marketing analytics |
| Session tokens | 15 min (access), 7 days (refresh) | Security best practice |
| Audit logs | 1 year online, 7 years cold storage | Compliance, troubleshooting |

### 8.3 Data Integrity

- All monetary amounts stored as integer cents (avoid floating-point)
- Order status transitions follow defined state machine (no invalid transitions)
- Payment idempotency enforced by unique key per request
- All timestamps stored in UTC

---

## 9. External Interface Requirements

### 9.1 User Interfaces

| Interface | Platform | Key Requirements |
|-----------|----------|-----------------|
| Web Application | Desktop browser (primary) | Responsive 1024px–1920px; WCAG 2.1 AA |
| Mobile Web | Mobile browser | Responsive 320px–768px; touch-optimized |
| Admin Dashboard | Desktop browser | Data tables with pagination, bulk operations |

### 9.2 Hardware Interfaces

None — pure software application deployed on cloud infrastructure.

### 9.3 Software Interfaces

| Interface | Type | Protocol | Authentication |
|-----------|------|----------|---------------|
| Stripe API | External REST | HTTPS/TLS 1.3 | API key + webhook signature |
| SendGrid API | External REST | HTTPS/TLS 1.2 | API key |
| Auth0 | External OIDC | HTTPS | Client secret + JWT validation |
| Inventory Service | Internal gRPC | mTLS | Service account |
| Tax Service | Internal REST | HTTPS | Service account |

### 9.4 Communication Interfaces

| Communication | Protocol | Format |
|--------------|----------|--------|
| Client ↔ API Gateway | HTTPS | JSON (REST) |
| API Gateway ↔ Microservices | gRPC | Protobuf |
| Async Events (order created, payment processed) | Kafka | Avro |
| Webhooks (PSP callbacks) | HTTPS | JSON |

---

## 10. Non-Functional Requirements

### 10.1 Performance

| Requirement | Target | Measurement |
|------------|--------|-------------|
| Page load (catalog) | ≤ 1.0s (P95) | Lighthouse / Real User Monitoring |
| Page load (checkout) | ≤ 1.5s (P95) | RUM |
| API response (auth) | ≤ 200ms (P95) | APM traces |
| API response (order create) | ≤ 5s (P99) | APM traces |
| Payment processing | ≤ 3s (P95) excluding PSP | APM traces |
| Concurrent users | 10,000 simultaneous | Load test |
| Throughput | 500 orders/minute sustained | Load test |

### 10.2 Security

| Requirement | Implementation |
|-------------|---------------|
| Authentication | JWT access token (15 min) + refresh token (7 day rotation) |
| Authorization | Role-Based Access Control (RBAC): Customer, Admin, Operations |
| Data in Transit | TLS 1.3 (all external), mTLS (inter-service) |
| Data at Rest | AES-256 encryption for PII fields, KMS key management |
| Payment Security | PCI-DSS Level 1; no raw card data stored |
| Rate Limiting | 100 req/min per IP (general), 5 login attempts/email/30min |
| Input Validation | Server-side validation for all inputs; sanitize HTML/script |
| Dependency Scanning | Automated CVE scanning in CI/CD pipeline |
| Secrets Management | HashiCorp Vault; no secrets in code or config |

### 10.3 Reliability

| Requirement | Target |
|-------------|--------|
| System Uptime | 99.95% (≤ 4.38 hours downtime/year) |
| Data Durability | 99.999999999% (11 9's) for order data |
| Recovery Point Objective (RPO) | ≤ 5 minutes |
| Recovery Time Objective (RTO) | ≤ 30 minutes |
| Graceful Degradation | Checkout available even if recommendation engine down |

### 10.4 Availability

- Multi-AZ deployment in primary region (us-east-1)
- Disaster recovery in secondary region (eu-west-1) with 15-min data lag
- Auto-scaling based on CPU/memory/request count
- Circuit breaker pattern for external dependencies (PSP, email, SMS)
- Health check endpoints for load balancer and Kubernetes probes

### 10.5 Maintainability

- Microservices: independently deployable, bounded contexts
- Infrastructure as Code (Terraform) for all cloud resources
- Structured logging (JSON) with correlation IDs across services
- Distributed tracing (OpenTelemetry) with 1% sample rate, 100% for errors
- Automated deployment via ArgoCD GitOps pipeline
- Code coverage ≥ 80% for unit tests, ≥ 60% for integration tests

### 10.6 Usability

- WCAG 2.1 AA compliance (accessibility)
- Page load skeleton screens (perceived performance)
- Form validation with inline error messages
- Undo capability for cart removals (30-second window)
- Mobile-responsive design (320px minimum width)

---

## 11. Appendices

### Appendix A: Assumptions Log

| ID | Assumption | Status | Validated By | Date |
|----|-----------|--------|-------------|------|
| AS-01 | Stripe PSP availability ≥ 99.95% | Accepted | Architect | 2026-05-29 |
| AS-02 | Customers use modern browsers | Accepted | Product Owner | 2026-05-29 |
| AS-03 | Inventory available for all cart items at checkout | At risk — concurrent users | TBD | TBD |
| AS-04 | Tax rules updated quarterly by finance | Accepted | Finance Team | 2026-05-29 |
| AS-05 | Single currency (USD) for v1.0 | Accepted | Product Owner | 2026-05-29 |

### Appendix B: Open Issues

| ID | Description | Owner | Due Date | Resolution |
|----|-------------|-------|----------|------------|
| TBD-1 | Multi-currency support | Product Owner | Q3 2026 | — |
| TBD-2 | Split shipment logic | Architect | Q4 2026 | — |
| TBD-3 | BNPL payment support | Product Owner | Q1 2027 | — |
| TBD-4 | Passkey/WebAuthn authentication | Security | Q2 2027 | — |
| TBD-5 | A/B testing framework for checkout flow | Product Owner | Q2 2027 | — |

### Appendix C: Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-29 | BA Team | Initial draft: UC-ORDER-01, UC-PAY-01, UC-PAY-02 specified |
