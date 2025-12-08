import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
import OptimizedImage from '../components/OptimizedImage';

export default function AdminSystemMessagesScreen({ onNavigate, onLogout, systemMessages = [], onCreateSystemMessage, onSendSystemMessage, onDeleteSystemMessage, isLoggedIn = false, unreadCount = 0 }, isPro = false) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isCreatingMessage, setIsCreatingMessage] = useState(false);
  const [isCreating, setIsCreating] = useState(false); // Verhindert doppelte Aufrufe
  const [messageData, setMessageData] = useState({
    title: '',
    content: '',
    priority: 'normal'
  });

  const handleCreateMessage = async () => {
    // Verhindere doppelte Aufrufe
    if (isCreating) {
      console.log('⚠️ Erstellung läuft bereits, überspringe erneuten Aufruf');
      return;
    }

    console.log('🔄 Erstelle neue Systemnachricht...', messageData);
    
    if (!messageData.title.trim() || !messageData.content.trim()) {
      console.log('❌ Fehler: Pflichtfelder nicht ausgefüllt');
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    console.log('✅ Systemnachricht-Daten validiert, erstelle Systemnachricht...');
    setIsCreating(true);

    try {
      if (onCreateSystemMessage) {
        await onCreateSystemMessage(messageData);
        console.log('✅ Systemnachricht erfolgreich erstellt und an App.js weitergegeben');
        
        Alert.alert('Erfolg', 'Systemnachricht wurde erfolgreich erstellt! Sie können sie jetzt über den "Senden"-Button versenden.');
        setIsCreatingMessage(false);
        setMessageData({
          title: '',
          content: '',
          priority: 'normal'
        });
      } else {
        Alert.alert('Fehler', 'Erstellungs-Funktion nicht verfügbar.');
      }
    } catch (error) {
      console.error('❌ Fehler beim Erstellen der Systemnachricht:', error);
      Alert.alert('Fehler', 'Systemnachricht konnte nicht erstellt werden: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    onNavigate('admin-dashboard');
  };

  const handleSendMessage = async (message) => {
    // Prüfe, ob Systemnachricht bereits versendet wurde
    if (message.status === 'sent') {
      Alert.alert('Hinweis', 'Diese Systemnachricht wurde bereits versendet.');
      return;
    }

    Alert.alert(
      'Systemnachricht senden',
      `Möchten Sie die Systemnachricht "${message.title}" wirklich an alle Benutzer senden?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Senden', 
          style: 'default', 
          onPress: async () => {
            try {
              console.log('📢 Systemnachricht gesendet:', message.id);
              if (onSendSystemMessage) {
                const notificationCount = await onSendSystemMessage(message.id);
                // Alert wird bereits in sendSystemMessage angezeigt
              } else {
                Alert.alert('Fehler', 'Send-Funktion nicht verfügbar.');
              }
            } catch (error) {
              console.error('❌ Fehler beim Versenden:', error);
              Alert.alert('Fehler', 'Systemnachricht konnte nicht versendet werden: ' + (error.message || 'Unbekannter Fehler'));
            }
          }
        }
      ]
    );
  };

  const handleDeleteMessage = async (message) => {
    Alert.alert(
      'Systemnachricht löschen',
      `Möchten Sie die Systemnachricht "${message.title}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen', 
          style: 'destructive', 
          onPress: async () => {
            try {
              console.log('🗑️ Systemnachricht gelöscht:', message.id);
              if (onDeleteSystemMessage) {
                await onDeleteSystemMessage(message.id);
                // Alert wird bereits in deleteSystemMessage angezeigt
              } else {
                Alert.alert('Fehler', 'Lösch-Funktion nicht verfügbar.');
              }
            } catch (error) {
              console.error('❌ Fehler beim Löschen:', error);
              Alert.alert('Fehler', 'Systemnachricht konnte nicht gelöscht werden: ' + (error.message || 'Unbekannter Fehler'));
            }
          }
        }
      ]
    );
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
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)'
      }} />
      
      <DynamicHamburgerMenu 
        onNavigate={onNavigate} 
        isLoggedIn={true} 
        onLogout={onLogout} 
        isAdmin={true} 
        unreadCount={unreadCount}
        renderButton={false}
        externalMenuVisible={isMenuVisible}
        onMenuToggle={setIsMenuVisible}
      />
      
      <View style={styles.contentContainer}>
        {/* Logo und Schriftzug mit Hamburger-Menü und Profil-Icon */}
        <View style={styles.logoHeaderContainer}>
          {/* Hamburger-Menü links */}
          <View style={styles.headerLeft}>
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
          <View style={styles.profileSection}>
            <TouchableOpacity 
              style={styles.profileIconContainer}
              onPress={() => onNavigate('profil')}
            >
              <View style={styles.profileIconCircle}>
                <Text style={styles.profileIconText}>A</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Tagline unter dem Logo-Header */}
        <View style={styles.taglineContainer}>
          <Text style={styles.taglineText}>Tausch dich durch die Welt der Weine.</Text>
        </View>
        
        {/* Header mit Überschrift */}
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>System</Text>
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.dashboardContainer}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBack}
            >
              <Text style={styles.backButtonText}>← Zurück zum Admin-Bereich</Text>
            </TouchableOpacity>
            
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Systemnachrichten verwalten</Text>
          
              {!isCreatingMessage ? (
                <View>
                  <TouchableOpacity 
                    style={styles.createMessageButton} 
                    onPress={() => setIsCreatingMessage(true)}
                  >
                    <Text style={styles.createMessageButtonText}>📢 Neue Systemnachricht erstellen</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.messageForm}>
                  <Text style={styles.formTitle}>Neue Systemnachricht erstellen</Text>
                  
                  <Text style={styles.label}>Titel *</Text>
                  <TextInput
                    style={styles.input}
                    value={messageData.title}
                    onChangeText={(text) => setMessageData({...messageData, title: text})}
                    placeholder="Systemnachricht-Titel eingeben"
                    placeholderTextColor="#999999"
                  />
                  
                  <Text style={styles.label}>Inhalt *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={messageData.content}
                    onChangeText={(text) => setMessageData({...messageData, content: text})}
                    placeholder="Systemnachricht-Inhalt eingeben"
                    placeholderTextColor="#999999"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                  
                  <Text style={styles.label}>Priorität</Text>
                  <View style={styles.priorityContainer}>
                    <TouchableOpacity
                      style={[
                        styles.priorityOption,
                        messageData.priority === 'normal' && styles.priorityOptionActive
                      ]}
                      onPress={() => setMessageData({...messageData, priority: 'normal'})}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        messageData.priority === 'normal' && styles.priorityOptionTextActive
                      ]}>🟢 Normal</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.priorityOption,
                        messageData.priority === 'high' && styles.priorityOptionActive
                      ]}
                      onPress={() => setMessageData({...messageData, priority: 'high'})}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        messageData.priority === 'high' && styles.priorityOptionTextActive
                      ]}>🟠 Hoch</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.priorityOption,
                        messageData.priority === 'urgent' && styles.priorityOptionActive
                      ]}
                      onPress={() => setMessageData({...messageData, priority: 'urgent'})}
                    >
                      <Text style={[
                        styles.priorityOptionText,
                        messageData.priority === 'urgent' && styles.priorityOptionTextActive
                      ]}>🔴 Dringend</Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.label}>Zielgruppe</Text>
                  <View style={styles.targetGroupContainer}>
                    <Text style={styles.targetGroupText}>👥 Alle Benutzer</Text>
                    <Text style={styles.targetGroupSubtext}>Alle registrierten Benutzer der App</Text>
                  </View>
                  
                  <View style={styles.formButtons}>
                    <TouchableOpacity 
                      style={styles.cancelButton} 
                      onPress={() => setIsCreatingMessage(false)}
                    >
                      <Text style={styles.cancelButtonText}>Abbrechen</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.createButton, isCreating && styles.createButtonDisabled]} 
                      onPress={handleCreateMessage}
                      disabled={isCreating}
                    >
                      <Text style={styles.createButtonText}>
                        {isCreating ? 'Erstelle...' : 'Systemnachricht erstellen'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
              
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bestehende Systemnachrichten</Text>
              {systemMessages.length === 0 ? (
                <Text style={styles.emptyText}>Noch keine Systemnachrichten erstellt</Text>
              ) : (
                <View>
                  {systemMessages.map((message, index) => (
                    <View key={`msg-${index}`} style={styles.messageCardWrapper}>
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.messageCard}
                      >
                        <View style={styles.messageHeader}>
                          <Text style={styles.messageTitle}>{message.title}</Text>
                          <Text style={styles.messageDate}>
                            {message.createdAt 
                              ? (message.createdAt.toDate 
                                ? message.createdAt.toDate().toLocaleDateString('de-DE') 
                                : message.createdAt.seconds 
                                  ? new Date(message.createdAt.seconds * 1000).toLocaleDateString('de-DE')
                                  : new Date(message.createdAt).toLocaleDateString('de-DE'))
                              : 'Unbekannt'}
                          </Text>
                        </View>
                        
                        <Text style={styles.messageContent} numberOfLines={3}>
                          {message.content}
                        </Text>
                        
                        <View style={styles.messageStats}>
                          <Text style={styles.statText}>Priorität: {message.priority}</Text>
                          <Text style={styles.statText}>Status: {message.status || 'Entwurf'}</Text>
                        </View>
                        
                        <View style={styles.messageActions}>
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.sendButton]} 
                            onPress={() => handleSendMessage(message)}
                          >
                            <Text style={styles.actionButtonText}>📤 Senden</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.deleteButton]} 
                            onPress={() => handleDeleteMessage(message)}
                          >
                            <Text style={styles.actionButtonText}>🗑️ Löschen</Text>
                          </TouchableOpacity>
                        </View>
                      </LinearGradient>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
          </ScrollView>
        </View>
      <Footer />
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadCount={unreadCount}
      />
      
      {/* ProVersion Button */}
      <ProVersionButton 
        onNavigate={onNavigate}
        isPro={isPro}
        isLoggedIn={isLoggedIn}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c2c', // Gleiche Farbe wie StatusBar-Ersatz-View, verhindert weißen Strich
  },
  contentContainer: {
    flex: 1,
  },
  logoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  profileSection: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
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

  headerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
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
    borderRadius: 22, // Vollständig rund
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
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#2c2c2c',
    position: 'relative',
    marginTop: 0,
    minHeight: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
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
    marginBottom: 10,
  },
  backButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    color: '#2f3a3b',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#D2691E',
    paddingBottom: 8,
  },
  createMessageButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#D2691E',
    borderStyle: 'dashed',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createMessageButtonText: {
    color: '#D2691E',
    fontSize: 16,
    fontWeight: '600',
  },
  messageForm: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(47, 58, 59, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  formTitle: {
    color: '#2f3a3b',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#D2691E',
    paddingBottom: 8,
  },
  label: {
    color: '#2f3a3b',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#F8F9FA',
    color: '#333333',
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
    color: '#333333',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  priorityOption: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  priorityOptionActive: {
    backgroundColor: '#D2691E',
    borderColor: '#D2691E',
  },
  priorityOptionText: {
    color: '#2f3a3b',
    fontSize: 14,
    fontWeight: '600',
  },
  priorityOptionTextActive: {
    color: '#FFFFFF',
  },
  targetGroupContainer: {
    backgroundColor: '#F8F9FA',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#D2691E',
  },
  targetGroupText: {
    color: '#D2691E',
    fontSize: 16,
    fontWeight: '600',
  },
  targetGroupSubtext: {
    color: '#666666',
    fontSize: 14,
    marginTop: 5,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 0.45,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#2f3a3b',
    fontSize: 14,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#D2691E',
    borderWidth: 0,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flex: 0.45,
    alignItems: 'center',
    shadowColor: '#D2691E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  messageCardWrapper: {
    marginBottom: 15,
  },
  messageCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  messageTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
    opacity: 0.95,
  },
  messageDate: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.75,
  },
  messageContent: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
    opacity: 0.85,
  },
  messageStats: {
    marginBottom: 15,
  },
  statText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 5,
    opacity: 0.75,
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 2,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  sendButton: {
    borderColor: 'rgba(218, 165, 32, 0.5)',
  },
  deleteButton: {
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  emptyText: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});