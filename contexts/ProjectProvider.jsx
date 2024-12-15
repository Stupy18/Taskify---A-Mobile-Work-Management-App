import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../FirebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [userProjects, setUserProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const unsubscribeAuth = auth.onAuthStateChanged(user => {
      if (user) {
        console.log("Auth state changed, user:", user.uid);
        // Set up projects listener when user is authenticated
        const q = query(
          collection(db, "projects"),
          where("members", "array-contains", user.uid)
        );

        const unsubscribeProjects = onSnapshot(q, (snapshot) => {
          console.log("Project snapshot received, count:", snapshot.docs.length);
          const projects = snapshot.docs.map(doc => {
            const data = doc.data();
            console.log("Project data:", {
              id: doc.id,
              projectName: data.projectName,
              members: data.members
            });
            return {
              id: doc.id,
              ...data
            };
          });

          setUserProjects(projects);
          setLoading(false);
        }, (error) => {
          console.error("Error in project listener:", error);
          setLoading(false);
        });

        // Clean up projects listener when auth state changes
        return () => unsubscribeProjects();
      } else {
        console.log("No user authenticated");
        setUserProjects([]);
        setLoading(false);
      }
    });

    // Clean up auth listener on unmount
    return () => unsubscribeAuth();
  }, []);

  const isProjectMember = (projectId) => {
    const userId = auth.currentUser?.uid;
    const project = userProjects.find(p => p.id === projectId);
    const isMember = project ? project.members.includes(userId) : false;
    console.log("Checking project membership:", {
      projectId,
      userId,
      isMember,
      members: project?.members
    });
    return isMember;
  };

  return (
    <ProjectContext.Provider value={{ userProjects, loading, isProjectMember }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProjects must be used within a ProjectProvider');
  }
  return context;
};