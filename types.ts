
export type Role = 'ADMIN' | 'OPERATOR' | 'PUBLIC';

export enum BookingStatus {
  PENDING = 'Pendiente',
  CONFIRMED = 'Confirmado',
  CANCELLED = 'Cancelado',
}

export enum PaymentMethod {
  CASH = 'Efectivo',
  TRANSFER = 'Transferencia',
  QR = 'QR Mercado Pago',
}

export interface User {
  id: string;
  name: string;
  username: string;
  password: string;
  role: 'ADMIN' | 'OPERATOR';
}

export interface Court {
  id: string;
  name: string;
  type: 'Indoor' | 'Outdoor';
  surfaceColor: 'blue' | 'green' | 'red';
  status: 'AVAILABLE' | 'MAINTENANCE';
  // Pricing
  basePrice: number;
  // Offer 1
  isOffer1Active: boolean;
  offer1Price: number;
  offer1Label?: string; // e.g. "Mañana"
  // Offer 2
  isOffer2Active: boolean;
  offer2Price: number;
  offer2Label?: string; // e.g. "Finde"
}

export interface Booking {
  id: string;
  courtId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  duration: number; // minutes
  customerName: string;
  customerPhone: string;
  status: BookingStatus;
  paymentMethod?: PaymentMethod; // Added payment method
  price: number;
  isRecurring: boolean;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  minStockAlert: number;
  imageUrl: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface CashSession {
  id: string;
  openedAt: string;
  closedAt: string | null;
  openedBy: string;
  initialAmount: number;
  finalAmount: number | null;
  status: 'OPEN' | 'CLOSED';
}

export interface Advertisement {
  id: string;
  imageUrl: string;
  linkUrl?: string; // Optional external link
  isActive: boolean;
}

export interface ClubConfig {
  name: string;
  logoUrl?: string; // New field for custom logo
  schedule: boolean[][]; // 7 days (0=Mon) x 24 hours. true = open
  slotDuration: number; // 30, 60, 90
  courtColorTheme: 'blue' | 'green' | 'red' | 'yellow'; // Added yellow
  ownerPhone: string; // WhatsApp number for notifications
  bookingBackgroundImage?: string;
  ads: Advertisement[];
  adRotationInterval: number; // Seconds per slide
  
  // Promotion Config
  promoActive: boolean;
  promoText: string;
  promoPrice: number; // Fixed price for the 2-hour block
}

export type ActivityType = 'BOOKING' | 'SALE' | 'SHIFT' | 'SYSTEM' | 'STOCK';

export interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: string; // ISO String
  user: string; // Username or Name
  amount?: number; // Optional monetary value involved
}