import React, { useState, useEffect } from 'react';
import { getApartments, addApartment, updateApartment } from '../services/firestoreService';
import type { Apartment } from '../types';

const ApartmentManager: React.FC = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formVisible, setFormVisible] = useState<boolean>(false);
  
  // Form state
  const [apartmentName, setApartmentName] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('20:00');
  const [slotDuration, setSlotDuration] = useState<number>(60);
  const [editingApartmentId, setEditingApartmentId] = useState<string | null>(null);
  
  // Fetch apartments on component mount
  useEffect(() => {
    fetchApartments();
  }, []);
  
  const fetchApartments = async () => {
    try {
      setLoading(true);
      const apartmentsData = await getApartments();
      console.log('Fetched apartments:', apartmentsData);
      setApartments(apartmentsData || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching apartments:', err);
      setError('Failed to load apartments. Please try again.');
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apartmentName || !startTime || !endTime || !slotDuration) {
      setError('Please fill in all fields');
      return;
    }
    
    try {
      setLoading(true);
      
      const apartmentData = {
        name: apartmentName,
        start: startTime,
        end: endTime,
        defaultSlotDuration: Number(slotDuration),
        operatingHours: {
          start: startTime,
          end: endTime
        }
      };
      
      // If editing, update the apartment, otherwise add a new one
      if (editingApartmentId) {
        await updateApartment(editingApartmentId, apartmentData);
      } else {
        await addApartment(apartmentData);
      }
      
      // Reset form and refresh apartments
      resetForm();
      await fetchApartments();
      
      // Show confirmation
      alert(`Apartment ${editingApartmentId ? 'updated' : 'added'} successfully!`);
      
    } catch (err) {
      console.error('Error saving apartment:', err);
      setError(`Failed to ${editingApartmentId ? 'update' : 'add'} apartment. Please try again.`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditApartment = (apartment: Apartment) => {
    setApartmentName(apartment.name);
    setStartTime(apartment.operatingHours?.start || apartment.start);
    setEndTime(apartment.operatingHours?.end || apartment.end);
    setSlotDuration(apartment.defaultSlotDuration);
    setEditingApartmentId(apartment.id);
    setFormVisible(true);
  };
  
  const resetForm = () => {
    setApartmentName('');
    setStartTime('08:00');
    setEndTime('20:00');
    setSlotDuration(60);
    setEditingApartmentId(null);
    setFormVisible(false);
    setError(null);
  };
  
  // Generate time slot options for dropdown (15 min increments)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        const timeString = `${formattedHour}:${formattedMinute}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Manage Swimming Pools</h1>
          
          {!formVisible && (
            <button
              onClick={() => setFormVisible(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Add New Pool
            </button>
          )}
        </div>
        
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <strong>Error!</strong> {error}
            <button 
              className="absolute top-0 bottom-0 right-0 px-4"
              onClick={() => setError(null)}
            >
              &times;
            </button>
          </div>
        )}
        
        {loading && !formVisible ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            {/* Add/Edit Form */}
            {formVisible && (
              <div className="bg-white shadow-md rounded-lg mb-6 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">
                    {editingApartmentId ? 'Edit Pool' : 'Add New Pool'}
                  </h2>
                  <button 
                    onClick={resetForm}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    &times;
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Pool Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={apartmentName}
                      onChange={(e) => setApartmentName(e.target.value)}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                      placeholder="e.g. Main Pool"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                        Opening Time
                      </label>
                      <select
                        id="startTime"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                        required
                      >
                        {timeOptions.map(time => (
                          <option key={`start-${time}`} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                        Closing Time
                      </label>
                      <select
                        id="endTime"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                        required
                      >
                        {timeOptions.map(time => (
                          <option key={`end-${time}`} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="slotDuration" className="block text-sm font-medium text-gray-700">
                      Slot Duration (minutes)
                    </label>
                    <select
                      id="slotDuration"
                      value={slotDuration}
                      onChange={(e) => setSlotDuration(Number(e.target.value))}
                      className="mt-1 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                      required
                    >
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="45">45 minutes</option>
                      <option value="60">60 minutes (1 hour)</option>
                      <option value="90">90 minutes (1.5 hours)</option>
                      <option value="120">120 minutes (2 hours)</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      disabled={loading}
                    >
                      {loading ? 'Saving...' : (editingApartmentId ? 'Update Pool' : 'Add Pool')}
                    </button>
                  </div>
                </form>
              </div>
            )}
            
            {/* Apartments List */}
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {apartments.length === 0 ? (
                  <li className="px-6 py-4 text-center text-gray-500">
                    No pools added yet. Click the "Add New Pool" button to get started.
                  </li>
                ) : (
                  apartments.map((apartment) => (
                    <li key={apartment.id} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{apartment.name}</h3>
                          <div className="mt-1 text-sm text-gray-600">
                            Operating Hours: {apartment.operatingHours?.start || apartment.start} - {apartment.operatingHours?.end || apartment.end}
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            Slot Duration: {apartment.defaultSlotDuration} minutes
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleEditApartment(apartment)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded inline-flex items-center text-sm"
                        >
                          Edit
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ApartmentManager;
