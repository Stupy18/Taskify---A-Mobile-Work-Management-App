import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      {/* The main index screen, where you'll define your main content */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      
      {/* If you want to define other screens, you can do so here */}
      {/* Example: Adding another screen */}
      {/* <Stack.Screen name="other" options={{ title: 'Other Screen' }} /> */}
    </Stack>
  );
}
