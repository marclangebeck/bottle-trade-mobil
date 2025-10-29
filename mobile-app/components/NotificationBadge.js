import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function NotificationBadge({ count = 0, onPress, style }) {
  if (!count || count === 0) {
    return null; // Keine Badge anzeigen wenn keine Nachrichten
  }

  return (
    <TouchableOpacity 
      style={[styles.badge, style]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.badgeText}>
        {count > 99 ? '99+' : count}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 1000,
    elevation: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
