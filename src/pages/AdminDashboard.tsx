import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { getApartments, getBookingsByDate, addBooking, updateBooking, deleteBooking } from '../services/firestoreService';
import type { Apartment, Booking } from '../types';
import DatePicker from '../components/DatePicker';

const AdminDashboard: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Form states
  const [formVisible, setFormVisible] = useState<boolean>(false);
  const [selectedApartment, setSelectedApartment] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [status, setStatus] = useState<'booked' | 'unavailable'>('booked');
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null);
  
  // We'll use useAuth() if we need authentication context later
  
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
        console.log('Admin Dashboard - Fetched apartments:', apartmentsData);
        setApartments(apartmentsData || []);
        
        // If no apartments exist yet, show a more specific message
        if (!apartmentsData || apartmentsData.length === 0) {
          setError('No pools/apartments found. Please set up at least one apartment first.');
          setLoading(false);
          return;
        }
        
        // Get bookings for the selected date
        const bookingsData = await getBookingsByDate(formattedDate);
        console.log('Admin Dashboard - Fetched bookings:', bookingsData);
        setBookings(bookingsData || []);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [formattedDate]);
  
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
  };
  
  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedApartment || !startTime || !endTime) {
      return;
    }
    
    try {
      const newBooking = {
        apartmentId: selectedApartment,
        date: formattedDate,
        startTime,
        endTime,
        status,
        bookedBy: editingBookingId ? bookings.find(b => b.id === editingBookingId)?.bookedBy || 'admin' : 'admin'
      };
      
      if (editingBookingId) {
        await updateBooking(editingBookingId, newBooking);
      } else {
        await addBooking(newBooking);
      }
      
      // Refresh bookings
      const updatedBookings = await getBookingsByDate(formattedDate);
      setBookings(updatedBookings);
      
      // Reset form
      resetForm();
    } catch (error) {
      setError('Failed to save booking.');
      console.error('Error saving booking:', error);
    }
  };
  
  const handleEditBooking = (booking: Booking) => {
    setSelectedApartment(booking.apartmentId);
    setStartTime(booking.startTime);
    setEndTime(booking.endTime);
    setStatus(booking.status as 'booked' | 'unavailable');
    setEditingBookingId(booking.id);
    setFormVisible(true);
  };
  
  const handleDeleteBooking = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await deleteBooking(id);
        
        // Refresh bookings
        const updatedBookings = await getBookingsByDate(formattedDate);
        setBookings(updatedBookings);
      } catch (error) {
        setError('Failed to delete booking.');
        console.error('Error deleting booking:', error);
      }
    }
  };
  
  const resetForm = () => {
    setSelectedApartment('');
    setStartTime('');
    setEndTime('');
    setStatus('booked');
    setEditingBookingId(null);
    setFormVisible(false);
  };
  
  const generateTimeOptions = () => {
    const options = [];
    let hour = 8; // 8 AM start
    let minute = 0;
    
    while (hour < 22 || (hour === 22 && minute === 0)) { // 10 PM end
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      options.push(`${formattedHour}:${formattedMinute}`);
      
      minute += 30;
      if (minute === 60) {
        hour += 1;
        minute = 0;
      }
    }
    
    return options;
  };
  
  const timeOptions = generateTimeOptions();
  
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">Admin Dashboard</h1>
        
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
                <p className="mt-4">Loading data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          ) : (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Bookings for {format(selectedDate, 'MMMM d, yyyy')}
                </h2>
                <button
                  onClick={() => setFormVisible(!formVisible)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                >
                  {formVisible ? 'Cancel' : '+ Add Booking'}
                </button>
              </div>
              
              {/* Add/Edit Booking Form */}
              {formVisible && (
                <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                  <h3 className="text-lg font-medium mb-4">
                    {editingBookingId ? 'Edit Booking' : 'Add New Booking'}
                  </h3>
                  <form onSubmit={handleAddBooking} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Apartment</label>
                      <select
                        value={selectedApartment}
                        onChange={(e) => setSelectedApartment(e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      >
                        <option value="">Select an apartment</option>
                        {apartments.map((apartment) => (
                          <option key={apartment.id} value={apartment.id}>
                            {apartment.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                        <select
                          value={startTime}
                          onChange={(e) => setStartTime(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        >
                          <option value="">Select start time</option>
                          {timeOptions.map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                        <select
                          value={endTime}
                          onChange={(e) => setEndTime(e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          required
                        >
                          <option value="">Select end time</option>
                          {timeOptions.filter(time => time > startTime).map((time) => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value as 'booked' | 'unavailable')}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        required
                      >
                        <option value="booked">Booked</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      >
                        {editingBookingId ? 'Update' : 'Save'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Bookings Table */}
              <div className="bg-white shadow overflow-hidden rounded-md">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Apartment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Booked By
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          No bookings for this date.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {apartments.find(a => a.id === booking.apartmentId)?.name || booking.apartmentId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {booking.startTime} - {booking.endTime}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.status === 'booked' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {booking.status === 'booked' ? 'Booked' : 'Unavailable'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.bookedBy === 'admin' ? 'Admin' : 'User'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditBooking(booking)}
                              className="text-blue-600 hover:text-blue-900 mr-4"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBooking(booking.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
