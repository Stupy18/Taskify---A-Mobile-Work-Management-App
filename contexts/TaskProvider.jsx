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
  arrayUnion,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

const TaskContext = createContext();

export function TaskProvider({ children }) {
  const [currentProject, setCurrentProject] = useState(null);
  const [tasks, setTasks] = useState({ toDo: [], doing: [], done: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentProject) return;

    const q = query(
      collection(db, "tasks"),
      where("projectId", "==", currentProject.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
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

      setTasks(newTasks);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentProject]);

  const addTask = async (taskData) => {
    if (!currentProject) throw new Error("No project selected");
    return await addDoc(collection(db, "tasks"), {
      ...taskData,
      projectId: currentProject.id,
      createdBy: auth.currentUser.uid,
      created_at: new Date()
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
      created_at: new Date()
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