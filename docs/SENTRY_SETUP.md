# Sentry Setup Guide

This guide explains how to configure Sentry for error tracking and performance monitoring in Nucigen Labs.

## 📋 Prerequisites

1. A Sentry account (sign up at [sentry.io](https://sentry.io))
2. A Sentry project created for your application
3. Your Sentry DSN (Data Source Name)

## 🔧 Configuration

### 1. Get Your Sentry DSN

1. Go to your Sentry project dashboard
2. Navigate to **Settings** → **Projects** → **[Your Project]** → **Client Keys (DSN)**
3. Copy your DSN (it looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`)

### 2. Add Environment Variable

#### Local Development (.env)

Add to your `.env` file:

```env
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
VITE_SENTRY_DEBUG=false  # Set to true to send events in dev mode
```

#### Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `VITE_SENTRY_DSN` | `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx` | Production, Preview, Development |
| `VITE_SENTRY_DEBUG` | `false` | Production, Preview |
| `VITE_SENTRY_DEBUG` | `true` | Development (optional, for testing) |

### 3. Optional: Set App Version

To track releases in Sentry, add a version variable:

```env
VITE_APP_VERSION=1.0.0
```

Or in Vercel, you can use the deployment URL or commit SHA.

## 🚀 Features

### Error Tracking

- **Automatic Error Capture**: All unhandled errors are automatically captured
- **React Error Boundaries**: Errors caught by ErrorBoundary are sent to Sentry
- **Manual Error Capture**: Use `captureException()` and `captureMessage()` helpers

### Performance Monitoring

- **Transaction Tracing**: Automatically tracks page loads and navigation
- **Sample Rate**: 10% in production, 100% in development
- **Custom Transactions**: Can be added for specific operations

### Session Replay

- **Error Replays**: Always captures replays when errors occur
- **Session Replays**: 10% sample rate in production (requires Sentry Replay addon)

### User Context

- **Automatic User Tracking**: User information from Clerk is automatically synced
- **User Identification**: Errors are tagged with user ID, email, and username

## 📝 Usage Examples

### Manual Error Capture

```typescript
import { captureException, captureMessage } from '../lib/sentry';

try {
  // Some code that might fail
} catch (error) {
  captureException(error, {
    component: 'MyComponent',
    action: 'fetchData',
    userId: user?.id,
  });
}
```

### Manual Message Capture

```typescript
import { captureMessage } from '../lib/sentry';

captureMessage('User performed important action', 'info');
```

### Set Custom Context

```typescript
import * as Sentry from '@sentry/react';

Sentry.setContext('custom', {
  feature: 'markets',
  action: 'view_chart',
});
```

## 🔍 Filtering

Sentry is configured to filter out:

- Browser extension errors
- Network errors that are often not actionable
- Third-party script errors
- Console.log breadcrumbs (to reduce noise)

## 🧪 Testing

### Test Error Tracking

1. Set `VITE_SENTRY_DEBUG=true` in your `.env`
2. Trigger an error in your app
3. Check your Sentry dashboard for the error

### Test in Production

1. Deploy to Vercel with `VITE_SENTRY_DSN` configured
2. Trigger a test error (you can add a test button temporarily)
3. Verify the error appears in Sentry

## 📊 Monitoring

### View Errors

1. Go to your Sentry project dashboard
2. Navigate to **Issues** to see all errors
3. Click on an issue to see:
   - Error details and stack trace
   - User information
   - Browser and device info
   - Session replay (if enabled)
   - Performance data

### View Performance

1. Navigate to **Performance** in Sentry
2. See transaction traces for page loads and API calls
3. Identify slow operations

## 🔐 Security

- **DSN is Public**: The DSN is safe to expose in frontend code (it's public by design)
- **No Sensitive Data**: Sentry automatically filters out sensitive data (passwords, tokens, etc.)
- **User Privacy**: User IDs are hashed by default

## 🛠️ Troubleshooting

### Errors Not Appearing in Sentry

1. **Check DSN**: Verify `VITE_SENTRY_DSN` is set correctly
2. **Check Environment**: In development, errors are only sent if `VITE_SENTRY_DEBUG=true`
3. **Check Browser Console**: Look for Sentry initialization messages
4. **Check Network Tab**: Verify requests to `sentry.io` are being made

### Too Many Errors

1. **Adjust Filters**: Modify `ignoreErrors` in `src/lib/sentry.ts`
2. **Adjust Sample Rate**: Reduce `tracesSampleRate` for performance monitoring
3. **Adjust Replay Rate**: Reduce `replaysSessionSampleRate` for session replays

### Performance Impact

- Sentry is lightweight and runs asynchronously
- If you notice performance issues, reduce sample rates
- Consider disabling session replay if not needed

## 📚 Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Sentry React Integration](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Session Replay](https://docs.sentry.io/product/session-replay/)

## ✅ Checklist

- [ ] Sentry account created
- [ ] Sentry project created
- [ ] DSN copied
- [ ] `VITE_SENTRY_DSN` added to `.env` (local)
- [ ] `VITE_SENTRY_DSN` added to Vercel environment variables
- [ ] Test error sent successfully
- [ ] User context syncing correctly
- [ ] Performance monitoring working
- [ ] Alerts configured (optional)
