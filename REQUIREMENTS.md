# ProdLink - Requirements Document

**Project:** ProdLink - Factory Production Data Collection App
**Client:** Pastries Factory
**Date:** 2026-01-24
**Status:** In Development
**Last Updated:** 2026-01-25

---

## Development Progress

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1 - Foundation | ✅ Complete | 100% |
| Phase 2 - Core Data Entry | ✅ Complete | 100% |
| Phase 3 - Waste Workflow | 🔄 In Progress | 30% |
| Phase 4 - Dashboard & Polish | 🔄 Partial | 60% |

**Recent Updates (2026-01-25):**
- Added `line_id` to products table (products now belong to specific lines)
- Redesigned Production Entry page with:
  - Line Type filter (Finished / Semi-Finished)
  - Production Line dropdown
  - Products table showing only products for selected line
  - Inline quantity input with unit of measure dropdown
  - Batch save functionality for multiple products
- Updated Admin Products page with line assignment and filtering

---

## 1. Project Overview

A Progressive Web App (PWA) for collecting and managing production data in a pastries factory operating 24/7 with approximately 20 production lines (finished and semi-finished goods).

### Goals
- Replace paper-based data collection
- Enable real-time production tracking
- Implement waste management with approval workflows
- Meet ISO compliance requirements for waste documentation

---

## 2. User Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access. Configure system settings, approval workflows, manage users, assign lines, manage reason lists |
| **Production Engineer** | Enter production, waste, damage, reprocessing data for assigned lines only |
| **Approver** | Approve/reject waste submissions (configurable per approval level) |
| **Viewer/Manager** | View-only access to dashboards and reports |

---

## 3. Core Features

### 3.1 Authentication
- Username and password (managed by admin)
- Sign in with Google (only for pre-approved users)
- Admin must create/approve user accounts before access is granted
- No self-registration

### 3.2 Data Entry Forms

All forms share these common fields:
- **Line** - Selected from user's assigned lines
- **Product** - From product list (manual entry, file upload, or DB sync)
- **Quantity**
- **Unit of Measure** - Comes with product
- **Batch/Lot Number** - For traceability
- **Reason** - From admin-configured list
- **Notes** - Optional free text
- **Date/Time** - Auto-captured
- **User** - Auto-captured

#### 3.2.1 Production Form
Records completed production output.
- All common fields (reason field optional/not required)

#### 3.2.2 Waste Form
Records unfixable damaged goods requiring disposal.
- All common fields
- **Approval workflow** (configurable by admin)
- **App Approved** checkbox - Marked when digital approval complete
- **Form Approved** checkbox - Marked when physical signed document complete

#### 3.2.3 Damage Form
Records damaged goods (before classification as waste or reprocessing).
- All common fields
- No approval workflow

#### 3.2.4 Reprocessing Form
Records items sent for reprocessing.
- All common fields
- No approval workflow

### 3.3 Waste Approval Workflow

- Admin configures approval levels in settings
- Approval can be **sequential** (one after another) or **parallel** (all at once)
- Approvers are notified of pending items
- Each level approves/rejects with optional comments

### 3.4 Waste PDF Form Generator (ISO Compliance)

- User selects filters: Line, Date range, Categories
- Generates downloadable PDF waste report
- PDF is printed and physically signed
- Tracks both app approval and physical form approval status
- Person responsible for "Form Approved" is configurable per line

### 3.5 Dashboard (MVP - Basic)

- Today's production totals
- Pending waste approvals count
- Recent entries (production, waste, damage, reprocessing)

*Advanced dashboards (trends, charts, comparisons) - future enhancement*

---

## 4. Admin Panel Settings

### 4.1 User Management
- Create/edit/deactivate users
- Assign roles
- Assign lines to production engineers
- Approve users for Google sign-in

### 4.2 Line Management
- Add/edit production lines
- Mark as finished goods or semi-finished
- Assign "Form Approved" responsible person per line

### 4.3 Product Management
Admin can populate products using one of these methods:
- **Manual Entry** - Add/edit products one by one
- **File Upload** - Import products from CSV or Excel file
- **Database Connect** - Connect to external database:
  - Single table connection (select table, map columns)
  - Custom SQL query (for complex joins/filters)
  - Sync on-demand or scheduled

