import { collection, addDoc, doc, setDoc, getDoc, getDocs, query, where, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import type { Apartment, Booking } from '../types';

// Apartments Collection Operations
export const getApartments = async (): Promise<Apartment[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, 'apartments'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Apartment[];
  } catch (error) {
    console.error('Error getting apartments:', error);
    throw error;
  }
};

export const addApartment = async (apartment: Omit<Apartment, 'id'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'apartments'), apartment);
    return docRef.id;
  } catch (error) {
    console.error('Error adding apartment:', error);
    throw error;
  }
};

export const updateApartment = async (id: string, apartment: Partial<Apartment>): Promise<void> => {
  try {
    await setDoc(doc(db, 'apartments', id), apartment, { merge: true });
  } catch (error) {
    console.error('Error updating apartment:', error);
    throw error;
  }
};

// Bookings Collection Operations
export const getBookingsByDate = async (date: string): Promise<Booking[]> => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('date', '==', date),
      orderBy('startTime')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Booking[];
  } catch (error) {
    console.error('Error getting bookings:', error);
    throw error;
  }
};

export const getBookingsByApartmentAndDate = async (apartmentId: string, date: string): Promise<Booking[]> => {
  try {
    const q = query(
      collection(db, 'bookings'),
      where('apartmentId', '==', apartmentId),
      where('date', '==', date),
      orderBy('startTime')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate() || new Date()
    })) as Booking[];
  } catch (error) {
    console.error('Error getting bookings for apartment:', error);
    throw error;
  }
};

export const addBooking = async (booking: Omit<Booking, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...booking,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding booking:', error);
    throw error;
  }
};

export const updateBooking = async (id: string, booking: Partial<Booking>): Promise<void> => {
  try {
    await setDoc(doc(db, 'bookings', id), booking, { merge: true });
  } catch (error) {
    console.error('Error updating booking:', error);
    throw error;
  }
};

export const deleteBooking = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'bookings', id));
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw error;
  }
};
