import type { AppNotification, Order, Shop, UserRole } from '@/models';
import { listConversations } from '@/services/chat';
import { listAllShops, listOwnerShops } from '@/services/management';
import { listOrders } from '@/services/order-management';

function orderNotification(order: Order, role: UserRole): AppNotification {
  const status = order.status.replaceAll('_', ' ');
  const title = role === 'customer' ? 'Order update' : 'New order activity';
  return {
    id: `order-${order.id}-${order.status}`,
    title,
    message:
      role === 'customer'
        ? `Order #${order.id.slice(0, 8)} is now ${status}.`
        : `Order #${order.id.slice(0, 8)} is ${status}.`,
    createdAt: order.createdAt,
    route: role === 'customer' ? '/app/orders' : role === 'owner' ? '/app/owner/orders' : '/app/admin/orders',
  };
}

function shopNotification(shop: Shop): AppNotification {
  return {
    id: `shop-${shop.id}-pending`,
    title: 'Shop approval needed',
    message: `${shop.name} is waiting for approval.`,
    createdAt: shop.createdAt,
    route: '/app/admin/shops',
  };
}

export async function listNotifications(role: UserRole, userId: string): Promise<AppNotification[]> {
  const conversations = await listConversations(userId);
  const messageNotifications = conversations
    .filter((conversation) => conversation.unreadCount > 0)
    .map((conversation) => {
      const sender = conversation.participants.find((participant) => participant.uid !== userId);
      return {
        id: `message-${conversation.id}-${conversation.unreadCount}`,
        title: 'New message',
        message: `${sender?.fullName ?? 'Someone'} sent you ${conversation.unreadCount === 1 ? 'a message' : `${conversation.unreadCount} messages`}.`,
        route: role === 'customer' ? '/app/orders' : role === 'owner' ? '/app/owner/orders' : '/app/admin',
        createdAt: conversation.updatedAt,
      };
    });
  if (role === 'customer') {
    return [...messageNotifications, ...(await listOrders({ customerId: userId }))
      .slice(0, 10)
      .map((order) => orderNotification(order, role))
    ].sort((left, right) => (right.createdAt?.toMillis() ?? 0) - (left.createdAt?.toMillis() ?? 0));
  }

  if (role === 'owner') {
    const shops = await listOwnerShops(userId);
    const shopIds = shops.map((shop) => shop.id);
    return [...messageNotifications, ...(await listOrders({ shopIds }))
      .slice(0, 10)
      .map((order) => orderNotification(order, role))
    ].sort((left, right) => (right.createdAt?.toMillis() ?? 0) - (left.createdAt?.toMillis() ?? 0));
  }

  const [shops, orders] = await Promise.all([listAllShops(), listOrders()]);
  const pendingShops = shops.filter((shop) => !shop.isApproved).map(shopNotification);
  const pendingOrders = orders
    .filter((order) => order.status === 'pending')
    .slice(0, 10)
    .map((order) => orderNotification(order, role));
  return [...messageNotifications, ...pendingShops, ...pendingOrders].sort(
    (left, right) => (right.createdAt?.toMillis() ?? 0) - (left.createdAt?.toMillis() ?? 0),
  );
}
