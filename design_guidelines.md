# Helpdesk & CMDB System Design Guidelines

## Design Approach: Productivity-Focused Design System

**Selected Approach**: Hybrid system drawing from Linear (ticket workflows), Notion (knowledge base), and Carbon Design (enterprise data management)

**Rationale**: This is a utility-focused, information-dense application where efficiency, clarity, and professional appearance are paramount. The design must support rapid ticket resolution, clear data visualization, and seamless navigation between tickets, CIs, and knowledge resources.

**Key Design Principles**:
- Information clarity over decoration
- Efficient workflows with minimal clicks
- Professional, trustworthy aesthetic for enterprise use
- Dense data presentation without overwhelming users
- Consistent patterns for quick learning

---

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary)**:
- Background Base: 220 15% 8%
- Surface: 220 15% 12%
- Surface Elevated: 220 15% 16%
- Border: 220 15% 24%
- Text Primary: 220 10% 95%
- Text Secondary: 220 10% 65%
- Text Muted: 220 10% 45%

**Light Mode**:
- Background Base: 220 15% 98%
- Surface: 0 0% 100%
- Border: 220 15% 88%
- Text Primary: 220 15% 15%
- Text Secondary: 220 10% 40%

**Status Colors**:
- Primary/Brand: 217 91% 60% (Professional blue)
- Success/Resolved: 142 76% 36%
- Warning/In Progress: 38 92% 50%
- Error/Critical: 0 84% 60%
- Info/Open: 199 89% 48%

**Priority Indicators**:
- Critical: 0 84% 60%
- High: 25 95% 53%
- Medium: 45 93% 47%
- Low: 220 15% 55%

### B. Typography

**Font Stack**: 
- Primary: 'Inter', system-ui, sans-serif (via Google Fonts CDN)
- Monospace: 'JetBrains Mono', monospace (for ticket IDs, CI references)

**Scale**:
- Page Titles: text-3xl (30px) font-semibold
- Section Headers: text-xl (20px) font-semibold
- Card Headers: text-lg (18px) font-medium
- Body Text: text-base (16px) font-normal
- Table Data: text-sm (14px) font-normal
- Labels/Metadata: text-xs (12px) font-medium uppercase tracking-wide
- Ticket IDs: text-sm font-mono

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 2, 4, 6, 8, and 12
- Micro spacing: p-2, gap-2
- Component internal: p-4, gap-4
- Section spacing: p-6, gap-6
- Major sections: p-8, py-12
- Page padding: p-8 to px-12

**Grid Structure**:
- Sidebar Navigation: 256px fixed width (w-64)
- Main Content: flex-1 with max-w-7xl container
- Two-column views: 60/40 split for ticket detail/activity
- Dashboard cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4

### D. Component Library

**Navigation**:
- Sidebar: Fixed left navigation with icon+label items, collapsible sections for Tickets, Changes, CMDB, Knowledge Base
- Top bar: Breadcrumb trail, global search, user profile, notifications
- Tabs: Underline style for sub-navigation within sections

**Core UI Elements**:
- Buttons: Primary (filled), Secondary (outline), Ghost (text-only) - rounded-md with consistent padding
- Input Fields: Bordered, rounded-md, focus ring in primary color, dark mode compatible
- Dropdowns: Menu style with icons, keyboard navigation
- Search: Prominent search bar with cmd+K shortcut indicator

**Data Display**:
- Tables: Striped rows, sortable headers, row hover state, compact spacing, sticky header for long lists
- Cards: Bordered, rounded-lg, shadow-sm, with header/body/footer sections
- Status Badges: Rounded-full pills with dot indicator, semantic colors
- Priority Tags: Small rounded badges with color coding
- Metrics Cards: Large number display with trend indicators and sparklines

**Ticket/Change Components**:
- Ticket List: Compact rows with ID, title, status, priority, assignee, timestamp
- Ticket Detail: Two-column layout - main info left, activity timeline right
- Comment Thread: Avatar + message with timestamp, threaded replies
- Status Workflow: Visual stepper showing ticket progression
- Assignment Selector: Avatar dropdown with search

