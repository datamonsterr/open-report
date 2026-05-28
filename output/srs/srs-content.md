# Software Requirements Specification — E-Commerce Platform

**Version:** 1.0 | **Author:** Engineering Team | **Date:** 2026-05-29

---

## 1. Introduction

### 1.1 Purpose
This SRS defines functional and non-functional requirements for the E-Commerce Platform.

### 1.2 Scope
Customer-facing ordering system: product browsing, cart management, checkout, payment, and order tracking.

### 1.3 Definitions
| Term | Definition |
|------|-----------|
| SKU | Stock Keeping Unit |
| PII | Personally Identifiable Information |
| PSP | Payment Service Provider |

---

## 2. Actors

| Actor | Type | Description |
|-------|------|-------------|
| Customer | Primary | Registered user browsing and purchasing products |
| Guest | Primary | Unauthenticated user with limited access |
| Admin | Primary | Platform administrator managing catalog and orders |
| Payment Gateway | Secondary | External PSP processing payments |
| Notification Service | Secondary | Internal service sending email/SMS alerts |

---

## 3. Use Case Index

| UC ID | UC Name | Primary Actor | Priority |
|-------|---------|---------------|----------|
| UC-AUTH-01 | Authenticate User | Customer | High |
| UC-AUTH-02 | Register Account | Guest | High |
| UC-CART-01 | Add Item to Cart | Customer | High |
| UC-CART-02 | View Cart | Customer | Medium |
| UC-ORDER-01 | Place Order | Customer | High |
| UC-ORDER-02 | Track Order | Customer | Medium |
| UC-PAY-01 | Process Payment | Customer | High |
| UC-PAY-02 | Apply Voucher | Customer | Low |

---

## 4. Use Case Diagram

![Diagram:usecase](diagrams/usecase-diagram.svg)

---

## 5. Use Case Specifications

### UC-ORDER-01: Place Order

| **Use Case ID:**        | UC-ORDER-01 |
| **Use Case Name:**      | Place Order |
| **Created By:**         | BA Team | **Last Updated By:** | BA Team |
| **Date Created:**       | 2026-05-29 | **Date Last Updated:** | 2026-05-29 |

| **Actor:**              | Customer (primary) / Payment Gateway, Notification Service (secondary) |
| **Description:**        | Customer finalizes cart contents, selects shipping method, provides delivery address, and confirms purchase. System validates inventory, processes payment, creates order record, and sends confirmation. Successful outcome: order created with unique ID, payment authorized, inventory reserved. |
| **Preconditions:**      | 1. Customer is authenticated. 2. Cart contains at least one item. 3. All cart items have available inventory. |
| **Postconditions:**     | 1. Order record created with status "Pending Fulfillment". 2. Payment authorized and held. 3. Inventory reserved for ordered items. 4. Order confirmation email sent to customer. 5. Cart cleared. |
| **Priority:**           | High |
| **Frequency of Use:**   | 500–2000 times per day |
| **Includes:**           | UC-AUTH-01 (Authenticate User), UC-PAY-01 (Process Payment) |
| **Special Requirements:** | 1. Page load ≤ 1.5s for checkout flow. 2. Payment data encrypted via TLS 1.3. 3. PCI-DSS Level 1 compliance. 4. Order processing ≤ 5s from confirmation click. |
| **Assumptions:**        | 1. Customer has valid payment method. 2. Shipping is available to delivery address. 3. Tax calculation rules are current. |
| **Notes and Issues:**   | TBD-1: Multi-currency support — Product Owner — Q3 2026. TBD-2: Split shipment logic — Architect — Q4 2026. |

#### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Customer clicks "Proceed to Checkout" from cart page | |
| 2 | | System displays checkout page: order summary, shipping options, saved addresses |
| 3 | Customer selects or enters delivery address | |
| 4 | | System validates address and calculates shipping cost + estimated delivery |
| 5 | Customer selects shipping method (Standard/Express) | |
| 6 | | System recalculates order total: subtotal + shipping + tax |
| 7 | Customer reviews order summary and clicks "Place Order" | |
| 8 | | System validates inventory availability for all items |
| 9 | | System processes payment via Payment Gateway (includes UC-PAY-01) |
| 10 | | System creates order record with status "Pending Fulfillment" |
| 11 | | System reserves inventory for all ordered items |
| 12 | | System sends order confirmation email via Notification Service |
| 13 | | System displays order confirmation page with order ID, estimated delivery date |
| 14 | | System clears customer's cart |

#### Alternative Courses

**AC.1: Save for Later** — At step 1, if customer chooses to save cart:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.1.1 | Customer clicks "Save for Later" | |
| AC.1.2 | | System saves cart state and returns to product browsing |
| **Resume:** Customer can return to checkout from saved cart later | | |

**AC.2: Use Different Payment Method** — At step 8, if customer switches payment:

| Step | Actor | System Response |
|------|-------|-----------------|
| AC.2.1 | Customer selects different saved payment method | |
| AC.2.2 | | System updates payment method and returns to step 7 |
| **Resume:** Continue to step 8 with new payment method | | |

#### Exceptions

**EX.1: Inventory Unavailable** — At step 8, if any item no longer in stock:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System highlights out-of-stock items with "Unavailable" badge |
| EX.1.2 | | System offers options: Remove item, Save for later, Notify when available |
| **Final state:** Customer cannot proceed until unavailable items are removed |

**EX.2: Payment Declined** — At step 9, if payment gateway declines:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System displays decline reason (insufficient funds, card expired, etc.) |
| EX.2.2 | | System prompts customer to try different payment method |
| EX.2.3 | | System returns to step 7, preserving all entered information |
| **Final state:** Order not created; cart contents preserved |

