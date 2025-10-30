# Real-Time Order Notifications System

## Overview
The admin dashboard now includes a real-time notification system that alerts administrators whenever new orders are placed.

## Features

### 1. **Admin Sidebar Badge** 
- Shows a red badge with the count of pending orders
- Updates in real-time when new orders arrive
- Badge appears on the "Orders" menu item

### 2. **Header Notification Bell**
- Bell icon in the top-right corner of the admin header
- Red badge showing unread notification count
- Click to view a dropdown list of recent pending orders
- Badge disappears when dropdown is opened

### 3. **Real-Time Updates**
- Uses Supabase Real-Time subscriptions
- Listens for INSERT events on the `orders` table
- Automatically updates the UI when new orders are created
- Shows toast notifications with order details

### 4. **Toast Notifications**
- Appears in the top-right corner when a new order arrives
- Shows order number and customer name
- Includes a bell emoji (🔔) for visual appeal
- Stays visible for 5 seconds

## Technical Implementation

### Sidebar Component (`AdminSidebar.tsx`)
```typescript
// Tracks pending orders count
const [newOrdersCount, setNewOrdersCount] = useState(0);

// Subscribes to real-time order changes
useEffect(() => {
  fetchNewOrdersCount();
  
  const channel = supabase
    .channel('orders-changes')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'orders',
    }, (payload) => {
      setNewOrdersCount((prev) => prev + 1);
      toast.success('🔔 New order received!');
    })
    .subscribe();
    
  return () => supabase.removeChannel(channel);
}, []);
```

### Header Component (`AdminHeader.tsx`)
```typescript
// Tracks recent orders and unread count
const [recentOrders, setRecentOrders] = useState<Order[]>([]);
const [unreadCount, setUnreadCount] = useState(0);

// Fetches and displays the 5 most recent pending orders
const fetchRecentOrders = async () => {
  const { data } = await supabase
    .from('orders')
    .select('id, order_number, customer_name, created_at, status')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(5);
    
  setRecentOrders(data || []);
  setUnreadCount(data?.length || 0);
};
```

## How It Works

1. **Initial Load**: 
   - Both sidebar and header fetch the count of pending orders from Supabase
   - Displays the count in badges

2. **New Order Created**:
   - Customer places an order (status: 'pending')
   - Supabase broadcasts the INSERT event
   - Both components receive the real-time update
   - Sidebar badge count increases
   - Header notification list updates
   - Toast notification appears

3. **Order Status Changed**:
   - Admin updates order status from 'pending' to 'confirmed' or 'delivered'
   - Supabase broadcasts the UPDATE event
   - Sidebar badge count decreases
   - Header notification list refreshes

4. **Viewing Notifications**:
   - Click the bell icon to see recent orders
   - Click "View All" to go to orders page
   - Click individual order to view details
   - Badge resets to 0 when dropdown opens

## Database Requirements

Make sure your Supabase database has real-time enabled for the `orders` table:

```sql
-- Enable real-time for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

## Browser Permissions

For future enhancements, you can add browser notifications:

```typescript
// Request notification permission
if ('Notification' in window) {
  Notification.requestPermission();
}

// Show browser notification
if (Notification.permission === 'granted') {
  new Notification('New Order', {
    body: `Order #${orderNumber} from ${customerName}`,
    icon: '/logo.png'
  });
}
```

## Customization

### Change notification duration:
```typescript
toast.success('Message', {
  duration: 5000, // milliseconds
});
```

### Change notification position:
```typescript
toast.success('Message', {
  position: 'top-right', // or 'top-left', 'bottom-right', etc.
});
```

### Filter by different order status:
```typescript
// Show only confirmed orders instead of pending
.eq('status', 'confirmed')
```

## Troubleshooting

### Notifications not appearing:
1. Check Supabase console for real-time enabled tables
2. Verify browser console for errors
3. Ensure Supabase connection is active
4. Check RLS policies allow reading orders

### Badge count incorrect:
1. Refresh the page to re-sync
2. Check database for actual pending order count
3. Verify UPDATE events are properly handled

## Future Enhancements

- [ ] Add sound effects for new orders
- [ ] Browser push notifications
- [ ] Email notifications for orders
- [ ] SMS notifications via Twilio
- [ ] Mark individual notifications as read
- [ ] Filter notifications by order status
- [ ] Search within notifications
- [ ] Export notification history
