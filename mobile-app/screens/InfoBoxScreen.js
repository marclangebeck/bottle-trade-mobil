/**
 * PHASE 5: InfoBoxScreen - WhatsApp-ähnliche Liste aller Notifications
 * 
 * Zeigt alle Notifications in einer gemeinsamen Liste:
 * - Rot: hint-decision (EntscheidungsHinweis)
 * - Gelb: hint-small (Kleiner Hinweis)
 * - Grün: chat (Chat-Message)
 * - Blau: system (System-Nachricht)
 * 
 * Features:
 * - Swipe-to-Delete (archiviert Notification)
 * - Direkte Navigation zu ChatRoomScreen oder HinweisScreen
 * - Grau ausgrauen für abgeschlossene Einträge
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import OptimizedImage from '../components/OptimizedImage';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import { archiveNotification, markNotificationAsCompleted, markNotificationAsRead } from '../services/notificationService';
import { subscribeNotificationsForUser } from '../services/notificationService';
import { getCurrentUser } from '../services/testAuth';
import { getChat, getChatsForUser, getTradeRequest, deleteChat, getUser, createSupportChat } from '../services/database-web';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase-web';

// Hilfsfunktion für Initialen
const getInitials = (user) => {
  if (user?.firstName && user?.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  } else if (user?.username) {
    return user.username.substring(0, 2).toUpperCase();
  } else if (user?.email) {
    return user.email.substring(0, 2).toUpperCase();
  }
  return 'P';
};

export default function InfoBoxScreen({ onNavigate, onLogout = () => {}, notifications = [], chats = [], currentUserId, isLoggedIn = false, unreadCount = 0, onDeclineTradeRequest = null }) {
  // PHASE 5: Starte mit leerem Array - Subscription lädt alle Notifications (inklusive gelesene)
  const [allNotifications, setAllNotifications] = useState([]);
  const [combinedEntries, setCombinedEntries] = useState([]); // Kombiniert Notifications und Chats
  const [refreshing, setRefreshing] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [btp, setBtp] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [hintModalVisible, setHintModalVisible] = useState(false);
  const [selectedHintNotification, setSelectedHintNotification] = useState(null);
  const [hintDecisionModalVisible, setHintDecisionModalVisible] = useState(false);
  const [selectedHintDecisionNotification, setSelectedHintDecisionNotification] = useState(null);
  // WICHTIG: Refs für Swipeable-Komponenten (pro Notification-Eintrag)
  const swipeableRefs = useRef({});
  // WICHTIG: Track welche Notifications bereits beim Swipe gelöscht werden (verhindert doppelte Ausführung)
  const pendingArchiveActions = useRef(new Set());
  // WICHTIG: Track welche Einträge gerade gelöscht werden - diese werden nicht mehr als Swipeable gerendert
  const [deletingEntries, setDeletingEntries] = useState(new Set());
  // WICHTIG: Track welche Notifications bereits archiviert wurden (lokal)
  // Dies verhindert, dass archivierte Notifications wieder angezeigt werden, auch wenn die Subscription sie wieder lädt
  const archivedNotificationIdsRef = useRef(new Set());
  // WICHTIG: Verhindere Endlosschleife - tracke ob useEffect bereits läuft
  const isCombiningRef = useRef(false);
  // WICHTIG: Tracke letzte verarbeitete Daten, um unnötige Re-Runs zu vermeiden
  const lastProcessedDataRef = useRef({ notifications: null, chats: null, userId: null });

  // Debug: Log initial notifications
  useEffect(() => {
    console.log('🔄 InfoBoxScreen: Initial render, notifications prop:', notifications?.length || 0);
    if (notifications && notifications.length > 0) {
      console.log('🔄 InfoBoxScreen: Initial notifications (werden ignoriert, Subscription lädt alle):', notifications.map(n => ({
        id: n.id,
        type: n.type,
        title: n.title
      })));
    }
    // Setze BTP-Wert
    const currentUser = getCurrentUser();
    if (currentUser) {
      setBtp(currentUser?.btp ?? 0);
      loadProfileImage(currentUser.uid);
    }
  }, []);

  const loadProfileImage = async (userId) => {
    try {
      if (!userId) return;
      const userData = await getUser(userId);
      if (userData && userData.profilbild) {
        setProfileImage(userData.profilbild);
      } else {
        setProfileImage(null);
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden des Profilbildes:', error);
      setProfileImage(null);
    }
  };

  // Subscribe to notifications
  useEffect(() => {
    let userId = currentUserId;
    if (!userId) {
      const user = getCurrentUser();
      if (!user?.uid) {
        console.log('⚠️ InfoBoxScreen: Kein currentUserId verfügbar');
        return;
      }
      userId = user.uid;
    }

    console.log('🔄 InfoBoxScreen: Subscribe zu Notifications für User:', userId);
    console.log('🔄 InfoBoxScreen: Initial notifications prop:', notifications?.length || 0);

    const unsubscribe = subscribeNotificationsForUser(
      userId,
      (snapshot, filteredNotifications) => {
        console.log('📡 InfoBoxScreen: Notifications empfangen:', filteredNotifications?.length || 0);
        console.log('📡 InfoBoxScreen: Snapshot docs count:', snapshot?.docs?.length || 0);
        
        // WICHTIG: Debug: Zeige isArchived Status für alle Notifications
        const archivedCount = filteredNotifications?.filter(n => n.isArchived === true).length || 0;
        const undefinedArchivedCount = filteredNotifications?.filter(n => n.isArchived === undefined).length || 0;
        const withArchivedAt = filteredNotifications?.filter(n => n.archivedAt).length || 0;
        const locallyArchived = Array.from(archivedNotificationIdsRef.current).length;
        console.log('📡 InfoBoxScreen: Archivierungs-Status:', {
          total: filteredNotifications?.length || 0,
          archived: archivedCount,
          withArchivedAt: withArchivedAt,
          undefined: undefinedArchivedCount,
          notArchived: (filteredNotifications?.length || 0) - archivedCount - undefinedArchivedCount,
          locallyArchived: locallyArchived,
          locallyArchivedIds: Array.from(archivedNotificationIdsRef.current)
        });
        
        console.log('📡 InfoBoxScreen: Notifications Details:', filteredNotifications?.map(n => ({
          id: n.id,
          type: n.type,
          title: n.title,
          chatId: n.chatId,
          isRead: n.isRead,
          isArchived: n.isArchived,
          archivedAt: n.archivedAt,
          isLocallyArchived: archivedNotificationIdsRef.current.has(n.id)
        })));
        
        // WICHTIG: Wenn Firestore leer ist (snapshot.docs.length === 0), sollte auch filteredNotifications leer sein
        // Wenn nicht, gibt es ein Problem mit der Subscription
        if (snapshot && snapshot.docs && snapshot.docs.length === 0) {
          console.log('🗑️ InfoBoxScreen: Firestore ist leer (0 Notifications), setze allNotifications auf leeres Array');
          setAllNotifications([]);
          return; // Beende hier, keine weitere Verarbeitung nötig
        }
        
        // WICHTIG: Filtere archivierte Notifications zusätzlich heraus (doppelte Prüfung)
        // Auch wenn die Subscription sie mit includeArchived: false filtern sollte,
        // filtern wir hier nochmal, um sicherzustellen, dass archivierte Notifications nicht angezeigt werden
        // WICHTIG: Prüfe auch auf undefined/null, da einige Notifications möglicherweise kein isArchived-Feld haben
        const finalFiltered = (filteredNotifications || []).filter(n => {
          // WICHTIG: Prüfe zuerst, ob diese Notification bereits lokal als archiviert markiert wurde
          // Dies verhindert, dass archivierte Notifications wieder angezeigt werden, auch wenn die Subscription sie wieder lädt
          if (archivedNotificationIdsRef.current.has(n.id)) {
            console.log('🗑️ InfoBoxScreen: Filtere lokal archivierte Notification heraus:', {
              id: n.id,
              type: n.type,
              title: n.title
            });
            return false;
          }
          
          // WICHTIG: Prüfe explizit auf true (nicht nur truthy), da undefined/false auch herausgefiltert werden könnten
          if (n.isArchived === true) {
            console.log('🗑️ InfoBoxScreen: Filtere archivierte Notification heraus:', {
              id: n.id,
              type: n.type,
              title: n.title,
              isArchived: n.isArchived,
              archivedAt: n.archivedAt
            });
            // WICHTIG: Markiere auch lokal als archiviert, damit sie nicht wieder angezeigt wird
            archivedNotificationIdsRef.current.add(n.id);
            return false;
          }
          
          // WICHTIG: Prüfe auch, ob archivedAt gesetzt ist (als zusätzliche Sicherheit)
          // Wenn archivedAt gesetzt ist, sollte die Notification auch als archiviert behandelt werden
          if (n.archivedAt) {
            console.log('🗑️ InfoBoxScreen: Filtere Notification mit archivedAt heraus (als archiviert behandelt):', {
              id: n.id,
              type: n.type,
              title: n.title,
              isArchived: n.isArchived,
              archivedAt: n.archivedAt
            });
            // WICHTIG: Markiere auch lokal als archiviert, damit sie nicht wieder angezeigt wird
            archivedNotificationIdsRef.current.add(n.id);
            return false;
          }
          
          // WICHTIG: Filtere auch Notifications, die gerade gelöscht werden
          if (deletingEntries.has(n.id)) {
            console.log('🗑️ InfoBoxScreen: Filtere Notification heraus, die gerade gelöscht wird:', {
              id: n.id,
              type: n.type,
              title: n.title
            });
            return false;
          }
          
          // WICHTIG: Für Chat-Notifications: Prüfe, ob der Chat wirklich in Firestore existiert
          // Wenn nicht, sollte die Notification nicht angezeigt werden
          if ((n.type === 'chat' || n.type === 'message') && n.chatId) {
            // Prüfe asynchron, ob der Chat existiert
            // Da dies asynchron ist, können wir es nicht direkt hier filtern
            // Stattdessen: Markiere für spätere Prüfung
            // Die Prüfung wird in einem separaten useEffect durchgeführt
          }
          
          return true;
        });
        
        console.log('📡 InfoBoxScreen: Final gefilterte Notifications:', finalFiltered.length, '(von', filteredNotifications?.length || 0, ')');
        
        // WICHTIG: Prüfe für Chat-Notifications, ob der Chat wirklich in Firestore existiert
        // Filtere Notifications heraus, deren Chats nicht mehr existieren
        Promise.all(
          finalFiltered.map(async (notification) => {
            // Nur für Chat-Notifications prüfen
            if ((notification.type === 'chat' || notification.type === 'message') && notification.chatId) {
              try {
                const chatExists = await getChat(notification.chatId);
                if (!chatExists || !chatExists.id) {
                  console.log('🗑️ InfoBoxScreen: Chat für Notification existiert nicht in Firestore, filtere Notification heraus:', {
                    notificationId: notification.id,
                    chatId: notification.chatId,
                    title: notification.title
                  });
                  return null; // Chat existiert nicht, Notification nicht anzeigen
                }
              } catch (error) {
                console.error('❌ InfoBoxScreen: Fehler beim Prüfen der Chat-Existenz für Notification:', notification.id, error);
                // Bei Fehler: Notification nicht anzeigen (sicherer Ansatz)
                return null;
              }
            }
            return notification; // Notification behalten
          })
        ).then(validatedNotifications => {
          // Filtere null-Werte heraus
          const finalValidatedNotifications = validatedNotifications.filter(n => n !== null);
          
          console.log('📡 InfoBoxScreen: Final validierte Notifications:', finalValidatedNotifications.length, '(von', finalFiltered.length, ')');
          
          // Debug: Zeige vollständige Notification-Struktur für Chat-Notifications
          finalValidatedNotifications?.forEach(n => {
            if (n.type === 'chat') {
              console.log('📡 InfoBoxScreen: Chat-Notification vollständig:', {
                id: n.id,
                type: n.type,
                title: n.title,
                chatId: n.chatId,
                requestId: n.requestId,
                hasChatId: !!n.chatId,
                allKeys: Object.keys(n)
              });
            }
          });
          
          setAllNotifications(finalValidatedNotifications || []);
        }).catch(error => {
          console.error('❌ InfoBoxScreen: Fehler beim Validieren der Chat-Notifications:', error);
          // Bei Fehler: Zeige alle Notifications (sicherer Ansatz)
          setAllNotifications(finalFiltered || []);
        });
      },
      {
        includeRead: true, // Zeige auch gelesene (für abgeschlossene)
        includeArchived: false, // Keine archivierten
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUserId, notifications]);

  // WICHTIG: Kombiniere Notifications und Chats (WhatsApp-ähnlich)
  // Chats sollten immer angezeigt werden, auch wenn keine Notification existiert
  // ABER: Nur Chats, die wirklich in Firestore existieren
  useEffect(() => {
    // WICHTIG: Verhindere Endlosschleife - prüfe ob bereits eine Ausführung läuft
    if (isCombiningRef.current) {
      console.log('⚠️ InfoBoxScreen: Kombinieren läuft bereits, überspringe erneute Ausführung');
      return;
    }

    // WICHTIG: Prüfe ob sich die Daten wirklich geändert haben
    const notificationsChanged = JSON.stringify(allNotifications.map(n => n.id).sort()) !== 
                                  JSON.stringify(lastProcessedDataRef.current.notifications?.map(n => n.id).sort() || []);
    const chatsChanged = JSON.stringify(chats.map(c => c.id).sort()) !== 
                         JSON.stringify(lastProcessedDataRef.current.chats?.map(c => c.id).sort() || []);
    const userIdChanged = currentUserId !== lastProcessedDataRef.current.userId;

    if (!notificationsChanged && !chatsChanged && !userIdChanged) {
      console.log('⚠️ InfoBoxScreen: Daten haben sich nicht geändert, überspringe Kombinieren');
      return;
    }

    console.log('🔄 InfoBoxScreen: Kombiniere Notifications und Chats', {
      notificationsCount: allNotifications.length,
      chatsCount: chats.length,
      notificationsChanged,
      chatsChanged,
      userIdChanged
    });

    // Markiere als laufend
    isCombiningRef.current = true;

    // WICHTIG: Prüfe, welche Chats wirklich in Firestore existieren
    // Erstelle Chat-Entries nur für Chats, die existieren
    // WICHTIG: Filtere Hinweise (entryType: 'hint') heraus - diese werden nicht als Chat-Entries angezeigt
    // Hinweise werden separat über Notifications angezeigt
    const chatEntriesPromises = chats
      .filter(chat => {
        // WICHTIG: Filtere Hinweise heraus - diese haben keine participants und werden nicht als Chat-Entries angezeigt
        if (chat.entryType === 'hint') {
          return false; // Hinweise werden nicht als Chat-Entries angezeigt
        }
        
        // WICHTIG: Filtere Chats heraus, die vom aktuellen User gelöscht wurden
        // Diese sollten nicht mehr angezeigt werden
        const deletedBy = chat.deletedBy || [];
        const isDeletedByMe = Array.isArray(deletedBy) && deletedBy.includes(currentUserId);
        
        if (isDeletedByMe) {
          console.log('🔍 InfoBoxScreen: Filtere Chat, der vom aktuellen User gelöscht wurde:', chat.id);
          return false; // Entferne diesen Chat
        }
        
        return true; // Behalte diesen Chat
      })
      .map(async (chat) => {
        // WICHTIG: Prüfe, ob der Chat wirklich in Firestore existiert
        // Wenn nicht, sollte kein Chat-Entry erstellt werden
        try {
          const chatDoc = await getChat(chat.id);
          if (!chatDoc || !chatDoc.id) {
            console.log('🗑️ InfoBoxScreen: Chat existiert nicht in Firestore, überspringe Chat-Entry:', chat.id);
            return null; // Chat existiert nicht, kein Entry erstellen
          }
          // Chat existiert in Firestore, verwende die Daten aus Firestore (aktueller)
          // WICHTIG: Prüfe auch, ob der Chat vom aktuellen User gelöscht wurde
          const deletedBy = chatDoc.deletedBy || [];
          if (Array.isArray(deletedBy) && deletedBy.includes(currentUserId)) {
            console.log('🗑️ InfoBoxScreen: Chat wurde vom aktuellen User gelöscht, überspringe:', chat.id);
            return null; // Chat wurde vom aktuellen User gelöscht
          }
          return chatDoc;
        } catch (error) {
          console.error('❌ InfoBoxScreen: Fehler beim Prüfen der Chat-Existenz:', chat.id, error);
          // Bei Fehler: Chat nicht anzeigen (sicherer Ansatz)
          return null;
        }
      });
    
    // Warte auf alle Prüfungen
    Promise.all(chatEntriesPromises).then(validatedChats => {
      // Filtere null-Werte heraus (Chats, die nicht existieren)
      const existingChats = validatedChats.filter(chat => chat !== null);
      
      // Erstelle Chat-Entries aus existierenden Chats
      const chatEntries = existingChats.map(chat => {
        try {
          // Prüfe, ob es bereits eine Notification für diesen Chat gibt
          const existingNotification = allNotifications.find(n => 
            n.chatId === chat.id && n.type === 'chat'
          );

          if (existingNotification) {
            // Wenn es eine Notification gibt, verwende diese
            return null; // Wird von Notification abgedeckt
          }

          // WICHTIG: Prüfe, ob der Chat von einem anderen User gelöscht wurde
          // Wenn deletedBy andere User enthält (aber nicht den aktuellen User), ist der Chat "verlassen"
          const deletedBy = chat.deletedBy || [];
          const isDeletedByOthers = Array.isArray(deletedBy) && 
                                    deletedBy.length > 0 && 
                                    !deletedBy.includes(currentUserId);
          
          // WICHTIG: Stelle sicher, dass participants existiert und ein Array ist
          const participants = chat.participants || [];
          if (!Array.isArray(participants) || participants.length === 0) {
            console.warn('⚠️ InfoBoxScreen: Chat hat keine participants oder participants ist kein Array:', {
              chatId: chat.id,
              participants: chat.participants,
              entryType: chat.entryType
            });
            return null; // Überspringe diesen Chat, da er keine gültigen participants hat
          }
          
          const otherParticipantId = participants.find(pid => pid !== currentUserId);
          const otherParticipantIndex = participants.findIndex(pid => pid !== currentUserId);
          const otherParticipantName = chat.participantNames?.[otherParticipantIndex] || 'Unbekannt';

          return {
            id: `chat-${chat.id}`,
            type: 'chat',
            chatId: chat.id,
            title: isDeletedByOthers ? `${otherParticipantName} hat den Chat verlassen` : otherParticipantName,
            message: isDeletedByOthers ? 'Der andere Teilnehmer hat den Chat verlassen' : (chat.lastMessage || 'Keine Nachrichten'),
            createdAt: chat.updatedAt || chat.createdAt || new Date(),
            isRead: true, // Chat ohne Notification ist gelesen
            isCompleted: false,
            isArchived: false,
            isChatEntry: true, // Marker, dass dies ein Chat-Entry ist (keine echte Notification)
            isChatLeft: isDeletedByOthers, // Marker, dass der Chat verlassen wurde
            chat: chat // Vollständiges Chat-Objekt für Navigation
          };
        } catch (error) {
          console.error('❌ InfoBoxScreen: Fehler beim Erstellen des Chat-Entries:', {
            chatId: chat?.id,
            error: error.message,
            chat: chat
          });
          return null; // Überspringe diesen Chat bei Fehler
        }
      })
      .filter(entry => entry !== null); // Entferne null-Entries (werden von Notifications abgedeckt)

      // Kombiniere Notifications und Chat-Entries
      // WICHTIG: Entferne Duplikate basierend auf ID, um React Key-Fehler zu vermeiden
      const allEntries = [...allNotifications, ...chatEntries];
      const uniqueEntriesMap = new Map();
      
      // Füge Einträge hinzu, wobei Duplikate überschrieben werden (neueste gewinnt)
      // WICHTIG: Verwende eine eindeutige Kombination aus type, id und zusätzlichen Feldern
      allEntries.forEach((entry) => {
        if (entry && entry.id) {
          // Erstelle einen eindeutigen Key basierend auf Typ, ID und zusätzlichen Feldern
          // Dieser Key sollte identisch zum keyExtractor sein (ohne Index/Timestamp)
          let uniqueKey = `${entry.type || 'unknown'}-${entry.id}`;
          
          // Für Newsletter-Notifications: Füge newsletterId hinzu
          if (entry.newsletterId) {
            uniqueKey += `-newsletter-${entry.newsletterId}`;
          }
          
          // Für Chat-Entries: Füge chatId hinzu
          if (entry.chatId) {
            uniqueKey += `-chat-${entry.chatId}`;
          }
          
          // Für Survey-Notifications: Füge surveyId hinzu
          if (entry.surveyId) {
            uniqueKey += `-survey-${entry.surveyId}`;
          }
          
          // Für System-Messages: Füge systemMessageId hinzu
          if (entry.systemMessageId) {
            uniqueKey += `-system-${entry.systemMessageId}`;
          }
          
          // Für Chat-Entries: Füge isChatEntry Marker hinzu
          if (entry.isChatEntry) {
            uniqueKey += `-chatEntry`;
          }
          
          const existing = uniqueEntriesMap.get(uniqueKey);
          if (!existing) {
            uniqueEntriesMap.set(uniqueKey, entry);
          } else {
            // Wenn Duplikat gefunden, behalte den neueren (basierend auf createdAt)
            const existingDate = existing.createdAt?.toDate ? existing.createdAt.toDate() : new Date(existing.createdAt || 0);
            const newDate = entry.createdAt?.toDate ? entry.createdAt.toDate() : new Date(entry.createdAt || 0);
            if (newDate > existingDate) {
              uniqueEntriesMap.set(uniqueKey, entry);
              console.warn('⚠️ InfoBoxScreen: Duplikat gefunden und überschrieben:', uniqueKey);
            } else {
              console.warn('⚠️ InfoBoxScreen: Duplikat gefunden, behalte bestehenden:', uniqueKey);
            }
          }
        }
      });
      
      const combined = Array.from(uniqueEntriesMap.values());

    // Sortiere nach createdAt (neueste zuerst)
    combined.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });

      console.log('✅ InfoBoxScreen: Kombinierte Einträge:', {
        total: combined.length,
        notifications: allNotifications.length,
        chatEntries: chatEntries.length,
        chatDeletedByOthers: chatEntries.filter(e => e.isChatLeft).length,
        validatedChatsCount: existingChats.length,
        originalChatsCount: chats.length
      });

      // WICHTIG: Debug: Zeige Details für Chats mit deletedBy
      existingChats.forEach(chat => {
        if (chat.deletedBy && Array.isArray(chat.deletedBy) && chat.deletedBy.length > 0) {
          console.log('🔍 InfoBoxScreen: Chat mit deletedBy:', {
            chatId: chat.id,
            deletedBy: chat.deletedBy,
            currentUserId,
            isDeletedByOthers: chat.deletedBy.length > 0 && !chat.deletedBy.includes(currentUserId),
            isDeletedByMe: chat.deletedBy.includes(currentUserId)
          });
        }
      });

      // WICHTIG: Aktualisiere letzte verarbeitete Daten
      lastProcessedDataRef.current = {
        notifications: allNotifications.map(n => ({ id: n.id })),
        chats: chats.map(c => ({ id: c.id })),
        userId: currentUserId
      };
      
      setCombinedEntries(combined);
      
      // WICHTIG: Markiere als abgeschlossen
      isCombiningRef.current = false;
    }).catch(error => {
      console.error('❌ InfoBoxScreen: Fehler beim Validieren der Chats:', error);
      // Bei Fehler: Zeige nur Notifications, keine Chat-Entries
      const combined = [...allNotifications];
      combined.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      // WICHTIG: Aktualisiere letzte verarbeitete Daten auch bei Fehler
      lastProcessedDataRef.current = {
        notifications: allNotifications.map(n => ({ id: n.id })),
        chats: chats.map(c => ({ id: c.id })),
        userId: currentUserId
      };
      
      setCombinedEntries(combined);
      
      // WICHTIG: Markiere als abgeschlossen auch bei Fehler
      isCombiningRef.current = false;
    });
    }, [allNotifications, chats, currentUserId]);

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffTime = now - date;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
      } else if (diffDays === 1) {
        return 'Gestern';
      } else if (diffDays < 7) {
        return date.toLocaleDateString('de-DE', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
      }
    } catch (error) {
      return '';
    }
  };

  // Get color for notification type
  const getNotificationColor = (type, priority = null) => {
    switch (type) {
      case 'hint-decision':
        return '#F44336'; // Rot
      case 'hint-small':
        return '#FFC107'; // Gelb
      case 'chat':
        return '#4CAF50'; // Grün
      case 'survey':
        return '#FF9800'; // Orange
      case 'newsletter':
        return '#2196F3'; // Blau
      case 'system':
        // System-Ankündigungen: Farbe basierend auf Priorität
        if (priority === 'urgent') return '#F44336'; // Rot
        if (priority === 'high') return '#FFC107'; // Gelb
        return '#2196F3'; // Blau (normal/low)
      default:
        return '#757575'; // Grau
    }
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'hint-decision':
        return '⚡';
      case 'hint-small':
        return '💡';
      case 'chat':
        return '💬';
      case 'survey':
        return '📊';
      case 'newsletter':
        return '📧';
      case 'system':
        return '📢';
      default:
        return '📄';
    }
  };

  // Get readable label for notification type
  const getNotificationTypeLabel = (type) => {
    switch (type) {
      case 'chat':
      case 'message':
        return 'Chat';
      case 'system':
        return 'Systemnachricht';
      case 'newsletter':
        return 'Newsletter';
      case 'survey':
        return 'Umfrage';
      case 'hint-decision':
      case 'hint-small':
        return 'Hinweis';
      default:
        return 'Nachricht';
    }
  };

  // Handle notification press
  const handleNotificationPress = async (notification) => {
    if (notification.isCompleted) {
      // Abgeschlossene Notifications können nicht mehr geöffnet werden
      return;
    }

    try {
      // WICHTIG: Wenn es ein Chat-Entry ist (keine echte Notification), verwende das Chat-Objekt direkt
      if (notification.isChatEntry && notification.chat) {
        console.log('🔄 InfoBoxScreen: Öffne Chat-Entry (ohne Notification):', {
          chatId: notification.chat.id,
          title: notification.title
        });
        
        if (onNavigate) {
          onNavigate('chat-room', { chat: notification.chat });
        }
        return;
      }

      if (notification.type === 'chat' && notification.chatId) {
        console.log('🔄 InfoBoxScreen: Öffne Chat-Notification:', {
          chatId: notification.chatId,
          title: notification.title,
          notificationId: notification.id
        });
        
        // Versuche Chat-Objekt direkt aus Firestore zu laden
        let chat = await getChat(notification.chatId);
        
        // Fallback 1: Wenn Chat nicht gefunden wurde, prüfe zuerst im chats-Prop
        // (kann bei Timing-Problemen helfen, wenn Chat gerade erst erstellt wurde)
        if (!chat) {
          console.log('⚠️ InfoBoxScreen: Chat nicht sofort gefunden, suche in chats-Prop:', notification.chatId);
          chat = chats.find(c => c.id === notification.chatId);
          if (chat) {
            console.log('✅ InfoBoxScreen: Chat in chats-Prop gefunden:', notification.chatId);
          } else {
            console.log('⚠️ InfoBoxScreen: Chat nicht in chats-Prop, warte 500ms und versuche erneut...');
            await new Promise(resolve => setTimeout(resolve, 500));
            chat = await getChat(notification.chatId);
          }
        }
        
        // Fallback 2: Wenn Chat immer noch nicht gefunden wurde und requestId vorhanden ist,
        // lade alle Chats des Users und suche nach Chat mit passender requestId
        if (!chat && notification.requestId) {
          console.log('⚠️ InfoBoxScreen: Chat nicht gefunden, versuche über requestId zu finden:', notification.requestId);
          try {
            const userId = currentUserId || getCurrentUser()?.uid;
            if (userId) {
              // Versuche zuerst, den Trade-Request zu laden, um die korrekte tradeRequestId zu finden
              let tradeRequest = null;
              try {
                tradeRequest = await getTradeRequest(notification.requestId);
                console.log('🔄 InfoBoxScreen: Trade-Request geladen:', tradeRequest ? { id: tradeRequest.id, status: tradeRequest.status } : 'nicht gefunden');
              } catch (error) {
                console.log('⚠️ InfoBoxScreen: Trade-Request konnte nicht geladen werden:', error.message);
              }
              
              const allChats = await getChatsForUser(userId);
              
              // Suche Chat mit passender requestId, tradeRequestId oder der ID aus dem Trade-Request
              chat = allChats.find(c => {
                // Direkter Match mit requestId
                if (c.requestId === notification.requestId || c.tradeRequestId === notification.requestId) {
                  return true;
                }
                // Match über Trade-Request (wenn Trade-Request geladen wurde)
                if (tradeRequest && (c.tradeRequestId === tradeRequest.id || c.requestId === tradeRequest.id)) {
                  return true;
                }
                // Fallback: Match mit chatId
                if (c.id === notification.chatId) {
                  return true;
                }
                return false;
              });
              
              if (chat) {
                console.log('✅ InfoBoxScreen: Chat über requestId/tradeRequest gefunden:', chat.id);
              } else {
                console.log('⚠️ InfoBoxScreen: Chat auch über requestId nicht gefunden. Gefundene Chats:', allChats.map(c => ({ id: c.id, requestId: c.requestId, tradeRequestId: c.tradeRequestId })));
                console.log('⚠️ InfoBoxScreen: Trade-Request Info:', tradeRequest ? { id: tradeRequest.id, status: tradeRequest.status } : 'nicht verfügbar');
              }
            }
          } catch (error) {
            console.error('❌ InfoBoxScreen: Fehler beim Laden der Chats über requestId:', error);
          }
        }
        
        if (chat && onNavigate) {
          console.log('✅ InfoBoxScreen: Chat gefunden, navigiere zum ChatRoomScreen:', chat.id);
          // Navigiere direkt zum ChatRoomScreen mit dem vollständigen Chat-Objekt
          onNavigate('chat-room', { chat });
        } else {
          console.error('❌ InfoBoxScreen: Chat nicht gefunden nach allen Versuchen:', {
            chatId: notification.chatId,
            requestId: notification.requestId,
            chatExists: !!chat,
            notificationId: notification.id
          });
          
          // Versuche, zur Chat-Liste zu navigieren, damit der User den Chat dort findet
          Alert.alert(
            'Chat nicht gefunden', 
            'Der Chat konnte nicht geöffnet werden. Möglicherweise wurde er gelöscht oder ist noch nicht verfügbar.\n\nSie werden zur Chat-Liste weitergeleitet.',
            [
              {
                text: 'Zur Chat-Liste',
                onPress: () => {
                  if (onNavigate) {
                    onNavigate('infobox');
                  }
                }
              },
              {
                text: 'Abbrechen',
                style: 'cancel'
              }
            ]
          );
        }
      } else if (notification.type === 'chat' && !notification.chatId) {
        // Chat-Notification ohne chatId - sollte nicht passieren, aber behandeln
        console.error('❌ InfoBoxScreen: Chat-Notification ohne chatId:', notification);
        Alert.alert('Fehler', 'Die Notification hat keine Chat-ID. Bitte wenden Sie sich an den Support.');
      } else if (notification.type === 'hint-small' && notification.requestId) {
        // Öffne Modal für hint-small Notifications (z.B. "Tausch involviert")
        console.log('ℹ️ InfoBoxScreen: hint-small Notification angeklickt - öffne Modal');
        setSelectedHintNotification(notification);
        setHintModalVisible(true);
      } else if (notification.type === 'hint-decision' && notification.requestId) {
        // Öffne Modal für hint-decision Notifications (Person B hat Tauschanfrage von Person A erhalten)
        console.log('ℹ️ InfoBoxScreen: hint-decision Notification angeklickt - öffne Modal für Entscheidung');
        setSelectedHintDecisionNotification(notification);
        setHintDecisionModalVisible(true);
      } else if (notification.type === 'survey') {
        // Umfrage - navigiere zu SurveyAnswerScreen
        const userId = currentUserId || getCurrentUser()?.uid;
        if (userId && notification.id) {
          try {
            await markNotificationAsRead(userId, notification.id);
            console.log('✅ InfoBoxScreen: Survey-Notification als gelesen markiert:', notification.id);
          } catch (error) {
            console.error('⚠️ InfoBoxScreen: Fehler beim Markieren als gelesen (fortsetzen trotzdem):', error);
          }
        }
        if (onNavigate && notification.surveyId) {
          onNavigate('survey-answer', { surveyId: notification.surveyId });
        }
      } else if (notification.type === 'newsletter') {
        // Newsletter - navigiere zu NewsletterReaderScreen
        const userId = currentUserId || getCurrentUser()?.uid;
        if (userId && notification.id) {
          try {
            await markNotificationAsRead(userId, notification.id);
            console.log('✅ InfoBoxScreen: Newsletter-Notification als gelesen markiert:', notification.id);
          } catch (error) {
            console.error('⚠️ InfoBoxScreen: Fehler beim Markieren als gelesen (fortsetzen trotzdem):', error);
          }
        }
        if (onNavigate && notification.newsletterId) {
          onNavigate('newsletter-reader', { newsletterId: notification.newsletterId });
        }
      } else if (notification.type === 'system') {
        // System-Ankündigung - navigiere zu SystemMessageReaderScreen
        const userId = currentUserId || getCurrentUser()?.uid;
        if (userId && notification.id) {
          try {
            await markNotificationAsRead(userId, notification.id);
            console.log('✅ InfoBoxScreen: System-Notification als gelesen markiert:', notification.id);
          } catch (error) {
            console.error('⚠️ InfoBoxScreen: Fehler beim Markieren als gelesen (fortsetzen trotzdem):', error);
          }
        }
        if (onNavigate && notification.systemMessageId) {
          onNavigate('system-message-reader', { messageId: notification.systemMessageId });
        } else {
          // Fallback: Zeige Alert (für alte System-Notifications ohne systemMessageId)
          Alert.alert(notification.title || 'System-Nachricht', notification.message);
        }
      }
    } catch (error) {
      console.error('❌ InfoBoxScreen: Fehler beim Öffnen der Notification:', {
        error: error.message,
        errorStack: error.stack,
        notification: {
          id: notification.id,
          type: notification.type,
          chatId: notification.chatId,
          title: notification.title
        }
      });
      Alert.alert('Fehler', 'Die Notification konnte nicht geöffnet werden. Bitte versuchen Sie es später erneut.');
    }
  };

  // Handle OK-Button im Hint-Modal
  const handleHintModalOK = async () => {
    if (!selectedHintNotification) return;
    
    try {
      const userId = currentUserId || getCurrentUser()?.uid;
      if (!userId || !selectedHintNotification.id) {
        console.error('❌ InfoBoxScreen: Kein User oder Notification-ID für Markieren als gelesen');
        return;
      }

      console.log('🔄 InfoBoxScreen: Markiere hint-small Notification als gelesen:', selectedHintNotification.id);
      
      // Markiere Notification als gelesen
      await markNotificationAsRead(userId, selectedHintNotification.id);
      console.log('✅ InfoBoxScreen: hint-small Notification als gelesen markiert');
      
      // Schließe Modal
      setHintModalVisible(false);
      setSelectedHintNotification(null);
    } catch (error) {
      console.error('❌ InfoBoxScreen: Fehler beim Markieren der Notification als gelesen:', error);
      Alert.alert('Fehler', 'Die Notification konnte nicht als gelesen markiert werden.');
    }
  };

  // Handle swipe to delete (archive)
  const handleArchive = async (notification) => {
    // WICHTIG: Verhindere doppelte Ausführung
    if (pendingArchiveActions.current.has(notification.id)) {
      console.log('⚠️ InfoBoxScreen: Archive-Action für', notification.id, 'wird bereits ausgeführt, überspringe');
      return;
    }
    
    try {
      pendingArchiveActions.current.add(notification.id);
      
      const userId = currentUserId || getCurrentUser()?.uid;
      if (!userId) {
        pendingArchiveActions.current.delete(notification.id);
        return;
      }

      // WICHTIG: Chat-Entries sind synthetische Objekte (keine echten Notifications)
      // Sie müssen durch Löschen des Chats selbst "archiviert" werden
      if (notification.isChatEntry && notification.chatId) {
        console.log('🔄 InfoBoxScreen: Lösche Chat-Entry (Chat wird als gelöscht markiert):', notification.chatId);
        
        try {
          // WICHTIG: Wenn der Chat bereits von anderen verlassen wurde (isChatLeft),
          // kann er direkt gelöscht werden (auch wenn der andere User ihn noch nicht gelöscht hat)
          // Das bedeutet, beide User können den Chat im ersten Versuch löschen
          await deleteChat(notification.chatId, userId);
          console.log('✅ Chat als gelöscht markiert:', notification.chatId);
          
          // WICHTIG: Entferne Chat sofort aus combinedEntries (nicht warten auf Subscription)
          // Das verhindert, dass der Chat weiterhin angezeigt wird, nachdem der aktuelle User ihn gelöscht hat
          // Der Chat wird automatisch aus der Liste entfernt, da getChatsForUser gelöschte Chats filtert
          // WICHTIG: Entferne sofort synchron, um zu verhindern, dass Swipeable sich öffnet
          // WICHTIG: Markiere auch in deletingEntries, damit Swipeable nicht gerendert wird
          setDeletingEntries(prev => new Set([...prev, notification.id]));
          setCombinedEntries(prevEntries => {
            const filtered = prevEntries.filter(entry => {
              if (entry.chatId === notification.chatId && entry.isChatEntry) {
                console.log('🗑️ InfoBoxScreen: Entferne Chat-Entry sofort:', notification.chatId);
                return false; // Entferne diesen Chat-Entry, da er vom aktuellen User gelöscht wurde
              }
              return true;
            });
            console.log('✅ InfoBoxScreen: Chat-Eintrag entfernt, verbleibende Einträge:', filtered.length);
            return filtered;
          });
          
          // Auch aus Chats-Prop entfernen (falls vorhanden)
          // Der Chat wird automatisch aus der Liste entfernt, da getChatsForUser gelöschte Chats filtert
        } catch (error) {
          console.error('❌ Fehler beim Löschen des Chats:', error);
          Alert.alert('Fehler', 'Chat konnte nicht gelöscht werden');
        }
        return;
      }

      // Normale Notification archivieren
      console.log('🔄 InfoBoxScreen: Starte Archivierung für Notification:', notification.id);
      console.log('🔄 InfoBoxScreen: Notification vor Archivierung:', {
        id: notification.id,
        type: notification.type,
        isArchived: notification.isArchived,
        archivedAt: notification.archivedAt
      });
      
      // WICHTIG: Markiere sofort lokal als archiviert, damit sie nicht wieder angezeigt wird
      // Dies verhindert, dass die Notification wieder erscheint, auch wenn die Subscription sie wieder lädt
      archivedNotificationIdsRef.current.add(notification.id);
      
      try {
        await archiveNotification(userId, notification.id);
        console.log('✅ InfoBoxScreen: Notification erfolgreich archiviert:', notification.id);
        
        // WICHTIG: Warte kurz, damit Firestore die Änderung verarbeitet hat
        // Dann prüfe, ob isArchived korrekt gesetzt wurde
        setTimeout(async () => {
          try {
            // Prüfe, ob die Notification jetzt als archiviert markiert ist
            const notificationDoc = await getDoc(doc(db, 'users', userId, 'notifications', notification.id));
            if (notificationDoc.exists()) {
              const data = notificationDoc.data();
              console.log('🔍 InfoBoxScreen: Notification nach Archivierung in Firestore:', {
                id: notification.id,
                isArchived: data.isArchived,
                archivedAt: data.archivedAt
              });
              
              if (data.isArchived !== true) {
                console.error('❌ KRITISCH: Notification wurde nicht korrekt als archiviert markiert!', {
                  id: notification.id,
                  isArchived: data.isArchived,
                  expected: true
                });
                // WICHTIG: Versuche erneut zu archivieren, falls es fehlgeschlagen ist
                try {
                  await archiveNotification(userId, notification.id);
                  console.log('✅ InfoBoxScreen: Notification erneut archiviert:', notification.id);
                } catch (retryError) {
                  console.error('❌ InfoBoxScreen: Fehler beim erneuten Archivieren:', retryError);
                }
              }
            }
          } catch (checkError) {
            console.error('❌ InfoBoxScreen: Fehler beim Prüfen der archivierten Notification:', checkError);
          }
        }, 1000); // Warte 1 Sekunde, damit Firestore die Änderung verarbeitet hat
      } catch (archiveError) {
        console.error('❌ InfoBoxScreen: Fehler beim Archivieren der Notification:', archiveError);
        // Auch bei Fehler aus combinedEntries entfernen, damit sie nicht wieder erscheint
        // Die Notification bleibt in Firestore, aber wird nicht mehr angezeigt
        // WICHTIG: Behalte die lokale Markierung als archiviert, auch bei Fehler
      }
      
      // WICHTIG: Entferne auch normale Notifications sofort aus combinedEntries
      // Das verhindert, dass sie sofort wieder angezeigt wird, auch wenn die Subscription noch nicht aktualisiert wurde
      setDeletingEntries(prev => new Set([...prev, notification.id]));
      setCombinedEntries(prevEntries => {
        const filtered = prevEntries.filter(entry => entry.id !== notification.id);
        console.log('🗑️ InfoBoxScreen: Entferne archivierte Notification aus combinedEntries:', {
          notificationId: notification.id,
          vorher: prevEntries.length,
          nachher: filtered.length
        });
        return filtered;
      });
    } catch (error) {
      console.error('❌ Fehler beim Archivieren der Notification:', error);
      Alert.alert('Fehler', 'Notification konnte nicht archiviert werden');
    } finally {
      // WICHTIG: Entferne aus pending-Actions, damit die Action erneut ausgeführt werden kann (falls nötig)
      pendingArchiveActions.current.delete(notification.id);
      // WICHTIG: Entferne auch aus deletingEntries nach Abschluss (auch bei Fehler)
      setDeletingEntries(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
    }
  };

  // Handle mark as completed
  const handleMarkAsCompleted = async (notification) => {
    try {
      const userId = currentUserId || getCurrentUser()?.uid;
      if (!userId) return;

      // WICHTIG: Chat-Entries sind synthetische Objekte (keine echten Notifications)
      // Für Chat-Entries wird der Chat als gelöscht markiert (wie beim Archivieren)
      if (notification.isChatEntry && notification.chatId) {
        console.log('🔄 InfoBoxScreen: Markiere Chat-Entry als abgeschlossen (Chat wird als gelöscht markiert):', notification.chatId);
        
        try {
          await deleteChat(notification.chatId, userId);
          console.log('✅ Chat als gelöscht markiert:', notification.chatId);
        } catch (error) {
          console.error('❌ Fehler beim Löschen des Chats:', error);
          Alert.alert('Fehler', 'Chat konnte nicht gelöscht werden');
        }
        return;
      }

      // Normale Notification als abgeschlossen markieren
      await markNotificationAsCompleted(userId, notification.id);
      console.log('✅ Notification als abgeschlossen markiert:', notification.id);
    } catch (error) {
      console.error('❌ Fehler beim Markieren der Notification als abgeschlossen:', error);
      Alert.alert('Fehler', 'Notification konnte nicht als abgeschlossen markiert werden');
    }
  };

  // Handle Weinregal ansehen für hint-decision Notification
  const handleViewWineCollection = async () => {
    if (!selectedHintDecisionNotification) return;
    
    try {
      const notification = selectedHintDecisionNotification;
      const fromUserId = notification.fromUserId;
      const requestId = notification.requestId;
      
      if (!fromUserId || !requestId) {
        console.error('❌ InfoBoxScreen: Keine fromUserId oder requestId in hint-decision Notification');
        Alert.alert('Fehler', 'Die Tauschanfrage konnte nicht geöffnet werden.');
        return;
      }

      console.log('🔄 InfoBoxScreen: Öffne Weinregal von Person A:', { fromUserId, requestId });
      
      // Markiere Notification als gelesen
      const userId = currentUserId || getCurrentUser()?.uid;
      if (userId && notification.id) {
        try {
          await markNotificationAsRead(userId, notification.id);
          console.log('✅ InfoBoxScreen: hint-decision Notification als gelesen markiert');
        } catch (error) {
          console.error('⚠️ InfoBoxScreen: Fehler beim Markieren als gelesen (fortsetzen trotzdem):', error);
        }
      }
      
      // Schließe Modal
      setHintDecisionModalVisible(false);
      setSelectedHintDecisionNotification(null);
      
      // Navigiere zum Weinregal von Person A
      if (onNavigate) {
        onNavigate('mein-weinregal', { viewUserId: fromUserId, tradeRequestId: requestId });
      }
    } catch (error) {
      console.error('❌ InfoBoxScreen: Fehler beim Öffnen des Weinregals:', error);
      Alert.alert('Fehler', 'Das Weinregal konnte nicht geöffnet werden.');
    }
  };

  // Handle Ablehnen für hint-decision Notification
  const handleDeclineTradeRequest = async () => {
    if (!selectedHintDecisionNotification || !onDeclineTradeRequest) {
      Alert.alert('Fehler', 'Die Tauschanfrage konnte nicht abgelehnt werden.');
      return;
    }
    
    try {
      const notification = selectedHintDecisionNotification;
      const requestId = notification.requestId;
      const fromUserId = notification.fromUserId;
      
      if (!requestId || !fromUserId) {
        console.error('❌ InfoBoxScreen: Keine requestId oder fromUserId in hint-decision Notification');
        Alert.alert('Fehler', 'Die Tauschanfrage konnte nicht abgelehnt werden.');
        return;
      }

      // Zeige Bestätigungsdialog
      Alert.alert(
        'Angebot ablehnen',
        'Möchten Sie diese Tauschanfrage wirklich ablehnen?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          {
            text: 'Ablehnen',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🔄 InfoBoxScreen: Lehne Tauschanfrage ab:', { requestId, fromUserId });
                
                // Rufe Decline-Funktion auf
                await onDeclineTradeRequest({
                  requestId: requestId,
                  otherUserId: fromUserId
                });
                
                // Markiere Notification als gelesen
                const userId = currentUserId || getCurrentUser()?.uid;
                if (userId && notification.id) {
                  try {
                    await markNotificationAsRead(userId, notification.id);
                    console.log('✅ InfoBoxScreen: hint-decision Notification als gelesen markiert nach Ablehnung');
                  } catch (error) {
                    console.error('⚠️ InfoBoxScreen: Fehler beim Markieren als gelesen (fortsetzen trotzdem):', error);
                  }
                }
                
                // Schließe Modal
                setHintDecisionModalVisible(false);
                setSelectedHintDecisionNotification(null);
                
                console.log('✅ InfoBoxScreen: Tauschanfrage abgelehnt');
              } catch (error) {
                console.error('❌ InfoBoxScreen: Fehler beim Ablehnen der Tauschanfrage:', error);
                Alert.alert('Fehler', 'Die Tauschanfrage konnte nicht abgelehnt werden.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ InfoBoxScreen: Fehler beim Ablehnen der Tauschanfrage:', error);
      Alert.alert('Fehler', 'Die Tauschanfrage konnte nicht abgelehnt werden.');
    }
  };

  // Render swipe actions
  const renderRightActions = (notification, swipeableRef) => {
    // WICHTIG: Alle Einträge (auch Chat-Entries) können jetzt gelöscht/archiviert werden
    // Chat-Entries werden durch Löschen des Chats selbst "archiviert"
    return (
      <View style={styles.swipeActions}>
        {!notification.isCompleted && (
          <TouchableOpacity
            style={[styles.swipeAction, styles.swipeActionComplete]}
            onPress={async () => {
              await handleMarkAsCompleted(notification);
              // WICHTIG: Schließe Swipeable sofort nach der Action, damit nur 1x geswiped werden muss
              if (swipeableRef?.current) {
                swipeableRef.current.close();
              }
            }}
          >
            <Text style={styles.swipeActionText}>✓</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.swipeAction, styles.swipeActionDelete]}
          activeOpacity={0.7}
          onPress={() => {
            // WICHTIG: Schließe Swipeable SOFORT, bevor die Action ausgeführt wird
            // Das verhindert, dass der User ein zweites Mal swipen muss
            // WICHTIG: close() synchron aufrufen, nicht in setTimeout
            if (swipeableRef?.current) {
              swipeableRef.current.close();
            }
            // Führe Action SOFORT aus (ohne await, damit Swipeable sofort geschlossen wird)
            handleArchive(notification).catch(error => {
              console.error('❌ Fehler beim Archivieren:', error);
            });
          }}
        >
          <Text style={styles.swipeActionText}>🗑️</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render notification item
  const renderNotificationItem = ({ item: notification }) => {
    const color = getNotificationColor(notification.type, notification.priority);
    const icon = getNotificationIcon(notification.type);
    const isCompleted = notification.isCompleted;
    const isRead = notification.isRead;

    // WICHTIG: Wenn Eintrag gerade gelöscht wird, rendere nichts (wird sofort entfernt)
    if (deletingEntries.has(notification.id)) {
      return null;
    }

    // WICHTIG: Verwende ein Ref-Dictionary, damit jeder Notification-Eintrag sein eigenes Ref hat
    // Erstelle Ref nur einmal pro Notification-ID
    if (!swipeableRefs.current[notification.id]) {
      swipeableRefs.current[notification.id] = { current: null };
    }
    const swipeableRef = swipeableRefs.current[notification.id];

    return (
      <Swipeable 
        ref={swipeableRef}
        renderRightActions={() => {
          // WICHTIG: Render unsichtbaren Touchable-Bereich, der direkt die Action auslöst
          // Die Action wird direkt beim Swipe ausgelöst, ohne dass Buttons sichtbar werden
          return (
            <TouchableOpacity
              style={{ 
                width: 80, 
                backgroundColor: 'transparent',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              activeOpacity={1}
              onPress={() => {
                // Wird nicht aufgerufen, da die Action bereits in onSwipeableOpen ausgelöst wird
                // Dies ist nur als Fallback gedacht
                if (swipeableRef?.current) {
                  swipeableRef.current.close();
                }
              }}
            >
              <View style={{ width: 0 }} />
            </TouchableOpacity>
          );
        }}
        rightThreshold={40}
        overshootRight={false}
        friction={1}
        onSwipeableWillOpen={(direction) => {
          // WICHTIG: Führe Action direkt BEVOR das Swipeable sich öffnet
          // Das verhindert, dass Buttons überhaupt gerendert werden
          if (direction === 'right') {
            // Prüfe, ob bereits eine Action ausgeführt wird
            if (pendingArchiveActions.current.has(notification.id)) {
              console.log('⚠️ InfoBoxScreen: Archive-Action für', notification.id, 'wird bereits ausgeführt, überspringe');
              return;
            }
            
            // Prüfe, ob Eintrag bereits gelöscht wird
            if (deletingEntries.has(notification.id)) {
              console.log('⚠️ InfoBoxScreen: Eintrag', notification.id, 'wird bereits gelöscht, überspringe');
              return;
            }
            
            console.log('🔄 InfoBoxScreen: Swipeable wird geöffnet, löse Action SOFORT aus:', notification.id);
            
            // WICHTIG: handleArchive fügt die ID selbst zu pendingArchiveActions hinzu (Zeile 654)
            // Daher hier NICHT hinzufügen, sonst wird handleArchive sofort zurückkehren (Zeile 648)
            
            // WICHTIG: Markiere Eintrag als "wird gelöscht" - verhindert weiteres Rendering
            setDeletingEntries(prev => new Set([...prev, notification.id]));
            
            // WICHTIG: Entferne Eintrag SOFORT aus combinedEntries (synchron)
            // Das verhindert, dass er wieder erscheint, auch wenn die Subscription noch nicht aktualisiert wurde
            setCombinedEntries(prevEntries => {
              const filtered = prevEntries.filter(entry => entry.id !== notification.id);
              console.log('🗑️ InfoBoxScreen: Entferne Eintrag SOFORT aus combinedEntries:', {
                notificationId: notification.id,
                vorher: prevEntries.length,
                nachher: filtered.length
              });
              return filtered;
            });
            
            // Schließe Swipeable sofort, damit der User sieht, dass die Action ausgeführt wird
            if (swipeableRefs.current[notification.id]?.current) {
              swipeableRefs.current[notification.id].current.close();
            }
            
            // WICHTIG: Führe Action aus (asynchron im Hintergrund)
            // handleArchive fügt die ID selbst zu pendingArchiveActions hinzu
            handleArchive(notification).then(() => {
              console.log('✅ InfoBoxScreen: Archive-Action erfolgreich abgeschlossen:', notification.id);
              // Entferne aus deletingEntries nach erfolgreicher Action
              setDeletingEntries(prev => {
                const newSet = new Set(prev);
                newSet.delete(notification.id);
                return newSet;
              });
              pendingArchiveActions.current.delete(notification.id);
            }).catch(error => {
              console.error('❌ InfoBoxScreen: Fehler beim Archivieren:', error);
              // Entferne aus deletingEntries auch bei Fehler
              setDeletingEntries(prev => {
                const newSet = new Set(prev);
                newSet.delete(notification.id);
                return newSet;
              });
              pendingArchiveActions.current.delete(notification.id);
            });
          }
        }}
      >
        <TouchableOpacity
          style={[
            styles.notificationItem,
            isCompleted && styles.notificationItemCompleted,
          ]}
          onPress={() => handleNotificationPress(notification)}
          activeOpacity={0.7}
        >
          {/* Color indicator */}
          <View style={[styles.colorIndicator, { backgroundColor: color }]} />

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text
                style={[
                  styles.title,
                  isCompleted && styles.titleCompleted,
                  !isRead && styles.titleUnread,
                ]}
                numberOfLines={1}
              >
                {notification.title || 'Kein Titel'}
              </Text>
              <View style={styles.timeContainer}>
                <Text style={styles.time}>{formatTime(notification.createdAt)}</Text>
                <Text style={styles.typeLabel}>{getNotificationTypeLabel(notification.type)}</Text>
              </View>
            </View>
            <Text
              style={[
                styles.message,
                isCompleted && styles.messageCompleted,
              ]}
              numberOfLines={2}
            >
              {notification.message || 'Keine Nachricht'}
            </Text>
          </View>

          {/* Unread indicator */}
          {!isRead && !isCompleted && (
            <View style={[styles.unreadIndicator, { backgroundColor: color }]} />
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Refresh wird durch Subscription automatisch ausgelöst
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // Handle Support-Button
  const handleSupportPress = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        Alert.alert('Fehler', 'Du musst eingeloggt sein, um Support zu kontaktieren.');
        return;
      }

      Alert.alert(
        'Support kontaktieren',
        'Möchtest du einen Support-Chat mit dem Admin starten?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          {
            text: 'Ja',
            onPress: async () => {
              try {
                // Support-Chat erstellen
                const chatId = await createSupportChat(currentUser.uid);
                
                // Chat-Daten laden
                const chat = await getChat(chatId);
                
                if (chat && onNavigate) {
                  // Zum ChatRoomScreen navigieren
                  onNavigate('chat-room', { chat });
                } else {
                  Alert.alert('Fehler', 'Chat konnte nicht geöffnet werden.');
                }
              } catch (error) {
                console.error('❌ Fehler beim Erstellen des Support-Chats:', error);
                Alert.alert('Fehler', error.message || 'Support-Chat konnte nicht erstellt werden.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Fehler beim Support-Button:', error);
      Alert.alert('Fehler', 'Ein Fehler ist aufgetreten.');
    }
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
          onNavigate={onNavigate || (() => {})} 
          isLoggedIn={isLoggedIn} 
          onLogout={onLogout} 
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
                {profileImage ? (
                  <OptimizedImage
                    source={{ uri: profileImage }}
                    style={styles.profileIconImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.profileIconCircle}>
                    <Text style={styles.profileIconText}>
                      {getInitials(getCurrentUser())}
                    </Text>
                  </View>
                )}
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
              <Text style={styles.greeting}>InfoBox</Text>
            </View>
          </View>

          {/* Notifications List */}
          <FlatList
            data={combinedEntries}
            renderItem={renderNotificationItem}
            keyExtractor={(item, index) => {
              // WICHTIG: Stelle sicher, dass Keys eindeutig und stabil sind
              // Verwende eine Kombination aus Typ, ID und zusätzlichen Feldern
              // Index nur als letzten Fallback
              if (!item || !item.id) {
                console.warn('⚠️ InfoBoxScreen: Eintrag ohne ID gefunden, verwende Index:', index);
                return `entry-${index}-${Date.now()}-${Math.random()}`;
              }
              
              const type = item.type || 'unknown';
              let uniqueKey = `${type}-${item.id}`;
              
              // Für Newsletter-Notifications: Füge newsletterId hinzu
              if (item.newsletterId) {
                uniqueKey += `-newsletter-${item.newsletterId}`;
              }
              
              // Für Chat-Entries: Füge chatId hinzu
              if (item.chatId) {
                uniqueKey += `-chat-${item.chatId}`;
              }
              
              // Für Survey-Notifications: Füge surveyId hinzu
              if (item.surveyId) {
                uniqueKey += `-survey-${item.surveyId}`;
              }
              
              // Für System-Messages: Füge systemMessageId hinzu
              if (item.systemMessageId) {
                uniqueKey += `-system-${item.systemMessageId}`;
              }
              
              // Für Chat-Entries: Füge isChatEntry Marker hinzu
              if (item.isChatEntry) {
                uniqueKey += `-chatEntry`;
              }
              
              // Falls immer noch nicht eindeutig (sollte nicht passieren), füge createdAt hinzu
              if (item.createdAt) {
                const timestamp = item.createdAt?.toDate ? item.createdAt.toDate().getTime() : new Date(item.createdAt).getTime();
                uniqueKey += `-ts-${timestamp}`;
              } else {
                // Als letzten Fallback: Index (sollte nur bei echten Duplikaten passieren)
                uniqueKey += `-idx-${index}`;
              }
              
              return uniqueKey;
            }}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Keine Einträge</Text>
                <Text style={styles.emptySubtext}>
                  Du hast derzeit keine Benachrichtigungen oder Chats
                </Text>
              </View>
            }
          />
        </View>
        <Footer />
      </View>
      
      {/* Support FAB Button */}
      {isLoggedIn && (
        <TouchableOpacity
          style={styles.supportFab}
          onPress={handleSupportPress}
          activeOpacity={0.8}
        >
          <Text style={styles.supportFabText}>💬</Text>
        </TouchableOpacity>
      )}

      {/* Fixed Bottom Navigation */}
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadCount={unreadCount}
      />

      {/* Hint-Modal für hint-small Notifications */}
      <Modal
        visible={hintModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setHintModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedHintNotification?.title || 'Tausch involviert'}
              </Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                {selectedHintNotification?.message || 'Du bist in einen Tausch involviert.'}
              </Text>
            </View>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalOKButton}
                onPress={handleHintModalOK}
                activeOpacity={0.7}
              >
                <Text style={styles.modalOKButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Hint-Decision-Modal für hint-decision Notifications */}
      <Modal
        visible={hintDecisionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setHintDecisionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedHintDecisionNotification?.title || 'Neue Tauschanfrage'}
              </Text>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.modalMessage}>
                {selectedHintDecisionNotification?.message || 'Du hast eine neue Tauschanfrage erhalten.'}
              </Text>
            </View>
            
            <View style={[styles.modalFooter, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalViewButton]}
                onPress={handleViewWineCollection}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>Weinregal ansehen</Text>
              </TouchableOpacity>
              
              {onDeclineTradeRequest && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalDeclineButton]}
                  onPress={handleDeclineTradeRequest}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.modalButtonText, styles.modalDeclineButtonText]}>Ablehnen</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c2c', // Gleiche Farbe wie BottomNavigation
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: '#2c2c2c',
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
  headerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
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
  profileIconImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
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
  profileBtpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#a9c7cd',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  profileBtpText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2c2c2c',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#2c2c2c', // Gleiche Farbe wie Content-BG
    position: 'relative',
    marginTop: 0,
    minHeight: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
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
  listContent: {
    paddingVertical: 8,
    backgroundColor: '#2c2c2c',
  },
  notificationItem: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  notificationItemCompleted: {
    opacity: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  colorIndicator: {
    width: 4,
    height: '100%',
    marginRight: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 24,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    flex: 1,
    marginRight: 8,
  },
  titleCompleted: {
    textDecorationLine: 'line-through',
    color: '#999999',
  },
  titleUnread: {
    fontWeight: 'bold',
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 12,
    color: '#CCCCCC',
  },
  typeLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    marginTop: 2,
  },
  message: {
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  messageCompleted: {
    color: '#999999',
  },
  unreadIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 16,
  },
  swipeAction: {
    width: 60,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  swipeActionComplete: {
    backgroundColor: '#4CAF50',
  },
  swipeActionDelete: {
    backgroundColor: '#F44336',
  },
  swipeActionText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#CCCCCC',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999999',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#2c2c2c',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#a9c7cd',
    textAlign: 'center',
    textShadowColor: 'rgba(218, 165, 32, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  modalBody: {
    marginBottom: 24,
    minHeight: 60,
  },
  modalMessage: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalFooter: {
    alignItems: 'center',
  },
  modalOKButton: {
    backgroundColor: '#a9c7cd',
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#a9c7cd',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  modalOKButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
  },
  // Support FAB Styles
  supportFab: {
    position: 'absolute',
    right: 20,
    bottom: 100, // Über der BottomNavigation (75px Höhe + 25px Abstand)
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DAA520', // Gold
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  supportFabText: {
    fontSize: 28,
  },
  // Hint-Decision Modal Styles
  modalButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    minWidth: 140,
    alignItems: 'center',
    marginHorizontal: 8,
    marginTop: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  modalViewButton: {
    backgroundColor: '#a9c7cd',
    shadowColor: '#a9c7cd',
  },
  modalDeclineButton: {
    backgroundColor: '#DC3545',
    shadowColor: '#DC3545',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
  },
  modalDeclineButtonText: {
    color: '#FFFFFF',
  },
});

