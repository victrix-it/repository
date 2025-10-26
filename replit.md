# Helpdesk & CMDB System

## Overview
This enterprise IT service management application integrates helpdesk incident tracking (ITIL terminology), ITIL-style change management, a Configuration Management Database (CMDB), a knowledge base, email integration, and Service Catalog for request fulfillment. It aims to provide IT support teams with a productivity-focused workflow and a professional, information-dense interface, inspired by Linear, Notion, and Carbon Design. A key ambition is to support multi-customer environments with data isolation. The system also includes comprehensive ISO 27001:2022 compliance features for information security management. Global administrators can enable or disable specific modules to customize their installation.

**Note**: The application uses ITIL-standard terminology of "Incidents" in the UI across all 6 supported languages (English, French, German, Spanish, Dutch, Italian), though the database schema and API routes still use "tickets" for backward compatibility.

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
- **Mobile UX**: Fully responsive design with mobile-first approach. Breakpoint at 768px (useIsMobile hook). Responsive padding (p-4 md:p-8), text sizing (text-2xl md:text-3xl), grid layouts (grid-cols-2 lg:grid-cols-4), and full-width filters on mobile (w-full sm:w-48). All touch targets meet accessibility standards (min 44x44px).

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
- **Providers**: Multi-authentication support including Replit OIDC, local username/password, LDAP, and SAML.
- **Local Authentication**: Enabled via system_settings (auth_local_enabled), provides username/password login for users with authProvider='local'.
- **Landing Page**: Custom login page with email/password form, ISO 27001 A.9.4.1 compliant warning banner, and customizable branding. Fully mobile-responsive with optimized touch targets and layout.
- **Flow**: Landing page at `/` with login form → `/api/auth/local/login` for local auth or `/api/login` for OIDC → session creation → page reload to dashboard.
- **User Management**: Auto-created from OIDC claims or manually created for local auth, assigned default "End User" role.
- **Session Security**: HTTP-only, secure cookies (7-day TTL, sameSite: 'lax'), PostgreSQL session store with explicit session.save() before response to ensure persistence.
- **RBAC System**: 12 granular permissions with ITIL-based roles, enforced via `requirePermission` middleware (backend) and `usePermissions` hooks (frontend).
- **ISO 27001 Controls**: Implements A.5.16 (Identity Management), A.5.17 (Authentication Information with strong password policy and MFA support), A.5.18 (Access Rights Management), A.8.15 (Comprehensive Audit Logging), A.8.16 (Monitoring Activities with session tracking and account lockout), A.9.4.1 (Information Access Restriction with customizable warning banner).

### Key Architectural Patterns
- **Separation of Concerns**: `/client`, `/server`, `/shared` directories.
- **Type Safety**: Full TypeScript coverage, Zod validation.
- **Path Aliases**: `@/`, `@shared/`, `@assets/`.
- **Query Strategy**: Custom fetch wrapper with React Query.

### Feature Specifications
- **Landing Page**: Customizable pre-login page with login form, warning banner, and branding. Settings stored in system_settings table (landing_title, landing_subtitle, landing_warning_title, logo_url). Supports both local authentication and OIDC.
- **Branding & Customization**: Admin interface at `/admin/branding` allows customization of system name, company name, logo, primary color, tagline, footer text, and landing page content (title, subtitle, warning message).
- **Dashboard**: Comprehensive analytics and overview page displaying key metrics (open incidents, in progress, pending approvals, SLA breaches), interactive charts (incidents by status/priority using recharts), recent activity feeds (latest incidents, changes, service requests), and quick access cards to CMDB and Knowledge Base. Default landing page after authentication. Fully translated across all 6 languages.
- **Helpdesk/Incident Management**: Incident tracking with workflow, attachments, comments. UI displays "Incidents" terminology aligned with ITIL standards.
- **Change Management**: ITIL-style change requests with approval workflows and automated email notifications to customer approvers.
- **CMDB**: Configuration Item management, auto-generated CI numbering, relationship tracking. CI owners receive automatic email notifications when incidents or changes are raised against their CIs.
- **Knowledge Base**: Article management.
- **Service Catalog**: ITIL Request Fulfillment process with browsable catalog, custom form fields (JSONB), approval workflows, auto-generated request numbers (SR00001+), category-based organization (access, software, hardware, network, general), and full lifecycle management (submitted → pending_approval → approved/rejected → in_progress → completed/cancelled).
- **Email Notifications**: Comprehensive email notification system using nodemailer with SMTP configuration. Supports:
  - **Change Approval Workflow**: Automated emails sent to customer approvers when changes are created, including direct approval/rejection links.
  - **CI Owner Notifications**: Automatic alerts to CI owners when incidents or changes are raised against their configuration items.
  - **Custom Domain Support**: Configured to send from servicedesk.victrix-it.com with HTML templates featuring company branding.
  - **SMTP Configuration**: Admin-configurable via system_settings (smtp_host, smtp_port, smtp_user, smtp_password, smtp_from_email, smtp_from_name).
  - **Email Service**: Singleton service initialized on server startup, async operation (non-blocking), comprehensive error logging.
- **Reporting**: 13 report types with recharts visualizations.
- **SLA Management**: Template system.
- **License System**: Time-limited access, user limits, admin UI.
- **Password Policy**: Strong enforcement (min 8 chars, mixed case, number, special), forced change on first login.
- **Multi-Customer Support**: Data separation and user filtering. Each customer can have designated change approvers (stored as array of user IDs in changeApproverIds field).
- **Network Discovery**: Dual-mode network asset discovery system:
  - **Self-Hosted Mode** (deployment_mode='self_hosted'): Discovery runs server-side using SSH credentials stored in the system. Supports automated scanning of network ranges with real-time progress tracking and credential management.
  - **SaaS Mode** (deployment_mode='saas'): Generates PowerShell and Bash scripts that customers download and run on their local networks. Scripts scan specified subnets, gather hardware information via SSH, and output CSV files compatible with the CMDB Import Tool. This approach keeps sensitive network credentials on-premise while still enabling discovery.
  - **Deployment Mode Configuration**: Configurable via Admin → Branding & Customization → Deployment Mode setting. UI automatically adapts to show appropriate discovery workflow.
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

### Email & Communication
- **nodemailer** - Email sending via SMTP

### Network Discovery Tools
- **ssh2**
- **ip-address**