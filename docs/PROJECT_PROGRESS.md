# AlertZone Admin Dashboard — Project Progress & Milestone Log

This document tracks the end-to-end development journey of the AlertZone admin dashboard, documenting every step, feature, and architectural decision made since the project's inception.

---

## ✅ Feature: Upvote Sorting and Viewing
**Date:** 2026-06-17
**Branch:** `main`

**Objective:** Add sorting and viewing functionality by upvote count to both the Dashboard Overview and Reports Management pages to help admins prioritize highly-reported public incidents.

**What was built / fixed:**
- **Dashboard API Route (`app/api/dashboard/route.ts`):** Modified report aggregation logic to collect all pending reports and return two separate sliced lists (`recentPending` sorted by date desc and `mostUpvotedPending` sorted by upvotes desc).
- **Dashboard Overview UI (`app/components/Dashboard.tsx`):** Added a segmented sorting toggle button (Newest vs Upvotes) to the "Reports Needing Action" card. Wired it to switch lists dynamically.
- **Reports Management Filters (`app/components/Reportsmanagement.tsx`):** Added a "Sort By" select dropdown (Newest First, Oldest First, Most Upvoted) inside the premium filter grid layout.
- **Reports Management Sorting:** Integrated client-side sorting logic to rearrange reports dynamically, sorting by `upvoteCount` descending with a fallback to `createdAt` descending.
- **Upvotes display badges:** Displayed the upvote count on all report list cards (orange pill badge for upvotes > 0, muted gray badge for 0) and added a dedicated "Community Upvotes" card inside the report detail modal overview grid.
- **PDF Export & Compile fixes:** Resolved a type-checking error in the PDF auto-table column mapping regarding the `address` lookup.

---

## ✅ Fix: MapView Mobile Overlap Bug
**Date:** 2026-06-09
**Branch:** `main`

**What was fixed:**
- Resolved a layout issue in `Mapview.tsx` where the Google Map container overlapped the reports list sidebar on mobile viewports.
- Added `relative` positioning to the sidebar so its `z-[1000]` index properly creates a stacking context over the map's `z-10`.
- Added a `gap-4 md:gap-0` to the root flex container to provide visual breathing room between the sidebar and the map on mobile.

---

## ✅ Fix: Admin Login Invalid Credentials Message
**Date:** 2026-06-09
**Branch:** `main`

**What was fixed:**
- Resolved an issue in `lib/context/AuthContext.tsx` where failed login attempts with invalid credentials displayed a generic `Server error (401). Please try again.` message.
- Updated the `login` function to parse the error JSON payload instead of blindly checking `res.ok`, ensuring that accurate server messages like "Invalid credentials" are shown clearly in the UI.

---

## ✅ Fix: Vercel Build — Notifications.tsx TypeScript Error
**Date:** 2026-06-06
**Branch:** `Improve/admin-dashboard`

**What was fixed:**
- Resolved a Vercel production build failure caused by a TypeScript type error in `app/components/Notifications.tsx` (line 448).
- The fallback `typeMeta.System` did not exist on `Record<NotificationType, ...>` since `"System"` is not part of the `NotificationType` union (`"Report" | "Alert" | "Upvote" | "Comment"`).
- Changed the fallback to `typeMeta.Alert`, which is both a valid key and the correct semantic default (matching the existing `mapDbType()` helper that also defaults unknown types to `"Alert"`).

---

## ✅ Phase 18: Gamification Integration & Top Contributors Leaderboard
**Date:** 2026-06-04
**Branch:** `feat/gamification`

**Objective:** Wire full gamification synchronization into the admin dashboard backend and frontend, displaying user points and earned badges beautifully, and adding a leaderboard widget to the landing page.

**What was built / fixed:**
- **Shared Badge Metadata (`lib/constants/badges.ts`):** Defined the full list of badge definition schemas, including tier styling classes (colors, borders), and descriptive emoji-based icons to map raw IDs (e.g. `first_report`) to user-friendly titles and tooltips.
- **Backend Status-Change Gamification (`app/api/reports/[id]/route.ts`):** Migrated backend points awarding to match the mobile app's model:
  - Updates to `ASSIGNED` (accepted) award +10 points to `contributionPoints` and increment `reportsAccepted` by 1.
  - Updates to `RESOLVED` increment `reportsResolved` and `reportsValidated` by 1.
  - Recalculates citizen level and earned badges synchronously using Firestore timestamp histories.
- **Top Contributors Leaderboard API (`app/api/dashboard/route.ts`):** Aggregates registered citizens to dynamically compute, sort in-memory, and return the top 5 contributors with their levels, resolved counts, and points.
- **Dashboard Widget Integration (`app/components/Dashboard.tsx`):** Restructured the dashboard overview bottom row into a 3-way layout (Report Categories, Top Contributors Leaderboard, and Recent Activity Feed). Created a custom scrollable `LeaderboardWidget` showing rank badges (🥇, 🥈, 🥉), citizen initials/avatars, level chips, and points.
- **Citizen Detail View Upgrades (`Users.tsx` and `UserDetailsModal.tsx`):** Integrated `BADGE_DEFINITIONS` to show badge counts in the user table, and render premium, styled badge chips with titles, descriptions, and custom tier colors in the citizen profile popups.

## ✅ Phase 16: Image Component Performance Optimization & Robust Fetch Error Handling
**Date:** 2026-06-04
**Branch:** `main`

**Objective:** Add `sizes` attributes to responsive `Image` components using `fill` to resolve Next.js rendering warnings and improve page performance. Enhance `AuthContext` API fetching to gracefully handle non-JSON server error responses (like 404s and 500s).

**What was built / fixed:**
- **Image Performance Opts:** Added `sizes` attribute to the `Image` component referencing `logo1` in `Adminlogin.tsx` and `ForcePasswordChange.tsx` to optimize layout shifts and prevent console warnings.
- **Robust Auth API Fetching (`AuthContext.tsx`):** Added content-type checks (`contentType.includes("application/json")`) and `.ok` checks prior to parsing JSON responses in `restoreSession`, `checkStatus` (heartbeat), and `login` methods to prevent `SyntaxError` crashes during network or server routing errors (such as 404s).

---

## ✅ Phase 15: Forced Password Change on First Login
**Date:** 2026-06-01
**Branch:** `feat-update/auth-admin`

**Objective:** Require newly created admins and the superadmin to change their password on initial login for security.

**What was built / fixed:**
- **Types Update (`auth.ts`):** Added optional `requirePasswordChange?: boolean` field to `AdminUser` and `AdminSession` interfaces.
- **Service Updates (`auth.service.ts`):** Added `requirePasswordChange: true` to the payload inside `createAdminUser` when registering a new admin. Merged `requirePasswordChange` from Firestore document data into the returned user session in `validateFirestoreAdmin`. Updated `validateSuperadmin` to query Firestore for a `superadmin` document.
- **Session API Update (`session/route.ts`):** Integrated retrieval and mapping of the `requirePasswordChange` field from Firestore for both admins and superadmins.
- **Profile API Update (`profile/route.ts`):** Allowed password changes for superadmins (saved to Firestore `superadmin` document). Cleared the `requirePasswordChange` flag upon a successful password change.
- **Deactivation/Deletion Protection:** Added checks in the `PATCH` and `DELETE` endpoints for `/api/admin-users/[id]` to reject attempts to deactivate, delete, or change the role of the default `superadmin` account.
- **UI Screen Gate (`page.tsx`):** Added checking for `user?.requirePasswordChange` to render the forced password update view instead of the main dashboard.
- **Forced Password Change Component (`ForcePasswordChange.tsx`):** Premium glassmorphic credentials reset view featuring temporary password confirmation, strength meter validation, mismatch warnings, error/success banners, and a fallback "Cancel & Logout" option.

---

## ✅ Phase 17: Firestore Permission Fix — Full Admin SDK Migration
**Date:** 2026-06-04
**Branch:** `main`

**Objective:** Eliminate `FirebaseError: Missing or insufficient permissions` and `FIRESTORE INTERNAL ASSERTION FAILED: Unexpected state` crashes that appeared for all non-superadmin admin accounts. Root cause: the dashboard uses cookie-based JWT auth (not Firebase Auth), so `request.auth` is always `null` in Firestore Security Rules, blocking every direct client-side Firestore read/write.

**What was built:**

- **`app/api/notifications/recent/route.ts`** (new) — Serves unread badge count (`recipientUid == "admin"` filter) and recent notifications. Added `?full=true` mode that returns all 100 most recent notifications across all recipients for the Notifications page.
- **`app/api/notifications/[id]/route.ts`** (new) — `PATCH` to mark a single notification as read; `DELETE` to remove it. Both use Admin SDK.
- **`app/api/notifications/mark-all-read/route.ts`** (new) — `POST` endpoint to batch-mark selected or all unread notifications as read in a single Admin SDK batch write.
- **`app/api/reports/[id]/comments/route.ts`** (new) — `GET` returns all comments on a report with commenter profiles, batch-fetched from `users` collection via Admin SDK.
- **`app/api/reports/[id]/upvotes/route.ts`** (new) — `GET` returns all upvoters with user profiles via Admin SDK.
- **`app/api/reports/route.ts`** (modified) — Added `?since=<ISO>` query param for efficient new-report polling (returns only reports newer than the timestamp, limited to 20 docs).

**Components fixed (all direct Firestore client SDK calls removed):**

