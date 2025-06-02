# Complete Field Service Tracking App POC – Master Requirements

## Executive Summary
Design and develop a comprehensive web application POC for field service management operations in Surat, Gujarat. This application will serve Corteva Agriscience's field operations with real-time tracking, intelligent ticket management, and comprehensive analytics using a mock API architecture.

## Technical Architecture & Data Management

### Core Data Infrastructure
- **Single Source of Truth**: `db.json` serves as the master data repository
- **API Endpoints Structure**:
  ```
  /api/engineers         - Field engineer profiles and real-time status
  /api/tickets          - Service tickets and work orders
  /api/routes           - Historical route data and GPS traces
  /api/alerts           - Behavioral alerts and notifications
  /api/attendance       - Geofence-based attendance records
  /api/expenses         - Monthly expense tracking and approvals
  /api/settings         - Application configuration and cost matrices
  /api/auth             - Authentication and session management
  ```
- **Data Persistence Strategy**:
  - Primary: REST API calls to mock JSON server
  - Secondary: LocalStorage for offline capabilities and user preferences
  - Tertiary: IndexedDB for large datasets (route history, cached maps)

### Technology Stack Requirements
- **Frontend Framework**: React with functional components and hooks
- **Styling**: Tailwind CSS with custom Corteva Agriscience theme
- **State Management**: React Context API + useReducer for complex state
- **HTTP Client**: Axios with interceptors for API calls
- **Maps Integration**: Google Maps JavaScript API
- **Real-time Updates**: Server-Sent Events (SSE) simulation
- **Progressive Web App**: Service Worker for offline functionality

## Brand Guidelines & Localization

### Corteva Agriscience Theme
- **Primary Colors**:
  - Corteva Blue: `#0066CC`
  - Success Green: `#28A745`
  - Warning Orange: `#FFA500`
  - Danger Red: `#DC3545`
  - Neutral Gray: `#6C757D`

- **Typography**:
  - Primary: `'Inter', sans-serif`
  - Secondary: `'Roboto', sans-serif`
  - Font weights: 400, 500, 600, 700

### Localization Requirements
- **Geographic Center**: Surat, Gujarat (23.0225° N, 72.5714° E)
- **Local Context**: Indian names, addresses, and cultural references
- **Sample Names**: Amit Patel, Priya Sharma, Rajesh Kumar, Neha Gupta, Vikram Singh, Kavya Mehta
- **Sample Locations**: Adajan, Athwalines, Citylight, Rander, Varachha, Nanpura
- **Language**: English with occasional Hindi terms where appropriate

## Detailed Module Specifications

### 1. Field Engineer Live Map Dashboard

#### Core Features
- **Real-time GPS Tracking**:
  - Update interval: 30 seconds
  - Smooth marker transitions with CSS animations
  - Custom circular avatars with status rings
  - Clustering for dense areas (10+ engineers in 1km radius)

- **Status Management**:
  - Available (Green): Ready for new assignments
  - Busy (Orange): Currently on a job
  - En Route (Blue): Traveling to assignment
  - Offline (Gray): Not available/end of shift
  - Break (Yellow): On scheduled break

- **Interactive Elements**:
  - Click marker to open engineer details panel
  - Show last 3 GPS pings with timestamps
  - Display current task/ticket if assigned
  - ETA calculations to nearest unassigned tickets

#### Technical Implementation
```javascript
// Sample API response structure
{
  "engineers": [
    {
      "id": "ENG001",
      "name": "Amit Patel",
      "role": "Senior Field Engineer",
      "phone": "+91 98765 43210",
      "avatar": "/avatars/amit.jpg",
      "status": "available",
      "location": {
        "lat": 23.0225,
        "lng": 72.5714,
        "timestamp": "2025-05-30T10:30:00Z",
        "accuracy": 10
      },
      "skills": ["Crop Protection", "Soil Analysis"],
      "vehicleType": "motorcycle",
      "shiftStart": "09:00",
      "shiftEnd": "18:00"
    }
  ]
}
```

### 2. Intelligent Call-to-Ticket Conversion

#### Workflow Design
1. **Incoming Call Simulation**:
   - Mock phone integration with caller ID
   - Pre-populate customer details if existing
   - Voice-to-text notes simulation

2. **Smart Form Fields**:
   - **Customer Information**:
     - Name (autocomplete from existing customers)
     - Phone number with validation
     - Address with Google Places Autocomplete
     - Farm/Business type
   
   - **Issue Classification**:
     - Category: Pest Control, Soil Issues, Crop Disease, Equipment
     - Priority: Low, Medium, High, Critical
     - Estimated duration: 1-4 hours
   
   - **Location Intelligence**:
     - Auto-detect customer location via geolocation
     - Snap to nearest road/address
     - Calculate distance to available engineers

3. **Engineer Assignment Logic**:
   - Sort by proximity (nearest first)
   - Filter by skill match
   - Consider current workload
   - Show ETA and availability window

