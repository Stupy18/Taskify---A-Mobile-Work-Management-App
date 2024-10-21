
import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useTasks } from './TaskProvider';


const TaskCard = ({ task }) => {
  return (
    <TouchableOpacity style={styles.taskCard}>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text style={styles.taskDetails}>Due: {task.dueDate}</Text>
      <Text style={styles.taskDetails}>Comments: {task.comments.length}</Text>
    </TouchableOpacity>
  );
};

const Column = ({ title, data }) => {
  return (
    <View style={styles.column}>
      <Text style={styles.columnTitle}>{title}</Text>
      <FlatList
        data={data}
        renderItem={({ item }) => <TaskCard task={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.columnContent}
      />
      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.addButtonText}>+ Add a card</Text>
      </TouchableOpacity>
    </View>
  );
};

export default function MainScreen() {
  const { tasks } = useTasks(); // Get tasks from context

  return (
    <View style={styles.container}>
      <Column title="To Do" data={tasks.toDo} />
      <Column title="Doing" data={tasks.doing} />
      <Column title="Done" data={tasks.done} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f0f4f8',
    padding: 10,
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
  },
  columnTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  columnContent: {
    flexGrow: 1,
  },
  taskCard: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  taskDetails: {
    fontSize: 14,
    color: '#6e6e6e',
  },
  addButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
  },
  addButtonText: {
    textAlign: 'center',
    color: '#007bff',
  },
});
