import React from 'react';
import { Ionicons } from '@expo/vector-icons'; 

interface TabBarIconProps {
  name: keyof typeof Ionicons.glyphMap;
  size?: number;
  color?: string;
}

export default function TabBarIcon({ name, size = 24, color = 'black' }: TabBarIconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
