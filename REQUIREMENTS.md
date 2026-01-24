# ProdLink - Requirements Document

**Project:** ProdLink - Factory Production Data Collection App
**Client:** Pastries Factory
**Date:** 2026-01-24
**Status:** Pending Approval

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
- **Product** - From F&O product master (pulled via API/DB)
- **Quantity**
- **Unit of Measure** - Comes with product from F&O
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

### 4.3 Reason Lists
- Configure waste reasons
- Configure damage reasons
- Configure reprocessing reasons

### 4.4 Approval Workflow Configuration
- Define approval levels for waste
- Set approvers for each level
- Configure as sequential or parallel

### 4.5 System Settings
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
- **Pull:** Product master data from Microsoft 365 Finance & Operations (API or DB - TBD)
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

1. **Phase 1 - Foundation**
   - User authentication (username/password + Google)
   - Admin panel (users, lines, reasons)
   - Basic role-based access

2. **Phase 2 - Core Data Entry**
   - Production form
   - Damage form
   - Reprocessing form
   - Waste form (without approval workflow)

3. **Phase 3 - Waste Workflow**
   - Approval workflow configuration
   - Waste approval process
   - PDF generator for ISO compliance

4. **Phase 4 - Dashboard & Polish**
   - Basic dashboard
   - Bilingual support
   - PWA installation

---

## 8. Open Questions

1. **F&O Integration:** API or direct database connection for product master?
2. ~~**Hosting:** Cloud provider or on-premise?~~ → **Decided: Vercel + Supabase**
3. **Branding:** Logo and colors when available?

---

## Approval

- [ ] Requirements approved by stakeholder
- [ ] Ready to begin development

---

*Document created from requirements interview on 2026-01-24*
