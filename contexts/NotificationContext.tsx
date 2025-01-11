import React, { createContext, useContext, useEffect, useState } from 'react';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { auth, db } from '../FirebaseConfig';
import { doc, setDoc, collection, onSnapshot, query, where, DocumentData } from 'firebase/firestore';
import * as Notifications from 'expo-notifications';

interface NotificationContextType {
  expoPushToken: string | null;
}

// Define interfaces for Project and Task
interface Project {
  id: string;
  projectName: string;
  members: string[];
  description?: string;
  ownerId: string;
  [key: string]: any;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  projectId: string;
  projectName: string;
  dueDate: string;
  [key: string]: any;
}

const NotificationContext = createContext<NotificationContextType>({ expoPushToken: null });

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      if (token && userId) {
        setExpoPushToken(token);
        // Store the token in Firestore
        const userTokenDoc = doc(db, 'userTokens', userId);
        setDoc(userTokenDoc, { expoPushToken: token }, { merge: true });
      }
    });

    // Listen for notification when app is running
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Listen for notification when app is in background
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    // Listen for new tasks in projects where user is a member
    if (userId) {
      const projectsQuery = query(
        collection(db, 'projects'),
        where('members', 'array-contains', userId)
      );

      const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'modified') {
            const project = { id: change.doc.id, ...change.doc.data() } as Project;
            
            // Get the tasks subcollection
            const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', project.id));
            
            onSnapshot(tasksQuery, (tasksSnapshot) => {
              tasksSnapshot.docChanges().forEach(async (taskChange) => {
                if (taskChange.type === 'added') {
                  const task = { id: taskChange.doc.id, ...taskChange.doc.data() } as Task;
                  
                  // Send local notification
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title: `New Task in ${project.projectName}`,
                      body: `A new task "${task.title}" has been added`,
                      data: { projectId: project.id, taskId: task.id },
                    },
                    trigger: null,
                  });
                }
              });
            });
          }
        });
      });

      return () => {
        unsubscribe();
        notificationListener.remove();
        responseListener.remove();
      };
    }
  }, [userId]);

  return (
    <NotificationContext.Provider value={{ expoPushToken }}>
      {children}
    </NotificationContext.Provider>
  );
};