**EX.3: Checkout Timeout** — At any step, if session expires (30 min inactivity):

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System displays "Session expired" message |
| EX.3.2 | | System requires re-authentication (redirect to UC-AUTH-01) |
| **Final state:** Cart preserved; customer returns to step 1 after re-auth |

---

### UC-PAY-01: Process Payment

| **Use Case ID:**        | UC-PAY-01 |
| **Use Case Name:**      | Process Payment |
| **Created By:**         | BA Team | **Last Updated By:** | BA Team |
| **Date Created:**       | 2026-05-29 | **Date Last Updated:** | 2026-05-29 |

| **Actor:**              | Customer (primary) / Payment Gateway (secondary) |
| **Description:**        | System charges customer's selected payment method via external PSP. Transaction is either authorized (funds held) for physical goods or captured immediately for digital goods. Successful outcome: payment authorized, transaction ID recorded. |
| **Preconditions:**      | 1. Customer is authenticated. 2. Order total has been calculated. 3. Customer selected a payment method. |
| **Postconditions:**     | 1. Payment authorized and funds held. 2. Transaction ID recorded in order. 3. Payment status set to "Authorized". |
| **Priority:**           | High |
| **Frequency of Use:**   | 500–2000 times per day |
| **Includes:**           | None |
| **Special Requirements:** | 1. PCI-DSS Level 1 compliance. 2. No raw card data stored on platform. 3. Idempotency key to prevent duplicate charges. |
| **Assumptions:**        | 1. PSP API is available and responsive. 2. Customer's payment method is valid. |
| **Notes and Issues:**   | TBD-3: Support Buy Now Pay Later (BNPL) — Product Owner — Q1 2027. |

#### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | | System sends payment authorization request to Payment Gateway with: amount, currency, payment token, order reference, idempotency key |
| 2 | | Payment Gateway processes authorization and returns result |
| 3 | | System validates response signature |
| 4 | | System records transaction: transaction ID, amount, currency, status, timestamp |
| 5 | | System updates order payment status to "Authorized" |

#### Exceptions

**EX.1: Payment Declined** — At step 2, if gateway returns declined:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System records decline reason from gateway |
| EX.1.2 | | System returns decline to calling UC (UC-ORDER-01) |
| **Final state:** Payment not processed; order not created |

**EX.2: Gateway Timeout** — At step 2, if gateway does not respond within 10s:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System retries once with same idempotency key |
| EX.2.2 | | If still no response, system marks payment as "Pending" |
| EX.2.3 | | System notifies operations team for manual review |
| **Final state:** Payment status "Pending"; order not created |

**EX.3: Duplicate Request** — At step 1, if same idempotency key was already processed:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System returns original transaction result without re-processing |
| **Final state:** No duplicate charge; original transaction referenced |

---

### UC-PAY-02: Apply Voucher

| **Use Case ID:**        | UC-PAY-02 |
| **Use Case Name:**      | Apply Voucher |
| **Created By:**         | BA Team | **Last Updated By:** | BA Team |
| **Date Created:**       | 2026-05-29 | **Date Last Updated:** | 2026-05-29 |

| **Actor:**              | Customer |
| **Description:**        | Customer enters a voucher code during checkout to receive a discount on the order total. System validates the voucher, calculates the discount amount, and updates the order total. Successful outcome: discount applied and reflected in order summary. |
| **Preconditions:**      | 1. Customer is in checkout flow. 2. Order subtotal > 0. |
| **Postconditions:**     | 1. Voucher discount applied to order total. 2. Voucher marked as "Used" (if single-use). 3. Updated order total displayed. |
| **Priority:**           | Low |
| **Frequency of Use:**   | 50–200 times per day |
| **Includes:**           | None |
| **Special Requirements:** | 1. Voucher validation ≤ 200ms. 2. Support percentage and fixed-amount vouchers. 3. Stackable voucher logic (max 2 per order). |
| **Assumptions:**        | 1. Vouchers are pre-generated by marketing team. 2. Voucher rules are stored in voucher service. |
| **Notes and Issues:**   | None |

#### Main Flow of Events

| Step | Actor | System Response |
|------|-------|-----------------|
| 1 | Customer enters voucher code and clicks "Apply" | |
| 2 | | System validates voucher: not expired, not yet used (if single-use), meets minimum order threshold |
| 3 | | System calculates discount based on voucher type (percentage or fixed) |
| 4 | | System recalculates order total: subtotal − discount + shipping + tax |
| 5 | | System displays success message and updated order summary |

#### Exceptions

**EX.1: Invalid Voucher** — At step 2, if voucher code not recognized:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.1.1 | | System displays "Invalid voucher code" error |
| EX.1.2 | | System highlights voucher input field |
| **Final state:** No discount applied; customer can retry |

**EX.2: Voucher Expired** — At step 2, if voucher past expiry date:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.2.1 | | System displays "This voucher has expired" message |
| **Final state:** No discount applied |

**EX.3: Minimum Order Not Met** — At step 2, if subtotal below voucher threshold:

| Step | Actor | System Response |
|------|-------|-----------------|
| EX.3.1 | | System displays "Minimum order of $X required for this voucher" |
| **Final state:** No discount applied; customer must increase order |

---

## 6. Sequence Diagrams

### SD for UC-ORDER-01: Place Order

![Diagram:sequence](diagrams/sd-UC-ORDER-01.svg)

### SD for UC-PAY-01: Process Payment

![Diagram:sequence](diagrams/sd-UC-PAY-01.svg)

### SD for UC-PAY-02: Apply Voucher

![Diagram:sequence](diagrams/sd-UC-PAY-02.svg)
