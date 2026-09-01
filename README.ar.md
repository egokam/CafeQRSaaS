# Qerve

<div align="center">

[English](README.md) · [العربية](README.ar.md)

</div>

Qerve هي منصة SaaS متعددة المستأجرين للمقاهي، مخصصة لطلب الطعام عبر رمز QR، عمليات الكاشير، تنسيق المطبخ، وإدارة كل مقهى بشكل مستقل. صُممت المنصة لتخدم عدة مقاهي من نفس التطبيق باستخدام Next.js، مع وجود كل مقهى في مسار منفصل وتكوين اشتراك خاص به.

يحتوي هذا المستودع على الكود الفعلي لمنصة Qerve، بما في ذلك الموقع التسويقي، قائمة الضيوف، لوحة إدارة المقهى، شاشة الكاشير، دورة الطباعة للمطبخ، ولوحة تحكم المشغل العليا.

## ما الذي تقدمه المنصة

- تتيح للضيوف تصفح قائمة المقهى عن طريق مسح رمز QR للطاولة
- تدعم واجهات باللغة العربية والإنجليزية والفرنسية
- تتيح لمالكي المقاهي إدارة المنتجات، الأقسام، الإضافات، والطاولات
- توفر واجهات الكاشير لقبول الطلبات أو رفضها
- ترسل الطلبات المقبولة إلى مسار المطبخ للطباعة والتجهيز
- تتبع المبيعات والفواتير وحدود الأجهزة وحالة الاشتراك
- تمنح لوحة تحكم خاصة للمشرف العام لإدارة المقاهي والاشتراكات
- تستخدم Supabase للتوثيق، قاعدة البيانات، التخزين، والتحديثات المباشرة

## نظرة عامة على المنتج

Qerve ليست تطبيقًا واحدًا لمقهى واحد، بل هي منصة مشتركة يمكنها خدمة مقاهي متعددة. لكل مقهى اسم مستعار (slug) خاص، بريد إلكتروني معتمد للإدارة، حدود اشتراك، إعدادات موظفين، قائمة منتجات، طاولات، وقواعد وصول خاصة. الواجهة مصممة لتكون أولاً وأخيرًا مناسبة للعمل الحقيقي في المطاعم والمقاهي.

## المسارات الأساسية في التطبيق

### 1. الصفحة الرئيسية والعرض التسويقي

تحتوي الصفحة الرئيسية على واجهة تسويقية احترافية مع قسم هيرو أنيق، عرض تجريبي، ميزات المنتج، دليل استخدام، وآخر. المنصة تدعم تعدد اللغات وتُصمم لعرض المنتج بشكل واضح لمالكي المقاهي والجهات المعنية.

