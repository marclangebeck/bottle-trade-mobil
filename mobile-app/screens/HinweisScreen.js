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
import ProVersionButton from '../components/ProVersionButton';
import OptimizedImage from '../components/OptimizedImage';
import { getCurrentUser } from '../services/testAuth';
import { getTradeRequest } from '../services/database-web';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase-web';

export default function HinweisScreen({ onNavigate, onLogout, chats = [], unreadCount = 0, onMarkChatAsRead, onDeleteChat = null, notifications = [], isLoggedIn = false, onDeclineTradeRequest = null, onDeleteNotificationsForHint = null, onMarkAllHintNotificationsAsRead = null, onMarkAllHintsAsRead = null, isPro = false }) {
  console.log('✅ HinweisScreen geladen - Nur Hinweise');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [wineImages, setWineImages] = useState({}); // { hintId: { wineFromImage: string, wineToImage: string } }

  // Filtere nur Hinweise
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.uid;
  
  // Filtere nur Hinweise (entryType === 'hint')
  const filteredHints = chats.filter(chat => {
    if (!chat || chat.entryType !== 'hint') return false;
    
    // WICHTIG: Gelöschte Hinweise ausblenden
    if (chat.deletedBy) {
      if (Array.isArray(chat.deletedBy)) {
        if (chat.deletedBy.length > 0) {
          return false; // Hinweis wurde gelöscht - für alle ausblenden
        }
      } else {
        return false; // Hinweis wurde gelöscht - für alle ausblenden
      }
    }
    
    // Nur Hinweise für diesen User anzeigen
    if (chat.userId !== currentUserId) {
      // Rückwärtskompatibilität: Prüfe auch participants Array (alte Hinweise)
      if (!chat.participants || !Array.isArray(chat.participants) || !chat.participants.includes(currentUserId)) {
        return false;
      }
    }
    
    // Abgelehnte trade-decision Hinweise ausblenden
    if (chat.status === 'rejected' && chat.hintType === 'trade-decision') {
      return false;
    }
    
    // Trade-request Hinweise mit Status 'rejected' ausblenden
    if (chat.status === 'rejected' && (chat.hintType === 'trade-request' || !chat.hintType)) {
      return false;
    }
    
    return true;
  });
  
  // Dedupliziere Hinweise
  const deduplicatedHints = [];
  const hintMap = new Map();
  
  filteredHints.forEach(chat => {
    if (chat.tradeRequestId && chat.hintType) {
      const hintKey = `${chat.tradeRequestId}-${chat.hintType}-${chat.userId}`;
      const existing = hintMap.get(hintKey);
      
      if (!existing) {
        hintMap.set(hintKey, chat);
      } else {
        const chatDate = new Date(chat.updatedAt || chat.createdAt || chat.lastMessageTime || 0);
        const existingDate = new Date(existing.updatedAt || existing.createdAt || existing.lastMessageTime || 0);
        if (chatDate > existingDate) {
          hintMap.set(hintKey, chat);
        }
      }
    } else {
      deduplicatedHints.push(chat);
    }
  });
  
  hintMap.forEach(hint => {
    deduplicatedHints.push(hint);
  });
  
  // Memoize allHints, um Endlosschleife zu vermeiden
  const allHints = useMemo(() => deduplicatedHints, [filteredHints.length, JSON.stringify(filteredHints.map(h => h.id))]);
  
  // Erstelle Array von Trade-Request-IDs für Dependency
  const tradeRequestIds = useMemo(() => {
    return allHints
      .filter(hint => hint.tradeRequestId)
      .map(hint => hint.tradeRequestId)
      .filter((id, index, self) => self.indexOf(id) === index); // Eindeutige IDs
  }, [allHints]);

  // Initialisierung
  useEffect(() => {
  }, []);

  // Lade Weinbilder für alle Hinweise
  useEffect(() => {
    if (tradeRequestIds.length === 0) return;
    
    const loadWineImages = async () => {
      const imagesMap = {};
      
      for (const hint of allHints) {
        if (hint.tradeRequestId) {
          try {
            const tradeRequest = await getTradeRequest(hint.tradeRequestId);
            if (tradeRequest) {
              console.log('📦 Trade-Request Daten:', {
                id: tradeRequest.id,
                fields: Object.keys(tradeRequest),
                wineFromId: tradeRequest.wineFromId,
                wineId: tradeRequest.wineId,
                wineIds: tradeRequest.wineIds,
                selectedWineId: tradeRequest.selectedWineId,
                wineToId: tradeRequest.wineToId,
                fromUserId: tradeRequest.fromUserId,
                toUserId: tradeRequest.toUserId
              });
              
              // Lade Weinbilder aus Trade-Request
              let wineFromImage = null;
              let wineToImage = null;
              
              // Bestimme die Wein-IDs basierend auf der Perspektive des aktuellen Users
              const currentUser = getCurrentUser();
              const currentUserId = currentUser?.uid;
              const isFromUser = currentUserId === tradeRequest.fromUserId;
              const isToUser = currentUserId === tradeRequest.toUserId;
              
              // wineFromId: Der Wein, den A (fromUser) anbietet (wird von B ausgewählt)
              // wineToId: Der Wein, den A (fromUser) haben möchte (von B)
              let wineFromId = tradeRequest.wineFromId || tradeRequest.selectedWineId;
              let wineToId = tradeRequest.wineToId || tradeRequest.wineId;
              
              // WICHTIG: Wenn wineFromId nicht gesetzt ist, aber selectedWineId vorhanden ist, verwende selectedWineId
              // selectedWineId ist der Wein, den B aus A's Regal ausgewählt hat (also wineFromId)
              if (!wineFromId && tradeRequest.selectedWineId) {
                wineFromId = tradeRequest.selectedWineId;
                console.log('ℹ️ Verwende selectedWineId als wineFromId:', wineFromId);
              }
              
              // Fallback: Wenn wineIds ein Array ist
              if (tradeRequest.wineIds && Array.isArray(tradeRequest.wineIds) && tradeRequest.wineIds.length > 0) {
                if (!wineToId) {
                  // Wenn selectedWineId gesetzt ist, ist wineToId das andere Element im Array
                  if (tradeRequest.selectedWineId) {
                    wineToId = tradeRequest.wineIds.find(id => id !== tradeRequest.selectedWineId) || tradeRequest.wineIds[0];
                  } else {
                    wineToId = tradeRequest.wineIds[0];
                  }
                }
                if (!wineFromId && tradeRequest.wineIds.length > 0) {
                  wineFromId = tradeRequest.wineIds[0];
                }
              }
              
              console.log('🔍 Extrahierte Wein-IDs (vor Fallback):', {
                wineFromId,
                wineToId,
                isFromUser,
                isToUser,
                currentUserId
              });
              
              // Lade wineFrom Bild
              if (wineFromId) {
                try {
                  console.log('🔄 Lade wineFrom Bild für Wein-ID:', wineFromId);
                  const wineDoc = await getDoc(doc(db, 'wines', wineFromId));
                  if (wineDoc.exists()) {
                    const wineData = wineDoc.data();
                    wineFromImage = wineData.labelImage || null;
                    console.log('✅ wineFrom Bild geladen:', wineFromImage ? `Vorhanden (${wineFromImage.substring(0, 50)}...)` : 'Nicht vorhanden');
                    if (!wineFromImage) {
                      console.warn('⚠️ wineFrom Wein hat kein labelImage:', wineData.name || wineFromId);
                    }
                  } else {
                    console.warn('⚠️ wineFrom Wein nicht gefunden:', wineFromId);
                  }
                } catch (error) {
                  console.error('❌ Fehler beim Laden des wineFrom Bildes:', error);
                }
              } else {
                // Fallback: Versuche wineFromId aus den Weinen zu bestimmen, die zu fromUserId gehören
                console.log('ℹ️ Kein wineFromId vorhanden, versuche aus Weinen zu bestimmen...');
                try {
                  // Suche nach Weinen, die zu fromUserId gehören (A's Weine)
                  const winesQuery = query(
                    collection(db, 'wines'),
                    where('ownerId', '==', tradeRequest.fromUserId)
                  );
                  const winesSnapshot = await getDocs(winesQuery);
                  const fromUserWines = winesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                  
                  // Wenn wineToId bekannt ist, nimm einen anderen Wein von A
                  if (wineToId && fromUserWines.length > 0) {
                    const otherWine = fromUserWines.find(w => w.id !== wineToId);
                    if (otherWine) {
                      wineFromId = otherWine.id;
                      wineFromImage = otherWine.labelImage || null;
                      console.log('✅ wineFromId aus Weinen bestimmt:', wineFromId);
                    }
                  } else if (fromUserWines.length > 0) {
                    // Nimm den ersten verfügbaren Wein von A
                    const firstWine = fromUserWines[0];
                    wineFromId = firstWine.id;
                    wineFromImage = firstWine.labelImage || null;
                    console.log('✅ wineFromId aus erstem Wein von A bestimmt:', wineFromId);
                  }
                } catch (error) {
                  console.error('❌ Fehler beim Bestimmen von wineFromId aus Weinen:', error);
                }
                
                if (!wineFromId) {
                  console.log('ℹ️ Kein wineFromId gefunden (B hat noch keinen Wein ausgewählt)');
                }
              }
              
              // Lade wineTo Bild (wineToId wurde bereits oben bestimmt)
              if (wineToId) {
                try {
                  console.log('🔄 Lade wineTo Bild für Wein-ID:', wineToId);
                  const wineDoc = await getDoc(doc(db, 'wines', wineToId));
                  if (wineDoc.exists()) {
                    const wineData = wineDoc.data();
                    wineToImage = wineData.labelImage || null;
                    console.log('✅ wineTo Bild geladen:', wineToImage ? `Vorhanden (${wineToImage.substring(0, 50)}...)` : 'Nicht vorhanden');
                    if (!wineToImage) {
                      console.warn('⚠️ wineTo Wein hat kein labelImage:', wineData.name || wineToId);
                    }
                  } else {
                    console.warn('⚠️ wineTo Wein nicht gefunden:', wineToId);
                  }
                } catch (error) {
                  console.error('❌ Fehler beim Laden des wineTo Bildes:', error);
                }
              } else {
                console.warn('⚠️ Kein wineToId vorhanden im Trade-Request');
              }
              
              imagesMap[hint.id] = {
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
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
    
    // WICHTIG: Markiere alle Hinweis-Notifications als gelesen, wenn Screen geöffnet wird
    if (onMarkAllHintNotificationsAsRead) {
      onMarkAllHintNotificationsAsRead();
    }
  }, [onMarkAllHintNotificationsAsRead]);

  const handleHintImagePress = async (hint) => {
    // WICHTIG: Markiere Hinweis als gelesen, wenn User ihn öffnet
    if (onMarkChatAsRead && hint.id) {
      try {
        await onMarkChatAsRead(hint.id);
      } catch (error) {
        console.error('❌ Fehler beim Markieren des Hinweises als gelesen:', error);
      }
    }
    
    // WICHTIG: Lösche Notifications für diesen Hinweis, wenn User ihn öffnet
    if (hint.tradeRequestId && onDeleteNotificationsForHint) {
      try {
        await onDeleteNotificationsForHint(hint.tradeRequestId);
      } catch (error) {
        console.error('❌ Fehler beim Löschen der Notifications für Hinweis:', error);
      }
    }
    
    setSelectedChat(hint);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedChat(null);
  };

  const handleHintPress = async (hint) => {
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.uid;
    
    // WICHTIG: Markiere Hinweis als gelesen, wenn User ihn öffnet
    if (onMarkChatAsRead && hint.id) {
      try {
        await onMarkChatAsRead(hint.id);
      } catch (error) {
        console.error('❌ Fehler beim Markieren des Hinweises als gelesen:', error);
      }
    }
    
    // WICHTIG: Lösche Notifications für diesen Hinweis, wenn User ihn öffnet
    if (hint.tradeRequestId && onDeleteNotificationsForHint) {
      try {
        await onDeleteNotificationsForHint(hint.tradeRequestId);
      } catch (error) {
        console.error('❌ Fehler beim Löschen der Notifications für Hinweis:', error);
      }
    }
    
    // trade-involved Hinweise - nur Info anzeigen
    if (hint.hintType === 'trade-involved') {
      Alert.alert(
        'Tausch involviert',
        hint.lastMessage || 'Du bist in einen Tausch involviert.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // trade-decision Hinweise - nur für B (Empfänger)
    if (hint.hintType === 'trade-decision') {
      if (hint.toUserId === currentUserId && hint.fromUserId && hint.tradeRequestId) {
        onNavigate('mein-weinregal', { viewUserId: hint.fromUserId, tradeRequestId: hint.tradeRequestId });
        return;
      } else {
        Alert.alert(
          'Tausch involviert',
          hint.lastMessage || 'Du bist in einen Tausch involviert.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    // Fallback für alte Hinweise
    if (hint.status === 'received' && hint.tradeRequestId) {
      const isReceiver = hint.toUserId === currentUserId || (hint.fromUserId !== currentUserId && hint.toUserId);
      if (isReceiver) {
        const fromUserId = hint.fromUserId || hint.participants?.find(pid => pid !== currentUserId);
        if (fromUserId) {
          onNavigate('mein-weinregal', { viewUserId: fromUserId, tradeRequestId: hint.tradeRequestId });
          return;
        }
      }
      Alert.alert(
        'Tausch involviert',
        hint.lastMessage || 'Du bist in einen Tausch involviert.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Hinweis',
      hint.lastMessage || 'Hinweis',
      [{ text: 'OK' }]
    );
  };

  const handleDeleteChat = (chatId) => {
    Alert.alert(
      'Hinweis löschen',
      'Möchten Sie diesen Hinweis wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => {
          if (onDeleteChat) {
            onDeleteChat(chatId);
          }
          handleCloseModal();
        }}
      ]
    );
  };

  const formatLastMessage = (message) => {
    return message.length > 50 ? message.substring(0, 50) + '...' : message;
  };

  const getOtherParticipantName = (hint) => {
    const currentUser = getCurrentUser();
    const currentUserId = currentUser?.uid;
    
    if (!currentUserId) return 'Unbekannt';
    
    if (hint.fromUserId === currentUserId && hint.toUserName) {
      return hint.toUserName;
    }
    if (hint.toUserId === currentUserId && hint.fromUserName) {
      return hint.fromUserName;
    }
    
    if (hint.participantNames && Array.isArray(hint.participantNames)) {
      const otherName = hint.participantNames.find(name => 
        name !== currentUser?.username && 
        name !== 'Tauschpartner' && 
        name !== 'Du'
      );
      if (otherName) return otherName;
    }
    
    return 'Unbekannt';
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
          unreadCount={unreadCount}
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
                <Text style={styles.greeting}>Hinweise</Text>
              </View>
            </View>
          </View>
          
          {/* Button "Alle als gelesen markieren" unterhalb des Headers */}
          {allHints.some(hint => hint.unreadCount > 0) && onMarkAllHintsAsRead && typeof onMarkAllHintsAsRead === 'function' && (
            <View style={styles.markAllReadButtonContainer}>
              <TouchableOpacity 
                style={styles.markAllReadButton}
                onPress={() => {
                  console.log('🔄 HinweisScreen: Button "Alle gelesen" geklickt');
                  if (onMarkAllHintsAsRead && typeof onMarkAllHintsAsRead === 'function') {
                    onMarkAllHintsAsRead();
                  } else {
                    console.error('❌ HinweisScreen: onMarkAllHintsAsRead ist keine Funktion:', typeof onMarkAllHintsAsRead);
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
                  <Text style={styles.loadingText}>Hinweise werden geladen...</Text>
                </View>
              ) : allHints.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>💡</Text>
                  <Text style={styles.emptyTitle}>Keine Hinweise</Text>
                  <Text style={styles.emptySubtitle}>
                    Du hast aktuell keine Hinweise.
                  </Text>
                </View>
              ) : (
                <View style={styles.hintsList}>
                  {allHints.map((hint, index) => {
                    let borderColor = 'rgba(255, 255, 224, 0.7)'; // Gold für trade-involved
                    
                    if (hint.hintType === 'trade-involved') {
                      borderColor = 'rgba(255, 255, 224, 0.7)'; // Gold
                    } else if (hint.hintType === 'trade-decision') {
                      borderColor = 'rgba(144, 238, 144, 0.7)'; // Grün
                    }

                    const otherName = getOtherParticipantName(hint);
                    const hintTitle = (() => {
                      const currentUser = getCurrentUser();
                      const currentUserId = currentUser?.uid;
                      
                      if (hint.hintType === 'trade-involved') {
                        if (hint.fromUserId === currentUserId) {
                          if (hint.status === 'accepted') return 'Tauschanfrage angenommen';
                          if (hint.status === 'rejected') return 'Tauschanfrage abgelehnt';
                          return 'Tausch involviert';
                        }
                        return 'Tausch involviert';
                      } else if (hint.hintType === 'trade-decision') {
                        if (hint.toUserId === currentUserId) {
                          if (hint.status === 'accepted') return 'Tauschanfrage angenommen';
                          if (hint.status === 'rejected') return 'Tauschanfrage abgelehnt';
                          return `Tauschanfrage von ${otherName}`;
                        }
                        return `Tauschanfrage von ${otherName}`;
                      }
                      return `Tauschanfrage: ${otherName}`;
                    })();
                    
                    // Hole Weinbilder für diesen Hinweis
                    const hintWineImages = wineImages[hint.id] || {};
                    const wineFromImage = hintWineImages.wineFromImage;
                    const wineToImage = hintWineImages.wineToImage;
                    
                    return (
                      <TouchableOpacity 
                        key={hint.id} 
                        style={[styles.hintRow, { borderColor }]}
                        activeOpacity={0.8}
                        onPress={() => handleHintImagePress(hint)}
                      >
                        <View style={styles.rowImageOnlyContainer}>
                          {/* Prüfe ob Tausch abgeschlossen (accepted) */}
                          {hint.status === 'accepted' ? (
                            // Tausch abgeschlossen - Zeige roten, dicken Text
                            <View style={styles.tradeCompletedContainer}>
                              <Text style={styles.tradeCompletedText}>Tausch abgeschlossen</Text>
                            </View>
                          ) : hint.tradeRequestId ? (
                            // Normale Tauschanfrage - Zeige Weinbilder (ohne Icon)
                            <View style={styles.wineImagesContainer}>
                              {/* Linkes Weinbild (wineFrom) - 50% Breite */}
                              <View style={styles.wineImageWrapper}>
                                {wineFromImage ? (
                                  <OptimizedImage
                                    source={{ uri: wineFromImage }}
                                    style={styles.wineImage}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <View style={styles.wineImagePlaceholder}>
                                    <Text style={styles.wineImagePlaceholderText}>Auswahl ausstehend</Text>
                                  </View>
                                )}
                              </View>
                              
                              {/* Rechtes Weinbild (wineTo) - 50% Breite */}
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
                            // Fallback: Placeholder wenn kein Trade-Request vorhanden
                            <View style={styles.rowPlaceholderImageOnly}>
                              <Text style={styles.placeholderTextOnly}>
                                💡
                              </Text>
                            </View>
                          )}
                          
                          {hint.unreadCount > 0 && (
                            <View style={styles.unreadBadgeOverlay}>
                              <Text style={styles.unreadTextOverlay}>{hint.unreadCount}</Text>
                            </View>
                          )}
                          <View style={styles.rowImageOverlay}>
                            <Text style={styles.rowImageOverlayText} numberOfLines={1}>
                              {hintTitle}
                            </Text>
                            {hint.lastMessage && (
                              <Text style={styles.rowImageOverlaySubtext} numberOfLines={1}>
                                {formatLastMessage(hint.lastMessage)}
                              </Text>
                            )}
                            {hint.lastMessageTime && (
                              <Text style={styles.rowImageOverlayTime}>
                                {hint.lastMessageTime}
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

      {/* Modal für Hinweis-Details */}
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
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Hinweis-Details</Text>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={handleCloseModal}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalChatName}>
                    {(() => {
                      const otherName = getOtherParticipantName(selectedChat);
                      const currentUser = getCurrentUser();
                      const currentUserId = currentUser?.uid;
                      
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
                    })()}
                  </Text>

                  {selectedChat.lastMessage && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>💬 Nachricht:</Text>
                      <Text style={styles.modalInfoText}>{selectedChat.lastMessage}</Text>
                    </View>
                  )}

                  {selectedChat.lastMessageTime && (
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalInfoLabel}>🕐 Zeit:</Text>
                      <Text style={styles.modalInfoText}>{selectedChat.lastMessageTime}</Text>
                    </View>
                  )}

                  {selectedChat.hintType && (
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
                      <Text style={styles.modalInfoText}>{selectedChat.unreadCount} Hinweis(e)</Text>
                    </View>
                  )}
                </ScrollView>

                <View style={styles.modalActions}>
                  {selectedChat.hintType === 'trade-decision' && (() => {
                    const currentUser = getCurrentUser();
                    const currentUserId = currentUser?.uid;
                    const isPersonB = selectedChat.toUserId === currentUserId && selectedChat.fromUserId !== currentUserId;
                    const canReject = selectedChat.status === 'requested' || selectedChat.status === 'received' || !selectedChat.status;
                    const otherName = getOtherParticipantName(selectedChat);
                    
                    return isPersonB && canReject ? (
                      <>
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

                  <TouchableOpacity 
                    style={styles.modalDeleteButton}
                    onPress={() => {
                      Alert.alert(
                        'Hinweis löschen',
                        'Möchten Sie diesen Hinweis wirklich löschen?',
                        [
                          { text: 'Abbrechen', style: 'cancel' },
                          { 
                            text: 'Löschen', 
                            style: 'destructive', 
                            onPress: () => {
                              handleDeleteChat(selectedChat.id);
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  profileIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    width: 40,
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
  hintsList: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginBottom: 20,
  },
  hintRow: {
    width: '100%',
    aspectRatio: 2, // Doppelte Breite = 2:1 Verhältnis (breiter als hoch)
    marginBottom: 20, // Mehr Abstand zwischen den Containern
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 224, 0.7)',
    padding: 0,
    shadowColor: '#FFC107',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  rowImageOnlyContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  wineImagesContainer: {
    flexDirection: 'row',
    width: '100%',
    height: '100%', // Volle Höhe des Containers
    alignItems: 'stretch',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  wineImageWrapper: {
    flex: 1,
    width: '50%', // Genau 50% der Breite für jedes Bild
    height: '100%',
    overflow: 'hidden',
  },
  wineImage: {
    width: '100%',
    height: '100%',
  },
  wineImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wineImagePlaceholderText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  tradeCompletedContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(244, 67, 54, 0.15)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  placeholderTextOnly: {
    fontSize: 48,
    color: '#FFC107',
    opacity: 0.6,
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
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Halbtransparent (70% Deckkraft)
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 193, 7, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 10, // Über den Bildern
  },
  rowImageOverlayText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c2c2c',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 193, 7, 0.5)',
    shadowColor: '#FFC107',
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
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 193, 7, 0.4)',
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
    backgroundColor: 'rgba(255, 193, 7, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.5)',
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
    borderTopColor: 'rgba(255, 193, 7, 0.3)',
    flexWrap: 'wrap',
    gap: 10,
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
});

