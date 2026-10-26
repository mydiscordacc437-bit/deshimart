# Dedicated Per-Product Ordering Flow & Related Products Showcase

This update replaces the embedded bottom order form on product pages and popup checkout modals with a streamlined, multi-page e-commerce funnel: every product order routes to its own dedicated ordering page (`/checkout/:slug`), removes the promotional yellow Order Bump add-on box, displays a curated Relevant Products showcase at the bottom of each product page, and directs completed orders straight to a dedicated Thank You confirmation page (`/thank-you/:slug/:orderId`).

## User Review & Critical Decisions

> [!IMPORTANT]
> All product ordering actions across the entire storefront have been unified around the dedicated per-product ordering page and Thank You page flow based on your confirmed preferences.

- **Confirmed Decision 1 — Universal Dedicated Ordering Page**: Clicking any "Order Now" button (on the Product Page, Homepage cards, Flash Sale cards, or Cart checkout) navigates directly to that product's dedicated ordering page (`/checkout/:slug`) rather than scrolling to the bottom of the page or opening a modal dialog.
- **Confirmed Decision 2 — Removal of Embedded Bottom Form & Yellow Order Bump Box**: The embedded `#order-section` at the bottom of the Product Page is completely removed, and the yellow dashed 1-Click Order Bump add-on component is deleted from the dedicated Checkout Page as well.
- **Confirmed Decision 3 — Relevant Products Discovery Grid**: In place of the removed bottom order form on the Product Page, a "Relevant Products" section displays 4 to 8 matching products from the same category first, automatically backfilling with top-rated bestsellers when a category has fewer items.

---

## 1. Overview & Core Concept

- **What It Does**: Separates product discovery from checkout completion. Shoppers inspect product imagery, specifications, and reviews on the Product Page (and browse related items below), then transition to a clean, distraction-free ordering page tailored to that exact product and selected variant, finishing on a dedicated Thank You & Digital Cash Memo page.
- **Target Audience / Persona**: Mobile and desktop Cash-on-Delivery (COD) shoppers in Bangladesh who expect clear, step-by-step navigation without long-scroll embedded forms or unexpected add-on checkboxes.
- **Key Value**: Eliminates duplicate checkout buttons and cluttered bottom forms on the Product Page while boosting cross-product discovery through relevant category recommendations.

---

## 2. User Experience & Visual Design

- **Key User Flows**:
  1. **Product Page (`/product/:slug` & `/offer/:slug`)**: The shopper selects size, color, and bundle quantity, then clicks the single primary **Order Now (`অর্ডার করতে ক্লিক করুন`)** CTA button (or the sticky mobile bottom bar CTA), which immediately navigates to `/checkout/:slug` carrying the selected size, color, quantity, and bundle parameters.
  2. **Relevant Products Section**: Below the product specifications and reviews on the Product Page, shoppers see a clean grid of 4–8 relevant products from the same category (with bestseller fallback). Clicking a card opens that product's page; clicking its quick-order button goes straight to its dedicated `/checkout/:slug` page.
  3. **Dedicated Ordering Page (`/checkout/:slug`)**: Displays the locked-in product summary, variant/bundle selectors, and the 3-field Bangladesh COD delivery form (Name, 11-digit BD Mobile Number with operator detection, and Delivery Address + Area) without the yellow dashed Order Bump box.
  4. **Dedicated Thank You Page (`/thank-you/:slug/:orderId`)**: Submitting an order from the ordering page immediately transitions the client to the dedicated Thank You page featuring the animated confirmation banner, printable Digital Cash Memo, and WhatsApp helpline link.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Clean, high-trust retail storefront adhering to a 60-30-10 color balance.
  - *Color Palette & Mood*: Crisp neutral canvas (`#F8FAFC` / `--bg-page`), white structural cards (`#FFFFFF` with `1px solid #E2E8F0` hairline borders), and high-intent brand orange (`#F85606`) reserved strictly for primary CTAs and active price/variant highlights.
  - *Typography & Hierarchy*: Bengali prose in `Hind Siliguri` paired with tabular numerals (`Inter` / `tabular-nums`) for all prices, discounts, and invoice totals so numbers align cleanly across cards and receipts.
  - *Component Styling & Layout*: Uniform 4-column desktop / 2-column mobile product cards for the Relevant Products section with consistent aspect-ratio imagery, single-line controls, and subtle hover elevation.

