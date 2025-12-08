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
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
import OptimizedImage from '../components/OptimizedImage';

export default function AdminNewsletterScreen({ onNavigate, onLogout, newsletters = [], onCreateNewsletter, onSendNewsletter, onDeleteNewsletter, isLoggedIn = false, unreadCount = 0 }, isPro = false) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isCreatingNewsletter, setIsCreatingNewsletter] = useState(false);
  const [isCreating, setIsCreating] = useState(false); // Verhindert doppelte Aufrufe
  const [newsletterData, setNewsletterData] = useState({
    title: '',
    content: '',
    targetGroup: 'newsletter_subscribers' // Nur Newsletter-Abonnenten
  });

  const handleCreateNewsletter = async () => {
    // Verhindere doppelte Aufrufe
    if (isCreating) {
      console.log('⚠️ Erstellung läuft bereits, überspringe erneuten Aufruf');
      return;
    }

    console.log('🔄 Erstelle neuen Newsletter...', newsletterData);
    
    if (!newsletterData.title.trim() || !newsletterData.content.trim()) {
      console.log('❌ Fehler: Pflichtfelder nicht ausgefüllt');
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    console.log('✅ Newsletter-Daten validiert, erstelle Newsletter...');
    setIsCreating(true);

    try {
      if (onCreateNewsletter) {
        await onCreateNewsletter(newsletterData);
        console.log('✅ Newsletter erfolgreich erstellt und an App.js weitergegeben');
        
        Alert.alert('Erfolg', 'Newsletter wurde erfolgreich erstellt! Sie können ihn jetzt über den "Senden"-Button versenden.');
        setIsCreatingNewsletter(false);
        setNewsletterData({
          title: '',
          content: '',
          targetGroup: 'newsletter_subscribers'
        });
      } else {
        Alert.alert('Fehler', 'Erstellungs-Funktion nicht verfügbar.');
      }
    } catch (error) {
      console.error('❌ Fehler beim Erstellen des Newsletters:', error);
      Alert.alert('Fehler', 'Newsletter konnte nicht erstellt werden: ' + (error.message || 'Unbekannter Fehler'));
    } finally {
      setIsCreating(false);
    }
  };

  const handleBack = () => {
    onNavigate('admin-dashboard');
  };

  const handleSendNewsletter = async (newsletter) => {
    // Prüfe, ob Newsletter bereits versendet wurde
    if (newsletter.status === 'sent') {
      Alert.alert('Hinweis', 'Dieser Newsletter wurde bereits versendet.');
      return;
    }

    Alert.alert(
      'Newsletter senden',
      `Möchten Sie den Newsletter "${newsletter.title}" wirklich an alle Newsletter-Abonnenten senden?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Senden', 
          style: 'default', 
          onPress: async () => {
            try {
              console.log('📧 Versende Newsletter:', newsletter.id);
              if (onSendNewsletter) {
                const notificationCount = await onSendNewsletter(newsletter.id, newsletter.targetGroup || 'newsletter_subscribers');
                Alert.alert('Erfolg', `Newsletter wurde erfolgreich an ${notificationCount} Abonnenten gesendet!`);
              } else {
                Alert.alert('Fehler', 'Send-Funktion nicht verfügbar.');
              }
            } catch (error) {
              console.error('❌ Fehler beim Versenden:', error);
              Alert.alert('Fehler', 'Newsletter konnte nicht versendet werden: ' + error.message);
            }
          }
        }
      ]
    );
  };

  const handleDeleteNewsletter = (newsletter) => {
    Alert.alert(
      'Newsletter löschen',
      `Möchten Sie den Newsletter "${newsletter.title}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { 
          text: 'Löschen', 
          style: 'destructive', 
          onPress: async () => {
            try {
              console.log('🗑️ Lösche Newsletter:', newsletter.id);
              if (onDeleteNewsletter) {
                await onDeleteNewsletter(newsletter.id);
                Alert.alert('Erfolg', 'Newsletter wurde gelöscht!');
              } else {
                Alert.alert('Fehler', 'Lösch-Funktion nicht verfügbar.');
              }
            } catch (error) {
              console.error('❌ Fehler beim Löschen:', error);
              Alert.alert('Fehler', 'Newsletter konnte nicht gelöscht werden.');
            }
          }
        }
      ]
    );
  };

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
              <Text style={styles.greeting}>Newsletter</Text>
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
              <Text style={styles.sectionTitle}>Newsletter verwalten</Text>
              
              {!isCreatingNewsletter ? (
                <View>
                  <TouchableOpacity 
                    style={styles.createNewsletterButton} 
                    onPress={() => setIsCreatingNewsletter(true)}
                  >
                    <Text style={styles.createNewsletterButtonText}>📧 Neuen Newsletter erstellen</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.newsletterForm}>
                  <Text style={styles.formTitle}>Neuen Newsletter erstellen</Text>
                  
                  <Text style={styles.label}>Titel *</Text>
                  <TextInput
                    style={styles.input}
                    value={newsletterData.title}
                    onChangeText={(text) => setNewsletterData({...newsletterData, title: text})}
                    placeholder="Newsletter-Titel eingeben"
                    placeholderTextColor="#999999"
                  />
                  
                  <Text style={styles.label}>Inhalt *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={newsletterData.content}
                    onChangeText={(text) => setNewsletterData({...newsletterData, content: text})}
                    placeholder="Newsletter-Inhalt eingeben"
                    placeholderTextColor="#999999"
                    multiline
                    numberOfLines={6}
                    textAlignVertical="top"
                  />
                  
                  <Text style={styles.label}>Zielgruppe</Text>
                  <View style={styles.targetGroupContainer}>
                    <Text style={styles.targetGroupText}>📧 Newsletter-Abonnenten</Text>
                    <Text style={styles.targetGroupSubtext}>Nur Benutzer mit aktiviertem Newsletter-Abo</Text>
                  </View>
                  
                  <View style={styles.formButtons}>
                    <TouchableOpacity 
                      style={styles.cancelButton} 
                      onPress={() => setIsCreatingNewsletter(false)}
                    >
                      <Text style={styles.cancelButtonText}>Abbrechen</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.createButton, isCreating && styles.createButtonDisabled]} 
                      onPress={handleCreateNewsletter}
                      disabled={isCreating}
                    >
                      <Text style={styles.createButtonText}>
                        {isCreating ? 'Erstelle...' : 'Newsletter erstellen'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
              
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bestehende Newsletter</Text>
              {newsletters.length === 0 ? (
                <Text style={styles.emptyText}>Noch keine Newsletter erstellt</Text>
              ) : (
                <View>
                  {newsletters.map((newsletter) => (
                    <View key={newsletter.id} style={styles.newsletterCard}>
                      <View style={styles.newsletterHeader}>
                        <Text style={styles.newsletterTitle}>{newsletter.title}</Text>
                        <Text style={styles.newsletterDate}>
                          {newsletter.createdAt 
                            ? (newsletter.createdAt.toDate 
                              ? newsletter.createdAt.toDate().toLocaleDateString('de-DE') 
                              : newsletter.createdAt.seconds 
                                ? new Date(newsletter.createdAt.seconds * 1000).toLocaleDateString('de-DE')
                                : new Date(newsletter.createdAt).toLocaleDateString('de-DE'))
                            : 'Unbekannt'}
                        </Text>
                      </View>
                      
                      <Text style={styles.newsletterContent} numberOfLines={3}>
                        {newsletter.content}
                      </Text>
                      
                      <View style={styles.newsletterStats}>
                        <Text style={styles.statText}>Zielgruppe: Newsletter-Abonnenten</Text>
                        <Text style={styles.statText}>
                          Status: {newsletter.status === 'sent' ? 'Versendet' : newsletter.status === 'draft' ? 'Entwurf' : newsletter.status || 'Entwurf'}
                        </Text>
                      </View>
                      
                      <View style={styles.newsletterActions}>
                        {newsletter.status !== 'sent' && (
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.sendButton]} 
                            onPress={() => handleSendNewsletter(newsletter)}
                          >
                            <Text style={styles.actionButtonText}>📤 Senden</Text>
                          </TouchableOpacity>
                        )}
                        
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.deleteButton]} 
                          onPress={() => handleDeleteNewsletter(newsletter)}
                        >
                          <Text style={styles.actionButtonText}>🗑️ Löschen</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
          </ScrollView>
        </View>
        <Footer />
      </View>
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
  headerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
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
  backButton: {
    padding: 10,
    marginBottom: 10,
  },
  backButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
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
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#D2691E',
    paddingBottom: 8,
  },
  createNewsletterButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#D2691E',
    borderStyle: 'dashed',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createNewsletterButtonText: {
    color: '#D2691E',
    fontSize: 16,
    fontWeight: '600',
  },
  newsletterForm: {
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
  newsletterCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(47, 58, 59, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  newsletterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  newsletterTitle: {
    color: '#2f3a3b',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  newsletterDate: {
    color: '#666666',
    fontSize: 14,
  },
  newsletterContent: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  newsletterStats: {
    marginBottom: 15,
  },
  statText: {
    color: '#666666',
    fontSize: 12,
    marginBottom: 5,
  },
  newsletterActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#D2691E',
  },
  deleteButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2f3a3b',
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});


