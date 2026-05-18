# Eventor Mobile App

An event planner mobile app for group members: users can login, view their groups and events, join / leave events, comment on events and receive in-app notifications.

The mobile app implements only the most important end-user functionality. Group management, event administration and advanced admin functionality remain in the Web app.

# Tech Guidelines

- Technologies: React Native + Expo + Expo Router
- Back-end: Eventor RESTful API, with "Bearer token" auth
- Back-end API source code: `..\eventor-web\src\app\api`
- Use the same shared business rules as the Web app through the RESTful API.
- Store the authentication token securely on the mobile side.
- Use modular design:
  - split screens, forms, cards, lists, API clients and utilities into separate files
  - avoid too much code in a single file
  - reuse repeating UI components such as event cards, group cards, buttons, empty states and loading indicators

# Core Mobile Functionality

- Authentication:
  - login
  - register, if included in the mobile scope
  - logout
- Groups:
  - view groups where the logged-in user is a member
  - view group details
- Events:
  - view upcoming, current and past events in the user’s groups
  - view event details
  - join / leave an event
  - see participant count and capacity status
  - see event status: upcoming | current | past | cancelled
- Comments:
  - view event comments
  - add comment
  - optionally edit / delete own comments
- Notifications:
  - view in-app notifications related to group events
  - mark notifications as read

# Mobile User Interface Guidelines

- Implement user-friendly mobile UI.
- Use Expo Router with stack navigation.
- Use responsive layouts for both smartphones and tablets.
- Design the app mobile-first:
  - clear navigation
  - large touch targets
  - simple screens
  - readable event cards
  - visible event status and action buttons
- Use loading, error and empty states for all API-based screens.
- Use visual cues for event state:
  - upcoming
  - current
  - past
  - cancelled
  - full / under capacity / over capacity
- Mobile UI Alerts:
  - ensure all native alerts, confirms and other system dialogs have a fallback for Web
  - implement Web fallbacks as modal popups
- Keep the mobile app focused and lightweight. Do not implement complex group manager dashboards or admin panels in the mobile version.