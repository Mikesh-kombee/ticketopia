# Mock Authentication Flow (Web)

Create a React-based mock authentication system that includes:

1. **Login Page**:
   - Email and password fields using React Hook Form
   - Form validation using Zod
   - Hardcoded valid credentials or call to a mock API
   - "Remember me" checkbox (optional)
   - On success: store user object in `localStorage` and redirect to `/dashboard`
   - On failure: show error message

2. **Auth Context**:
   - Implement `useAuth()` hook to manage:
     - `user`, `login()`, `logout()`, `isAuthenticated`
   - Store session in `localStorage` and hydrate on page load

3. **Protected Routes**:
   - Create a `PrivateRoute` component or wrapper
   - Redirect unauthenticated users to `/login`
   - Show a loading spinner while checking auth state

4. **Logout Functionality**:
   - Clear session from `localStorage`
   - Redirect to `/login`


# Home Dashboard Module

Design a `DashboardHome` React component that:
- Renders as the landing page of the web app
- Displays five tables (or card-tables) summarizing:
  1. Active engineers (ID, Name, Status)
  2. Open tickets (Ticket ID, Customer, Status, Priority)
  3. Recent route logs (Engineer, Date, Distance)
  4. Unread alerts (Alert ID, Type, Engineer, Timestamp)
  5. Today’s attendance (Engineer, Check-in Time, Status)
- Fetches data from corresponding API endpoints
- Allows sorting columns and clicking rows to navigate to module pages (`/live-map`, `/tickets`, `/routes`, `/alerts`, `/attendance`)
- Uses React Router for navigation
- Adapts layout responsively across browser widths
- Includes a top nav or sidebar with links to each module


# Call-to-Ticket Conversion (Web)

Create a React component `TicketForm` that:
- Uses Geolocation API to fetch current coordinates
- Auto-fills address field with reverse-geocoded address (Google Maps Geocoder)
- Implements Places Autocomplete for manual edits
- Includes fields: Customer Name, Issue Type dropdown, Notes textarea, Photo upload placeholder
- Provides a dropdown of available engineers, sorted by proximity with ETA badges
- Supports initiating ticket creation via incoming call event (simulate this)
- Validates inputs using React Hook Form and Zod
- On submit, posts to `/api/tickets` and shows a modal with “Create Another Ticket” / “Go to Dashboard” options
- Renders a side `TicketHistoryPanel` showing the last 5 tickets with status and timestamps, refreshable via a button
- Stores all ticket data locally and syncs when online

# Route History Playback (Web)

Build a React page `RoutePlayback` that:
- Renders a map via Google Maps JS API
- Allows selecting an engineer (dropdown) and date (datepicker)
- Fetches route data from `/api/routes?engineerId=&date=` and caches in IndexedDB
- Draws an animated polyline with a moving marker along the path
- Applies a speed heatmap: green for normal, red for idle
- Marks stops (>5min) with numbered markers
- Includes playback controls: Play/Pause, Speed toggle (1x/2x/4x), Replay
- Shows a summary card: total distance (km) and duration (hh:mm)
- Automatically centers and adjusts bounds to fit the route on all screen sizes

# Behavioral Alerts Engine (Web)

Design a React component `AlertsDashboard` that:
- Connects to an alert stream API (WebSocket/SSE)
- Renders cards for each alert with color-coded borders (red, orange, blue)
- Shows timestamp, alert type, engineer name, and location snippet
- Supports filtering by type and engineer
- Allows expanding a card to reveal a mini Google Map with the route trace
- Provides bulk dismiss and mark-reviewed actions
- Includes a toggle for push/email notifications per alert
- Displays a live alert counter badge at the top

# GeoFence-Based Attendance (Web)

Implement a React component `GeoFenceCheckIn` that:
- Uses Geolocation API to track the user’s position continuously
- Fetches or sets geofence dynamically, as a circular area with a configurable radius in kilometers
- Performs geofence checks using distance-to-center logic
- Renders a slide-to-check-in button (disabled outside zone), with a tooltip when disabled
- On successful check-in, logs the event, shows a shift summary (check-in time, site name)
- Automatically checks out when the user exits the geofence, updating the summary
- Persists logs in IndexedDB and syncs to `/api/attendance` when back online
- Provides a UI to search and display nearby engineers within the configured radius
- Stores all client-side actions related to attendance and selection locally and syncs with backend

# Layout & Responsiveness (Web)

Design and generate a global `AppLayout` component in React that:
- Wraps all pages with a header and footer

**Header Requirements**:
- Left: Company logo
- Center/Right: Navigation links [Dashboard, Map, Tickets, Reports, Alerts, My Day]
- Far right: User avatar dropdown with profile and logout options
- Collapses links into a hamburger menu on screens <768px
- Sticky behavior on scroll

**Footer Requirements**:
- Centered: © 2025 YourCompany Name. All rights reserved.
- Links: Privacy Policy, Terms of Service
- Right: App version (e.g., "v1.0.0")

**Responsiveness**:
- Mobile-first design with fluid grid layout
- Use CSS Flexbox or Tailwind utility classes for spacing
- Ensure header and footer adapt to all screen sizes

Generate the React JSX and Tailwind CSS classes needed for this layout.

# Travel Report & Expense Manager (Mobile Web)

Create a mobile-optimized React component `TravelReports` that:

### Submission Form:
- Allows users to submit travel expense reports with the following fields:
  - **Vehicle Used**: dropdown list (car, bike, etc.)
  - **Employee Name**: auto-filled or selectable
  - **Travel Area**: text field or map picker
  - **Expense Type**: dropdown (Fuel, Toll, Meals, Others)
  - **Cost**: currency input field
  - **Receipt Upload**: optional image/file input

### Report List:
- Displays submitted reports in card view (mobile-friendly)
- Shows: employee, vehicle, area, expense type, cost, date, and status
- Includes filter controls by:
  - Travel area
  - Employee
  - Date range

### Admin Actions:
- Adds **Approve** and **Reject** buttons to each report (visible to admin roles)
- Updates report status visually

### Functionality:
- Persists report data in `localStorage` for offline access
- Syncs to backend via `/api/reports` when online (mock endpoint)
- Search and sort functionality by cost, date, or employee
- Responsive layout for phones and tablets

