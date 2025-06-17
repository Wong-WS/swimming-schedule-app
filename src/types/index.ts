export type UserRole = 'user' | 'admin';

export interface User {
  uid: string;
  email: string;
  name: string;
  homeLocation: string; // apartment ID
  role: UserRole;
  createdAt: Date;
}

export interface Apartment {
  id: string;
  name: string; // "Tamarind", "Quayside"
  defaultSlotDuration: 30 | 60; // minutes
  operatingHours: { start: string; end: string };
}

export interface Booking {
  id: string;
  apartmentId: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  status: 'booked' | 'unavailable';
  bookedBy: string; // 'admin' | userId
  createdAt: Date;
}

export type TimeSlotStatus = 'available' | 'booked' | 'unavailable' | 'travel-restricted';

export interface TimeSlot {
  apartmentId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: TimeSlotStatus;
  booking?: Booking;
}
