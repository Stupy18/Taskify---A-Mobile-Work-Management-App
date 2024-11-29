import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../FirebaseConfig';
import { collection, addDoc, updateDoc, doc, query, onSnapshot } from 'firebase/firestore';

const TaskContext = createContext();

export const TaskProvider = ({ children }) => {
  const [tasks, setTasks] = useState({
    toDo: [],
    doing: [],
    done: [],
  });

  // Function to normalize task status
  const normalizeStatus = (status) => {
    if (!status) return 'toDo'; // Default to 'toDo' if no status
    const normalizedStatus = status.toLowerCase().trim(); // Normalize case and remove extra spaces
    if (normalizedStatus === 'to do') return 'toDo';
    if (normalizedStatus === 'doing') return 'doing';
    if (normalizedStatus === 'done') return 'done';
    return 'toDo'; // Default to 'toDo' for any unknown status
  };

  // Fetch tasks from Firestore
  useEffect(() => {
    const q = query(collection(db, 'tasks'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tasksData = {
        toDo: [],
        doing: [],
        done: [],
      };

      snapshot.docs.forEach((doc) => {
        const task = doc.data();
        const normalizedStatus = normalizeStatus(task.status); // Normalize the status
        tasksData[normalizedStatus].push({ id: doc.id, ...task });
      });

      setTasks(tasksData);
    });

    return () => unsubscribe();
  }, []);

  // Add a new task
  const addTask = async (taskData) => {
    try {
      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      console.log('Task added with ID: ', docRef.id);
    } catch (e) {
      console.error('Error adding task: ', e);
    }
  };

  // Add a comment to a task
  const addComment = async (taskId, commentText) => {
    try {
      const commentRef = await addDoc(collection(db, 'tasks', taskId, 'comments'), {
        text: commentText,
        timestamp: new Date(),
      });
      console.log('Comment added with ID: ', commentRef.id);
    } catch (e) {
      console.error('Error adding comment: ', e);
    }
  };

  // Update a task's status (e.g., moving to "Doing" or "Done")
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const taskRef = doc(db, 'tasks', taskId);
      await updateDoc(taskRef, { status: newStatus });
      console.log('Task status updated');
    } catch (e) {
      console.error('Error updating task status: ', e);
    }
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, addComment, updateTaskStatus }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => useContext(TaskContext);
