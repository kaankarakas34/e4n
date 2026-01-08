# Admin Reports Dashboard Implementation Plan

## Overview
Create a comprehensive administrative reporting dashboard to visualize key metrics regarding groups, members, financials, and activities. This dashboard will help admins interpret the network's health at a glance.

## User Requirements
- **Key Metrics**:
  - Total Groups & Power Teams.
  - Total Members (Active).
  - Financials: Total Revenue, Group vs External Revenue.
  - Activities: One-to-Ones, Visitors, Substitutes (Vekil), Event Participation.
  - Member Churn (Lost Members).
- **Breakdowns**:
  - By Group.
  - By City (Geo).
  - Monthly Trends.

## Proposed Components

### 1. Backend Endpoints (`server/src/index.js`)
We will create efficient aggregation queries using PostgreSQL.

- **`GET /api/admin/stats`**: Returns scaler values for the top KPI cards.
  - `totalGroups`, `totalPowerTeams`.
  - `totalMembers`, `lostMembersCount` (last 30 days or all time?).
  - `totalRevenue`, `revenueInternal`, `revenueExternal`.
  - `meetingCount`, `oneToOneCount`, `visitorCount`.
  
- **`GET /api/admin/stats/charts`**: Returns array data for charts.
  - `revenueTrend`: [{ month: 'Jan', amount: 1000 }, ...]
  - `memberGrowth`: [{ month: 'Jan', count: 30 }, ...]
  - `visitorTrend`: [{ month: 'Jan', count: 5 }, ...]
  
- **`GET /api/admin/stats/groups`**: Returns tabular data per group.
  - Group Name, Member Count, Revenue, Attendance Rate, etc.

### 2. Frontend Page (`src/pages/AdminReports.tsx`)
A new high-fidelity dashboard page using `recharts`.

- **KPI Cards Row**: 
  - 4-column grid showing critical numbers with small trend indicators (e.g. "+5% vs last month" if data allows).
- **Charts Section**:
  - **Revenue & Goal**: Bar chart showing monthly revenue.
  - **Member & Growth**: Line chart showing net member count.
  - **Activity Radar**: Radar chart or Bar chart comparison events/1-2-1s/visitors.
  - **Geo Distribution**: Simple Bar chart of Top Cities.
- **Detailed Group Table**:
  - Sortable table showing each group's performance metrics.

### 3. Additional Suggested Metrics
- **Average Network Score**: Aggregate of all member `performance_score`.
- **Referral Success Rate**: % of referrals that converted to business.
- **Retention Rate**: % of members renewing.

## Implementation Steps
1.  **Backend**: Implement aggregation queries in `server/src/index.js`.
2.  **API Client**: Add methods to `src/api/api.ts`.
3.  **UI Construction**: Create `AdminReports.tsx` with layout and `recharts` integration.
4.  **Navigation**: Add "Raporlar" link to Admin Sidebar in `Navigation.tsx`.

## Verification
- Validate charts match seeded data.
- Check performance of aggregation queries.
