import type { ComponentType, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  ChefHat,
  CheckCircle2,
  Clock,
  CreditCard,
  Database,
  ExternalLink,
  KeyRound,
  Layers3,
  LayoutDashboard,
  Lock,
  Monitor,
  Printer,
  QrCode,
  Rocket,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Terminal,
  Users,
  Workflow,
} from "lucide-react";
import { LivePreview } from "@/components/landing/LivePreview"

export const metadata: Metadata = {
  title: "CafeQR Product Guide",
  description:
    "A visual walkthrough of CafeQR SaaS, including QR ordering, POS, kitchen printing, tenant architecture, security, and workflows.",
};

type Icon = ComponentType<{ className?: string }>;

const toc = [
  { id: "introduction", label: "Introduction" },
  { id: "platform-overview", label: "Platform Overview" },
  { id: "core-suite", label: "Core Product Suite" },
  { id: "architecture", label: "Architecture" },
  { id: "security", label: "Security" },
  { id: "business-requirements", label: "Business Requirements" },
  { id: "technology-stack", label: "Technology Stack" },
  { id: "project-structure", label: "Project Structure" },
  { id: "guest-order-workflow", label: "Guest Order Workflow" },
  { id: "pos-workflow", label: "POS Workflow" },
  { id: "saas-flow", label: "Multi-tenant SaaS Flow" },
  { id: "live-demo", label: "Live Demo" },
  { id: "roadmap", label: "Roadmap" },
];

const productSuite = [
  {
    title: "QR Menu",
    icon: QrCode,
    body: "Guests scan a table-specific route, browse the active menu, manage a cart, and submit orders without installing an app.",
    points: ["Mobile-first ordering", "Table-aware sessions", "Live product availability"],
  },
  {
    title: "POS Cashier",
    icon: CreditCard,
    body: "Cashiers approve QR orders, create walk-in tickets, manage statuses, and keep the counter moving from one focused terminal.",
    points: ["Pending order queue", "Manual POS orders", "Receipt-ready checkout"],
  },
  {
    title: "Kitchen Receipt Printing",
    icon: Printer,
    body: "Accepted orders flow to the kitchen printer so staff receive confirmed tickets with table, items, quantities, notes, and time.",
    points: ["Print after approval", "Preparation-focused tickets", "Clear handoff from POS"],
  },
  {
    title: "Admin Console",
    icon: LayoutDashboard,
    body: "Cafe owners maintain products, multilingual menu details, QR tables, staff PINs, settings, and sales views from a private surface.",
    points: ["Menu management", "QR table generation", "Sales and settings"],
  },
  {
    title: "SaaS Control Panel",
    icon: Building2,
    body: "The operator layer provisions cafes, manages plan status, reviews receipts, and keeps tenant operations organized centrally.",
    points: ["Tenant provisioning", "Subscription control", "Lifecycle management"],
  },
];

const stack = [
  ["Framework", "Next.js App Router, React"],
  ["Language", "TypeScript"],
  ["Styling", "Tailwind CSS, shadcn/Radix primitives"],
  ["Database and Auth", "Supabase PostgreSQL, Auth, Storage, Realtime"],
  ["State and Demo", "Zustand and browser-local demo data"],
  ["Motion and UX", "Framer Motion, realtime audio cues, lucide-react"],
  ["QR and Printing", "react-qr-code and browser print flows"],
  ["Deployment", "Standalone Next.js, PM2, Caddy-ready VPS profile"],
];

const requirements = [
  {
    title: "Kitchen printer",
    icon: Printer,
    body: "An ESC/POS-compatible thermal printer is recommended for automatic kitchen tickets after cashier approval.",
  },
  {
    title: "POS terminal",
    icon: Monitor,
    body: "A Windows PC, laptop, tablet, or touchscreen device running a modern browser can operate the cashier surface.",
  },
  {
    title: "Admin device",
    icon: LayoutDashboard,
    body: "A laptop or tablet gives owners the best management experience, with responsive support for quick mobile updates.",
  },
  {
    title: "Reliable internet",
    icon: Workflow,
    body: "Realtime ordering, authentication, and tenant data all depend on a stable connection during service.",
  },
  {
    title: "Guest phones",
    icon: Smartphone,
    body: "Guests only need a modern smartphone camera and browser to scan, browse, and order.",
  },
];

