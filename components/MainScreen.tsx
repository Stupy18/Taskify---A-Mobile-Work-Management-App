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
  ScrollView
} from "react-native";
import { useTasks } from "../contexts/TaskProvider";
import { db, auth } from "../FirebaseConfig";

import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useProjects } from "@/contexts/ProjectProvider";

interface Task {
  id: string;
  title: string;
  status: string;
  dueDate: string;
  commentCount?: number;
  projectId: string;
  projectName:string;
  createdBy: string;
  assignedTo: string;
  description: string;
}

interface Project {
  id: string;
  projectName: string;
  description?: string;
  ownerId: string;
  members: string[];
}

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const { addComment } = useTasks();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(task.commentCount || 0);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  const fetchComments = async (taskId: string) => {
    try {
      const commentsSnapshot = await getDocs(
        collection(db, "tasks", taskId, "comments")
      );
      const fetchedComments = commentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setComments(fetchedComments);
      setCommentCount(fetchedComments.length);
      await updateDoc(doc(db, "tasks", taskId), {
        commentCount: fetchedComments.length,
      });
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddComment = async () => {
    if (commentText.trim() === "") return;
    try {
      await addComment(task.id, commentText);
      setCommentText("");
      fetchComments(task.id);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteDoc(doc(db, "tasks", task.id, "comments", commentId));
      fetchComments(task.id);
    } catch (e) {
      console.error("Error deleting comment:", e);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateDoc(doc(db, "tasks", task.id), {
        status: newStatus
      });
      Alert.alert("Success", "Task status updated successfully");
      setShowTaskDetails(false);
    } catch (error) {
      console.error("Error updating task status:", error);
      Alert.alert("Error", "Failed to update task status");
    }
  };

  const handleDeleteTask = async () => {
    try {
      const commentsSnapshot = await getDocs(
        collection(db, "tasks", task.id, "comments")
      );
      commentsSnapshot.forEach((doc) => {
        deleteDoc(doc.ref);
      });
      await deleteDoc(doc(db, "tasks", task.id));
      Alert.alert("Success", "Task deleted successfully");
    } catch (e) {
      console.error("Error deleting task:", e);
    }
  };

  return (
    <View style={styles.taskCard}>
      <TouchableOpacity onPress={() => setShowTaskDetails(true)}>
        <View style={styles.taskHeader}>
          <Text style={styles.taskTitle}>{task.title}</Text>
          <View style={styles.taskBadge}>
            <Text style={styles.taskBadgeText}>{task.status}</Text>
          </View>
        </View>
        <Text style={styles.taskDate}>Due: {task.dueDate}</Text>
        <View style={styles.taskFooter}>
          <View style={styles.commentCounter}>
            <Text style={styles.commentCountText}>{commentCount} comments</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Task Details Modal */}
      <Modal
        visible={showTaskDetails}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowTaskDetails(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Task Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowTaskDetails(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <Text style={styles.modalTaskTitle}>{task.title}</Text>
              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Project:</Text>
                <Text style={styles.detailValue}>{task.projectId}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Due Date:</Text>
                <Text style={styles.detailValue}>{task.dueDate}</Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Status:</Text>
                <View style={[styles.taskBadge, styles.modalBadge]}>
                  <Text style={styles.taskBadgeText}>{task.status}</Text>
                </View>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Comments:</Text>
                <Text style={styles.detailValue}>{commentCount}</Text>
              </View>

              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Move to:</Text>
                <View style={styles.statusButtons}>
                  {["To Do", "Doing", "Done"].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.statusButton,
                        task.status === status && styles.statusButtonActive,
                      ]}
                      onPress={() => handleStatusChange(status)}
                      disabled={task.status === status}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          task.status === status && styles.statusButtonTextActive,
                        ]}
                      >
                        {status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    setShowTaskDetails(false);
                    fetchComments(task.id);
                    setShowComments(true);
                  }}
                >
                  <Text style={styles.actionButtonText}>View Comments</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDeleteTask}
                >
                  <Text style={styles.actionButtonText}>Delete Task</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal
        visible={showComments}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowComments(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Comments</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowComments(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <FlatList
                data={comments}
                renderItem={({ item }) => (
                  <View style={styles.commentContainer}>
                    <Text style={styles.commentText}>{item.text}</Text>
                    <TouchableOpacity
                      style={styles.deleteCommentButton}
                      onPress={() => handleDeleteComment(item.id)}
                    >
                      <Text style={styles.deleteCommentText}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
                keyExtractor={(item) => item.id}
                style={styles.commentsList}
              />

              <View style={styles.addCommentSection}>
                <TextInput
                  style={styles.commentInput}
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Add a comment..."
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  style={[styles.actionButton, styles.addCommentButton]}
                  onPress={handleAddComment}
                >
                  <Text style={styles.actionButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

interface ColumnProps {
  title: string;
  data: Task[];
}

const Column: React.FC<ColumnProps> = ({ title, data }) => {
  return (
    <View style={styles.column}>
      <View style={styles.columnHeader}>
        <Text style={styles.columnTitle}>{title}</Text>
        <View style={styles.taskCount}>
          <Text style={styles.taskCountText}>{data.length}</Text>
        </View>
      </View>
      <FlatList
        data={data}
        renderItem={({ item }) => <TaskCard task={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.columnContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const MainScreen: React.FC = () => {
  const { tasks, addTask, currentProject, setCurrentProject } = useTasks();
  const { userProjects } = useProjects();
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskDueDate, setNewTaskDueDate] = useState<string>("");
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleAddTask = async () => {
    if (!selectedProject) {
      Alert.alert("Error", "Please select a project first");
      return;
    }
  
    if (newTaskTitle.trim() === "" || newTaskDueDate.trim() === "") {
      Alert.alert("Error", "Please provide both a title and a due date.");
      return;
    }
  
    const userId = auth.currentUser?.uid;
    const taskData = {
      title: newTaskTitle,
      description: "",
      status: "To Do",
      projectId: selectedProject.id,
      projectName:selectedProject.projectName,
      createdBy: userId,
      assignedTo: userId,
      dueDate: newTaskDueDate,
      created_at: serverTimestamp(),
    };
  
    try {
      await addTask(taskData);
      setNewTaskTitle("");
      setNewTaskDueDate("");
      setSelectedProject(null);
      setModalVisible(false);
      Alert.alert("Success", `Task "${newTaskTitle}" created successfully!`);
    } catch (error) {
      console.error("Error creating task:", error);
      Alert.alert("Error", "Failed to create task. Please try again.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Task Board</Text>
        <TouchableOpacity
          style={styles.addTaskButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addTaskButtonText}>+ New Task</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.columnsScroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.columnsContainer}>
          <Column title="To Do" data={tasks.toDo} />
          <Column title="Doing" data={tasks.doing} />
          <Column title="Done" data={tasks.done} />
        </View>
      </ScrollView>

      {/* New Task Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Task</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.selectContainer}>
                <Text style={styles.selectLabel}>Select Project:</Text>
                <ScrollView style={styles.projectSelect}>
                  {userProjects.map((project) => (
                    <TouchableOpacity
                      key={project.id}
                      style={[
                        styles.projectOption,
                        selectedProject?.id === project.id && styles.projectOptionSelected,
                      ]}
                      onPress={() => {
                        setSelectedProject(project);
                        setCurrentProject(project);
                      }}
                    >
                      <Text
                        style={[
                          styles.projectOptionText,
                          selectedProject?.id === project.id && styles.projectOptionTextSelected,
                        ]}
                      >
                        {project.projectName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Task Title"
                placeholderTextColor="#999"
                value={newTaskTitle}
                onChangeText={setNewTaskTitle}
              />
              <TextInput
                style={styles.input}
                placeholder="Due Date"
                placeholderTextColor="#999"
                value={newTaskDueDate}
                onChangeText={setNewTaskDueDate}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    !selectedProject && styles.actionButtonDisabled
                  ]}
                  onPress={handleAddTask}
                  disabled={!selectedProject}
                >
                  <Text style={styles.actionButtonText}>Create Task</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF5EC",
    padding: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FF6B00",
  },
  columnsScroll: {
    flex: 1,
  },
  columnsContainer: {
    flexDirection: 'column',
    gap: 16,
    paddingBottom: 16,
  },
  column: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 2,
  },
  columnHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  columnTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B00",
  },
  taskCount: {
    backgroundColor: "#FFE4CC",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  taskCountText: {
    color: "#FF6B00",
    fontSize: 12,
    fontWeight: "500",
  },
  taskCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFE4CC",
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  taskBadge: {
    backgroundColor: "#FFE4CC",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  taskBadgeText: {
    color: "#FF6B00",
    fontSize: 10,
    fontWeight: "500",
  },
  taskDate: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxHeight: "90%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE4CC",
  },
  modalContent: {
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FF6B00",
  },
  modalTaskTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#FFF5EC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1A1A1A",
    marginBottom: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#FFF5EC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1A1A1A",
  },
  addTaskButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  addTaskButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "column",
    gap: 8,
    marginTop: 16,
  },
  actionButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#FF3B30",
  },
  commentContainer: {
    backgroundColor: "#FFF5EC",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentsList: {
    maxHeight: "60%",
  },
  addCommentSection: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666666",
    fontWeight: "300",
  },
  detailsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666666",
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  statusButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B00',
    backgroundColor: '#FFFFFF',
  },
  statusButtonActive: {
    backgroundColor: '#FF6B00',
  },
  statusButtonText: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '500',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  selectContainer: {
    marginBottom: 16,
  },
  selectLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 8,
  },
  projectSelect: {
    maxHeight: 120,
  },
  projectOption: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#FFF5EC",
    marginBottom: 8,
  },
  projectOptionSelected: {
    backgroundColor: "#FF6B00",
  },
  projectOptionText: {
    color: "#333333",
    fontSize: 14,
  },
  projectOptionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  actionButtonDisabled: {
    backgroundColor: "#CCCCCC",
  },
  addCommentButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
    flex: 0,
  },
  commentText: {
    color: "#333333",
    fontSize: 14,
  },
  deleteCommentText: {
    color: "#FF3B30",
    fontSize: 12,
    marginTop: 4,
  },
  modalBadge: {
    marginLeft: 8,
  },
  columnContent: {
    paddingBottom: 8,
  },
  taskFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  commentCounter: {
    marginTop: 4,
  },
  commentCountText: {
    fontSize: 12,
    color: "#666666",
  },
  deleteCommentButton: {
    alignSelf: 'flex-end',
  },
});