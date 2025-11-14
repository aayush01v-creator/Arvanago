
// FIX: Switch to Firebase compat imports to resolve module export errors.
import firebase from 'firebase/compat/app';
import { firebaseConfig } from '../firebaseConfig.ts';

// Step 1: Initialize the core Firebase app.
// This ensures that the app instance exists before service modules try to register themselves.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Step 2: Import the service modules for their side effects (registration).
import 'firebase/compat/auth';
import 'firebase/compat/firestore';

// Step 3: Get the service instances from the initialized app.
const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };