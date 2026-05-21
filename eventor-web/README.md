# Eventor

Build **Eventor**: a software product for groups of people who plan, organize and join shared events.

## Testing

Run unit tests with:

```bash
npm test
```

Run Web API and backend integration tests with:

```bash
npm run test:integration
```

Integration tests require `TEST_DATABASE_URL` in `eventor-web/.env`. It must point to a Neon test branch, not production. The integration runner refuses to start when `TEST_DATABASE_URL` is missing or when it matches the original `DATABASE_URL`; during the run it maps `DATABASE_URL` to `TEST_DATABASE_URL`, applies Drizzle migrations, truncates the application tables, and seeds deterministic test data.

Eventor is suitable for friends, colleagues, clubs, hobby groups, hiking groups, study groups, family groups and communities with recurring activities.

- The app holds groups, where events are organized.
- Groups have managers and members.
- Members can join groups by invitation link or open specific events through event invite links, depending on the access rules.
- Events are announced in groups.
- Group members can:
  - join events
  - leave events
  - comment on events
  - follow event updates
  - view event content
- Events can be:
  - unlimited
  - limited by capacity
- Limited events support a waiting list.
- When a participant leaves a full limited-capacity event:
  - the first waiting user is automatically promoted to participant
  - the promoted user receives an in-app notification
- Each event can hold rich content:
  - article text or description
  - announcements
  - photos or files
  - video links
  - external links
  - comments
- Event visibility is limited to:
  - group-only access
  - invite-link access
- Public events are out of scope for V1.

# Core Product Decisions

- Groups vs. events:
  - Groups are permanent communities.
  - Events are concrete activities inside a group.

- Capacity:
  - Events can be unlimited or limited.
  - Limited events support automatic waiting list promotion.

- Notifications:
  - Eventor uses in-app notifications stored in the database.
  - Real email notifications and push notifications are out of scope for V1.

- Visibility:
  - Eventor supports group-only and invite-link visibility.
  - Public event directory is out of scope for V1.

- Event content:
  - Events can include article text, photos or files, video links, external links, announcements and comments.

- Mobile scope:
  - The mobile app implements only member functionality:
    - login / register
    - view events
    - join / leave events
    - view waiting list status
    - comments
    - notifications

# Groups and Events

In Eventor, groups and events are different concepts.

- Group:
  - A permanent community of users with common interest and shared event history.
  - Example: Luxembourg Hiking Friends.

- Event:
  - A concrete activity with date, time, location, capacity and participants.
  - Example: Saturday hike in Mullerthal.

- Group member:
  - A user who has access to the group and can view its events.
  - Example: Mihail is a member of Luxembourg Hiking Friends.

- Event participant:
  - A group member who joined a specific event.
  - Example: Mihail joins the Saturday hike.

- Waiting user:
  - A user who wants to attend a full limited-capacity event.
  - Example: Mihail is first in the queue for a sold-out event.

# Roles in the App

- Visitor:
  - Can view the home page.
  - Can register.
  - Can login.

- User:
  - Can manage own profile.
  - Can create a group.
  - Can join groups by invitation.
  - Can view own dashboard.

- Group member:
  - Can browse group events.
  - Can join / leave events.
  - Can comment on events.
  - Can view event content.
  - Can share event links.

- Event organizer:
  - Can create events in a group.
  - Can manage own events.
  - Can manage participants.
  - Can publish announcements.

- Group manager:
  - Can manage group data.
  - Can manage group members.
  - Can manage group managers.
  - Can manage all group events.
  - Can manage group invite links.

- Admin optional:
  - Can view / manage all users.
  - Can view / manage all groups.
  - Can view / manage all events.
  - Can manage reported content.

# Visitors

Visitors are anonymous users who visit the Eventor Web site.

- Visitors can see:
  - the app home page
  - general product description
  - register and login links
- Visitors can register with email and password.
- Visitors can login if they already have an account.
- Visitors who open a group invite or event invite link should be redirected to login/register before accepting the invite.

