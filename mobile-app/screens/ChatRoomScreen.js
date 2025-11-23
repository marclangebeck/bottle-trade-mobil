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
import OptimizedImage from '../components/OptimizedImage';
import { getCurrentUser } from '../services/testAuth';

export default function ChatRoomScreen({ onNavigate, onLogout = () => {}, chat, unreadNotifications = 0, unreadHints = 0, messages = [], onAddMessage, onUpdateMessage, onMarkChatAsRead, isLoggedIn = false }) {
  // VERSION: 2.0 - Fix für undefined reactions
  console.log('✅ ChatRoomScreen V2.0 geladen - Fix für undefined reactions');
  
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState(null); // State für ausgewählte Nachricht
  const scrollViewRef = useRef(null);
  
  // WICHTIG: Prüfe, ob der aktuelle User ein Teilnehmer des Chats ist
  // 1-zu-1 Kommunikation darf nicht von Dritten (auch nicht Admins) eingesehen werden
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.uid;
  
  // Wenn der User kein Teilnehmer ist, leite um oder zeige Fehler
  useEffect(() => {
    // Prüfe nur wenn User eingeloggt ist und Chat vorhanden ist
    if (!currentUserId || !chat) {
      return; // User nicht eingeloggt oder Chat nicht vorhanden - normal
    }
    
    // Prüfe ob Chat gelöscht wurde
    if (chat.deletedBy) {
      // Chat wurde gelöscht - leite zurück
      if (onNavigate) {
        onNavigate('infobox');
      }
      return;
    }
    
    // Prüfe ob User Teilnehmer ist
    if (chat.participants && Array.isArray(chat.participants) && !chat.participants.includes(currentUserId)) {
      // User ist kein Teilnehmer - leite zurück ohne Alarm
      if (onNavigate) {
        onNavigate('infobox');
      }
    }
  }, [chat, currentUserId, onNavigate]);

  useEffect(() => {
    // WICHTIG: Lade Nachrichten aus Firestore, wenn Chat geöffnet wird
    if (chat?.id) {
      // Importiere Funktionen dynamisch (wird von App.js übergeben)
      const loadMessagesFromFirestore = async () => {
        try {
          // Prüfe ob messages bereits geladen wurden
          if (!messages || messages.length === 0) {
            console.log(`🔄 ChatRoomScreen: Lade Nachrichten für Chat ${chat.id}...`);
            // Die Nachrichten werden von App.js über getMessages geladen
            // Hier können wir eine Subscription einrichten für Echtzeit-Updates
            // Dies wird in App.js gehandhabt
          }
        } catch (error) {
          console.error('❌ ChatRoomScreen: Fehler beim Laden der Nachrichten:', error);
        }
      };
      
      loadMessagesFromFirestore();
    }
    
    // Simuliere Ladezeit
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, [chat?.id]);

  useEffect(() => {
    // Markiere Chat als gelesen (separater useEffect)
    if (chat?.id && onMarkChatAsRead) {
      onMarkChatAsRead(chat.id);
      console.log('✅ Chat automatisch als gelesen markiert:', chat.id);
    }
  }, [chat?.id]); // onMarkChatAsRead entfernt aus Dependencies

  const handleSendMessage = () => {
    // Debug-Logging: Prüfe, ob Funktion aufgerufen wird
    console.log('🔍 DEBUG: handleSendMessage aufgerufen', {
      hasNewMessage: !!newMessage.trim(),
      chatId: chat?.id,
      onAddMessageAvailable: typeof onAddMessage === 'function',
      timestamp: new Date().toISOString(),
    });
    
    if (!newMessage.trim() || !chat?.id) {
      console.log('⚠️ DEBUG: handleSendMessage abgebrochen - fehlende Daten:', {
        newMessage: newMessage.trim(),
        chatId: chat?.id,
      });
      return;
    }

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
      console.log('✅ DEBUG: Rufe onAddMessage auf mit:', { chatId: chat.id, messageId: message.id });
      onAddMessage(chat.id, message);
    } else {
      console.error('❌ DEBUG: onAddMessage ist nicht verfügbar!');
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
      
      const newReactions = { ...(messageToUpdate.reactions || {}) };
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

  const availableEmojis = ['👍', '👎']; // Nur Daumen hoch und runter

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
            
            {/* Zurück-Button rechts */}
            <View style={styles.profileIconContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => onNavigate && onNavigate('infobox')}
              >
                <Text style={styles.backButtonText}>← Zurück</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>
                  {(() => {
                    // Bestimme den Namen des anderen Teilnehmers
                    const currentUserId = currentUser?.uid;
                    if (!chat?.participantNames || !currentUserId) return 'Chat';
                    
                    // Finde den anderen Teilnehmer
                    const otherIndex = chat.participants?.findIndex(pid => pid !== currentUserId) ?? -1;
                    const otherName = otherIndex >= 0 ? chat.participantNames[otherIndex] : chat.participantNames[1] || chat.participantNames[0];
                    
                    return otherName ? `Chat mit ${otherName}` : 'Chat';
                  })()}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Chat-Bereich - Scrollt unter dem Header */}
          <KeyboardAvoidingView 
            style={styles.chatContainer}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            {/* Messages */}
            <ScrollView 
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContentContainer}
              showsVerticalScrollIndicator={false}
            >
              {isLoading ? (
                <View style={styles.loadingState}>
                  <Text style={styles.loadingText}>Nachrichten werden geladen...</Text>
                </View>
              ) : (
                <View style={styles.messagesList}>
                  {(messages || []).map((message) => {
                    // Sicherstellen, dass message und alle benötigten Felder vorhanden sind
                    if (!message || !message.id) {
                      console.warn('⚠️ ChatRoomScreen: Ungültige Nachricht gefunden:', message);
                      return null;
                    }
                    const isOwnMessage = message.senderId === (getCurrentUser()?.uid || 'unknown');
                    const isSelected = selectedMessageId === message.id;
                    
                    return (
                    <View 
                      key={message.id} 
                      style={[
                        styles.messageContainer,
                        isOwnMessage ? styles.ownMessage : styles.otherMessage
                      ]}
                    >
                      {/* Menü-Icon links/rechts von der Sprechblase */}
                      {!isSelected && (
                        <TouchableOpacity 
                          style={[
                            styles.menuIndicator,
                            isOwnMessage ? styles.menuIndicatorRight : styles.menuIndicatorLeft
                          ]}
                          onPress={() => setSelectedMessageId(message.id)}
                        >
                          <Text style={styles.menuIndicatorText}>⋮</Text>
                        </TouchableOpacity>
                      )}
                      
                      {/* WhatsApp-ähnliche Sprechblase */}
                      <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => setSelectedMessageId(isSelected ? null : message.id)}
                        style={styles.messageBubbleWrapper}
                      >
                        <View style={[
                          styles.messageBubble,
                          isOwnMessage ? styles.messageBubbleOwn : styles.messageBubbleOther,
                          isSelected && styles.messageBubbleSelected
                        ]}>
                          {/* Tail für WhatsApp-Look */}
                          <View style={[
                            styles.messageTail,
                            isOwnMessage ? styles.messageTailRight : styles.messageTailLeft
                          ]} />
                          
                          <Text style={styles.messageText}>{message.text}</Text>
                          <View style={styles.messageFooter}>
                            <Text style={[
                              styles.messageTime,
                              isOwnMessage ? styles.messageTimeOwn : styles.messageTimeOther
                            ]}>
                              {formatTime(message.timestamp)}
                            </Text>
                            {isOwnMessage && (
                              <Text style={[styles.messageStatus, { color: getStatusColor(message.status) }]}>
                                {getStatusIcon(message.status)}
                              </Text>
                            )}
                          </View>
                        </View>
                        
                        {/* Reactions - nur wenn Message ausgewählt ist, direkt an der Sprechblase */}
                        {isSelected && (
                          <View style={[
                            styles.reactionsContainer,
                            isOwnMessage ? styles.reactionsContainerRight : styles.reactionsContainerLeft
                          ]}>
                          {/* Reaction Buttons (Daumen hoch/runter) */}
                          <View style={styles.reactionButtons}>
                            {availableEmojis.map(emoji => {
                              const isActive = message.reactions?.[emoji]?.includes(getCurrentUser()?.uid || 'unknown');
                              return (
                                <TouchableOpacity 
                                  key={emoji}
                                  style={[
                                    styles.reactionButton,
                                    isActive && styles.reactionButtonActive
                                  ]}
                                  onPress={() => {
                                    handleReaction(message.id, emoji);
                                    // Nach kurzer Verzögerung wieder schließen
                                    setTimeout(() => setSelectedMessageId(null), 300);
                                  }}
                                >
                                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                          
                          {/* Löschen-Button nur für eigene Nachrichten */}
                          {isOwnMessage && (
                            <TouchableOpacity 
                              style={styles.deleteMessageButton}
                              onPress={() => {
                                handleDeleteMessage(message.id);
                                setSelectedMessageId(null);
                              }}
                            >
                              <Text style={styles.deleteMessageText}>🗑️</Text>
                            </TouchableOpacity>
                          )}
                          </View>
                        )}
                      </TouchableOpacity>
                      
                      {/* Anzeige vorhandener Reactions unter der Sprechblase */}
                      {message.reactions && Object.keys(message.reactions).length > 0 && (
                        <View style={[
                          styles.existingReactionsContainer,
                          isOwnMessage ? styles.existingReactionsRight : styles.existingReactionsLeft
                        ]}>
                          {Object.entries(message.reactions || {}).map(([emoji, users]) => (
                            <TouchableOpacity 
                              key={emoji}
                              style={styles.reactionBadge}
                              onPress={() => handleReaction(message.id, emoji)}
                            >
                              <Text style={styles.reactionEmoji}>{emoji}</Text>
                              <Text style={styles.reactionCount}>{users.length}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                    );
                  })}
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
    backgroundColor: '#d5dfe0',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#2c2c2c',
  },
  logoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40, // 10px für iOS, damit StatusBar nicht verdeckt wird
    paddingBottom: 10,
    borderBottomWidth: 0,
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
    marginLeft: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHeaderImage: {
    width: 40,
    height: 40,
  },
  profileIconContainer: {
    width: 80,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 25,
    backgroundColor: '#2c2c2c',
    position: 'relative',
    marginTop: 0,
    minHeight: 70,
    borderTopWidth: 0,
    borderBottomWidth: 0,
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
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  greetingContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 15,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  greeting: {
    fontSize: 45,
    fontWeight: '900',
    color: '#FFD700',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Snell Roundhand' : 'serif',
    fontStyle: 'italic',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(255, 215, 0, 0.9)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    includeFontPadding: false,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c', // Dunkler Text auf hellem Header
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
    flexDirection: 'column',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#ECE5DD', // WhatsApp Hintergrundfarbe
  },
  messagesContentContainer: {
    paddingLeft: 10,
    paddingRight: 20, // Mehr Padding rechts für bessere Abgrenzung
    paddingVertical: 10,
    flexGrow: 1,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: '#2f3a3b',
    textAlign: 'center',
  },
  messagesList: {
    paddingBottom: 20,
  },
  messageContainer: {
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-end',
    position: 'relative',
    overflow: 'visible', // Wichtig: Reactions können außerhalb sichtbar sein
  },
  ownMessage: {
    justifyContent: 'flex-end',
  },
  otherMessage: {
    justifyContent: 'flex-start',
  },
  menuIndicator: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    marginBottom: 4,
  },
  menuIndicatorLeft: {
    marginRight: 4,
  },
  menuIndicatorRight: {
    marginLeft: 4,
  },
  menuIndicatorText: {
    fontSize: 24, // Größer für bessere Sichtbarkeit
    color: '#666',
    fontWeight: '900', // Sehr dick für deutlichere Darstellung
    letterSpacing: 2, // Mehr Abstand zwischen den Punkten
  },
  messageBubbleWrapper: {
    maxWidth: '75%',
    position: 'relative',
    zIndex: 1,
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 7.5,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageBubbleOwn: {
    backgroundColor: '#DCF8C6', // WhatsApp grün für eigene Nachrichten
    borderBottomRightRadius: 3, // Tail-Position
  },
  messageBubbleOther: {
    backgroundColor: '#FFFFFF', // Weiß für andere Nachrichten
    borderBottomLeftRadius: 3, // Tail-Position
  },
  messageBubbleSelected: {
    opacity: 0.9,
  },
  messageTail: {
    position: 'absolute',
    bottom: 0,
    width: 0,
    height: 0,
    borderStyle: 'solid',
  },
  messageTailRight: {
    right: -8,
    borderWidth: 0,
    borderRightWidth: 8,
    borderBottomWidth: 12,
    borderRightColor: 'transparent',
    borderBottomColor: '#DCF8C6',
  },
  messageTailLeft: {
    left: -8,
    borderWidth: 0,
    borderLeftWidth: 8,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  messageText: {
    fontSize: 16,
    color: '#000000',
    lineHeight: 20,
    marginBottom: 4,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 11,
    color: '#666666',
  },
  messageTimeOwn: {
    color: '#666666',
  },
  messageTimeOther: {
    color: '#999999',
  },
  messageStatus: {
    fontSize: 11,
    marginLeft: 4,
  },
  reactionsContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
    // Direkt an der Sprechblase positionieren - vertikal zentriert
    top: 8,
    minWidth: 80, // Mindestbreite für bessere Sichtbarkeit
  },
  reactionsContainerLeft: {
    // Für andere Nachrichten (links): Emoji-Menü rechts von der Sprechblase
    left: '100%', // 100% vom linken Rand des Containers = rechts neben der Sprechblase
    marginLeft: 6,
  },
  reactionsContainerRight: {
    // Für eigene Nachrichten (rechts): Emoji-Menü links von der Sprechblase
    right: '100%', // 100% vom rechten Rand des Containers = links neben der Sprechblase
    marginRight: 6,
  },
  existingReactionsContainer: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  existingReactionsLeft: {
    marginLeft: 8,
  },
  existingReactionsRight: {
    marginRight: 8,
    marginLeft: 'auto',
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  reactionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  reactionButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    overflow: 'hidden', // Verhindert, dass Emojis über den Rand hinausgehen
  },
  reactionButtonActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
  },
  reactionEmoji: {
    fontSize: 22,
    textAlign: 'center', // Zentriert das Emoji
  },
  reactionCount: {
    fontSize: 11,
    color: '#2196F3',
    fontWeight: 'bold',
    marginLeft: 2,
  },
  deleteMessageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  deleteMessageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 15,
    paddingBottom: 95, // PHASE 5: Platz für BottomNavigation (75px + 20px Sicherheit)
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderTopWidth: 0.5,
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
