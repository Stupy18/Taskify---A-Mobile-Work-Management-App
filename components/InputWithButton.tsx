import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

type InputWithButtonProps = {
  placeholder: string;
  onChangeText: (text: string) => void;
  defaultValue?: string;  // Added defaultValue
  editable?: boolean;     // Added editable
};

export function InputWithButton({
  placeholder,
  onChangeText,
  defaultValue,
  editable = true,
}: InputWithButtonProps) {
  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        onChangeText={onChangeText}
        defaultValue={defaultValue} // Apply defaultValue here
        editable={editable}         // Apply editable here
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
    padding: 8,
  },
  input: {
    flex: 1,
    height: 40,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 14,
  },
});
