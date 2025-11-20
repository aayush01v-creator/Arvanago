
import firebase from 'firebase/compat/app';
import { firebaseConfig } from '../firebaseConfig.ts';

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

import 'firebase/compat/auth';
import 'firebase/compat/firestore';

const auth = firebase.auth();
const db = firebase.firestore();

export { auth, db };
