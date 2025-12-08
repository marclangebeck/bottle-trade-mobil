import React, { useMemo, useRef, useState } from 'react';
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
import ProVersionButton from '../components/ProVersionButton';

import { getCurrentUser } from '../services/testAuth';

export default function NotificationsScreen({
  onNavigate,
  onLogout,
  notifications = [],
  onUpdateNotificationReadStatus,
  onUpdateNotificationsReadByRequestId,
  onMarkAllAsRead,
  onDeleteNotification,
  onMarkChatAsRead = null,
  onDeleteChat = null,
  surveys = [],
  newsletters = [],
  systemMessages = [],
  chats = [],
  isLoggedIn = false,
  onTradeAccept = null,
  onTradeDecline = null,
  unreadCount = 0,
}, isPro = false) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // Verwende die übergebenen Notifications
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.uid;
  // Zeige nur für den aktuellen User relevante Notifications
  // Filter auf relevante Notifications für den aktuellen Nutzer
  const filteredForUser = notifications.filter(n => {
    if (n.type === 'trade') {
      return n.toUserId === currentUserId; // eingehende Anfragen
    }
    if (n.type === 'trade-info') {
      return n.fromUserId === currentUserId; // Infos für den Absender
    }
    return true; // andere Typen wie system/newsletter/chat
  });

  // Deduplizierung: für Tausch anhand requestId, sonst anhand id
  const seenKeys = new Set();
  const allNotifications = filteredForUser.filter(n => {
    const key = n.type === 'trade' || n.type === 'trade-info' ? `trade:${n.requestId}` : `id:${n.id}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  // Unread-/Total-Counts für Tab-Anzeige (unread/total)
  const unreadAll = allNotifications.filter(n => !n.isRead).length;
  const totalAll = allNotifications.length;
  const allTrade = allNotifications.filter(n => n.type === 'trade');
  const unreadTrade = allTrade.filter(n => !n.isRead).length;
  const totalTrade = allTrade.length;
  const allSystem = allNotifications.filter(n => n.type === 'system');
  const unreadSystem = allSystem.filter(n => !n.isRead).length;
  const totalSystem = allSystem.length;
  const unreadChats = chats.filter(chat => chat.unreadCount > 0).length;
  const totalChats = chats.length;

  // Vereinheitlichte Liste: Notifications + Chats als Einträge (volle Breite)
  const actionPressRef = useRef(false);

  const combinedEntries = useMemo(() => {
    // Alle Chats anzeigen (nicht nur neue), aber gelöschte Chats für beide Teilnehmer ausblenden
    // WICHTIG: Pending Chats (Tauschanfragen) NICHT als Chat-Notifications anzeigen
    // Diese werden bereits als Trade-Notifications angezeigt
    const chatEntries = (chats || [])
      .filter(chat => {
        // Gelöschte Chats ausblenden
        if (chat.deletedBy) return false;
        // Pending Chats (Tauschanfragen) ausblenden - werden bereits als Trade-Notifications angezeigt
        if (chat.tradeStatus === 'pending' && chat.tradeRequestId) return false;
        return true;
      })
      .map(chat => ({
      id: `chat-entry-${chat.id}`,
      type: 'chat',
      title: (() => {
        // Bestimme Gegenüber anhand participants vs currentUserId
        if (Array.isArray(chat.participants) && Array.isArray(chat.participantNames)) {
          const otherIndex = chat.participants.findIndex(pid => pid !== currentUserId);
          if (otherIndex >= 0) {
            return chat.participantNames[otherIndex] || 'Chat';
          }
        }
        return chat.participantNames?.filter(n => n !== 'Du')[0] || 'Chat';
      })(),
      message: chat.lastMessage || 'Chat gestartet',
      timestamp: chat.lastMessageTime || '',
      isRead: (chat.unreadCount || 0) === 0,
      priority: chat.unreadCount > 0 ? 'high' : 'low',
      chatRef: chat,
      isDeleted: !!chat.deletedBy,
    }));
    // Map bestehende Notifications auf vereinheitlichtes Format (inkl. Chat-Message-Notifs)
    const notifEntries = (allNotifications || [])
      .map(n => ({
      id: n.id,
      type: n.type === 'message' ? 'chat' : (n.type === 'trade-info' ? 'trade' : n.type),
      title: n.title,
      message: n.message,
      timestamp: n.timestamp,
      isRead: !!n.isRead,
      priority: n.priority || 'low',
      raw: n,
      chatId: n.chatId, // Für Chat-Nachrichten
      senderName: n.senderName, // Für Chat-Nachrichten
    }));
    // Kombiniere Chat-Einträge und Notifications
    // Für Chat-Message-Notifications: Zeige sie als separate Einträge, aber verhindere Duplikate mit Chat-Einträgen
    const chatIdsWithEntries = new Set(chatEntries.map(e => e.chatRef?.id));
    const messageNotifications = notifEntries.filter(n => n.type === 'chat' && n.chatId);
    const otherNotifications = notifEntries.filter(n => n.type !== 'chat' || !n.chatId);
    
    // Filtere Chat-Message-Notifications heraus, wenn bereits ein Chat-Eintrag existiert
    // ODER zeige beide: Chat-Eintrag für Übersicht und Notification für einzelne Nachricht
    // Für bessere UX: Zeige Chat-Message-Notifications als separate Einträge
    const entries = [...chatEntries, ...notifEntries];
    
    // WICHTIG: Deduplizierung - entferne Einträge mit identischen IDs
    const uniqueEntries = [];
    const seenIds = new Set();
    entries.forEach(entry => {
      if (!seenIds.has(entry.id)) {
        seenIds.add(entry.id);
        uniqueEntries.push(entry);
      } else {
        console.warn('⚠️ Doppelter Eintrag gefunden und entfernt:', entry.id);
      }
    });
    
    // Grobe Sortierung: neueste zuerst, fallback: Chats oben
    return uniqueEntries.sort((a, b) => {
      const timeA = a.timestamp || '';
      const timeB = b.timestamp || '';
      return timeB.localeCompare(timeA); // Neueste zuerst
    });
  }, [allNotifications, chats]);

  // Verwende die Prop unreadCount statt lokale Berechnung
  // const localUnreadCount = allNotifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'trade': return '🍷';
      case 'system': return '📢';
      case 'chat': return '💬';
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

  // Prüfe, ob ein Tausch abgeschlossen wurde
  const isTradeCompleted = (entry) => {
    // Prüfe sowohl trade als auch trade-info Einträge
    if (entry.type !== 'trade') {
      return false;
    }
    
    // Prüfe zuerst direkt im entry.raw
    if (entry.raw?.tradeStatus === 'accepted') {
      return true;
    }
    
    // Prüfe direkt im Titel/Message der Notification
    if (entry.raw?.title?.includes('angenommen') || entry.raw?.title?.includes('akzeptiert') || entry.raw?.title?.includes('durchgeführt')) {
      return true;
    }
    
    // Suche nach Notifications, die zeigen, dass der Tausch akzeptiert wurde
    const requestId = entry.raw?.requestId;
    if (!requestId) {
      return false;
    }
    
    // Prüfe alle Notifications mit dieser requestId
    const matchingNotifications = notifications.filter(n => 
      n.requestId === requestId
    );
    
    // Prüfe auf "angenommen" oder "akzeptiert" im Titel
    const acceptedNotification = matchingNotifications.find(n => 
      (n.type === 'trade' || n.type === 'trade-info') && 
      (n.title?.includes('angenommen') || n.title?.includes('akzeptiert') || n.title?.includes('durchgeführt'))
    );
    
    if (acceptedNotification) {
      return true;
    }
    
    // Prüfe optional auch in Chats, wenn vorhanden
    if (chats && chats.length > 0) {
      const relatedChat = chats.find(c => c.tradeRequestId === requestId);
      if (relatedChat && relatedChat.tradeStatus === 'accepted') {
        return true;
      }
    }
    
    return false;
  };


  const markAsRead = (notification) => {
    if ((notification.type === 'trade' || notification.type === 'trade-info') && notification.requestId && onUpdateNotificationsReadByRequestId) {
      onUpdateNotificationsReadByRequestId(notification.requestId, true);
      return;
    }
    if (onUpdateNotificationReadStatus) {
      onUpdateNotificationReadStatus(notification.id, true);
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
    // WICHTIG: trade-info Notifications für Person A werden NICHT automatisch als gelesen markiert
    // Person A soll selbst entscheiden, wann die Notification gelöscht wird
    // Nur andere Notification-Typen werden beim Anklicken automatisch als gelesen markiert
    if (notification.type !== 'trade-info') {
      // Als gelesen markieren (ganze Notification übergeben)
      markAsRead(notification);
    }
    
    // Wenn es eine Umfrage-Benachrichtigung ist, zur Umfrage navigieren
    if (notification.type === 'system' && notification.title.includes('Umfrage')) {
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
    // Tauschanfrage → Auswahl im Weinregal öffnen
    // WICHTIG: Nur Person B (Empfänger) mit type === 'trade' soll navigieren
    // Person A (Absender) mit type === 'trade-info' soll KEINE Navigation bekommen
    else if ((notification.type === 'trade' || notification.type === 'trade-info') && notification.requestId) {
      // Prüfe ob der aktuelle User Person B (Empfänger) ist
      // type === 'trade' bedeutet: Notification für Empfänger (toUserId === currentUserId)
      // type === 'trade-info' bedeutet: Notification für Absender (fromUserId === currentUserId)
      
      if (notification.type === 'trade' && notification.toUserId === currentUserId) {
        // Person B (Empfänger) → Navigiere zum Weinregal von A (fromUserId)
        const fromUserId = notification.fromUserId;
        onNavigate('mein-weinregal', { viewUserId: fromUserId, tradeRequestId: notification.requestId });
      } else if (notification.type === 'trade-info' && notification.fromUserId === currentUserId) {
        // Person A (Absender) → KEINE Navigation, nur Info anzeigen
        Alert.alert(
          notification.title || 'Tausch involviert',
          notification.message || 'Du bist in einen Tausch involviert.',
          [{ text: 'OK' }]
        );
      } else {
        // Fallback für alte Daten oder unerwartete Fälle
        console.log('⚠️ Unerwartete Trade-Notification-Struktur:', notification);
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
    else if (notification.type === 'chat' && (notification.chatId || notification.chatRef)) {
      console.log('Chat-Benachrichtigung gefunden!');
      const chat = notification.chatRef || chats.find(c => c.id === notification.chatId);
      if (chat) {
        console.log('Navigiere zu Chat:', chat.id);
        // Markiere Chat als gelesen wenn er über Notification geöffnet wird
        if (onMarkChatAsRead && chat.id) {
          onMarkChatAsRead(chat.id);
        }
        onNavigate('chat-room', { chat: chat });
      } else {
        console.log('Chat nicht gefunden!');
        Alert.alert('Fehler', 'Chat nicht gefunden!');
      }
    }
    // Wenn es eine Chat-Message-Notification ist (neue Nachricht in bestehendem Chat)
    else if (notification.type === 'message' && notification.chatId) {
      console.log('Chat-Message-Notification gefunden!');
      const chat = chats.find(c => c.id === notification.chatId);
      if (chat) {
        console.log('Navigiere zu Chat:', chat.id);
        // Markiere Chat als gelesen wenn er über Notification geöffnet wird
        if (onMarkChatAsRead && chat.id) {
          onMarkChatAsRead(chat.id);
        }
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
    // Gelöschte Chats können nicht geöffnet werden
    if (chat.deletedBy) {
      Alert.alert('Chat verlassen', 'Der Teilnehmer hat den Chat verlassen.');
      return;
    }
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
        borderBottomWidth: 0.5,
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
          {/* Keine Tabs mehr – einheitliche Liste "Alle" */}

          {/* Aktion: Alle als gelesen markieren (optional) */}
          {unreadCount > 0 && (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity style={styles.markAllButton} onPress={markAllAsRead}>
                <Text style={styles.markAllButtonText}>Alle als gelesen markieren</Text>
              </TouchableOpacity>
            </View>
          )}

              {/* Einheitsliste über gesamte Breite */}
              <View style={styles.fullList}>
                {combinedEntries.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <Text style={styles.emptyTitle}>Keine Nachrichten</Text>
                    <Text style={styles.emptySubtitle}>
                      Du hast noch keine Nachrichten erhalten.
                    </Text>
                  </View>
                ) : (
                  combinedEntries.map((entry, index) => {
                    const key = entry.id || `entry-${index}`;
                    const bgColor = entry.type === 'chat' ? 'rgba(244,67,54,0.18)' : (entry.type === 'trade' ? 'rgba(76,175,80,0.18)' : 'rgba(33,150,243,0.18)');
                    // Zwei-zeilige Überschrift nach Typ
                    let headingTop = '';
                    let headingBottom = '';
                    if (entry.type === 'chat') {
                      // Verwende den bereits in entry.title gespeicherten Namen
                      let otherName = entry.title || 'Unbekannt';
                      // Fallback: Versuche aus chatRef zu holen
                      if (otherName === 'Chat' || otherName === 'Unbekannt') {
                        if (Array.isArray(entry.chatRef?.participants) && Array.isArray(entry.chatRef?.participantNames)) {
                          const idxOther = entry.chatRef.participants.findIndex(pid => pid !== currentUserId);
                          if (idxOther >= 0) otherName = entry.chatRef.participantNames[idxOther] || otherName;
                        } else {
                          otherName = entry.chatRef?.participantNames?.find(n => n !== 'Du') || otherName;
                        }
                      }
                      headingTop = 'Nachricht von';
                      headingBottom = otherName;
                    } else if (entry.type === 'trade') {
                      // Versuche Username aus verschiedenen Quellen zu holen
                      let fromName = entry.raw?.fromUserName || entry.raw?.fromUser?.username || entry.raw?.fromUser?.email || entry.message?.match(/von\s+([^"]+)/)?.[1] || 'Unbekannt';
                      // Entferne "Tauschpartner" Fallback
                      if (fromName === 'Tauschpartner') {
                        fromName = entry.raw?.fromUser?.firstName && entry.raw?.fromUser?.lastName 
                          ? `${entry.raw.fromUser.firstName} ${entry.raw.fromUser.lastName}`
                          : entry.raw?.fromUser?.email || 'Unbekannt';
                      }
                      headingTop = 'Tauschanfrage von';
                      headingBottom = fromName;
                    } else if (entry.type === 'chat' && entry.chatId && entry.raw?.type === 'message') {
                      // Chat-Message-Notification (neue Nachricht in bestehendem Chat)
                      const senderName = entry.senderName || entry.raw?.senderName || 'Unbekannt';
                      headingTop = 'Neue Nachricht von';
                      headingBottom = senderName;
                    } else {
                      headingTop = 'Systemnachricht vom';
                      headingBottom = 'Admin';
                    }
                    const isCompleted = entry.type === 'trade' && isTradeCompleted(entry);
                    return (
                      <TouchableOpacity
                        key={key}
                        style={[
                          styles.fullRow, 
                          index > 0 && styles.rowDivider, 
                          { backgroundColor: bgColor },
                          isCompleted && styles.fullRowWithButton
                        ]}
                        onPress={() => {
                          if (actionPressRef.current) return;
                          if (entry.type === 'chat' && entry.chatRef) {
                            handleChatPress(entry.chatRef);
                          } else if (entry.type === 'chat' && entry.chatId && entry.raw?.type === 'message') {
                            // Chat-Message-Notification: Navigiere zum Chat
                            const chat = chats.find(c => c.id === entry.chatId);
                            if (chat) {
                              // Markiere Notification als gelesen
                              if (entry.raw && onUpdateNotificationReadStatus) {
                                onUpdateNotificationReadStatus(entry.raw.id, true);
                              }
                              // Markiere Chat als gelesen
                              if (onMarkChatAsRead) {
                                onMarkChatAsRead(chat.id);
                              }
                              onNavigate('chat-room', { chat: chat });
                            }
                          } else {
                            handleNotificationPress(entry.raw || entry);
                          }
                        }}
                        activeOpacity={0.9}
                      >
                        {/* Icon links */}
                        <View style={styles.rowIconContainer}>
                          <Text style={styles.rowIconText}>{getNotificationIcon(entry.type)}</Text>
                        </View>
                        {/* Text mittig */}
                        <View style={styles.rowInfoContainer}>
                          <View style={styles.rowTitleContainer}>
                            <Text style={styles.rowTitleLine} numberOfLines={1}>{headingTop}</Text>
                            <Text style={styles.rowTitleLine} numberOfLines={1}>{headingBottom}</Text>
                          </View>
                          <Text style={styles.rowMessage} numberOfLines={2}>{entry.message}</Text>
                          {/* Abgeschlossen-Button für abgeschlossene Tauschanfragen */}
                          {isCompleted && (
                            <View style={styles.completedButtonContainer}>
                              <View style={styles.completedButton}>
                                <Text style={styles.completedButtonText}>Abgeschlossen</Text>
                              </View>
                            </View>
                          )}
                        </View>
                        {/* Meta rechts */}
                        <View style={styles.rowMetaContainer}>
                          {!entry.isRead && <View style={styles.priorityDotFull} />}
                          <Text style={styles.rowTime}>{entry.timestamp}</Text>
                          <View style={styles.rowActionsGrid}>
                            {/* Als gelesen */}
                            <TouchableOpacity
                              style={styles.rowActionSquare}
                              onPressIn={() => { actionPressRef.current = true; }}
                              onPressOut={() => { setTimeout(() => { actionPressRef.current = false; }, 0); }}
                              onPress={() => {
                                if (entry.type === 'chat' && entry.chatRef && onMarkChatAsRead) {
                                  onMarkChatAsRead(entry.chatRef.id);
                                } else if (entry.raw) {
                                  markAsRead(entry.raw);
                                }
                              }}
                            >
                              <Text style={styles.rowActionIcon}>✓</Text>
                            </TouchableOpacity>
                            {/* Löschen */}
                            <TouchableOpacity
                              style={styles.rowActionSquare}
                              onPressIn={() => { actionPressRef.current = true; }}
                              onPressOut={() => { setTimeout(() => { actionPressRef.current = false; }, 0); }}
                              onPress={() => {
                                if (entry.type === 'chat' && entry.chatRef && onDeleteChat) {
                                  onDeleteChat(entry.chatRef.id);
                                } else if (entry.raw) {
                                  handleDeleteNotification(entry.raw.id);
                                }
                              }}
                            >
                              <Text style={styles.rowActionIcon}>🗑️</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
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
    borderTopWidth: 1,
    borderTopColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
    // Glassmorphism Effekt
    shadowColor: '#a9c7cd',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
    width: 44,
    alignItems: 'center',
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
    paddingHorizontal: 0,
    paddingVertical: 0,
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
  fullList: {
    marginBottom: 0,
  },
  fullRow: {
    minHeight: 98,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  fullRowWithButton: {
    minHeight: 140,
  },
  rowDivider: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.18)',
  },
  rowIconContainer: {
    width: 40,
    alignItems: 'center',
  },
  rowIconText: {
    fontSize: 20,
  },
  rowInfoContainer: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 6,
  },
  rowTitleContainer: {
    marginBottom: 2,
  },
  rowTitleLine: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2f3a3b',
    lineHeight: 20,
  },
  rowMessage: {
    fontSize: 14,
    color: '#4b4b4b',
  },
  completedButtonContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    width: '100%',
  },
  completedButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.4)',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderWidth: 2,
    borderColor: 'rgba(244, 67, 54, 0.6)',
    alignSelf: 'center',
  },
  completedButtonText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rowMetaContainer: {
    alignItems: 'flex-end',
    marginLeft: 8,
    width: 120,
    marginRight: 12,
  },
  priorityDotFull: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F44336',
    marginBottom: 6,
  },
  rowTime: {
    fontSize: 12,
    color: '#999',
  },
  rowActionsGrid: {
    marginTop: 6,
    width: 96,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'flex-end',
  },
  rowActionSquare: {
    width: 46,
    height: 46,
    backgroundColor: '#EEEEEE',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowActionIcon: {
    fontSize: 16,
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
  tradeAcceptButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  tradeAcceptButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tradeDeclineButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
    flex: 1,
    borderWidth: 1,
    borderColor: '#F44336',
  },
  tradeDeclineButtonText: {
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
    color: '#2f3a3b',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#2f3a3b',
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
