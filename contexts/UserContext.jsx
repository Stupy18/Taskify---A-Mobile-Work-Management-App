import React, { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../FirebaseConfig";
import { collection, query, where, onSnapshot } from "firebase/firestore";

// Create the UserContext
const UserContext = createContext();

// Define the UserProvider component
export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [userProjects, setUserProjects] = useState([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const q = query(
        collection(db, "projects"),
        where("members", "array-contains", userId)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const projectsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUserProjects(projectsData);
      });

      return unsubscribe;
    };

    fetchProjects();
  }, []);

  return (
    <UserContext.Provider value={{ userData, setUserData, userProjects, setUserProjects }}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook to access the UserContext
export const useUser = () => useContext(UserContext);
