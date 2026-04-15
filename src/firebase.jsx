import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
  query,
  where,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiZSFedITQq8AYxpoqyN6S7WqQGOZar2w",
  authDomain: "homebot-3235b.firebaseapp.com",
  projectId: "homebot-3235b",
  storageBucket: "homebot-3235b.firebasestorage.app",
  messagingSenderId: "231582581579",
  appId: "1:231582581579:web:8483398b82a071bdb8dece",
  measurementId: "G-MG9QJX3XBY",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Export everything needed
export { auth, db };

// Auth helpers
export const registerUser = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);
export const loginUser = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);
export const logoutUser = () => signOut(auth);

// Firestore collections
export const usersCollection = collection(db, "users");
export const coursesCollection = collection(db, "courses");

// User role functions
export const setUserRole = (userId, role) =>
  setDoc(doc(db, "users", userId), { role }, { merge: true });
export const getUserRole = async (userId) => {
  const userDoc = await getDoc(doc(db, "users", userId));
  return userDoc.exists() ? userDoc.data().role : null;
};

// Course CRUD (if needed)
export const addCourse = (course) => addDoc(coursesCollection, course);
export const getCourses = async () => {
  const snapshot = await getDocs(coursesCollection);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};
export const updateCourse = (id, course) =>
  updateDoc(doc(db, "courses", id), course);
export const deleteCourse = (id) => deleteDoc(doc(db, "courses", id));
