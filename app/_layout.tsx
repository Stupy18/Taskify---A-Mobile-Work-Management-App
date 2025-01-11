import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import 'react-native-reanimated';

import { UserProvider } from '../contexts/UserContext';
import { TaskProvider } from '@/contexts/TaskProvider';
import { ProjectProvider } from '@/contexts/ProjectProvider';
import { NotificationProvider } from '@/contexts/NotificationContext';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <UserProvider>
      <ProjectProvider>
      <NotificationProvider>
        <TaskProvider>
          <Stack>
            <Stack.Screen 
              name="(tabs)" 
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </TaskProvider>
        </NotificationProvider>
      </ProjectProvider>
    </UserProvider>
  );
}