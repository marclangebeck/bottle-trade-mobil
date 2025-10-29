import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';

export default function StartScreen() {
  // Mock-Daten
  const user = {
    name: 'Max Mustermann',
    btp: 1250,
    is_winery: true,
  };

  const recentWeine = [
    { id: 1, name: 'Chardonnay 2020', weingut: 'Weingut Müller', preis: '25€' },
    { id: 2, name: 'Pinot Noir 2019', weingut: 'Weingut Schmidt', preis: '35€' },
    { id: 3, name: 'Riesling 2021', weingut: 'Weingut Weber', preis: '20€' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>BT</Text>
          </View>
          <Text style={styles.greeting}>Guten Tag, {user.name}! 👋</Text>
          <Text style={styles.subtitle}>Willkommen in der Bottle-Trade-App</Text>
        </View>

      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Deine BTP</Text>
        <Text style={styles.btpAmount}>{user.btp}</Text>
        <Text style={styles.btpLabel}>Bottle Trade Points</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Neueste Weine</Text>
        {recentWeine.map((wein) => (
          <TouchableOpacity key={wein.id} style={styles.weinCard}>
            <View style={styles.weinInfo}>
              <Text style={styles.weinName}>{wein.name}</Text>
              <Text style={styles.weingut}>{wein.weingut}</Text>
            </View>
            <Text style={styles.preis}>{wein.preis}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schnellzugriff</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>🍷 Wein hinzufügen</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Text style={styles.actionText}>💰 BTP kaufen</Text>
          </TouchableOpacity>
        </View>
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF0000',
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#4fb0c6',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: '#8B4513',
    padding: 20,
    paddingTop: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  logoText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    backgroundColor: '#D2691E',
    width: 80,
    height: 80,
    borderRadius: 40,
    textAlign: 'center',
    lineHeight: 80,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#F5DEB3',
  },
  statsCard: {
    backgroundColor: 'rgba(210, 105, 30, 0.9)',
    margin: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  cardTitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  btpAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  btpLabel: {
    fontSize: 14,
    color: '#F5DEB3',
    marginTop: 5,
  },
  section: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
  },
  weinCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  weinInfo: {
    flex: 1,
  },
  weinName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  weingut: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  preis: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D2691E',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#8B4513',
    padding: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
