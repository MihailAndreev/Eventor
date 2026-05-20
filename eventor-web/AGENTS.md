
# Eventor Next.js App

- Eventor is an event planner app for creating and managing group events.
- Registered users can create groups and automatically become group managers for the groups they create.
- Group managers can create, edit, cancel and delete events inside their groups.
- Group members can view group events, join / leave events, comment on events and receive in-app notifications.
- Events can include title, description, date, time, location, participant capacity and status.
- The app supports group-based access: users only see and interact with events in groups where they are members.

# Technologies

- Next.js + Neon DB + Drizzle ORM + React + Tailwind
- TypeScript
- PostgreSQL database hosted in Neon
- Drizzle Kit migrations for all database schema changes
- Back-end API source code: `..\eventor-web\scr\api`

# Architectural Guidelines

- Use a **client-server architecture**:
  - Next.js Web app communicates with the backend through Server Actions.
  - RESTful API endpoints expose the backend functionality for possible mobile app usage.
- **Service layer**:
  - Implement all main business logic in services.
  - Services are used by both Server Actions and RESTful API route handlers.
  - Avoid duplicating business logic inside UI components or API endpoints.
- Use **modular design**:
  - Split the app into self-contained components and modules.
  - Keep separate files for UI components, services, database access, validation, auth and utilities.
  - Avoid large files with too much mixed logic.
- **Auth**:
  - Use JWT tokens for authentication.
  - Store passwords securely using bcrypt.
  - Use cookies for Web sessions and Bearer tokens for RESTful API access.
- **Authorization**:
  - Enforce role-based access checks for group managers and group members.
  - Only group managers can manage groups and events.
  - Group members can view, join, leave and comment on events.
- **Database**:
  - Use Neon DB + Drizzle ORM.
  - Always use Drizzle migrations for schema changes / store migration locally.
  - Use indexes and server-side paging for lists with many users, groups, events or comments.

# User Interface Guidelines

- Implement a modern, clean and responsive UI.
- Use Next.js App Router and server-rendered components by default.
- Use server-side rendering for pages that load groups, events and comments from the database.
- Use client components only when browser interaction is needed, for example:
  - login / register forms
  - create / edit event forms
  - join / leave event buttons
  - comment forms
  - notification interactions
  - modals, dropdowns and dynamic UI controls
- Split the UI into reusable components:
  - layout components
  - group cards
  - event cards
  - event details sections
  - member lists
  - comment lists
  - forms and buttons
- Use visual cues for event state:
  - upcoming
  - current
  - past
  - cancelled
  - full / under capacity / over capacity
- Design mobile-first and ensure the app works well on desktop and mobile browsers.