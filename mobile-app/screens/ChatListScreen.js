import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';

export default function ChatListScreen({ onNavigate, onLogout = () => {}, chats = [], unreadNotifications = 0, onMarkChatAsRead, isLoggedIn = false }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // Verwende die übergebenen Chats (später durch Firebase ersetzt)
  const allChats = chats;

  useEffect(() => {
    // Simuliere Ladezeit
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const handleChatPress = (chat) => {
    console.log('Chat geöffnet:', chat.id);
    
    // Markiere Chat als gelesen
    if (onMarkChatAsRead) {
      onMarkChatAsRead(chat.id);
    }
    
    onNavigate('chat-room', { chat });
  };

  const handleDeleteChat = (chatId) => {
    Alert.alert(
      'Chat löschen',
      'Möchten Sie diesen Chat wirklich löschen?\n\nAlle Nachrichten werden unwiderruflich gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => {
          console.log('Chat gelöscht:', chatId);
          Alert.alert('Erfolg', 'Chat wurde gelöscht!');
        }}
      ]
    );
  };

  const formatLastMessage = (message) => {
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  };

  const getChatIcon = (type) => {
    return type === 'trade' ? '🍷' : '💬';
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
              <Text style={styles.greeting}>Chats</Text>
            </View>
            <View style={styles.headerRight}>
              {/* Kein Notification-Icon auf Chat-Liste */}
            </View>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              {isLoading ? (
                <View style={styles.loadingState}>
                  <Text style={styles.loadingIcon}>⏳</Text>
                  <Text style={styles.loadingText}>Chats werden geladen...</Text>
                </View>
              ) : allChats.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>💬</Text>
                  <Text style={styles.emptyTitle}>Keine Chats</Text>
                  <Text style={styles.emptySubtitle}>
                    Du hast noch keine Chats. Starte eine Unterhaltung über die Weinbörse!
                  </Text>
                </View>
              ) : (
                <View style={styles.chatsList}>
                  {allChats.map((chat) => (
                    <TouchableOpacity 
                      key={chat.id} 
                      style={styles.chatCard}
                      onPress={() => handleChatPress(chat)}
                    >
                      <View style={styles.chatHeader}>
                        <Text style={styles.chatIcon}>{getChatIcon(chat.type)}</Text>
                        <View style={styles.chatInfo}>
                          <Text style={styles.chatTitle}>
                            {chat.participantNames[1]} {/* Anderer Teilnehmer */}
                          </Text>
                          <Text style={styles.chatType}>
                            {chat.type === 'trade' ? 'Tausch-Chat' : 'Direkter Chat'}
                          </Text>
                        </View>
                        <View style={styles.chatMeta}>
                          <Text style={styles.chatTime}>{chat.lastMessageTime}</Text>
                          {chat.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                              <Text style={styles.unreadText}>{chat.unreadCount}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      
                      <Text style={styles.lastMessage}>
                        {formatLastMessage(chat.lastMessage)}
                      </Text>
                      
                      <View style={styles.chatActions}>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteChat(chat.id)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️ Löschen</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
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
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerRight: {
    flex: 0,
    width: 80,
    alignItems: 'center',
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
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#F5DEB3',
    textAlign: 'center',
    opacity: 0.8,
  },
  chatsList: {
    marginBottom: 20,
  },
  chatCard: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  chatIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  chatType: {
    fontSize: 12,
    color: '#CCCCCC',
    fontStyle: 'italic',
  },
  chatMeta: {
    alignItems: 'flex-end',
  },
  chatTime: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  unreadBadge: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lastMessage: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 15,
    lineHeight: 20,
  },
  chatActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
