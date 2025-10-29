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

export default function AdminNewsletterScreen({ onNavigate, onLogout, newsletters = [], onCreateNewsletter, isLoggedIn = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isCreatingNewsletter, setIsCreatingNewsletter] = useState(false);
  const [newsletterData, setNewsletterData] = useState({
    title: '',
    content: '',
    targetGroup: 'newsletter_subscribers' // Nur Newsletter-Abonnenten
  });

  const handleCreateNewsletter = () => {
    console.log('🔄 Erstelle neuen Newsletter...', newsletterData);
    
    if (!newsletterData.title.trim() || !newsletterData.content.trim()) {
      console.log('❌ Fehler: Pflichtfelder nicht ausgefüllt');
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    console.log('✅ Newsletter-Daten validiert, erstelle Newsletter...');

    if (onCreateNewsletter) {
      onCreateNewsletter(newsletterData);
      console.log('✅ Newsletter erfolgreich erstellt und an App.js weitergegeben');
    }
    
    Alert.alert('Erfolg', 'Newsletter wurde erfolgreich erstellt und an alle Newsletter-Abonnenten gesendet!');
    setIsCreatingNewsletter(false);
    setNewsletterData({
      title: '',
      content: '',
      targetGroup: 'newsletter_subscribers'
    });
  };

  const handleBack = () => {
    onNavigate('admin-dashboard');
  };

  const handleSendNewsletter = (newsletter) => {
    Alert.alert(
      'Newsletter senden',
      `Möchten Sie den Newsletter "${newsletter.title}" wirklich an alle Newsletter-Abonnenten senden?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Senden', style: 'default', onPress: () => {
          console.log('📧 Newsletter gesendet:', newsletter.id);
          Alert.alert('Erfolg', 'Newsletter wurde gesendet!');
        }}
      ]
    );
  };

  const handleDeleteNewsletter = (newsletter) => {
    Alert.alert(
      'Newsletter löschen',
      `Möchten Sie den Newsletter "${newsletter.title}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => {
          console.log('🗑️ Newsletter gelöscht:', newsletter.id);
          Alert.alert('Erfolg', 'Newsletter wurde gelöscht!');
        }}
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
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)'
      }} />
      
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
            <Text style={styles.greeting}>Newsletter</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView style={styles.content}>
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
                placeholderTextColor="#999"
              />
              
              <Text style={styles.label}>Inhalt *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newsletterData.content}
                onChangeText={(text) => setNewsletterData({...newsletterData, content: text})}
                placeholder="Newsletter-Inhalt eingeben"
                placeholderTextColor="#999"
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
                  style={styles.createButton} 
                  onPress={handleCreateNewsletter}
                >
                  <Text style={styles.createButtonText}>Newsletter erstellen</Text>
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
                    <Text style={styles.newsletterDate}>{newsletter.createdAt}</Text>
                  </View>
                  
                  <Text style={styles.newsletterContent} numberOfLines={3}>
                    {newsletter.content}
                  </Text>
                  
                  <View style={styles.newsletterStats}>
                    <Text style={styles.statText}>Zielgruppe: Newsletter-Abonnenten</Text>
                    <Text style={styles.statText}>Status: {newsletter.status || 'Entwurf'}</Text>
                  </View>
                  
                  <View style={styles.newsletterActions}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.sendButton]} 
                      onPress={() => handleSendNewsletter(newsletter)}
                    >
                      <Text style={styles.actionButtonText}>📤 Senden</Text>
                    </TouchableOpacity>
                    
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
      </ScrollView>

      <Footer />
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
  backButton: {
    padding: 10,
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
  content: {
    flex: 1,
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
  },
  createNewsletterButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createNewsletterButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newsletterForm: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    padding: 20,
    borderRadius: 10,
  },
  formTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#FFFFFF',
    color: '#000000',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  targetGroupContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  targetGroupText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  targetGroupSubtext: {
    color: '#CCCCCC',
    fontSize: 14,
    marginTop: 5,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 1,
    borderColor: '#F44336',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  newsletterCard: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
  },
  newsletterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  newsletterTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  newsletterDate: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  newsletterContent: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  newsletterStats: {
    marginBottom: 15,
  },
  statText: {
    color: '#CCCCCC',
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
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});