# Registered Users

Registered users have a profile with name, email and optional photo.

- Registered users can login and logout.
- Registered users can manage their own profile.
- Registered users can create a new group.
- When a registered user creates a new group:
  - they automatically become group manager for this group.
- Registered users can join existing groups by invitation link.
- Registered users can open invite-link events and join them if allowed by the group/event rules.

# Group Managers

Group managers manage their groups and organize group events.

- Group managers can manage group information:
  - title
  - description
  - invite settings
  - members
  - managers

- Group managers can organize events in their groups:
  - create events
  - edit events
  - cancel events
  - delete events

- Group managers can invite users to the group by sharing a group invite link.
- Group managers can promote other group members as group managers.
- Group managers can remove group manager permissions from other users.
- Group managers can remove users from the group.
- Group managers can moderate comments and event content inside their groups.
- Group managers can manage all events in their group, even if they are not the original event organizer.

# Event Organizers

The user who creates an event becomes the event organizer.

- Event organizers can edit event details.
- Event organizers can cancel the event.
- Event organizers can manage participants.
- Event organizers can publish official announcements.
- Event organizers can see:
  - confirmed participants
  - waiting list users
  - declined users
  - users who left the event
- Group managers can manage all group events, including events created by other organizers.

# Group Members and Events

Group members can browse events in their groups.

The Web app should always display the state of each event and important participation information.

- Upcoming event:
  - The current time is before the event start time.

- Current event:
  - The current time is between the event start time and the event end time.

- Past event:
  - The current time is after the event end time.

- Canceled event:
  - The event was canceled by an organizer or group manager.

- An event is open to join or leave when:
  - it is upcoming or current
  - it is not canceled

- Past events are read-only for participation.
- Past events can still show:
  - comments
  - announcements
  - media
  - external links

- Canceled events are visible with a clear canceled label.
- Canceled events cannot be joined.
- The event details screen displays:
  - event title
  - event description
  - date and time
  - location
  - capacity mode
  - participants
  - waiting list
  - comments
  - announcements
  - content
  - links

# Event Capacity and Waiting List

Eventor supports two capacity modes: unlimited and limited.

- Unlimited capacity:
  - Any allowed group member can join.
  - There is no maximum participant limit.
  - There is no waiting list.

- Limited capacity:
  - The event has a maximum number of participants.
  - Users join as confirmed participants while capacity is available.
  - When the event is full, new users join the waiting list.

Automatic waiting list promotion:

- When a confirmed participant leaves a full limited event:
  - the first waiting user is promoted automatically
  - the promoted user becomes a confirmed participant
  - the promoted user receives an in-app notification

- Waiting list promotion should be handled in a service function, for example:
  - `promoteNextFromWaitlist(eventId)`

- The promotion operation should be implemented safely:
  - preferably as a database transaction
  - to avoid promoting two users to the same available slot

# RSVP / Participation Statuses

Event participation can have several statuses.

- going:
  - The user is confirmed as participant.

- waiting:
  - The user is in the waiting list because the limited event is full.

- declined:
  - The user explicitly declined the event invitation.

- left:
  - The user joined earlier but later left the event.

- removed:
  - The user was removed by an organizer or group manager.

# Event Content

Each event has a content area.

This gives Eventor a stronger identity than a simple join / leave planner and makes it useful before, during and after the event.

- Article / description:
  - Use rich text or plain Markdown-like text.
  - Store it in the event table or in a separate event content / event posts table.

- Announcements:
  - Official updates created by the organizer or group manager.
  - Used for important event-related information.

- Photos / files:
  - Optional for V1 but recommended as a bonus feature.
  - Files can be uploaded to object storage such as Cloudflare R2.
  - File metadata should be stored in PostgreSQL.

- Video:
  - Store video links only in V1.
  - Avoid real video uploads and streaming.

- External links:
  - Store URL, title and optional description.

