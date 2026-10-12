type Contact = { name: string; phone?: string | null };
type Participants = {
  buyerId: string;
  sellerId: string;
  buyer?: Contact | null;
  seller?: Contact | null;
};

/** Only show the opposite participant of an authenticated viewer's own order. */
export function manualPaymentContact(order: Participants, viewerId?: string): Contact | null {
  if (!viewerId) return null;
  if (viewerId === order.buyerId) return order.seller ?? null;
  if (viewerId === order.sellerId) return order.buyer ?? null;
  return null;
}

export function contactTelephone(phone?: string | null): string | null {
  if (!phone) return null;
  const normalized = phone.replace(/[\s()-]/g, '');
  return /^\+?\d{7,15}$/.test(normalized) ? `tel:${normalized}` : null;
}
