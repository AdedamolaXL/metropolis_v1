// components/FirebaseConnectionTest.tsx
import { useEffect } from 'react';
import {
  collection, // Import the collection function
  doc,       // Import the doc function
  setDoc      // Import the setDoc function (preferred over set) 
} from 'firebase/firestore';
import { db } from '../firebase';


const FirebaseConnectionTest: React.FC = () => {
  useEffect(() => {
    try {
      const testCollection = collection(db, 'test');
      const connectionDoc = doc(testCollection, 'connection');

      setDoc(connectionDoc, { test: 'success' })
        .then(() => {
          console.log('Firebase connection successful!');
        })
        .catch((error) => {
          console.error('Error connecting to Firebase:', error);
        });
    } catch (error) {
      console.error('Error connecting to Firebase:', error);
    }
  }, []); // Empty dependency array ensures this runs once on component mount

  return null; // This component doesn't render anything
};

export default FirebaseConnectionTest;