- Comments:
  - Thread-free comments listed below the event details.
  - Comments can be edited or deleted by their owner.
  - Comments can be moderated by event organizers and group managers.

- Announcements can be created only by:
  - event organizers
  - group managers

# Event Visibility and Invite Links

Eventor V1 supports limited event visibility.

- group_only:
  - Only members of the group can view and join the event.

- invite_link:
  - Users with the event invite link can open the event.
  - Login/register is required before joining.

- Public event directory is out of scope for V1.
- A group invite link allows a user to join the group.
- An event invite link allows a user to open a specific event and join it if the event rules allow it.
- Invite links should use random invite codes stored in the database.

# In-App Notifications

Eventor uses database-backed in-app notifications.

This avoids email and push notification complexity while still demonstrating useful event-driven business logic.

Notifications can be created when important actions happen.

- Waiting list promotion:
  - Example notification:
    - You have been moved from the waiting list to the participants list.

- Event canceled:
  - Example notification:
    - The event “Saturday Hike” was canceled.

- Event updated:
  - Example notification:
    - The event details were updated. Please review the new time/location.

- New announcement:
  - Example notification:
    - A new official announcement was posted for your event.

- Comment moderation:
  - Example notification:
    - Your comment was removed by a manager.

Notification rules:

- Notifications have read/unread state.
- Notifications are visible in a Notifications page or screen.
- Notifications can be created by service functions when important actions happen.

# Web App and Mobile App

- The Web app is the primary app for the project.
- The Web app implements the complete functionality:
  - users
  - groups
  - group members
  - group managers
  - events
  - event management
  - event content
  - participants
  - waiting list
  - notifications

- The mobile app is additional and scope-limited.
- The mobile app implements only the most important group member functionality:
  - login / register
  - view events
  - join / leave event
  - view waiting list status
  - comment
  - view notifications

# Recommended Web App Screens

- Home:
  - Path: `/`
  - Purpose:
    - Landing page with product explanation and register/login links.

- Register:
  - Path: `/register`
  - Purpose:
    - Create account.

- Login:
  - Path: `/login`
  - Purpose:
    - Login with email/password.

- Dashboard:
  - Path: `/dashboard`
  - Purpose:
    - User overview.
    - Shows my groups, my events and notifications.

- Groups list:
  - Path: `/groups`
  - Purpose:
    - List groups where the user is a member or manager.

- Group details:
  - Path: `/groups/[id]`
  - Purpose:
    - Group profile.
    - Group members.
    - Upcoming events.

- Create group:
  - Path: `/groups/new`
  - Purpose:
    - Create new group.

- Edit group:
  - Path: `/groups/[id]/edit`
  - Purpose:
    - Edit group title, description and invite settings.

- Event details:
  - Path: `/events/[id]`
  - Purpose:
    - Main event page.
    - Shows details, participants, content, comments and event actions.

- Create event:
  - Path: `/groups/[id]/events/new`
  - Purpose:
    - Create event inside a group.

- Edit event:
  - Path: `/events/[id]/edit`
  - Purpose:
    - Edit event details, capacity, visibility and location.

- Manage participants:
  - Path: `/events/[id]/participants`
  - Purpose:
    - Manage participants and waiting list.

- Notifications:
  - Path: `/notifications`
  - Purpose:
    - View read and unread in-app notifications.

- Profile:
  - Path: `/profile`
  - Purpose:
    - Manage user profile.

- Admin panel optional:
  - Path: `/admin`
  - Purpose:
    - Manage all users, groups and events.

# Recommended Mobile App Screens

- Home:
  - Intro screen with login/register actions.

- Login:
  - Login with email/password.

- Register:
  - Create account.

- Events:
  - List upcoming and current events available to the user.

- Event Details:
  - View event details.
  - View participant status.
  - View capacity and waiting list status.
  - View event content.

- Comments:
  - View comments for an event.
  - Add comment for an event.

- Notifications:
  - View in-app notifications.

- Profile:
  - View profile.
  - Logout.
