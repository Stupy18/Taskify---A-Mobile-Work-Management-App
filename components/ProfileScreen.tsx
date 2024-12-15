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
  updateDoc,
  arrayUnion,
  getDoc
} from "firebase/firestore";
import { useUser } from "../contexts/UserContext";

export default function ProfileScreen() {
  // State declarations
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
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

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setFirstName(userData.firstName || "");
        setLastName(userData.lastName || "");
        setUsername(userData.username || "");
        setEmail(userData.email || "");
        if (userData.profileImage) {
          setProfileImage(userData.profileImage);
        }
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching user data:", error);
      Alert.alert("Error", "Failed to load user data");
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/LoginScreen");
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out");
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

  const handleSave = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      await updateDoc(doc(db, "users", userId), {
        firstName,
        lastName,
        username,
        updatedAt: serverTimestamp(),
        ...(profileImage && { profileImage }),
      });

      setEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };

  const handleImagePicker = async () => {
    if (!editing) return;
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
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

  const handleCreateProject = () => {
    closeModal(setShowProjectsModal);
    openModal(setShowCreateModal);
  };

  const handleJoinProject = () => {
    closeModal(setShowProjectsModal);
    openModal(setShowJoinModal);
  };

  const handleCreateProjectSubmit = async () => {
    if (!projectName.trim()) {
      Alert.alert("Error", "Please enter a project name.");
      return;
    }
  
    const userId = auth.currentUser?.uid;
    
    try {
      const projectRef = doc(collection(db, "projects"));
      const projectData = {
        projectName,
        description,
        ownerId: userId,
        members: [userId],
        created_at: serverTimestamp(),
      };
      await setDoc(projectRef, projectData);
  
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        projects: arrayUnion(projectRef.id)
      });
  
      Alert.alert("Success", `Project "${projectName}" created successfully!`);
      setProjectName("");
      setDescription("");
      closeModal(setShowCreateModal);
    } catch (error) {
      console.error("Error creating project:", error);
      Alert.alert("Error", "Failed to create project. Please try again.");
    }
  };

  const handleJoinProjectSubmit = async () => {
    if (!projectId.trim()) {
      Alert.alert("Error", "Please enter a project ID.");
      return;
    }
  
    const userId = auth.currentUser?.uid;
    
    try {
      console.log("Attempting to join project:", projectId);
      
      const projectRef = doc(db, "projects", projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        Alert.alert("Error", "Project not found");
        return;
      }
  
      const projectData = projectDoc.data();
      console.log("Project data:", projectData);
  
      // Check if user is already a member
      if (projectData.members?.includes(userId)) {
        Alert.alert("Info", "You are already a member of this project");
        return;
      }
  
      // Update project members
      await updateDoc(projectRef, {
        members: arrayUnion(userId)
      });
      console.log("Added user to project members");
  
      // Update user's projects
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        projects: arrayUnion(projectId)
      });
      console.log("Added project to user's projects");
  
      Alert.alert("Success", "Successfully joined project!");
      setProjectId("");
      closeModal(setShowJoinModal);
    } catch (error) {
      console.error("Error joining project:", error);
      Alert.alert("Error", "Failed to join project. Please try again.");
    }
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
            {loading ? (
              <Text style={styles.loadingText}>Loading profile...</Text>
            ) : (
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
                        placeholder="Last Name"
                        value={lastName}
                        onChangeText={setLastName}
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
                        editable={false}
                      />
                    </>
                  ) : (
                    <>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>First Name:</Text>
                        <Text style={styles.infoValue}>{firstName}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Last Name:</Text>
                        <Text style={styles.infoValue}>{lastName}</Text>
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
            )}
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
                onPress={handleCreateProjectSubmit}
              >
                <Text style={styles.buttonText}>Create Project</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
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
                  onPress={handleJoinProjectSubmit}
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
                <View style={styles.detailsRow}>
                  <Text style={styles.detailLabel}>Project ID:</Text>
                  <Text style={styles.detailValue}>{selectedProject?.id}</Text>
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
      </ThemedView>
    );
  }
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: "#FFF5EC"
    },
    loadingText: {
      fontSize: 16,
      color: "#666666",
      textAlign: "center",
      marginTop: 20,
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
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 8,
      alignItems: "center",
      width: "100%",
    },
  });