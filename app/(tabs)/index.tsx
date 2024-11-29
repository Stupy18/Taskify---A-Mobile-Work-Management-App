import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MainScreen from "@/components/MainScreen";
import CalendarScreen from "@/components/CalendarScreen";
import TabBarIcon from "@/components/navigation/TabBarIcon";
import React from "react";
import { TaskProvider, useTasks } from "@/contexts/TaskProvider";
import ProfileScreen from "@/components/ProfileScreen";
import { UserProvider } from "../../contexts/UserContext";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <UserProvider>
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
              tabBarLabel: "Main",
              tabBarIcon: ({ color, size }) => (
                <TabBarIcon name="home" color={color} size={size} />
              ),
            }}
          />
          {/* <Tab.Screen
            name="Profile Creation"
            component={CreateAccount}
            options={{
              tabBarLabel: 'Profile Creation',
              tabBarIcon: ({ color, size }) => (
                <TabBarIcon name="person" color={color} size={size} />  
              ),
            }}
          /> */}
          <Tab.Screen
            name="Profile Screen"
            component={ProfileScreen}
            options={{
              tabBarLabel: "Profile Screen",
              tabBarIcon: ({ color, size }) => (
                <TabBarIcon name="person" color={color} size={size} />
              ),
            }}
          />
          <Tab.Screen
            name="Calendar"
            component={CalendarScreen}
            options={{
              tabBarLabel: "Calendar",
              tabBarIcon: ({ color, size }) => (
                <TabBarIcon name="calendar" color={color} size={size} />
              ),
            }}
          />
        </Tab.Navigator>
      </TaskProvider>
    </UserProvider>
  );
}
