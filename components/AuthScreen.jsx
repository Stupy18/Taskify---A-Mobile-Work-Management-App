import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { doSignInWithEmailAndPassword, doCreateUserWithEmailAndPassword, doSignInWithGoogle } from '@/firebase/auth';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(true);

  const handleAuth = async () => {
    try {
      if (isSigningIn) {
        await doSignInWithEmailAndPassword(email, password);
      } else {
        await doCreateUserWithEmailAndPassword(email, password);
      }
    } catch (error) {
      Alert.alert('Authentication error', error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await doSignInWithGoogle();
    } catch (error) {
      Alert.alert('Google Sign-In error', error.message);
    }
  };

  return (
    <View>
      <Text>{isSigningIn ? 'Sign In' : 'Sign Up'}</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={isSigningIn ? 'Sign In' : 'Sign Up'} onPress={handleAuth} />
      <Button
        title={`Switch to ${isSigningIn ? 'Sign Up' : 'Sign In'}`}
        onPress={() => setIsSigningIn(!isSigningIn)}
      />
      {/* Google Sign-In Button */}
      <Button title="Sign in with Google" onPress={handleGoogleSignIn} />
    </View>
  );
}
