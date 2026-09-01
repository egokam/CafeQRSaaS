# Qerve

<div align="center">

[English](README.md) · [العربية](README.ar.md)

</div>

Qerve is a multi-tenant cafe SaaS platform for QR ordering, cashier operations, kitchen coordination, and tenant administration. The product is designed to serve multiple cafes from a single Next.js application, with each cafe living under its own route and its own subscription-aware data context.

This repository contains the production code for the Qerve platform: marketing site, guest menu, cafe admin, POS cashier console, kitchen printing flow, and SaaS super-admin control panel.

## What the platform does

- Lets guests browse a cafe/restaurant menu by scanning a table QR code
- Supports English, French, and Arabic interfaces
- Enables cafe owners to manage products, categories, modifiers, and tables
- Provides POS cashier workflows for accepting or rejecting orders
- Sends accepted orders into a kitchen-ready receipt workflow
- Tracks sales, billing, device limits, and subscription status
- Gives a super-admin dashboard for provisioning and managing tenant cafes
- Uses Supabase for auth, database, storage, and realtime updates

## Product overview

Qerve is not a single app for one cafe. It is structured as a shared platform that can serve many tenants. Each cafe has a unique slug, authorized admin email, plan limits, staff configuration, menu, tables, and access rules. The core UI is mobile-first and optimized for real restaurant usage.

## Main flows in the app

### 1. Public landing and product storytelling

The root app is a premium marketing landing page with a 3D-style hero section, demo selector, feature highlights, product walkthrough, and footer. It is multilingual and designed to present the product clearly to cafe owners and stakeholders.

