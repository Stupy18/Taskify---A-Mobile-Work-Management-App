import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  FlatList,
  TextInput,
  Animated,
  Easing,
  Alert,
  Button,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ThemedView } from "@/components/ThemedView";
import { auth, db } from "../FirebaseConfig";
import { signOut } from "firebase/auth";
import { router } from "expo-router";
import {
  doc,
  setDoc,
  collection,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { useUser } from "../contexts/UserContext";

export default function ProfileScreen() {
  const [firstName, setFirstName] = useState("Prenume");
  const [secondName, setSecondName] = useState("Nume");
  const [username, setUsername] = useState("Username");
  const [email, setEmail] = useState("email");
  const [profileImage, setProfileImage] = useState(null);
  const [editing, setEditing] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const { userProjects } = useUser();
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectDetailsModal, setShowProjectDetailsModal] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/LoginScreen");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const openModal = (setModalVisible) => {
    setModalVisible(true);
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

  const closeModal = (setModalVisible) => {
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
      setModalVisible(false);
    });
  };

  const handleSave = () => {
    setEditing(false);
    Alert.alert("Success", "Profile updated successfully!");
  };

  const handleImagePicker = async () => {
    if (!editing) return;
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Please allow access to your photos to change profile picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    }
  };


  const handleCreateProject = async () => {
    closeModal(setShowProjectsModal);
    openModal(setShowCreateModal);
  };

  const handleJoinProject = () => {
    closeModal(setShowProjectsModal);
    openModal(setShowJoinModal);
  };

  const handleShowProjectDetails = (project) => {
    setSelectedProject(project);
    setShowProjectDetailsModal(true);
  };

  const handleDeleteProject = async () => {
    if (!selectedProject) return;

    try {
      await deleteDoc(doc(db, "projects", selectedProject.id));
      Alert.alert("Success", "Project deleted successfully!");
      setShowProjectDetailsModal(false);
      setProjects(projects.filter((p) => p.id !== selectedProject.id));
    } catch (error) {
      console.error("Error deleting project:", error);
      Alert.alert("Error", "Failed to delete project.");
    }
  };

  const renderProjectItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleShowProjectDetails(item)}>
      <View style={styles.projectItem}>
        <Text style={styles.projectName}>{item.projectName}</Text>
        <Text style={styles.projectDescription}>{item.description}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={userProjects}
        keyExtractor={(item) => item.id}
        renderItem={renderProjectItem}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity onPress={handleImagePicker} disabled={!editing}>
              <Image
                source={
                  profileImage
                    ? { uri: profileImage }
                    : require("@/assets/images/icon.png")
                }
                style={styles.profileImage}
              />
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              {editing ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholderTextColor="#999"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Second Name"
                    value={secondName}
                    onChangeText={setSecondName}
                    placeholderTextColor="#999"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Username"
                    value={username}
                    onChangeText={setUsername}
                    placeholderTextColor="#999"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    placeholderTextColor="#999"
                  />
                </>
              ) : (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>First Name:</Text>
                    <Text style={styles.infoValue}>{firstName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Second Name:</Text>
                    <Text style={styles.infoValue}>{secondName}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Username:</Text>
                    <Text style={styles.infoValue}>{username}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Email:</Text>
                    <Text style={styles.infoValue}>{email}</Text>
                  </View>
                </>
              )}
            </View>

            <View style={styles.projectsHeader}>
              <Text style={styles.projectsTitle}>Projects</Text>
              <TouchableOpacity onPress={() => openModal(setShowProjectsModal)}>
                <Text style={styles.plusButton}>+</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListFooterComponent={
          <View style={styles.footerButtons}>
            <TouchableOpacity
              style={[
                styles.button,
                editing ? styles.saveButton : styles.editButton,
              ]}
              onPress={editing ? handleSave : () => setEditing(true)}
            >
              <Text style={styles.buttonText}>
                {editing ? "Save Changes" : "Edit Profile"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.signOutButton}
              onPress={handleSignOut}
            >
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={styles.listContent}
      />


      {/* Projects Modal */}
      <Modal
        visible={showProjectsModal}
        transparent={true}
        onRequestClose={() => closeModal(setShowProjectsModal)}
      >
        <View style={styles.modalBackground}>
          <Animated.View
            style={[
              styles.modalContainer,
              { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Project</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => closeModal(setShowProjectsModal)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalButtonGroup}>
              <TouchableOpacity
                style={styles.projectModalButton}
                onPress={handleCreateProject}
              >
                <Text style={styles.buttonText}>Create Project</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.projectModalButton}
                onPress={handleJoinProject}
              >
                <Text style={styles.buttonText}>Join Project</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Project Details Modal */}
      <Modal
        visible={showProjectDetailsModal}
        transparent={true}
        onRequestClose={() => setShowProjectDetailsModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Project Details</Text>
            <Text style={styles.modalContent}>
              Name: {selectedProject?.projectName || "N/A"}
            </Text>
            <Text style={styles.modalContent}>
              Description:{" "}
              {selectedProject?.description || "No description provided."}
            </Text>
            <Button title="Delete Project" onPress={handleDeleteProject} />
            <Button
              title="Close"
              onPress={() => setShowProjectDetailsModal(false)}
            />
          </View>
        </View>
      </Modal>

      {/* Join Project Modal */}
      <Modal
        visible={showJoinModal}
        transparent={true}
        onRequestClose={() => closeModal(setShowJoinModal)}
      >
        <View style={styles.modalBackground}>
          <Animated.View
            style={[
              styles.modalContainer,
              { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
            ]}
          >
            <Text style={styles.modalTitle}>Enter Project ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Project ID"
              value={projectId}
              onChangeText={setProjectId}
            />
            <Button
              title="Join Project"
              onPress={() => {
                console.log("Joining project with ID:", projectId);
                closeModal(setShowJoinModal);
              }}
            />
            <Button
              title="Close"
              onPress={() => closeModal(setShowJoinModal)}
            />
          </Animated.View>
        </View>
      </Modal>

      {/* Projects Modal */}
      <Modal
        visible={showProjectsModal}
        transparent={true}
        onRequestClose={() => closeModal(setShowProjectsModal)}
      >
        <View style={styles.modalBackground}>
          <Animated.View
            style={[
              styles.modalContainer,
              { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Project</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => closeModal(setShowProjectsModal)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCreateProject}
            >
              <Text style={styles.buttonText}>Create Project</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { marginTop: 8 }]}
              onPress={handleJoinProject}
            >
              <Text style={styles.buttonText}>Join Project</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      {/* Project Details Modal */}
      <Modal
        visible={showProjectDetailsModal}
        transparent={true}
        onRequestClose={() => setShowProjectDetailsModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Project Details</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowProjectDetailsModal(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Name:</Text>
                <Text style={styles.detailValue}>
                  {selectedProject?.projectName || "N/A"}
                </Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Description:</Text>
                <Text style={styles.detailValue}>
                  {selectedProject?.description || "No description provided."}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={handleDeleteProject}
              >
                <Text style={styles.buttonText}>Delete Project</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Project Modal */}
      <Modal
        visible={showJoinModal}
        transparent={true}
        onRequestClose={() => closeModal(setShowJoinModal)}
      >
        <View style={styles.modalBackground}>
          <Animated.View
            style={[
              styles.modalContainer,
              { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Join Project</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => closeModal(setShowJoinModal)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.input}
                placeholder="Enter Project ID"
                value={projectId}
                onChangeText={setProjectId}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  console.log("Joining project with ID:", projectId);
                  closeModal(setShowJoinModal);
                }}
              >
                <Text style={styles.buttonText}>Join Project</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Create Project Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        onRequestClose={() => closeModal(setShowCreateModal)}
      >
        <View style={styles.modalBackground}>
          <Animated.View
            style={[
              styles.modalContainer,
              { transform: [{ scale: scaleAnim }], opacity: fadeAnim },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Project</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => closeModal(setShowCreateModal)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.input}
                placeholder="Project Name"
                value={projectName}
                onChangeText={setProjectName}
                placeholderTextColor="#999"
              />
              <TextInput
                style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
                placeholder="Description (optional)"
                multiline
                value={description}
                onChangeText={setDescription}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.actionButton}
                onPress={async () => {
                  if (!projectName.trim()) {
                    Alert.alert("Error", "Please enter a project name.");
                    return;
                  }

                  const ownerId = auth.currentUser?.uid;
                  const projectData = {
                    projectName,
                    description,
                    ownerId,
                    members: [ownerId],
                    created_at: serverTimestamp(),
                  };

                  try {
                    const projectRef = doc(collection(db, "projects"));
                    await setDoc(projectRef, projectData);
                    Alert.alert("Success", `Project "${projectName}" created successfully!`);
                    setProjects((prev) => [
                      ...prev,
                      { id: projectRef.id, name: projectName },
                    ]);
                    setProjectName("");
                    setDescription("");
                    closeModal(setShowCreateModal);
                  } catch (error) {
                    console.error("Error creating project:", error);
                    Alert.alert("Error", "Failed to create project. Please try again.");
                  }
                }}
              >
                <Text style={styles.buttonText}>Create Project</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#FFF5EC" 
  },
  listContent: { 
    padding: 20 
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#FF6F61",
    textAlign: "center",
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#FF6F61",
  },
  infoContainer: { 
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#FF6F61",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#FFE4CC",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#FFF5EC",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333333",
    marginBottom: 12,
  },
  projectsHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between",
    alignItems: "center", 
    marginTop: 20,
    marginBottom: 12,
  },
  projectsTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#FF6F61" 
  },
  plusButton: { 
    fontSize: 24, 
    color: "#FFFFFF",
    backgroundColor: "#FF6F61",
    width: 36,
    height: 36,
    borderRadius: 18,
    textAlign: 'center',
    lineHeight: 34,
  },
  projectItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#FFE4CC",
    shadowColor: "#FF6F61",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  projectName: { 
    fontSize: 16, 
    fontWeight: "600",
    color: "#333333",
    marginBottom: 4,
  },
  projectDescription: { 
    fontSize: 14, 
    color: "#666666" 
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
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
    fontSize: 20, 
    fontWeight: "600", 
    color: "#FF6F61",
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
    color: "#333333",
    fontWeight: "500",
    flex: 1,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
  editButton: { 
    backgroundColor: "#FF6F61" 
  },
  saveButton: { 
    backgroundColor: "#4CAF50" 
  },
  actionButton: {
    backgroundColor: "#FF6F61",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 4,
  },
  deleteButton: {
    backgroundColor: "#dc3545",
    marginTop: 16,
  },
  signOutButton: {
    marginTop: 12,
    backgroundColor: "#FF6F61",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonText: { 
    color: "#FFFFFF", 
    fontSize: 16, 
    fontWeight: "600" 
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666666",
    fontWeight: "300",
  },
  footerButtons: {
    marginTop: 20,
    paddingVertical: 20,
    width: "100%",
  },
  modalButtonGroup: {
    padding: 16,
    gap: 8,
  },
  projectModalButton: {
    backgroundColor: "#FF6F61",
    paddingVertical: 8,  // Reduced from 12
    paddingHorizontal: 12, // Reduced from 16
    borderRadius: 8,
    alignItems: "center",
    width: "100%",
  },
});