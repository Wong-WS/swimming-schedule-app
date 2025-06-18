import { collection, addDoc, doc, setDoc, getDocs, query, where, orderBy, deleteDoc, serverTimestamp } from 'firebase/firestore';
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
export const getBookingsByDate = async (date: string, forceRefresh = false): Promise<Booking[]> => {
  try {
    // Log for debugging with timestamp to track when this function is called
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Getting bookings for date:`, date, 'Force refresh:', forceRefresh);
    
    // Create a query against the bookings collection
    const bookingsRef = collection(db, 'bookings');
    const q = query(
      bookingsRef,
      where('date', '==', date),
      orderBy('startTime')
    );
    
    // Get documents from Firestore
    // Use {source: 'server'} to bypass cache when forceRefresh is true
    const querySnapshot = await getDocs(q);
    
    // Log raw snapshot for debugging
    console.log(`[${timestamp}] Raw booking snapshot size:`, querySnapshot.size, 'for date:', date);
    console.log('Document IDs:', querySnapshot.docs.map(doc => doc.id));
    
    if (querySnapshot.empty) {
      console.log(`[${timestamp}] No bookings found for date`, date);
      return []; // Return empty array when no bookings found
    }
    
    // Process each booking document with better error handling
    const bookings = querySnapshot.docs.map(doc => {
      try {
        const data = doc.data();
        console.log('Processing booking document:', doc.id, data);
        
        // Ensure all required fields exist
        return {
          id: doc.id,
          apartmentId: data.apartmentId || '',
          date: data.date || '',
          startTime: data.startTime || '00:00',
          endTime: data.endTime || '00:00',
          bookedBy: data.bookedBy || 'unknown',
          status: data.status || 'booked',
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          userName: data.userName || ''
        } as Booking;
      } catch (docError) {
        console.error('Error processing booking document:', docError, 'Document ID:', doc.id);
        // Return a minimally valid booking object to prevent crashes
        return {
          id: doc.id,
          apartmentId: '',
          date: date,
          startTime: '00:00',
          endTime: '00:00',
          bookedBy: 'error',
          createdAt: new Date()
        } as Booking;
      }
    });
    
    // Log processed bookings for debugging
    console.log(`[${timestamp}] Processed ${bookings.length} bookings for date:`, date);
    bookings.forEach((booking, index) => {
      console.log(`Booking ${index + 1}:`, 
        'ID:', booking.id,
        'Apartment:', booking.apartmentId,
        'Time:', `${booking.startTime}-${booking.endTime}`,
        'By:', booking.bookedBy
      );
    });
    
    return bookings;
  } catch (error) {
    console.error('Error getting bookings:', error);
    // Return empty array instead of throwing to prevent app crashes
    return [];
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
    console.log('Adding new booking:', booking);
    
    // Make sure we have all required fields
    const bookingData = {
      ...booking,
      apartmentId: booking.apartmentId || '',
      date: booking.date || '',
      startTime: booking.startTime || '',
      endTime: booking.endTime || '',
      bookedBy: booking.bookedBy || 'admin',
      status: booking.status || 'booked',
      createdAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'bookings'), bookingData);
    console.log('Booking added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding booking:', error);
    throw error;
  }
};

export const updateBooking = async (id: string, booking: Partial<Booking>): Promise<void> => {
  try {
    console.log('Updating booking:', id, booking);
    
    // Filter out any undefined/null values
    const validBookingData = Object.entries(booking).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    await setDoc(doc(db, 'bookings', id), validBookingData, { merge: true });
    console.log('Booking updated successfully:', id);
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
