import { Fragment } from "react";
import type { ComponentType, ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
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
import { getLocaleDirection, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Metadata");

  return {
    title: t("tutorialTitle"),
    description: t("tutorialDescription"),
  };
}

type Icon = ComponentType<{ className?: string }>;

const tocItems = [
  ["introduction", "introduction"],
  ["platform-overview", "platformOverview"],
  ["core-suite", "coreSuite"],
  ["architecture", "architecture"],
  ["security", "security"],
  ["business-requirements", "businessRequirements"],
  ["technology-stack", "technologyStack"],
  ["project-structure", "projectStructure"],
  ["guest-order-workflow", "guestOrderWorkflow"],
  ["pos-workflow", "posWorkflow"],
  ["saas-flow", "saasFlow"],
  ["live-demo", "liveDemo"],
  ["roadmap", "roadmap"],
] as const;

const productSuiteItems = [
  { key: "qr", icon: QrCode },
  { key: "pos", icon: CreditCard },
  { key: "kitchen", icon: Printer },
  { key: "admin", icon: LayoutDashboard },
  { key: "saas", icon: Building2 },
] as const;

const architectureFeatureItems = [
  { key: "routing", icon: Layers3 },
  { key: "isolation", icon: Database },
  { key: "realtime", icon: Clock },
  { key: "actions", icon: Terminal },
] as const;

const securityFeatureItems = [
  { key: "headers", icon: ShieldCheck },
  { key: "owner", icon: KeyRound },
  { key: "pin", icon: Lock },
  { key: "subscription", icon: BadgeCheck },
] as const;

const requirementItems = [
  { key: "printer", icon: Printer },
  { key: "pos", icon: Monitor },
  { key: "admin", icon: LayoutDashboard },
  { key: "internet", icon: Workflow },
  { key: "guests", icon: Smartphone },
] as const;

const guestFlowIcons = [Users, QrCode, CreditCard, Printer, ChefHat] as const;
const tenantFlowIcons = [
  ShieldCheck,
  Building2,
  BadgeCheck,
  LayoutDashboard,
  CreditCard,
  Users,
] as const;

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

type FlowStep = [string, string];
type StackRow = [string, string];

export default async function TutorialPage() {
  const locale = (await getLocale()) as Locale;
  const direction = getLocaleDirection(locale);
  const isRtl = direction === "rtl";
  const t = await getTranslations({ locale, namespace: "Tutorial" });
  const BackIcon = isRtl ? ArrowRight : ArrowLeft;
  const ForwardIcon = isRtl ? ArrowLeft : ArrowRight;
  const forwardHoverClass = isRtl
    ? "group-hover:-translate-x-1"
    : "group-hover:translate-x-1";

  const toc = tocItems.map(([id, key]) => ({
    id,
    label: t(`toc.${key}`),
  }));

  const productSuite = productSuiteItems.map(({ key, icon }) => ({
    title: t(`coreSuite.items.${key}.title`),
    icon,
    body: t(`coreSuite.items.${key}.body`),
    points: t.raw(`coreSuite.items.${key}.points`) as string[],
  }));

  const architectureFeatures = architectureFeatureItems.map(({ key, icon }) => ({
    title: t(`architecture.features.${key}.title`),
    icon,
    body: t(`architecture.features.${key}.body`),
  }));

  const securityFeatures = securityFeatureItems.map(({ key, icon }) => ({
    title: t(`security.features.${key}.title`),
    icon,
    body: t(`security.features.${key}.body`),
  }));

  const requirements = requirementItems.map(({ key, icon }) => ({
    title: t(`business.items.${key}.title`),
    icon,
    body: t(`business.items.${key}.body`),
  }));

  const guestFlow = (t.raw("guestFlow.steps") as FlowStep[]).map(
    ([title, detail], index) => ({
      title,
      detail,
      icon: guestFlowIcons[index],
    })
  );

  const tenantFlow = (t.raw("saasFlow.steps") as FlowStep[]).map(
    ([title, detail], index) => ({
      title,
      detail,
      icon: tenantFlowIcons[index],
    })
  );

  const demoCards = [
    { title: t("liveDemo.cards.client"), href: "/demo/client", icon: QrCode },
    { title: t("liveDemo.cards.pos"), href: "/demo/pos", icon: CreditCard },
    { title: t("liveDemo.cards.kitchen"), href: "/demo/kitchen", icon: ChefHat },
    {
      title: t("liveDemo.cards.admin"),
      href: "/demo/admin",
      icon: LayoutDashboard,
    },
  ];

  const heroTags = t.raw("hero.tags") as string[];
  const overviewParagraphs = t.raw("overview.paragraphs") as string[];
  const stack = t.raw("stack.rows") as StackRow[];
  const posFlowLines = t.raw("posFlow.lines") as FlowStep[];
  const roadmap = t.raw("roadmap.items") as string[];

  return (
    <div
      id="top"
      dir={direction}
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
            <BackIcon className="h-4 w-4" />
            {t("header.back")}
          </Link>
          <Link
            href="/demo/client"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-50 px-4 py-2 text-sm font-medium text-zinc-950 transition-colors hover:bg-amber-400"
          >
            {t("header.demos")}
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[230px_minmax(0,1fr)] lg:px-8 lg:py-16">
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-3xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-xl">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
              {t("toc.title")}
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
              {t("hero.badge")}
            </Badge>
            <h1 className="mt-6 text-balance text-5xl font-semibold leading-tight tracking-tight text-zinc-50 sm:text-6xl">
              {t("hero.title")}
            </h1>
            <p className="mt-6 max-w-3xl text-pretty text-lg leading-8 text-zinc-400">
              {t("hero.description")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {heroTags.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-zinc-300"
                >
                  {label}
                </span>
              ))}
            </div>
          </section>

          <Section
            id="platform-overview"
            eyebrow={t("overview.eyebrow")}
            title={t("overview.title")}
          >
            {overviewParagraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
            <Callout icon={Sparkles} title={t("overview.calloutTitle")}>
              {t("overview.calloutBody")}
            </Callout>
          </Section>

          <Section
            id="core-suite"
            eyebrow={t("coreSuite.eyebrow")}
            title={t("coreSuite.title")}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              {productSuite.map((product) => (
                <ProductCard key={product.title} {...product} />
              ))}
            </div>
          </Section>

          <Section
            id="architecture"
            eyebrow={t("architecture.eyebrow")}
            title={t("architecture.title")}
          >
            <p>{t("architecture.paragraph")}</p>
            <div className="grid gap-4 lg:grid-cols-2">
              <FeatureGrid items={architectureFeatures} />
            </div>
            <CodeBlock
              title={t("architecture.codeTitle")}
              language={t("architecture.codeLanguage")}
            >
              <span className="text-zinc-300">{t("architecture.code")}</span>
            </CodeBlock>
          </Section>

          <Section
            id="security"
            eyebrow={t("security.eyebrow")}
            title={t("security.title")}
          >
            <p>{t("security.paragraph")}</p>
            <FeatureGrid items={securityFeatures} />
            <Callout icon={ShieldCheck} title={t("security.calloutTitle")}>
              {t("security.calloutBody")}
            </Callout>
          </Section>

          <Section
            id="business-requirements"
            eyebrow={t("business.eyebrow")}
            title={t("business.title")}
          >
            <p>{t("business.paragraph")}</p>
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
            eyebrow={t("stack.eyebrow")}
            title={t("stack.title")}
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
            eyebrow={t("structure.eyebrow")}
            title={t("structure.title")}
          >
            <p>{t("structure.paragraph")}</p>
            <CodeBlock
              title={t("structure.codeTitle")}
              language={t("structure.codeLanguage")}
            >
              <span className="text-zinc-300">{t("structure.code")}</span>
            </CodeBlock>
          </Section>

          <Section
            id="guest-order-workflow"
            eyebrow={t("guestFlow.eyebrow")}
            title={t("guestFlow.title")}
          >
            <p>{t("guestFlow.paragraph")}</p>
            <FlowDiagram title={t("guestFlow.diagramTitle")} steps={guestFlow} />
          </Section>

          <Section
            id="pos-workflow"
            eyebrow={t("posFlow.eyebrow")}
            title={t("posFlow.title")}
          >
            <p>{t("posFlow.paragraph")}</p>
            <CodeBlock
              title={t("posFlow.codeTitle")}
              language={t("posFlow.codeLanguage")}
            >
              {posFlowLines.map(([actor, detail], index) => (
                <Fragment key={`${actor}-${detail}`}>
                  <span className="text-purple-300">{actor}</span>
                  <span className="text-zinc-300"> {detail}</span>
                  {index < posFlowLines.length - 1 ? "\n" : null}
                </Fragment>
              ))}
            </CodeBlock>
          </Section>

          <Section
            id="saas-flow"
            eyebrow={t("saasFlow.eyebrow")}
            title={t("saasFlow.title")}
          >
            <p>{t("saasFlow.paragraph")}</p>
            <FlowDiagram title={t("saasFlow.diagramTitle")} steps={tenantFlow} />
          </Section>

          <Section
            id="live-demo"
            eyebrow={t("liveDemo.eyebrow")}
            title={t("liveDemo.title")}
          >
            <p>{t("liveDemo.paragraph")}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {demoCards.map(({ title, href, icon: Icon }) => {
                return (
                  <Link
                    key={href}
                    href={href}
                    className="group rounded-3xl border border-white/10 bg-white/[0.035] p-5 transition-colors hover:border-amber-400/30 hover:bg-white/[0.06]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="font-semibold text-zinc-50">
                          {title}
                        </span>
                      </div>
                      <ForwardIcon
                        className={cn(
                          "h-5 w-5 text-zinc-500 transition-transform group-hover:text-amber-300",
                          forwardHoverClass
                        )}
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          </Section>

          <Section
            id="roadmap"
            eyebrow={t("roadmap.eyebrow")}
            title={t("roadmap.title")}
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
                  {t("roadmap.ctaTitle")}
                </h3>
                <p className="mt-1 text-sm text-zinc-400">
                  {t("roadmap.ctaBody")}
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/demo/client"
                  className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
                >
                  {t("roadmap.exploreDemo")}
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link
                  href="/get-started"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/[0.06]"
                >
                  {t("roadmap.getStarted")}
                  <ForwardIcon className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Section>
        </article>
      </main>
    </div>
  );
}
