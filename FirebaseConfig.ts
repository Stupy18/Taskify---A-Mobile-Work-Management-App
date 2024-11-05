import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCN-m-ysOub5sk3W1r8vw_5NJpyXAJptnU",
  authDomain: "taskify-2c5cf.firebaseapp.com",
  projectId: "taskify-2c5cf",
  storageBucket: "taskify-2c5cf.firebasestorage.app",
  messagingSenderId: "599284887960",
  appId: "1:599284887960:web:ef99c02eebaca6cb833bed",
  measurementId: "G-CLC4SKSJ6S"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);