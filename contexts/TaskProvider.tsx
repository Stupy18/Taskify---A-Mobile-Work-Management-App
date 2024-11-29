import React, { createContext, useContext, useState } from 'react';

// Define the shape of your task and context for TypeScript support
interface Task {
  id: string;
  title: string;
  dueDate: string;
  comments: string[]; // Change from number to string[]
}

interface Tasks {
  toDo: Task[];
  doing: Task[];
  done: Task[];
}

// Define the shape of the context
interface TaskContextType {
  tasks: Tasks;
  setTasks: React.Dispatch<React.SetStateAction<Tasks>>;
}

// Default empty tasks structure
const defaultTasks: TaskContextType = {
  tasks: {
    toDo: [],
    doing: [],
    done: [],
  },
  setTasks: () => {}, // Empty function for default
};

// Create the context
const TaskContext = createContext<TaskContextType>(defaultTasks);

// Custom hook to access tasks
export const useTasks = () => useContext(TaskContext);

// TaskProvider component
export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Tasks>({
    toDo: [
      { id: '1', title: 'Task 1', dueDate: '2024-10-29', comments: ['Comment 1', 'Comment 2', 'Comment 3'] },
      { id: '2', title: 'Task 2', dueDate: '2024-10-31', comments: ['Nice!!!', 'Needs work on UI'] },
    ],
    doing: [{ id: '3', title: 'Task 3', dueDate: '2024-10-23', comments: ['Comment 1'] }],
    done: [
      { id: '4', title: 'Task 4', dueDate: '2024-10-29', comments: ['Comment 1', 'Comment 2', 'Comment 3', 'Comment 4'] },
      { id: '5', title: 'Task 5', dueDate: '2024-10-18', comments: ['Comment 1', 'Comment 2', 'Comment 3', 'Comment 4'] },
    ],
  });

  return (
    <TaskContext.Provider value={{ tasks, setTasks }}>
      {children}
    </TaskContext.Provider>
  );
};
