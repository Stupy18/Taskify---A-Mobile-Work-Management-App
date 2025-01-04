import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import MainScreen from "@/components/MainScreen";
import CalendarScreen from "@/components/CalendarScreen";
import MapScreen from "@/components/MapScreen";
import TabBarIcon from "@/components/navigation/TabBarIcon";
import React from "react";
import { TaskProvider } from "@/contexts/TaskProvider";
import ProfileScreen from "@/components/ProfileScreen";
import { UserProvider } from "../../contexts/UserContext";
import { NavigationContainer } from "@react-navigation/native";

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
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
            <Tab.Screen
              name="Map"
              component={MapScreen}
              options={{
                tabBarLabel: "Map",
                tabBarIcon: ({ color, size }) => (
                  <TabBarIcon name="map" color={color} size={size} />
                ),
              }}
            />
          </Tab.Navigator>
        </TaskProvider>
      </UserProvider>
    </NavigationContainer>
  );
}