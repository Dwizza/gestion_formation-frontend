# Toast Notification System Documentation

## Overview
This system displays alert notifications in the top-right corner of the screen when new notifications are received. Each toast notification appears for 10 seconds as requested.

## Components

### 1. Toast Component (`src/components/ui/Toast.tsx`)
- Displays individual toast notifications
- Shows title, message, and type-specific styling
- Includes progress bar showing remaining time
- Auto-dismisses after 10 seconds
- Can be manually closed with X button

### 2. ToastContext (`src/contexts/ToastContext.tsx`)
- Manages multiple toast notifications
- Provides functions to show notifications
- Handles toast stacking and positioning
- Includes test functions for debugging

### 3. useNotificationToast Hook (`src/hooks/useNotificationToast.ts`)
- Monitors for new notifications every 30 seconds
- Compares with last check time to detect new notifications
- Automatically shows toast for each new notification
- Filters out existing notifications to avoid spam

## Integration

### App Level Integration
The `ToastProvider` is integrated at the app level in `App.tsx`:
```tsx
<BrowserRouter>
  <AuthProvider>
    <SidebarProvider>
      <ToastProvider>
        <AppRoutes />
      </ToastProvider>
    </SidebarProvider>
  </AuthProvider>
</BrowserRouter>
```

### Layout Level Integration
The notification monitoring is activated in `MainLayout.tsx` for authenticated users:
```tsx
const MainLayout: React.FC<MainLayoutProps> = ({ userRole, children }) => {
  // Initialize notification toast monitoring
  useNotificationToast();
  // ...
}
```

## How It Works

1. **Initialization**: When a user logs in and the MainLayout loads, the `useNotificationToast` hook starts monitoring
2. **Periodic Checks**: Every 30 seconds, the hook calls the API to get all notifications
3. **New Notification Detection**: Compares notification creation dates with the last check time
4. **Toast Display**: For each new notification found, a toast appears in the top-right corner
5. **Auto-dismiss**: Each toast disappears after 10 seconds with a visual progress bar

## Testing

A debug component is available at `/debug` page that allows manual testing of toast notifications:
- Test Basic Toast
- Test Payment Reminder Toast  
- Test Urgent Toast

## Customization

### Toast Types
- `info` (default) - Blue styling
- `success` - Green styling
- `warning` - Yellow styling
- `error` - Red styling

### Duration
Currently set to 10 seconds as requested, but can be customized by modifying the `duration` parameter in the `showNotificationToast` function.

### Styling
The toast uses Tailwind CSS classes and can be customized by modifying the `Toast.tsx` component.

## API Requirements

The system expects the notification API to return notifications with:
- `id`: Unique identifier
- `titre`: Notification title
- `message`: Notification content
- `dateCreation`: Creation timestamp (ISO string format)

## Future Enhancements

- Sound notifications
- Browser push notifications (when tab is not active)
- Different toast positions
- Notification categories with different styling
- Persistent notification history
