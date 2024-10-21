import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

type InputWithButtonProps = {
  placeholder: string;
  onChangeText: (text: string) => void; 
};

export function InputWithButton({ placeholder, onChangeText }: InputWithButtonProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10, // Reduced vertical margin
    backgroundColor: '#f9f9f9',
    borderRadius: 8, // Smaller border radius
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1, // Reduced shadow height
    },
    shadowOpacity: 0.1,
    shadowRadius: 2, // Reduced shadow radius
    elevation: 1, // Reduced elevation
    padding: 8, // Reduced padding
  },
  input: {
    flex: 1,
    height: 40, // Reduced input height
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8, // Smaller border radius
    paddingHorizontal: 10,
    fontSize: 14, // Smaller font size
  },
});
