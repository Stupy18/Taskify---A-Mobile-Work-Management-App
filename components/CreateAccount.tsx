import React, { useState } from 'react';
import { InputWithButton } from '@/components/InputWithButton';
import { ThemedView } from '@/components/ThemedView';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

export default function CreateAccount() {
  const [firstName, setFirstName] = useState('');
  const [secondName, setSecondName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    console.log('Submitted Values:', {
      firstName,
      secondName,
      username,
      email,
      password,
    });
  };

  return (
    <ThemedView style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <InputWithButton placeholder="First Name" onChangeText={setFirstName} />
      <InputWithButton placeholder="Second Name" onChangeText={setSecondName} />
      <InputWithButton placeholder="Username" onChangeText={setUsername} />
      <InputWithButton placeholder="Email" onChangeText={setEmail} />
      <InputWithButton placeholder="Password" onChangeText={setPassword} />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6F61',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    marginTop: 10, // Adjusted margin
  },
  submitButton: {
    backgroundColor: '#FF6F61', // Button background color
    padding: 10, // Button padding
    borderRadius: 5, // Button border radius
    alignItems: 'center', // Center the text
  },
  submitButtonText: {
    color: '#ffffff', // Text color
    fontSize: 16, // Text size
    fontWeight: 'bold', // Text weight
  },
});
