import React, { useState } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  Alert
} from 'react-native';
import Footer from './Footer';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import NotificationBadge from './components/NotificationBadge';
import BottomNavigation from './components/BottomNavigation';

export default function CommunityScreen({ onNavigate, onLogout, isAdmin = false, unreadNotifications = 0, isLoggedIn = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  const communitySections = [
    {
      id: 'userinnen',
      title: 'Userinnen/User',
      icon: '👤',
      description: 'Community-Mitglieder entdecken',
    },
    {
      id: 'schwarzes-brett',
      title: 'Schwarzes Brett',
      icon: '📋',
      description: 'Ankündigungen und Nachrichten',
    },
    {
      id: 'statistiken',
      title: 'Statistiken',
      icon: '📊',
      description: 'Community-Übersicht und Daten',
    },
    {
      id: 'gaestebuch',
      title: 'Gästebuch',
      icon: '📝',
      description: 'Hinterlasse deine Nachricht',
    },
    {
      id: 'fotowand',
      title: 'Fotowand',
      icon: '📸',
      description: 'Teile deine Wein-Momente',
    },
    {
      id: 'umfragen',
      title: 'Umfragen',
      icon: '🗳️',
      description: 'Nimm an Abstimmungen teil',
    },
    {
      id: 'weingueter',
      title: 'Weingüter',
      icon: '🏰',
      description: 'Entdecke Weingüter',
    }
  ];

  const handleSectionPress = (section) => {
    Alert.alert(
      section.title,
      `${section.description}\n\nDiese Funktion wird bald verfügbar sein!`,
      [{ text: 'OK' }]
    );
  };

  return (
    <View style={styles.container}>
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
      
      <DynamicHamburgerMenu 
        onNavigate={onNavigate} 
        isLoggedIn={true} 
        onLogout={onLogout} 
        isAdmin={isAdmin} 
        unreadNotifications={unreadNotifications}
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
            <Text style={styles.greeting}>Community</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => onNavigate('notifications')}
            >
              <Text style={styles.notificationIcon}>🔔</Text>
              <NotificationBadge 
                count={unreadNotifications}
                onPress={() => onNavigate('notifications')}
              />
            </TouchableOpacity>
          </View>
        </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              {/* Community Kacheln */}
              <View style={styles.tilesGrid}>
                {/* Zeile 1 */}
                <View style={styles.tilesRow}>
                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => handleSectionPress(communitySections[0])}>
                    <Text style={styles.tileIcon}>{communitySections[0].icon}</Text>
                    <Text style={styles.tileTitle}>{communitySections[0].title}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => handleSectionPress(communitySections[1])}>
                    <Text style={styles.tileIcon}>{communitySections[1].icon}</Text>
                    <Text style={styles.tileTitle}>{communitySections[1].title}</Text>
                  </TouchableOpacity>
                </View>

                {/* Zeile 2 */}
                <View style={styles.tilesRow}>
                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => handleSectionPress(communitySections[2])}>
                    <Text style={styles.tileIcon}>{communitySections[2].icon}</Text>
                    <Text style={styles.tileTitle}>{communitySections[2].title}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => handleSectionPress(communitySections[3])}>
                    <Text style={styles.tileIcon}>{communitySections[3].icon}</Text>
                    <Text style={styles.tileTitle}>{communitySections[3].title}</Text>
                  </TouchableOpacity>
                </View>

                {/* Zeile 3 */}
                <View style={styles.tilesRow}>
                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => handleSectionPress(communitySections[4])}>
                    <Text style={styles.tileIcon}>{communitySections[4].icon}</Text>
                    <Text style={styles.tileTitle}>{communitySections[4].title}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.tile, styles.centeredTile]} onPress={() => handleSectionPress(communitySections[5])}>
                    <Text style={styles.tileIcon}>{communitySections[5].icon}</Text>
                    <Text style={styles.tileTitle}>{communitySections[5].title}</Text>
                  </TouchableOpacity>
                </View>

                {/* Zeile 4 - Volle Breite */}
                <TouchableOpacity style={[styles.tileFullWidth, styles.centeredTile]} onPress={() => handleSectionPress(communitySections[6])}>
                  <View style={styles.tileFullContent}>
                    <Text style={styles.tileIcon}>{communitySections[6].icon}</Text>
                    <View style={styles.tileFullText}>
                      <Text style={styles.tileTitle}>{communitySections[6].title}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      <Footer />
      
      {/* Fixed Bottom Navigation */}
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
    backgroundColor: '#d5dfe0',
  },
  // Header Styles
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
    width: 80, // Mehr Platz für beide Buttons
    alignItems: 'center',
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 20,
    color: '#FFFFFF',
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
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  tilesGrid: {
    marginTop: 10,
  },
  tilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  tile: {
    flex: 1,
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
  },
  centeredTile: {
    justifyContent: 'center',
  },
  tileFullWidth: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tileFullContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tileFullText: {
    flex: 1,
    marginLeft: 15,
  },
  tileIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  tileTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
});