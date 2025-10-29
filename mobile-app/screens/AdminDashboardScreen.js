import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  StatusBar
} from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';

export default function AdminDashboardScreen({ onNavigate, onLogout, surveys = [], newsletters = [], systemMessages = [], notifications = [], isLoggedIn = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  // Berechne die echten Statistiken
  const activeSurveys = surveys.filter(survey => survey.status === 'active').length;
  const unreadNotifications = notifications.filter(notification => !notification.read).length;
  const totalNewsletters = newsletters.length;
  const totalSystemMessages = systemMessages.length;
  
  // Test-User aus testAuth.js
  const activeUsers = 2; // admin@bottle-trade.de und test@bottle-trade.de
  const openTradeRequests = 0; // Noch keine Tausch-Funktionalität implementiert
  const adminFeatures = [
    {
      id: 'surveys',
      title: 'Umfragen',
      description: 'Umfragen erstellen und verwalten',
      icon: '📊',
      color: '#4CAF50'
    },
    {
      id: 'newsletter',
      title: 'Newsletter',
      description: 'Newsletter erstellen und versenden',
      icon: '📧',
      color: '#2196F3'
    },
    {
      id: 'system-announcements',
      title: 'System-Ankündigungen',
      description: 'Wichtige Ankündigungen senden',
      icon: '📢',
      color: '#FF9800'
    }
  ];

  const handleFeaturePress = (featureId) => {
    switch(featureId) {
      case 'surveys':
        onNavigate('admin-surveys');
        break;
      case 'newsletter':
        onNavigate('admin-newsletter');
        break;
      case 'system-announcements':
        onNavigate('admin-system-messages');
        break;
      default:
        console.log('Feature not implemented yet:', featureId);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
      
      {/* StatusBar-Ersatz für iPhone */}
      <View style={{
        height: Platform.OS === 'ios' ? 60 : 0,
        backgroundColor: '#2c2c2c',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)'
      }} />
      
      <View style={styles.container}>
        <DynamicHamburgerMenu 
          onNavigate={onNavigate} 
          isLoggedIn={true} 
          onLogout={onLogout} 
          isAdmin={true} 
          unreadNotifications={0}
          renderButton={false}
          externalMenuVisible={isMenuVisible}
          onMenuToggle={setIsMenuVisible}
        />
        
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.hamburgerContainer}>
              <TouchableOpacity 
                style={styles.hamburgerButton}
                onPress={() => setIsMenuVisible(!isMenuVisible)}
              >
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
                <View style={styles.hamburgerLine} />
              </TouchableOpacity>
            </View>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Admin-Bereich</Text>
            </View>
            <View style={styles.headerRight}>
              {/* Kein Notification-Icon im Admin-Bereich */}
            </View>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              <Text style={styles.welcomeText}>
                Willkommen im Admin-Bereich! 👑
              </Text>
              <Text style={styles.subtitleText}>
                Hier können Sie alle administrativen Funktionen verwalten.
              </Text>

              {/* Admin Features Grid */}
              <View style={styles.featuresGrid}>
                {adminFeatures.map((feature) => (
                  <TouchableOpacity 
                    key={feature.id}
                    style={[styles.featureCard, { borderLeftColor: feature.color }]}
                    onPress={() => handleFeaturePress(feature.id)}
                  >
                    <Text style={styles.featureIcon}>{feature.icon}</Text>
                    <Text style={styles.featureTitle}>{feature.title}</Text>
                    <Text style={styles.featureDescription}>{feature.description}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quick Stats */}
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>Schnellübersicht</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{activeUsers}</Text>
                    <Text style={styles.statLabel}>Aktive Benutzer</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{openTradeRequests}</Text>
                    <Text style={styles.statLabel}>Offene Tausch-Anfragen</Text>
                  </View>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{activeSurveys}</Text>
                    <Text style={styles.statLabel}>Aktive Umfragen</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statNumber}>{unreadNotifications}</Text>
                    <Text style={styles.statLabel}>Ungelesene Nachrichten</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>
        <Footer />
      </View>
      <BottomNavigation onNavigate={onNavigate} isLoggedIn={isLoggedIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d5dfe0',
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 33.75,
    paddingBottom: 33.75,
    backgroundColor: '#2f3a3b',
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
    minHeight: 135,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
    width: 40,
    alignItems: 'center',
  },
  hamburgerButton: {
    padding: 5,
  },
  hamburgerLine: {
    width: 22,
    height: 2.5,
    backgroundColor: '#FFFFFF',
    marginVertical: 3,
    borderRadius: 1.5,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 0,
    width: 80,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  dashboardButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  dashboardButtonText: {
    fontSize: 22,
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitleText: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    marginBottom: 30,
  },
  featuresGrid: {
    marginBottom: 30,
  },
  featureCard: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  statsContainer: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    textAlign: 'center',
  },
});
