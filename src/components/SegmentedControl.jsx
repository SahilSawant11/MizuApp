import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

export const SegmentedControl = ({ 
  data, 
  selected, 
  onPress, 
  width, 
  height = 60,
  activeColor = '#6BCF9F',
  inactiveColor = '#9DB4A8'
}) => {
  return (
    <View style={[styles.container, { width, height }]}>
      <View style={styles.tabBar}>
        {data.map((item, index) => {
          const isSelected = selected.name === item.name;
          return (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.tabItem,
                isSelected && styles.selectedTab,
                index === 0 && styles.firstTab,
                index === data.length - 1 && styles.lastTab,
              ]}
              onPress={() => onPress(item)}
              activeOpacity={0.7}
            >
              <Icon 
                name={item.icon} 
                size={20} 
                color={isSelected ? activeColor : inactiveColor} 
                style={styles.icon}
              />
              <Text style={[
                styles.tabText,
                { color: isSelected ? activeColor : inactiveColor }
              ]}>
                {item.name}
              </Text>
              
              {isSelected && (
                <View style={[styles.selectionIndicator, { backgroundColor: activeColor }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E8F5EE',
    centerAlignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  firstTab: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  lastTab: {
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  selectedTab: {
    backgroundColor: '#FFFFFF',
  },
  icon: {
    marginBottom: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  selectionIndicator: {
    position: 'absolute',
    top: -4,
    width: 30,
    height: 3,
    borderRadius: 1.5,
  },
});