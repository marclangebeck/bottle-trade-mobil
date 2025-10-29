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

export default function AdminSystemMessagesScreen({ onNavigate, onLogout, systemMessages = [], onCreateSystemMessage, onSendSystemMessage, isLoggedIn = false }) {
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
            <Text style={styles.greeting}>Systemnachrichten</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView style={styles.content}>
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
                placeholderTextColor="#999"
              />
              
              <Text style={styles.label}>Inhalt *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={messageData.content}
                onChangeText={(text) => setMessageData({...messageData, content: text})}
                placeholder="Systemnachricht-Inhalt eingeben"
                placeholderTextColor="#999"
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
  createMessageButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  createMessageButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageForm: {
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
  priorityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  priorityOption: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
  },
  priorityOptionActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#45a049',
  },
  priorityOptionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  priorityOptionTextActive: {
    color: '#FFFFFF',
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
  messageCard: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
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
  },
  messageDate: {
    color: '#CCCCCC',
    fontSize: 14,
  },
  messageContent: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 15,
  },
  messageStats: {
    marginBottom: 15,
  },
  statText: {
    color: '#CCCCCC',
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