الملفات ذات الصلة:
- src/app/page.tsx
- src/components/landing/*
- src/i18n/messages/*

### 2. تجربة طلب الضيوف عبر QR

يصل الضيف إلى رابط جدول مثل /[cafeSlug]/[tableId]. تتحقق التطبيق من صحة المقهى والطاولة وحالة الاشتراك قبل السماح بالعرض والطلب. يتم ربط الطلبات بجلسة العميل ثم انتقالها إلى كاشير المقهى.

تشمل واجهة الضيف:
- تصفح الأقسام والبحث
- إدارة السلة
- اختيار الإضافات
- إرسال الطلب
- متابعة الطلبات النشطة
- إلغاء الطلب وحالة التحديث

الملفات ذات الصلة:
- src/app/[cafeSlug]/[tableId]/page.tsx
- src/actions/menu.ts
- src/store/useCart.ts
- src/components/client/*

### 3. لوحة إدارة المقهى

منطقة مالك المقهى تتيح إدارة المنتجات والتشغيل اليومي، وتشمل:
- تحديث القائمة وتفعيل المنتجات
- إدارة مجموعات الإضافات والأسعار
- إنشاء الطاولات وتوليد روابط QR
- تقارير المبيعات الشهرية
- إدارة أجهزة POS
- إعداد موظفي الكاشير وأرقام PIN
- الفواتير وحالة الاشتراك
- رسائل الدعم والإشعارات

الملفات ذات الصلة:
- src/app/[cafeSlug]/admin/page.tsx
- src/actions/auth.ts
- src/actions/support.ts
- src/actions/payment.ts
- src/components/admin/*

### 4. سير عمل الكاشير

واجهة الكاشير مصممة لقبول طلبات الضيوف، ورفض الطلبات غير الصالحة، وإنشاء طلبات يدوية، والحفاظ على حركة الخدمة. جلسات الكاشير محمية برقم PIN، ويُراعى فيها الحد الأقصى للأجهزة النشطة في كل مقهى.

الملفات ذات الصلة:
- src/components/admin/DevicesTab.tsx
- src/components/admin/EmployeesTab.tsx
- src/actions/employees.ts
- src/app/demo/pos/page.tsx

### 5. المطبخ والطباعة ودارسة الطلبات

يتم تمرير الطلبات المقبولة إلى سير عمل المطبخ. يدعم التطبيق شاشة طباعة المطبخ وتفاعلات "سحب وقطع الإيصال" في العرض التجريبي. تنتقل الطلبات عبر حالات مثل pending، accepted، ready، completed، rejected، و cancelled.

الملفات ذات الصلة:
- src/components/KitchenReciept.tsx
- src/app/demo/kitchen/page.tsx
- src/components/client/ProductPage/*
- src/actions/menu.ts

### 6. لوحة المشرف العام (SaaS)

بوابة المشرف العام هي لوحة تحكم خاصة بإدارة النظام نفسه. تسمح للمالك المعتمد بـ:
- عرض جميع المقاهي
- تحديث حالة الاشتراك أو الحالة التشغيلية
- إدارة السجلات البنكية والفواتير
- تحديث بيانات مالك المقهى
- إنشاء مقاهي جديدة مع خطة وتجربة مجانية
- حذف أو إيقاف مقهى عند الحاجة
- إدارة الإضافات المشتركة على مستوى المنصة

الملفات ذات الصلة:
- src/app/ego-owner-9539/page.tsx
- src/app/ego-owner-9539/login/page.tsx
- src/actions/saas.ts
- src/components/s-admin/*

## الهندسة المعمارية ونموذج البيانات

### تصميم متعدد المستأجرين

المشروع يستخدم نفس قاعدة الكود لكل المقاهي، مع مسارات مختلفة لكل مقهى. يتم الفصل بين المقاهي بواسطة فحوصات التحقق والاشتراك، ويُطلب وجود slug صحيح وسجل ذو صلة قبل تنفيذ أي تعديل أو طلب.

### أساس Supabase

تستخدم التطبيق Supabase في:
- قاعدة بيانات PostgreSQL
- المصادقة والأدوار الأمنية
- تخزين الملفات المرفوعة
- الاشتراكات المباشرة (Realtime)
- عمليات خدمة النظام باستخدام service-role

### نموذج الأمان

يستخدم المشروع طبقات أمان متعددة، مثل:
- ملفات تعريف ارتباط (cookies) موقعة للوصول الإداري والمشرف العام
- فحوصات صلاحيات من خلال server actions
- التحقق من الاشتراك قبل فتح قائمة المقهى أو تشغيل الكاشير
- التحقق من الطاولة والمقهى قبل قبول طلبات الضيوف
- فحص PIN للموظفين وكاشير المقهى
- رؤوس أمان صارمة تضاف عبر middleware

الملف ذي الصلة:
- middleware.ts

## стек التقنيات

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
- Electron + electron-builder (دعم حزم سطح المكتب)

## هيكل المستودع

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
├── README.ar.md
└── .env.example-like setup via project environment variables
```

## المسارات الأساسية

- / - الصفحة الرئيسية
- /tutorial - دليل المنتج
- /demo/admin - نسخة تجريبية للإدارة
- /demo/pos - نسخة تجريبية للكاشير
- /demo/kitchen - نسخة تجريبية للمطبخ
- /demo/client - نسخة تجريبية لقائمة الضيوف
- /[cafeSlug]/admin - لوحة إدارة المقهى
- /[cafeSlug]/cashier - شاشة الكاشير
- /[cafeSlug]/[tableId] - قائمة الضيف عبر QR
- /ego-owner-9539/login - تسجيل دخول المشرف العام
- /ego-owner-9539 - لوحة إدارة المنصة

## متغيرات البيئة

يتوقع المشروع قيم إعدادات Supabase وتكوينات التطبيق أثناء التشغيل. من المتغيرات الشائعة:

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

## التطوير المحلي

```bash
npm install
npm run dev
```

ثم افتح التطبيق في المتصفح عادةً على http://localhost:3000

## البناء والتشغيل

```bash
npm run build
npm run start
```

الأوامر الإضافية:

```bash
npm run lint
npm run electron:start
npm run electron:build
npm run release
```

## ملاحظات

- هذا التطبيق مصمم كنظام SaaS حقيقي وليس كقالب أو مشروع Starter بسيط.
- تدفقات المبيعات والفواتير ولوحة الإدارة مرتبطة بمنطق الاشتراك وكل مقهى.
- توجد شاشات تجريبية لعرض المنتج والاختبار، لكن التجربة الإنتاجية تكون متوافقة مع كل مقهى ومُحمية.
- يحتوي المستودع على دعم للتطبيق الويب وباقة سطح المكتب عبر Electron.

## الخلاصة

Qerve هي منصة تشغيل للمقاهي مبنية على الطلب عبر QR، سير عمل الكاشير المباشر، توجيه الطلبات إلى المطبخ، إدارة المقهى، والتحكم SaaS متعدد المستأجرين. تجمع المنصة بين واجهة أمامية أنيقة ونموذج خلفي صارم ومناسب للأعمال الحقيقية في قطاع المقاهي.
