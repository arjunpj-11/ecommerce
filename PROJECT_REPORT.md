# ARNI E-Commerce Application — Project Report

## Executive Summary

ARNI is a full-stack, server-rendered e-commerce application for fashion retail. It supports the complete customer purchase journey and a separate administration workspace. The application uses Node.js, Express.js, EJS, MongoDB, and Mongoose, with integrations for Razorpay payments, Cloudinary media storage, email OTP delivery, and Google/Facebook authentication.

This stabilization release focused on three interview-critical qualities: correct cart behavior, clear feedback during failures, and dependable layouts across mobile, tablet, and desktop screens. The existing project purpose and technology stack were preserved.

## Problem Statement

The earlier application had several user-experience and reliability problems:

- The product page did not clearly show that the selected variant and size were already in the cart.
- A duplicate add request returned an error, but the frontend replaced the useful server message with a generic login suggestion.
- Cart rows were identified only by variant in parts of the UI even though the data model identifies an item by variant and size.
- Removing one cart row could remove every size belonging to the same variant.
- Repeated DOM IDs made quantity updates unreliable when a variant appeared in more than one size.
- The cart page cleared an applied coupon automatically during page load.
- Coupon amounts were displayed with a dollar symbol despite the store using Indian rupees.
- Asynchronous session expiry could return an HTML redirect to JavaScript expecting JSON.
- Mobile navigation and responsive behavior differed from page to page.
- Administration tables and sidebars did not have one dependable small-screen fallback.
- The default error page exposed an unpolished developer-style presentation.
- Checkout embedded a hard-coded payment key and could render an incomplete template for an empty cart.
- Wallet cancellations accepted an empty reason and did not refund the shipping amount that had been charged.
- Content-Security-Policy blocked dynamically generated inline handlers, which silently broke cart, coupon, search-pagination, product-variant, and tag controls.
- Admin order status endpoints accepted invalid workflow transitions without reconciling stock or paid balances.

## Solution Overview

The completed work introduces a consistent cart contract between the server and browser, a shared responsive layer for all EJS screens, accessible mobile navigation, safer error responses, and a branded error page.

### Storefront UI Refinement

- Consolidated the repeated Men, Women, Kids, and Footwear header links into one Categories control after Shop.
- Added a dark-brown desktop mega-menu with main-category and subcategory links.
- Added a keyboard-accessible and touch-friendly category accordion inside the mobile navigation.
- Constrained product cards to a consistent maximum width so short product rows no longer stretch into oversized cards.
- Added a compact two-column product and subcategory layout on phone-sized screens.
- Added consistent empty states for orders, products, subcategories, cart, wishlist, wallet, and saved addresses.
- Suppressed pagination when a result set contains zero or one page.
- Converted the mobile order table into readable order cards with status badges and a clear View order action.
- Repaired authentication form clipping at narrow widths and allowed long forms to scroll naturally at short viewport heights.
- Added autofill metadata, mobile-friendly OTP inputs, accessible generated labels, and library-free application notifications.

### Cart and Product Detail Improvements

- Added strict validation for variant IDs, sizes, quantities, and available stock.
- Added `GET /users/cart/status` to check a selected variant-and-size combination.
- Changed duplicate cart additions to return HTTP `409 Conflict` with `exists: true` and a useful message.
- Added four explicit product-button states: available, loading, already added, and out of stock.
- Changed the already-added button into a direct “View Cart” action.
- Re-checks cart state whenever the shopper changes size or colour.
- Preserves the server's specific error message instead of replacing it with a generic message.
- Redirects expired sessions to login with a clear notification.
- Uses variant plus size as the cart-row identity for updates and removal.
- Rejects non-integer, zero, negative, invalid, and over-stock quantity requests.
- Clears an applied coupon when cart contents change so totals cannot become stale.
- Safely skips deleted product or variant references while rendering a cart.

### Cart Interface Improvements

