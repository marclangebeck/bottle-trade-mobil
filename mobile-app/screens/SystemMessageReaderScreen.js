import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import OptimizedImage from '../components/OptimizedImage';
import { getSystemMessage, markNotificationAsRead } from '../services/database-web';
import { getCurrentUser } from '../services/testAuth';

export default function SystemMessageReaderScreen({ onNavigate, onLogout, systemMessage: systemMessageProp, onMarkSystemMessageAsRead, messageId, isLoggedIn = false, unreadNotifications = 0, unreadHints = 0 }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [systemMessage, setSystemMessage] = useState(systemMessageProp);
  const [isLoading, setIsLoading] = useState(!systemMessageProp);
  
  // Lade SystemMessage aus Firestore, wenn nicht als Prop übergeben
  useEffect(() => {
    const loadSystemMessage = async () => {
      const targetMessageId = messageId || systemMessageProp?.id;
      if (!targetMessageId) {
        setIsLoading(false);
        return;
      }

      if (systemMessageProp) {
        // SystemMessage wurde als Prop übergeben, verwende es
        setSystemMessage(systemMessageProp);
        setIsLoading(false);
      } else {
        // Lade SystemMessage aus Firestore
        try {
          setIsLoading(true);
          const loadedMessage = await getSystemMessage(targetMessageId);
          if (loadedMessage) {
            setSystemMessage(loadedMessage);
          } else {
            Alert.alert('Fehler', 'System-Ankündigung nicht gefunden.');
            onNavigate('infobox');
          }
        } catch (error) {
          console.error('❌ Fehler beim Laden der System-Ankündigung:', error);
          Alert.alert('Fehler', 'System-Ankündigung konnte nicht geladen werden.');
          onNavigate('infobox');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadSystemMessage();
  }, [messageId, systemMessageProp?.id]);

  // SystemMessage-Notification als gelesen markieren, wenn sie geöffnet wird
  useEffect(() => {
    const markAsRead = async () => {
      if (!systemMessage?.id) return;
      
      const currentUser = getCurrentUser();
      if (!currentUser?.uid) return;

      // Finde Notification für diese SystemMessage
      try {
        const { getNotificationsForUser } = await import('../services/database-web');
        const notifications = await getNotificationsForUser(currentUser.uid);
        const systemNotification = notifications.find(n => 
          n.type === 'system' && n.systemMessageId === systemMessage.id
        );
        
        if (systemNotification) {
          await markNotificationAsRead(currentUser.uid, systemNotification.id);
          console.log('✅ System-Notification als gelesen markiert:', systemNotification.id);
        }
      } catch (error) {
        console.error('⚠️ Fehler beim Markieren als gelesen:', error);
      }
    };

    if (systemMessage) {
      markAsRead();
    }
  }, [systemMessage?.id]);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#F44336';
      case 'high': return '#FF9800';
      case 'normal': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'urgent': return 'Dringend';
      case 'high': return 'Hoch';
      case 'normal': return 'Normal';
      default: return 'Unbekannt';
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a9c7cd" />
          <Text style={styles.loadingText}>Lade System-Ankündigung...</Text>
        </View>
      </View>
    );
  }

  if (!systemMessage) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
        <DynamicHamburgerMenu 
          onNavigate={onNavigate} 
          isLoggedIn={true} 
          onLogout={onLogout} 
          isAdmin={false} 
          unreadNotifications={0}
          renderButton={false}
          externalMenuVisible={isMenuVisible}
          onMenuToggle={setIsMenuVisible}
        />
        <View style={styles.contentContainer}>
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
              <Text style={styles.greeting}>Systemnachricht</Text>
            </View>
            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.content}>
          <Text style={styles.errorText}>Keine Systemnachricht ausgewählt</Text>
        </View>
        <Footer />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* StatusBar-Ersatz für iPhone */}
      <View style={{
        height: Platform.OS === 'ios' ? 60 : 0,
        backgroundColor: '#2c2c2c',
        width: '100%',
      }} />
      <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
      
      <View style={styles.container}>
        <DynamicHamburgerMenu 
          onNavigate={onNavigate} 
          isLoggedIn={true} 
          onLogout={onLogout} 
          isAdmin={false} 
          unreadNotifications={unreadNotifications}
          unreadHints={unreadHints}
          renderButton={false}
          externalMenuVisible={isMenuVisible}
          onMenuToggle={setIsMenuVisible}
        />
        
        <View style={styles.contentContainer}>
          {/* Logo und Schriftzug mit Hamburger-Menü und Profil-Icon */}
          <View style={styles.logoHeaderContainer}>
            {/* Hamburger-Menü links */}
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
            
            {/* Bottle (Logo) Trade in der Mitte */}
            <View style={styles.logoHeaderCenter}>
              <Text style={styles.logoHeaderText}>Bottle</Text>
              <View style={styles.logoImageWrapper}>
                <OptimizedImage
                  source={require('../assets/images/Logo_white.png')}
                  style={styles.logoHeaderImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.logoHeaderText}>Trade</Text>
            </View>
            
            {/* Profil-Icon rechts */}
            <TouchableOpacity 
              style={styles.profileIconContainer}
              onPress={() => onNavigate('profil')}
            >
              <View style={styles.profileIconCircle}>
                <Text style={styles.profileIconText}>P</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>Systemnachricht</Text>
              </View>
            </View>
          </View>
          
          {/* Zurück-Button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => onNavigate('infobox')}
          >
            <Text style={styles.backButtonText}>← Zurück</Text>
          </TouchableOpacity>
          
          <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContentContainer}>
        <View style={styles.messageContainer}>
          <View style={styles.messageHeader}>
            <Text style={styles.messageTitle}>{systemMessage.title}</Text>
            <View style={styles.messageMeta}>
              <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(systemMessage.priority) }]}>
                <Text style={styles.priorityText}>{getPriorityText(systemMessage.priority)}</Text>
              </View>
              <Text style={styles.messageDate}>
                {systemMessage.createdAt 
                  ? (systemMessage.createdAt.toDate ? systemMessage.createdAt.toDate().toLocaleDateString('de-DE') : systemMessage.createdAt)
                  : 'Unbekannt'}
              </Text>
            </View>
          </View>
          
          <View style={styles.messageContent}>
            <Text style={styles.messageText}>{systemMessage.content}</Text>
          </View>
          
          <View style={styles.messageFooter}>
            <Text style={styles.footerText}>📢 Bottle-Trade Systemnachricht</Text>
            <Text style={styles.footerSubtext}>Diese Nachricht wurde an alle Benutzer gesendet.</Text>
          </View>
        </View>
          </ScrollView>
        </View>

      <Footer />
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadNotifications={unreadNotifications}
        unreadHints={unreadHints}
      />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c2c',
  },
  contentContainer: {
    flex: 1,
  },
  logoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 0, // Auf 0px gesetzt, damit Tagline direkt darunter liegt
  },
  logoHeaderCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  logoHeaderText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  logoImageWrapper: {
    width: 40,
    height: 40,
    marginLeft: 6, // Reduziert von 12 auf 6 (50%)
    marginRight: 6, // Reduziert von 12 auf 6 (50%)
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHeaderImage: {
    width: 40,
    height: 40,
  },
  profileIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  profileIconText: {
    fontSize: 25,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  taglineContainer: {
    paddingHorizontal: 20,
    paddingTop: 0, // Auf 0px gesetzt
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taglineText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.85,
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 0, // Auf 0px gesetzt, damit Tagline direkt darunter liegt
    backgroundColor: '#2c2c2c',
    position: 'relative',
    marginTop: 0,
    minHeight: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218, 165, 32, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)',
  },
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
    width: 44,
    alignItems: 'center',
    marginBottom: 8,
  },
  hamburgerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(47, 58, 59, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
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
  greetingContainer: {
    // Hintergrund und Border entfernt für elegantes Design
  },
  greeting: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  backButton: {
    padding: 10,
    marginBottom: 0,
    marginHorizontal: 20,
  },
  backButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#2c2c2c',
    marginTop: 0,
    paddingTop: 0,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
    paddingTop: 0,
  },
  messageContainer: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 10,
    padding: 20,
  },
  messageHeader: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
    lineHeight: 30,
  },
  messageMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messageDate: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  messageContent: {
    marginBottom: 20,
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
  messageFooter: {
    marginTop: 20,
    paddingTop: 15,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  footerText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  footerSubtext: {
    color: '#CCCCCC',
    fontSize: 12,
    fontStyle: 'italic',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
});