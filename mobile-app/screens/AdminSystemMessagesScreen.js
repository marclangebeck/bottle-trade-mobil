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

export default function AdminSystemMessagesScreen({ onNavigate, onLogout, systemMessages = [], onCreateSystemMessage, onSendSystemMessage, isLoggedIn = false, unreadNotifications = 0, unreadHints = 0 }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isCreatingMessage, setIsCreatingMessage] = useState(false);
  const [messageData, setMessageData] = useState({
    title: '',
    content: '',
    priority: 'normal'
  });

  const handleCreateMessage = () => {
    console.log('🔄 Erstelle neue Systemnachricht...', messageData);
    
    if (!messageData.title.trim() || !messageData.content.trim()) {
      console.log('❌ Fehler: Pflichtfelder nicht ausgefüllt');
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    console.log('✅ Systemnachricht-Daten validiert, erstelle Systemnachricht...');

    if (onCreateSystemMessage) {
      onCreateSystemMessage(messageData);
      console.log('✅ Systemnachricht erfolgreich erstellt und an App.js weitergegeben');
    }
    
    Alert.alert('Erfolg', 'Systemnachricht wurde erfolgreich erstellt und an alle Benutzer gesendet!');
    setIsCreatingMessage(false);
    setMessageData({
      title: '',
      content: '',
      priority: 'normal'
    });
  };

  const handleBack = () => {
    onNavigate('admin-dashboard');
  };

  const handleSendMessage = (message) => {
    Alert.alert(
      'Systemnachricht senden',
      `Möchten Sie die Systemnachricht "${message.title}" wirklich an alle Benutzer senden?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Senden', style: 'default', onPress: () => {
          console.log('📢 Systemnachricht gesendet:', message.id);
          if (onSendSystemMessage) {
            onSendSystemMessage(message.id);
          }
          Alert.alert('Erfolg', 'Systemnachricht wurde gesendet!');
        }}
      ]
    );
  };

  const handleDeleteMessage = (message) => {
    Alert.alert(
      'Systemnachricht löschen',
      `Möchten Sie die Systemnachricht "${message.title}" wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => {
          console.log('🗑️ Systemnachricht gelöscht:', message.id);
          Alert.alert('Erfolg', 'Systemnachricht wurde gelöscht!');
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
        borderBottomWidth: 0.5,
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
            <Text style={styles.greeting}>System</Text>
          </View>
          <View style={styles.headerRight} />
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
                      style={styles.createButton} 
                      onPress={handleCreateMessage}
                    >
                      <Text style={styles.createButtonText}>Systemnachricht erstellen</Text>
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
                    <View key={`msg-${index}`} style={styles.messageCard}>
                      <View style={styles.messageHeader}>
                        <Text style={styles.messageTitle}>{message.title}</Text>
                        <Text style={styles.messageDate}>{message.createdAt}</Text>
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
        unreadNotifications={unreadNotifications}
        unreadHints={unreadHints}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(218, 165, 32, 0.4)', // Warmes Gold mit Glassmorphism
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
    minHeight: 90,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(218, 165, 32, 0.5)', // Warmes Gold Akzent
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(218, 165, 32, 0.3)',
    // Glassmorphism Effekt
    shadowColor: '#DAA520',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  backButton: {
    backgroundColor: '#D2691E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#D2691E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    color: '#FFFFFF',
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
    backgroundColor: '#2c2c2c', // Dunkler auf hellem Header
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c2c2c', // Dunkler Text auf hellem Header
    textAlign: 'center',
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
  messageCard: {
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
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  messageTitle: {
    color: '#2f3a3b',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  messageDate: {
    color: '#666666',
    fontSize: 14,
  },
  messageContent: {
    color: '#333333',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  messageStats: {
    marginBottom: 15,
  },
  statText: {
    color: '#666666',
    fontSize: 12,
    marginBottom: 5,
  },
  messageActions: {
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
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});