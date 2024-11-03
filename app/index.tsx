import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CreateAccount from '@/components/CreateAccount'; 
import MainScreen from '@/components/MainScreen';
import CalendarScreen from '@/components/CalendarScreen';
import TabBarIcon from '@/components/navigation/TabBarIcon';  
import { AuthProvider, useAuth } from '@/contexts/authContext';
import AuthScreen from '@/components/AuthScreen';

const Tab = createBottomTabNavigator();

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false, // Hide the top header
      }}
    >
      <Tab.Screen
        name="Main"
        component={MainScreen}
        options={{
          tabBarLabel: 'Main',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="home" color={color} size={size} />  
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={CreateAccount}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="person" color={color} size={size} />  
          ),
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="calendar" color={color} size={size} />  
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { userLoggedIn } = useAuth();

  return (
    <AuthProvider>
      <NavigationContainer>
        {userLoggedIn ? <AppTabs /> : <AuthScreen />}
      </NavigationContainer>
    </AuthProvider>
  );
}
