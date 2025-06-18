import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import type { Apartment } from '../types';

const FirestoreSetup: React.FC = () => {
  const [collections, setCollections] = useState<{[key: string]: number}>({});
  const [status, setStatus] = useState('Checking Firestore...');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Check collections on mount
  useEffect(() => {
    const checkCollections = async () => {
      try {
        // Check apartments collection
        const apartmentsSnapshot = await getDocs(collection(db, 'apartments'));
        
        // Check users collection
        const usersSnapshot = await getDocs(collection(db, 'users'));
        
        // Check bookings collection
        const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
        
        setCollections({
          apartments: apartmentsSnapshot.size,
          users: usersSnapshot.size,
          bookings: bookingsSnapshot.size
        });
        
        setStatus('Firestore collections checked successfully');
        setLoading(false);
      } catch (err: any) {
        console.error('Firestore error:', err);
        setErrorMessage(err.message);
        setStatus(`Error checking Firestore: ${err.message}`);
        setLoading(false);
      }
    };
    
    checkCollections();
  }, []);

  // Create sample apartment
  const createSampleApartment = async () => {
    try {
      setStatus('Creating sample apartment...');
      
      const apartment: Omit<Apartment, 'id'> = {
        name: 'Main Pool',
        defaultSlotDuration: 60, // 1 hour slots
        start: '08:00', 
        end: '20:00',
        operatingHours: {
          start: '08:00',
          end: '20:00'
        }
      };
      
      const docRef = await addDoc(collection(db, 'apartments'), apartment);
      setStatus(`Added apartment with ID: ${docRef.id}`);
      
      // Refresh collections
      const apartmentsSnapshot = await getDocs(collection(db, 'apartments'));
      setCollections(prev => ({
        ...prev,
        apartments: apartmentsSnapshot.size
      }));
      
    } catch (error: any) {
      console.error('Error adding apartment:', error);
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-6">Firestore Setup</h1>
        
        {loading ? (
          <div className="animate-pulse text-center py-4">Loading...</div>
        ) : (
          <>
            {errorMessage && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <strong>Error:</strong> {errorMessage}
              </div>
            )}
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Collection Status:</h2>
              <div className="bg-gray-100 rounded p-4">
                <p>Status: {status}</p>
                <ul className="mt-4 space-y-2">
                  {Object.entries(collections).map(([name, count]) => (
                    <li key={name} className="flex justify-between items-center border-b pb-2">
                      <span className="font-medium">{name}:</span> 
                      <span className={`px-3 py-1 rounded ${count > 0 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {count} documents
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Setup Actions:</h2>
              <div className="space-y-4">
                {collections.apartments === 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      No apartments found. You need at least one apartment to use the scheduling system.
                    </p>
                    <button 
                      onClick={createSampleApartment}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Create Sample Apartment
                    </button>
                  </div>
                )}
                
                {collections.apartments > 0 && (
                  <p className="text-green-600">
                    ✓ You have {collections.apartments} apartment(s) set up.
                  </p>
                )}
              </div>
            </div>
            
            <div className="mt-8 border-t pt-6">
              <h2 className="text-lg font-semibold mb-3">Next Steps:</h2>
              <ol className="list-decimal list-inside space-y-2">
                <li>Ensure you have at least one apartment in the apartments collection</li>
                <li>Create a user account with admin role (using signup and then modifying the user in Firebase Console)</li>
                <li>Add bookings through the admin dashboard</li>
              </ol>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FirestoreSetup;
