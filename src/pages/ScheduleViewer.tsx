import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import DatePicker from '../components/DatePicker';
import DirectBookingGrid from '../components/DirectBookingGrid';
import { getApartments, getBookingsByDate } from '../services/firestoreService';
import type { Apartment, Booking } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { FiRefreshCw, FiAlertCircle } from 'react-icons/fi';

const ScheduleViewer: React.FC = () => {
  const { userData } = useAuth();
  const userHomeLocation = userData?.homeLocation || '';
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Add a refresh counter state to trigger re-fetching
  const [refreshCounter, setRefreshCounter] = useState(Date.now());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setIsRefreshing(false);
        
        // Get all apartments
        const apartmentsData = await getApartments();
        console.log('Fetched apartments:', apartmentsData);
        setApartments(apartmentsData);
        
        // If no apartments exist yet, show a more specific message
        if (apartmentsData.length === 0) {
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }
        
        // Get bookings for the selected date - always force refresh when manually triggered 
        const shouldForceRefresh = refreshCounter > 0;
        console.log(`Fetching bookings with${shouldForceRefresh ? ' forced' : ' normal'} refresh`, 
          `Refresh #${refreshCounter}, Date: ${format(selectedDate, 'yyyy-MM-dd')}`);
        
        // Clear any previous booking data to avoid stale UI
        setBookings([]);
        
        // Try to fetch bookings twice if the first attempt returns no results on a manual refresh
        let bookingsData = await getBookingsByDate(format(selectedDate, 'yyyy-MM-dd'), shouldForceRefresh);
        
        // On manual refresh, if no bookings were found, try one more time after a short delay
        // This helps with potential Firestore latency issues
        if (shouldForceRefresh && bookingsData.length === 0) {
          console.log('No bookings found on first attempt. Retrying after delay...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          bookingsData = await getBookingsByDate(format(selectedDate, 'yyyy-MM-dd'), true);
        }
        
        console.log(`Fetched ${bookingsData.length} bookings for ${format(selectedDate, 'yyyy-MM-dd')}:`, bookingsData);
        // Log each booking clearly for debug purposes
        bookingsData.forEach((booking, i) => {
          console.log(`Booking ${i+1}:`, 
            `Apartment: ${booking.apartmentId}`, 
            `Time: ${booking.startTime}-${booking.endTime}`,
            `By: ${booking.bookedBy}`
          );
        });
        
        setBookings(bookingsData || []); // Ensure bookings is always an array
        setLastUpdated(new Date());  // Update the timestamp
        
        // Simple logging of bookings found
        console.log(`Processing ${bookingsData.length} total bookings for all apartments:`, 
          bookingsData.map(b => `${b.apartmentId}: ${b.startTime}-${b.endTime}`));
        
        setIsLoading(false);
        setIsRefreshing(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };
    
    fetchData();
  }, [selectedDate, userHomeLocation, refreshCounter]);

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Clear existing data
    setBookings([]);
    // Update refresh counter to trigger a re-fetch with forceRefresh=true
    setRefreshCounter(Date.now());
    // Artificial delay to ensure UI shows refresh state
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsRefreshing(false);
  };

  // Slot click functionality could be added in the future

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Swimming Pool Schedule</h1>
        <p className="mt-1 text-sm text-gray-500">
          Select a date to view available time slots across all pool locations.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 mb-6">
        <DatePicker selectedDate={selectedDate} onDateChange={handleDateChange} />
        <div className="flex flex-col items-end space-y-1">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 focus:outline-none transition ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <FiRefreshCw className={`mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
          
          <div className="flex items-center text-xs text-gray-500">
            {lastUpdated && (
              <>
                Last updated: {format(lastUpdated, 'HH:mm:ss')}
                {bookings.length > 0 && (
                  <span className="ml-1 flex items-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 ml-1">
                      {bookings.length} {bookings.length === 1 ? 'booking' : 'bookings'}
                    </span>
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      
      {bookings.length === 0 && !isLoading && !isRefreshing && (
        <div className="bg-yellow-50 p-4 mb-4 rounded-md border border-yellow-100">
          <div className="flex items-center">
            <FiAlertCircle className="text-yellow-500 mr-2" />
            <p className="text-sm text-yellow-700">
              No bookings found for this date. {userHomeLocation ? 'All pools are available!' : 'Please set your home location in profile settings.'} 
              {bookings.length === 0 && 'Click Refresh if you believe there should be bookings.'}
            </p>
          </div>
        </div>
      )}
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <DirectBookingGrid
          bookings={bookings}
          apartments={apartments}
          userHomeLocation={userHomeLocation}
          date={selectedDate}
          onSlotClick={(apartmentId, startTime, endTime) => console.log('Slot clicked:', apartmentId, startTime, endTime)}
        />
      )}
    </div>
  );
};

export default ScheduleViewer;
