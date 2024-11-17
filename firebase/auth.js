import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, GoogleAuthProvider } from "firebase/auth";

export const doCreateUserWithEmailAndPassword = async (email, password) => {
  return createUserWithEmailAndPassword(auth, email, password);
}

export const doSignInWithEmailAndPassword = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
}

export const doSignInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);

  return result.user;
}

export const doSignOut = () => {
  return auth.signOut();
}

// export const doPasswordReset = (email) => {
//   return sendPasswordResetEmail(auth, email);
// }

// export const doPasswordUpdate = (password) => {
//   return updatePassword(auth.currentUser, password);
// }

// export const doSendEmailVerification = () => {
//   return sendEmailVerification(auth.currentUser);
// }