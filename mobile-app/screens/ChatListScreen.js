import React, { useState, useEffect, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  Modal
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import OptimizedImage from '../components/OptimizedImage';
import { getCurrentUser } from '../services/testAuth';
import { getTradeRequest } from '../services/database-web';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase-web';

export default function ChatListScreen({ onNavigate, onLogout = () => {}, chats = [], unreadNotifications = 0, unreadHints = 0, onMarkChatAsRead, onMarkAllChatsAsRead = null, onDeleteChat = null, notifications = [], isLoggedIn = false, onDeclineTradeRequest = null, onMarkAllChatNotificationsAsRead = null }) {
  // VERSION: 2.0 - Modern Grid Design mit Glassmorphism
  console.log('✅ ChatListScreen V2.0 geladen - Modern Grid Design');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [wineImages, setWineImages] = useState({}); // { chatId: { wineFromImage: string, wineToImage: string } }

  // Filtere Chats: Nur Chats anzeigen, bei denen der aktuelle User ein Teilnehmer ist
  // WICHTIG: 1-zu-1 Kommunikation darf nicht von Dritten (auch nicht Admins) eingesehen werden
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.uid;
  
  // Helper-Funktion: Dedupliziere Chats basierend auf ID (zusätzliche Sicherheit)
  const deduplicateChats = (chatsArray) => {
    if (!Array.isArray(chatsArray)) {
      console.warn('⚠️ ChatListScreen: deduplicateChats - Kein Array erhalten');
      return [];
    }
    
    const seen = new Set();
    const uniqueChats = [];
    
    for (const chat of chatsArray) {
      if (!chat || !chat.id) {
        console.warn('⚠️ ChatListScreen: deduplicateChats - Chat ohne ID gefunden, überspringe');
        continue;
      }
      
      if (!seen.has(chat.id)) {
        seen.add(chat.id);
        uniqueChats.push(chat);
      } else {
        console.log(`🔧 ChatListScreen: Duplikat entfernt - Chat ID: ${chat.id}`);
      }
    }
    
    if (chatsArray.length !== uniqueChats.length) {
      console.log(`✅ ChatListScreen: Deduplizierung - ${chatsArray.length} → ${uniqueChats.length} Chats (${chatsArray.length - uniqueChats.length} Duplikate entfernt)`);
    }
    
    return uniqueChats;
  };
  
  // Filtere und dedupliziere Chats
  const filteredChats = chats.filter(chat => {
    // WICHTIG: ChatListScreen zeigt NUR echte Chats, KEINE Hinweise!
    // Hinweise (entryType: 'hint') werden ausschließlich im HinweisScreen angezeigt
    if (chat.entryType === 'hint') {
      return false; // Alle Hinweise ausblenden - gehören in HinweisScreen
    }

    // Für echte Chats: Prüfe, ob der aktuelle User ein Teilnehmer ist
    if (!chat.participants || !Array.isArray(chat.participants)) {
      return false; // Keine Teilnehmer-Liste = Chat nicht anzeigen
    }
    // WICHTIG: Filtere gelöschte Chats heraus (deleted === true oder deletedBy existiert)
    // Die Logik muss mit getChatsForUser konsistent sein
    if (chat.deleted === true) {
      return false; // Chat wurde gelöscht
    }
    // WICHTIG: Wenn deletedBy existiert (egal ob Array oder nicht), Chat für alle ausblenden
    if (chat.deletedBy) {
      if (Array.isArray(chat.deletedBy)) {
        // Wenn deletedBy ein Array ist und Einträge hat, Chat ausblenden
        if (chat.deletedBy.length > 0) {
          return false; // Chat wurde gelöscht - für alle ausblenden
        }
      } else {
        // Wenn deletedBy existiert aber kein Array ist, auch ausblenden
        return false; // Chat wurde gelöscht - für alle ausblenden
      }
    }
    // Nur anzeigen, wenn der aktuelle User in der participants-Liste ist
    return chat.participants.includes(currentUserId);
  });
  
  // WICHTIG: Dedupliziere Chats als zusätzliche Sicherheit (auch wenn App.js bereits dedupliziert)
  // Memoize allChats, um Endlosschleife zu vermeiden
  const allChats = useMemo(() => {
    const deduplicated = deduplicateChats(filteredChats);
    return deduplicated;
  }, [filteredChats.length, JSON.stringify(filteredChats.map(c => c.id))]);

  // VERSION 2.0: Debug-Log für Chat-Anzahl (außerhalb useEffect, damit es bei jedem Render läuft)
  console.log('📊 ChatListScreen V2.0 - Filtered Chats (nur echte Chats, keine Hinweise):', filteredChats.length);
  console.log('📊 ChatListScreen V2.0 - Final allChats:', allChats.length);
  if (allChats.length > 0) {
    console.log('📊 ChatListScreen V2.0 - Chat Details:', allChats.map(c => ({ 
      id: c.id, 
      type: c.type, 
      entryType: c.entryType,
      participants: c.participants?.length || 0
    })));
  }

  // Erstelle Array von Trade-Request-IDs für Dependency
  const tradeRequestIds = useMemo(() => {
    return allChats
      .filter(chat => chat.tradeRequestId)
      .map(chat => chat.tradeRequestId)
      .filter((id, index, self) => self.indexOf(id) === index); // Eindeutige IDs
  }, [allChats]);

  // Initialisierung
  useEffect(() => {
  }, []);

  // Lade Weinbilder für alle Chats mit Trade-Request
  useEffect(() => {
    if (tradeRequestIds.length === 0) return;
    
    const loadWineImages = async () => {
      const imagesMap = {};
      
      for (const chat of allChats) {
        if (chat.tradeRequestId) {
          try {
            const tradeRequest = await getTradeRequest(chat.tradeRequestId);
            if (tradeRequest) {
              console.log('📦 Trade-Request Daten (ChatListScreen):', {
                id: tradeRequest.id,
                fields: Object.keys(tradeRequest),
                wineFromId: tradeRequest.wineFromId,
                wineId: tradeRequest.wineId,
                wineIds: tradeRequest.wineIds,
                selectedWineId: tradeRequest.selectedWineId,
                wineToId: tradeRequest.wineToId
              });
              
              // Lade Weinbilder aus Trade-Request
              let wineFromImage = null;
              let wineToImage = null;
              
              // Prüfe verschiedene mögliche Feldnamen für wineFrom
              let wineFromId = tradeRequest.wineFromId || tradeRequest.wineId;
              
              // Wenn wineIds ein Array ist, nimm das erste Element
              if (!wineFromId && tradeRequest.wineIds && Array.isArray(tradeRequest.wineIds) && tradeRequest.wineIds.length > 0) {
                wineFromId = tradeRequest.wineIds[0];
              }
              
              // Lade wineFrom Bild
              if (wineFromId) {
                try {
                  const wineDoc = await getDoc(doc(db, 'wines', wineFromId));
                  if (wineDoc.exists()) {
                    const wineData = wineDoc.data();
                    wineFromImage = wineData.labelImage || null;
                    console.log('✅ wineFrom Bild geladen (ChatListScreen):', wineFromImage ? 'Vorhanden' : 'Nicht vorhanden');
                  }
                } catch (error) {
                  console.error('❌ Fehler beim Laden des wineFrom Bildes:', error);
                }
              }
              
              // Prüfe verschiedene mögliche Feldnamen für wineTo
              let wineToId = tradeRequest.selectedWineId || tradeRequest.wineToId;
              
              // Wenn wineIds ein Array ist, nimm das zweite Element
              if (!wineToId && tradeRequest.wineIds && Array.isArray(tradeRequest.wineIds) && tradeRequest.wineIds.length > 1) {
                wineToId = tradeRequest.wineIds[1];
              }
              
              // Lade wineTo Bild
              if (wineToId) {
                try {
                  const wineDoc = await getDoc(doc(db, 'wines', wineToId));
                  if (wineDoc.exists()) {
                    const wineData = wineDoc.data();
                    wineToImage = wineData.labelImage || null;
                    console.log('✅ wineTo Bild geladen (ChatListScreen):', wineToImage ? 'Vorhanden' : 'Nicht vorhanden');
                  }
                } catch (error) {
                  console.error('❌ Fehler beim Laden des wineTo Bildes:', error);
                }
              }
              
              imagesMap[chat.id] = {
                wineFromImage,
                wineToImage
              };
            }
          } catch (error) {
            console.error('❌ Fehler beim Laden des Trade-Requests:', error);
          }
        }
      }
      
      setWineImages(imagesMap);
    };
    
      loadWineImages();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tradeRequestIds.join(',')]); // Verwende Trade-Request-IDs als Dependency

  useEffect(() => {
    // Simuliere Ladezeit
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    // WICHTIG: Markiere alle Chat-Notifications als gelesen, wenn Screen geöffnet wird
    if (onMarkAllChatNotificationsAsRead) {
      onMarkAllChatNotificationsAsRead();
    }
  }, [onMarkAllChatNotificationsAsRead]);

  const handleChatImagePress = (chat) => {
    console.log('🔄 ChatListScreen: handleChatImagePress aufgerufen für Chat:', chat.id, chat.type || chat.entryType);
    // Öffne Modal mit Chat-Details
    setSelectedChat(chat);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedChat(null);
  };

  const handleChatPress = (chat) => {
    console.log('🔄 ChatListScreen: handleChatPress aufgerufen');
    console.log('🔄 ChatListScreen: Chat-Details:', { id: chat.id, entryType: chat.entryType, type: chat.type });
    
    // WICHTIG: ChatListScreen zeigt nur echte Chats, keine Hinweise!
    // Alle Hinweise wurden bereits herausgefiltert, aber defensive Prüfung für Sicherheit
    if (chat.entryType === 'hint') {
      console.warn('⚠️ ChatListScreen: Hinweis sollte nicht hier sein - wurde nicht herausgefiltert:', chat.id);
      return; // Hinweise gehören in HinweisScreen, nicht hier
    }
    
    // WICHTIG: Nur echte Chats (entryType: 'chat' oder undefined) können geöffnet werden
    if (chat.entryType && chat.entryType !== 'chat') {
      console.log('⚠️ Eintrag ist kein Chat, kann nicht geöffnet werden:', chat.entryType);
      return;
    }
    
    // Markiere Chat als gelesen
    if (onMarkChatAsRead) {
      onMarkChatAsRead(chat.id);
    }
    
    console.log('🔄 ChatListScreen: Navigiere zu chat-room mit Chat:', chat.id);
    console.log('🔄 ChatListScreen: onNavigate verfügbar?', typeof onNavigate);
    if (onNavigate) {
      onNavigate('chat-room', { chat });
      console.log('✅ ChatListScreen: Navigation zu chat-room aufgerufen');
    } else {
      console.error('❌ ChatListScreen: onNavigate ist nicht verfügbar!');
    }
  };

  const handleDeleteChat = (chatId) => {
    Alert.alert(
      'Chat löschen',
      'Möchten Sie diesen Chat wirklich löschen?\n\nAlle Nachrichten werden unwiderruflich gelöscht.',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => {
          if (onDeleteChat) {
            onDeleteChat(chatId);
          } else {
            console.log('Chat gelöscht:', chatId);
            Alert.alert('Erfolg', 'Chat wurde gelöscht!');
          }
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

  // Bestimme den Namen des anderen Teilnehmers dynamisch
  const getOtherParticipantName = (chat) => {
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.uid;
    
    // PHASE3: Für Hinweise (entryType: 'hint') verwende fromUserId/toUserId
    if (chat.entryType === 'hint') {
      if (!currentUserId) return 'Unbekannt';
      
      // Wenn currentUserId der Absender ist, ist der andere der Empfänger
      if (chat.fromUserId === currentUserId && chat.toUserName) {
        return chat.toUserName;
      }
      // Wenn currentUserId der Empfänger ist, ist der andere der Absender
      if (chat.toUserId === currentUserId && chat.fromUserName) {
        return chat.fromUserName;
      }
      
      // Fallback: Verwende participantNames falls vorhanden
      if (chat.participantNames && Array.isArray(chat.participantNames)) {
        const otherName = chat.participantNames.find(name => 
          name !== currentUser?.username && 
          name !== 'Tauschpartner' && 
          name !== 'Du'
        );
        if (otherName) return otherName;
      }
      
      return 'Unbekannt';
    }
    
    // Für echte Chats: Prüfe participants
    if (!currentUserId || !chat.participants || !chat.participantNames) {
      return 'Unbekannt';
    }
    
    // Finde den Index des anderen Teilnehmers
    const otherIndex = chat.participants.findIndex(pid => pid !== currentUserId);
    const otherUserId = otherIndex >= 0 ? chat.participants[otherIndex] : null;
    
    // Wenn kein otherIndex gefunden wurde, versuche es anders
    if (otherIndex < 0) {
      // Fallback: Verwende den zweiten Teilnehmer, wenn der erste der aktuelle ist
      if (chat.participants.length > 1 && chat.participants[0] === currentUserId) {
        const fallbackOtherId = chat.participants[1];
        const fallbackOtherIndex = 1;
        if (chat.participantNames[fallbackOtherIndex]) {
          return chat.participantNames[fallbackOtherIndex];
        }
      }
    }
    
    // Versuche zuerst den Namen aus Notifications zu holen (zuverlässigste Quelle)
    if (chat.tradeRequestId) {
      const tradeNotification = notifications.find(n => 
        (n.type === 'trade' || n.type === 'trade-info') && n.requestId === chat.tradeRequestId
      );
      if (tradeNotification) {
        // Bestimme, ob der andere User der Absender oder Empfänger ist
        if (tradeNotification.fromUserId === otherUserId && tradeNotification.fromUserName && tradeNotification.fromUserName !== 'Tauschpartner') {
          return tradeNotification.fromUserName;
        }
        if (tradeNotification.toUserId === otherUserId && tradeNotification.toUserName && tradeNotification.toUserName !== 'Tauschpartner') {
          return tradeNotification.toUserName;
        }
        // Fallback: Verwende einfach fromUserName oder toUserName (aber nicht den aktuellen User)
        if (tradeNotification.fromUserName && tradeNotification.fromUserName !== 'Tauschpartner' && tradeNotification.fromUserId !== currentUserId) {
          return tradeNotification.fromUserName;
        }
        if (tradeNotification.toUserName && tradeNotification.toUserName !== 'Tauschpartner' && tradeNotification.toUserId !== currentUserId) {
          return tradeNotification.toUserName;
        }
        // Extrahiere Namen aus der Message (z.B. "admin möchte deinen Wein...")
        if (tradeNotification.message) {
          const match = tradeNotification.message.match(/^([^ ]+)\s+möchte/);
          if (match && match[1] && match[1] !== 'Tauschpartner') {
            return match[1];
          }
        }
      }
    }
    
    // Für direkte Chats: Suche in allen Notifications nach Chats mit diesem anderen User
    if (!chat.tradeRequestId && otherUserId) {
      const chatNotification = notifications.find(n => 
        n.type === 'chat' && 
        n.chatRef && 
        n.chatRef.participants && 
        n.chatRef.participants.includes(otherUserId) &&
        n.chatRef.participants.includes(currentUserId)
      );
      if (chatNotification?.chatRef?.participantNames) {
        const notifOtherIndex = chatNotification.chatRef.participants.findIndex(pid => pid !== currentUserId);
        if (notifOtherIndex >= 0 && chatNotification.chatRef.participantNames[notifOtherIndex] && chatNotification.chatRef.participantNames[notifOtherIndex] !== 'Tauschpartner') {
          return chatNotification.chatRef.participantNames[notifOtherIndex];
        }
      }
    }
    
    // Fallback: Verwende participantNames aus dem Chat
    let otherName = null;
    if (otherIndex >= 0 && chat.participantNames[otherIndex]) {
      otherName = chat.participantNames[otherIndex];
    } else {
      // Filtere "Du" heraus
      otherName = chat.participantNames?.find(n => n !== 'Du' && n !== currentUser?.username);
    }
    
    // Filtere "Tauschpartner" heraus - wenn vorhanden, versuche es anders zu lösen
    if (otherName === 'Tauschpartner') {
      // Versuche aus der letzten Nachricht den Namen zu extrahieren
      if (chat.lastMessage) {
        // Suche nach Mustern wie "admin möchte", "Max möchte", etc.
        const messageMatch = chat.lastMessage.match(/([^ ]+)\s+möchte/);
        if (messageMatch && messageMatch[1] && messageMatch[1] !== 'Tauschpartner') {
          return messageMatch[1];
        }
      }
      // Versuche aus allen Notifications mit diesem User zu extrahieren
      const anyNotification = notifications.find(n => 
        (n.type === 'trade' || n.type === 'trade-info' || n.type === 'chat') &&
        ((n.fromUserId === otherUserId && n.fromUserName && n.fromUserName !== 'Tauschpartner') ||
         (n.toUserId === otherUserId && n.toUserName && n.toUserName !== 'Tauschpartner'))
      );
      if (anyNotification) {
        if (anyNotification.fromUserId === otherUserId && anyNotification.fromUserName) {
          return anyNotification.fromUserName;
        }
        if (anyNotification.toUserId === otherUserId && anyNotification.toUserName) {
          return anyNotification.toUserName;
        }
      }
      return 'Unbekannt';
    }
    
    return otherName || 'Unbekannt';
  };

  // Prüfe, ob ein Tausch durchgeführt wurde
  const isTradeCompleted = (chat) => {
    if (chat.type !== 'trade' || !chat.tradeRequestId) {
      return false;
    }
    
    // Prüfe zuerst direkt im Chat-Objekt (wird beim Erstellen gesetzt)
    if (chat.tradeStatus === 'accepted') {
      return true;
    }
    
    // Suche nach Notifications, die zeigen, dass der Tausch akzeptiert wurde
    // Prüfe alle Notifications mit dieser tradeRequestId
    const matchingNotifications = notifications.filter(n => 
      n.requestId === chat.tradeRequestId
    );
    
    // Prüfe auf "angenommen" oder "akzeptiert" im Titel
    const acceptedNotification = matchingNotifications.find(n => 
      (n.type === 'trade' || n.type === 'trade-info') && 
      (n.title?.includes('angenommen') || n.title?.includes('akzeptiert') || n.title?.includes('durchgeführt'))
    );
    
    if (acceptedNotification) {
      return true;
    }
    
    // Prüfe auch in der Message nach Indikatoren
    const messageIndicators = matchingNotifications.find(n => 
      n.message && (n.message.includes('angenommen') || n.message.includes('akzeptiert'))
    );
    
    if (messageIndicators) {
      return true;
    }
    
    return false;
  };

  return (
    <View style={styles.container}>
      {/* StatusBar-Ersatz für iPhone */}
      <View style={{
        height: Platform.OS === 'ios' ? 60 : 0,
        backgroundColor: '#2c2c2c',
        width: '100%',
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
                  <Text style={styles.profileIconText}>P</Text>
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
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>Chats</Text>
              </View>
            </View>
          </View>
          
          {/* Button "Alle als gelesen markieren" unterhalb des Headers */}
          {allChats.some(chat => chat.unreadCount > 0) && onMarkAllChatsAsRead && typeof onMarkAllChatsAsRead === 'function' && (
            <View style={styles.markAllReadButtonContainer}>
              <TouchableOpacity 
                style={styles.markAllReadButton}
                onPress={() => {
                  console.log('🔄 ChatListScreen: Button "Alle gelesen" geklickt');
                  if (onMarkAllChatsAsRead && typeof onMarkAllChatsAsRead === 'function') {
                    onMarkAllChatsAsRead();
                  } else {
                    console.error('❌ ChatListScreen: onMarkAllChatsAsRead ist keine Funktion:', typeof onMarkAllChatsAsRead);
                  }
                }}
              >
                <Text style={styles.markAllReadButtonText}>✓ Alle gelesen</Text>
              </TouchableOpacity>
            </View>
          )}
          
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
                <View style={styles.chatsList} key="modern-grid-chats-list">
                  {allChats.map((chat, index) => {
                    console.log(`🔄 Rendering Chat ${index + 1}/${allChats.length}:`, chat.id, chat.type || chat.entryType);
                    // Bestimme Border-Farbe basierend auf Typ
                    let borderColor = 'rgba(0, 0, 0, 0.7)'; // Standard: schwarz
                    
                    if (chat.entryType === 'hint') {
                      if (chat.hintType === 'trade-involved') {
                        borderColor = 'rgba(255, 255, 224, 0.7)'; // Gold für trade-involved
                      } else if (chat.hintType === 'trade-decision') {
                        borderColor = 'rgba(144, 238, 144, 0.7)'; // Grün für trade-decision
                      }
                    } else if (chat.type === 'trade') {
                      borderColor = 'rgba(218, 165, 32, 0.7)'; // Gold für Tausch-Chats
                    }

                    const otherName = getOtherParticipantName(chat);
                    const chatTitle = (() => {
                      const currentUser = getCurrentUser();
                      const currentUserId = currentUser?.uid;
                      
                      if (chat.entryType === 'hint') {
                        if (chat.hintType === 'trade-involved') {
                          if (chat.fromUserId === currentUserId) {
                            if (chat.status === 'accepted') return 'Tauschanfrage angenommen';
                            if (chat.status === 'rejected') return 'Tauschanfrage abgelehnt';
                            return 'Tausch involviert';
                          }
                          return 'Tausch involviert';
                        } else if (chat.hintType === 'trade-decision') {
                          if (chat.toUserId === currentUserId) {
                            if (chat.status === 'accepted') return 'Tauschanfrage angenommen';
                            if (chat.status === 'rejected') return 'Tauschanfrage abgelehnt';
                            return `Tauschanfrage von ${otherName}`;
                          }
                          return `Tauschanfrage von ${otherName}`;
                        }
                        return `Tauschanfrage: ${otherName}`;
                      }
                      
                      const lastMessageFromMe = chat.lastMessageSenderId && currentUserId && chat.lastMessageSenderId === currentUserId;
                      if (chat.type === 'trade') {
                        return `Tausch mit ${otherName}`;
                      }
                      return `Nachricht ${lastMessageFromMe ? 'an' : 'von'} ${otherName}`;
                    })();
                    
                    // Hole Weinbilder für diesen Chat
                    const chatWineImages = wineImages[chat.id] || {};
                    const wineFromImage = chatWineImages.wineFromImage;
                    const wineToImage = chatWineImages.wineToImage;
                    
                    return (
                      <TouchableOpacity 
                        key={chat.id} 
                        style={[styles.chatRow, { borderColor }]}
                        activeOpacity={0.8}
                        onPress={() => handleChatImagePress(chat)}
                      >
                        {/* Nur Bild - Container besteht nur aus Bild */}
                        <View style={styles.rowImageOnlyContainer}>
                          {/* Prüfe ob Tausch abgeschlossen (accepted) */}
                          {chat.status === 'accepted' ? (
                            // Tausch abgeschlossen - Zeige roten, dicken Text
                            <View style={styles.tradeCompletedContainer}>
                              <Text style={styles.tradeCompletedText}>Tausch abgeschlossen</Text>
                            </View>
                          ) : chat.tradeRequestId ? (
                            // Normale Tauschanfrage - Zeige Weinbilder
                            <View style={styles.wineImagesContainer}>
                              {/* Linkes Weinbild (wineFrom) */}
                              <View style={styles.wineImageWrapper}>
                                {wineFromImage ? (
                                  <OptimizedImage
                                    source={{ uri: wineFromImage }}
                                    style={styles.wineImage}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <View style={styles.wineImagePlaceholder}>
                                    <Text style={styles.wineImagePlaceholderText}>Kein Bild vorhanden</Text>
                                  </View>
                                )}
                              </View>
                              
                              {/* Tausch-Icon in der Mitte */}
                              <View style={styles.tradeIconContainer}>
                                <MaterialIcons name="swap-horiz" size={32} color="#a9c7cd" />
                              </View>
                              
                              {/* Rechtes Weinbild (wineTo) */}
                              <View style={styles.wineImageWrapper}>
                                {wineToImage ? (
                                  <OptimizedImage
                                    source={{ uri: wineToImage }}
                                    style={styles.wineImage}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <View style={styles.wineImagePlaceholder}>
                                    <Text style={styles.wineImagePlaceholderText}>Kein Bild vorhanden</Text>
                                  </View>
                                )}
                              </View>
                            </View>
                          ) : (
                            // Fallback: Avatar-Bild für Chats ohne Trade-Request
                            (() => {
                              const avatarUrl = chat.participantAvatar || chat.avatar || null;
                              return avatarUrl ? (
                                <OptimizedImage
                                  source={{ uri: avatarUrl }}
                                  style={styles.rowImageOnly}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View style={styles.rowPlaceholderImageOnly}>
                                  <Text style={styles.placeholderTextOnly}>
                                    {getChatIcon(chat.type)}
                                  </Text>
                                </View>
                              );
                            })()
                          )}
                          {/* Unread Badge oben rechts */}
                          {chat.unreadCount > 0 && (
                            <View style={styles.unreadBadgeOverlay}>
                              <Text style={styles.unreadTextOverlay}>{chat.unreadCount}</Text>
                            </View>
                          )}
                          {/* Overlay mit Kurzinfos am unteren Rand */}
                          <View style={styles.rowImageOverlay}>
                            <Text style={styles.rowImageOverlayText} numberOfLines={1}>
                              {chatTitle}
                            </Text>
                            {chat.lastMessage && (
                              <Text style={styles.rowImageOverlaySubtext} numberOfLines={1}>
                                {formatLastMessage(chat.lastMessage)}
                              </Text>
                            )}
                            {chat.lastMessageTime && (
                              <Text style={styles.rowImageOverlayTime}>
                                {chat.lastMessageTime}
                              </Text>
                            )}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </View>
        <Footer />
      </View>
      
      {/* Fixed Bottom Navigation */}
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadNotifications={unreadNotifications}
        unreadHints={unreadHints}
      />

      {/* Modal für Chat-Details */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedChat && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Chat-Details</Text>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={handleCloseModal}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Chat-Informationen */}
                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalChatName}>
                    {(() => {
                      const otherName = getOtherParticipantName(selectedChat);
                      const currentUser = getCurrentUser();
                      const currentUserId = currentUser?.uid;
                      
                      if (selectedChat.entryType === 'hint') {
                        if (selectedChat.hintType === 'trade-involved') {
                          if (selectedChat.fromUserId === currentUserId) {
                            if (selectedChat.status === 'accepted') return 'Tauschanfrage angenommen';
                            if (selectedChat.status === 'rejected') return 'Tauschanfrage abgelehnt';
                            return 'Tausch involviert';
                          }
                          return 'Tausch involviert';
                        } else if (selectedChat.hintType === 'trade-decision') {
                          if (selectedChat.toUserId === currentUserId) {
                            if (selectedChat.status === 'accepted') return 'Tauschanfrage angenommen';
                            if (selectedChat.status === 'rejected') return 'Tauschanfrage abgelehnt';
                            return `Tauschanfrage von ${otherName}`;
                          }
                          return `Tauschanfrage von ${otherName}`;
                        }
                        return `Tauschanfrage: ${otherName}`;
                      }
                      
                      const lastMessageFromMe = selectedChat.lastMessageSenderId && currentUserId && selectedChat.lastMessageSenderId === currentUserId;
                      if (selectedChat.type === 'trade') {
                        return `Tausch mit ${otherName}`;
                      }
                      return `Nachricht ${lastMessageFromMe ? 'an' : 'von'} ${otherName}`;
                    })()}
                  </Text>

                  {selectedChat.lastMessage && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>💬 Letzte Nachricht:</Text>
                      <Text style={styles.modalInfoText}>{selectedChat.lastMessage}</Text>
                    </View>
                  )}

                  {selectedChat.lastMessageTime && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>🕐 Zeit:</Text>
                      <Text style={styles.modalInfoText}>{selectedChat.lastMessageTime}</Text>
                    </View>
                  )}

                  {selectedChat.type && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>📋 Typ:</Text>
                      <Text style={styles.modalInfoText}>
                        {selectedChat.type === 'trade' ? 'Tausch-Chat' : 'Direkter Chat'}
                      </Text>
                    </View>
                  )}

                  {selectedChat.entryType === 'hint' && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>ℹ️ Hinweis-Typ:</Text>
                      <Text style={styles.modalInfoText}>
                        {selectedChat.hintType === 'trade-involved' ? 'Tausch involviert' : 
                         selectedChat.hintType === 'trade-decision' ? 'Entscheidungshinweis' : 
                         'Hinweis'}
                      </Text>
                    </View>
                  )}

                  {selectedChat.status && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>📊 Status:</Text>
                      <Text style={styles.modalInfoText}>
                        {selectedChat.status === 'accepted' ? 'Angenommen' :
                         selectedChat.status === 'rejected' ? 'Abgelehnt' :
                         selectedChat.status === 'requested' ? 'Angefragt' :
                         selectedChat.status === 'received' ? 'Empfangen' :
                         selectedChat.status}
                      </Text>
                    </View>
                  )}

                  {selectedChat.unreadCount > 0 && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>🔔 Ungelesen:</Text>
                      <Text style={styles.modalInfoText}>{selectedChat.unreadCount} Nachricht(en)</Text>
                    </View>
                  )}

                  {selectedChat.type === 'trade' && isTradeCompleted(selectedChat) && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>✓ Status:</Text>
                      <Text style={styles.modalInfoText}>Abgeschlossen</Text>
                    </View>
                  )}
                </ScrollView>

                {/* Modal Buttons */}
                <View style={styles.modalActions}>
                  {/* Für echte Chats: Öffnen-Button */}
                  {selectedChat.entryType === 'chat' && (
                    <TouchableOpacity 
                      style={styles.modalOpenButton}
                      onPress={() => {
                        handleCloseModal();
                        handleChatPress(selectedChat);
                      }}
                    >
                      <Text style={styles.modalOpenButtonText}>💬 Chat öffnen</Text>
                    </TouchableOpacity>
                  )}

                  {/* Für trade-decision Hinweise: Weinregal anschauen, Ablehnen-Button (nur für Person B) */}
                  {selectedChat.entryType === 'hint' && selectedChat.hintType === 'trade-decision' && (() => {
                    const currentUser = getCurrentUser();
                    const currentUserId = currentUser?.uid;
                    const isPersonB = selectedChat.toUserId === currentUserId && selectedChat.fromUserId !== currentUserId;
                    const canReject = selectedChat.status === 'requested' || selectedChat.status === 'received' || !selectedChat.status;
                    const otherName = getOtherParticipantName(selectedChat);
                    
                    return isPersonB && canReject ? (
                      <>
                        {/* Button: Weinregal anschauen */}
                        {selectedChat.tradeRequestId && selectedChat.fromUserId && (
                          <TouchableOpacity 
                            style={styles.modalViewCellarButton}
                            onPress={() => {
                              handleCloseModal();
                              onNavigate('mein-weinregal', { 
                                viewUserId: selectedChat.fromUserId, 
                                tradeRequestId: selectedChat.tradeRequestId 
                              });
                            }}
                          >
                            <Text style={styles.modalViewCellarButtonText}>
                              🍷 Weinregal von {otherName} anschauen
                            </Text>
                          </TouchableOpacity>
                        )}
                        
                        {/* Button: Angebot ablehnen */}
                        {onDeclineTradeRequest && (
                          <TouchableOpacity 
                            style={styles.modalDeclineButton}
                            onPress={() => {
                              Alert.alert(
                                'Angebot ablehnen',
                                'Möchten Sie diese Tauschanfrage wirklich ablehnen?',
                                [
                                  { text: 'Abbrechen', style: 'cancel' },
                                  { 
                                    text: 'Ablehnen', 
                                    style: 'destructive',
                                    onPress: () => {
                                      if (onDeclineTradeRequest && selectedChat.tradeRequestId) {
                                        onDeclineTradeRequest({ 
                                          requestId: selectedChat.tradeRequestId, 
                                          otherUserId: selectedChat.fromUserId 
                                        });
                                        handleCloseModal();
                                      }
                                    }
                                  }
                                ]
                              );
                            }}
                          >
                            <Text style={styles.modalDeclineButtonText}>❌ Angebot ablehnen</Text>
                          </TouchableOpacity>
                        )}
                      </>
                    ) : null;
                  })()}

                  {/* Löschen-Button für alle */}
                  <TouchableOpacity 
                    style={styles.modalDeleteButton}
                    onPress={() => {
                      Alert.alert(
                        'Chat löschen',
                        'Möchten Sie diesen Chat wirklich löschen?\n\nAlle Nachrichten werden unwiderruflich gelöscht.',
                        [
                          { text: 'Abbrechen', style: 'cancel' },
                          { 
                            text: 'Löschen', 
                            style: 'destructive', 
                            onPress: () => {
                              handleDeleteChat(selectedChat.id);
                              handleCloseModal();
                            }
                          }
                        ]
                      );
                    }}
                  >
                    <Text style={styles.modalDeleteButtonText}>🗑️ Löschen</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c2c', // Einheitlicher Hintergrund
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#2c2c2c', // Einheitlicher Hintergrund
  },
  logoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40, // 10px für iOS, damit StatusBar nicht verdeckt wird
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
  headerLeft: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wishlistButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wishlistHeart: {
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  greetingContainer: {
    // Hintergrund und Border entfernt für elegantes Design
  },
  greeting: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    includeFontPadding: false,
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
    paddingHorizontal: 0,
    paddingVertical: 0,
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
    color: '#2f3a3b',
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
    color: '#2f3a3b',
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#2f3a3b',
    textAlign: 'center',
    opacity: 0.8,
  },
  chatsList: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  chatRow: {
    width: '100%', // Volle Breite (doppelt so breit wie vorher)
    aspectRatio: 2, // Doppelte Breite = 2:1 Verhältnis (breiter als hoch)
    marginBottom: 20, // Mehr Abstand zwischen den Containern
    borderRadius: 20, // Mehr abgerundete Ecken für moderneres Design
    overflow: 'hidden', // Verhindert, dass Elemente außerhalb der Kachel erscheinen
    // Glassmorphism Effekt
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // Heller, transparenter Glass-Effekt
    borderWidth: 1.5, // Dünnere Border für klare, aber nicht dominante Abgrenzung
    borderColor: 'rgba(0, 0, 0, 0.7)', // Wird dynamisch überschrieben
    padding: 0, // Kein Padding innerhalb des Containers - Bild soll bis zum Rand gehen
    // Verbesserte Schatten für Tiefe
    shadowColor: '#a9c7cd', // Warmes Gold Schatten
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6, // Android Shadow
  },
  rowImageOnlyContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  wineImagesContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '60%', // Oberer Bereich für Weinbilder
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  wineImageWrapper: {
    flex: 1,
    height: '100%',
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  wineImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  wineImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  wineImagePlaceholderText: {
    fontSize: 11,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  tradeIconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(218, 165, 32, 0.2)',
    borderRadius: 20,
    marginHorizontal: 4,
  },
  tradeCompletedContainer: {
    width: '100%',
    height: '60%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
    borderRadius: 12,
    marginHorizontal: 8,
    marginVertical: 8,
  },
  tradeCompletedText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F44336',
    textAlign: 'center',
  },
  rowImageOnly: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  rowPlaceholderImageOnly: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(218, 165, 32, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(218, 165, 32, 0.3)',
  },
  placeholderTextOnly: {
    fontSize: 48,
    color: '#a9c7cd',
    opacity: 0.6,
  },
  unreadBadgeOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#F44336',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  unreadTextOverlay: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rowImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Helles Glassmorphism Overlay
    borderTopWidth: 1,
    borderTopColor: 'rgba(218, 165, 32, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 8,
    zIndex: 5,
  },
  rowImageOverlayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c2c2c', // Dunkler Text auf hellem Overlay
    marginBottom: 2,
  },
  rowImageOverlaySubtext: {
    fontSize: 12,
    color: '#4a4a4a',
    marginBottom: 2,
  },
  rowImageOverlayTime: {
    fontSize: 10,
    color: '#666666',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Helles Glassmorphism Modal
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(218, 165, 32, 0.5)',
    shadowColor: '#a9c7cd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(218, 165, 32, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.4)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(218, 165, 32, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.5)',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#2c2c2c',
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalChatName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalInfoRow: {
    marginBottom: 16,
  },
  modalInfoLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  modalInfoText: {
    fontSize: 16,
    color: '#4a4a4a',
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218, 165, 32, 0.3)',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalOpenButton: {
    flex: 1,
    backgroundColor: 'rgba(218, 165, 32, 0.5)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.7)',
    minWidth: 140,
  },
  modalOpenButtonText: {
    color: '#2c2c2c',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalViewCellarButton: {
    flex: 1,
    backgroundColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
    minWidth: 140,
  },
  modalViewCellarButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalDeclineButton: {
    flex: 1,
    backgroundColor: 'rgba(244, 67, 54, 0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F44336',
    minWidth: 140,
  },
  modalDeclineButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F44336',
    minWidth: 140,
  },
  modalDeleteButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  markAllReadButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  markAllReadButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  markAllReadButtonText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
});