const roadmap = [
  "Advanced analytics for peak hours, revenue patterns, and product performance.",
  "AI-assisted menu descriptions and demand forecasting.",
  "Multi-currency support and deeper localization.",
  "Custom domain onboarding for premium tenants.",
  "Expanded billing automation and receipt review workflows.",
];

const guestFlow = [
  { title: "Guest", detail: "Scans a table QR code.", icon: Users },
  { title: "QR Menu", detail: "Loads the cafe menu and cart.", icon: QrCode },
  { title: "POS", detail: "Receives the pending order.", icon: CreditCard },
  { title: "Kitchen Receipt Printer", detail: "Prints only after approval.", icon: Printer },
  { title: "Cook", detail: "Prepares from a clear ticket.", icon: ChefHat },
];

const tenantFlow = [
  { title: "Super Admin", detail: "Controls tenant setup.", icon: ShieldCheck },
  { title: "Provision Cafe", detail: "Creates plan, slug, owner, and limits.", icon: Building2 },
  { title: "Owner", detail: "Manages menu, QR tables, and staff access.", icon: BadgeCheck },
  { title: "Admin", detail: "Keeps products and settings current.", icon: LayoutDashboard },
  { title: "Cashier", detail: "Approves orders and handles payments.", icon: CreditCard },
  { title: "Guests", detail: "Order from table-specific QR links.", icon: Users },
];

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-amber-300">
      {children}
    </span>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28">
      {eyebrow ? (
        <p className="mb-3 text-sm font-medium uppercase tracking-widest text-amber-300">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-balance text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
        {title}
      </h2>
      <div className="mt-6 space-y-5 text-base leading-8 text-zinc-400">
        {children}
      </div>
    </section>
  );
}

