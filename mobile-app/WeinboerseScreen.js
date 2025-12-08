import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  Modal,
  Dimensions,
  FlatList,
  TextInput
} from 'react-native';
import { ImageBackground } from 'react-native';
import OptimizedImage from './components/OptimizedImage';
import Footer from './Footer';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import BottomNavigation from './components/BottomNavigation';
import ProVersionButton from './components/ProVersionButton';
import LimitInfoBanner from './components/LimitInfoBanner';
import { getAvailableWines, unpublishWine, publishWine } from './data/mockData';
import { getCurrentUser } from './services/testAuth';
import { getAllWinesByOwner, getUser, updateWine } from './services/database-web';
import { getDistanceText } from './services/geocodingService';
import { handleLimitError } from './services/limitErrorHandler';

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

export default function WeinboerseScreen({ onNavigate, onLogout, isAdmin = false, unreadCount = 0, chats = [], isLoggedIn = false, onCreateTradeRequest = null, wishlistMatchCount = 0, isPro = false }) {
  const [wines, setWines] = useState([]);
  const [allWines, setAllWines] = useState([]); // Alle Weine inkl. private für Status-Prüfung
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedWine, setSelectedWine] = useState(null); // Für Modal
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal sichtbar
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Für Swipe-Galerie
  const [currentUserId, setCurrentUserId] = useState('');
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [selectedWineForPublish, setSelectedWineForPublish] = useState(null);
  const [publishCount, setPublishCount] = useState(1);
  const [publishMode, setPublishMode] = useState('publish'); // 'publish' oder 'unpublish'
  const [profileImage, setProfileImage] = useState(null);
  const scrollViewRef = useRef(null);
  const [viewMode, setViewMode] = useState('container'); // 'container' oder 'list'
  const [searchText, setSearchText] = useState(''); // Suchtext für Filterung
  const [showMyWines, setShowMyWines] = useState(true); // Eigene Weine anzeigen/ausblenden
  const [modalScrollViewWidth, setModalScrollViewWidth] = useState(null); // Breite der ScrollView für pagingEnabled
  
  // Admin-Status wird von App.js übergeben
  console.log('🔍 WeinboerseScreen: Admin-Status:', isAdmin ? 'Admin' : 'Standard-User');

  useEffect(() => {
    setCurrentUserIdFromAuth();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadWines();
      loadAllWines();
      loadProfileImage();
    }
  }, [currentUserId]);

  const loadProfileImage = async () => {
    try {
      if (!currentUserId) return;
      const userData = await getUser(currentUserId);
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

  // Filter-Funktion für Weine
  const filterWines = (winesList, searchQuery, showOwnWines = true) => {
    let filtered = winesList;
    
    // Filtere eigene Weine heraus, wenn showOwnWines false ist
    if (!showOwnWines) {
      const currentUser = getCurrentUser && getCurrentUser();
      filtered = filtered.filter(wine => {
        const isMine = currentUser && (
          (wine.ownerId && wine.ownerId === currentUser.uid) ||
          (wine.owner && (wine.owner === currentUser.username || wine.owner === currentUser.email))
        );
        return !isMine;
      });
    }
    
    // Filtere nach Suchtext
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(wine => {
        const name = wine.name?.toLowerCase() || '';
        const winery = wine.winery?.toLowerCase() || '';
        const vintage = wine.vintage?.toString() || '';
        const region = wine.region?.toLowerCase() || '';
        const grapeVariety = wine.grapeVariety?.toLowerCase() || '';
        
        return name.includes(query) ||
               winery.includes(query) ||
               vintage.includes(query) ||
               region.includes(query) ||
               grapeVariety.includes(query);
      });
    }
    
    return filtered;
  };

  // Gefilterte Weine
  const filteredWines = filterWines(wines, searchText, showMyWines);

  // Scroll zum ausgewählten Wert, wenn Modal geöffnet wird
  useEffect(() => {
    if (publishModalVisible && selectedWineForPublish && scrollViewRef.current) {
      const winesToProcess = publishMode === 'publish' 
        ? selectedWineForPublish.privateWines 
        : selectedWineForPublish.publicWines;
      const maxCount = winesToProcess?.length || 1;
      const currentCount = typeof publishCount === 'number' ? publishCount : parseInt(publishCount, 10) || 1;
      const selectedIndex = Math.min(Math.max(currentCount - 1, 0), maxCount - 1);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          y: selectedIndex * itemHeight,
          animated: false,
        });
      }, 150);
    }
  }, [publishModalVisible, selectedWineForPublish, publishMode]);

  const setCurrentUserIdFromAuth = () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.uid) {
        setCurrentUserId(currentUser.uid);
      } else {
        setCurrentUserId('test-456'); // Fallback
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der User-ID:', error);
      setCurrentUserId('test-456'); // Fallback
    }
  };

  const loadAllWines = async () => {
    try {
      if (!currentUserId) return;
      const allUserWines = await getAllWinesByOwner(currentUserId);
      setAllWines(allUserWines);
    } catch (error) {
      console.error('❌ Fehler beim Laden aller Weine:', error);
    }
  };

  const loadWines = async () => {
    try {
      console.log('🔄 WeinboerseScreen: Loading wines...');
      let availableWines = await getAvailableWines();
      console.log('✅ WeinboerseScreen: Loaded', availableWines.length, 'wines');
      
      // Prüfe und ergänze fehlende ownerZipCode für alte Weine
      const winesToUpdate = [];
      for (const wine of availableWines) {
        if (!wine.ownerZipCode && wine.ownerId) {
          try {
            const ownerData = await getUser(wine.ownerId);
            if (ownerData && ownerData.zipCode) {
              winesToUpdate.push({
                wineId: wine.id,
                zipCode: ownerData.zipCode
              });
              // Aktualisiere auch im lokalen State
              wine.ownerZipCode = ownerData.zipCode;
            }
          } catch (error) {
            console.error(`❌ Fehler beim Laden der PLZ für Wein ${wine.id}:`, error);
          }
        }
      }
      
      // Aktualisiere Weine in Firestore (nur wenn PLZ gefunden wurde)
      if (winesToUpdate.length > 0) {
        console.log(`🔄 Aktualisiere ${winesToUpdate.length} Weine mit fehlender PLZ...`);
        await Promise.all(
          winesToUpdate.map(({ wineId, zipCode }) =>
            updateWine(wineId, { ownerZipCode: zipCode }).catch(error => {
              console.error(`❌ Fehler beim Aktualisieren von Wein ${wineId}:`, error);
            })
          )
        );
        console.log('✅ Weine mit PLZ aktualisiert');
      }
      
      setWines(availableWines);
    } catch (error) {
      console.error('❌ WeinboerseScreen: Error loading wines:', error);
      setWines([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Hamburger-Menü-Funktionen entfernt - wird durch DynamicHamburgerMenu gehandhabt

  const handleWineImagePress = (wine) => {
    // Öffne Modal mit Wein-Details
    setSelectedWine(wine);
    setCurrentImageIndex(0); // Reset auf erstes Bild
    setModalScrollViewWidth(null); // Reset ScrollView-Breite (wird beim onLayout neu gemessen)
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedWine(null);
    setCurrentImageIndex(0); // Reset auf erstes Bild
    setModalScrollViewWidth(null); // Reset ScrollView-Breite
  };

  const handleTradeRequest = () => {
    if (!selectedWine) return;
    handleCloseModal();
    contactOwner(selectedWine);
  };

  const contactOwner = (wine) => {
    // PHASE3: Prüfe ob Wein bereits in einem Tausch involviert ist
    if (wine.inTradeRequest === true) {
      Alert.alert(
        'Wein nicht verfügbar',
        'Dieser Wein ist aktuell in einen Tausch involviert und kann derzeit nicht getradet werden.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Kontakt',
      `Möchten Sie ${wine.owner} kontaktieren?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Tausch anfragen', onPress: async () => {
          try {
            const currentUser = getCurrentUser();
            if (!currentUser) {
              Alert.alert('Fehler', 'Bitte zuerst einloggen.');
              return;
            }
            if (!onCreateTradeRequest) {
              Alert.alert('Fehler', 'Aktion derzeit nicht verfügbar.');
              return;
            }
            const toUser = { uid: wine.ownerId || 'test-456', username: wine.owner };
            const requestId = await onCreateTradeRequest({ fromUser: currentUser, toUser, wine });
            // Navigiere direkt zum InfoBoxScreen, damit der User die Tauschanfrage sehen kann
            if (onNavigate && requestId) {
              // Warte kurz, damit der Hinweis durch die Subscription erstellt werden kann
              setTimeout(() => {
                onNavigate('infobox');
              }, 500);
            } else {
              Alert.alert('Anfrage gesendet', 'Deine Tauschanfrage wurde gesendet.');
            }
          } catch (e) {
            console.error(e);
            Alert.alert('Fehler', 'Tauschanfrage konnte nicht gesendet werden.');
          }
        }}
      ]
    );
  };

  const createDirectChat = (wine) => {
    // Hole aktuelle User-Info
    const currentUser = getCurrentUser();
    if (!currentUser) {
      Alert.alert('Fehler', 'Kein User angemeldet!');
      return;
    }

    // Erstelle Chat-ID basierend auf Wein-Besitzer
    // Fallback: Verwende Test-User-ID wenn keine ownerId vorhanden
    const wineOwnerId = wine.ownerId || 'test-456'; // Max Mustermann als Fallback
    const currentUserId = currentUser.uid;
    
    console.log('🔍 Chat-Erstellung:');
    console.log('  - Wein:', wine.name);
    console.log('  - Owner:', wine.owner);
    console.log('  - OwnerId:', wineOwnerId);
    console.log('  - Current User:', currentUserId);
    
    // Prüfe, ob Chat bereits existiert
    const existingChat = chats.find(chat => 
      chat.participants.includes(currentUserId) && 
      chat.participants.includes(wineOwnerId)
    );

    if (existingChat) {
      // Chat existiert bereits - öffne ihn
      onNavigate('chat-room', { chat: existingChat });
    } else {
      // Erstelle neuen Chat
      const newChat = {
        id: `chat-${Date.now()}`,
        participants: [currentUserId, wineOwnerId],
        participantNames: [
          `${currentUser.firstName} ${currentUser.lastName}`,
          wine.owner
        ],
        lastMessage: 'Chat gestartet',
        lastMessageTime: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        unreadCount: 0,
        type: 'direct',
        tradeRequestId: null,
        wineId: wine.id,
        wineTitle: wine.name || wine.title
      };
      
      console.log('✅ Neuer Chat erstellt:', newChat);

      // Füge Chat zur Liste hinzu (über onNavigate an App.js weiterleiten)
      onNavigate('chat-room', { chat: newChat, addToChatList: true });
      
      Alert.alert(
        'Chat erstellt', 
        `Chat mit ${wine.owner} wurde erstellt!`,
        [{ text: 'OK' }]
      );
    }
  };

  // Finde alle Flaschen eines Weines (basierend auf Name, Winery, Vintage)
  // WICHTIG: Beim Veröffentlichen suchen wir nur nach eigenen Weinen (currentUserId)
  const findWineBottles = (wine, forPublishing = false) => {
    if (!wine || !allWines || allWines.length === 0) {
      return [];
    }
    
    const wineName = wine?.name || wine?.title;
    if (!wineName) {
      // Wenn kein Name vorhanden ist, kann nicht nach spezifischem Wein gesucht werden
      return [];
    }
    
    return allWines.filter(w => {
      // Basis-Filter: Name, Winery, Vintage müssen übereinstimmen
      const nameMatch = w.name === wineName;
      const wineryMatch = (w.winery === wine.winery || (!w.winery && !wine.winery));
      const vintageMatch = (w.vintage === wine.vintage || (!w.vintage && !wine.vintage));
      
      if (!nameMatch || !wineryMatch || !vintageMatch) {
        return false;
      }
      
      // WICHTIG: Beim Veröffentlichen nur eigene Weine suchen
      if (forPublishing) {
        return w.ownerId === currentUserId;
      }
      
      // Sonst: Eigene Weine ODER Weine des Wein-Besitzers
      return (w.ownerId === currentUserId || w.ownerId === wine.ownerId);
    });
  };

  const handlePublishWine = async (wine) => {
    try {
      // WICHTIG: Beim Veröffentlichen suchen wir nur nach eigenen Weinen
      // Finde alle Flaschen dieses Weines (nur eigene!)
      const allBottles = findWineBottles(wine, true);
      const privateWines = allBottles
        .filter(w => w.status === 'private' && w.status !== 'traded')
        .map(w => w.id);
      
      if (privateWines.length === 0) {
        // VERBESSERT: Prüfe ob überhaupt private Weine existieren
        const allPrivateWines = allWines.filter(w => 
          w.ownerId === currentUserId && 
          w.status === 'private' && 
          w.status !== 'traded'
        );
        
        if (allPrivateWines.length === 0) {
          Alert.alert('Info', 'Keine privaten Flaschen zum Veröffentlichen vorhanden.');
        } else {
          // Es gibt private Weine, aber nicht von diesem spezifischen Wein
          // Zeige eine hilfreichere Nachricht
          const wineName = wine?.name || wine?.title || 'diesem Wein';
          Alert.alert(
            'Info', 
            `Keine privaten Flaschen von "${wineName}" zum Veröffentlichen vorhanden.\n\nSie haben ${allPrivateWines.length} private Flasche(n) im Regal, die veröffentlicht werden können.`
          );
        }
        return;
      }
      
      setSelectedWineForPublish({ wine, privateWines });
      setPublishCount(1);
      setPublishMode('publish');
      setPublishModalVisible(true);
      handleCloseModal(); // Schließe das Details-Modal
    } catch (error) {
      console.error('Error preparing wine for publish:', error);
      Alert.alert('Fehler', 'Status konnte nicht geändert werden.');
    }
  };

  const handleUnpublishWine = async (wine) => {
    try {
      // Finde alle Flaschen dieses Weines
      const allBottles = findWineBottles(wine);
      const publicWines = allBottles
        .filter(w => w.status === 'public')
        .map(w => w.id);
      
      if (publicWines.length === 0) {
        Alert.alert('Info', 'Keine veröffentlichten Flaschen zum Zurückziehen vorhanden.');
        return;
      }
      
      setSelectedWineForPublish({ wine, publicWines });
      setPublishCount(1);
      setPublishMode('unpublish');
      setPublishModalVisible(true);
      handleCloseModal(); // Schließe das Details-Modal
    } catch (error) {
      console.error('Error preparing wine for unpublish:', error);
      Alert.alert('Fehler', 'Status konnte nicht geändert werden.');
    }
  };

  const handleConfirmPublish = async () => {
    if (!selectedWineForPublish) return;
    
    try {
      const { wine } = selectedWineForPublish;
      const winesToProcess = publishMode === 'publish' 
        ? selectedWineForPublish.privateWines 
        : selectedWineForPublish.publicWines;
      
      const count = typeof publishCount === 'number' ? publishCount : parseInt(publishCount, 10);
      
      if (isNaN(count) || count < 1) {
        Alert.alert('Fehler', 'Bitte wählen Sie eine gültige Anzahl.');
        return;
      }
      
      if (count > winesToProcess.length) {
        const wineType = publishMode === 'publish' ? 'private' : 'veröffentlichte';
        Alert.alert('Fehler', `Sie haben nur ${winesToProcess.length} ${wineType} Flasche${winesToProcess.length > 1 ? 'n' : ''} verfügbar.`);
        return;
      }
      
      // Nur die gewählte Anzahl verarbeiten
      const winesToAction = winesToProcess.slice(0, count);
      
      if (publishMode === 'publish') {
        // Veröffentlichen
        try {
          for (const id of winesToAction) {
            await publishWine(id, currentUserId);
          }
          
          Alert.alert('Erfolg', count > 1 
            ? `${count} Flaschen von "${wine.name}" wurden in der Weinbörse veröffentlicht!`
            : `"${wine.name}" wurde in der Weinbörse veröffentlicht!`);
          
          setPublishModalVisible(false);
          setSelectedWineForPublish(null);
          setPublishCount(1);
          setPublishMode('publish');
          loadWines(); // Weine neu laden
          loadAllWines(); // Alle Weine neu laden
        } catch (error) {
          console.error('Error publishing wines:', error);
          // Prüfe ob es ein Limit-Fehler ist
          if (handleLimitError(error, onNavigate)) {
            return; // Fehler wurde behandelt
          }
          Alert.alert('Fehler', `Weine konnten nicht veröffentlicht werden: ${error.message || 'Unbekannter Fehler'}`);
        }
      } else {
        // Zurückziehen
        for (const id of winesToAction) {
          await unpublishWine(id);
        }
        
        Alert.alert('Erfolg', count > 1 
          ? `${count} Flaschen von "${wine.name}" wurden aus der Weinbörse zurückgezogen.`
          : `"${wine.name}" wurde aus der Weinbörse zurückgezogen.`);
        
        setPublishModalVisible(false);
        setSelectedWineForPublish(null);
        setPublishCount(1);
        setPublishMode('publish');
        loadWines(); // Weine neu laden
        loadAllWines(); // Alle Weine neu laden
      }
    } catch (error) {
      console.error(`Error ${publishMode === 'publish' ? 'publishing' : 'unpublishing'} wines:`, error);
      Alert.alert('Fehler', `Weine konnten nicht ${publishMode === 'publish' ? 'veröffentlicht' : 'zurückgezogen'} werden.`);
    }
  };

  // Generiere Zahlenliste für den Picker
  const generateNumbers = (max) => {
    return Array.from({ length: max }, (_, i) => i + 1);
  };

  const itemHeight = 50;

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
          isAdmin={isAdmin} 
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
                  source={require('./assets/images/Logo_white.png')}
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
          
          {/* Limit-Hinweis für Basic-User */}
          {isLoggedIn && currentUserId && (
            <LimitInfoBanner
              type="weinboerse"
              userId={currentUserId}
              isPro={isPro}
              isLoggedIn={isLoggedIn}
            />
          )}
          
          {/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Weinbörse</Text>
            </View>
          </View>
          
          {/* Toggle-Buttons für Ansicht */}
          <View style={styles.viewToggleContainer}>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                viewMode === 'container' && styles.viewToggleButtonActive
              ]}
              onPress={() => setViewMode('container')}
            >
              <Text style={[
                styles.viewToggleButtonText,
                viewMode === 'container' && styles.viewToggleButtonTextActive
              ]}>
                Kacheln
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.viewToggleButton,
                viewMode === 'list' && styles.viewToggleButtonActive
              ]}
              onPress={() => setViewMode('list')}
            >
              <Text style={[
                styles.viewToggleButtonText,
                viewMode === 'list' && styles.viewToggleButtonTextActive
              ]}>
                Liste
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Suchfeld mit Toggle-Button */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Suche nach Name, Weingut, Jahrgang..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={searchText}
              onChangeText={setSearchText}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchText.length > 0 && (
              <TouchableOpacity
                style={styles.searchClearButton}
                onPress={() => setSearchText('')}
              >
                <Text style={styles.searchClearButtonText}>✕</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.showMyWinesButton,
                !showMyWines && styles.showMyWinesButtonInactive
              ]}
              onPress={() => setShowMyWines(!showMyWines)}
            >
              <Text style={styles.showMyWinesButtonText}>
                {showMyWines ? '👁️' : '👁️‍🗨️'}
              </Text>
            </TouchableOpacity>
          </View>
          
          {viewMode === 'container' ? (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              <View style={styles.dashboardContainer}>
                {isLoading && (
                  <Text style={styles.dashboardTitle}>
                    Lade Weine...
                  </Text>
                )}

                {isLoading ? (
                  <View style={styles.loadingState}>
                    <Text style={styles.loadingIcon}>⏳</Text>
                    <Text style={styles.loadingText}>Weine werden geladen...</Text>
                  </View>
                ) : filteredWines.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🍷</Text>
                    <Text style={styles.emptyTitle}>
                      {searchText ? 'Keine Weine gefunden' : 'Keine Weine verfügbar'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {searchText ? 'Versuchen Sie eine andere Suche' : 'Schauen Sie später wieder vorbei!'}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.winesList}>
                    {filteredWines.map((wine, index) => {
                    const currentUser = getCurrentUser && getCurrentUser();
                    const isMine = currentUser && (
                      (wine.ownerId && wine.ownerId === currentUser.uid) ||
                      (wine.owner && (wine.owner === currentUser.username || wine.owner === currentUser.email))
                    );
                    
                    // Berechne Entfernung, wenn User eingeloggt ist und beide PLZ vorhanden sind
                    const distanceText = currentUser && currentUser.zipCode && wine.ownerZipCode && !isMine
                      ? getDistanceText(currentUser.zipCode, wine.ownerZipCode)
                      : null;
                    
                    const rowStyle = [
                      styles.wineRow,
                      { 
                        backgroundColor: 'rgba(255, 255, 255, 0.6)', // Glassmorphism Hintergrund
                        // Border-Farbe: gold für eigene Weine, schwarz für fremde
                        borderColor: '#FFFFFF', // Weiße Border
                      },
                    ];
                    return (
                      <TouchableOpacity 
                        key={wine.id} 
                        style={rowStyle}
                        activeOpacity={0.8}
                        onPress={() => handleWineImagePress(wine)}
                      >
                        {/* Bildergalerie mit Swipe */}
                        <View 
                          style={styles.rowImageOnlyContainer}
                          onLayout={(event) => {
                            const { width } = event.nativeEvent.layout;
                            // Speichere die Container-Breite für diesen Wein
                            if (width && !wine._containerWidth) {
                              wine._containerWidth = width;
                            }
                          }}
                        >
                          {(() => {
                            const images = wine.labelImages || (wine.labelImage ? [wine.labelImage] : []);
                            if (images.length === 0) {
                              return (
                                <View style={styles.rowPlaceholderImageOnly}>
                                  <Text style={styles.placeholderTextOnly}>🍷</Text>
                                </View>
                              );
                            }
                            // Wenn nur ein Bild, zeige es direkt ohne ScrollView
                            if (images.length === 1) {
                              return (
                                <View style={styles.singleImageContainer}>
                                  <OptimizedImage
                                    source={{ uri: images[0] }}
                                    style={styles.rowImageOnly}
                                    resizeMode="contain"
                                  />
                                </View>
                              );
                            }
                            // Mehrere Bilder: ScrollView mit Swipe
                            // Verwende die gemessene Container-Breite oder berechne sie
                            const containerWidth = wine._containerWidth || (Dimensions.get('window').width * 0.48);
                            return (
                              <ScrollView
                                horizontal
                                pagingEnabled
                                showsHorizontalScrollIndicator={false}
                                style={styles.imageSwipeContainer}
                                contentContainerStyle={styles.imageSwipeContent}
                                scrollEventThrottle={16}
                              >
                                {images.map((imageUri, index) => (
                                  <View key={index} style={[styles.imageWrapper, { width: containerWidth }]}>
                                    <OptimizedImage
                                      source={{ uri: imageUri }}
                                      style={styles.rowImageOnly}
                                      resizeMode="contain"
                                    />
                                  </View>
                                ))}
                              </ScrollView>
                            );
                          })()}
                          {/* Badge "Mein Wein" oben rechts (nur bei eigenen Weinen) */}
                          {isMine && (
                            <View style={styles.myWineBadge}>
                              <Text style={styles.myWineBadgeText}>Mein Wein</Text>
                            </View>
                          )}
                          {/* Optional: Subtiler Overlay mit Wein-Name und Entfernung */}
                          <View style={styles.rowImageOverlay}>
                            <Text style={styles.rowImageOverlayText} numberOfLines={1}>
                              {wine.name}
                            </Text>
                            {distanceText && (
                              <Text style={styles.rowImageDistanceText} numberOfLines={1}>
                                {distanceText}
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
          ) : (
            <View style={styles.content}>
              <View style={styles.dashboardContainer}>
                {isLoading ? (
                  <View style={styles.loadingState}>
                    <Text style={styles.loadingIcon}>⏳</Text>
                    <Text style={styles.loadingText}>Weine werden geladen...</Text>
                  </View>
                ) : filteredWines.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🍷</Text>
                    <Text style={styles.emptyTitle}>
                      {searchText ? 'Keine Weine gefunden' : 'Keine Weine verfügbar'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {searchText ? 'Versuchen Sie eine andere Suche' : 'Schauen Sie später wieder vorbei!'}
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredWines}
                    keyExtractor={(item) => item.id || item.wineIds?.[0] || `wine-${item.name}`}
                    renderItem={({ item: wine }) => {
                      const currentUser = getCurrentUser && getCurrentUser();
                      const isMine = currentUser && (
                        (wine.ownerId && wine.ownerId === currentUser.uid) ||
                        (wine.owner && (wine.owner === currentUser.username || wine.owner === currentUser.email))
                      );
                      
                      // Berechne Entfernung, wenn User eingeloggt ist und beide PLZ vorhanden sind
                      const distanceText = currentUser && currentUser.zipCode && wine.ownerZipCode && !isMine
                        ? getDistanceText(currentUser.zipCode, wine.ownerZipCode)
                        : null;
                      
                      return (
                        <TouchableOpacity
                          style={styles.listItem}
                          onPress={() => handleWineImagePress(wine)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.listItemImageContainer}>
                            {(() => {
                              const images = wine.labelImages || (wine.labelImage ? [wine.labelImage] : []);
                              if (images.length === 0) {
                                return (
                                  <View style={styles.listItemPlaceholder}>
                                    <Text style={styles.listItemPlaceholderText}>🍷</Text>
                                  </View>
                                );
                              }
                              return (
                                <OptimizedImage
                                  source={{ uri: images[0] }}
                                  style={styles.listItemImage}
                                  resizeMode="contain"
                                />
                              );
                            })()}
                            {/* Badge "Mein Wein" oben rechts (nur bei eigenen Weinen) */}
                            {isMine && (
                              <View style={styles.listItemMyWineBadge}>
                                <Text style={styles.listItemMyWineBadgeText}>Mein Wein</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.listItemTextContainer}>
                            <Text style={styles.listItemText} numberOfLines={2}>
                              {wine.name}
                            </Text>
                            {distanceText && (
                              <Text style={styles.listItemDistanceText} numberOfLines={1}>
                                {distanceText}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    }}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    initialNumToRender={10}
                    maxToRenderPerBatch={10}
                    windowSize={10}
                    removeClippedSubviews={true}
                  />
                )}
              </View>
            </View>
          )}
        </View>
        <Footer />
      </View>
      
      {/* Fixed Bottom Navigation */}
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

      {/* Modal für Wein-Details */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedWine && (
              <>
                {/* Modal Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Wein-Details</Text>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={handleCloseModal}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Wein-Bildergalerie mit Swipe */}
                <View style={styles.modalImageContainer}>
                  {(() => {
                    const images = selectedWine.labelImages || (selectedWine.labelImage ? [selectedWine.labelImage] : []);
                    if (images.length === 0) {
                      return (
                        <View style={styles.modalPlaceholderImage}>
                          <Text style={styles.modalPlaceholderText}>🍷</Text>
                        </View>
                      );
                    }
                    return (
                      <>
                        <ScrollView
                          horizontal
                          pagingEnabled
                          showsHorizontalScrollIndicator={false}
                          style={styles.modalImageSwipeContainer}
                          contentContainerStyle={styles.modalImageSwipeContent}
                          onLayout={(event) => {
                            // Messen der ScrollView-Breite für pagingEnabled
                            const { width } = event.nativeEvent.layout;
                            if (width > 0 && width !== modalScrollViewWidth) {
                              console.log('📏 Modal ScrollView Breite gemessen:', width);
                              setModalScrollViewWidth(width);
                            }
                          }}
                          onScroll={(event) => {
                            const offsetX = event.nativeEvent.contentOffset.x;
                            const scrollViewWidth = event.nativeEvent.layoutMeasurement.width;
                            if (scrollViewWidth > 0) {
                              const index = Math.round(offsetX / scrollViewWidth);
                              setCurrentImageIndex(Math.max(0, Math.min(index, images.length - 1)));
                            }
                          }}
                          onMomentumScrollEnd={(event) => {
                            // Zusätzliche Berechnung beim Ende des Scrolls für bessere Genauigkeit
                            const offsetX = event.nativeEvent.contentOffset.x;
                            const scrollViewWidth = event.nativeEvent.layoutMeasurement.width;
                            if (scrollViewWidth > 0) {
                              const index = Math.round(offsetX / scrollViewWidth);
                              setCurrentImageIndex(Math.max(0, Math.min(index, images.length - 1)));
                            }
                          }}
                          scrollEventThrottle={16}
                        >
                          {images.map((imageUri, index) => {
                            // Verwende gemessene Breite oder fallback zu 100%
                            const itemWidth = modalScrollViewWidth || '100%';
                            console.log(`🖼️ Rendering Bild ${index + 1}/${images.length}:`, imageUri?.substring(0, 50) + '...', 'Breite:', itemWidth);
                            
                            return (
                              <View 
                                key={index} 
                                style={[
                                  styles.modalImageWrapper,
                                  typeof itemWidth === 'number' ? { width: itemWidth } : {}
                                ]}
                              >
                                <OptimizedImage
                                  source={{ uri: imageUri }}
                                  style={styles.modalImage}
                                  resizeMode="contain"
                                />
                              </View>
                            );
                          })}
                        </ScrollView>
                        {images.length > 1 && (
                          <View style={styles.imageIndicatorContainer}>
                            <Text style={styles.imageIndicatorText}>
                              {currentImageIndex + 1} / {images.length}
                            </Text>
                          </View>
                        )}
                      </>
                    );
                  })()}
                </View>

                {/* Wein-Informationen */}
                <ScrollView style={styles.modalInfoContainer} showsVerticalScrollIndicator={false}>
                  <Text style={styles.modalWineName}>{selectedWine.name}</Text>
                  
                  {selectedWine.winery && (
                    <Text style={styles.modalInfoText}>🍷 Weingut: {selectedWine.winery}</Text>
                  )}
                  
                  {selectedWine.website && (
                    <Text style={styles.modalInfoText}>🌐 Website: {selectedWine.website}</Text>
                  )}
                  
                  {selectedWine.vintage && (
                    <Text style={styles.modalInfoText}>📅 Jahrgang: {selectedWine.vintage}</Text>
                  )}
                  
                  {selectedWine.region && (
                    <Text style={styles.modalInfoText}>📍 Region: {selectedWine.region}</Text>
                  )}
                  
                  {(selectedWine.grape || selectedWine.grapeVariety) && (
                    <Text style={styles.modalInfoText}>🍇 Rebsorte: {selectedWine.grape || selectedWine.grapeVariety}</Text>
                  )}
                  
                  {selectedWine.tasteProfile && (
                    <Text style={styles.modalInfoText}>👅 Geschmacksprofil: {selectedWine.tasteProfile}</Text>
                  )}
                  
                  <Text style={styles.modalPrice}>
                    💰 {selectedWine.price ? `${parseFloat(selectedWine.price).toFixed(2)}€` : 'Preis auf Anfrage'}
                  </Text>
                  
                  <Text style={styles.modalOwner}>👤 von {selectedWine.owner}</Text>
                  
                  {(() => {
                    const currentUser = getCurrentUser();
                    const isMine = currentUser && (
                      (selectedWine.ownerId && selectedWine.ownerId === currentUser.uid) ||
                      (selectedWine.owner && (selectedWine.owner === currentUser.username || selectedWine.owner === currentUser.email))
                    );
                    const distanceText = currentUser && currentUser.zipCode && selectedWine.ownerZipCode && !isMine
                      ? getDistanceText(currentUser.zipCode, selectedWine.ownerZipCode)
                      : null;
                    
                    return distanceText ? (
                      <Text style={styles.modalDistanceText}>📍 {distanceText}</Text>
                    ) : null;
                  })()}
                  
                  {selectedWine.description && (
                    <View style={styles.modalDescriptionContainer}>
                      <Text style={styles.modalDescriptionLabel}>📝 Beschreibung:</Text>
                      <Text style={styles.modalDescription}>{selectedWine.description}</Text>
                    </View>
                  )}
                </ScrollView>

                {/* Modal Buttons */}
                <View style={styles.modalButtonsContainer}>
                  {(() => {
                    // Prüfe ob der Wein dem aktuellen User gehört
                    const currentUser = getCurrentUser();
                    const isMine = currentUser && (
                      (selectedWine.ownerId && selectedWine.ownerId === currentUser.uid) ||
                      (selectedWine.owner && (selectedWine.owner === currentUser.username || selectedWine.owner === currentUser.email))
                    );
                    
                    if (isMine) {
                      // Eigener Wein: Nur Zurückziehen-Button (roter Pfeil)
                      return (
                        <TouchableOpacity 
                          style={[styles.modalButtonIcon, styles.modalUnpublishButton]}
                          onPress={() => handleUnpublishWine(selectedWine)}
                        >
                          <Text style={styles.modalButtonIconText}>⬇️</Text>
                        </TouchableOpacity>
                      );
                    } else {
                      // Fremder Wein: "Tausch anfragen" Button
                      return (
                        <TouchableOpacity 
                          style={[styles.modalButton, styles.modalTradeButton]}
                          onPress={handleTradeRequest}
                        >
                          <Text style={styles.modalButtonText}>Tausch anfragen</Text>
                        </TouchableOpacity>
                      );
                    }
                  })()}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal zur Auswahl der Anzahl beim Veröffentlichen/Zurückziehen */}
      <Modal
        visible={publishModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setPublishModalVisible(false);
          setSelectedWineForPublish(null);
          setPublishCount(1);
          setPublishMode('publish');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {publishMode === 'publish' ? 'Wein veröffentlichen' : 'Wein zurückziehen'}
            </Text>
            {selectedWineForPublish && (
              <>
                <Text style={styles.modalSubtitle}>
                  {selectedWineForPublish.wine.name}
                </Text>
                <Text style={styles.modalInfo}>
                  {publishMode === 'publish' 
                    ? `Verfügbar: ${selectedWineForPublish.privateWines?.length || 0} private Flasche${(selectedWineForPublish.privateWines?.length || 0) > 1 ? 'n' : ''}`
                    : `Verfügbar: ${selectedWineForPublish.publicWines?.length || 0} veröffentlichte Flasche${(selectedWineForPublish.publicWines?.length || 0) > 1 ? 'n' : ''}`
                  }
                </Text>
                <Text style={styles.modalLabel}>
                  {publishMode === 'publish' 
                    ? 'Wie viele Flaschen möchten Sie veröffentlichen?'
                    : 'Wie viele Flaschen möchten Sie zurückziehen?'
                  }
                </Text>
                {/* Zahlenrad-Picker */}
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerWrapper}>
                    <ScrollView
                      style={styles.pickerScrollView}
                      contentContainerStyle={styles.pickerContent}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={itemHeight}
                      decelerationRate="fast"
                      onMomentumScrollEnd={(event) => {
                        const y = event.nativeEvent.contentOffset.y;
                        const index = Math.round(y / itemHeight);
                        const winesToProcess = publishMode === 'publish' 
                          ? selectedWineForPublish.privateWines 
                          : selectedWineForPublish.publicWines;
                        const maxCount = winesToProcess?.length || 1;
                        const selectedValue = Math.min(Math.max(index + 1, 1), maxCount);
                        setPublishCount(selectedValue);
                      }}
                    >
                      {selectedWineForPublish && (() => {
                        const winesToProcess = publishMode === 'publish' 
                          ? selectedWineForPublish.privateWines 
                          : selectedWineForPublish.publicWines;
                        const maxCount = winesToProcess?.length || 1;
                        const numbers = generateNumbers(maxCount);
                        return numbers.map((num, index) => (
                          <TouchableOpacity
                            key={num}
                            style={[
                              styles.pickerItem,
                              { height: itemHeight },
                              publishCount === num && styles.pickerItemSelected
                            ]}
                            onPress={() => {
                              setPublishCount(num);
                              scrollViewRef.current?.scrollTo({
                                y: index * itemHeight,
                                animated: true,
                              });
                            }}
                          >
                            <Text style={[
                              styles.pickerItemText,
                              publishCount === num && styles.pickerItemTextSelected
                            ]}>
                              {num}
                            </Text>
                          </TouchableOpacity>
                        ));
                      })()}
                    </ScrollView>
                    {/* Highlight-Linien oben und unten */}
                    <View style={styles.pickerHighlight} />
                  </View>
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => {
                      setPublishModalVisible(false);
                      setSelectedWineForPublish(null);
                      setPublishCount(1);
                      setPublishMode('publish');
                    }}
                  >
                    <Text style={styles.modalButtonCancelText}>Abbrechen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={handleConfirmPublish}
                  >
                    <Text style={styles.modalButtonConfirmText}>
                      {publishMode === 'publish' ? 'Veröffentlichen' : 'Zurückziehen'}
                    </Text>
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
  headerLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
  },
  // Header Styles
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
  wishlistButton: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  wishlistHeartContainer: {
    position: 'relative',
  },
  wishlistHeart: {
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  wishlistBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 1000,
    elevation: 10,
  },
  wishlistBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 0,
    width: 80, // Mehr Platz für beide Buttons
    alignItems: 'center',
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  dashboardButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(218, 165, 32, 0.3)', // Warmes Gold
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.5)',
  },
  dashboardButtonText: {
    fontSize: 22,
    color: '#2c2c2c', // Dunkler Text
  },
  greeting: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2c2c2c', // Dunkler Text auf hellem Hintergrund
    textAlign: 'center',
    marginBottom: 10,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: '#F5DEB3',
    textAlign: 'center',
    marginBottom: 30,
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
    color: '#2c2c2c', // Dunkler Text auf hellem Hintergrund
    marginBottom: 10,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#4a4a4a', // Dunklerer Grauton auf hellem Hintergrund
    textAlign: 'center',
    opacity: 0.9,
  },
  winesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16, // Abstand zu den Seiten
    paddingVertical: 8, // Abstand oben/unten
  },
  wineRow: {
    width: '48%', // Zwei Spalten: 48% Breite + 4% Abstand = 100%
    aspectRatio: 1, // Quadratisches Format für Bilder
    marginBottom: 16, // Abstand zwischen den Zeilen
    borderRadius: 20, // Mehr abgerundete Ecken für moderneres Design
    overflow: 'hidden', // Verhindert, dass Elemente außerhalb der Kachel erscheinen
    // Glassmorphism Effekt
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // Heller, transparenter Glass-Effekt
    borderWidth: 1.5, // Dünnere Border für klare, aber nicht dominante Abgrenzung
    borderColor: '#FFFFFF', // Weiße Border
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
    backgroundColor: '#f5f5f5', // Heller Hintergrund für bessere Sichtbarkeit
    overflow: 'hidden',
  },
  myWineBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(218, 165, 32, 0.9)', // Warmes Gold mit hoher Deckkraft
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 1)', // Gold Border
    zIndex: 10, // Über dem Bild
    // Schatten für bessere Sichtbarkeit
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  myWineBadgeText: {
    color: '#2c2c2c', // Dunkler Text auf Gold
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  singleImageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  imageWrapper: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  rowImageOnly: {
    width: '100%',
    height: '100%',
  },
  imageSwipeContainer: {
    width: '100%',
    height: '100%',
  },
  imageSwipeContent: {
    alignItems: 'center',
  },
  rowPlaceholderImageOnly: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(218, 165, 32, 0.2)', // Warmes Gold für Placeholder
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.3)',
  },
  placeholderTextOnly: {
    fontSize: 64,
    opacity: 0.6,
    color: '#a9c7cd', // Warmes Gold für Placeholder-Emoji
  },
  rowImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)', // Helleres Glassmorphism Overlay
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(218, 165, 32, 0.4)', // Warmes Gold Akzent
  },
  rowImageOverlayText: {
    color: '#2c2c2c', // Dunkler Text auf hellem Overlay
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rowImageDistanceText: {
    color: '#666666', // Grauer Text für Entfernung
    fontSize: 11,
    fontWeight: 'normal',
    textAlign: 'center',
    marginTop: 2,
  },
  rowTopSection: {
    flexDirection: 'row',
    marginBottom: 8, // Abstand zu den Buttons
    height: 100, // Entspricht der Bildhöhe
  },
  rowImageContainer: {
    width: 100,
    height: 100,
    marginRight: 12,
    alignSelf: 'flex-start', // Bild oben links
  },
  rowImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12, // Mehr abgerundete Ecken für moderneres Design
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Helle Borders auf dunklem Hintergrund
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3, // Android Shadow für Bild
  },
  rowPlaceholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)', // Helleres Placeholder auf dunklem Hintergrund
    borderRadius: 12, // Mehr abgerundete Ecken
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  rowInfoContainer: {
    flex: 1,
    justifyContent: 'flex-start', // Informationen oben strukturiert
    minWidth: 0, // Erlaubt Text-Wrapping
    paddingTop: 0,
  },
  rowName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF', // Weiß auf dunklem Hintergrund
    marginBottom: 2,
  },
  rowGrape: {
    fontSize: 14,
    color: '#CCCCCC', // Hellgrau auf dunklem Hintergrund
    marginBottom: 2,
  },
  rowPrice: {
    fontSize: 16,
    color: '#FFFFFF', // Weiß auf dunklem Hintergrund
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 4,
  },
  rowOwner: {
    fontSize: 12,
    color: '#CCCCCC', // Hellgrau auf dunklem Hintergrund
    opacity: 0.9,
    marginTop: 2,
  },
  rowActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end', // Buttons am rechten Rand
    alignItems: 'center',
    width: '100%', // Volle Breite des Displays
    paddingTop: 4,
    paddingRight: 16, // Padding am rechten Rand des Containers
    gap: 8, // Abstand zwischen Buttons
  },
  // rowDivider entfernt - verwenden jetzt Margin zwischen Karten statt Divider
  rowActionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)', // Stärkere Transparenz für bessere Sichtbarkeit
    height: 40,
    borderRadius: 8, // Etwas runder für moderneres Design
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)', // Stärkere Borders für bessere Sichtbarkeit
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16, // Padding links/rechts für Buttons
    marginRight: 0, // Kein Margin rechts, da wir paddingRight am Container haben
    minWidth: 'auto', // Automatische Breite basierend auf Inhalt
    flexShrink: 0, // Verhindert, dass Buttons schrumpfen
  },
  // rowActionPlaceholder entfernt - nicht mehr benötigt, da Buttons am rechten Rand sind
  rowDeleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.3)', // Stärkere rote Transparenz für bessere Sichtbarkeit
    borderColor: 'rgba(244, 67, 54, 0.5)', // Roter Border für Delete-Buttons
  },
  rowActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF', // Weiß auf dunklem Hintergrund
    textAlign: 'center',
  },
  placeholderText: {
    fontSize: 32,
    opacity: 0.5,
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
    color: '#4a4a4a', // Dunklerer Grauton auf hellem Hintergrund
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)', // Dunkler Overlay hinter Modal
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Helles Glassmorphism Modal
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(218, 165, 32, 0.5)', // Warmes Gold Akzent
    shadowColor: '#a9c7cd',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(218, 165, 32, 0.4)', // Warmes Gold Akzent
    backgroundColor: 'rgba(218, 165, 32, 0.15)', // Subtiler Gold Hintergrund
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c2c2c', // Dunkler Text auf hellem Hintergrund
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(218, 165, 32, 0.3)', // Warmes Gold Akzent
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 20,
    color: '#2c2c2c', // Dunkler Text
    fontWeight: 'bold',
  },
  modalImageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: 'transparent',
    overflow: 'hidden', // Verhindert Überlauf
    position: 'relative', // Für absolute Positionierung des Indikators
  },
  modalImageWrapper: {
    height: 250,
    // width wird dynamisch gesetzt (feste Pixel-Breite für pagingEnabled)
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    flexShrink: 0, // Verhindert, dass Items schrumpfen
    overflow: 'hidden', // Verhindert Überlauf
  },
  modalImage: {
    width: '100%',
    height: 250,
  },
  modalPlaceholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPlaceholderText: {
    fontSize: 80,
    opacity: 0.5,
    color: '#FFFFFF',
  },
  modalInfoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    maxHeight: 300,
  },
  modalWineName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c2c2c', // Dunkler Text auf hellem Hintergrund
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInfoText: {
    fontSize: 15,
    color: '#4a4a4a', // Dunklerer Grauton für bessere Lesbarkeit
    marginBottom: 10,
    lineHeight: 22,
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a9c7cd', // Warmes Gold für Preis
    marginTop: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalOwner: {
    fontSize: 14,
    color: '#666666', // Mittlerer Grauton
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDistanceText: {
    fontSize: 14,
    color: '#a9c7cd', // Warmes Gold für Entfernung
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalDescriptionContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(218, 165, 32, 0.3)', // Warmes Gold Akzent
  },
  modalDescriptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c2c2c', // Dunkler Text
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#4a4a4a', // Dunklerer Grauton
    lineHeight: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  modalButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  modalTradeButton: {
    backgroundColor: 'rgba(218, 165, 32, 0.5)', // Warmes Gold für Tausch-Button
    borderColor: 'rgba(218, 165, 32, 0.7)',
  },
  modalPublishButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.4)', // Grün für Veröffentlichen
    borderColor: 'rgba(76, 175, 80, 0.6)',
  },
  modalUnpublishButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.4)', // Rot für Zurückziehen
    borderColor: 'rgba(244, 67, 54, 0.6)',
  },
  modalButtonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalButtonIconText: {
    fontSize: 24,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c', // Dunkler Text auf hellem Button
  },
  // Picker Styles
  pickerContainer: {
    height: 150,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerWrapper: {
    height: 150,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  pickerScrollView: {
    flex: 1,
  },
  pickerContent: {
    paddingVertical: 50, // Padding oben/unten für besseres Scrollen
  },
  pickerItem: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  pickerItemSelected: {
    backgroundColor: 'rgba(218, 165, 32, 0.15)',
  },
  pickerItemText: {
    fontSize: 32,
    color: '#999',
    fontWeight: '400',
  },
  pickerItemTextSelected: {
    fontSize: 40,
    color: '#a9c7cd',
    fontWeight: 'bold',
  },
  pickerHighlight: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    height: 50,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#a9c7cd',
    backgroundColor: 'rgba(218, 165, 32, 0.05)',
    pointerEvents: 'none',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButtonConfirm: {
    backgroundColor: '#a9c7cd',
  },
  modalButtonCancel: {
    backgroundColor: '#E0E0E0',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2c2c2c',
  },
  viewToggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  viewToggleButtonActive: {
    backgroundColor: '#DAA520', // Gold
    borderColor: '#DAA520',
  },
  viewToggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  viewToggleButtonTextActive: {
    color: '#2c2c2c',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 5,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listItemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    marginRight: 12,
  },
  listItemTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listItemImage: {
    width: 80,
    height: 80,
  },
  listItemPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(218, 165, 32, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItemPlaceholderText: {
    fontSize: 32,
    opacity: 0.6,
  },
  listItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  listItemDistanceText: {
    fontSize: 12,
    color: '#4a4a4a',
    opacity: 0.8,
  },
  listItemMyWineBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(218, 165, 32, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 1)',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  listItemMyWineBadgeText: {
    color: '#2c2c2c',
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2c2c2c',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginRight: 8,
  },
  searchClearButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  searchClearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  showMyWinesButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(218, 165, 32, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 1)',
  },
  showMyWinesButtonInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  showMyWinesButtonText: {
    fontSize: 18,
  },
  modalImageSwipeContainer: {
    width: '100%',
    height: 250,
    overflow: 'hidden', // Verhindert Überlauf
  },
  modalImageSwipeContent: {
    // Bei pagingEnabled sollten Items direkt nebeneinander liegen, ohne Zentrierung
    // Die Zentrierung erfolgt durch die Items selbst (modalImageWrapper)
    flexDirection: 'row', // Explizit horizontal
  },
  imageIndicatorContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    zIndex: 10,
  },
  imageIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
