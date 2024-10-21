import { useState } from 'react';
import { StyleSheet, TextInput, Button, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';

export function InputWithButton({ placeholder, buttonText }: { placeholder: string, buttonText: string }) {
  const [inputText, setInputText] = useState('');

  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={inputText}
        onChangeText={setInputText}
      />
      <Button title={buttonText} onPress={() => console.log(inputText)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginRight: 10,
    flex: 1,
  },
});