- Rebuilt cart interactions around the cart row rather than duplicated page IDs.
- Added non-blocking, accessible toast notifications for success, information, and errors.
- Removed browser alert usage from the cart flow.
- Corrected all client-calculated currency output to INR.
- Preserves and displays an applied coupon after reload.
- Added accessible labels, focus states, minimum touch targets, and read-only quantity fields.
- Prevents checkout while unavailable items remain in the cart and scrolls to the problem item.
- Added a structured two-column mobile cart layout and full-width coupon controls on narrow screens.

### Checkout, Orders, and Account Management

- Redirects empty checkout attempts back to the cart and safely handles removed product references.
- Uses the server-provided Razorpay key and leaves the cart unchanged after an incomplete online payment.
- Validates delivery-address fields and malformed identifiers with clear client errors.
- Supports complete wallet checkout with transactional stock updates, order creation, and cart clearing.
- Allocates one shipping charge across multi-item orders rather than charging every line item.
- Requires meaningful cancellation/refund reasons and persists the cancellation reason.
- Cancels paid orders transactionally, restores stock, and refunds the exact charged item-and-shipping amount.
- Restricts invoices to delivered orders and payment retries to failed-payment orders.
- Repaired profile editing, address edit parsing, primary-address changes, wishlist removal, and OTP resend behavior.

### Administration Reliability

- Replaced CSP-blocked generated handlers in coupons, product creation, variants, tags, and pagination with delegated listeners.
- Restricts order status transitions to Pending → Processing → Shipped → Delivered, with controlled cancellation from eligible states.
- Makes admin cancellation restore stock and refund paid balances atomically.
- Prevents terminal cancelled, returned, refunded, and delivered orders from showing an actionable status-change control.
- Records refund approval/rejection outcomes and prevents duplicate processing.
- Corrected sales currency formatting and keeps orders visible even if a referenced variant is later unavailable.

### Responsive User Experience

The shared responsive layer is loaded by all storefront, customer, authentication, and administration templates. It provides:

- An accessible mobile navigation button with ARIA state and Escape/outside-click closing.
- A scroll-safe navigation panel for stores with many product categories.
- Flexible forms, filters, pagination, action groups, media, and modals.
- Horizontally scrollable data-table regions instead of clipped administration tables.
- Small-screen footer, dialog, notification, and typography safeguards.
- Keyboard-visible focus styling.
- Reduced-motion support for customers who request it at operating-system level.
- Protection against accidental horizontal page overflow.

### Responsive Administration Experience

- Added a shared mobile admin-sidebar control and dismissible backdrop.
- Keeps the sidebar off-canvas on tablet and mobile widths.
- Removes fixed desktop margins from main content on smaller screens.
- Makes wide administration tables keyboard-scrollable and touch-scrollable.
- Constrains management forms and modals to the viewport with safe vertical scrolling.

### Error Handling and Session Safety

- Customer and admin authentication middleware now returns structured HTTP `401` JSON for JavaScript requests and redirects normal browser navigation.
- Unexpected server errors receive a safe public message; internal stack information is not returned for server failures.
- Replaced the default error output with a responsive, branded ARNI error page.
- The error page includes clear recovery actions and only shows developer details in development mode.

## Architecture

ARNI follows an MVC-style separation:

| Layer          | Responsibility                           | Main Location       |
| -------------- | ---------------------------------------- | ------------------- |
| Routes         | URL definitions, middleware composition  | `routes/`           |
| Controllers    | Request handling and business rules      | `controllers/`      |
| Models         | MongoDB schemas and persistence          | `models/`           |
| Views          | Server-rendered customer/admin HTML      | `views/`            |
| Browser assets | Interaction logic and presentation       | `public/`           |
| Middleware     | Authentication, block status, errors     | `middlewares/`      |
| Verification   | Syntax, template, and integration checks | `scripts/`, `test/` |

### Cart Request Flow

1. The customer selects a colour and size.
2. The product page checks the cart-status endpoint.
3. The button renders “Add to Cart” or “Already in Cart — View Cart.”
4. An add request is validated against the variant, requested size, quantity, and current stock.
5. The server either persists the row, returns a duplicate conflict, or returns a specific validation message.
6. The browser maps that response to a stable button state and accessible notification.

## Technology Stack

