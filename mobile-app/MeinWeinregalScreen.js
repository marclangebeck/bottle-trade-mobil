import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  TextInput,
  Modal,
  Dimensions,
  FlatList
} from 'react-native';
import { ImageBackground } from 'react-native';
import OptimizedImage from './components/OptimizedImage';
import Footer from './Footer';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import BottomNavigation from './components/BottomNavigation';
import ProVersionButton from './components/ProVersionButton';
import LimitInfoBanner from './components/LimitInfoBanner';
import { getWinesByOwner, deleteWine, publishWine, unpublishWine } from './data/mockData';
import { addWine } from './services/database-web';
import { getAllWinesByOwner, getUser } from './services/database-web';
import { getCurrentUser } from './services/testAuth';

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

export default function MeinWeinregalScreen({ onNavigate, onLogout, isAdmin = false, unreadCount = 0, isLoggedIn = false, viewUserId = null, tradeRequestId = null, onSelectTradeWine = null, onDeclineTradeRequest = null, wishlistMatchCount = 0, isPro = false }) {
  const [wines, setWines] = useState([]);
  const [allWines, setAllWines] = useState([]); // Alle Weine inkl. getauschter Weine für Flaschenzählung
  const [currentUserId, setCurrentUserId] = useState('');
  const [viewingOtherUserId, setViewingOtherUserId] = useState(viewUserId || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [publishModalVisible, setPublishModalVisible] = useState(false);
  const [selectedWineForPublish, setSelectedWineForPublish] = useState(null);
  const [publishCount, setPublishCount] = useState(1);
  const [publishMode, setPublishMode] = useState('publish'); // 'publish' oder 'unpublish'
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedWineForDelete, setSelectedWineForDelete] = useState(null);
  const [deleteCount, setDeleteCount] = useState(1);
  const [profileImage, setProfileImage] = useState(null);
  const scrollViewRef = useRef(null);
  const deleteScrollViewRef = useRef(null);
  const itemHeight = 50;
  const [selectedWine, setSelectedWine] = useState(null); // Für Modal
  const [isModalVisible, setIsModalVisible] = useState(false); // Modal sichtbar
  const [currentImageIndex, setCurrentImageIndex] = useState(0); // Für Swipe-Galerie
  const [modalScrollViewWidth, setModalScrollViewWidth] = useState(null); // Breite der ScrollView für pagingEnabled
  const lastLoadedOwnerIdRef = useRef(null); // Verhindert mehrfaches Laden für denselben Owner
  const [viewMode, setViewMode] = useState('container'); // 'container' oder 'list'
  const [searchText, setSearchText] = useState(''); // Suchtext für Filterung

  // Admin-Status wird von App.js übergeben
  console.log('🔍 MeinWeinregalScreen: Admin-Status:', isAdmin ? 'Admin' : 'Standard-User');

  useEffect(() => {
    // Nur User-ID setzen, wenn eingeloggt
    if (isLoggedIn) {
      setCurrentUserIdFromAuth();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // Lade Profilbild, wenn currentUserId gesetzt ist
    if (currentUserId && isLoggedIn) {
      loadProfileImage();
    }
  }, [currentUserId, isLoggedIn]);

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
  const filterWines = (winesList, searchQuery) => {
    if (!searchQuery || searchQuery.trim() === '') {
      return winesList;
    }
    
    const query = searchQuery.toLowerCase().trim();
    return winesList.filter(wine => {
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
  };

  useEffect(() => {
    // Nur Weine laden, wenn eingeloggt oder Fremdregal angeschaut wird
    if (isLoggedIn || viewingOtherUserId) {
      const ownerIdToLoad = viewingOtherUserId || currentUserId;
      
      // Verhindere mehrfaches Laden für denselben Owner
      if (ownerIdToLoad && ownerIdToLoad !== lastLoadedOwnerIdRef.current) {
        lastLoadedOwnerIdRef.current = ownerIdToLoad;
        loadWines(ownerIdToLoad);
      }
    }
  }, [currentUserId, viewingOtherUserId, isLoggedIn]);

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

  // Scroll zum ausgewählten Wert im Delete-Modal
  useEffect(() => {
    if (deleteModalVisible && selectedWineForDelete && deleteScrollViewRef.current) {
      const wineIds = selectedWineForDelete.wineIds || [selectedWineForDelete.id];
      const maxCount = wineIds.length;
      const currentCount = typeof deleteCount === 'number' ? deleteCount : parseInt(deleteCount, 10) || 1;
      const selectedIndex = Math.min(Math.max(currentCount - 1, 0), maxCount - 1);
      
      setTimeout(() => {
        deleteScrollViewRef.current?.scrollTo({
          y: selectedIndex * itemHeight,
          animated: false,
        });
      }, 150);
    }
  }, [deleteModalVisible, selectedWineForDelete]);

  // Generiere Zahlenliste für den Picker
  const generateNumbers = (max) => {
    return Array.from({ length: max }, (_, i) => i + 1);
  };

  const setCurrentUserIdFromAuth = () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.uid) {
        setCurrentUserId(currentUser.uid);
        console.log('✅ MeinWeinregalScreen: User-ID gesetzt:', currentUser.uid, 'für', currentUser.email);
      } else {
        // Nur warnen, wenn wirklich eingeloggt sein sollte, aber kein User gefunden wird
        if (isLoggedIn) {
          console.warn('⚠️ MeinWeinregalScreen: Kein User gefunden, obwohl eingeloggt');
        }
        // Kein Fallback mehr - nur setzen, wenn User wirklich vorhanden ist
      }
    } catch (error) {
      console.error('❌ MeinWeinregalScreen: Fehler beim Laden der User-ID:', error);
      // Kein Fallback mehr - nur setzen, wenn User wirklich vorhanden ist
    }
  };

  const loadWines = async (ownerIdParam) => {
    try {
      const owner = ownerIdParam || currentUserId;
      console.log('🔄 MeinWeinregalScreen: Loading wines for user:', owner);
      
      // Lade Weine für Regal-Anzeige (ohne getauschte Weine)
      const userWines = await getWinesByOwner(owner);
      console.log('✅ MeinWeinregalScreen: Loaded', userWines.length, 'wines');
      setWines(userWines);
      
      // Lade alle Weine (inkl. getauschter Weine) für Flaschenzählung
      if (!viewingOtherUserId) { // Nur für eigenes Regal, nicht für Fremdregal
        const allUserWines = await getAllWinesByOwner(owner);
        setAllWines(allUserWines);
      }
    } catch (error) {
      console.error('❌ MeinWeinregalScreen: Error loading wines:', error);
      setWines([]);
      setAllWines([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Berechne Anzahl der Flaschen eines Weins (anhand von Name, Winery, Vintage)
  // WICHTIG: Getauschte Weine werden nicht mitgezählt
  const getBottleCount = (wine) => {
    if (viewingOtherUserId) return null; // Keine Zählung für Fremdregal
    
    return allWines.filter(w => 
      w.name === wine.name &&
      (w.winery === wine.winery || (!w.winery && !wine.winery)) &&
      (w.vintage === wine.vintage || (!w.vintage && !wine.vintage)) &&
      w.status !== 'traded' // Getauschte Weine nicht mitzählen
    ).length;
  };

  // Berechne Anzahl der in der Weinbörse veröffentlichten Flaschen
  // WICHTIG: Getauschte Weine werden nicht mitgezählt
  const getPublishedCount = (wine) => {
    if (viewingOtherUserId) return null; // Keine Zählung für Fremdregal
    
    return allWines.filter(w => 
      w.name === wine.name &&
      (w.winery === wine.winery || (!w.winery && !wine.winery)) &&
      (w.vintage === wine.vintage || (!w.vintage && !wine.vintage)) &&
      w.status === 'public' &&
      w.status !== 'traded' // Getauschte Weine nicht mitzählen
    ).length;
  };

  // Gruppiere identische Weine zusammen (basierend auf Name, Winery, Vintage)
  const groupWines = (winesList) => {
    if (viewingOtherUserId) return winesList; // Keine Gruppierung für Fremdregal
    
    const grouped = {};
    
    winesList.forEach(wine => {
      // Erstelle einen eindeutigen Schlüssel für die Gruppierung
      const key = `${wine.name || ''}_${wine.winery || ''}_${wine.vintage || ''}`;
      
      if (!grouped[key]) {
        // Erste Flasche dieser Gruppe - verwende diese als repräsentative Flasche
        grouped[key] = {
          ...wine,
          wineIds: [wine.id], // Liste aller IDs dieser Gruppe
        };
      } else {
        // Weitere Flasche derselben Gruppe - füge ID hinzu
        grouped[key].wineIds.push(wine.id);
        
        // Aktualisiere den Status: Wenn eine Flasche public ist, zeige das an
        if (wine.status === 'public' && grouped[key].status !== 'public' && grouped[key].status !== 'mixed') {
          grouped[key].status = 'mixed'; // Gemischter Status
        } else if (wine.status === 'private' && grouped[key].status === 'public') {
          grouped[key].status = 'mixed'; // Gemischter Status
        }
        
        // Verwende das erste Bild, das vorhanden ist
        if (!grouped[key].labelImage && wine.labelImage) {
          grouped[key].labelImage = wine.labelImage;
        }
      }
    });
    
    // Berechne Zählungen für jede Gruppe
    return Object.values(grouped).map(group => ({
      ...group,
      bottleCount: getBottleCount(group),
      publishedCount: getPublishedCount(group),
    }));
  };

  // Gefilterte Weine (mit useMemo für Performance)
  const filteredWines = useMemo(() => {
    const groupedWinesList = groupWines(wines);
    return filterWines(groupedWinesList, searchText);
  }, [wines, searchText, viewingOtherUserId]);

  // Hamburger-Menü-Funktionen entfernt - wird durch DynamicHamburgerMenu gehandhabt

  const handleDeleteWine = (wine, wineName) => {
    const wineIds = wine.wineIds || [wine.id];
    
    if (wineIds.length === 0) {
      Alert.alert('Fehler', 'Keine Weine zum Löschen gefunden.');
      return;
    }
    
    // Modal zur Auswahl der Anzahl zeigen
    setSelectedWineForDelete({ wine, wineName, wineIds });
    setDeleteCount(1);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedWineForDelete) return;
    
    try {
      const { wineName, wineIds } = selectedWineForDelete;
      const count = typeof deleteCount === 'number' ? deleteCount : parseInt(deleteCount, 10);
      
      if (isNaN(count) || count < 1) {
        Alert.alert('Fehler', 'Bitte wählen Sie eine gültige Anzahl.');
        return;
      }
      
      if (count > wineIds.length) {
        Alert.alert('Fehler', `Sie haben nur ${wineIds.length} Flasche${wineIds.length > 1 ? 'n' : ''} verfügbar.`);
        return;
      }
      
      // Nur die gewählte Anzahl löschen
      const winesToDelete = wineIds.slice(0, count);
      
      for (const id of winesToDelete) {
        await deleteWine(id);
      }
      
      console.log('✅ Wein erfolgreich gelöscht:', winesToDelete);
      Alert.alert('Erfolg', count > 1 
        ? `${count} Flaschen von "${wineName}" wurden erfolgreich gelöscht.`
        : `"${wineName}" wurde erfolgreich aus allen Datenbanken gelöscht.`);
      
      setDeleteModalVisible(false);
      setSelectedWineForDelete(null);
      setDeleteCount(1);
      loadWines(currentUserId); // Liste aktualisieren
    } catch (error) {
      console.error('❌ Fehler beim Löschen des Weins:', error);
      Alert.alert('Fehler', 'Wein konnte nicht gelöscht werden. Bitte versuchen Sie es erneut.');
    }
  };

  const handleEditWine = (wine) => {
    // Navigation zum Bearbeiten-Screen mit Wein-Daten
    onNavigate('weinregalEdit', { wineData: wine });
  };

  const handleTogglePublish = async (wine) => {
    console.log('🔍 handleTogglePublish aufgerufen mit:', wine);
    console.log('🔍 allWines.length:', allWines.length);
    console.log('🔍 currentUserId:', currentUserId);
    
    try {
      const wineIds = wine.wineIds || [wine.id];
      const isCurrentlyPublic = wine.status === 'public' || wine.status === 'mixed';
      
      console.log('🔍 wineIds:', wineIds);
      console.log('🔍 isCurrentlyPublic:', isCurrentlyPublic);
      
      if (isCurrentlyPublic) {
        console.log('🔍 Wein ist bereits veröffentlicht - Zurückziehen-Modus');
        // Modal zur Auswahl der Anzahl beim Zurückziehen zeigen
        const publicWines = wineIds.filter(id => {
          const wineData = allWines.find(w => w.id === id);
          return wineData && wineData.status === 'public';
        });
        
        console.log('🔍 publicWines gefunden:', publicWines.length);
        
        if (publicWines.length === 0) {
          Alert.alert('Info', 'Keine veröffentlichten Flaschen zum Zurückziehen vorhanden.');
          return;
        }
        
        setSelectedWineForPublish({ wine, publicWines });
        setPublishCount(1);
        setPublishMode('unpublish');
        setPublishModalVisible(true);
      } else {
        console.log('🔍 Wein ist privat - Veröffentlichen-Modus');
        // Modal zur Auswahl der Anzahl beim Veröffentlichen zeigen
        // VERBESSERT: Suche in allWines nach allen privaten Weinen mit gleichem Namen/Winery/Vintage
        // nicht nur in wineIds, da wineIds möglicherweise nicht alle privaten Weine enthält
        const wineName = wine?.name || wine?.title;
        const wineWinery = wine?.winery;
        const wineVintage = wine?.vintage;
        
        console.log('🔍 Suche nach privaten Weinen:', { wineName, wineWinery, wineVintage });
        
        // Prüfe zuerst, ob überhaupt private Weine existieren
        const anyPrivateWines = allWines.filter(w => 
          w.ownerId === currentUserId && 
          w.status === 'private' && 
          w.status !== 'traded'
        );
        
        console.log('🔍 anyPrivateWines gefunden:', anyPrivateWines.length);
        console.log('🔍 anyPrivateWines Details:', anyPrivateWines.map(w => ({ id: w.id, name: w.name, status: w.status })));
        
        if (anyPrivateWines.length === 0) {
          console.log('❌ Keine privaten Weine gefunden!');
          Alert.alert('Info', 'Keine privaten Flaschen zum Veröffentlichen vorhanden.');
          return;
        }
        
        // Wenn kein Name vorhanden ist, zeige alle privaten Weine
        if (!wineName) {
          console.log('🔍 Kein Wein-Name vorhanden - zeige alle privaten Weine');
          // Kein spezifischer Wein - zeige alle privaten Weine
          const privateWines = anyPrivateWines.map(w => w.id);
          
          console.log('🔍 privateWines (ohne Name):', privateWines);
          
          // KRITISCH: Prüfe ob privateWines tatsächlich vorhanden sind
          if (!privateWines || privateWines.length === 0) {
            console.log('❌ privateWines ist leer!');
            Alert.alert('Info', 'Keine privaten Flaschen zum Veröffentlichen vorhanden.');
            return;
          }
          
          // Erstelle ein minimales Wein-Objekt für das Modal
          const wineForModal = {
            ...wine,
            name: anyPrivateWines[0]?.name || 'Wein',
            title: anyPrivateWines[0]?.name || 'Wein'
          };
          
          console.log('✅ Öffne Modal mit allen privaten Weinen:', privateWines.length);
          
          // KRITISCH: Schließe zuerst das Wein-Detail-Modal, bevor das Publish-Modal geöffnet wird
          handleCloseModal();
          
          // Warte kurz, damit das Wein-Detail-Modal geschlossen werden kann
          setTimeout(() => {
            setSelectedWineForPublish({ wine: wineForModal, privateWines });
            setPublishCount(1);
            setPublishMode('publish');
            setPublishModalVisible(true);
            console.log('✅ Modal-State gesetzt - publishModalVisible sollte true sein');
          }, 100);
          return;
        }
        
        console.log('🔍 Suche nach spezifischen privaten Weinen mit Name:', wineName);
        
        // Finde alle privaten Weine mit gleichem Namen/Winery/Vintage (nur eigene!)
        const allPrivateWines = allWines.filter(w => {
          const matches = w.ownerId === currentUserId &&
            w.name === wineName &&
            (w.winery === wineWinery || (!w.winery && !wineWinery)) &&
            (w.vintage === wineVintage || (!w.vintage && !wineVintage)) &&
            w.status === 'private' &&
            w.status !== 'traded';
          return matches;
        });
        
        console.log('🔍 allPrivateWines gefunden:', allPrivateWines.length);
        console.log('🔍 allPrivateWines Details:', allPrivateWines.map(w => ({ id: w.id, name: w.name, status: w.status, winery: w.winery, vintage: w.vintage })));
        
        const privateWines = allPrivateWines.map(w => w.id);
        
        console.log('🔍 privateWines IDs:', privateWines);
        
        // KRITISCH: Prüfe ob privateWines tatsächlich vorhanden sind
        if (!privateWines || privateWines.length === 0) {
          console.log('❌ Keine privaten Weine mit diesem Namen gefunden!');
          // Es gibt private Weine, aber nicht von diesem spezifischen Wein
          Alert.alert(
            'Info', 
            `Keine privaten Flaschen von "${wineName}" zum Veröffentlichen vorhanden.\n\nSie haben ${anyPrivateWines.length} private Flasche(n) im Regal, die veröffentlicht werden können.`
          );
          return;
        }
        
        console.log('✅ Öffne Modal mit spezifischen privaten Weinen:', privateWines.length);
        
        // KRITISCH: Schließe zuerst das Wein-Detail-Modal, bevor das Publish-Modal geöffnet wird
        handleCloseModal();
        
        // Warte kurz, damit das Wein-Detail-Modal geschlossen werden kann
        setTimeout(() => {
          setSelectedWineForPublish({ wine, privateWines });
          setPublishCount(1);
          setPublishMode('publish');
          setPublishModalVisible(true);
          console.log('✅ Modal-State gesetzt - publishModalVisible sollte true sein');
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error toggling wine publish status:', error);
      Alert.alert('Fehler', 'Status konnte nicht geändert werden.');
    }
  };

  const handleConfirmPublish = async () => {
    if (!selectedWineForPublish) {
      console.error('❌ handleConfirmPublish: selectedWineForPublish ist null');
      return;
    }
    
    try {
      const { wine } = selectedWineForPublish;
      const winesToProcess = publishMode === 'publish' 
        ? (selectedWineForPublish.privateWines || [])
        : (selectedWineForPublish.publicWines || []);
      
      if (!winesToProcess || winesToProcess.length === 0) {
        Alert.alert('Fehler', 'Keine Weine zum Verarbeiten gefunden.');
        setPublishModalVisible(false);
        setSelectedWineForPublish(null);
        return;
      }
      
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
      
      const wineName = wine?.name || wine?.title || 'Wein';
      
      if (publishMode === 'publish') {
        // Veröffentlichen
        for (const id of winesToAction) {
          await publishWine(id, currentUserId);
        }
        
        Alert.alert('Erfolg', count > 1 
          ? `${count} Flaschen von "${wineName}" wurden in der Weinbörse veröffentlicht!`
          : `"${wineName}" wurde in der Weinbörse veröffentlicht!`);
      } else {
        // Zurückziehen
        for (const id of winesToAction) {
          await unpublishWine(id);
        }
        
        Alert.alert('Erfolg', count > 1 
          ? `${count} Flaschen von "${wineName}" wurden aus der Weinbörse zurückgezogen.`
          : `"${wineName}" wurde aus der Weinbörse zurückgezogen.`);
      }
      
      setPublishModalVisible(false);
      setSelectedWineForPublish(null);
      setPublishCount(1);
      setPublishMode('publish');
      loadWines(currentUserId); // Weine neu laden
    } catch (error) {
      console.error(`Error ${publishMode === 'publish' ? 'publishing' : 'unpublishing'} wines:`, error);
      Alert.alert('Fehler', `Weine konnten nicht ${publishMode === 'publish' ? 'veröffentlicht' : 'zurückgezogen'} werden.`);
    }
  };

  const handleAddDuplicate = async (wine) => {
    try {
      const payload = {
        name: wine.name || 'Unbekannter Wein',
        // Entferne wineType, wenn es undefined ist (wird automatisch gefiltert)
        ...(wine.wineType && { wineType: wine.wineType }),
        ...(wine.winery && { winery: wine.winery }),
        ...(wine.vintage && { vintage: wine.vintage }),
        ...(wine.region && { region: wine.region }),
        ...(wine.grapeVariety && { grapeVariety: wine.grapeVariety }),
        price: wine.price || null,
        labelImage: wine.labelImage || null,
        description: wine.description || '',
        ownerId: currentUserId,
        owner: 'Du',
        // Status 'private' bedeutet: im Weinregal, aber NICHT in der Weinbörse veröffentlicht
        status: 'private',
        availableForTrade: false,
      };
      const newId = await addWine(payload);
      
      // Lade beide Listen neu
      loadWines(currentUserId);
      
      Alert.alert('Erfolg', 'Neue Flasche wurde zu deinem Weinregal hinzugefügt.\n\nSie ist noch nicht in der Weinbörse veröffentlicht.');
    } catch (error) {
      console.error('❌ Fehler beim Hinzufügen der Flasche:', error);
      Alert.alert('Fehler', 'Neue Flasche konnte nicht hinzugefügt werden.');
    }
  };

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

  const handleModalEdit = () => {
    if (!selectedWine) return;
    handleCloseModal();
    handleEditWine(selectedWine);
  };

  const handleModalPublish = () => {
    if (!selectedWine) return;
    handleCloseModal();
    handleTogglePublish(selectedWine);
  };

  const handleModalDelete = () => {
    if (!selectedWine) return;
    handleCloseModal();
    handleDeleteWine(selectedWine, selectedWine.name);
  };

  const handleModalAddDuplicate = () => {
    if (!selectedWine) return;
    handleCloseModal();
    handleAddDuplicate(selectedWine);
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
          
          {/* Limit-Hinweis für Basic-User (nur für eigenes Regal) */}
          {isLoggedIn && currentUserId && !viewingOtherUserId && (
            <LimitInfoBanner
              type="weinregal"
              userId={currentUserId}
              isPro={isPro}
              isLoggedIn={isLoggedIn}
            />
          )}
          
          {/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>{viewingOtherUserId ? 'Weinregal (Auswahl)' : 'Weinregal'}</Text>
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
          
          {/* Suchfeld */}
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
          </View>

          {/* Content */}
          {viewMode === 'container' ? (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              {/* Button "Weinregal befüllen erweitern" - nur für eigenes Regal */}
              {!viewingOtherUserId && (
                <TouchableOpacity 
                  style={styles.addWineButton}
                  onPress={() => onNavigate('weinregal')}
                >
                  <Text style={[styles.addWineButtonIcon, { color: '#FFFFFF' }]}>➕</Text>
                  <Text style={styles.addWineButtonText}>Weinregal befüllen</Text>
                </TouchableOpacity>
              )}
              
              {isLoading ? (
                <Text style={styles.dashboardSubtitle}>
                  Lade {viewingOtherUserId ? 'fremdes Weinregal' : 'dein Weinregal'}...
                </Text>
              ) : (
                viewingOtherUserId ? (
                  <Text style={styles.dashboardSubtitle}>
                    {`Der Nutzer hat ${wines.length} ${wines.length === 1 ? 'Wein' : 'Weine'} im Regal.`}
                  </Text>
                ) : null
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
                    {searchText ? 'Keine Weine gefunden' : 'Noch keine Weine'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {searchText ? 'Versuchen Sie eine andere Suche' : 'Füge deinen ersten Wein hinzu, um zu tauschen!'}
                  </Text>
                  {/* Button wird jetzt oben angezeigt */}
                </View>
              ) : (
                <View style={styles.winesList}>
                  {viewingOtherUserId && tradeRequestId && (
                    <View style={styles.tradeActionBar}>
                      <TouchableOpacity 
                        style={[styles.declineBarButton]}
                        onPress={async () => {
                          if (onDeclineTradeRequest) {
                            try {
                              await onDeclineTradeRequest({ requestId: tradeRequestId, otherUserId: viewingOtherUserId });
                              console.log('✅ Ablehnung erfolgreich verarbeitet');
                            } catch (error) {
                              console.error('❌ Fehler beim Ablehnen:', error);
                              Alert.alert(
                                'Fehler',
                                'Die Tauschanfrage konnte nicht abgelehnt werden. Bitte versuchen Sie es erneut.',
                                [{ text: 'OK' }]
                              );
                            }
                          }
                        }}
                      >
                        <Text style={styles.declineBarButtonText}>Anfrage ablehnen</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  {filteredWines.map((wine, index) => {
                    const currentUser = getCurrentUser && getCurrentUser();
                    // Im eigenen Regal sind alle Weine "meine", im Fremdregal prüfen wir die Owner-ID
                    const isMine = !viewingOtherUserId || (currentUser && (
                      (wine.ownerId && wine.ownerId === currentUser.uid) ||
                      (wine.owner && (wine.owner === currentUser.username || wine.owner === currentUser.email))
                    ));
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
                        key={wine.id || wine.wineIds?.[0]} 
                        style={rowStyle}
                        activeOpacity={0.8}
                        onPress={() => handleWineImagePress(wine)}
                      >
                        {/* Nur Bild - Container besteht nur aus Bild */}
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
                          {/* Optional: Subtiler Overlay mit Wein-Name (optional) */}
                          <View style={styles.rowImageOverlay}>
                            <Text style={styles.rowImageOverlayText} numberOfLines={1}>
                              {wine.name}
                            </Text>
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
                {/* Button "Weinregal befüllen erweitern" - nur für eigenes Regal */}
                {!viewingOtherUserId && (
                  <TouchableOpacity 
                    style={styles.addWineButton}
                    onPress={() => onNavigate('weinregal')}
                  >
                    <Text style={[styles.addWineButtonIcon, { color: '#FFFFFF' }]}>➕</Text>
                    <Text style={styles.addWineButtonText}>Weinregal befüllen</Text>
                  </TouchableOpacity>
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
                      {searchText ? 'Keine Weine gefunden' : 'Noch keine Weine'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {searchText ? 'Versuchen Sie eine andere Suche' : 'Füge deinen ersten Wein hinzu, um zu tauschen!'}
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={filteredWines}
                    keyExtractor={(item) => item.id || item.wineIds?.[0] || `wine-${item.name}`}
                    renderItem={({ item: wine }) => {
                      const currentUser = getCurrentUser && getCurrentUser();
                      // Im eigenen Regal sind alle Weine "meine", im Fremdregal prüfen wir die Owner-ID
                      const isMine = !viewingOtherUserId || (currentUser && (
                        (wine.ownerId && wine.ownerId === currentUser.uid) ||
                        (wine.owner && (wine.owner === currentUser.username || wine.owner === currentUser.email))
                      ));
                      
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
                          <Text style={styles.listItemText} numberOfLines={2}>
                            {wine.name}
                          </Text>
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

                {/* Wein-Bild */}
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
                  
                  {selectedWine.grapeVariety && (
                    <Text style={styles.modalInfoText}>🍇 Rebsorte: {selectedWine.grapeVariety}</Text>
                  )}
                  
                  {selectedWine.tasteProfile && (
                    <Text style={styles.modalInfoText}>👅 Geschmacksprofil: {selectedWine.tasteProfile}</Text>
                  )}
                  
                  <Text style={styles.modalPrice}>
                    💰 {selectedWine.price ? `${parseFloat(selectedWine.price).toFixed(2)}€` : 'Preis auf Anfrage'}
                  </Text>
                  
                  {!viewingOtherUserId && selectedWine.bottleCount > 0 && (
                    <Text style={styles.modalInfoText}>
                      📦 Im Regal: {selectedWine.bottleCount} {selectedWine.publishedCount > 0 ? `• Veröffentlicht: ${selectedWine.publishedCount}` : ''}
                    </Text>
                  )}
                  
                  {selectedWine.description && (
                    <View style={styles.modalDescriptionContainer}>
                      <Text style={styles.modalDescriptionLabel}>📝 Beschreibung:</Text>
                      <Text style={styles.modalDescription}>{selectedWine.description}</Text>
                    </View>
                  )}
                </ScrollView>

                {/* Modal Buttons */}
                {!viewingOtherUserId ? (
                  <View style={styles.modalButtonsContainer}>
                    <TouchableOpacity 
                      style={[styles.modalButtonIcon, styles.modalEditButton]}
                      onPress={handleModalEdit}
                    >
                      <Text style={styles.modalButtonIconText}>✏️</Text>
                    </TouchableOpacity>
                    
                    {(() => {
                      // VERBESSERT: Prüfe ob der Wein gemischten Status hat (sowohl private als auch veröffentlichte Flaschen)
                      // Suche in allWines nach allen Weinen mit gleichem Namen/Winery/Vintage
                      const wineName = selectedWine?.name || selectedWine?.title;
                      const wineWinery = selectedWine?.winery;
                      const wineVintage = selectedWine?.vintage;
                      
                      // Wenn kein Name vorhanden ist, prüfe alle Weine des Users
                      const matchingWines = wineName ? allWines.filter(w => 
                        w.ownerId === currentUserId &&
                        w.name === wineName &&
                        (w.winery === wineWinery || (!w.winery && !wineWinery)) &&
                        (w.vintage === wineVintage || (!w.vintage && !wineVintage)) &&
                        w.status !== 'traded'
                      ) : allWines.filter(w => 
                        w.ownerId === currentUserId &&
                        w.status !== 'traded'
                      );
                      
                      const hasPrivateWines = matchingWines.some(w => w.status === 'private');
                      const hasPublicWines = matchingWines.some(w => w.status === 'public');
                      
                      console.log('🔍 Button-Logik:', {
                        wineName,
                        matchingWinesLength: matchingWines.length,
                        hasPrivateWines,
                        hasPublicWines,
                        allWinesLength: allWines.length,
                        currentUserId
                      });
                      
                      // Wenn beide Status vorhanden sind, zeige beide Buttons
                      if (hasPrivateWines && hasPublicWines) {
                        return (
                          <>
                            <TouchableOpacity 
                              style={[styles.modalButtonIcon, styles.modalPublishButton]}
                              onPress={() => {
                                console.log('🔍 VERÖFFENTLICHEN-Button geklickt!');
                                console.log('🔍 selectedWine:', selectedWine);
                                console.log('🔍 allWines.length:', allWines.length);
                                console.log('🔍 currentUserId:', currentUserId);
                                
                                // VERBESSERT: Veröffentlichen - Suche in allWines nach allen privaten Weinen
                                const wineName = selectedWine?.name || selectedWine?.title;
                                const wineWinery = selectedWine?.winery;
                                const wineVintage = selectedWine?.vintage;
                                
                                console.log('🔍 wineName:', wineName, 'wineWinery:', wineWinery, 'wineVintage:', wineVintage);
                                
                                // Prüfe zuerst, ob überhaupt private Weine existieren
                                const anyPrivateWines = allWines.filter(w => 
                                  w.ownerId === currentUserId && 
                                  w.status === 'private' && 
                                  w.status !== 'traded'
                                );
                                
                                console.log('🔍 anyPrivateWines.length:', anyPrivateWines.length);
                                
                                if (anyPrivateWines.length === 0) {
                                  Alert.alert('Info', 'Keine privaten Flaschen zum Veröffentlichen vorhanden.');
                                  return;
                                }
                                
                                // Wenn kein Name vorhanden ist, zeige alle privaten Weine
                                if (!wineName) {
                                  const privateWines = anyPrivateWines.map(w => w.id);
                                  
                                  // KRITISCH: Prüfe ob privateWines tatsächlich vorhanden sind
                                  if (!privateWines || privateWines.length === 0) {
                                    Alert.alert('Info', 'Keine privaten Flaschen zum Veröffentlichen vorhanden.');
                                    return;
                                  }
                                  
                                  // Erstelle ein minimales Wein-Objekt für das Modal
                                  const wineForModal = {
                                    ...selectedWine,
                                    name: anyPrivateWines[0]?.name || 'Wein',
                                    title: anyPrivateWines[0]?.name || 'Wein'
                                  };
                                  
                                  // KRITISCH: Schließe zuerst das Wein-Detail-Modal, bevor das Publish-Modal geöffnet wird
                                  handleCloseModal();
                                  
                                  // Warte kurz, damit das Wein-Detail-Modal geschlossen werden kann
                                  setTimeout(() => {
                                    setSelectedWineForPublish({ wine: wineForModal, privateWines });
                                    setPublishCount(1);
                                    setPublishMode('publish');
                                    setPublishModalVisible(true);
                                    console.log('✅ Modal-State gesetzt (Inline-Funktion, kein Name) - publishModalVisible sollte true sein');
                                  }, 100);
                                  return;
                                }
                                
                                // Finde alle privaten Weine mit gleichem Namen/Winery/Vintage (nur eigene!)
                                const allPrivateWines = allWines.filter(w => 
                                  w.ownerId === currentUserId &&
                                  w.name === wineName &&
                                  (w.winery === wineWinery || (!w.winery && !wineWinery)) &&
                                  (w.vintage === wineVintage || (!w.vintage && !wineVintage)) &&
                                  w.status === 'private' &&
                                  w.status !== 'traded'
                                );
                                
                                const privateWines = allPrivateWines.map(w => w.id);
                                
                                // KRITISCH: Prüfe ob privateWines tatsächlich vorhanden sind
                                if (!privateWines || privateWines.length === 0) {
                                  // Es gibt private Weine, aber nicht von diesem spezifischen Wein
                                  Alert.alert(
                                    'Info', 
                                    `Keine privaten Flaschen von "${wineName}" zum Veröffentlichen vorhanden.\n\nSie haben ${anyPrivateWines.length} private Flasche(n) im Regal, die veröffentlicht werden können.`
                                  );
                                  return;
                                }
                                
                                // KRITISCH: Schließe zuerst das Wein-Detail-Modal, bevor das Publish-Modal geöffnet wird
                                handleCloseModal();
                                
                                // Warte kurz, damit das Wein-Detail-Modal geschlossen werden kann
                                setTimeout(() => {
                                  setSelectedWineForPublish({ wine: selectedWine, privateWines });
                                  setPublishCount(1);
                                  setPublishMode('publish');
                                  setPublishModalVisible(true);
                                  console.log('✅ Modal-State gesetzt (Inline-Funktion) - publishModalVisible sollte true sein');
                                }, 100);
                              }}
                            >
                              <Text style={styles.modalButtonIconText}>⬆️</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              style={[styles.modalButtonIcon, styles.modalUnpublishButton]}
                              onPress={() => {
                                // Zurückziehen: Öffne Modal mit veröffentlichten Flaschen
                                const wineIds = selectedWine.wineIds || [selectedWine.id];
                                const publicWines = wineIds.filter(id => {
                                  const wineData = allWines.find(w => w.id === id);
                                  return wineData && wineData.status === 'public';
                                });
                                if (publicWines.length > 0) {
                                  setSelectedWineForPublish({ wine: selectedWine, publicWines });
                                  setPublishCount(1);
                                  setPublishMode('unpublish');
                                  setPublishModalVisible(true);
                                  handleCloseModal();
                                }
                              }}
                            >
                              <Text style={styles.modalButtonIconText}>⬇️</Text>
                            </TouchableOpacity>
                          </>
                        );
                      } else if (hasPublicWines || selectedWine.status === 'public' || selectedWine.status === 'mixed') {
                        // Nur veröffentlichte Flaschen: nur Zurückziehen-Button (roter Pfeil)
                        return (
                          <TouchableOpacity 
                            style={[styles.modalButtonIcon, styles.modalUnpublishButton]}
                            onPress={handleTogglePublish}
                          >
                            <Text style={styles.modalButtonIconText}>⬇️</Text>
                          </TouchableOpacity>
                        );
                      } else if (hasPrivateWines) {
                        // Nur private Flaschen: nur Veröffentlichen-Button (grüner Pfeil)
                        console.log('🔍 Zeige nur Veröffentlichen-Button (nur private Weine)');
                        return (
                          <TouchableOpacity 
                            style={[styles.modalButtonIcon, styles.modalPublishButton]}
                            onPress={() => {
                              console.log('🔍 VERÖFFENTLICHEN-Button (nur private) geklickt!');
                              console.log('🔍 selectedWine:', selectedWine);
                              handleTogglePublish(selectedWine);
                            }}
                          >
                            <Text style={styles.modalButtonIconText}>⬆️</Text>
                          </TouchableOpacity>
                        );
                      } else {
                        // Keine privaten Weine - kein Button
                        console.log('🔍 Keine privaten Weine gefunden - kein Button');
                        return null;
                      }
                    })()}
                    
                    <TouchableOpacity 
                      style={[styles.modalButtonIcon, styles.modalDeleteButton]}
                      onPress={handleModalDelete}
                    >
                      <Text style={styles.modalButtonIconText}>🗑️</Text>
                    </TouchableOpacity>
                    
                    {selectedWine.status !== 'traded' && (
                      <TouchableOpacity 
                        style={[styles.modalButtonIcon, styles.modalAddButton]}
                        onPress={handleModalAddDuplicate}
                      >
                        <Text style={styles.modalButtonIconText}>➕</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : (
                  <View style={styles.modalButtonsContainer}>
                    <TouchableOpacity 
                      style={[styles.modalButtonIcon, styles.modalEditButton]}
                      onPress={() => {
                        handleCloseModal();
                        onNavigate('weinDetail', { wineData: selectedWine, inTradeContext: true, backTarget: 'notifications' });
                      }}
                    >
                      <Text style={styles.modalButtonIconText}>👁️</Text>
                    </TouchableOpacity>
                    
                    {onSelectTradeWine && (
                      <TouchableOpacity 
                        style={[styles.modalButtonIcon, styles.modalPublishButton]}
                        onPress={() => {
                          handleCloseModal();
                          onSelectTradeWine({ tradeRequestId, otherUserId: viewingOtherUserId, selectedWine });
                        }}
                      >
                        <Text style={styles.modalButtonIconText}>🤝</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
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
            {selectedWineForPublish && (() => {
              console.log('🔍 Modal-Rendering: selectedWineForPublish vorhanden');
              
              const winesToProcess = publishMode === 'publish' 
                ? (selectedWineForPublish.privateWines || [])
                : (selectedWineForPublish.publicWines || []);
              
              console.log('🔍 Modal-Rendering: winesToProcess.length:', winesToProcess.length);
              
              // KRITISCH: Wenn keine Weine vorhanden sind, zeige Fehler und schließe Modal
              if (!winesToProcess || winesToProcess.length === 0) {
                console.log('❌ Modal-Rendering: Keine Weine gefunden - schließe Modal');
                // Modal sollte nicht geöffnet werden, wenn keine Weine vorhanden sind
                // Aber falls es doch geöffnet wurde, schließe es sofort
                setTimeout(() => {
                  setPublishModalVisible(false);
                  setSelectedWineForPublish(null);
                  Alert.alert('Fehler', 'Keine Weine zum Verarbeiten gefunden.');
                }, 0);
                return null;
              }
              
              console.log('✅ Modal-Rendering: Rendere Modal-Inhalt');
              
              return (
                <>
                  <Text style={styles.modalSubtitle}>
                    {selectedWineForPublish.wine?.name || selectedWineForPublish.wine?.title || 'Wein'}
                  </Text>
                  <Text style={styles.modalInfo}>
                    {publishMode === 'publish' 
                      ? `Verfügbar: ${winesToProcess.length} private Flasche${winesToProcess.length > 1 ? 'n' : ''}`
                      : `Verfügbar: ${winesToProcess.length} veröffentlichte Flasche${winesToProcess.length > 1 ? 'n' : ''}`
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
                      ref={scrollViewRef}
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
              );
            })()}
          </View>
        </View>
      </Modal>
      
      {/* Modal zur Auswahl der Anzahl beim Löschen */}
      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setDeleteModalVisible(false);
          setSelectedWineForDelete(null);
          setDeleteCount(1);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Wein löschen</Text>
            {selectedWineForDelete && (
              <>
                <Text style={styles.modalSubtitle}>
                  {selectedWineForDelete.wineName}
                </Text>
                <Text style={styles.modalInfo}>
                  Verfügbar: {selectedWineForDelete.wineIds?.length || 0} Flasche{(selectedWineForDelete.wineIds?.length || 0) > 1 ? 'n' : ''}
                </Text>
                <Text style={styles.modalLabel}>
                  Wie viele Flaschen möchten Sie löschen?
                </Text>
                <Text style={styles.modalWarning}>
                  ⚠️ Diese Aktion kann nicht rückgängig gemacht werden!
                </Text>
                {/* Zahlenrad-Picker */}
                <View style={styles.pickerContainer}>
                  <View style={styles.pickerWrapper}>
                    <ScrollView
                      ref={deleteScrollViewRef}
                      style={styles.pickerScrollView}
                      contentContainerStyle={styles.pickerContent}
                      showsVerticalScrollIndicator={false}
                      snapToInterval={itemHeight}
                      decelerationRate="fast"
                      onMomentumScrollEnd={(event) => {
                        const y = event.nativeEvent.contentOffset.y;
                        const index = Math.round(y / itemHeight);
                        const maxCount = selectedWineForDelete.wineIds?.length || 1;
                        const selectedValue = Math.min(Math.max(index + 1, 1), maxCount);
                        setDeleteCount(selectedValue);
                      }}
                    >
                      {selectedWineForDelete && (() => {
                        const maxCount = selectedWineForDelete.wineIds?.length || 1;
                        const numbers = generateNumbers(maxCount);
                        return numbers.map((num, index) => (
                          <TouchableOpacity
                            key={num}
                            style={[
                              styles.pickerItem,
                              { height: itemHeight },
                              deleteCount === num && styles.pickerItemSelected
                            ]}
                            onPress={() => {
                              setDeleteCount(num);
                              deleteScrollViewRef.current?.scrollTo({
                                y: index * itemHeight,
                                animated: true,
                              });
                            }}
                          >
                            <Text style={[
                              styles.pickerItemText,
                              deleteCount === num && styles.pickerItemTextSelected
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
                      setDeleteModalVisible(false);
                      setSelectedWineForDelete(null);
                      setDeleteCount(1);
                    }}
                  >
                    <Text style={styles.modalButtonCancelText}>Abbrechen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonDelete]}
                    onPress={handleConfirmDelete}
                  >
                    <Text style={styles.modalButtonDeleteText}>Löschen</Text>
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
    // ALTE EINSTELLUNG (für Rückgängigmachen): backgroundColor: '#E8E6E1', // Warmes, helles Beige-Grau
    backgroundColor: '#2c2c2c', // LoginScreen-Farbe
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
    // ALTE EINSTELLUNG (für Rückgängigmachen): backgroundColor: '#E8E6E1',
    backgroundColor: '#2c2c2c', // LoginScreen-Farbe
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
    color: '#FFFFFF', // Weiß
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
    paddingTop: 20, // Erhöht für gleichen Abstand nach oben
    paddingBottom: 20, // Erhöht für gleichen Abstand nach unten
    // ALTE EINSTELLUNG (für Rückgängigmachen): backgroundColor: 'rgba(218, 165, 32, 0.4)', // Warmes Gold mit Glassmorphism
    backgroundColor: '#2c2c2c', // Gleiche Farbe wie Content-BG
    position: 'relative',
    marginTop: 0, // Reduziert, da Logo-Header oberhalb ist
    minHeight: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
    // ALTE EINSTELLUNG (für Rückgängigmachen): borderBottomColor: 'rgba(218, 165, 32, 0.3)',
    // ALTE EINSTELLUNG (für Rückgängigmachen): Glassmorphism Effekt
    // ALTE EINSTELLUNG (für Rückgängigmachen): shadowColor: '#000',
    // ALTE EINSTELLUNG (für Rückgängigmachen): shadowOffset: { width: 0, height: 1 },
    // ALTE EINSTELLUNG (für Rückgängigmachen): shadowOpacity: 0.2,
    // ALTE EINSTELLUNG (für Rückgängigmachen): shadowRadius: 8,
    // ALTE EINSTELLUNG (für Rückgängigmachen): elevation: 5,
    // Schatten entfernt für nahtlosen Übergang
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
    width: 80,
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
    color: '#2c2c2c', // Dunkler auf hellem Header
  },
  dashboardButtonContainer: {
    position: 'relative',
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
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#FF4444',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
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
    color: '#4a4a4a', // Dunklerer Grauton auf hellem Hintergrund
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
    marginBottom: 30,
    opacity: 0.9,
  },
  addWineButton: {
    backgroundColor: '#F5E6D3', // Reines Weißgold ohne Transparenz
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6D5B8', // Etwas dunkleres Weißgold für Border
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 20, // Gleicher Abstand wie paddingBottom des Headers
  },
  addWineButtonIcon: {
    fontSize: 20,
    marginRight: 8,
    // ALTE EINSTELLUNG (für Rückgängigmachen): color: '#2c2c2c',
    color: '#1a1a1a', // Dunkel für bessere Lesbarkeit auf hellem Hintergrund
  },
  addWineButtonText: {
    // ALTE EINSTELLUNG (für Rückgängigmachen): color: '#2c2c2c',
    color: '#1a1a1a', // Dunkel für bessere Lesbarkeit auf hellem Hintergrund
    fontSize: 16,
    fontWeight: 'bold',
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
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)'
  },
  rowPlaceholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    opacity: 0.5,
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
    color: '#2f3a3b',
    marginBottom: 2,
  },
  rowGrape: {
    fontSize: 14,
    color: '#4b4b4b',
    marginBottom: 2,
  },
  rowPrice: {
    fontSize: 16,
    color: '#2f3a3b',
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 4,
  },
  rowStatus: {
    fontSize: 12,
    color: '#2f3a3b',
    opacity: 0.85,
  },
  rowBottleCount: {
    fontSize: 15,
    color: '#8B4513', // Dunkles Braun für bessere Lesbarkeit
    fontWeight: 'bold',
    letterSpacing: 0.2,
    lineHeight: 20,
    marginTop: 4,
  },
  rowActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Buttons gleichmäßig verteilt
    alignItems: 'center',
    width: '100%', // Volle Breite des Displays
    paddingTop: 4,
    paddingHorizontal: 0, // Kein zusätzliches Padding, da wineRow bereits Padding hat
  },
  rowActionButton: {
    backgroundColor: '#EEEEEE',
    height: 40,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1, // Gleichmäßige Verteilung über die gesamte Breite
    marginHorizontal: 4, // Abstand zwischen Buttons
    minWidth: 40, // Mindestbreite für bessere Sichtbarkeit
  },
  rowActionPlaceholder: {
    flex: 1,
    height: 40,
    opacity: 0,
    marginHorizontal: 4,
    minWidth: 40,
  },
  rowApproveButton: {
    backgroundColor: 'rgba(0, 255, 0, 0.18)'
  },
  rowDeleteButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.15)'
  },
  rowPublished: {
    backgroundColor: 'rgba(0, 255, 0, 0.18)'
  },
  rowUnpublished: {
    backgroundColor: 'rgba(255, 0, 0, 0.18)'
  },
  rowActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2f3a3b',
    textAlign: 'center',
  },
  rowDivider: {
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.18)',
  },
  tradeActionBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  declineBarButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  declineBarButtonText: {
    color: '#F44336',
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  publishedButton: {
    backgroundColor: 'rgba(0, 255, 0, 0.4)', // Grün für veröffentlicht
    borderWidth: 2,
    borderColor: 'rgba(0, 255, 0, 0.6)',
  },
  unpublishedButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.4)', // Rot für nicht veröffentlicht
    borderWidth: 2,
    borderColor: 'rgba(255, 0, 0, 0.6)',
  },
  actionButtonText: {
    fontSize: 16,
  },
  // Hamburger Menu Styles
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2000,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuBackdrop: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuContainer: {
    backgroundColor: 'rgba(245, 245, 220, 0.95)',
    width: 220,
    height: 400,
    paddingTop: 50,
    paddingHorizontal: 15,
    paddingBottom: 15,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B0000',
  },
  closeButton: {
    fontSize: 24,
    color: '#4B0000',
    fontWeight: 'bold',
  },
  menuItems: {
    // Style for menu items container
  },
  menuItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuItemText: {
    fontSize: 16,
    color: '#4B0000',
    fontWeight: '500',
  },
  logoutMenuItem: {
    backgroundColor: 'rgba(75, 0, 0, 0.1)',
    marginTop: 10,
    borderRadius: 8,
  },
  logoutText: {
    color: '#4B0000',
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    position: 'relative',
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
  imageSwipeContainer: {
    width: '100%',
    height: '100%',
  },
  imageSwipeContent: {
    alignItems: 'center',
  },
  modalPlaceholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPlaceholderText: {
    fontSize: 64,
    opacity: 0.5,
    color: '#FFFFFF',
  },
  modalInfoContainer: {
    maxHeight: 300,
    paddingHorizontal: 20,
    paddingVertical: 16,
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    gap: 12,
  },
  modalButtonIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalEditButton: {
    backgroundColor: 'rgba(218, 165, 32, 0.35)', // Warmes Gold Akzent
    borderColor: 'rgba(218, 165, 32, 0.5)',
  },
  modalPublishButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.4)', // Grün für Veröffentlichen
    borderColor: 'rgba(76, 175, 80, 0.6)',
  },
  modalUnpublishButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.4)', // Rot für Zurückziehen
    borderColor: 'rgba(244, 67, 54, 0.6)',
  },
  modalDeleteButton: {
    backgroundColor: 'rgba(218, 165, 32, 0.5)', // Warmes Gold Akzent
    borderColor: 'rgba(218, 165, 32, 0.7)',
  },
  modalAddButton: {
    backgroundColor: 'rgba(218, 165, 32, 0.45)', // Warmes Gold Akzent
    borderColor: 'rgba(218, 165, 32, 0.6)',
  },
  modalButtonIconText: {
    fontSize: 24,
  },
  modalButton: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalInfo: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalWarning: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
    fontSize: 18,
    color: '#2f3a3b',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    marginBottom: 24,
    textAlign: 'center',
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
    backgroundColor: 'rgba(210, 105, 30, 0.1)',
  },
  pickerItemText: {
    fontSize: 32,
    color: '#999',
    fontWeight: '400',
  },
  pickerItemTextSelected: {
    fontSize: 40,
    color: '#D2691E',
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
    borderColor: '#D2691E',
    backgroundColor: 'rgba(210, 105, 30, 0.05)',
    pointerEvents: 'none',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  modalButtonCancel: {
    backgroundColor: '#E0E0E0',
  },
  modalButtonConfirm: {
    backgroundColor: '#D2691E',
  },
  modalButtonDelete: {
    backgroundColor: '#DC3545',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2f3a3b',
  },
  modalButtonConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
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
  },
  searchClearButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchClearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

