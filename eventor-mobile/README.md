# Eventor Mobile

Expo mobile client for Eventor. The mobile app is focused on member workflows:
login, registration, event browsing, event details, join/leave actions, reserved slots, comments, notifications, and profile/logout.

## Environment

The mobile client calls the Next.js REST API through:

```bash
EXPO_PUBLIC_API_BASE_URL=https://eventor-web.netlify.app/api
```

For local development against a local backend, temporarily change this value to your local API URL, for example:

```bash
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000/api
```

On a physical device, use your machine LAN address instead of `localhost`.

## Local Development

From the repository root:

```bash
npm install
npm run dev --workspace eventor-mobile
```

Common Expo targets:

```bash
npm run android --workspace eventor-mobile
npm run ios --workspace eventor-mobile
npm run web --workspace eventor-mobile
```

## Production Web Export

Build the static Expo web export from the repository root:

```bash
npm run build --workspace eventor-mobile
```

The generated deploy folder is:

```text
eventor-mobile/dist
```

Netlify settings:

- Build command: `npm run build --workspace eventor-mobile`
- Publish directory: `eventor-mobile/dist`

## Quality Checks

```bash
npm run lint --workspace eventor-mobile
npm run build --workspace eventor-mobile
```