Relevant files:
- src/app/page.tsx
- src/components/landing/*
- src/i18n/messages/*

### 2. Guest QR ordering experience

Guests are routed through a table-specific URL like /[cafeSlug]/[tableId]. The app validates the cafe, table, and subscription status before letting the guest browse products and place an order. Orders are tied to a client session and then flow to the cafe cashier.

The guest interface includes:
- category browsing and search
- cart management
- modifier selection
- order submission
- active order tracking
- cancellation and status updates

Relevant files:
- src/app/[cafeSlug]/[tableId]/page.tsx
- src/actions/menu.ts
- src/store/useCart.ts
- src/components/client/*

### 3. Cafe admin dashboard

The cafe owner area provides product management and operational control. The admin dashboard supports:
- menu updates and product activation
- modifier groups and pricing
- table creation and QR access
- monthly sales and order reporting
- POS device management
- employee and staff PIN setup
- billing and subscription status
- support requests and notifications

Relevant files:
- src/app/[cafeSlug]/admin/page.tsx
- src/actions/auth.ts
- src/actions/support.ts
- src/actions/payment.ts
- src/components/admin/*

### 4. Cashier POS workflow

The cashier interface is built for accepting guest orders, rejecting invalid ones, creating manual walk-in orders, and keeping the service moving. Cashier sessions are PIN-authenticated and the app tracks the cafe-level limit of active cashier devices.

Relevant files:
- src/components/admin/DevicesTab.tsx
- src/components/admin/EmployeesTab.tsx
- src/actions/employees.ts
- src/app/demo/pos/page.tsx

### 5. Kitchen printing and order lifecycle

Accepted orders are pushed into the kitchen workflow. The app supports a kitchen receipt display and a drag-to-tear style print interaction in the demo. Orders progress through statuses such as pending, accepted, ready, completed, rejected, and cancelled.

Relevant files:
- src/components/KitchenReciept.tsx
- src/app/demo/kitchen/page.tsx
- src/components/client/ProductPage/*
- src/actions/menu.ts

### 6. Super-admin SaaS control panel

The super-admin portal is a private operator dashboard for managing the platform itself. It allows an authorized owner to:
- inspect all cafes
- force status or subscription updates
- manage billing-related records
- update tenant credentials
- provision new cafes with plan and trial defaults
- delete or quarantine cafes when necessary
- manage shared global modifiers

Relevant files:
- src/app/ego-owner-9539/page.tsx
- src/app/ego-owner-9539/login/page.tsx
- src/actions/saas.ts
- src/components/s-admin/*

## Architecture and backend model

### Multi-tenant design

The project uses a shared codebase and per-cafe routing model. Cafe isolation is handled through tenant checks and by requiring a valid slug and associated records before acting on orders, admin pages, or menu data.

### Supabase foundation

The application relies on Supabase for:
- PostgreSQL data storage
- authentication and secure role checks
- file storage for uploaded media
- realtime subscriptions for live order updates
- service-role operations used by server actions

### Security model

The codebase includes several security layers:
- signed cookies for admin and super-admin access
- role-based access checks in server actions
- subscription validation before menu access or cashier functions
- table and cafe validation before guest ordering
- staff PIN checks for cashier and admin-related activity
- strict headers added in middleware

Relevant file:
- middleware.ts

## Tech stack

- Next.js 16.2.9
- React 19
- TypeScript
- Tailwind CSS
- Supabase
- Zustand
- Framer Motion
- react-qr-code
- react-to-print
- lucide-react
- Electron + electron-builder (desktop packaging support)

## Repository structure

```text
Qerve/
├── db/
│   ├── employee-pin-auth.sql
│   ├── global-modifiers.sql
│   ├── harden-rls.sql
│   └── order-load-balancing.sql
├── public/
│   ├── ads.txt
│   ├── manifest.json
│   ├── banners/
│   ├── demo/
│   ├── icons/
│   ├── models/
│   ├── products/
│   └── screenshots/
├── src/
│   ├── actions/
│   │   ├── auth.ts
│   │   ├── employees.ts
│   │   ├── menu.ts
│   │   ├── payment.ts
│   │   ├── saas.ts
│   │   └── support.ts
│   ├── app/
│   │   ├── api/
│   │   ├── demo/
│   │   ├── ego-owner-9539/
│   │   ├── get-started/
│   │   ├── tutorial/
│   │   ├── [cafeSlug]/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/
│   │   ├── admin/
│   │   ├── client/
│   │   ├── landing/
│   │   ├── s-admin/
│   │   ├── KitchenReciept.tsx
│   │   └── SecurityShield.tsx
│   ├── i18n/
│   │   ├── config.ts
│   │   ├── messages/
│   │   └── request.ts
│   ├── lib/
│   │   ├── demoStore.ts
│   │   ├── supabase.ts
│   │   └── utils.ts
│   └── store/
│       └── useCart.ts
├── ecosystem.config.js
├── main.js
├── middleware.ts
├── next.config.ts
├── package.json
├── schema.sql
├── server-entry.cjs
├── setup-preload.js
├── test-db.ts
├── tsconfig.json
├── tsconfig.demo-check.json
├── components.json
├── eslint.config.mjs
├── postcss.config.mjs
├── README.md
└── .env.example-like setup via project environment variables
```

## Key routes

- / - landing page
- /tutorial - product walkthrough
- /demo/admin - admin demo
- /demo/pos - cashier demo
- /demo/kitchen - kitchen demo
- /demo/client - guest menu demo
- /[cafeSlug]/admin - cafe admin console
- /[cafeSlug]/cashier - cashier terminal
- /[cafeSlug]/[tableId] - guest QR menu
- /ego-owner-9539/login - super-admin login
- /ego-owner-9539 - SaaS operator dashboard

## Environment variables

The project expects Supabase and app configuration values at runtime. Typical variables include:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
AUTH_SECRET=
SUPER_ADMIN_EMAIL=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_SITE_URL=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_WEBHOOK_SECRET=
RESEND_API=
```

## Local development

```bash
npm install
npm run dev
```

Then open the local app in the browser, usually at http://localhost:3000.

## Build and start

```bash
npm run build
npm run start
```

Additional scripts:

```bash
npm run lint
npm run electron:start
npm run electron:build
npm run release
```

## Notes

- This app is designed as a real-world SaaS product, not a generic starter project.
- The sales, billing, and admin flows are connected to subscription and tenant logic.
- Demo screens are included for product presentation and testing, but the production experience is tenant-aware and secured.
- The repository includes both web app and desktop packaging support through Electron.

## Summary

Qerve is a cafe operations platform built around QR ordering, live POS workflows, kitchen dispatch, admin management, and multi-tenant SaaS control. The project combines a polished frontend experience with a strict operational backend model for cafe businesses that need one platform for guests, staff, and owners.

CafeQR SaaS is designed to run with minimal hardware, making it suitable for small and medium-sized cafes without requiring specialized infrastructure.

| Component | Requirement |
| --- | --- |
| 🖨️ Kitchen Receipt Printer | ESC/POS-compatible thermal receipt printer for automatic kitchen order printing after cashier approval. |
| 💳 POS Terminal | Windows PC, laptop, tablet, or touchscreen device running a modern web browser. A thermal receipt printer is recommended for customer receipts. |
| 🏛️ Admin Console | Laptop or tablet (recommended) for the best management experience. The responsive interface also supports modern smartphones for day-to-day administration. |
| 🌐 Internet Connection | Stable internet connection for realtime order synchronization and cloud services. |
| 📱 Guest Devices | Any smartphone capable of scanning QR codes and opening a modern web browser. |

> **Recommended setup:** One POS device connected to a kitchen thermal printer, plus one laptop or tablet for administration. Cafe owners can also access the admin console from their phone whenever needed.

---

## ✦ Contact & Partnership

For cafe owners, technical partners, or premium SaaS inquiries:

**Instagram:** [@w.zd7](https://www.instagram.com/w.zd7)  
**Email:** [egokam.business@gmail.com](mailto:contact@egokam.site)  
**WhatsApp:** [+212 781 991 384](https://wa.me/212781991384)

---

## ✦ License & Usage Restrictions

**CafeQR SaaS is proprietary and confidential.**

This repository is showcased solely as a portfolio artifact to demonstrate product architecture, UI execution, and SaaS engineering capability. No license is granted for personal use, public distribution, derivative work, resale, or commercial deployment.

**All rights reserved.**