- **`Maindashboard.tsx`** — Removed two `onSnapshot` subscriptions (`notifications`, `reports`). Replaced with two dedicated polling loops: (1) badge count via `/api/notifications/recent` every 5s; (2) new report toast detector via `/api/reports?since=mountTime` every 5s with a 5s initial delay. Also fixed `sizes` prop on logo `Image`.
- **`Dashboard.tsx`** — Removed `onSnapshot` for unread count + dead `db`/`firebase/firestore` imports. Replaced with polling `/api/notifications/recent` every 5s.
- **`Notifications.tsx`** — Removed `onSnapshot`, `updateDoc`, `writeBatch`, `deleteDoc` + all firebase imports. Replaced with: polling `/api/notifications/recent?full=true` every 5s for the list; PATCH/DELETE to `/api/notifications/[id]` for individual actions; POST to `/api/notifications/mark-all-read` for bulk read. Added **optimistic UI updates** for mark-read and delete so the UI feels instant.
- **`Reportsmanagement.tsx`** — Removed `collection`, `getDocs`, `getDoc`, `orderBy`, `query` imports + `db` import. Replaced `fetchComments` and `fetchUpvoters` with simple `fetch()` calls to the new Admin SDK routes.
- **`Adminlogin.tsx`** — Added missing `sizes` prop to fill-mode `Image` component.

**Architecture principle established:** The admin dashboard MUST NOT use the Firebase client SDK for any Firestore reads or writes. All Firestore operations go through `/api/*` server routes that use `firebase-admin`, which bypasses security rules entirely.

---

## ✅ Phase 13: Real-time New Issue Notifications & Dashboard Badge

**Date:** 2026-05-28
**Branch:** `fix-feat/dashboard`

**Objective:** Support real-time toast notifications for admins when new reports are submitted, click-to-view redirection from alerts/notification cards to Reports Management details modals, and unread badges on the sidebar and dashboard overview header.

**What was built:**
- **Real-time Report Listener:** Subscribed the main dashboard to the `reports` Firestore collection in real-time, showing a premium floating toast notification for new incident submissions.
- **Click-to-View Navigation:** Enabled clicking on the toast notification or any report notification card on the Notifications page to automatically navigate and open that report's details modal inside Reports Management.
- **Unread Notification Badge:** Subscribed both `Maindashboard.tsx` and `Dashboard.tsx` to unread notification count, rendering a glassmorphic bell button in the dashboard page header and a red dot on the sidebar "Notifications" tab when unread items exist.
- **Deterministic Notification Writing:** Handled document writing for new issues using a deterministic `new_report_{reportId}` key format to guarantee no duplicate notifications are logged in multi-admin client environments.
- **Status Change Feedback Modal:** Replaced the inline success banner with a premium glassmorphic modal overlay that displays status change transitions, notifications sent to citizens, reward point summaries, and includes manual close options.

---

## ✅ Phase 12: Report Archival & Soft-Delete Support
**Date:** 2026-05-28
**Branch:** `fix-feat/dashboard`

**Objective:** Implement soft-deletion (archival) of reports that are RESOLVED or REJECTED, with a toggleable Archive page, comprehensive filters (Location, Time, Admin who changed the status), and recovery support.

**What was built:**
- **Backend API Updates:** Enhanced `/api/reports` to support filtering by `archived=true/false` query parameter, and `/api/reports/[id]` PATCH endpoint to handle `isArchived` toggle, writing audit logs for archive/unarchive operations.
- **Client Services & Hooks:** Added `archiveReport` utility in `lib/services/report.service.ts` and `lib/hooks/useReports.ts` to execute PATCH requests and trigger local state refreshes.
- **UI & Navigation:** Integrated a "Go to Archive" button in Reports Management. Restructured filters list to dynamically show an "Admin" filter when viewing the archive (sourced from statusHistory data).
- **Archive Action Controls:** Added Archive/Restore buttons in incident card rows and the detail modal footer for reports in `RESOLVED` or `REJECTED` state.
- **Archive Confirmation Modal:** Implemented a glassmorphic modal overlay to confirm archival or recovery action.

---

## ✅ Phase 11: Dashboard Bugfixes & Scoped Header Upgrades
**Date:** 2026-05-28
**Branch:** `fix-feat/dashboard`

**Objective:** Fix "Invalid Date" bug in Reports Needing Action / Recent Activity feed, display the admin's name and geographic view scope badge, and add a prominent colored status badge inside the report details modal.

**What was built:**
- **Date Serialization Normalization:** Updated `app/api/dashboard/route.ts` to convert Firestore Timestamp fields (`createdAt` and `changedAt`) using `.toDate().toISOString()` to prevent client-side "Invalid Date" errors.
- **Admin Greeting & Geoscope view badge:** Modified `app/components/Dashboard.tsx` to read user context from `useAuth()` and display the logged-in admin's `displayName` in the page greeting (e.g. `Good morning, Thamaruj 👋`).
- **Geographic View Scope Badge:** Added a visual badge indicator below the date & time showing which regional scope the admin is looking at (`All Island View`, `Province: [Name] View`, `District: [Name] View`, or `LGA: [Name] View`) with a location icon and themed background color.
- **Report Details Modal Status Badge:** Added a prominent, color-themed status badge box directly under the main heading (e.g., `{selectedReport.category} Incident`) inside the report details modal in `Reportsmanagement.tsx` showing the current status matching the dashboard's design guidelines.

---

## ✅ Phase 10: Admin Scopes, Profiling, and Audit Logs
**Date:** 2026-05-27
**Branch:** `feat/admin-scoping-logging`

**Objective:** Implement admin regional scoping (Province, District, LGA) with scope-based filters, profile picture updates via Firebase Storage, daily activity logs, and login/logout audit history.

