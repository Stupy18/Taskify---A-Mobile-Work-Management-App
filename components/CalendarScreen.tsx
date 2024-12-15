import React, { useState, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTasks } from '@/contexts/TaskProvider';

const formatDateString = (dateString) => {
  const parts = dateString.split('.');
  if (parts.length === 3) {
    const [day, month, year] = parts.map((part) => part.padStart(2, '0'));
    return `${year}-${month}-${day}`;
  }
  return null;
};

const getColorForTaskStatus = (taskStatus) => {
  switch (taskStatus) {
    case 'toDo': return '#f72a25';
    case 'doing': return '#fbbc04';
    case 'done': return '#188038';
    default: return 'gray';
  }
};

const getMarkedDatesFromTasks = (tasks) => {
  const markedDates = {};

  [...tasks.toDo, ...tasks.doing, ...tasks.done].forEach((task) => {
    const formattedDate = formatDateString(task.dueDate);
    if (formattedDate) {
      if (!markedDates[formattedDate]) {
        markedDates[formattedDate] = { dots: [], marked: true };
      }
      const taskStatus =
        tasks.toDo.includes(task) ? 'toDo' :
        tasks.doing.includes(task) ? 'doing' : 'done';

      markedDates[formattedDate].dots.push({ color: getColorForTaskStatus(taskStatus) });
    }
  });

  return markedDates;
};
export default function CalendarScreen() {
  const { tasks } = useTasks();
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const markedDates = getMarkedDatesFromTasks(tasks);

  const handleDayPress = (day) => {
    const tasksForDate = [...tasks.toDo, ...tasks.doing, ...tasks.done].filter(
      (task) => formatDateString(task.dueDate) === day.dateString
    );

    setSelectedTasks(tasksForDate);
    setSelectedDate(day.dateString);
    openModal();
  };

  const openModal = () => {
    setIsModalVisible(true);
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  };

  const closeModal = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, { toValue: 0, duration: 200, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setIsModalVisible(false));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Calendar</Text>
      <View style={styles.calendarContainer}>
        <Calendar
          onDayPress={handleDayPress}
          markedDates={{
            ...markedDates,
            [selectedDate]: { 
              selected: true, 
              disableTouchEvent: true, 
              selectedColor: '#FF6F61',
              selectedTextColor: '#FFFFFF'
            },
          }}
          markingType="multi-dot"
          theme={{
            calendarBackground: '#FFFFFF',
            textSectionTitleColor: '#FF6F61',
            selectedDayBackgroundColor: '#FF6F61',
            selectedDayTextColor: '#FFFFFF',
            todayTextColor: '#FF6F61',
            dayTextColor: '#333333',
            textDisabledColor: '#CCCCCC',
            dotColor: '#FF6F61',
            selectedDotColor: '#FFFFFF',
            arrowColor: '#FF6F61',
            monthTextColor: '#FF6F61',
            textMonthFontWeight: 'bold',
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 14
          }}
        />
      </View>

      <Modal visible={isModalVisible} transparent={true} onRequestClose={closeModal}>
        <View style={styles.modalBackground}>
          <Animated.View style={[
            styles.modalContainer,
            { transform: [{ scale: scaleAnim }], opacity: fadeAnim }
          ]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tasks for {selectedDate}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            {selectedTasks.length > 0 ? (
              <View style={styles.tasksContainer}>
                {selectedTasks.map((task, index) => (
                  <View key={index} style={styles.taskCard}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    <View style={styles.taskDetails}>
                      <Text style={styles.taskDate}>Due: {task.dueDate}</Text>
                      <View style={[
                        styles.statusBadge,
                        { backgroundColor: getColorForTaskStatus(
                          tasks.toDo.includes(task) ? 'toDo' :
                          tasks.doing.includes(task) ? 'doing' : 'done'
                        )}
                      ]}>
                        <Text style={styles.statusText}>{task.status}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noTasksText}>No tasks scheduled for this date.</Text>
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
    backgroundColor: '#FFF5EC',
    padding: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FF6F61',
    marginBottom: 20,
    textAlign: 'center',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FFE4CC',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FF6F61',
  },
  tasksContainer: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#FFF5EC',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#FFE4CC',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  taskDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskDate: {
    fontSize: 14,
    color: '#666666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666666',
    fontWeight: '300',
  },
  noTasksText: {
    padding: 16,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});