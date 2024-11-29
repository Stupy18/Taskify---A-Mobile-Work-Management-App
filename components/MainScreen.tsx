import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useTasks } from "../contexts/TaskProvider";
import { db, auth } from "../FirebaseConfig";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
} from "firebase/firestore";

const TaskCard = ({ task }) => {
  const { addComment, updateTaskStatus } = useTasks();
  const [showComments, setShowComments] = useState(false); // To control modal visibility
  const [commentText, setCommentText] = useState(""); // For the new comment text
  const [comments, setComments] = useState([]); // To hold the comments for this task

  // Function to fetch comments for the task
  const fetchComments = async (taskId) => {
    const commentsSnapshot = await getDocs(
      collection(db, "tasks", taskId, "comments")
    );
    const fetchedComments = commentsSnapshot.docs.map((doc) => doc.data());
    setComments(fetchedComments);
  };

  const handleAddComment = async () => {
    if (commentText.trim() === "") return;
    await addComment(task.id, commentText);
    setCommentText("");
    fetchComments(task.id); // Refresh comments after adding a new one
  };

  return (
    <TouchableOpacity style={styles.taskCard}>
      <Text style={styles.taskTitle}>{task.title}</Text>
      <Text style={styles.taskDetails}>Due: {task.dueDate}</Text>
      <Text style={styles.taskDetails}>Comments: {task.comments.length}</Text>

      <TouchableOpacity
        style={styles.commentButton}
        onPress={() => {
          fetchComments(task.id); // Fetch comments when button is clicked
          setShowComments(true); // Show the comments modal
        }}
      >
        <Text style={styles.commentButtonText}>Show Comments</Text>
      </TouchableOpacity>

      {/* Modal to display comments */}
      <Modal
        visible={showComments}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowComments(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Comments for {task.title}</Text>
            <FlatList
              data={comments}
              renderItem={({ item }) => (
                <View style={styles.commentContainer}>
                  <Text style={styles.commentText}>{item.text}</Text>
                </View>
              )}
              keyExtractor={(item, index) => index.toString()}
            />
            <TextInput
              style={styles.commentInput}
              value={commentText}
              onChangeText={setCommentText}
              placeholder="Add a comment"
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAddComment}
            >
              <Text style={styles.addButtonText}>Add Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowComments(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Comment Section */}
      <TextInput
        style={styles.commentInput}
        placeholder="Add a comment"
        value={commentText}
        onChangeText={setCommentText}
      />
      <TouchableOpacity
        onPress={handleAddComment}
        style={styles.addCommentButton}
      >
        <Text style={styles.addCommentText}>Add Comment</Text>
      </TouchableOpacity>
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
    </View>
  );
};

export default function MainScreen() {
  const { tasks, addTask } = useTasks(); // Get tasks and addTask from context
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [taskColumn, setTaskColumn] = useState("To Do"); // Default column is 'To Do'
  const [modalVisible, setModalVisible] = useState(false); // Modal visibility state

  // Handle adding a new task
  const handleAddTask = async () => {
    if (newTaskTitle.trim() === "" || newTaskDueDate.trim() === "") {
      Alert.alert(
        "Error",
        "Please provide both a title and a due date for the task."
      );
      return;
    }

    const taskData = {
      title: newTaskTitle,
      dueDate: newTaskDueDate,
      status: taskColumn, // Add the column as the status of the task
      comments: [],
      created_at: serverTimestamp(),
      ownerId: auth.currentUser?.uid, // Add current user ID as the task owner
    };

    try {
      // Add task to Firestore
      const taskRef = await addDoc(collection(db, "tasks"), taskData);
      console.log("Task created with ID: ", taskRef.id);

      // Clear the input fields
      setNewTaskTitle("");
      setNewTaskDueDate("");
      setModalVisible(false); // Close modal after task is created
      Alert.alert("Success", `Task "${newTaskTitle}" created successfully!`);
    } catch (error) {
      console.error("Error creating task: ", error);
      Alert.alert("Error", "Failed to create task. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <Column title="To Do" data={tasks.toDo} />
      <Column title="Doing" data={tasks.doing} />
      <Column title="Done" data={tasks.done} />

      {/* Add Task Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ Add Task</Text>
      </TouchableOpacity>

      {/* Task Add Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Add New Task</Text>

          <TextInput
            style={styles.input}
            placeholder="Task Title"
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
          />
          <TextInput
            style={styles.input}
            placeholder="Due Date"
            value={newTaskDueDate}
            onChangeText={setNewTaskDueDate}
          />

          <View style={styles.modalButtons}>
            <TouchableOpacity onPress={handleAddTask} style={styles.addButton}>
              <Text style={styles.addButtonText}>Add Task</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "column",
    backgroundColor: "#f0f4f8",
    padding: 10,
  },
  column: {
    flex: 1,
    marginHorizontal: 5,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 10,
  },
  columnTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  columnContent: {
    flexGrow: 1,
  },
  taskCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  taskDetails: {
    fontSize: 14,
    color: "#6e6e6e",
  },
  addButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
  },
  addButtonText: {
    textAlign: "center",
    color: "#fff",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
    borderRadius: 5,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#ccc",
    borderRadius: 5,
    flex: 1,
    marginLeft: 10,
  },
  commentInput: {
    height: 40,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 8,
    borderRadius: 5,
  },
  cancelButtonText: {
    textAlign: "center",
    color: "#fff",
  },
  addCommentButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#007bff",
    borderRadius: 5,
  },
  addCommentText: {
    textAlign: "center",
    color: "#fff",
  },
  commentButton: {
    marginTop: 10,
    backgroundColor: "#007bff",
    padding: 8,
    borderRadius: 5,
  },
  commentButtonText: {
    color: "#fff",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  closeButton: {
    backgroundColor: "#dc3545",
    padding: 10,
    borderRadius: 5,
  },
  closeButtonText: {
    color: "#fff",
    textAlign: "center",
  },
  commentContainer: {
    marginBottom: 10,
  },
  commentText: {
    fontSize: 14,
    color: "#333",
  },
});
