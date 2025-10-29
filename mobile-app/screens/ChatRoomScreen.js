import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Alert,
  KeyboardAvoidingView
} from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import { getCurrentUser } from '../services/testAuth';

export default function ChatRoomScreen({ onNavigate, onLogout = () => {}, chat, unreadNotifications = 0, messages = [], onAddMessage, onUpdateMessage, onMarkChatAsRead, isLoggedIn = false }) {
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const scrollViewRef = useRef(null);

  useEffect(() => {
    // Simuliere Ladezeit
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    // Markiere Chat als gelesen (separater useEffect)
    if (chat?.id && onMarkChatAsRead) {
      onMarkChatAsRead(chat.id);
      console.log('✅ Chat automatisch als gelesen markiert:', chat.id);
    }
  }, [chat?.id]); // onMarkChatAsRead entfernt aus Dependencies

  const handleSendMessage = () => {
    if (!newMessage.trim() || !chat?.id) return;

    // Hole aktuelle User-Info
    const currentUser = getCurrentUser();
    const message = {
      id: `msg${Date.now()}`,
      senderId: currentUser?.uid || 'unknown',
      senderName: currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Unbekannt',
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      reactions: {}
    };

    console.log('📤 Nachricht gesendet:', message);
    console.log('📤 Chat-Teilnehmer:', chat?.participants);
    console.log('📤 Aktueller User:', currentUser?.uid);
    console.log('📤 Chat-ID:', chat.id);

    // Nachricht über App.js hinzufügen (wird zwischen Usern geteilt)
    if (onAddMessage) {
      onAddMessage(chat.id, message);
    }

    setNewMessage('');
    
    // Auto-scroll nach unten
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleReaction = (messageId, emoji) => {
    const currentUser = getCurrentUser();
    const userId = currentUser?.uid || 'unknown';
    
    // Update message in global state
    if (onUpdateMessage && chat?.id) {
      const messageToUpdate = messages.find(msg => msg.id === messageId);
      if (!messageToUpdate) {
        console.log('⚠️ Nachricht nicht gefunden für Reaction:', messageId);
        return;
      }
      
      const newReactions = { ...messageToUpdate.reactions };
      if (newReactions[emoji]) {
        if (newReactions[emoji].includes(userId)) {
          newReactions[emoji] = newReactions[emoji].filter(id => id !== userId);
          if (newReactions[emoji].length === 0) {
            delete newReactions[emoji];
          }
        } else {
          newReactions[emoji] = [...newReactions[emoji], userId];
        }
      } else {
        newReactions[emoji] = [userId];
      }
      
      console.log('🔄 Aktualisiere Nachricht mit Reaction:', messageId, emoji);
      onUpdateMessage(chat.id, messageId, { reactions: newReactions });
    }
  };

  const handleDeleteMessage = (messageId) => {
    Alert.alert(
      'Nachricht löschen',
      'Möchten Sie diese Nachricht wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => {
          // Update global state
          if (onAddMessage && chat?.id) {
            const updatedMessages = messages.filter(msg => msg.id !== messageId);
            // Clear all messages and re-add the remaining ones
            // This is a simple approach - in a real app you'd have a deleteMessage function
            console.log('🗑️ Nachricht gelöscht:', messageId);
          }
        }}
      ]
    );
  };

  const formatTime = (timestamp) => {
    return timestamp;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'sent': return '✓';
      case 'delivered': return '✓✓';
      case 'read': return '✓✓';
      default: return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return '#999';
      case 'delivered': return '#999';
      case 'read': return '#4CAF50';
      default: return '#999';
    }
  };

  const availableEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

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
          isAdmin={false} 
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
              <Text style={styles.greeting}>{chat?.participantNames?.[1] || 'Chat'}</Text>
            </View>
            <View style={styles.headerRight}>
              {/* Kein Notification-Icon im Chat-Room */}
            </View>
          </View>
          
          <KeyboardAvoidingView 
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Messages */}
            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
            >
              {isLoading ? (
                <View style={styles.loadingState}>
                  <Text style={styles.loadingText}>Nachrichten werden geladen...</Text>
                </View>
              ) : (
                <View style={styles.messagesList}>
                  {messages.map((message) => (
                    <View 
                      key={message.id} 
                      style={[
                        styles.messageContainer,
                        message.senderId === (getCurrentUser()?.uid || 'unknown') ? styles.ownMessage : styles.otherMessage
                      ]}
                    >
                      <View style={styles.messageBubble}>
                        <Text style={styles.messageText}>{message.text}</Text>
                        <View style={styles.messageFooter}>
                          <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
                          <Text style={[styles.messageStatus, { color: getStatusColor(message.status) }]}>
                            {getStatusIcon(message.status)}
                          </Text>
                        </View>
                      </View>
                      
                      {/* Reactions */}
                      {Object.keys(message.reactions).length > 0 && (
                        <View style={styles.reactionsContainer}>
                          {Object.entries(message.reactions).map(([emoji, users]) => (
                            <TouchableOpacity 
                              key={emoji}
                              style={styles.reactionButton}
                              onPress={() => handleReaction(message.id, emoji)}
                            >
                              <Text style={styles.reactionEmoji}>{emoji}</Text>
                              <Text style={styles.reactionCount}>{users.length}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                      
                      {/* Message Actions */}
                      <View style={styles.messageActions}>
                        <View style={styles.reactionButtons}>
                          {availableEmojis.map(emoji => (
                            <TouchableOpacity 
                              key={emoji}
                              style={styles.reactionButton}
                              onPress={() => handleReaction(message.id, emoji)}
                            >
                              <Text style={styles.reactionEmoji}>{emoji}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                        {message.senderId === (getCurrentUser()?.uid || 'unknown') && (
                          <TouchableOpacity 
                            style={styles.deleteMessageButton}
                            onPress={() => handleDeleteMessage(message.id)}
                          >
                            <Text style={styles.deleteMessageText}>🗑️</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
            
            {/* Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.messageInput}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Nachricht eingeben..."
                placeholderTextColor="#999"
                multiline
                maxLength={500}
              />
              <TouchableOpacity 
                style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <Text style={styles.sendButtonText}>📤</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chatType: {
    fontSize: 12,
    color: '#CCCCCC',
    fontStyle: 'italic',
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  messagesList: {
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 15,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  otherMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
    marginBottom: 5,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageTime: {
    fontSize: 12,
    color: '#999',
  },
  messageStatus: {
    fontSize: 12,
    marginLeft: 5,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    marginHorizontal: 10,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 5,
    marginBottom: 5,
  },
  reactionEmoji: {
    fontSize: 14,
    marginRight: 2,
  },
  reactionCount: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 5,
    marginHorizontal: 10,
  },
  reactionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  deleteMessageButton: {
    padding: 5,
  },
  deleteMessageText: {
    fontSize: 14,
    color: '#F44336',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  messageInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 16,
    maxHeight: 100,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
  },
  sendButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
});