Product fields: Name, Code/SKU, Category, Unit of Measure

### 4.4 Reason Lists
- Configure waste reasons
- Configure damage reasons
- Configure reprocessing reasons

### 4.5 Approval Workflow Configuration
- Define approval levels for waste
- Set approvers for each level
- Configure as sequential or parallel

### 4.6 System Settings
- Default language (Arabic/English)

---

## 5. Technical Requirements

### 5.1 Application Type
- Progressive Web App (PWA)
- Installable on phones and tablets
- Responsive design for all screen sizes

### 5.2 Language Support
- Bilingual: Arabic and English
- User can switch language
- Admin sets default language

### 5.3 Integration
- **Product Data:** Multiple options - manual entry, file upload (CSV/Excel), or external database connection
- **F&O Integration:** Can connect to Microsoft 365 F&O as external database source
- **Push:** Export/sync to F&O - future enhancement

### 5.4 Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14+ (React) with TypeScript |
| **Backend** | Next.js API Routes (serverless) |
| **Database** | PostgreSQL (via Supabase) |
| **Authentication** | Supabase Auth (Google + email/password) |
| **Hosting** | Vercel |
| **Database Hosting** | Supabase |

### 5.5 Infrastructure
- No offline capability (requires internet connection)
- Vercel for frontend and API hosting
- Supabase for database and authentication

### 5.6 Browser Support
- Modern browsers (Chrome, Safari, Firefox, Edge)
- Mobile browsers on iOS and Android

---

## 6. Out of Scope (Future Enhancements)

- Offline mode with sync
- Direct push to F&O ERP
- Semi-finished to finished goods tracking/linking
- Linking production to waste/damage/reprocessing
- Advanced dashboards and analytics
- Shift/schedule tracking
- Production order tracking

---

## 7. MVP Priorities

For the fastest path to a working app:

### Phase 1 - Foundation ✅ COMPLETE
- [x] User authentication (username/password + Google via Supabase)
- [x] Admin panel - Users management
- [x] Admin panel - Lines management (with type: finished/semi-finished)
- [x] Admin panel - Reasons management (waste, damage, reprocessing)
- [x] Product management - Manual entry
- [x] Product management - CSV file upload
- [x] Basic role-based access (admin, engineer, approver, viewer)
- [x] Database schema with RLS policies

### Phase 2 - Core Data Entry ✅ COMPLETE
- [x] Production form with line/product selection
- [x] Damage form with reason selection
- [x] Reprocessing form with reason selection
- [x] Waste form (with basic approval status)
- [x] Line-based access control via user_line_assignments
- [x] **NEW: Products linked to production lines (line_id)**
- [x] **NEW: Production entry with line type filter**
- [x] **NEW: Inline quantity entry with unit of measure dropdown**

### Phase 3 - Waste Workflow 🔄 IN PROGRESS
- [x] Basic approval status tracking (pending/approved/rejected)
- [x] Approvals page for viewing waste entries
- [ ] Multi-level approval workflow configuration
- [ ] Sequential/parallel approval support
- [ ] PDF generator for ISO compliance
- [ ] Form approval tracking per line

### Phase 4 - Dashboard & Polish 🔄 PARTIAL
- [x] Basic dashboard with stats (today's production, pending approvals, waste, reprocessing)
- [x] Bilingual support (Arabic/English) with language switcher
- [x] Observability dashboard (Vercel deployments, error logs)
- [ ] PWA installation manifest
- [ ] Push notifications for approvers

---

## 8. Open Questions

1. ~~**F&O Integration:** API or direct database connection for product master?~~ → **Decided: Flexible - manual, upload, or DB connect**
2. ~~**Hosting:** Cloud provider or on-premise?~~ → **Decided: Vercel + Supabase**
3. **Branding:** Logo and colors when available?

---

## Approval

- [ ] Requirements approved by stakeholder
- [ ] Ready to begin development

---

*Document created from requirements interview on 2026-01-24*
