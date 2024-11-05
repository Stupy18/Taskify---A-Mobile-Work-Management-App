import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CreateAccount from '@/components/CreateAccount'; 
import MainScreen from '@/components/MainScreen';
import CalendarScreen from '@/components/CalendarScreen';
import TabBarIcon from '@/components/navigation/TabBarIcon';  
import React from 'react';
import  { TaskProvider, useTasks } from '@/components/TaskProvider';
import ProfileScreen from '@/components/ProfileScreen';


const Tab = createBottomTabNavigator();

export default function App() {
  return (
    // Wrap the entire app in TaskProvider to provide task context
    <TaskProvider>
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
            name="Profile Creation"
            component={CreateAccount}
            options={{
              tabBarLabel: 'Profile Creation',
              tabBarIcon: ({ color, size }) => (
                <TabBarIcon name="person" color={color} size={size} />  
              ),
            }}
          />
          <Tab.Screen
            name="Profile Screen"
            component={ProfileScreen}
            options={{
              tabBarLabel: 'Profile Screen',
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
    </TaskProvider>
  );
}
