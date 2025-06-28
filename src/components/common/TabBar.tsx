import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';

interface TabBarItem {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface TabBarProps {
  tabs: TabBarItem[];
  current: string;
  onTabPress: (key: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({ tabs, current, onTabPress }) => {
  return (
    <View style={styles.container}>
      {tabs.map(tab => {
        const focused = tab.key === current;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, focused && styles.tabFocused]}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={tab.icon}
              size={24}
              color={focused ? theme.colors.primary : theme.colors.textLight}
            />
            <Text style={[styles.label, focused && styles.labelFocused]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.borderRadius.lg,
    borderTopRightRadius: theme.borderRadius.lg,
    ...theme.shadows.sm,
    paddingBottom: theme.spacing.sm,
    paddingTop: theme.spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  tabFocused: {
    backgroundColor: theme.colors.secondary,
    ...theme.shadows.sm,
  },
  label: {
    marginTop: 2,
    fontFamily: theme.typography.fontFamily.medium,
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textLight,
  },
  labelFocused: {
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily.bold,
  },
});

export default TabBar; 