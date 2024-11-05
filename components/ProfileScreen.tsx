import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Button, FlatList } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ThemedView } from '@/components/ThemedView';
import { InputWithButton } from '@/components/InputWithButton';

export default function ProfileScreen() {
  const [firstName, setFirstName] = useState('Prenume');
  const [secondName, setSecondName] = useState('Nume');
  const [username, setUsername] = useState('Username');
  const [email, setEmail] = useState('john.doe@example.com');
  const [profileImage, setProfileImage] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
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
    console.log('Creating a new project...');
  };

  const handleJoinProject = () => {
    console.log('Joining an existing project...');
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

      {/* Modal for Create/Join Project */}
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
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  listContent: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FF6F61',
    textAlign: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  infoContainer: {
    marginBottom: 30,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#FF6F61',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  projectsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  projectsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  plusButton: {
    fontSize: 24,
    color: '#FF6F61',
    marginLeft: 10,
  },
  projectItem: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  projectName: {
    fontSize: 16,
    color: '#333',
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 8,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
