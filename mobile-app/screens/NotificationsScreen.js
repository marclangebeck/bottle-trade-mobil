import React, { useState } from 'react';
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

export default function NotificationsScreen({ onNavigate, onLogout, notifications = [], onUpdateNotificationReadStatus, onMarkAllAsRead, onDeleteNotification, surveys = [], newsletters = [], systemMessages = [], chats = [], isLoggedIn = false }) {
  const [activeTab, setActiveTab] = useState('all'); // all, system, trade, messages
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // Verwende die übergebenen Notifications
  const allNotifications = notifications;

  const tabs = [
    { id: 'all', label: 'Alle', count: allNotifications.length },
    { id: 'trade', label: 'Tausch', count: allNotifications.filter(n => n.type === 'trade').length },
    { id: 'system', label: 'System', count: allNotifications.filter(n => n.type === 'system').length },
    { id: 'messages', label: 'Chat', count: chats.filter(chat => chat.unreadCount > 0).length }
  ];

  const filteredNotifications = activeTab === 'all' 
    ? allNotifications 
    : activeTab === 'messages'
    ? chats // Zeige Chats statt Chat-Benachrichtigungen
    : allNotifications.filter(n => n.type === activeTab);

  const unreadCount = allNotifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'trade': return '🍷';
      case 'system': return '📢';
      case 'message': return '💬';
      default: return '📋';
    }
  };

  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#4CAF50';
      default: return '#9E9E9E';
    }
  };


  const markAsRead = (notificationId) => {
    if (onUpdateNotificationReadStatus) {
      onUpdateNotificationReadStatus(notificationId, true);
    }
  };

  const markAllAsRead = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const handleDeleteNotification = (notificationId) => {
    Alert.alert(
      'Benachrichtigung löschen',
      'Möchten Sie diese Benachrichtigung wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => {
          if (onDeleteNotification) {
            onDeleteNotification(notificationId);
          }
        }}
      ]
    );
  };

  const handleNotificationPress = (notification) => {
    // Als gelesen markieren
    markAsRead(notification.id);
    
    // Wenn es eine Umfrage-Benachrichtigung ist, zur Umfrage navigieren
    if (notification.type === 'system' && (notification.title.includes('Umfrage') || notification.message.includes('BTP'))) {
      console.log('Umfrage-Benachrichtigung gefunden!');
      console.log('Title:', notification.title);
      console.log('Message:', notification.message);
      console.log('Verfügbare Surveys:', surveys);
      
      // Finde die entsprechende Umfrage
      const surveyTitle = notification.message.match(/"([^"]+)"/)?.[1];
      console.log('Gefundener Survey-Titel:', surveyTitle);
      
      const survey = surveys.find(s => s.title === surveyTitle);
      console.log('Gefundene Survey:', survey);
      
      if (survey) {
        console.log('Navigiere zu Survey:', survey.id);
        onNavigate('survey-answer', { surveyId: survey.id });
      } else {
        console.log('Keine passende Survey gefunden!');
        // Fallback: Nimm die erste verfügbare Survey
        if (surveys.length > 0) {
          console.log('Fallback: Nimm erste Survey:', surveys[0].id);
          onNavigate('survey-answer', { surveyId: surveys[0].id });
        } else {
          console.log('Keine Surveys verfügbar!');
          Alert.alert('Fehler', 'Keine Umfragen verfügbar!');
        }
      }
    } 
    // Wenn es eine Newsletter-Benachrichtigung ist, zum Newsletter navigieren
    else if (notification.type === 'newsletter' || notification.title.includes('Newsletter')) {
      console.log('Newsletter-Benachrichtigung gefunden!');
      console.log('Title:', notification.title);
      console.log('Message:', notification.message);
      console.log('Verfügbare Newsletter:', newsletters);
      
      // Finde den entsprechenden Newsletter
      const newsletterTitle = notification.message.match(/"([^"]+)"/)?.[1];
      console.log('Gefundener Newsletter-Titel:', newsletterTitle);
      
      const newsletter = newsletters.find(n => n.title === newsletterTitle);
      console.log('Gefundener Newsletter:', newsletter);
      
      if (newsletter) {
        console.log('Navigiere zu Newsletter:', newsletter.id);
        onNavigate('newsletter-reader', { newsletter: newsletter });
      } else {
        console.log('Kein passender Newsletter gefunden!');
        Alert.alert('Fehler', 'Newsletter nicht gefunden!');
      }
    }
    else if (notification.type === 'system' || notification.title.includes('Systemnachricht')) {
      console.log('Systemnachricht-Benachrichtigung gefunden!');
      console.log('Title:', notification.title);
      console.log('Message:', notification.message);
      console.log('Verfügbare Systemnachrichten:', systemMessages);
      
      const systemMessageTitle = notification.message.match(/"([^"]+)"/)?.[1];
      console.log('Gefundener Systemnachricht-Titel:', systemMessageTitle);
      
      const systemMessage = systemMessages.find(sm => sm.title === systemMessageTitle);
      console.log('Gefundene Systemnachricht:', systemMessage);
      
      if (systemMessage) {
        console.log('Navigiere zu Systemnachricht:', systemMessage.id);
        onNavigate('system-message-reader', { systemMessage: systemMessage });
      } else {
        console.log('Keine passende Systemnachricht gefunden!');
        Alert.alert('Fehler', 'Systemnachricht nicht gefunden!');
      }
    } 
    // Wenn es eine Chat-Nachricht ist, zum Chat navigieren
    else if (notification.type === 'message' && notification.chatId) {
      console.log('Chat-Benachrichtigung gefunden!');
      console.log('ChatId:', notification.chatId);
      
      // Finde den entsprechenden Chat
      const chat = chats.find(c => c.id === notification.chatId);
      if (chat) {
        console.log('Navigiere zu Chat:', chat.id);
        onNavigate('chat-room', { chat: chat });
      } else {
        console.log('Chat nicht gefunden!');
        Alert.alert('Fehler', 'Chat nicht gefunden!');
      }
    }
    else {
      console.log('Normale Benachrichtigung:', notification.type, notification.message);
      Alert.alert('Benachrichtigung', notification.message);
    }
  };

  const handleChatPress = (chat) => {
    console.log('Chat gedrückt:', chat);
    onNavigate('chat-room', { chat: chat });
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
              <Text style={styles.greeting}>Nachrichten</Text>
            </View>
            <View style={styles.headerRight}>
              {/* Kein Notification-Icon hier, da wir bereits im Notifications-Screen sind */}
            </View>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              {/* Tabs */}
              <View style={styles.tabsContainer}>
                {tabs.map((tab) => (
                  <TouchableOpacity
                    key={tab.id}
                    style={[styles.tab, activeTab === tab.id && styles.activeTab]}
                    onPress={() => setActiveTab(tab.id)}
                  >
                    <Text style={[styles.tabText, activeTab === tab.id && styles.activeTabText]}>
                      {tab.label}
                    </Text>
                    {tab.count > 0 && (
                      <View style={styles.tabBadge}>
                        <Text style={styles.tabBadgeText}>{tab.count}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                {unreadCount > 0 && (
                  <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
                    <Text style={styles.markAllButtonText}>Alle als gelesen markieren</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.chatButton} 
                  onPress={() => onNavigate('chat-list')}
                >
                  <Text style={styles.chatButtonText}>💬 Chats öffnen</Text>
                </TouchableOpacity>
              </View>

              {/* Notifications List */}
              <View style={styles.notificationsList}>
                {filteredNotifications.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyTitle}>Keine Nachrichten</Text>
                    <Text style={styles.emptySubtitle}>
                      {activeTab === 'all' 
                        ? 'Du hast noch keine Nachrichten erhalten.'
                        : activeTab === 'messages'
                        ? 'Du hast keine ungelesenen Chats.'
                        : `Keine ${activeTab === 'trade' ? 'Tausch-' : 'System-'}Benachrichtigungen.`
                      }
                    </Text>
                  </View>
                ) : activeTab === 'messages' ? (
                  // Chat-Liste anzeigen (nur Chats mit ungelesenen Nachrichten)
                  filteredNotifications.filter(chat => chat.unreadCount > 0).map((chat) => (
                    <TouchableOpacity
                      key={chat.id}
                      style={[styles.notificationCard, chat.unreadCount > 0 && styles.unreadCard]}
                      onPress={() => handleChatPress(chat)}
                    >
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationIcon}>💬</Text>
                        <View style={styles.notificationContent}>
                          <Text style={[styles.notificationTitle, chat.unreadCount > 0 && styles.unreadText]}>
                            {chat.participantNames.filter(name => name !== 'Du').join(', ')}
                          </Text>
                          <Text style={styles.notificationMessage}>
                            {chat.lastMessage}
                          </Text>
                        </View>
                        <View style={styles.notificationMeta}>
                          {chat.unreadCount > 0 && (
                            <View style={styles.unreadBadge}>
                              <Text style={styles.unreadBadgeText}>{chat.unreadCount}</Text>
                            </View>
                          )}
                          <Text style={styles.timestamp}>{chat.lastMessageTime}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  // Normale Benachrichtigungen anzeigen
                  filteredNotifications.map((notification) => (
                    <TouchableOpacity
                      key={notification.id}
                      style={[styles.notificationCard, !notification.isRead && styles.unreadCard]}
                      onPress={() => handleNotificationPress(notification)}
                    >
                      <View style={styles.notificationHeader}>
                        <Text style={styles.notificationIcon}>
                          {getNotificationIcon(notification.type)}
                        </Text>
                        <View style={styles.notificationContent}>
                          <Text style={[styles.notificationTitle, !notification.isRead && styles.unreadText]}>
                            {notification.title}
                          </Text>
                          <Text style={styles.notificationMessage}>
                            {notification.message}
                          </Text>
                        </View>
                        <View style={styles.notificationMeta}>
                          <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(notification.priority) }]} />
                          <Text style={styles.timestamp}>{notification.timestamp}</Text>
                        </View>
                      </View>
                      
                      <View style={styles.notificationActions}>
                        {!notification.isRead && (
                          <TouchableOpacity 
                            style={styles.markReadButton}
                            onPress={() => markAsRead(notification.id)}
                          >
                            <Text style={styles.markReadButtonText}>Als gelesen markieren</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteNotification(notification.id)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️ Löschen</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
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
  badgeContainer: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
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
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#CCCCCC',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  tabBadge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  tabBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  markAllButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  markAllButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  chatButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  chatButtonText: {
    color: '#2196F3',
    fontSize: 14,
    fontWeight: 'bold',
  },
  notificationsList: {
    marginBottom: 20,
  },
  notificationCard: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  unreadCard: {
    borderLeftColor: '#F44336',
    backgroundColor: 'rgba(60, 60, 60, 0.9)',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: 'bold',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  notificationMeta: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
  },
  notificationActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  markReadButton: {
    backgroundColor: 'rgba(33, 150, 243, 0.2)',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  markReadButtonText: {
    color: '#2196F3',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    textAlign: 'center',
  },
  unreadBadge: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
