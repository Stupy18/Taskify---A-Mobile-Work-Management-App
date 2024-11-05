import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Button, FlatList, TextInput } from 'react-native';
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
    setShowProjectsModal(false);
    setShowCreateModal(true);
  };

  const handleJoinProject = () => {
    setShowProjectsModal(false);
    setShowJoinModal(true);
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
              <TouchableOpacity onPress={() => setShowProjectsModal(true)}>
                <Text style={styles.plusButton}>+</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        contentContainerStyle={styles.listContent}
      />

      {/* Main Modal for Create/Join Project Options */}
      <Modal
        visible={showProjectsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProjectsModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add Project</Text>
            <Button title="Create Project" onPress={handleCreateProject} />
            <Button title="Join Project" onPress={handleJoinProject} />
            <Button title="Close" onPress={() => setShowProjectsModal(false)} />
          </View>
        </View>
      </Modal>

      {/* Join Project Modal */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter Project ID</Text>
            <TextInput
              style={styles.input}
              placeholder="Project ID"
              value={projectId}
              onChangeText={setProjectId}
            />
            <Button title="Join Project" onPress={() => {
              console.log('Joining project with ID:', projectId);
              setShowJoinModal(false);
            }} />
            <Button title="Close" onPress={() => setShowJoinModal(false)} />
          </View>
        </View>
      </Modal>

      {/* Create Project Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Enter Project Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Project Name"
              value={projectName}
              onChangeText={setProjectName}
            />
            <Button title="Create Project" onPress={() => {
              console.log('Creating project with name:', projectName);
              setShowCreateModal(false);
            }} />
            <Button title="Close" onPress={() => setShowCreateModal(false)} />
          </View>
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