function Callout({
  icon: Icon,
  title,
  children,
}: {
  icon: Icon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-5 text-zinc-300">
      <div className="flex gap-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-300/15 text-amber-300">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h3 className="font-semibold text-zinc-50">{title}</h3>
          <div className="mt-2 text-sm leading-7 text-zinc-400">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ProductCard({
  title,
  icon: Icon,
  body,
  points,
}: {
  title: string;
  icon: Icon;
  body: string;
  points: string[];
}) {
  return (
    <article className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 backdrop-blur-xl transition-colors hover:border-amber-400/30 hover:bg-white/[0.06]">
      <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300 transition-colors group-hover:bg-amber-400 group-hover:text-zinc-950">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="text-lg font-semibold text-zinc-50">{title}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-400">{body}</p>
      <ul className="mt-5 space-y-2">
        {points.map((point) => (
          <li key={point} className="flex items-center gap-2 text-sm text-zinc-300">
            <CheckCircle2 className="h-4 w-4 text-amber-300" />
            {point}
          </li>
        ))}
      </ul>
    </article>
  );
}

function FlowDiagram({
  title,
  steps,
}: {
  title: string;
  steps: { title: string; detail: string; icon: Icon }[];
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/70 p-5 shadow-xl shadow-black/25">
      <div className="mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
          <Workflow className="h-5 w-5" />
        </span>
        <h3 className="font-semibold text-zinc-50">{title}</h3>
      </div>
      <div className="space-y-0">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === steps.length - 1;

          return (
            <div key={step.title}>
              <div className="grid grid-cols-[3rem_1fr] items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-amber-300">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-medium text-zinc-100">{step.title}</p>
                  <p className="text-sm leading-6 text-zinc-500">{step.detail}</p>
                </div>
              </div>
              {!isLast ? (
                <div className="grid grid-cols-[3rem_1fr] gap-4">
                  <div className="mx-auto h-8 w-px bg-gradient-to-b from-amber-300/70 to-white/10" />
                  <div />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CodeBlock({
  title,
  language,
  children,
}: {
  title: string;
  language: string;
  children: ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-xl shadow-black/20">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          </div>
          <span className="text-xs text-zinc-500">{title}</span>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-widest text-amber-300">
          {language}
        </span>
      </div>
      <pre className="overflow-x-auto p-5 text-sm leading-7">
        <code className="font-mono">{children}</code>
      </pre>
    </div>
  );
}

function FeatureGrid({
  items,
}: {
  items: { title: string; icon: Icon; body: string }[];
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <div
            key={item.title}
            className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"
          >
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-zinc-50">{item.title}</h3>
            </div>
            <p className="text-sm leading-7 text-zinc-400">{item.body}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function TutorialPage() {
  return (
    <div
      id="top"
      dir="ltr"
      className="relative isolate min-h-screen bg-zinc-950 text-zinc-50"
    >
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(180deg,#09090b_0%,#18181b_45%,#09090b_100%)]" />
      <div className="fixed inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] opacity-30" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to landing
          </Link>
          <Link
            href="/demo/client"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400"
          >
            Open demo
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:px-8 lg:py-16">
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
              On this page
            </p>
            <nav className="space-y-1">
              {toc.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="block rounded-xl px-3 py-2 text-sm text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-zinc-100"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <article className="mx-auto w-full max-w-[1000px] space-y-24">
          <section id="introduction" className="scroll-mt-28">
            <Badge>
              <BookOpen className="h-3.5 w-3.5" />
              CafeQR guide
            </Badge>
            <h1 className="mt-6 text-balance text-5xl font-semibold leading-tight tracking-tight text-zinc-50 sm:text-6xl">
              A visual walkthrough of the QR ordering platform for modern cafes.
            </h1>
            <p className="mt-6 max-w-3xl text-pretty text-lg leading-8 text-zinc-400">
              CafeQR brings the guest menu, cashier counter, kitchen handoff,
              cafe administration, and SaaS operations into one App Router
              product. This guide explains the platform at a practical level
              for potential clients, partners, and technical reviewers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {["QR Ordering", "POS", "Kitchen Printing", "Tenant SaaS", "Supabase", "Next.js"].map(
                (label) => (
                  <span
                    key={label}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300"
                  >
                    {label}
                  </span>
                )
              )}
            </div>
          </section>

          <Section
            id="platform-overview"
            eyebrow="Platform Overview"
            title="One product surface for guests, staff, owners, and operators"
          >
            <p>
              CafeQR is designed for cafes that want a polished digital ordering
              flow without slowing down service. Guests order from a QR menu,
              cashiers approve and manage tickets, kitchen staff receive printed
              receipts, and cafe owners control menu content from an admin
              console.
            </p>
            <p>
              Under the hood, every cafe is treated as a tenant. A tenant slug
              connects the public QR menu, cashier terminal, kitchen printing
              setup, admin console, products, orders, tables, and subscription
              status.
            </p>
            <Callout icon={Sparkles} title="Design intent">
              Fast enough for daily service, elegant enough for premium
              hospitality, and structured enough to grow into a serious SaaS
              business.
            </Callout>
          </Section>

          <Section
            id="core-suite"
            eyebrow="Core Product Suite"
            title="Five coordinated tools instead of isolated screens"
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {productSuite.map((product) => (
                <ProductCard key={product.title} {...product} />
              ))}
            </div>
          </Section>

          <Section
            id="architecture"
            eyebrow="Architecture"
            title="Multi-tenant routing with realtime operations"
          >
            <p>
              The production app uses Next.js App Router routes to separate
              guest, cashier, kitchen, admin, demo, and onboarding experiences.
              Tenant-specific routes read the cafe slug, validate the requested
              surface, and keep order data attached to the correct cafe.
            </p>
            <div className="grid gap-4 lg:grid-cols-2">
              <FeatureGrid
                items={[
                  {
                    title: "Tenant routing",
                    icon: Layers3,
                    body: "Cafe-facing surfaces live under dynamic cafe routes, while demo and onboarding pages stay separate.",
                  },
                  {
                    title: "Supabase isolation",
                    icon: Database,
                    body: "Cafe records, products, tables, orders, receipts, owners, and subscription state are keyed by tenant data.",
                  },
                  {
                    title: "Realtime order sync",
                    icon: Clock,
                    body: "Guest orders appear at the POS quickly, then move through approval, printing, ready, and completed states.",
                  },
                  {
                    title: "Server actions",
                    icon: Terminal,
                    body: "Sensitive mutations are handled through server-side actions with validation before business data changes.",
                  },
                ]}
              />
            </div>
            <CodeBlock title="route-map.ts" language="text">
              <span className="text-zinc-300">{`src/app/
|-- page.tsx                  public landing page
|-- tutorial/page.tsx         product documentation guide
|-- get-started/page.tsx      plan and contact entry point
|-- demo/
|   |-- client/page.tsx       browser-local guest demo
|   |-- pos/page.tsx          browser-local POS demo
|   |-- kitchen/page.tsx      browser-local kitchen demo
|   |-- admin/page.tsx        browser-local admin demo
|-- [cafeSlug]/
|   |-- [tableNumber]/page.tsx  tenant guest QR menu
|   |-- cashier/page.tsx        tenant POS terminal
|   |-- admin/page.tsx          tenant admin console`}</span>
            </CodeBlock>
          </Section>

          <Section
            id="security"
            eyebrow="Security"
            title="Layered controls around tenants, roles, sessions, and subscriptions"
          >
            <p>
              CafeQR uses a practical security posture for a hospitality SaaS:
              validate the tenant before exposing a surface, limit role access,
              keep sensitive credentials outside source control, and enforce
              subscription state where ordering operations happen.
            </p>
            <FeatureGrid
              items={[
                {
                  title: "HTTP hardening",
                  icon: ShieldCheck,
                  body: "Middleware adds defensive headers and issues an HTTP-only session fingerprint cookie.",
                },
                {
                  title: "Owner authorization",
                  icon: KeyRound,
                  body: "Cafe admin access is tied to authenticated owner identity and cafe ownership checks.",
                },
                {
                  title: "Staff PIN gates",
                  icon: Lock,
                  body: "Cashier and kitchen entry can be protected by staff PIN controls and terminal limits.",
                },
                {
                  title: "Subscription enforcement",
                  icon: BadgeCheck,
                  body: "Expired or suspended cafes can be blocked from guest ordering and operational surfaces.",
                },
              ]}
            />
            <Callout icon={ShieldCheck} title="No secrets in the guide">
              This public-facing documentation intentionally describes the
              architecture without exposing service-role keys, private operator
              paths, production credentials, or database secrets.
            </Callout>
          </Section>

          <Section
            id="business-requirements"
            eyebrow="Business Requirements"
            title="A lightweight setup for small and medium-sized cafes"
          >
            <p>
              The product is built around hardware that cafe teams already
              understand: a browser-based POS, optional customer receipt
              printing, one kitchen thermal printer, QR codes on tables, and
              standard guest phones.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {requirements.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"
                  >
                    <Icon className="mb-4 h-6 w-6 text-amber-300" />
                    <h3 className="font-semibold text-zinc-50">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-zinc-400">
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </Section>

          <Section
            id="technology-stack"
            eyebrow="Technology Stack"
            title="Modern web tooling tuned for realtime service"
          >
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]">
              {stack.map(([area, value]) => (
                <div
                  key={area}
                  className="grid gap-2 border-b border-white/10 px-5 py-4 last:border-b-0 sm:grid-cols-[220px_1fr]"
                >
                  <span className="text-sm font-medium text-zinc-200">{area}</span>
                  <span className="text-sm leading-6 text-zinc-400">{value}</span>
                </div>
              ))}
            </div>
          </Section>

          <Section
            id="project-structure"
            eyebrow="Project Structure"
            title="A route-first App Router layout"
          >
            <p>
              The codebase is organized around product surfaces, server actions,
              shared utilities, landing components, and demo state. The overview
              below keeps private operational details out while showing how the
              public product is composed.
            </p>
            <CodeBlock title="CafeQrSaaS" language="text">
              <span className="text-zinc-300">{`CafeQrSaaS/
|-- middleware.ts
|-- next.config.ts
|-- src/
|   |-- actions/
|   |   |-- auth.ts        owner auth, PIN checks, menu and order actions
|   |   |-- saas.ts        subscription and tenant operations
|   |-- app/
|   |   |-- page.tsx       landing page
|   |   |-- tutorial/      product guide
|   |   |-- demo/          local interactive demo surfaces
|   |   |-- [cafeSlug]/    tenant guest, cashier, and admin routes
|   |-- components/
|   |   |-- landing/       public marketing and demo components
|   |-- lib/
|       |-- supabase.ts    browser Supabase client
|       |-- demoStore.ts   shared demo products and orders
|       |-- utils.ts       Tailwind class merge helper`}</span>
            </CodeBlock>
          </Section>

          <Section
            id="guest-order-workflow"
            eyebrow="Guest Order Workflow"
            title="From table scan to kitchen ticket"
          >
            <p>
              The guest journey is intentionally short. A QR scan opens the
              right cafe and table, the app validates that ordering is available,
              then the customer sends a pending order to the POS for staff
              approval.
            </p>
            <FlowDiagram title="Guest order flow" steps={guestFlow} />
          </Section>

          <Section
            id="pos-workflow"
            eyebrow="POS Workflow"
            title="Cashier approval keeps the kitchen clean"
          >
            <p>
              The POS is the operational hub. Cashiers unlock the terminal,
              receive pending QR orders, accept or reject them, create walk-in
              orders, trigger kitchen receipts, and move tickets through ready
              and completed states.
            </p>
            <CodeBlock title="pos-workflow.ts" language="pseudo">
              <span className="text-purple-300">cashier</span>
              <span className="text-zinc-300"> unlocks terminal with PIN</span>
              {"\n"}
              <span className="text-purple-300">system</span>
              <span className="text-zinc-300"> checks active tenant and device limits</span>
              {"\n"}
              <span className="text-purple-300">pos</span>
              <span className="text-zinc-300"> receives pending guest orders in realtime</span>
              {"\n"}
              <span className="text-purple-300">cashier</span>
              <span className="text-zinc-300"> accepts, rejects, or creates walk-in order</span>
              {"\n"}
              <span className="text-purple-300">printer</span>
              <span className="text-zinc-300"> prints confirmed kitchen receipt</span>
              {"\n"}
              <span className="text-purple-300">pos</span>
              <span className="text-zinc-300"> marks order ready, paid, and completed</span>
            </CodeBlock>
          </Section>

          <Section
            id="saas-flow"
            eyebrow="Multi-tenant SaaS Flow"
            title="Provision once, operate many cafes"
          >
            <p>
              The SaaS layer turns the product from a single-cafe app into a
              managed platform. Operators provision a cafe, connect an owner,
              configure plan limits, then allow each cafe team to operate inside
              its own tenant boundary.
            </p>
            <FlowDiagram title="Tenant lifecycle flow" steps={tenantFlow} />
          </Section>

          <Section
            id="live-demo"
            eyebrow="Live Demo"
            title="Explore each product surface"
          >
            <p>
              The demo routes use a browser-local synchronized store, which
              means reviewers can test the end-to-end experience without
              production tenant credentials.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                ["Guest menu", "/demo/client", QrCode],
                ["POS cashier", "/demo/pos", CreditCard],
                ["Kitchen display", "/demo/kitchen", ChefHat],
                ["Admin console", "/demo/admin", LayoutDashboard],
              ].map(([title, href, IconValue]) => {
                const Icon = IconValue as Icon;

                return (
                  <Link
                    key={href as string}
                    href={href as string}
                    className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition-colors hover:border-amber-400/30 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="font-semibold text-zinc-50">
                          {title as string}
                        </span>
                      </div>
                      <ArrowRight className="h-5 w-5 text-zinc-500 transition-transform group-hover:translate-x-1 group-hover:text-amber-300" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Section>

          <Section
            id="roadmap"
            eyebrow="Roadmap"
            title="Where the platform can grow next"
          >
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-amber-400/[0.06] p-6">
              <ul className="space-y-4">
                {roadmap.map((item) => (
                  <li key={item} className="flex gap-3 text-zinc-300">
                    <Rocket className="mt-1 h-4 w-4 shrink-0 text-amber-300" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/[0.035] p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold text-zinc-50">
                  Ready to see the product in motion?
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  Open the interactive demo or return to the landing page CTA.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/demo/client"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
                >
                  Try demo
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link
                  href="/get-started"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.06]"
                >
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Section>
        </article>
      </main>
    </div>
  );
}
