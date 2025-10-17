# Helpdesk & CMDB System

## Overview

This is an enterprise IT service management application that combines helpdesk ticket tracking, change management (ITIL-style change requests), a Configuration Management Database (CMDB), knowledge base (SOPs and known issues), and email integration. The system is designed for productivity-focused workflows with a professional, information-dense interface suitable for IT support teams.

The application follows a hybrid design approach inspired by Linear (efficient ticket workflows), Notion (knowledge management), and Carbon Design (enterprise data management), prioritizing information clarity, minimal clicks, and rapid resolution workflows.

## Recent Changes

**October 17, 2025:**
- Added file attachment support for tickets, changes, and knowledge base articles
  - Attachments table with 10MB file size limit
  - File upload/download/delete functionality
  - Files stored in /uploads directory
  - Integrated into detail pages for all three entity types
- Added ticket categorization and tagging system
  - Category field with predefined options (Hardware, Software, Network, Access, Email, Other)
  - Flexible tagging system using text array
  - Category and tag filtering on tickets list page
  - Visual display of category and tags on ticket cards and detail pages
- Implemented branding and customization system
  - System settings table with key-value storage
  - Admin branding page for customizing system name, company name, tagline, logo, and primary color
  - Live preview of branding changes
  - API endpoints for managing system settings
  - Admin-only access via role-based sidebar navigation
- Implemented multi-authentication system (local, LDAP, SAML)
  - Schema updated to support multiple auth providers (authProvider field)
  - LDAP authentication strategy with configurable server settings
  - SAML 2.0 authentication for enterprise SSO
  - Local username/password authentication with bcrypt hashing
  - Admin UI for configuring authentication methods
  - Auth settings stored in system_settings table
  - Multiple auth methods can be enabled simultaneously
- Implemented alert integration system for monitoring tools
  - Webhook endpoints for receiving alerts from SolarWinds, Nagios, Zabbix, etc.
  - Configurable alert integrations with unique webhook URLs and API keys
  - Alert filtering system to prevent unwanted alerts from creating tickets
  - Field mapping system to extract ticket data from alert payloads
  - Support for multiple monitoring systems with different payload formats
  - Automated ticket creation with team assignment and priority mapping
  - System user for automated operations
  - Filter rules support include/exclude logic with operators (equals, contains, regex, etc.)
  - Field transformations (severity_to_priority, uppercase, lowercase, etc.)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool

**Routing**: Wouter for client-side routing, providing a lightweight alternative to React Router

**State Management**: TanStack Query (React Query) for server state management with infinite stale time and disabled auto-refetching, optimizing for explicit data updates

**UI Framework**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling

**Design System**: 
- Custom color palette with dark mode primary (background base: 220 15% 8%)
- Professional blue primary color (217 91% 60%)
- Status-based color coding (success/green, warning/yellow, error/red, info/blue)
- Priority indicators (critical/red through low/neutral)
- Information-dense layouts optimized for rapid scanning

**Key Design Decisions**:
- New York style variant of shadcn/ui for cleaner aesthetics
- CSS variables for theming flexibility
- Custom border radius values (9px lg, 6px md, 3px sm)
- Hover and active elevation effects for interactive elements

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js

**API Pattern**: RESTful API design with route handlers in `/server/routes.ts`

**Authentication**: Replit OIDC (OpenID Connect) integration using passport.js with session-based authentication

**Session Management**: PostgreSQL-backed sessions using connect-pg-simple for persistence across restarts

**Error Handling**: Centralized error middleware catching all route errors and returning appropriate HTTP status codes

**Development Tools**:
- Vite middleware integration for HMR in development
- Custom logging for API requests with duration tracking
- Runtime error overlay plugin for better DX

### Data Architecture

**ORM**: Drizzle ORM with Neon serverless PostgreSQL driver

**Schema Design**:
- Users table with role-based access (user, support, admin)
- Tickets with status workflow (open → in_progress → resolved → closed)
  - Includes category (varchar) and tags (text array) for organization
- Change requests with approval workflow (draft → pending_approval → approved/rejected → scheduled → implemented)
- Configuration items (CMDB) with types (server, application, database, network, storage)
- Knowledge base articles (SOPs and known issues)
- Comments system for tickets and changes
- Email messages tracking
- Attachments table for file uploads (linked to tickets, changes, and KB articles)
- Teams and team members for ticket assignment
- Resolution categories for tracking common solutions
- System settings table for branding and configuration (key-value pairs)

**Database Features**:
- PostgreSQL enums for status fields ensuring data integrity
- UUID generation for primary keys using gen_random_uuid()
- Timestamp tracking (createdAt, updatedAt) on all entities
- Foreign key relationships with user references
- JSONB fields for flexible metadata storage
- Alert integration tables (alert_integrations, alert_filter_rules, alert_field_mappings)

**Migration Strategy**: Drizzle Kit for schema migrations with push command for development

### Authentication & Authorization

**Provider**: Replit Auth with OIDC discovery

**Flow**:
1. Unauthenticated users redirected to landing page
2. Login initiated via `/api/login` endpoint
3. OIDC callback creates/updates user session
4. Session stored in PostgreSQL with 7-day TTL
5. All API routes protected with `isAuthenticated` middleware

**User Management**:
- User profiles auto-created from OIDC claims
- Profile includes email, firstName, lastName, profileImageUrl
- Role assignment (defaults to 'user')
- User lookup and listing capabilities

**Session Security**:
- HTTP-only cookies
- Secure flag enabled
- 7-day session lifetime
- PostgreSQL-backed for horizontal scalability

### Key Architectural Patterns

**Separation of Concerns**:
- `/client` - Frontend React application
- `/server` - Express backend and API routes  
- `/shared` - Shared TypeScript types and database schema

**Type Safety**: Full TypeScript coverage with Zod validation schemas generated from Drizzle schema using drizzle-zod

**Path Aliases**:
- `@/` → client/src/
- `@shared/` → shared/
- `@assets/` → attached_assets/

**Query Strategy**: React Query with custom fetch wrapper handling 401s, JSON parsing, and error transformation

**Component Organization**:
- UI components in `/client/src/components/ui` (shadcn/ui)
- Feature components in `/client/src/components` (app-sidebar, status-badge, priority-badge, user-avatar)
- Page components in `/client/src/pages`

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL with WebSocket connection pooling
- **connect-pg-simple**: Session store implementation for PostgreSQL

### Authentication
- **Replit Auth**: OIDC provider for user authentication
- **openid-client**: OpenID Connect client library
- **passport**: Authentication middleware

### UI Libraries
- **Radix UI**: Unstyled accessible component primitives (30+ components)
- **Tailwind CSS**: Utility-first CSS framework
- **class-variance-authority**: CSS variant API
- **cmdk**: Command palette component
- **lucide-react**: Icon library
- **react-day-picker**: Date picker component
- **date-fns**: Date utility library

### Development Tools
- **Vite**: Build tool and dev server with HMR
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Development tooling
- **tsx**: TypeScript execution for development

### Build & Deployment
- **esbuild**: Server-side bundler for production
- **vite build**: Client-side production build
- Output: `/dist/public` (client), `/dist` (server)