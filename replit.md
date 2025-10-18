# Helpdesk & CMDB System

## Overview

This enterprise IT service management application integrates helpdesk ticket tracking, ITIL-style change management, a Configuration Management Database (CMDB), a knowledge base, and email integration. It targets IT support teams with a productivity-focused workflow and a professional, information-dense interface. The system's design is inspired by Linear for efficient workflows, Notion for knowledge management, and Carbon Design for enterprise data management, emphasizing clarity, minimal clicks, and rapid resolution. A key ambition is to support multi-customer environments, allowing for customer-specific data isolation and management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite for building.
**Routing**: Wouter for lightweight client-side routing.
**State Management**: TanStack Query for server state management, optimized for explicit data updates.
**UI Framework**: shadcn/ui components built on Radix UI primitives, styled with Tailwind CSS.
**Design System**: Features a custom dark mode palette, professional blue primary color, status-based color coding (success, warning, error, info), priority indicators, and information-dense layouts. Uses the New York style variant of shadcn/ui, CSS variables for theming, and custom border radius values.

### Backend Architecture

**Framework**: Express.js with TypeScript on Node.js.
**API Pattern**: RESTful API design.
**Authentication**: Replit OIDC (OpenID Connect) integration using passport.js with session-based authentication.
**Session Management**: PostgreSQL-backed sessions using connect-pg-simple.
**Error Handling**: Centralized middleware for comprehensive error handling.

### Data Architecture

**ORM**: Drizzle ORM with Neon serverless PostgreSQL driver.
**Schema Design**: Includes tables for Users (role-based access), Tickets (with status workflow, categories, tags, attachments), Change Requests (ITIL fields, approval workflow, attachments), Configuration Items (CMDB with asset tracking, CI numbers, network discovery fields), Contacts, Knowledge Base articles, Comments, Email messages, Attachments, Teams, Resolution Categories, and System Settings. Supports multi-customer data separation.
**Database Features**: Utilizes PostgreSQL enums, UUIDs for primary keys, timestamp tracking, foreign key relationships, and JSONB fields. Includes specific tables for alert integrations, network discovery, and user management.
**Migration Strategy**: Drizzle Kit for schema migrations.

### Authentication & Authorization

**Provider**: Replit Auth with OIDC discovery.
**Flow**: Redirects unauthenticated users to a landing page, initiates login via `/api/login`, and uses OIDC callback for session creation/updates. Sessions are PostgreSQL-backed with a 7-day TTL. All API routes are protected by `isAuthenticated` middleware.
**User Management**: User profiles are auto-created from OIDC claims, include email, name, and profile image, and default to a 'user' role.
**Session Security**: Employs HTTP-only, secure cookies with a 7-day session lifetime.

### Key Architectural Patterns

**Separation of Concerns**: Clearly separates frontend (`/client`), backend (`/server`), and shared TypeScript types and database schema (`/shared`).
**Type Safety**: Achieved with full TypeScript coverage and Zod validation schemas generated from Drizzle.
**Path Aliases**: Uses `@/` for client, `@shared/` for shared, and `@assets/` for attached assets.
**Query Strategy**: Custom fetch wrapper with React Query for handling 401s, JSON parsing, and error transformation.
**Component Organization**: Organizes UI components, feature components, and page components into distinct directories.

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL.
- **connect-pg-simple**: PostgreSQL session store.

### Authentication
- **Replit Auth**: OIDC provider.
- **openid-client**: OpenID Connect client library.
- **passport**: Authentication middleware.

### UI Libraries
- **Radix UI**: Accessible component primitives.
- **Tailwind CSS**: Utility-first CSS framework.
- **class-variance-authority**: CSS variant API.
- **cmdk**: Command palette component.
- **lucide-react**: Icon library.
- **react-day-picker**: Date picker component.
- **date-fns**: Date utility library.

### Development Tools
- **Vite**: Build tool and dev server.
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay.
- **@replit/vite-plugin-cartographer**: Development tooling.
- **tsx**: TypeScript execution.

### Network Discovery Tools
- **ssh2**: SSH client.
- **ip-address**: IP address parsing and range generation.

### Build & Deployment
- **esbuild**: Server-side bundler.
- **vite build**: Client-side production build.