# Helpdesk & CMDB System

## Overview
This enterprise IT service management application integrates helpdesk ticket tracking, ITIL-style change management, a Configuration Management Database (CMDB), a knowledge base, email integration, and Service Catalog for request fulfillment. It aims to provide IT support teams with a productivity-focused workflow and a professional, information-dense interface, inspired by Linear, Notion, and Carbon Design. A key ambition is to support multi-customer environments with data isolation. The system also includes comprehensive ISO 27001:2022 compliance features for information security management. Global administrators can enable or disable specific modules to customize their installation.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, Vite for building.
- **Routing**: Wouter.
- **State Management**: TanStack Query.
- **UI Framework**: shadcn/ui components (Radix UI primitives), styled with Tailwind CSS.
- **Design System**: Custom dark mode, professional blue primary color, status-based color coding, New York style variant of shadcn/ui, custom border radius.
- **Internationalization**: Full i18n support (English, French, Dutch, German, Spanish, Italian) using i18next.

### Backend Architecture
- **Framework**: Express.js with TypeScript on Node.js.
- **API Pattern**: RESTful.
- **Authentication**: Replit OIDC with passport.js and PostgreSQL-backed sessions.
- **Error Handling**: Centralized middleware.

### Data Architecture
- **ORM**: Drizzle ORM with Neon serverless PostgreSQL driver.
- **Schema Design**: Includes Users (role-based access), Tickets, Change Requests, Configuration Items (CMDB), Knowledge Base articles, Service Catalog Items, Service Requests, Comments, Emails, Attachments, Teams, Resolution Categories, System Settings, and SLA templates. Supports multi-customer data separation.
- **Database Features**: PostgreSQL enums, UUIDs, timestamps, foreign keys, JSONB fields for custom form data.
- **Migration Strategy**: Drizzle Kit.

### Authentication & Authorization
- **Provider**: Replit Auth with OIDC.
- **Flow**: Redirect to landing page, `/api/login` for OIDC, session creation from OIDC claims.
- **User Management**: Auto-created from OIDC claims, assigned "End User" role.
- **Session Security**: HTTP-only, secure cookies (7-day TTL).
- **RBAC System**: 12 granular permissions with ITIL-based roles, enforced via `requirePermission` middleware (backend) and `usePermissions` hooks (frontend).
- **ISO 27001 Controls**: Implements A.5.16 (Identity Management), A.5.17 (Authentication Information with strong password policy and MFA support), A.5.18 (Access Rights Management), A.8.15 (Comprehensive Audit Logging), A.8.16 (Monitoring Activities with session tracking and account lockout), A.9.4.1 (Information Access Restriction with warning banner).

### Key Architectural Patterns
- **Separation of Concerns**: `/client`, `/server`, `/shared` directories.
- **Type Safety**: Full TypeScript coverage, Zod validation.
- **Path Aliases**: `@/`, `@shared/`, `@assets/`.
- **Query Strategy**: Custom fetch wrapper with React Query.

### Feature Specifications
- **Helpdesk**: Ticket tracking with workflow, attachments, comments.
- **Change Management**: ITIL-style change requests with approval workflows.
- **CMDB**: Configuration Item management, auto-generated CI numbering, relationship tracking.
- **Knowledge Base**: Article management.
- **Service Catalog**: ITIL Request Fulfillment process with browsable catalog, custom form fields (JSONB), approval workflows, auto-generated request numbers (SR00001+), category-based organization (access, software, hardware, other), and full lifecycle management (submitted → pending_approval → approved/rejected → in_progress → completed/cancelled).
- **Reporting**: 13 report types with recharts visualizations.
- **SLA Management**: Template system.
- **License System**: Time-limited access, user limits, admin UI.
- **Password Policy**: Strong enforcement (min 8 chars, mixed case, number, special), forced change on first login.
- **Multi-Customer Support**: Data separation and user filtering.
- **Network Discovery**: Features for asset discovery.
- **Module Management**: Global admin feature toggle system allowing selective enabling/disabling of modules (Incidents, Problems, Changes, CMDB, Knowledge Base, Service Catalog, Email Inbox, Reports, Network Discovery). Organized into Core, ITIL, and Advanced categories with default enabled/disabled states. Navigation dynamically filters based on enabled modules.

## External Dependencies

### Database
- **Neon PostgreSQL**
- **connect-pg-simple**

### Authentication
- **Replit Auth**
- **openid-client**
- **passport**

### UI Libraries
- **Radix UI**
- **Tailwind CSS**
- **lucide-react**
- **react-day-picker**
- **date-fns**
- **recharts**

### Development Tools
- **Vite**
- **tsx**
- **multer**
- **i18next**
- **react-i18next**
- **i18next-browser-languagedetector**

### Network Discovery Tools
- **ssh2**
- **ip-address**