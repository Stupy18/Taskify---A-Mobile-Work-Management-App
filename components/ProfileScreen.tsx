import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Button, FlatList, TextInput, Animated, Easing } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/ThemedView';
import { InputWithButton } from '@/components/InputWithButton';

export default function ProfileScreen() {
  const [firstName, setFirstName] = useState('Prenume');
  const [secondName, setSecondName] = useState('Nume');
  const [username, setUsername] = useState('Username');
  const [email, setEmail] = useState('email');
  const [profileImage, setProfileImage] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectId, setProjectId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState([
    { id: '1', name: 'Project A' },
    { id: '2', name: 'Project B' },
    { id: '3', name: 'Project C' },
  ]);

  const scaleAnim = useRef(new Animated.Value(0)).current; // scale animation
  const fadeAnim = useRef(new Animated.Value(0)).current; // fade animation

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
    console.log('Saved Profile Data:', { firstName, secondName, username, email, profileImage });
  };

  const handleImagePicker = async () => {
    if (!editing) return;
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    } else {
      console.log('User canceled image picker');
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

  const renderProjectItem = ({ item }) => (
    <View style={styles.projectItem}>
      <Text style={styles.projectName}>{item.name}</Text>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProjectItem}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Profile</Text>
            <TouchableOpacity onPress={handleImagePicker} disabled={!editing}>
              <Image
                source={profileImage ? { uri: profileImage } : require('@/assets/images/icon.png')}
                style={styles.profileImage}
              />
            </TouchableOpacity>

            <View style={styles.infoContainer}>
              <InputWithButton placeholder="First Name" defaultValue={firstName} onChangeText={setFirstName} editable={editing} />
              <InputWithButton placeholder="Second Name" defaultValue={secondName} onChangeText={setSecondName} editable={editing} />
              <InputWithButton placeholder="Username" defaultValue={username} onChangeText={setUsername} editable={editing} />
              <InputWithButton placeholder="Email" defaultValue={email} onChangeText={setEmail} editable={editing} />
            </View>

            <TouchableOpacity
              style={[styles.button, editing ? styles.saveButton : styles.editButton]}
              onPress={editing ? handleSave : () => setEditing(true)}
            >
              <Text style={styles.buttonText}>{editing ? 'Save' : 'Edit Profile'}</Text>
            </TouchableOpacity>

            <View style={styles.projectsHeader}>
              <Text style={styles.projectsTitle}>Projects</Text>
              <TouchableOpacity onPress={() => openModal(setShowProjectsModal)}>
                <Text style={styles.plusButton}>+</Text>
              </TouchableOpacity>
            </View>
          </>
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
          <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
            <Text style={styles.modalTitle}>Add Project</Text>
            <Button title="Create Project" onPress={handleCreateProject} />
            <Button title="Join Project" onPress={handleJoinProject} />
            <Button title="Close" onPress={() => closeModal(setShowProjectsModal)} />
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
          <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
            <Text style={styles.modalTitle}>Enter Project ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Project ID"
              value={projectId}
              onChangeText={setProjectId}
            />
            <Button title="Join Project" onPress={() => {
              console.log('Joining project with ID:', projectId);
              closeModal(setShowJoinModal);
            }} />
            <Button title="Close" onPress={() => closeModal(setShowJoinModal)} />
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
          <Animated.View style={[styles.modalContainer, { transform: [{ scale: scaleAnim }], opacity: fadeAnim }]}>
            <Text style={styles.modalTitle}>Enter Project Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Project Name"
              value={projectName}
              onChangeText={setProjectName}
            />
            <Button title="Create Project" onPress={() => {
              console.log('Creating project with name:', projectName);
              closeModal(setShowCreateModal);
            }} />
            <Button title="Close" onPress={() => closeModal(setShowCreateModal)} />
          </Animated.View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f4f8' },
  listContent: { padding: 20 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#FF6F61', textAlign: 'center', marginBottom: 20 },
  profileImage: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#ccc' },
  infoContainer: { marginBottom: 30 },
  button: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 5, alignItems: 'center' },
  editButton: { backgroundColor: '#FF6F61' },
  saveButton: { backgroundColor: '#4CAF50' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  projectsHeader: { flexDirection: 'row', alignItems: 'center', marginTop: 20 },
  projectsTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
  plusButton: { fontSize: 24, color: '#FF6F61', marginLeft: 10 },
  projectItem: { padding: 15, backgroundColor: '#fff', borderRadius: 8, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  projectName: { fontSize: 16, color: '#333' },
  modalBackground: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContainer: { width: 300, padding: 20, backgroundColor: 'white', borderRadius: 8, alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '100%', padding: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 5, marginBottom: 20 },
});
