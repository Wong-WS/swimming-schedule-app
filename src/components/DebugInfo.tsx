import { useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { collection, getDocs, getDoc, doc } from 'firebase/firestore';
import { getApp } from 'firebase/app';

const DebugInfo = () => {
  const [authStatus, setAuthStatus] = useState<string>('Checking...');
  const [firestoreStatus, setFirestoreStatus] = useState<string>('Checking...');
  const [configStatus, setConfigStatus] = useState<string>('Checking...');
  const [collections, setCollections] = useState<{[key: string]: number}>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check Firebase App Configuration
    try {
      const app = getApp();
      setConfigStatus(`Firebase initialized with project: ${app.options.projectId}`);
    } catch (err) {
      setConfigStatus('Firebase initialization error');
      setError(`Config error: ${err instanceof Error ? err.message : String(err)}`);
    }
    
    // Check Firebase Auth
    try {
      const authInstance = auth;
      setAuthStatus(authInstance ? 'Auth initialized' : 'Auth failed to initialize');
    } catch (err) {
      setAuthStatus('Auth error');
      setError(`Auth error: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Check Firestore
    const checkFirestore = async () => {
      try {
        // Check for required collections
        const requiredCollections = ['apartments', 'users', 'bookings'];
        const collectionStatus: {[key: string]: number} = {};
        
        for (const collName of requiredCollections) {
          try {
            const collRef = collection(db, collName);
            const snapshot = await getDocs(collRef);
            collectionStatus[collName] = snapshot.size;
          } catch (err) {
            collectionStatus[collName] = -1; // Error loading
            console.error(`Error checking collection ${collName}:`, err);
          }
        }
        
        setCollections(collectionStatus);
        setFirestoreStatus('Firestore collections checked');
        
        // Try to access a test document
        try {
          const testDocRef = doc(db, 'test', 'connection-test');
          await getDoc(testDocRef); // We don't care if it exists, just that we can query
        } catch (err) {
          setError(`Firestore permission error: ${err instanceof Error ? err.message : String(err)}`);
        }
      } catch (err) {
        setFirestoreStatus('Firestore connection error');
        setError(`Firestore error: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    checkFirestore();
  }, []);

  return (
    <div className="p-4 m-4 bg-yellow-100 border border-yellow-300 rounded-lg">
      <h2 className="text-lg font-bold mb-2">Debug Information</h2>
      <p className="mb-1"><span className="font-semibold">Firebase Config:</span> {configStatus}</p>
      <p className="mb-1"><span className="font-semibold">Firebase Auth:</span> {authStatus}</p>
      <p className="mb-1"><span className="font-semibold">Firestore:</span> {firestoreStatus}</p>
      
      <div className="mt-3">
        <h3 className="font-semibold mb-1">Collections:</h3>
        <ul className="list-disc pl-5">
          {Object.entries(collections).map(([name, count]) => (
            <li key={name} className="text-sm">
              <span className="font-medium">{name}:</span> {count === -1 ? '❌ Error' : `✓ ${count} documents`}
            </li>
          ))}
        </ul>
      </div>
      
      {error && (
        <div className="mt-3 p-2 bg-red-100 border border-red-300 rounded">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}
      
      <div className="mt-4 border-t border-yellow-300 pt-2">
        <p className="text-xs text-gray-700">This debug panel is temporary - remove when app works correctly.</p>
      </div>
    </div>
  );
};

export default DebugInfo;
