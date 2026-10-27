import { ProduceUnit } from '../shared/types';

export function formatInrPaise(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: rupees % 1 === 0 ? 0 : 2,
  }).format(rupees);
}

export function formatUnitQuantity(quantity: number, unit: ProduceUnit): string {
  if (unit === 'kg') {
    const kg = quantity / 1000;
    return `${kg % 1 === 0 ? kg : kg.toFixed(2)} kg`;
  }
  if (unit === 'bunch') {
    return `${quantity} ${quantity === 1 ? 'bunch' : 'bunches'}`;
  }
  return `${quantity} ${quantity === 1 ? 'piece' : 'pieces'}`;
}

export function formatUnitPrice(paise: number, unit: ProduceUnit): string {
  return `${formatInrPaise(paise)} / ${unit}`;
}

// Display dates strictly in Asia/Kolkata
export function formatDateKolkata(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch (_) {
    return dateString;
  }
}

export function formatDateTimeKolkata(dateString: string | null | undefined): string {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d) + ' IST';
  } catch (_) {
    return dateString;
  }
}

export function getSurplusTimeRemaining(deadlineIso: string | null | undefined): { text: string; isExpired: boolean } {
  if (!deadlineIso) return { text: 'No deadline set', isExpired: false };
  const diff = new Date(deadlineIso).getTime() - Date.now();
  if (diff <= 0) {
    return { text: 'Offer expired', isExpired: true };
  }
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return { text: `${days}d ${hours % 24}h remaining`, isExpired: false };
  }
  return { text: `${hours}h ${minutes}m remaining`, isExpired: false };
}
