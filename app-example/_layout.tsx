import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MainScreen from '@/app/MainScreen';
import TabBarIcon from '@/components/navigation/TabBarIcon'; 

const Tab = createBottomTabNavigator();

export default function Layout() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="MainScreen" 
        component={MainScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabBarIcon name="home" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
