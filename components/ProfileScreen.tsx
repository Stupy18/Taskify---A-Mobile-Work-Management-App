import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker'; // Import from expo-image-picker
import { ThemedView } from '@/components/ThemedView';
import { InputWithButton } from '@/components/InputWithButton';

export default function ProfileScreen() {
  const [firstName, setFirstName] = useState('Prenume');
  const [secondName, setSecondName] = useState('Nume');
  const [username, setUsername] = useState('Username');
  const [email, setEmail] = useState('john.doe@example.com');
  const [profileImage, setProfileImage] = useState(null); // Holds the profile image URI
  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    setEditing(false);
    console.log('Saved Profile Data:', {
      firstName,
      secondName,
      username,
      email,
      profileImage,
    });
  };

  const handleImagePicker = async () => {
    if (!editing) return;

    // Request permission to access the media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }

    // Launch the image picker
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setProfileImage(result.assets[0].uri);
    } else {
      console.log('User canceled image picker');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Profile</Text>

      <TouchableOpacity onPress={handleImagePicker} disabled={!editing}>
        <Image
          source={
            profileImage
              ? { uri: profileImage }
              : require('@/assets/images/icon.png') // Use a local placeholder image if no profile image is set
          }
          style={styles.profileImage}
        />
      </TouchableOpacity>

      <View style={styles.infoContainer}>
        <InputWithButton
          placeholder="First Name"
          defaultValue={firstName}
          onChangeText={setFirstName}
          editable={editing}
        />
        <InputWithButton
          placeholder="Second Name"
          defaultValue={secondName}
          onChangeText={setSecondName}
          editable={editing}
        />
        <InputWithButton
          placeholder="Username"
          defaultValue={username}
          onChangeText={setUsername}
          editable={editing}
        />
        <InputWithButton
          placeholder="Email"
          defaultValue={email}
          onChangeText={setEmail}
          editable={editing}
        />
      </View>

      <TouchableOpacity
        style={[styles.button, editing ? styles.saveButton : styles.editButton]}
        onPress={editing ? handleSave : () => setEditing(true)}
      >
        <Text style={styles.buttonText}>{editing ? 'Save' : 'Edit Profile'}</Text>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f8',
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
});
