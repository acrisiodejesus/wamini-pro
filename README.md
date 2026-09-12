[![CI/CD Configured](https://img.shields.io/badge/CI%2FCD-Configured-success?style=for-the-badge&logo=githubactions&logoColor=white)]()
[![Framework](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)]()
[![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)]()
[![E2E Testing](https://img.shields.io/badge/Tested_with-Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)]()
[![Live Demo](https://img.shields.io/badge/Live_Platform-Click_Here-0052cc?style=for-the-badge)](https://wamini.co.mz)

> A scalable, high-performance web marketplace engineered to bridge the gap between local agricultural producers and direct buyers, streamlining the food supply chain with a strong focus on accessibility and offline capabilities.

## 🎯 The Business Case

The traditional agricultural supply chain is heavily fragmented, relying on multiple middlemen that reduce farmer profits and increase prices for end buyers. 

**Wamini** was built to solve this critical market inefficiency in Mozambique and beyond. It serves as a direct digital bridge, allowing farmers to list their produce and buyers to source agricultural products seamlessly. This platform demonstrates the capability to build complex, multi-sided marketplaces with distinct user roles, robust data flows, and strict accessibility standards to ensure digital inclusion for everyone, regardless of their technical literacy.

---

## 🛠️ Architecture & Tech Stack

Building a multi-sided marketplace requires a robust frontend that can handle dynamic data caching, SEO optimization, and strict type safety, especially when targeting users in areas with unstable internet infrastructure.

* **Core Framework:** Next.js 15 (App Router) & React 19
* **Language:** TypeScript 
* **State Management:** Zustand (Global State) + React Query (Server State & Caching)
* **Styling & Animation:** Tailwind CSS + Framer Motion
* **Forms & Validation:** React Hook Form + Zod
* **Progressive Web App (PWA):** Serwist (Offline support & caching strategies)
* **Internationalization:** `next-intl` (Supporting Portuguese and local dialects like Emakua)
* **Testing:** Playwright (End-to-End Testing)
* **Data Persistence:** Better-SQLite3 (Fast, local SQLite persistence for audit and recovery) Only for MVP
* **Security & Compliance:** Zero-Trust Audit Logging & Admin Management.

---

## ⚙️ Core Engineering Highlights

### 1. Progressive Web App (PWA) & Offline-First
Rural farmers often face unstable internet connections. Wamini is fully configured as a PWA, utilizing robust Service Workers (`@serwist/next`) to cache critical assets, handle offline fallbacks, and allow users to install the marketplace directly on their mobile home screens.

### 2. Deep Accessibility & Voice Commands
Acknowledging the low digital literacy in certain target demographics, the platform includes a custom **Accessibility Panel**. It supports:
- Web Speech Recognition API for voice command navigation.
- High-contrast modes and text resizing.
- Dual-event listeners (focus/click) ensuring full screen-reader compliance for visually impaired users.

### 3. Native Internationalization (i18n)
Built-in support for multiple languages including Portuguese (pt-PT) and local dialects like **Emakua**. This ensures the platform is truly localized and usable by farmers in their native tongues.

### 4. High-Performance & Automated E2E Testing
Leveraging Next.js server components and React Query edge-caching to fetch listings instantly. The critical user flows (like product browsing and authentication) are guarded by **Playwright E2E tests**, ensuring zero-regression deployments.

### 5. Zero-Trust Compliance & Fraud-Proof Audit
Wamini implements an industrial-grade compliance layer where **nothing is ever truly deleted**. 
- **Soft-Deletes:** All entities (products, negotiations, messages) use `deleted_at` timestamps, ensuring full data recovery and historical integrity.
- **Immutable Audit Log:** Every system interaction (ACCESS, CREATE, UPDATE, DELETE) is cryptographically recorded in a centralized audit table, capturing actor identity, IP address, and JSON snapshots of data states (old vs new).

### 6. Secure Admin Intelligence
A hidden, multi-layer protected **Admin Dashboard** (`/admin`) allows authorized personnel to:
- Monitor real-time system audit logs.
- Manage and restore soft-deleted records.
- Enforce market integrity through a dedicated server-side role validation system (bypassing client-side spoofing).

### 7. Automated CI/CD & Production Infrastructure
Wamini follows a modern, cloud-agnostic deployment strategy.
- **Coolify Integration:** Every push to the `main` branch triggers an automated build and deployment through a self-hosted Coolify instance.
- **Nixpacks Engine:** Utilizes the Nixpacks build system for zero-config, OCI-compliant container generation, ensuring perfect parity between development and production environments.
- **Zero-Downtime Rebuilds:** The pipeline includes automatic Health Checks and Rollback procedures to maintain 100% availability during updates.

---

## 🤝 Need a Custom Marketplace or AgriTech Solution?

Are you looking to build a scalable, multi-sided platform that connects distinct user bases? I specialize in translating complex supply-chain problems into intuitive, high-performance web applications.

Let's discuss your project architecture.

[![Upwork](https://img.shields.io/badge/Hire_me_on-Upwork-14A800?style=for-the-badge&logo=upwork&logoColor=white)](https://www.upwork.com/freelancers/~010ae73f246a0cf746)
[![Fiverr](https://img.shields.io/badge/Hire_me_on-Fiverr-00b22d?style=for-the-badge&logo=fiverr&logoColor=white)](https://www.fiverr.com/sellers/acrisio45)
[![LinkedIn](https://img.shields.io/badge/Connect_on-LinkedIn-0A66C2?style=for-the-badge&logo=linkedin)](https://linkedin.com/in/acrisiodejesus)