| Area           | Technology                                        |
| -------------- | ------------------------------------------------- |
| Runtime        | Node.js                                           |
| Web framework  | Express.js                                        |
| Rendering      | EJS                                               |
| Database       | MongoDB with Mongoose                             |
| Authentication | Express sessions, Passport, Google/Facebook OAuth |
| Payment        | Razorpay                                          |
| Media          | Cloudinary                                        |
| Email          | Nodemailer and OTP utilities                      |
| Security       | Helmet, rate limiting, HTTP-only session cookies  |
| Testing        | Node test runner and Supertest                    |

## Verification Results

### Automated Verification

- JavaScript syntax verified across 123 files.
- EJS compilation verified across 44 templates.
- All 54 live-database integration checks passed across the public storefront, cart and wishlist mutations, profile and address lifecycle, wallet checkout, transactional cancellation, access control, order ownership, administration APIs, coupon CRUD, user blocking, and order transition rules.
- Git whitespace/error validation passed.

### Responsive Browser Verification

The application was visually checked at representative mobile and desktop viewports:

- 390 × 844 mobile storefront: navigation collapsed correctly, product cards loaded, and the full category hierarchy opened from the mobile navigation.
- Mobile menu: opened and closed correctly, exposed accurate ARIA state, displayed all category links, and removed the older duplicate hamburger control.
- 375 × 812 product detail: single-column layout, no horizontal overflow, size selection present, and cart button visible.
- 390 × 844 login: the Google and Facebook controls remained contained and usable.
- 1440 × 900 shop: desktop navigation remained expanded, mobile control remained hidden, and no horizontal overflow occurred.

## Security and Data-Integrity Considerations

- All cart mutations are scoped to the authenticated session user.
- Cart row updates use both variant and size, preventing accidental cross-row changes.
- Server-side stock validation remains authoritative; browser checks are only convenience feedback.
- Invalid MongoDB identifiers are rejected before database lookup.
- Paid order and payment callback protections remain covered by integration tests.
- Address, order, invoice, and refund ownership controls remain covered by integration tests.
- Session cookies remain HTTP-only, same-site, and secure in production.
- Production still requires properly managed environment variables, database backups, payment production credentials, centralized monitoring, and an independent security review.

## Interview Discussion Points

### A challenging bug

The cart model treated a line item as a combination of variant and size, but parts of the frontend and remove endpoint treated the variant alone as the identity. That mismatch explained several symptoms that initially appeared unrelated: duplicate DOM IDs, incorrect quantity targets, and removing multiple sizes at once. Aligning the identity rule across the controller, HTML data attributes, and browser logic fixed the root cause.

### A business-rule decision

An applied coupon is cleared whenever quantity or cart composition changes. This avoids presenting a discount based on an older subtotal and forces coupon eligibility to be evaluated again against the new cart.

### A user-experience decision

“Already in cart” is represented as a successful state, not a generic failure. The product button becomes a useful path to the cart, while the API still returns `409 Conflict` so client code can distinguish a duplicate from validation and infrastructure errors.

### A responsive-design decision

The project contains many independently styled EJS pages. A small shared responsive layer provides consistent navigation, table, modal, focus, and overflow behavior while preserving each page's existing visual design and technology stack.

## Known Production Follow-Ups

No software can be guaranteed defect-free on every browser, device, data condition, and third-party outage. Before a commercial launch, the following work is recommended:

- Add automated end-to-end tests for payment-provider sandbox flows.
- Add screenshot regression tests for representative user and admin pages.
- Add centralized logs, error tracking, uptime monitoring, and performance budgets.
- Add database indexes and transactional inventory reservation for high-concurrency sales.
- Perform accessibility testing with screen readers and a formal WCAG audit.
- Perform penetration testing and dependency/security scanning in the deployment pipeline.

## Conclusion

This release converts the most visible cart inconsistencies into a consistent, validated workflow and establishes a shared responsive foundation across customer and administration screens. The result is easier to use, safer under invalid input and expired sessions, and easier to explain in a technical interview because the behavior is supported by explicit API semantics and repeatable verification.
