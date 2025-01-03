import React, { useState, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTasks } from '@/components/TaskProvider'; // Adjust the path if necessary

// Extract deadlines from tasks and assign colors based on their status
const getMarkedDatesFromTasks = (tasks) => {
  const markedDates = {};

  // Function to assign color based on task status
  const getColorForTaskStatus = (taskStatus) => {
    switch (taskStatus) {
      case 'toDo':
        return '#f72a25'; // To Do tasks are red
      case 'doing':
        return '#fbbc04'; // Doing tasks are yellow
      case 'done':
        return '#188038'; // Done tasks are green
      default:
        return 'gray';
    }
  };

  // Iterate through each task list and mark the dates with the corresponding color
  [...tasks.toDo, ...tasks.doing, ...tasks.done].forEach((task) => {
    if (!markedDates[task.dueDate]) {
      markedDates[task.dueDate] = {
        dots: [],
        marked: true,
      };
    }

    // Add the dot color corresponding to the task's status
    const taskStatus =
      tasks.toDo.includes(task) ? 'toDo' :
      tasks.doing.includes(task) ? 'doing' : 'done';

    markedDates[task.dueDate].dots.push({
      color: getColorForTaskStatus(taskStatus),
    });
  });

  return markedDates;
};

export default function CalendarScreen() {
  const { tasks } = useTasks(); // Get tasks from context
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const scaleAnim = useRef(new Animated.Value(0)).current; // Scale animation for modal
  const fadeAnim = useRef(new Animated.Value(0)).current; // Fade animation for modal

  // Get marked dates for the calendar
  const markedDates = getMarkedDatesFromTasks(tasks);

  // Function to handle date press and task selection
  const handleDayPress = (day) => {
    const selectedTasks = [...tasks.toDo, ...tasks.doing, ...tasks.done].filter(
      (task) => task.dueDate === day.dateString
    );
    if (selectedTasks.length > 0) {
      setSelectedTask(selectedTasks[0]); // Show first task for simplicity
      openModal();
    } else {
      setSelectedTask(null);
    }
    setSelectedDate(day.dateString);
  };

  const openModal = () => {
    setIsModalVisible(true);
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsModalVisible(false);
    });
  };

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={handleDayPress}
        markedDates={{
          ...markedDates,
          [selectedDate]: { selected: true, disableTouchEvent: true, selectedDotColor: 'blue' },
        }}
        markingType={'multi-dot'} // Use multi-dot marking type for multiple tasks on the same day
        theme={{
          todayTextColor: '#00adf5',
          arrowColor: '#00adf5',
        }}
      />

      {/* Modal for task details */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        onRequestClose={closeModal} // Close modal on back press
      >
        <View style={styles.modalBackground}>
          <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
            {selectedTask ? (
              <>
                <Text style={styles.modalTitle}>{selectedTask.title}</Text>
                <Text>Due Date: {selectedTask.dueDate}</Text>
                <Text>Comments:</Text>
                {selectedTask.comments.map((comment, index) => (
                  <Text key={index}>{comment}</Text>
                ))}
                <TouchableOpacity
                  onPress={closeModal}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text>No task found for this date.</Text>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 10,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#007bff',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});