#### Enhanced Features
- Photo upload with geolocation tagging
- Voice memo recording capability
- Automatic ticket numbering (SURAT-YYYYMMDD-001)
- SMS/WhatsApp notification to assigned engineer
- Real-time status updates

### 3. Advanced Route History Playback

#### Visualization Features
- **Animated Route Playback**:
  - Smooth polyline animation with speed control
  - Color-coded speed segments (green=normal, yellow=fast, red=speeding)
  - Stop detection (>5 minutes stationary)
  - Duration markers every 30 minutes

- **Analytics Dashboard**:
  - Total distance traveled
  - Average speed vs speed limits
  - Time spent at each location
  - Fuel efficiency calculations
  - Route optimization suggestions

#### Interactive Controls
- Play/Pause with spacebar support
- Speed controls: 0.5x, 1x, 2x, 4x, 8x
- Timeline scrubber for jumping to specific times
- Zoom to fit route
- Download route as GPX/KML

#### Data Structure
```javascript
{
  "routes": [
    {
      "id": "ROUTE001",
      "engineerId": "ENG001",
      "date": "2025-05-30",
      "startTime": "09:00:00",
      "endTime": "17:30:00",
      "coordinates": [
        {
          "lat": 23.0225,
          "lng": 72.5714,
          "timestamp": "2025-05-30T09:00:00Z",
          "speed": 0,
          "accuracy": 5
        }
      ],
      "stops": [
        {
          "location": { "lat": 23.0325, "lng": 72.5814 },
          "arrivalTime": "09:45:00",
          "departureTime": "10:30:00",
          "purpose": "Customer Visit - Ticket #1234"
        }
      ],
      "summary": {
        "totalDistance": 87.5,
        "drivingTime": "06:15:00",
        "avgSpeed": 14.2,
        "maxSpeed": 65,
        "fuelCost": 245.50
      }
    }
  ]
}
```

### 4. Behavioral Alerts Engine

#### Alert Types & Triggers
- **Late Start**: Engineer hasn't started shift within 15 minutes
- **Route Deviation**: >500m from expected route to assignment
- **Idle Time**: Stationary for >20 minutes during work hours
- **Speeding**: Velocity >80 km/h in city limits
- **Geofence Violation**: Entered restricted/unsafe areas
- **Low Battery**: Mobile device battery <20%
- **Missed Check-in**: No GPS ping for >10 minutes

#### Alert Management Interface
- **Real-time Stream**: Server-Sent Events simulation
- **Visual Hierarchy**:
  - Critical: Red border, immediate notification
  - Warning: Orange border, standard notification
  - Info: Blue border, passive notification
- **Bulk Actions**: Dismiss all, filter by type, export to CSV
- **Auto-Resolution**: Mark resolved when condition clears

#### Advanced Features
- Machine learning-based anomaly detection simulation
- Predictive alerts based on historical patterns
- Integration with external weather/traffic APIs
- Customizable alert thresholds per engineer

### 5. GeoFence-Based Attendance System

#### Dynamic Geofencing
- **Flexible Boundaries**:
  - Circular geofences with adjustable radius (50m-2km)
  - Polygon geofences for irregular job sites
  - Multiple nested zones (parking, work area, restricted)
  
- **Smart Detection**:
  - GPS accuracy consideration
  - Movement pattern analysis
  - Dwelling time requirements
  - Battery optimization strategies

#### Attendance Workflow
1. **Check-in Process**:
   - Slide-to-check-in gesture within geofence
   - Mandatory safety checklist completion
   - Photo verification option
   - Weather condition logging

2. **Continuous Monitoring**:
   - Background location tracking
   - Automatic break detection
   - Overtime calculation
   - Productivity metrics

3. **Check-out Automation**:
   - Auto check-out when leaving geofence
   - End-of-day summary generation
   - Expense pre-population

#### Enhanced Features
- **Nearby Colleague Finder**:
  - Show other engineers within 1km radius
  - Emergency contact system
  - Skill-based assistance requests

- **Historical Analytics**:
  - Attendance patterns
  - Site-wise time allocation
  - Productivity benchmarking

### 6. Comprehensive Expense Management

#### Monthly Dashboard
- **Financial Overview**:
  - Total expenses by category
  - Budget vs actual spending
  - Cost per kilometer analysis
  - Trend analysis over 6 months

- **Detailed Tracking**:
  - Automatic mileage calculation
  - Fuel receipt scanning simulation
  - Toll/parking fee logging
  - Meal allowance tracking

#### Administrative Controls
- **Approval Workflow**:
  - Manager review interface
  - Bulk approve/reject actions
  - Expense policy compliance checking
  - Audit trail maintenance

- **Cost Optimization**:
  - Route efficiency recommendations
  - Fuel station price comparisons
  - Vehicle maintenance cost tracking

### 7. Safety Management System

