// navigators/SegmentedTabNavigator.jsx
import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { SegmentedControl } from '../components/SegmentedControl';
import { HomeScreen } from '../screens/HomeScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

const tabData = [
  { 
    name: 'Today', 
    icon: 'home',
    component: HomeScreen 
  },
  { 
    name: 'Calendar', 
    icon: 'calendar',
    component: CalendarScreen 
  },
  { 
    name: 'Profile', 
    icon: 'user',
    component: ProfileScreen 
  },
];

export const SegmentedTabNavigator = () => {
  const [selectedTab, setSelectedTab] = useState(tabData[0]);
  const { width } = useWindowDimensions();

  const CurrentScreen = selectedTab.component;

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        <CurrentScreen />
      </View>

      {/* Segmented Control */}
      <SegmentedControl
        data={tabData}
        selected={selectedTab}
        onPress={setSelectedTab}
        width={width - 60}
        height={80}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
});