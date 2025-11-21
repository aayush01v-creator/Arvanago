// FIX: Use compat version of Firebase for authentication.
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { auth } from './firebase.ts';

const googleProvider = new firebase.auth.GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    // FIX: Use compat syntax for signInWithPopup.
    await auth.signInWithPopup(googleProvider);
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    throw error;
  }
};

export const signUpWithEmail = async (name: string, email: string, pass: string) => {
    try {
        // FIX: Use compat syntax for createUserWithEmailAndPassword.
        const res = await auth.createUserWithEmailAndPassword(email, pass);
        const user = res.user;
        if (user) {
            // FIX: updateProfile is on the user object, which is correct. No change needed here but confirming it's compat-compatible.
             await user.updateProfile({
                displayName: name
             });
        }
        return user;
    } catch(err) {
        console.error("Error signing up with email: ", err);
        throw err;
    }
}

export const signInWithEmail = async (email: string, pass: string) => {
    try {
        // FIX: Use compat syntax for signInWithEmailAndPassword.
        await auth.signInWithEmailAndPassword(email, pass);
    } catch (err) {
        console.error("Error signing in with email: ", err);
        throw err;
    }
}


export const signOutUser = async () => {
  try {
    // FIX: Use compat syntax for signOut.
    await auth.signOut();
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};