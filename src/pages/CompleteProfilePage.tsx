import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../services/firebase';
import { getApartments } from '../services/firestoreService';
import type { Apartment } from '../types';

const CompleteProfilePage: React.FC = () => {
  const [name, setName] = useState('');
  const [homeLocation, setHomeLocation] = useState('');
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchApartments = async () => {
      try {
        setLoading(true);
        const apartmentsData = await getApartments();
        setApartments(apartmentsData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching apartments:', error);
        setError('Failed to load apartment data');
        setLoading(false);
      }
    };
    
    // Check if user already has a profile
    const checkExistingProfile = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }
      
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      
      // If user already has a complete profile, redirect to home
      if (docSnap.exists() && docSnap.data().homeLocation) {
        navigate('/');
        return;
      }
      
      // Pre-fill name if available from auth provider
      if (user.displayName) {
        setName(user.displayName);
      }
      
      await fetchApartments();
    };
    
    checkExistingProfile();
  }, [navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!homeLocation) {
      setError('Please select your home apartment');
      return;
    }
    
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No authenticated user found');
      }
      
      // Update user profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        name: name || user.displayName || user.email?.split('@')[0] || 'User',
        homeLocation,
        role: 'user',
        createdAt: new Date()
      }, { merge: true });
      
      navigate('/');
    } catch (error) {
      console.error('Error saving profile:', error);
      setError('Failed to save profile. Please try again.');
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-3xl font-extrabold text-gray-900">
            Swimming Pool Scheduler
          </h1>
          <h2 className="mt-6 text-center text-2xl font-bold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We need a bit more information to complete your registration.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {loading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="ml-3">Loading...</p>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="name" className="sr-only">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="home-location" className="sr-only">Home Apartment</label>
                <select
                  id="home-location"
                  name="home-location"
                  required
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  value={homeLocation}
                  onChange={(e) => setHomeLocation(e.target.value)}
                >
                  <option value="">Select your home apartment</option>
                  {apartments.map((apartment) => (
                    <option key={apartment.id} value={apartment.id}>
                      {apartment.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Complete Profile
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CompleteProfilePage;