- **Interactive Feedback & Motion**:
  - Instant scroll-to-top on route transitions between Product Page, Ordering Page, and Thank You Page.
  - Real-time BD phone number sanitization (Bangla-to-English digit conversion and operator badge feedback) and duplicate-order protection on submit.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Consolidating Product Page Checkout CTAs into a Single Navigation Action**
  - *Chosen Approach*: Wire the primary Hero CTA button, the description callout CTA, and the mobile sticky bottom bar on the Product Page directly to `/checkout/:slug` (passing selected size, color, quantity, and bundle via URL query parameters), and remove the redundant secondary "Direct Checkout Page" button.
  - *Why*: Having both a "Scroll to Bottom Form" button and a "Direct Checkout Page" button created competing focal anchors. Once the bottom form is removed, a single primary CTA provides an unmistakable path forward.
  - *Alternatives Considered*: Keeping two buttons that lead to the same route, which would be redundant.

- **Decision 2: Category-First Recommendation Engine with Bestseller Fallback**
  - *Chosen Approach*: Filter the active catalog for products sharing the current item's category (excluding the current item itself); if fewer than 8 items match, append top-rated products from other categories to fill a balanced 4-to-8 card grid.
  - *Why*: Guarantees the Relevant Products section never looks sparse or empty even in smaller categories.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:
```
┌─────────────────────────────────────────────────────────────────────────┐
│                        Application Router & State                       │
│     (Products Catalog, Active Cart, Confirmed Orders, Draft Leads)      │
└───────────────┬─────────────────────────────┬───────────────────────────┘
                │                             │
                ▼                             ▼
┌───────────────────────────────┐   ┌─────────────────────────────────────┐
│   Storefront & Product View   │   │   Dedicated Ordering & Completion   │
│  (/, /product/:slug, /offer)  │   │  (/checkout/:slug -> /thank-you)    │
├───────────────────────────────┤   ├─────────────────────────────────────┤
│ • Hero Variant/Bundle Picker  │   │ • Pre-filled Variant/Bundle State   │
│ • Primary CTA ────────────────┼──►│ • 3-Field BD COD Delivery Form      │
│ • Specs, Reviews & Policies   │   │ • Clean Bill Summary (No Bump Box)  │
│ • Relevant Products Grid      │   │ • Order Submit ──► Thank You Page   │
│   (Category + Bestsellers)    │   │   (Digital Cash Memo & Print View)  │
└───────────────────────────────┘   └─────────────────────────────────────┘
```

- **Data Model & State**:
  - **Route Parameters & Query State**: `/checkout/:slug?size=...&color=...&qty=...&bundle=...` transfers the shopper's exact configuration from the Product Page (or default variant from storefront cards) into the dedicated Ordering Page.
  - **Order Entity**: Upon submission on `/checkout/:slug`, a new order object (`INV-2026-XXXX`) is appended to persisted `deshimart_orders` state (without any Order Bump surcharge), any draft lead for that phone number is cleaned up, and the router navigates to `/thank-you/:slug/:orderId`.

- **Interactive Component & State Mapping**:
  - **Storefront / Card Order Action**: Clicking "Order Now" on any card in the Homepage, Flash Sale, Catalog Grid, or Relevant Products Grid invokes navigation to `/checkout/:slug`.
  - **Product Page Primary & Sticky CTAs**: Clicking the primary order button or sticky mobile bar constructs the `/checkout/:slug` URL with current `selectedSize`, `selectedColor`, `quantity`, and `selectedBundle` states and navigates immediately.
  - **Relevant Products Grid**: Computes up to 8 related items dynamically whenever the active product changes, rendering interactive cards with both Product View and Direct Order handlers.
