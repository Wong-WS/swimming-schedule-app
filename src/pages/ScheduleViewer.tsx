import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { getApartments, getBookingsByDate } from '../services/firestoreService';
import { generateTimeSlots, applyTravelTimeRestrictions, groupSlotsByApartment } from '../utils/timeSlotUtils';
import DatePicker from '../components/DatePicker';
import TimeSlotGrid from '../components/TimeSlotGrid';
import type { Apartment, Booking, TimeSlot } from '../types';

const ScheduleViewer: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [timeSlots, setTimeSlots] = useState<Record<string, TimeSlot[]>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  const { userData } = useAuth();
  
  // Format date as YYYY-MM-DD for Firestore queries
  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  
  // Fetch apartments and bookings data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get all apartments
        const apartmentsData = await getApartments();
        setApartments(apartmentsData);
        
        // Get bookings for the selected date
        const bookingsData = await getBookingsByDate(formattedDate);
        setBookings(bookingsData);
        
        // Process data to generate time slots
        if (apartmentsData.length > 0) {
          let allSlots: TimeSlot[] = [];
          
          // Generate time slots for each apartment
          apartmentsData.forEach(apartment => {
            const apartmentSlots = generateTimeSlots(
              apartment,
              formattedDate,
              bookingsData.filter(b => b.apartmentId === apartment.id),
            );
            allSlots = [...allSlots, ...apartmentSlots];
          });
          
          // Apply travel time restrictions if user data is available
          if (userData?.homeLocation) {
            allSlots = applyTravelTimeRestrictions(allSlots, userData.homeLocation);
          }
          
          // Group slots by apartment for display
          const groupedSlots = groupSlotsByApartment(allSlots);
          setTimeSlots(groupedSlots);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching schedule data:', error);
        setError('Failed to load schedule data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [formattedDate, userData?.homeLocation]);
  
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleSlotClick = (slot: TimeSlot) => {
    // In a future version, this could open a booking dialog
    console.log('Slot clicked:', slot);
  };
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <DatePicker 
              selectedDate={selectedDate}
              onDateChange={handleDateChange}
            />
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4">Loading schedule...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          ) : (
            <TimeSlotGrid
              timeSlots={timeSlots}
              apartments={apartments}
              userHomeLocation={userData?.homeLocation || ''}
              date={selectedDate}
              onSlotClick={handleSlotClick}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleViewer;