#### Pre-Ride Safety Checklist
- **Vehicle Inspection**:
  - Helmet condition and fitment
  - Brake functionality
  - Tire pressure and tread
  - Lights and indicators
  - Fuel level and engine oil

- **Personal Safety**:
  - High-visibility vest check
  - First aid kit availability
  - Emergency contact verification
  - Route safety briefing

#### Riding Hours Analytics
- **Time-based Analysis**:
  - Day hours (06:00-18:00)
  - Evening hours (18:00-22:00)
  - Night hours (22:00-06:00)
  - Peak traffic hours identification

- **Safety Metrics**:
  - Night riding percentage
  - High-risk route identification
  - Weather-based risk assessment
  - Incident correlation analysis

### 8. Administrative Configuration

#### Cost Management Matrix
- **Vehicle-based Rates**:
  - Motorcycle: ₹3.50/km
  - Car: ₹8.00/km
  - Electric vehicle: ₹2.00/km
  - Public transport: Actual fare

- **User-specific Overrides**:
  - Senior engineer premium rates
  - Specialized skill bonuses
  - Regional cost adjustments
  - Seasonal rate modifications

#### System Settings
- **Operational Parameters**:
  - GPS update intervals
  - Geofence sensitivity
  - Alert thresholds
  - Working hour definitions

### 9. Authentication & Security

#### Mock Authentication Flow
- **Login Methods**:
  - Email/password authentication
  - Mobile OTP verification
  - Biometric authentication simulation
  - Remember device option

- **Session Management**:
  - JWT token simulation
  - Auto-logout after inactivity
  - Multi-device session handling
  - Password reset workflow

#### Security Features
- **Data Protection**:
  - Local storage encryption
  - API request signing
  - Sensitive data masking
  - Audit logging

### 10. Responsive Layout & Navigation

#### Mobile-First Design
- **Breakpoint Strategy**:
  - Mobile: <768px (primary focus)
  - Tablet: 768px-1024px
  - Desktop: >1024px
  - Large screens: >1440px

#### Navigation Architecture
- **Header Components**:
  - Corteva logo with company colors
  - Notification badge with count
  - User avatar with dropdown menu
  - Global search functionality

- **Mobile Navigation**:
  - Hamburger menu with smooth animations
  - Bottom navigation for core features
  - Swipe gestures for tab navigation
  - Contextual action buttons

#### Footer Elements
- **Information Links**:
  - Privacy policy
  - Terms of service
  - Help documentation
  - Contact support

- **Version Information**:
  - App version number
  - Last update timestamp
  - Environment indicator
  - API status indicator

## Performance Optimization

### Loading & Caching Strategy
- **Initial Load**:
  - Critical CSS inlining
  - Progressive image loading
  - Service worker registration
  - Essential data prefetching

- **Runtime Optimization**:
  - Virtual scrolling for large lists
  - Map tile caching
  - API response caching
  - Background sync capabilities

### Offline Functionality
- **Offline-First Features**:
  - Route history viewing
  - Expense entry
  - Safety checklist completion
  - Basic attendance logging

- **Sync Strategy**:
  - Background sync when online
  - Conflict resolution logic
  - Data integrity validation
  - User notification of sync status

## Testing & Quality Assurance

### Test Coverage Requirements
- **Unit Tests**: >90% coverage for utility functions
- **Integration Tests**: API endpoints and data flow
- **E2E Tests**: Critical user journeys
- **Performance Tests**: Load time and responsiveness

### Browser Compatibility
- **Primary Support**: Chrome 90+, Safari 14+, Firefox 88+
- **Mobile Support**: iOS Safari 14+, Chrome Mobile 90+
- **PWA Features**: Service worker, web app manifest
- **Accessibility**: WCAG 2.1 AA compliance

## Deployment & Infrastructure

### Environment Configuration
- **Development**: Local JSON server with hot reload
- **Staging**: Mock API with realistic latency simulation
- **Production**: CDN deployment with edge caching

### Monitoring & Analytics
- **Performance Monitoring**:
  - Core web vitals tracking
  - API response time monitoring
  - Error rate tracking
  - User engagement metrics

## Future Enhancement Roadmap

### Phase 2 Features
- **Advanced Analytics**:
  - Machine learning insights
  - Predictive maintenance
  - Customer behavior analysis
  - ROI optimization

### Integration Possibilities
- **External Systems**:
  - CRM integration
  - ERP system connectivity
  - Weather service APIs
  - Traffic information services

## Success Metrics & KPIs

### Technical Metrics
- **Performance**: <3s initial load time, <1s subsequent navigation
- **Reliability**: 99.9% uptime, <0.1% error rate
- **User Experience**: >4.5/5 user satisfaction score

### Business Metrics
- **Efficiency**: 20% reduction in response time
- **Cost Savings**: 15% reduction in fuel costs
- **Productivity**: 25% increase in daily service calls

---