import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '../FirebaseConfig';
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { useProjects } from './ProjectProvider';

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const [currentProject, setCurrentProject] = useState(null);
  const [tasks, setTasks] = useState({ toDo: [], doing: [], done: [] });
  const [loading, setLoading] = useState(true);
  const { userProjects } = useProjects();

  // Reset state when auth changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (!user) {
        setCurrentProject(null);
        setTasks({ toDo: [], doing: [], done: [] });
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Handle project updates
  useEffect(() => {
    if (currentProject) {
      const projectStillExists = userProjects.find(p => p.id === currentProject.id);
      if (!projectStillExists) {
        console.log("Current project no longer exists or accessible");
        setCurrentProject(null);
      } else {
        const updatedProject = userProjects.find(p => p.id === currentProject.id);
        console.log("Updating current project data:", updatedProject);
        setCurrentProject(updatedProject);
      }
    }
  }, [userProjects]);

  // Handle tasks updates
  useEffect(() => {
    if (!currentProject) {
      setTasks({ toDo: [], doing: [], done: [] });
      setLoading(false);
      return;
    }

    console.log("Setting up tasks listener for project:", currentProject.id);

    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", currentProject.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log("Tasks snapshot received, count:", snapshot.docs.length);
      const newTasks = {
        toDo: [],
        doing: [],
        done: []
      };

      snapshot.docs.forEach((doc) => {
        const task = { id: doc.id, ...doc.data() };
        switch (task.status) {
          case "To Do":
            newTasks.toDo.push(task);
            break;
          case "Doing":
            newTasks.doing.push(task);
            break;
          case "Done":
            newTasks.done.push(task);
            break;
        }
      });

      console.log("Processed tasks:", {
        todo: newTasks.toDo.length,
        doing: newTasks.doing.length,
        done: newTasks.done.length
      });
      setTasks(newTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentProject]);

  const addTask = async (taskData) => {
    if (!currentProject) throw new Error("No project selected");
    return await addDoc(collection(db, "tasks"), {
      ...taskData,
      createdBy: auth.currentUser.uid,
      created_at: serverTimestamp()
    });
  };

  const updateTask = async (taskId, updates) => {
    const taskRef = doc(db, "tasks", taskId);
    return await updateDoc(taskRef, updates);
  };

  const deleteTask = async (taskId) => {
    const taskRef = doc(db, "tasks", taskId);
    return await deleteDoc(taskRef);
  };

  const addComment = async (taskId, text) => {
    return await addDoc(collection(db, "tasks", taskId, "comments"), {
      text,
      userId: auth.currentUser.uid,
      created_at: serverTimestamp()
    });
  };

  const value = {
    currentProject,
    setCurrentProject,
    tasks,
    loading,
    addTask,
    updateTask,
    deleteTask,
    addComment
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
};