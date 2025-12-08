import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';

/**
 * Loading-Komponente für Lazy-Loaded Screens
 * Wird angezeigt, während ein Screen geladen wird
 */
export default function LazyScreenLoader() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#DAA520" />
      <Text style={styles.text}>Lade...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c2c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#FFFFFF',
    marginTop: 16,
    fontSize: 16,
  },
});

