// contexts/ProjectProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, auth } from '../FirebaseConfig';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

interface Project {
  id: string;
  projectName: string;
  description?: string;
  ownerId: string;
  members: string[];
}

interface ProjectContextType {
  userProjects: Project[];
  loading: boolean;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(
      collection(db, "projects"),
      where("members", "array-contains", userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Project));
      setUserProjects(projects);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ProjectContext.Provider value={{ userProjects, loading }}>
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