**CMDB Components**:
- CI Cards: Icon, name, type, status, relationship count
- Relationship Graph: Visual node diagram showing CI dependencies
- CI Detail View: Tabs for properties, relationships, ticket history, change log
- Asset Table: Filterable columns for hardware, software, network devices

**Knowledge Base**:
- Article Cards: Title, category tag, excerpt, last updated, view count
- SOP Document: Clean reading view with table of contents, search within
- Category Browser: Hierarchical tree navigation
- Search Results: Relevance-based with highlighted matches

**Dashboard Elements**:
- Stat Cards: Large metric number, label, trend arrow, mini chart
- Ticket Distribution: Donut chart by status/priority
- Activity Feed: Recent tickets/changes with mini previews
- Quick Actions: Prominent "New Ticket" and "New Change" buttons

### E. Interactions & Micro-animations

**Minimal Animation Philosophy**: Use sparingly, only for functional feedback
- Button states: Simple color transition (150ms)
- Modal/drawer entry: Slide-in from right (200ms ease-out)
- Loading states: Skeleton screens, no spinners
- Toast notifications: Slide down from top-right
- Dropdown menus: Fade in (100ms)
- NO decorative animations, parallax, or scroll effects

---

## Specific Page Layouts

**Dashboard**: 
- 4-column metric cards at top (Open, In Progress, Critical, Today's Changes)
- 2-column below: Ticket distribution chart left, Recent activity feed right
- Bottom: Quick access cards to Knowledge Base and CMDB

**Ticket List**:
- Filters sidebar (collapsible): Status, Priority, Assignee, Date range
- Main area: Table with columns: ID, Title, Status, Priority, Assignee, Created, Updated
- Bulk actions toolbar when rows selected

**Ticket Detail**:
- 60% left: Ticket header (ID, title, status, priority), Description, Custom fields, Linked CIs
- 40% right: Activity timeline, Comments, Assignee history, Related tickets

**CMDB Explorer**:
- Tree navigation left (25%): CI categories and filters
- Grid view center (75%): CI cards with search and view toggle (grid/list)
- Top: Global CI search with advanced filters

**Knowledge Base**:
- Category sidebar left (20%)
- Article grid/list center (80%)
- Featured/pinned articles at top
- Search prominence with recent articles below

**Email Inbox** (for ticket creation):
- Email list view with unread indicator, subject, sender, preview
- Click to convert to ticket with pre-filled fields

---

## Accessibility & Responsive Considerations

- All interactive elements have visible focus states (ring-2 ring-primary)
- Consistent dark mode throughout, including all inputs and modals
- Tables responsive: Stack columns on mobile, horizontal scroll on tablet
- Sidebar collapses to icons-only on mobile with drawer overlay
- Minimum touch targets: 44x44px for all clickable elements
- Semantic HTML with proper ARIA labels for screen readers
- Keyboard navigation: Tab order, shortcuts (cmd+K search, cmd+N new ticket)

---

## Icons

**Icon Library**: Heroicons (outline for navigation, solid for status indicators)
Use CDN: https://cdn.jsdelivr.net/npm/heroicons/

**Icon Usage**:
- Navigation items: 20x20 outline icons
- Status indicators: 16x16 solid icons with semantic colors
- Action buttons: 20x20 outline icons
- Table actions: 16x16 outline icons
- Priority indicators: Custom filled circles with exclamation marks

---

## Images

**No Hero Images**: This is a utility application - lead directly with dashboard/functionality

**Supportive Images**:
- Empty state illustrations: Simple line art for empty ticket lists, knowledge base
- Avatar placeholders: Generated initials on colored backgrounds
- CI type icons: Server, laptop, router, database icons (from Heroicons or Font Awesome)
- Knowledge base articles: Optional header images (16:9 ratio, max 800x450px)