**What was built:**
- **Admin Scoping & Cascading UI:** Added Province, District, LGA selectors with cascaded filtering to the Admin creation/update form. Added visibility scope options (`all`, `province`, `district`, `lga`).
- **Filter Dropdown Locking:** Enforced admin visibility scopes on the frontend filtering select dropdowns inside both Reports Management and Map View (locking the dropdown options to the admin's assigned province, district, and LGA scope automatically).
- **Spacious Admin addition/edition modal:** Replaced the narrow single-column modal with a grid-based 2-column modal for admin creations and edits.
- **Dynamic Scoping Updates:** Enabled superadmins to dynamically modify the visibility scope, assigned province, district, or LGA for any admin user.
- **Location Auditing Removal:** Removed IP-based simulated login locations from login/logout audit history (writing, activity logging, and frontend listings) for enhanced privacy.
- **Profile Picture Upload:** Integrated Firebase Storage uploading (`admin-avatars/{userId}`) inside the Settings page. Implemented profile PATCH handler and live auth session merges (including `superadmin` profile updates merged into Firestore document `adminUsers/superadmin`).
- **Audit Logs & History:** Created backend activity logging and login auditing services tracking user-agents and admin actions.
- **Frontend Logs UI:** Rendered Activity Logs and Login History tables in Settings (for the current admin) and via a "View Logs" modal action inside Admin User Management.
- **Scoping Filter Enforcement:** Wired scope filters into reports list, dashboard stats, and analytics charts on the backend.

---

## ✅ Phase 9: Live Dashboard Overview
**Date:** 2026-05-27
**Branch:** `feat/main-dashboard`

**Objective:** Replace the mock-data Dashboard Overview with a fully live, distinct page that does not duplicate the Analytics page.

**What was built:**
- **`app/api/dashboard/route.ts`** — new server-side aggregation endpoint (`GET /api/dashboard`) secured with the same `requireAdmin` JWT guard used across all routes. Returns in one request:
  - KPI stats: total, pending, in-progress (ASSIGNED+FIXING), resolved, rejected, totalCitizens, activeCitizens, suspendedCitizens
  - Status distribution array (5 statuses with counts + hex colors)
  - Category snapshot array (all-time report counts by categoryId)
  - Recent pending reports (up to 8, newest-first, with province/district resolved via `resolveSrilankaRegion`)
  - Recent activity feed (last 10 status changes across all reports, sourced from `statusHistory` arrays)
- **`app/components/Dashboard.tsx`** — new standalone `"use client"` component with:
  - Contextual greeting + live date/time ticker (30s tick)
  - 5-card KPI strip (Total, Pending, In Progress, Resolved, Citizens) with live data and resolution rate sub-label
  - 12-column mid section: Reports Needing Action list (scrollable, with "Open →" button that fires `changeNavTab` + `openReportDetail` events) + interactive Status Distribution SVG donut
  - 12-column bottom section: Category Snapshot horizontal bars + Recent Activity timeline feed with status transition badges
  - Quick-nav shortcut row: 5 glassmorphic cards navigating to Reports, Map, Citizens, Analytics, Notifications
  - Loading skeletons, error state with Retry button, Refresh button
- **`app/components/Maindashboard.tsx`** — wired to use `<Dashboard onNavigate={setActiveNav} />` instead of the old `DashboardOverviewContent`. Removed all mock-data imports (`MOCK_REPORTS`, `MONTHLY_DATA`, `BAR_DATA`) and dead-code functions (`BarChart`, `LineChart`, `DonutChart`, `StatCard`, `DashboardOverviewContent`).

**Verification:**
- `npx tsc --noEmit` → 0 errors
- `npm run build` → `✓ Compiled successfully`, `/api/dashboard` route confirmed in build output

---

## 🛠 Phase 0: Project Scaffolding
**Objective:** Create the Next.js project and establish the basic structure.

- **[2026-05-20] Project Initialized:**
    - Created Next.js 16 project with App Router using `create-next-app`.
    - Configured Tailwind CSS v4 for styling.
    - Added Firebase JS SDK v12 (`firebase` package).
    - Added Leaflet + react-leaflet for map functionality.

- **[2026-05-20] Firebase Configuration:**
    - Created `lib/firebase.ts` — initializes Firebase App, Auth, and Firestore.
    - Created `.env.local` with Firebase project credentials for `alertzone-3d2a3`.
    - Created `test-connection/page.tsx` to verify Firebase connectivity.

---

## 🎨 Phase 1: UI Shell & Mock Dashboard
**Objective:** Build the entire admin dashboard UI with placeholder/mock data to establish the visual foundation.

- **[2026-05-20] Admin Login Page:**
    - Built `Adminlogin.tsx` — dark theme login form matching the mobile app's design system.
    - Features: email, password, username fields, show/hide password, keep-me-logged-in checkbox.
    - Currently uses `setTimeout()` simulation (not wired to Firebase Auth).

- **[2026-05-20] Main Dashboard Shell:**
    - Built `Maindashboard.tsx` — sidebar navigation + topbar + main content area.
    - 7 navigation items: Dashboard, Reports, Map, Users, Analytics, Notifications, Settings.
    - Mobile responsive with hamburger menu and sidebar overlay.
    - Background glow effects matching the mobile app's aesthetic.

- **[2026-05-20] Dashboard Overview:**
    - 5 stat cards (Total Reports, Reported, In Progress, Solved, Closed) — all hardcoded.
    - Custom SVG donut chart for status distribution.
    - Custom SVG bar chart for category breakdown.
    - Custom SVG line chart for monthly trend.
    - Recent reports table with mock data.

- **[2026-05-20] Reports Management:**
    - Built `Reportsmanagement.tsx` — full reports table with search, filters, detail view.
    - Note: Uses incorrect types that don't match the mobile app's Firestore schema.

- **[2026-05-20] Map View:**
    - Built `Mapview.tsx` — Leaflet map with SSR-safe dynamic import.
    - Map renders but has no real report pin data.

- **[2026-05-20] Users Management:**
    - Built `Users.tsx` — user list with search and status filter.
    - Uses mock data types.

- **[2026-05-20] Analytics:**
    - Built `Analytics.tsx` — multiple chart types and data visualizations.
    - All charts use hardcoded or empty data arrays.

- **[2026-05-20] Notifications:**
    - Built `Notifications.tsx` — notification list with read/unread states.
    - Uses `MOCK_NOTIFICATIONS` with 5 hardcoded items.

---

## 📚 Phase 2: Documentation & Planning
**Objective:** Create comprehensive documentation to guide Firebase integration and align with the mobile app.

- **[2026-05-20] Documentation Suite Created:**
    - `docs/MOBILE_APP_INTEGRATION_GUIDE.md`: Detailed guide for how the dashboard interacts with the mobile app's Firebase data.
    - `docs/CURRENT_STATUS.md`: Full tracking of what's built, mock data areas, and missing features.
    - `docs/ARCHITECTURE.md`: Target architecture with layered pattern (Components → Hooks → Services).
    - `docs/IMPLEMENTATION_PLAN.md`: 10-phase roadmap for Firebase integration.
    - `docs/PROJECT_PROGRESS.md`: This file — milestone tracking.
    - `docs/FIRESTORE_DATA_MODEL.md`: Shared Firestore schema documentation.
    - `docs/GUIDELINES.md`: Project-specific coding conventions and design system.
    - `AGENTS.md`: Updated with mandatory reading list and agent rules.

---

### Phase 4: Admin Authentication — Hardcoded Credentials System
- **Status:** ✅ Completed — 2026-05-21

**What was implemented:**
- Replaced fake `setTimeout` login with a real, secure authentication system.
- **Superadmin** credentials stored server-side in `.env.local` (`SUPERADMIN_USERNAME`, `SUPERADMIN_PASSWORD_HASH`).
- **Additional admins** stored in Firestore `adminUsers` collection with `bcryptjs` password hashing.
- **JWT session cookies** (`jose`) — HttpOnly, SameSite=Lax. 8-hour default, 30-day "keep me logged in".
- **`lib/services/auth.service.ts`** — server-side only service: credential validation, JWT creation/verification, admin CRUD.
- **API routes**:
  - `POST /api/auth/login` — validates credentials, sets cookie
  - `POST /api/auth/logout` — clears cookie
  - `GET /api/auth/session` — restores session on page load
  - `GET/POST /api/admin-users` — list / create admin users (superadmin only)
  - `PATCH/DELETE /api/admin-users/[id]` — update / delete (superadmin only)
- **`lib/context/AuthContext.tsx`** — React context provider exposing `user`, `isSuperAdmin`, `login`, `logout`.
- **`lib/hooks/useAuth.ts`** — convenience re-export.
- **`lib/types/auth.ts`** — `AdminUser`, `AdminSession`, `AdminRole` types.
- **`lib/constants/auth.ts`** — role metadata, cookie name, session durations.
- **Updated `Adminlogin.tsx`** — removed email field and fake auth; real error messages.
- **Updated `Maindashboard.tsx`** — real user display (name + role badge) from context; logout button in sidebar; "Admin Users" tab visible only to superadmin.
- **New `AdminUserManagement.tsx`** — table of Firestore admin accounts; create/deactivate/delete modal; superadmin-only.
- **`scripts/hash-password.mjs`** — utility to generate bcrypt hashes for `.env.local`.
- **Environment Variable Bug Fix**: Resolved a critical issue where Next.js failed to load or incorrectly expanded the `SUPERADMIN_PASSWORD_HASH` because bcrypt hashes contain `$` symbols which Next.js interprets as environment variable expansions. Fixed by escaping all `$` signs with `\$` in `.env.local` and updating `scripts/hash-password.mjs` to automatically escape hashes in its output.
- **Vercel/Production Compatibility Fix**: In production environments (like Vercel), environment variables are injected directly by the platform and do not undergo Next.js's local dotenv parser expansion, meaning they are read literally (retaining backslashes if they were escaped, or standard if unescaped). Updated `lib/services/auth.service.ts` to automatically unescape dollar signs in the password hash at runtime, ensuring the hash works correctly regardless of how it is defined in Vercel or local environments.
- **Logout Confirmation**: Added a premium-styled custom modal prompting for confirmation before logging out, replacing the immediate sign out action.
- **Removed "Keep me logged in"**: Cleaned up the login interface by removing the "keep me logged in" checkbox and defaulting all session lifetimes to the standard 8-hour duration.

- **[2026-05-21] Firebase Admin SDK Integration (Admin Bypass):**
    - Installed `firebase-admin` dependency to perform backend administrative Firestore actions.
    - Created [lib/firebase-admin.ts](file:///e:/AlertZone_New/alertzone-admin-dashboard/lib/firebase-admin.ts) to handle administrative authentication (supporting environment variables and local `service-account.json` fallback).
    - Refactored [lib/services/auth.service.ts](file:///e:/AlertZone_New/alertzone-admin-dashboard/lib/services/auth.service.ts) to utilize the Firebase Admin SDK instead of the client SDK. This resolves the `"Missing or insufficient permissions"` error when a superadmin creates, updates, or deletes other admin accounts (since server-side operations using service accounts bypass client Firestore security rules).
    - Added `service-account.json` to `.gitignore` to prevent secret key leakage.
    - Verified security boundaries: standard users/mobile app still utilize strict client-side Firestore security rules while admin portal operations are processed securely on the server-side.
    - **Added `@opentelemetry/api` package**: Fixed a login crash/network error caused by the missing open telemetry peer dependency required by `firebase-admin`'s firestore package.
    - **Enhanced User & Admin Management UIs**:
      - Styled inactive admin accounts with a brightened red row background highlight (`bg-red-500/20`) and enhanced status badge for clear visibility.
      - Styled suspended citizen user accounts with a brightened rose row background highlight (`bg-rose-500/20`) and matching text highlights to align with the admin table theme.
      - Replaced generic browser `confirm()` alerts with beautiful, theme-matching interactive custom modals for all status actions (activation, deactivation/suspension, and deletion) on both screen flows.
      - Added a double-layer safety validation checkbox for deleting accounts, requiring confirmation of irreversible action before enabling the button.

**Default superadmin credentials (change before production):**
- Username: `superadmin`
- Password: `admin1234`

- **[2026-05-21] Google Maps Migration, Collapsible Sidebar & Custom Controls:**
    - Replaced the Leaflet map completely to exclusively run Google Maps JavaScript API with custom premium dark mode themes.
    - Uninstalled `leaflet`, `@types/leaflet`, and `react-leaflet` to clean up codebase dependencies.
    - Implemented dynamic cascading Sri Lankan Province and District dropdown filters on the reports list sidebar.
    - Added a collapsible sidebar toggle mechanism (sliding left on desktop, up on mobile) allowing the map to take full width when collapsed.
    - Replaced default Google Maps zoom controls with custom premium glassmorphic zoom buttons.
    - Styled custom rounded teal scrollbars for scrollable lists inside the map sidebar.
    - Removed the "Live from Firebase" sub-text element.
    - Added automatic map centering logic to pan/re-center on filtered items and active marker selections.
    - Applied clean, professional sans-serif typography across all map overlay elements, custom HTML markers, and InfoWindows.
    - Expanded `MOCK_REPORTS` in `app/data/mockData.ts` to include realistic coordinates, provinces, and districts spanning multiple Sri Lankan regions (Western, Central, Southern, Northern, Eastern) to verify cascading filters.
    - Successfully compiled and tested Next.js production build without any linting, TS compiler, or peer-dependency regressions.

---

- **[2026-05-21] Map Boundary Highlighting, Sidebar Fix & Report Category Overhaul:**
    - **Report Categories Renamed**: Updated `ReportCategory` type and all category metadata across `mockData.ts`, `Mapview.tsx`, `Reportsmanagement.tsx`, and `Maindashboard.tsx` to use the final agreed categories: `Road & Traffic`, `Water and Drainage`, `Waste & Environment`, `Social Security`, `Bridge & Structural`, `Other`. Updated mock report entries and `INCIDENT_BY_CATEGORY` data to use new categories.
    - **Exact Province/District Polygon Highlighting**: Replaced the approximate circle overlay with a proper `google.maps.Data` layer that fetches real GeoJSON polygon boundaries from the OpenStreetMap Nominatim API. When a province or district is selected, the exact administrative boundary is drawn on the map with a teal fill/stroke. Map also auto-fits bounds to the polygon via `fitBounds()`.
    - **Sidebar Collapse Layout Fix**: Fixed the sidebar collapse so the Google Maps area (`flex-1`) correctly expands to fill the freed space when the sidebar is collapsed. Removed fixed `w-full md:w-96` from the outer container; width is now fully conditional on the `isSidebarCollapsed` state, allowing the map to take full available width on desktop.

---

- **[2026-05-21] Switch to Local geoBoundaries Land-Clipped GeoJSON for Boundary Highlighting:**
    - **Land-Clipped Boundaries**: Replaced the Nominatim API boundary highlighting with high-quality local GeoJSON files from geoBoundaries (LKA ADM1 for provinces, LKA ADM2 for districts) to avoid highlighting parts of the sea for coastal districts and provinces.
    - **Offline Local Serving**: Saved the GeoJSON files directly into the project at `public/geojson/lka-adm1.geojson` and `public/geojson/lka-adm2.geojson` to solve performance, rate limiting, and CORS issues.
    - **LFS Text Pointer Resolving**: Addressed a bug where loading files from GitHub raw fetched LFS text pointers instead of the actual JSON data, by serving and loading files locally via standard Next.js pathing (`/geojson/lka-adm1.geojson`).
    - **Name & Suffix Normalization**: Updated `matchesRegion` comparison logic to dynamically strip " Province" and " District" suffixes from geoBoundaries features to match dropdown filter names.
    - **Spelling Alias Support**: Implemented a spelling normalization mapping to reconcile spelling discrepancies between the dropdowns and geoBoundaries (e.g., translating "Moneragala" to "Monaragala").

- **[2026-05-22] Live User Management Integration:**
    - Integrated the frontend **User Management** page ([Users.tsx](file:///e:/AlertZone_New/alertzone-admin-dashboard/app/components/Users.tsx)) to pull live citizen profiles from the Firestore `users` collection.
    - Implemented Sri Lankan Province, District, and Status cascading filtering. Selecting a Province filters the District options, and the list updates dynamically with a debounced search query.
    - Replaced the mock table columns with the following:
        1. **User Identity**: Avatar/Initial, Full Name, Email, and **NIC** (National Identity Card).
        2. **Contact Details**: Phone, **Province**, **District**, **Local Government Area**, and **Address**.
        3. **Gamification Details**: Level, Points, Reports Validated.
        4. **Join Date**: Formatted date string from Firestore metadata.
        5. **Status Badge & Actions**: Active/Suspended badge and dynamic trigger buttons.
    - Developed a comprehensive **User Detail Modal** showing detailed profile records, a status-wise breakdown of their submitted reports (Pending, Assigned, Fixing, Resolved, Rejected), and a scrollable list of their complete reports history.
    - Integrated live **Suspend/Unsuspend** actions. Confirming in the modal triggers a PATCH request to the Firestore admin API, toggling user active status dynamically.
    - Verified compilation and successfully passed production builds using `npm run build` with zero compiler errors.

- **[2026-05-22] User Management UI/UX Refinement & Navigation Sidebar Overhaul:**
    - **Custom Glassmorphic Dropdowns**: Styled the Province, District, and Status filters on the User Management page to override default native selectors, adding a custom right-aligned SVG chevron, focus glow outlines, border ring accents, and premium dark options list styling.
    - **Text-Based Refresh**: Created a text-based "Refresh" button next to the search input with smooth transitions and status text updates ("Refreshing...") to manually trigger list updates.
    - **Suspended Rows Redesign**: Enhanced visibility of suspended rows by replacing the light pink tint with a high-contrast dark red background (`bg-rose-950/25`), red text highlights, and a solid red left-border accent bar using inset shadows (`shadow-[inset_4px_0_0_0_#ef4444]`).
    - **Immediate Filter Sync**: Implemented client-side filtering logic via a new `filteredLocalUsers` memo to instantly remove users from the paginated table view when they are suspended if the "Active" filter is currently active.
    - **Modal Adjustments & Scrollbars**: Slightly increased the citizen profile modal width to `max-w-5xl` and maximum height to `max-h-[95vh]`, updating column distributions from `md:col-span-5` / `md:col-span-7` to `md:col-span-4` / `md:col-span-8` to maximize horizontal reading space for report lists, and attached custom thin scrollbar hooks.
    - **Filter-Independent Stats Overview**: Refactored the backend `/api/users` endpoint to return global user counters (Total, Active, Elite Contributors) so that top-row statistics remain unaffected by province, district, status, or keyword filters on the list.
    - **Sidebar Header and Badge Refinement**: Refined navigation button visuals, removed the glowing effect from the top-left logo container badge, and updated the subtext label from "Control Center" to "Admin Dashboard".
    - **Premium Custom Scrollbars**: Injected global custom scrollbar rules inside `globals.css` to render thin, modern scroll tracks and teal-glowing handles on hover for all Webkit and Firefox browsers.
    - **Verified Compilation**: Completed local build checks confirming zero TypeScript compile warnings or regressions.

- **[2026-05-22] Suspended Admin Account Login Error Message:**
    - Modified backend validation service (`validateFirestoreAdmin` and `validateAdminCredentials`) in [auth.service.ts](file:///e:/AlertZone_New/alertzone-admin-dashboard/lib/services/auth.service.ts) to display a deactivated message when suspended admin accounts try to log in.
    - Verified the password first to maintain security and prevent username/deactivation status probing.
    - Added the custom error message: `"Your account has been deactivated. Kindly contact the administration."`
    - Verified that standard logins, invalid credential handling, and TypeScript compilation still function correctly.

- **[2026-05-22] Real-Time Admin Deactivation Alert & Forced Logout:**
    - **How the Presence System Works**:
      - **Client Heartbeat**: Standard admin clients send a recurring POST request to `/api/auth/heartbeat` every 15 seconds.
      - **Last Active Timestamp**: The backend updates the admin's `lastActiveAt` field in Firestore with the current server timestamp.
      - **Online Detection**: An admin is considered **online/active** if `Date.now() - lastActiveAt` is less than **20 seconds**. If the difference is larger (or `lastActiveAt` is missing), the admin is considered offline.
      - **Deactivation Verification**: The heartbeat response returns `isActive` to the client. If a superadmin deactivates them, the next heartbeat detects `isActive: false`, blocks the screen with a blurred full-screen modal, and starts a 2-minute forced logout countdown.
    - **Types**: Added optional `lastActiveAt?: Date` to `AdminUser` interface in [auth.ts](file:///e:/AlertZone_New/alertzone-admin-dashboard/lib/types/auth.ts).
    - **Service & API Endpoints**:
      - Updated `listAdminUsers` mapper in `auth.service.ts` to parse `lastActiveAt` Firestore timestamp fields into JS Dates.
      - Implemented `POST /api/auth/heartbeat` API route to validate the session and update the active admin's `lastActiveAt` field in Firestore with server timestamps.
      - Modified `GET /api/auth/session` to check the database status on page reload and clear session cookies if deactivated.
    - **Real-Time Client Presence Hook & Overlay**:
      - Modified `AuthContext.tsx` to automatically send client heartbeats every 15 seconds.
      - If deactivated, instantly blocks user interactions with a full-screen blurred modal stating: *"Your account has been deactivated. Please contact the administrator to activate."* and launches a 2-minute countdown timer that automatically calls `logout` when it reaches `0:00`.
    - **Superadmin Warnings**:
      - Updated `AdminUserManagement.tsx` to warn the superadmin if they attempt to deactivate an admin currently active (heartbeat within 20 seconds) with: *"(admin name) is currently active on his account. Do you want to continue?"*.
      - Styled the confirmation button as a high-visibility red alert button reading *"Yes, Continue"*.
    - **Active Admin Deletion Block**:
      - Implemented a deletion block in `AdminUserManagement.tsx` that prevents deleting admin accounts that are active or online.
      - If the target admin is active (`isActive === true`) or online (heartbeat within 20 seconds), the delete confirmation modal is replaced with a warning state displaying: *"(admin name) is active. You cannot delete the account when he's active. Please deactivate and once logged out try deleting."*
      - Replaces confirmation inputs and delete actions with a single "OK" close button.
    - **Validation**:
      - Verified type safety across the workspace by successfully passing `npx tsc --noEmit`.

---

- **[2026-05-22] Reports Management Firestore Integration:**
    - Completed Phase 3: Reports Management integration with live Firestore data.
    - Replaced hardcoded mock data in `Reportsmanagement.tsx` with real-time Firestore subscriptions via a custom `useReports` hook.
    - Established strict type definitions mapping to the mobile app's schema in `lib/types/report.ts`.
    - Created shared UI styling constants for categories (`categories.ts`) and statuses (`statuses.ts`) mapping directly to the mobile app design system.
    - Implemented `report.service.ts` using the Firebase v12 client SDK to handle filtered snapshot listeners and status mutation logic.
    - Integrated status mutation functionality with automatic `statusHistory` timeline appending and system-generated citizen notifications within the same transaction/update flow.
    - Implemented a two-step confirmation modal for status changes to prevent accidental state mutations and explicitly inform the admin that a notification will be pushed to the citizen.
    - Refined the UI detail panel to render dynamic storage image arrays and parse timestamp formatting directly from Firestore server timestamps.

- **[2026-05-22] Reports Management UI Polish & Map Integration:**
    - Adjusted the Reports List card hierarchy to prominently display the "Type of Incident" (e.g., Road & Traffic Incident) as the main title, pushing the Incident ID to the bottom of the card information cluster.
- Features: email, password, username fields, show/hide password, keep-me-logged-in checkbox.
    - Currently uses `setTimeout()` simulation (not wired to Firebase Auth).

- **[2026-05-20] Main Dashboard Shell:**
    - Built `Maindashboard.tsx` — sidebar navigation + topbar + main content area.
    - 7 navigation items: Dashboard, Reports, Map, Users, Analytics, Notifications, Settings.
    - Mobile responsive with hamburger menu and sidebar overlay.
    - Background glow effects matching the mobile app's aesthetic.

- **[2026-05-20] Dashboard Overview:**
    - 5 stat cards (Total Reports, Reported, In Progress, Solved, Closed) — all hardcoded.
    - Custom SVG donut chart for status distribution.
    - Custom SVG bar chart for category breakdown.
    - Custom SVG line chart for monthly trend.
    - Recent reports table with mock data.

- **[2026-05-20] Reports Management:**
    - Built `Reportsmanagement.tsx` — full reports table with search, filters, detail view.
    - Note: Uses incorrect types that don't match the mobile app's Firestore schema.

- **[2026-05-20] Map View:**
    - Built `Mapview.tsx` — Leaflet map with SSR-safe dynamic import.
    - Map renders but has no real report pin data.

- **[2026-05-20] Users Management:**
    - Built `Users.tsx` — user list with search and status filter.
    - Uses mock data types.

- **[2026-05-20] Analytics:**
    - Built `Analytics.tsx` — multiple chart types and data visualizations.
    - All charts use hardcoded or empty data arrays.

- **[2026-05-20] Notifications:**
    - Built `Notifications.tsx` — notification list with read/unread states.
    - Uses `MOCK_NOTIFICATIONS` with 5 hardcoded items.

---

## 📚 Phase 2: Documentation & Planning
**Objective:** Create comprehensive documentation to guide Firebase integration and align with the mobile app.

- **[2026-05-20] Documentation Suite Created:**
    - `docs/MOBILE_APP_INTEGRATION_GUIDE.md`: Detailed guide for how the dashboard interacts with the mobile app's Firebase data.
    - `docs/CURRENT_STATUS.md`: Full tracking of what's built, mock data areas, and missing features.
    - `docs/ARCHITECTURE.md`: Target architecture with layered pattern (Components → Hooks → Services).
    - `docs/IMPLEMENTATION_PLAN.md`: 10-phase roadmap for Firebase integration.
    - `docs/PROJECT_PROGRESS.md`: This file — milestone tracking.
    - `docs/FIRESTORE_DATA_MODEL.md`: Shared Firestore schema documentation.
    - `docs/GUIDELINES.md`: Project-specific coding conventions and design system.
    - `AGENTS.md`: Updated with mandatory reading list and agent rules.

---

### Phase 4: Admin Authentication — Hardcoded Credentials System
- **Status:** ✅ Completed — 2026-05-21

**What was implemented:**
- Replaced fake `setTimeout` login with a real, secure authentication system.
- **Superadmin** credentials stored server-side in `.env.local` (`SUPERADMIN_USERNAME`, `SUPERADMIN_PASSWORD_HASH`).
- **Additional admins** stored in Firestore `adminUsers` collection with `bcryptjs` password hashing.
- **JWT session cookies** (`jose`) — HttpOnly, SameSite=Lax. 8-hour default, 30-day "keep me logged in".
- **`lib/services/auth.service.ts`** — server-side only service: credential validation, JWT creation/verification, admin CRUD.
- **API routes**:
  - `POST /api/auth/login` — validates credentials, sets cookie
  - `POST /api/auth/logout` — clears cookie
  - `GET /api/auth/session` — restores session on page load
  - `GET/POST /api/admin-users` — list / create admin users (superadmin only)
  - `PATCH/DELETE /api/admin-users/[id]` — update / delete (superadmin only)
- **`lib/context/AuthContext.tsx`** — React context provider exposing `user`, `isSuperAdmin`, `login`, `logout`.
- **`lib/hooks/useAuth.ts`** — convenience re-export.
- **`lib/types/auth.ts`** — `AdminUser`, `AdminSession`, `AdminRole` types.
- **`lib/constants/auth.ts`** — role metadata, cookie name, session durations.
- **Updated `Adminlogin.tsx`** — removed email field and fake auth; real error messages.
- **Updated `Maindashboard.tsx`** — real user display (name + role badge) from context; logout button in sidebar; "Admin Users" tab visible only to superadmin.
- **New `AdminUserManagement.tsx`** — table of Firestore admin accounts; create/deactivate/delete modal; superadmin-only.
- **`scripts/hash-password.mjs`** — utility to generate bcrypt hashes for `.env.local`.
- **Environment Variable Bug Fix**: Resolved a critical issue where Next.js failed to load or incorrectly expanded the `SUPERADMIN_PASSWORD_HASH` because bcrypt hashes contain `$` symbols which Next.js interprets as environment variable expansions. Fixed by escaping all `$` signs with `\$` in `.env.local` and updating `scripts/hash-password.mjs` to automatically escape hashes in its output.
- **Vercel/Production Compatibility Fix**: In production environments (like Vercel), environment variables are injected directly by the platform and do not undergo Next.js's local dotenv parser expansion, meaning they are read literally (retaining backslashes if they were escaped, or standard if unescaped). Updated `lib/services/auth.service.ts` to automatically unescape dollar signs in the password hash at runtime, ensuring the hash works correctly regardless of how it is defined in Vercel or local environments.
- **Logout Confirmation**: Added a premium-styled custom modal prompting for confirmation before logging out, replacing the immediate sign out action.
- **Removed "Keep me logged in"**: Cleaned up the login interface by removing the "keep me logged in" checkbox and defaulting all session lifetimes to the standard 8-hour duration.

- **[2026-05-21] Firebase Admin SDK Integration (Admin Bypass):**
    - Installed `firebase-admin` dependency to perform backend administrative Firestore actions.
    - Created [lib/firebase-admin.ts](file:///e:/AlertZone_New/alertzone-admin-dashboard/lib/firebase-admin.ts) to handle administrative authentication (supporting environment variables and local `service-account.json` fallback).
    - Refactored [lib/services/auth.service.ts](file:///e:/AlertZone_New/alertzone-admin-dashboard/lib/services/auth.service.ts) to utilize the Firebase Admin SDK instead of the client SDK. This resolves the `"Missing or insufficient permissions"` error when a superadmin creates, updates, or deletes other admin accounts (since server-side operations using service accounts bypass client Firestore security rules).
    - Added `service-account.json` to `.gitignore` to prevent secret key leakage.
    - Verified security boundaries: standard users/mobile app still utilize strict client-side Firestore security rules while admin portal operations are processed securely on the server-side.
    - **Added `@opentelemetry/api` package**: Fixed a login crash/network error caused by the missing open telemetry peer dependency required by `firebase-admin`'s firestore package.
    - **Enhanced User & Admin Management UIs**:
      - Styled inactive admin accounts with a brightened red row background highlight (`bg-red-500/20`) and enhanced status badge for clear visibility.
      - Styled suspended citizen user accounts with a brightened rose row background highlight (`bg-rose-500/20`) and matching text highlights to align with the admin table theme.
      - Replaced generic browser `confirm()` alerts with beautiful, theme-matching interactive custom modals for all status actions (activation, deactivation/suspension, and deletion) on both screen flows.
      - Added a double-layer safety validation checkbox for deleting accounts, requiring confirmation of irreversible action before enabling the button.

**Default superadmin credentials (change before production):**
- Username: `superadmin`
- Password: `admin1234`

- **[2026-05-21] Google Maps Migration, Collapsible Sidebar & Custom Controls:**
    - Replaced the Leaflet map completely to exclusively run Google Maps JavaScript API with custom premium dark mode themes.
    - Uninstalled `leaflet`, `@types/leaflet`, and `react-leaflet` to clean up codebase dependencies.
    - Implemented dynamic cascading Sri Lankan Province and District dropdown filters on the reports list sidebar.
    - Added a collapsible sidebar toggle mechanism (sliding left on desktop, up on mobile) allowing the map to take full width when collapsed.
    - Replaced default Google Maps zoom controls with custom premium glassmorphic zoom buttons.
    - Styled custom rounded teal scrollbars for scrollable lists inside the map sidebar.
    - Removed the "Live from Firebase" sub-text element.
    - Added automatic map centering logic to pan/re-center on filtered items and active marker selections.
    - Applied clean, professional sans-serif typography across all map overlay elements, custom HTML markers, and InfoWindows.
    - Expanded `MOCK_REPORTS` in `app/data/mockData.ts` to include realistic coordinates, provinces, and districts spanning multiple Sri Lankan regions (Western, Central, Southern, Northern, Eastern) to verify cascading filters.
    - Successfully compiled and tested Next.js production build without any linting, TS compiler, or peer-dependency regressions.

---

- **[2026-05-21] Map Boundary Highlighting, Sidebar Fix & Report Category Overhaul:**
    - **Report Categories Renamed**: Updated `ReportCategory` type and all category metadata across `mockData.ts`, `Mapview.tsx`, `Reportsmanagement.tsx`, and `Maindashboard.tsx` to use the final agreed categories: `Road & Traffic`, `Water and Drainage`, `Waste & Environment`, `Social Security`, `Bridge & Structural`, `Other`. Updated mock report entries and `INCIDENT_BY_CATEGORY` data to use new categories.
    - **Exact Province/District Polygon Highlighting**: Replaced the approximate circle overlay with a proper `google.maps.Data` layer that fetches real GeoJSON polygon boundaries from the OpenStreetMap Nominatim API. When a province or district is selected, the exact administrative boundary is drawn on the map with a teal fill/stroke. Map also auto-fits bounds to the polygon via `fitBounds()`.
    - **Sidebar Collapse Layout Fix**: Fixed the sidebar collapse so the Google Maps area (`flex-1`) correctly expands to fill the freed space when the sidebar is collapsed. Removed fixed `w-full md:w-96` from the outer container; width is now fully conditional on the `isSidebarCollapsed` state, allowing the map to take full available width on desktop.

---

- **[2026-05-21] Switch to Local geoBoundaries Land-Clipped GeoJSON for Boundary Highlighting:**
    - **Land-Clipped Boundaries**: Replaced the Nominatim API boundary highlighting with high-quality local GeoJSON files from geoBoundaries (LKA ADM1 for provinces, LKA ADM2 for districts) to avoid highlighting parts of the sea for coastal districts and provinces.
    - **Offline Local Serving**: Saved the GeoJSON files directly into the project at `public/geojson/lka-adm1.geojson` and `public/geojson/lka-adm2.geojson` to solve performance, rate limiting, and CORS issues.
    - **LFS Text Pointer Resolving**: Addressed a bug where loading files from GitHub raw fetched LFS text pointers instead of the actual JSON data, by serving and loading files locally via standard Next.js pathing (`/geojson/lka-adm1.geojson`).
    - **Name & Suffix Normalization**: Updated `matchesRegion` comparison logic to dynamically strip " Province" and " District" suffixes from geoBoundaries features to match dropdown filter names.
    - **Spelling Alias Support**: Implemented a spelling normalization mapping to reconcile spelling discrepancies between the dropdowns and geoBoundaries (e.g., translating "Moneragala" to "Monaragala").

- **[2026-05-22] Live User Management Integration:**
    - Integrated the frontend **User Management** page ([Users.tsx](file:///e:/AlertZone_New/alertzone-admin-dashboard/app/components/Users.tsx)) to pull live citizen profiles from the Firestore `users` collection.
    - Implemented Sri Lankan Province, District, and Status cascading filtering. Selecting a Province filters the District options, and the list updates dynamically with a debounced search query.
    - Replaced the mock table columns with the following:
        1. **User Identity**: Avatar/Initial, Full Name, Email, and **NIC** (National Identity Card).
        2. **Contact Details**: Phone, **Province**, **District**, **Local Government Area**, and **Address**.
        3. **Gamification Details**: Level, Points, Reports Validated.
        4. **Join Date**: Formatted date string from Firestore metadata.
        5. **Status Badge & Actions**: Active/Suspended badge and dynamic trigger buttons.
    - Developed a comprehensive **User Detail Modal** showing detailed profile records, a status-wise breakdown of their submitted reports (Pending, Assigned, Fixing, Resolved, Rejected), and a scrollable list of their complete reports history.
    - Integrated live **Suspend/Unsuspend** actions. Confirming in the modal triggers a PATCH request to the Firestore admin API, toggling user active status dynamically.
    - Verified compilation and successfully passed production builds using `npm run build` with zero compiler errors.

- **[2026-05-22] User Management UI/UX Refinement & Navigation Sidebar Overhaul:**
    - **Custom Glassmorphic Dropdowns**: Styled the Province, District, and Status filters on the User Management page to override default native selectors, adding a custom right-aligned SVG chevron, focus glow outlines, border ring accents, and premium dark options list styling.
    - **Text-Based Refresh**: Created a text-based "Refresh" button next to the search input with smooth transitions and status text updates ("Refreshing...") to manually trigger list updates.
    - **Suspended Rows Redesign**: Enhanced visibility of suspended rows by replacing the light pink tint with a high-contrast dark red background (`bg-rose-950/25`), red text highlights, and a solid red left-border accent bar using inset shadows (`shadow-[inset_4px_0_0_0_#ef4444]`).
    - **Immediate Filter Sync**: Implemented client-side filtering logic via a new `filteredLocalUsers` memo to instantly remove users from the paginated table view when they are suspended if the "Active" filter is currently active.
    - **Modal Adjustments & Scrollbars**: Slightly increased the citizen profile modal width to `max-w-5xl` and maximum height to `max-h-[95vh]`, updating column distributions from `md:col-span-5` / `md:col-span-7` to `md:col-span-4` / `md:col-span-8` to maximize horizontal reading space for report lists, and attached custom thin scrollbar hooks.
    - **Filter-Independent Stats Overview**: Refactored the backend `/api/users` endpoint to return global user counters (Total, Active, Elite Contributors) so that top-row statistics remain unaffected by province, district, status, or keyword filters on the list.
    - **Sidebar Header and Badge Refinement**: Refined navigation button visuals, removed the glowing effect from the top-left logo container badge, and updated the subtext label from "Control Center" to "Admin Dashboard".
    - **Premium Custom Scrollbars**: Injected global custom scrollbar rules inside `globals.css` to render thin, modern scroll tracks and teal-glowing handles on hover for all Webkit and Firefox browsers.
    - **Verified Compilation**: Completed local build checks confirming zero TypeScript compile warnings or regressions.

- **[2026-05-22] Suspended Admin Account Login Error Message:**
    - Modified backend validation service (`validateFirestoreAdmin` and `validateAdminCredentials`) in [auth.service.ts](file:///e:/AlertZone_New/alertzone-admin-dashboard/lib/services/auth.service.ts) to display a deactivated message when suspended admin accounts try to log in.
    - Verified the password first to maintain security and prevent username/deactivation status probing.
    - Added the custom error message: `"Your account has been deactivated. Kindly contact the administration."`
    - Verified that standard logins, invalid credential handling, and TypeScript compilation still function correctly.

- **[2026-05-22] Real-Time Admin Deactivation Alert & Forced Logout:**
    - **How the Presence System Works**:
      - **Client Heartbeat**: Standard admin clients send a recurring POST request to `/api/auth/heartbeat` every 15 seconds.
      - **Last Active Timestamp**: The backend updates the admin's `lastActiveAt` field in Firestore with the current server timestamp.
      - **Online Detection**: An admin is considered **online/active** if `Date.now() - lastActiveAt` is less than **20 seconds**. If the difference is larger (or `lastActiveAt` is missing), the admin is considered offline.
      - **Deactivation Verification**: The heartbeat response returns `isActive` to the client. If a superadmin deactivates them, the next heartbeat detects `isActive: false`, blocks the screen with a blurred full-screen modal, and starts a 2-minute forced logout countdown.
    - **Types**: Added optional `lastActiveAt?: Date` to `AdminUser` interface in [auth.ts](file:///e:/AlertZone_New/alertzone-admin-dashboard/lib/types/auth.ts).
    - **Service & API Endpoints**:
      - Updated `listAdminUsers` mapper in `auth.service.ts` to parse `lastActiveAt` Firestore timestamp fields into JS Dates.
      - Implemented `POST /api/auth/heartbeat` API route to validate the session and update the active admin's `lastActiveAt` field in Firestore with server timestamps.
      - Modified `GET /api/auth/session` to check the database status on page reload and clear session cookies if deactivated.
    - **Real-Time Client Presence Hook & Overlay**:
      - Modified `AuthContext.tsx` to automatically send client heartbeats every 15 seconds.
      - If deactivated, instantly blocks user interactions with a full-screen blurred modal stating: *"Your account has been deactivated. Please contact the administrator to activate."* and launches a 2-minute countdown timer that automatically calls `logout` when it reaches `0:00`.
    - **Superadmin Warnings**:
      - Updated `AdminUserManagement.tsx` to warn the superadmin if they attempt to deactivate an admin currently active (heartbeat within 20 seconds) with: *"(admin name) is currently active on his account. Do you want to continue?"*.
      - Styled the confirmation button as a high-visibility red alert button reading *"Yes, Continue"*.
    - **Active Admin Deletion Block**:
      - Implemented a deletion block in `AdminUserManagement.tsx` that prevents deleting admin accounts that are active or online.
      - If the target admin is active (`isActive === true`) or online (heartbeat within 20 seconds), the delete confirmation modal is replaced with a warning state displaying: *"(admin name) is active. You cannot delete the account when he's active. Please deactivate and once logged out try deleting."*
      - Replaces confirmation inputs and delete actions with a single "OK" close button.
    - **Validation**:
      - Verified type safety across the workspace by successfully passing `npx tsc --noEmit`.

---

- **[2026-05-22] Reports Management Firestore Integration:**
    - Completed Phase 3: Reports Management integration with live Firestore data.
    - Replaced hardcoded mock data in `Reportsmanagement.tsx` with real-time Firestore subscriptions via a custom `useReports` hook.
    - Established strict type definitions mapping to the mobile app's schema in `lib/types/report.ts`.
    - Created shared UI styling constants for categories (`categories.ts`) and statuses (`statuses.ts`) mapping directly to the mobile app design system.
    - Implemented `report.service.ts` using the Firebase v12 client SDK to handle filtered snapshot listeners and status mutation logic.
    - Integrated status mutation functionality with automatic `statusHistory` timeline appending and system-generated citizen notifications within the same transaction/update flow.
    - Implemented a two-step confirmation modal for status changes to prevent accidental state mutations and explicitly inform the admin that a notification will be pushed to the citizen.
    - Refined the UI detail panel to render dynamic storage image arrays and parse timestamp formatting directly from Firestore server timestamps.

- **[2026-05-22] Reports Management UI Polish & Map Integration:**
    - Adjusted the Reports List card hierarchy to prominently display the "Type of Incident" (e.g., Road & Traffic Incident) as the main title, pushing the Incident ID to the bottom of the card information cluster.
    - Expanded the location metadata display to show the full `{Province}, {District}, {Local Government Area}` string instead of just the area, applied across both list views and the minimap overlay.
    - Created a new `MiniMap.tsx` component that dynamically loads the Google Maps API and renders an interactive map view inside the report details modal, perfectly centering on the report's coordinates using the standard native red Google map marker.
    - Upgraded the "Status Timeline & Notes" history view to dynamically pull color styles from `statusStyleMeta`, ensuring that each log entry visually reflects the severity/color of its respective status (e.g., Teal for Resolved, Orange for Reported).
    - Extracted the comprehensive user profile view from `Users.tsx` into a reusable `UserDetailsModal.tsx` component. Integrated it into the Reports view, so clicking a reporter's detail card instantly fetches their profile via a new `/api/users/[id]` GET endpoint and opens their full user statistics and history.
    - Rewrote the geographical location reverse-lookup algorithm to be more highly fault-tolerant. It now aggressively scans both the address string and the local area string to reliably deduce the Province, District, and Local Government Area, drastically reducing empty map labels. It also actively provides a UI fallback instead of silently failing when data is purely GPS coordinates.
    - Added the user's actual profile avatar image directly into the "Reporter Details" card immediately when opening the report detail modal, replacing the previous initials placeholder and giving the view a more personalized feel.

- **[2026-05-23] secure reports api migration & vercel loading fix:**
    - Migrated client-side Firestore queries (`subscribeToReports` and client-side `onSnapshot`) to secure server-side API endpoints (`/api/reports` and `/api/reports/[id]`). This resolves unauthenticated read/write permission errors and composite index issues on Vercel.
    - Implemented GET `/api/reports` with in-memory archiving filtering to prevent composite index errors and convert Firestore Timestamps to ISO strings.
    - Implemented PATCH `/api/reports/[id]` to process status changes, history logging, user notification, and reward contribution points using the Admin SDK.
    - Added a premium "Refresh" button in `Reportsmanagement.tsx` matching the user management layout, removing the refresh SVG icon and removing the "New Report" button.
    - Added robust error handling and loading indicators to display clean error blocks and a "Retry" button.
    - Separated incident location details into Province and District (2-column layout) and Local Government Area (LGA) on its own line below them to prevent half-seen/truncation issues, and added a direct external anchor link to Google Maps.
    - Renamed the 'Submitted' card to 'Date & Time' and split the date and time (using 12-hour AM/PM format) onto next lines for clean, legible alignments.
    - Restructured incident list cards to display `Province:`, `District:`, and `LGA:` on separate lines under the category title, with the incident category title placed on the left and the 12-hour AM/PM date and time (with a calendar icon) inline directly to the right of the title.
    - Fixed client-side temporal dead zone ReferenceErrors during render initialization by changing reports utility functions to standard hoisted function declarations.
    - Added a premium glassmorphic multi-filter panel containing a Date Range filter ("From Date" and "To Date" with custom dark-themed browser calendars), Category, Province, District, and LGA cascading selectors, along with a dynamic "Clear Filters" reset button.
    - Applied custom CSS overrides to input calendars to hide default browser glyphs, and integrated programmatic `showPicker()` click handlers to ensure clicking anywhere inside the input fields immediately displays the calendar.
    - Added a live `{filteredReports.length} Reports found` count indicator directly below the filters row to dynamically display matching records count.
    - Replaced the old emoji-based incident category icons with high-fidelity vector SVG icons in a new `lib/constants/categories.tsx` module.
    - Verified complete workspace compilation and production build.

- **[2026-05-23] Custom Calendar Dropdown UI Integration:**
    - Designed and implemented a high-fidelity custom `CustomCalendar` React component, replacing native date input pickers.
    - Integrated a click-outside dismiss handler using `useRef` and window mouse event listeners to automatically close the calendar popovers.
    - Designed a uniform 42-day calendar layout (6 rows of 7 days) displaying offset days of adjacent months to prevent height shifts during navigation.
    - Added adjacent-month transition selection logic, allowing users to select days from neighboring months and trigger automatic calendar view transitions.
    - Added quick-action "Today" and "Clear" buttons at the bottom of the calendar popover.
    - Styled with premium glassmorphic properties matching the dark theme: semi-transparent background overlay (`bg-[#091622]/95`), blur filter (`backdrop-blur-xl`), border ring accents (`border-teal-500/20`), and rich teal-to-emerald gradient active selections.
    - Verified build successfully compiled without any regressions.

- **[2026-05-23] Map View Real Data & Active Report Filters Integration:**
    - Connected the Map View component to the live Firestore database using the `useReports` hook.
    - Added operational logic to automatically filter reports for active statuses only (`PENDING`, `ASSIGNED`, and `FIXING`).
    - Implemented a local `resolveLocation` utility to extract nested coordinate objects (`latitude`/`longitude`), district, province, address, and Local Government Area (LGA) from the live reports schema structure.
    - Replaced the horizontal scrolling categories button bar in the sidebar with a dual-dropdown filter panel:
      - **Active Status Dropdown**: Filters the map view list by "All Active", "Pending", "Assigned", and "Fixing" statuses.
      - **Report Type Dropdown**: Filters reports by category type ("All Types", "Road & Traffic", etc.) supporting both standard database category IDs and custom string formats.
    - Polished details overlay panel: removed the hardcoded `priority` field since it does not exist in the Firestore data model, and standardized date-time formatting to local dates and 12-hour AM/PM times.
    - Wired the "Open Management" button in the selected report panel to fire a custom `changeNavTab` navigation event, and added an event listener in `Maindashboard.tsx` to automatically redirect the admin to the live Reports Management tab.
    - Verified the workspace successfully compiles with `npm run build`.

- **[2026-05-23] Map View Sidebar Card & Navigation Restructuring:**
    - Redesigned active report incidents card layout in the `Mapview.tsx` sidebar list to show the "Report Type" (e.g., Road & Traffic Incident) as the main card title.
    - Configured reported address styling on sidebar cards and overlays to wrap naturally (`break-words`) instead of using single-line truncations, and set standard body font weighting (`font-normal text-slate-400`) to differentiate it from title styles.
    - Updated map marker InfoWindows and selected report details overlays to display the Report Type as the main title, placing the monospaced unique Incident ID directly below it.
    - Wired the "Open Management" button in Map View to store a global `pendingReportDetail` reference, trigger a `changeNavTab` navigation tab redirection to Reports Management, and dispatch a custom `openReportDetail` trigger.
    - Added reactive lifecycle effects inside `Reportsmanagement.tsx` to automatically listen for redirection event cues and immediately launch the targeted report's complete interactive details modal.
    - Checked all compilation flows confirming zero warnings.

- **[2026-05-24] All-Country LGA Auto-Resolution:**
    - Created [geocode-all-country.js](file:///e:/AlertZone_New/alertzone-admin-dashboard/scripts/geocode-all-country.js) to resolve coordinate center points for all **341 LGAs** across all **25 districts** in Sri Lanka using the Photon API.
    - Implemented a config builder [rebuild-regions-config.js](file:///e:/AlertZone_New/alertzone-admin-dashboard/scripts/rebuild-regions-config.js) to append the geocoded coordinates database (`LGA_CENTERS`) and the regex-based `resolveSrilankaRegion` utility to both dashboards and mobile configs.
    - Updated `resolveSrilankaRegion` to use regex word boundaries `\b` inside the `matches` helper, successfully resolving a critical bug where short names (e.g. `"ella"`) matched inside larger words (e.g. `"avissawella"` or `"pussellawa"`).
    - Deduplicated the code in [Reportsmanagement.tsx](file:///e:/AlertZone_New/alertzone-admin-dashboard/app/components/Reportsmanagement.tsx) and [Mapview.tsx](file:///e:/AlertZone_New/alertzone-admin-dashboard/app/components/Mapview.tsx) by importing the central config's `resolveSrilankaRegion`.
    - Created [count-lgas.ts](file:///e:/AlertZone_New/alertzone-admin-dashboard/scripts/count-lgas.ts) and verified that all 29 reports in the live Firestore database resolve to their correct LGAs with zero errors.

---

- **[2026-05-24] Settings Section Completed:**
    - Created [Settings.tsx](file:///e:/AlertZone_New/alertzone-admin-dashboard/app/components/Settings.tsx) — a fully functional settings page with 4 sections: **My Account** (avatar, name, username, role badge, session ID), **Edit Profile** (display name update), **Change Password** (bcrypt verify + strength meter), and **About AlertZone** (system info + Firebase/GitHub links).
    - Created [app/api/auth/profile/route.ts](file:///e:/AlertZone_New/alertzone-admin-dashboard/app/api/auth/profile/route.ts) — a new `PATCH /api/auth/profile` endpoint that verifies the session, validates the current password for password changes, updates Firestore, and re-issues the JWT cookie so the sidebar display name refreshes on reload.
    - Superadmin users see read-only notices explaining that their credentials are managed via `.env.local` environment variables.
    - Wired `<Settings />` into [Maindashboard.tsx](file:///e:/AlertZone_New/alertzone-admin-dashboard/app/components/Maindashboard.tsx), replacing the previous "coming soon" placeholder.
    - Build verified with `npm run build` — compiled successfully with zero TypeScript errors.

- **[2026-05-24] Settings UI Design Polish:**
    - Upgraded Settings page layout from a narrow `max-w-5xl` grid to a full-width spacious layout.
    - Switched layout from a tight 2/5 and 3/5 column grid to a clean 3-column split (`lg:grid-cols-3` with left = 1 col, right = 2 cols) to give forms and textfields maximum space.
    - Increased Card component inner body padding from `p-5` to `p-6`, header padding from `px-5 py-4` to `px-6 py-5`, and header gap from 3 to 4.
    - Redesigned My Account Profile Avatar to be larger (`w-20 h-20` instead of `w-16 h-16`), text font-size to `text-2xl` with a sleek glowing back ring, and standardized status role badge text styles.
    - Increased InfoRow vertical padding from `py-2.5` to `py-3.5` with uppercase tracking titles to maximize breathing room.
    - Improved all input fields styling to use `rounded-xl` and increased padding to `px-4 py-3` with cleaner hover/focus outline states.
    - Reformatted forms label selectors to uppercase tracking fonts and updated save changes/change password submit buttons to uppercase wide spacing labels with custom shadows.
    - Redesigned Session Management card with red highlights to match dashboard standards, and updated About AlertZone console/repo navigation links.
    - Re-verified production build compilation.

- **[2026-05-24] Notification System Integration**:
    - **Mobile App Setup**:
      - Created `types/notification.ts` defining `AppNotification` and `NotificationType` (`status_change`, `upvote`, `badge_earned`, `system`).
      - Created `services/notification.service.ts` to request permissions, retrieve tokens, configure default Android channel settings, and update Firestore documents.
      - Developed the `useNotifications.ts` hook globally initialized in `app/_layout.tsx` to handle foreground notifications and tapped redirects.
      - Implemented a complete dark-mode in-app Notification Center (`app/notifications.tsx`) with filtering tabs, and read/delete actions.
      - Wired the Home screen bell icon (`home.tsx`) to subscribe to the unread count in real-time.
    - **Dashboard & Push Integration**:
      - Created `push.service.ts` calling Expo's Push API (`https://exp.host/--/api/v2/push/send`) for single and bulk push deliveries.
      - Updated the reports PATCH route (`app/api/reports/[id]/route.ts`) to dispatch push notifications on status changes.
      - Built a secure POST `/api/notifications/broadcast` route to query citizen users, batch write notification documents to Firestore, and push messages in bulk.
      - Refactored `Notifications.tsx` in the dashboard to list live Firestore notification logs in real-time and added a Megaphone Broadcast Modal.
    - **Expo Project ID and EAS Resolution**:
      - **The Problem**: During runtime testing inside Expo Go, the app crashed on startup with `Error: No "projectId" found`. This was caused by modern Expo SDK 54's strict requirement that token generation be linked to an EAS (Expo Application Services) account, which was unconfigured.
      - **Immediate Solution (Graceful Fallback)**: Modified `services/notification.service.ts` to check if `projectId` is present first. If missing, it logs a descriptive warning in the console explaining how to set it up, and gracefully returns `null` rather than throwing an exception. This kept in-app notifications functioning in real-time.
      - **Full Resolution**: Run `npx eas login` and `npx eas project:init` in the mobile app directory. This linked the local workspace to the EAS account (`@stjalthotage/alertzone` under ID `55db983e-26bb-4c43-891e-d4e1155bd5ec`), automatically writing the required `projectId` into `app.json` and fully enabling native push deliveries.
    - **Metro Bundling Failure & Expo Go Native Module Bypass**:
      - **The Problem**: Expo Go in SDK 53+ removed remote notification functionality. Attempting to statically import from `'expo-notifications'` triggers a startup exception/warning in Expo Go because of the side-effect loader `DevicePushTokenAutoRegistration.fx.js`.
      - **The Attempted Fix & Metro Crash**: To bypass this in Expo Go, a dynamic `require('expo-notifications')` was conditionally called behind an `if (!isExpoGo)` block. However, this caused Metro DeltaBundler to crash with `Error: Got unexpected undefined` inside `metro/src/DeltaBundler/Graph.js` during dependency resolution, as Metro's static analysis could not correctly resolve the dynamic module structure.
      - **The Resolution (Static Subpath Imports)**: Bypassed the main package entry point (`expo-notifications/build/index.js`) and its side effects by importing the required functions directly from their respective subpaths statically:
        - `import getExpoPushTokenAsync from 'expo-notifications/build/getExpoPushTokenAsync';`
        - `import { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';`
        - `import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';`
        - `import setNotificationChannelAsync from 'expo-notifications/build/setNotificationChannelAsync';`
        - `import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';`
        - `import { addNotificationReceivedListener, addNotificationResponseReceivedListener } from 'expo-notifications/build/NotificationsEmitter';`
        This satisfies Metro's static resolution while allowing us to skip native token calls and listener attachments entirely during runtime inside Expo Go via the `isExpoGo` checks, ensuring a clean bundle and crash-free execution.
      - **Runtime Warning & Environment Detection Fix**: In newer Expo SDK versions (53/54), `Constants.appOwnership` is deprecated/removed and returned `undefined`, making the environment check evaluate `isExpoGo` as `false` and triggering push notification native calls. We replaced it with the official `isRunningInExpoGo` function from `'expo'` package. Running the Expo development server with the cache cleared (`npx expo start -c`) ensures that Metro correctly rebuilds the dependency tree without using corrupt/stale caches.

---

*Last Updated: 2026-05-26*

---

## 📊 Phase 6: Analytics — Live Firebase Data Integration
- **Status:** ✅ Completed — 2026-05-26
- **Branch:** `feat/analytics`

**What was implemented:**

- **New API route `app/api/analytics/route.ts`**: Server-side aggregation endpoint using Firebase Admin SDK. Accepts a `?range=7|30|90` query param. Fetches all non-archived reports, computes:
  - **Summary KPIs**: Total reports, resolved reports, resolution rate %, active citizens (unique UIDs), resolved today, pending count, average resolution time (computed from `statusHistory` timestamps).
  - **Daily activity buckets**: Per-day report submission and resolution counts for the selected range, outputting `{ day, date, reports, solved }[]` arrays suitable for the SVG line chart.
  - **Category breakdown**: Per-category counts broken down by status (PENDING → pending, ASSIGNED/FIXING → inProgress, RESOLVED → resolved, REJECTED → rejected) with official category colors matching GUIDELINES.md.
  - **Province distribution**: Reports grouped by province (inferred from `location.area` via a district-to-province lookup table), with total, resolved count, and resolution rate per province.
  - Reuses the `requireAdmin` auth guard pattern from `/api/reports/route.ts`.

- **Full rewrite of `app/components/Analytics.tsx`**:
  - Replaced all mock data imports (`INCIDENT_BY_CATEGORY`, `DAILY_ACTIVITY`, `REGIONAL_PERFORMANCE`) with a live `fetch('/api/analytics?range=N')` call inside a `useEffect` triggered by the `timeRange` state.
  - **Loading skeletons** (`animate-pulse`) for all 4 stat cards, the line chart, category bars, and province table rows — matching the dashboard's established UX pattern.
  - **Error banner** with retry button when the API fails.
  - **KPI stat cards**: Total Reports, Resolution Rate, Active Citizens, Avg. Resolution Time — all with live values and descriptive sub-labels.
  - **Daily Activity SVG line chart**: Two-line chart (reports vs resolved) with area fill gradients, hover crosshair tooltips, Y-axis value labels, and adaptive X-axis labeling (day name for 7-day, date for 30/90-day).
  - **Category breakdown**: Stacked horizontal progress bars per category, correctly using mobile-app-matching status colors (amber/pending, teal/in-progress, green/resolved, red/rejected).
  - **Province distribution table**: Sortable by total reports, resolution rate displayed as a color-coded progress bar (green ≥70%, teal ≥40%, amber <40%).
  - **Smart insight cards**: Three contextual cards (Pending Backlog, Resolution Health, Community Engagement) with dynamic copy driven by real data values.
  - Time range selector (7 / 30 / 90 days) re-fetches the API on change.
  - Uses design system colors from GUIDELINES.md (`#4CC2D1`, `#30A89C`, `#A78BFA`, etc.) throughout — no ad-hoc colors.

- **[2026-05-26] Analytics Bug Fixes (Provincial Distribution & LGA Counts)**:
    - **Issue 1**: Reports with unrecognized area/suburb names (like "Nugegoda" or Sabaragamuwa Province coordinates) were resolved to "Other" province and filtered out of the distribution table.
    - **Fix 1**: Integrated the centralized `resolveSrilankaRegion` helper from `lib/constants/sriLankaRegions.ts` into the server API endpoint (`route.ts`). This successfully maps 100% of reports to correct official provinces, districts, and LGAs via regex keyword scanning and GPS coordinates.
    - **Issue 2**: The LGA counts modal showed unstructured area text or raw data since LGA names were not standardized, and it didn't list all LGAs.
    - **Fix 2**: Pre-populated the `lgas` map dynamically for each active district with all official LGAs from `sriLankaGeographics`. This ensures the LGA modal displays the complete set of official LGAs in that district, with report counts sorted by volume (descending) so active ones appear at the top and 0-count ones at the bottom.
    - **Issue 3**: The LGA modal was not centered on the viewport when opened, and was instead positioned relative to its animated parent `animate-slide-up` container, shifting it away from the screen center on scroll.
    - **Fix 3**: Wrapped the main return statement of `Analytics.tsx` in a React Fragment and moved the rendering of the `LGAModal` to the root level (outside the `animate-slide-up` div). This ensures `position: fixed` works relative to the viewport itself, keeping the modal perfectly centered on the screen regardless of scroll depth.
    - **Visual/UX Enhancements**:
      - Added a helper message banner just above the charts row reminding the admin to adjust the year and month filters to see reports in the graphs.
      - Updated the Highlight Cards (Most Reported Province, District, and Category) to display the event counts and the selected time period (e.g. "Last 30 Days", "May 2026") as a sub-text label.
      - Removed the "Avg. Resolution Time" card from the KPI row, resizing the grid to a balanced 3-column layout. Relocated the "resolved today" counter to the Resolution Rate card sub-label.
      - Removed the bottom static "Insight Cards" (Pending Backlog, Resolution Health, and Community Engagement) to declutter the dashboard layout.
      - Adjusted the X-axis label rendering step logic in the daily activity line chart. For the 90-day time range, it now uses a step size of 15 (rendering labels every 15 days) to prevent crowded or overlapping text labels on the axis.
    - Verified all compilation checks and local Next.js production builds passed successfully.

- [2026-05-26] Regional & Report Type Comparative Analytics:
    - **Regional Comparison Playground**: Built an interactive multi-select card at the bottom of the Analytics page to select and compare 2 or 3 Provinces, Districts, or LGAs side-by-side. Includes search filtering, dynamic tab level switches, selection constraints validation, and a region list preview with quick-remove options.
    - **Centered Comparison Modal**: Built a fixed, screen-centered `ComparisonModal` that loads the selected regions and visualizes comparative metrics side-by-side:
        - **Region KPIs**: Side-by-side comparison cards displaying Total Reports, Resolved Counts, and Resolution Rates (with color-coded progress bars), themed with regional identity colors (Cyan, Purple, Amber) to map cleanly to the visualizations.
        - **Volume Comparison SVG Chart**: Renders side-by-side vertical bar charts comparing total reports (orange) and resolved reports (green) with clear X/Y grid lines and values labels.
        - **Category Breakdown Matrix**: Progress bars comparing category counts (Road & Traffic, Water & Drainage, etc.) side-by-side for each selected region to highlight localized issue trends.
        - **Automated Insights**: Dynamically summarizes comparison findings, pointing out which region has the highest report volume and which leads in resolution efficiency.
    - Verified all compilation checks and local Next.js production builds passed successfully.

- [2026-05-26] LGA Reports Drill-Down & Redirection:
    - **LGA Modal Reports Integration**: Upgraded the `LGAModal` component to fetch the complete reports list from `/api/reports` on mount.
    - **Normalized Match Resolution**: Implemented client-side sorting and filtering that matches reports to the clicked LGA name by normalizing boundaries and stripping administrative suffixes.
    - **Cross-Tab Redirection**: Added an "Open Modal" trigger that sets `(window as any).pendingReportDetail`, switches the dashboard navigation to the Reports tab, and dispatches a custom event listener that launches the target report modal instantly.
    - Verified that all TypeScript and Next.js production builds compile without warnings or errors.
