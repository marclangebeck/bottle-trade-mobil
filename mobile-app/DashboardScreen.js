import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, RefreshControl, Modal, Dimensions } from 'react-native';
import { ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// Conditional import für react-native-maps (funktioniert nur in nativen Builds)
let MapView, Marker, PROVIDER_GOOGLE;
try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} catch (e) {
  console.warn('⚠️ react-native-maps nicht verfügbar (vermutlich Expo Go)');
  MapView = null;
  Marker = null;
  PROVIDER_GOOGLE = null;
}
import OptimizedImage from './components/OptimizedImage';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import BottomNavigation from './components/BottomNavigation';
import ProVersionButton from './components/ProVersionButton';
import { getCurrentUser } from './services/testAuth';
import { getAvailableWinesCount, getUserWineCounts, getOnlineUsersCount, getCompletedTradesCount, getMyCompletedTradesCount, getAvailableWines, getUser } from './services/database-web';

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
import { getCoordinatesForZipCode, getDistanceText } from './services/geocodingService';

export default function DashboardScreen({ onNavigate, onLogout, isAdmin = false, unreadCount = 0, isLoggedIn = false, wishlistMatchCount = 0, onUpdateTourElementPosition = null, isPro = false }) {
  // Log nur bei Änderung, nicht bei jedem Render
  const prevUnreadRef = React.useRef(unreadCount);
  React.useEffect(() => {
    if (prevUnreadRef.current !== unreadCount) {
      console.log('📊 DashboardScreen: unreadCount =', unreadCount);
      prevUnreadRef.current = unreadCount;
    }
  }, [unreadCount]);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  // Tour-Refs (isoliert, beeinflusst keine bestehende Funktionalität)
  const tourHeaderRef = useRef(null);
  const tourProfileIconRef = useRef(null);
  const tourMapRef = useRef(null);
  const tourLogoHeaderRef = useRef(null); // Ref für gesamten Header-Bereich (Logo, Hamburger, Wishlist, Profil)
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({ availableWines: 0, myWines: 0, myWinesPublished: 0, onlineUsers: 0, tradesCompleted: 0, myTradesCompleted: 0 });
  const [wines, setWines] = useState([]);
  const [wineGroups, setWineGroups] = useState([]); // Gruppierte Weine für Pins
  const [mapRegion, setMapRegion] = useState(null);
  const [selectedWine, setSelectedWine] = useState(null);
  const [isWineModalVisible, setIsWineModalVisible] = useState(false);
  const [selectedWineGroup, setSelectedWineGroup] = useState(null); // Für Auswahl-Modal bei mehreren Weinen
  const [isWineSelectionModalVisible, setIsWineSelectionModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  
  // Ref für absolut stabile Koordinaten-Objekte - werden NUR beim Laden erstellt und nie mehr geändert
  const stableCoordinatesRef = useRef(new Map());

  // Funktion zum Gruppieren von Weinen nach Koordinaten
  // Gruppiert nur Weine mit exakt derselben PLZ, um Positionsverschiebungen zu vermeiden
  const groupWinesByLocation = (wines) => {
    const groups = [];
    
    wines.forEach(wine => {
      // Suche nach bestehender Gruppe mit derselben PLZ
      // Dies stellt sicher, dass nur Weine aus derselben PLZ-Region gruppiert werden
      let foundGroup = groups.find(group => 
        group.ownerZipCode === wine.ownerZipCode &&
        Math.abs(group.latitude - wine.latitude) < 0.00001 // Zusätzliche Sicherheitsprüfung
      );
      
      if (foundGroup) {
        // Füge Wein zur bestehenden Gruppe hinzu
        // WICHTIG: Behalte die ursprünglichen Koordinaten der Gruppe bei
        // Keine Durchschnittsberechnung, um Positionsverschiebungen zu vermeiden
        foundGroup.wines.push(wine);
      } else {
        // Erstelle neue Gruppe mit exakten Koordinaten
        groups.push({
          latitude: wine.latitude,
          longitude: wine.longitude,
          ownerZipCode: wine.ownerZipCode, // Speichere PLZ für Gruppierung
          wines: [wine]
        });
      }
    });
    
    return groups;
  };

  const load = useCallback(async () => {
    try {
      setRefreshing(true);
      const me = getCurrentUser();
      const myId = me?.uid;
      
      // Lade Profilbild
      if (myId) {
        try {
          const userData = await getUser(myId);
          if (userData && userData.profilbild) {
            setProfileImage(userData.profilbild);
          } else {
            setProfileImage(null);
          }
        } catch (error) {
          console.error('❌ Fehler beim Laden des Profilbildes:', error);
          setProfileImage(null);
        }
      }
      const [availableWines, userCounts, onlineUsers, tradesCompleted, myTradesCompleted, winesData] = await Promise.all([
        getAvailableWinesCount(),
        myId ? getUserWineCounts(myId) : Promise.resolve({ total: 0, published: 0 }),
        getOnlineUsersCount(),
        getCompletedTradesCount(),
        myId ? getMyCompletedTradesCount(myId) : Promise.resolve(0),
        getAvailableWines()
      ]);
      
      setStats({
        availableWines,
        myWines: userCounts.total,
        myWinesPublished: userCounts.published,
        onlineUsers,
        tradesCompleted,
        myTradesCompleted,
      });
      
      // Ergänze fehlende ownerZipCode für alte Weine
      const winesToUpdate = [];
      for (const wine of winesData) {
        if (!wine.ownerZipCode && wine.ownerId) {
          try {
            const ownerData = await getUser(wine.ownerId);
            if (ownerData && ownerData.zipCode) {
              winesToUpdate.push({
                wineId: wine.id,
                zipCode: ownerData.zipCode
              });
              wine.ownerZipCode = ownerData.zipCode;
            }
          } catch (error) {
            console.error(`❌ Fehler beim Laden der PLZ für Wein ${wine.id}:`, error);
          }
        }
      }
      
      // Setze Weine mit Koordinaten
      console.log(`🔄 Verarbeite ${winesData.length} Weine für Karte...`);
      const winesWithCoords = winesData
        .filter(wine => {
          if (!wine.ownerZipCode) {
            console.log(`⚠️ Wein ${wine.id} (${wine.name}) hat keine ownerZipCode`);
            return false;
          }
          return true;
        })
        .map(wine => {
          const coords = getCoordinatesForZipCode(wine.ownerZipCode);
          if (!coords) {
            console.log(`⚠️ Keine Koordinaten für PLZ ${wine.ownerZipCode} (Wein: ${wine.name})`);
            return null;
          }
          // Runde Koordinaten auf 6 Dezimalstellen für präzise, stabile Position (~10cm Genauigkeit)
          const lat = Math.round(coords.lat * 1000000) / 1000000;
          const lon = Math.round(coords.lon * 1000000) / 1000000;
          console.log(`✅ Wein ${wine.name} (PLZ: ${wine.ownerZipCode}) → ${lat}, ${lon}`);
          return {
            ...wine,
            latitude: lat,
            longitude: lon
          };
        })
        .filter(wine => wine !== null && wine.latitude && wine.longitude);
      
      console.log(`✅ ${winesWithCoords.length} Weine mit Koordinaten für Karte vorbereitet`);
      setWines(winesWithCoords);
      
      // Gruppiere Weine nach Koordinaten (mit Toleranz für Rundungsfehler)
      const grouped = groupWinesByLocation(winesWithCoords);
      
      // Erstelle absolut stabile Koordinaten-Objekte EINMAL beim Laden
      // Diese werden nie mehr geändert, auch nicht beim Zoomen
      // WICHTIG: Koordinaten werden direkt aus der PLZ berechnet und bleiben für immer gleich
      const stableGroups = grouped.map((group) => {
        // Runde auf 6 Dezimalstellen für absolute Stabilität (~10cm Genauigkeit)
        // WICHTIG: Verwende parseFloat und toFixed für präzise Rundung
        const lat = parseFloat(Number(group.latitude).toFixed(6));
        const lon = parseFloat(Number(group.longitude).toFixed(6));
        
        // DEBUG: Log die Koordinaten beim Laden
        console.log(`📍 Gruppe geladen: PLZ ${group.ownerZipCode}, Koordinaten: ${lat}, ${lon}`);
        
        // Erstelle Koordinaten-Objekt EINMAL - dieses Objekt wird NIE mehr geändert
        // WICHTIG: Direkt im State gespeichert, nicht in einem Ref
        const coordinate = { latitude: lat, longitude: lon };
        
        return {
          ...group,
          latitude: lat, // Überschreibe mit gerundeten Werten
          longitude: lon,
          coordinate, // Verwende das Koordinaten-Objekt
          // Stabiler Key basierend auf Koordinaten
          stableKey: `wine-${lat}-${lon}-${group.ownerZipCode || 'unknown'}`,
        };
      });
      
      console.log(`📍 ${stableGroups.length} Pin-Positionen (${winesWithCoords.length} Weine)`);
      setWineGroups(stableGroups);
      
      // Setze Kartenregion basierend auf User-PLZ
      if (me?.zipCode) {
        const userCoords = getCoordinatesForZipCode(me.zipCode);
        if (userCoords) {
          setMapRegion({
            latitude: userCoords.lat,
            longitude: userCoords.lon,
            latitudeDelta: 0.10, // Zoom-Level für unmittelbare Umgebung (~10 km Radius)
            longitudeDelta: 0.15,
          });
        }
      } else {
        // Fallback: Deutschland-Mitte
        setMapRegion({
          latitude: 51.165,
          longitude: 10.451,
          latitudeDelta: 2.0, // Reduziert von 5.0 für bessere Übersicht
          longitudeDelta: 2.0,
        });
      }
    } catch (e) {
      console.error('❌ Dashboard load error:', e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Debug: Log State-Änderungen für Auswahl-Modal
  useEffect(() => {
    if (isWineSelectionModalVisible) {
      console.log('🔴 Auswahl-Modal ist jetzt sichtbar');
      console.log('🔴 selectedWineGroup:', selectedWineGroup);
      console.log('🔴 Anzahl Weine:', selectedWineGroup?.wines?.length);
    }
  }, [isWineSelectionModalVisible, selectedWineGroup]);

  // Tour: Element-Positionen messen und an App.js weitergeben (isoliert, beeinflusst keine bestehende Funktionalität)
  // NUR wenn Tour aktiv ist, um Render-Loops zu vermeiden
  useEffect(() => {
    if (!onUpdateTourElementPosition) return;

    const measureAndUpdate = () => {
      try {
        console.log('🎯 DashboardScreen: Messe Element-Positionen für Tour...');
        
        // Header
        if (tourHeaderRef.current && tourHeaderRef.current.measureInWindow) {
          tourHeaderRef.current.measureInWindow((x, y, width, height) => {
            console.log('🎯 DashboardScreen: Header-Position gemessen:', { x, y, width, height });
            onUpdateTourElementPosition('dashboard-header', { x, y, width, height });
          });
        } else {
          console.warn('⚠️ DashboardScreen: tourHeaderRef.current nicht verfügbar');
        }

        // Profil-Icon
        if (tourProfileIconRef.current && tourProfileIconRef.current.measureInWindow) {
          tourProfileIconRef.current.measureInWindow((x, y, width, height) => {
            console.log('🎯 DashboardScreen: Profil-Icon-Position gemessen:', { x, y, width, height });
            onUpdateTourElementPosition('dashboard-profile-icon', { x, y, width, height });
          });
        } else {
          console.warn('⚠️ DashboardScreen: tourProfileIconRef.current nicht verfügbar');
        }

        // Map
        if (tourMapRef.current && tourMapRef.current.measureInWindow) {
          tourMapRef.current.measureInWindow((x, y, width, height) => {
            console.log('🎯 DashboardScreen: Map-Position gemessen:', { x, y, width, height });
            onUpdateTourElementPosition('dashboard-map', { x, y, width, height });
          });
        } else {
          console.warn('⚠️ DashboardScreen: tourMapRef.current nicht verfügbar');
        }

        // Logo-Header-Container (ganzer Header-Bereich mit Hamburger, Wishlist, Logo, Profil)
        if (tourLogoHeaderRef.current && tourLogoHeaderRef.current.measureInWindow) {
          tourLogoHeaderRef.current.measureInWindow((x, y, width, height) => {
            console.log('🎯 DashboardScreen: Logo-Header-Position gemessen:', { x, y, width, height });
            onUpdateTourElementPosition('dashboard-logo-header', { x, y, width, height });
          });
        } else {
          console.warn('⚠️ DashboardScreen: tourLogoHeaderRef.current nicht verfügbar');
        }
      } catch (error) {
        console.warn('⚠️ Tour: Fehler beim Messen der Element-Positionen:', error);
      }
    };

    // Warte länger, damit Elemente definitiv gerendert sind, dann messe mehrmals (mit Delays)
    const timeoutId1 = setTimeout(measureAndUpdate, 800);
    const timeoutId2 = setTimeout(measureAndUpdate, 1500);
    const timeoutId3 = setTimeout(measureAndUpdate, 2500);

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, [onUpdateTourElementPosition]); // Nur bei Funktions-Änderung oder Mount

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
          <View style={styles.logoHeaderContainer} ref={tourLogoHeaderRef}>
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
            <View style={styles.profileSection} ref={tourProfileIconRef}>
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
          <View style={styles.header} ref={tourHeaderRef}>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Dashboard</Text>
            </View>
          </View>

          {/* Info-Container über der Karte - Glassmorphism Design */}
          <View style={styles.infoContainer}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onNavigate('weinboerse')}
              style={styles.infoCardTouchable}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.infoCardGlass}
              >
                <Text style={styles.infoCardLabel}>Weine in der Weinbörse</Text>
                <Text style={styles.infoCardValue}>{stats.availableWines}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onNavigate('mein-weinregal')}
              style={styles.infoCardTouchable}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.infoCardGlass}
              >
                <Text style={styles.infoCardLabel}>Mein Weinregal</Text>
                <Text style={styles.infoCardValue}>{stats.myWines}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => onNavigate('users')}
              style={styles.infoCardTouchable}
            >
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.08)', 'rgba(255, 255, 255, 0.02)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.infoCardGlass}
              >
                <Text style={styles.infoCardLabel}>User online</Text>
                <Text style={styles.infoCardValue}>{stats.onlineUsers}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Karte mit Wein-Pins - nimmt verfügbaren Platz ein */}
          <View style={styles.mapContainer} ref={tourMapRef}>
              {MapView && mapRegion ? (
                <MapView
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  style={styles.map}
                  initialRegion={mapRegion}
                  onRegionChangeComplete={(region) => {
                    // Aktualisiere nur die Region - Marker bleiben unverändert
                    // DEBUG: Prüfe ob sich Koordinaten ändern
                    if (wineGroups.length > 0) {
                      const firstGroup = wineGroups[0];
                      console.log(`🗺️ Region geändert. Zoom: ${region.latitudeDelta.toFixed(4)}`);
                      console.log(`📍 Marker-Koordinaten (sollten stabil sein): ${firstGroup.latitude}, ${firstGroup.longitude}`);
                      console.log(`📍 Koordinaten-Objekt:`, firstGroup.coordinate);
                    }
                    setMapRegion(region);
                  }}
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                  mapType="standard"
                  scrollEnabled={true} // Karte mit einem Finger verschiebbar
                  zoomEnabled={true} // Zoom mit 2 Fingern
                  pitchEnabled={false}
                  rotateEnabled={false}
                  onMoveStart={() => {
                    // Verhindere ScrollView-Scroll während Kartenbewegung
                  }}
                >
                  {wineGroups.map((group) => {
                    // Verwende die Koordinaten direkt aus dem group-Objekt
                    // Diese wurden EINMAL beim Laden erstellt, eingefroren und bleiben für immer gleich
                    // KEINE Neuberechnung, KEIN neues Objekt - direkt aus dem State
                    const coordinate = group.coordinate;
                    
                    if (!coordinate) {
                      console.warn('⚠️ Keine Koordinaten für Gruppe:', group);
                      return null;
                    }
                    
                    // WICHTIG: Koordinaten direkt aus dem group-Objekt verwenden
                    // Diese wurden EINMAL beim Laden berechnet und bleiben für immer gleich
                    // Problem: Pin wandert trotz stabiler Koordinaten - liegt an react-native-maps Rendering
                    // Lösung: anchor-Prop entfernen und Koordinaten direkt übergeben
                    return (
                      <Marker
                        key={group.stableKey || `group-${group.latitude}-${group.longitude}`}
                        coordinate={{
                          latitude: group.latitude, // Direkt aus dem State, nicht aus coordinate-Objekt
                          longitude: group.longitude,
                        }}
                        // anchor: Spitze des Pins (unten) soll auf Koordinaten zeigen
                        // Pin-Container: 32px breit, 48px hoch
                        // anchor: {x: 0.5 (Mitte), y: 1.0 (ganz unten = Spitze)}
                        anchor={{ x: 0.5, y: 1.0 }}
                        tracksViewChanges={false} // Verhindert Neurendering beim Zoomen
                        flat={true} // Marker bleibt flach auf der Karte (2D, nicht 3D)
                        // WICHTIG: Keine centerOffset - kann zu Verschiebungen führen
                        onPress={() => {
                          console.log(`📍 Pin geklickt: ${group.wines.length} Wein(e) an Position ${group.latitude}, ${group.longitude}`);
                          if (group.wines.length === 1) {
                            // Nur ein Wein: Direkt Modal öffnen
                            console.log('✅ Öffne direktes Wein-Modal');
                            setSelectedWine(group.wines[0]);
                            setIsWineModalVisible(true);
                          } else {
                            // Mehrere Weine: Auswahl-Modal öffnen
                            console.log('✅ Öffne Auswahl-Modal für', group.wines.length, 'Weine');
                            setSelectedWineGroup(group);
                            setIsWineSelectionModalVisible(true);
                          }
                        }}
                      >
                        <View style={styles.modernPinContainer}>
                          <View style={styles.modernPin}>
                            {group.wines.length > 1 && (
                              <View style={styles.pinBadge}>
                                <Text style={styles.pinBadgeText}>{group.wines.length}</Text>
                              </View>
                            )}
                          </View>
                          <View style={styles.modernPinPoint} />
                          <View style={styles.modernPinShadow} />
                        </View>
                      </Marker>
                    );
                  }).filter(Boolean)}
                </MapView>
              ) : (
                <View style={styles.mapPlaceholder}>
                  <Text style={styles.mapPlaceholderText}>
                    {MapView ? 'Karte wird geladen...' : 'Karte nicht verfügbar in Expo Go. Bitte verwende einen nativen Build (expo run:ios oder expo run:android).'}
                  </Text>
                  {!MapView && (
                    <ScrollView style={styles.wineListFallback}>
                      <Text style={styles.fallbackTitle}>Verfügbare Weine ({wines.length})</Text>
                      {wines.map((wine) => (
                        <TouchableOpacity
                          key={wine.id}
                          style={styles.fallbackWineCard}
                          onPress={() => {
                            setSelectedWine(wine);
                            setIsWineModalVisible(true);
                          }}
                        >
                          <Text style={styles.fallbackWineName}>{wine.name}</Text>
                          <Text style={styles.fallbackWineOwner}>von {wine.owner}</Text>
                          {wine.ownerZipCode && (
                            <Text style={styles.fallbackWineLocation}>📍 PLZ: {wine.ownerZipCode}</Text>
                          )}
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                )}
              </View>
            )}
          </View>
        </View>
        {/* Footer entfällt hier zugunsten der BottomNavigation */}
      </View>
      
      {/* Fixed Bottom Navigation */}
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadCount={unreadCount}
        onUpdateTourElementPosition={onUpdateTourElementPosition}
      />
      
      {/* ProVersion Button */}
      <ProVersionButton 
        onNavigate={onNavigate}
        isPro={isPro}
        isLoggedIn={isLoggedIn}
      />

      {/* Modal für Wein-Auswahl (wenn mehrere Weine an einer Position) */}
      <Modal
        visible={isWineSelectionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          console.log('🔴 Modal onRequestClose aufgerufen');
          setIsWineSelectionModalVisible(false);
        }}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsWineSelectionModalVisible(false)}
          />
          <View style={styles.modalBottomSheet}>
            <View style={styles.modalDragHandle} />
            <Text style={styles.selectionModalTitle}>
              {selectedWineGroup ? `${selectedWineGroup.wines.length} Weine an dieser Position` : ''}
            </Text>
            <ScrollView 
              style={styles.selectionModalList}
              contentContainerStyle={styles.selectionModalListContent}
            >
              {selectedWineGroup?.wines.map((wine, index) => (
                <TouchableOpacity
                  key={wine.id || index}
                  style={styles.selectionModalItem}
                  onPress={() => {
                    setSelectedWine(wine);
                    setIsWineSelectionModalVisible(false);
                    setIsWineModalVisible(true);
                  }}
                >
                  <View style={styles.selectionModalItemContent}>
                    {(() => {
                      const images = wine.labelImages || (wine.labelImage ? [wine.labelImage] : []);
                      const imageUri = images.length > 0 ? images[0] : null;
                      return imageUri ? (
                        <OptimizedImage
                          source={{ uri: imageUri }}
                          style={styles.selectionModalItemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.selectionModalItemPlaceholder}>
                          <Text style={styles.selectionModalItemPlaceholderText}>🍷</Text>
                        </View>
                      );
                    })()}
                    <View style={styles.selectionModalItemInfo}>
                      <Text style={styles.selectionModalItemName}>{wine.name}</Text>
                      {wine.winery && (
                        <Text style={styles.selectionModalItemWinery}>{wine.winery}</Text>
                      )}
                      {wine.vintage && (
                        <Text style={styles.selectionModalItemVintage}>Jahrgang: {wine.vintage}</Text>
                      )}
                      <Text style={styles.selectionModalItemOwner}>von {wine.owner}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.selectionModalCloseButton}
              onPress={() => setIsWineSelectionModalVisible(false)}
            >
              <Text style={styles.selectionModalCloseButtonText}>Schließen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal für Weindetails - Bottom Sheet */}
      <Modal
        visible={isWineModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsWineModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsWineModalVisible(false)}
          />
          <View style={styles.modalBottomSheet}>
            {/* Drag Handle */}
            <View style={styles.modalDragHandle} />
            
            {selectedWine && (
              <>
                {/* Wein-Bild (kleiner) */}
                <View style={styles.modalImageContainer}>
                  {(() => {
                    // Unterstütze sowohl labelImages Array als auch labelImage (Rückwärtskompatibilität)
                    const images = selectedWine.labelImages || (selectedWine.labelImage ? [selectedWine.labelImage] : []);
                    if (images.length === 0) {
                      return null;
                    }
                    // Zeige erstes Bild oder Galerie wenn mehrere vorhanden
                    if (images.length === 1) {
                      return (
                        <OptimizedImage
                          source={{ uri: images[0] }}
                          style={styles.modalImage}
                          resizeMode="contain"
                        />
                      );
                    }
                    // Mehrere Bilder: Zeige Galerie
                    return (
                      <ScrollView
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        style={styles.modalImageGalleryContainer}
                        contentContainerStyle={styles.modalImageGalleryContent}
                      >
                        {images.map((imageUri, index) => (
                          <View key={index} style={styles.modalImageGalleryItem}>
                            <OptimizedImage
                              source={{ uri: imageUri }}
                              style={styles.modalImage}
                              resizeMode="contain"
                            />
                          </View>
                        ))}
                      </ScrollView>
                    );
                  })()}
                </View>

                {/* Wein-Informationen */}
                <ScrollView 
                  style={styles.modalInfoContainer} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalInfoContent}
                >
                  <Text style={styles.modalWineName}>{selectedWine.name}</Text>
                  
                  {selectedWine.winery && (
                    <Text style={styles.modalInfoText}>🍷 Weingut: {selectedWine.winery}</Text>
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
                  
                  <Text style={styles.modalPrice}>
                    💰 {selectedWine.price ? `${selectedWine.price}€` : 'Preis auf Anfrage'}
                  </Text>
                  
                  <Text style={styles.modalOwner}>👤 von {selectedWine.owner}</Text>
                  
                  {(() => {
                    const currentUser = getCurrentUser();
                    const distanceText = currentUser && currentUser.zipCode && selectedWine.ownerZipCode
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
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => {
                      setIsWineModalVisible(false);
                      onNavigate('dashboard');
                    }}
                  >
                    <Text style={styles.modalButtonText}>Zurück zum Dashboard</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalButtonSecondary]}
                    onPress={() => {
                      setIsWineModalVisible(false);
                      onNavigate('weinboerse', { wineId: selectedWine.id });
                    }}
                  >
                    <Text style={styles.modalButtonText}>Zur Weinbörse</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.modalButton, styles.modalButtonPrimary]}
                    onPress={() => {
                      // TODO: Tausch anfragen Logik
                      setIsWineModalVisible(false);
                      onNavigate('weinboerse', { wineId: selectedWine.id, startTrade: true });
                    }}
                  >
                    <Text style={[styles.modalButtonText, styles.modalButtonPrimaryText]}>Tausch anfragen</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Hamburger Menu Modal entfernt - wird durch DynamicHamburgerMenu ersetzt */}
      {false && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity 
            style={styles.menuBackdrop} 
            activeOpacity={1}
            onPress={() => setIsMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Bottle-Trade</Text>
                <TouchableOpacity onPress={() => setIsMenuVisible(false)}>
                  <Text style={styles.closeButton}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.menuItems}>
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('home')}
                >
                  <Text style={styles.menuItemText}>📊 Dashboard</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('mein-weinregal')}
                >
                  <Text style={styles.menuItemText}>🍷 Mein Weinregal</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('weinregal')}
                >
                  <Text style={styles.menuItemText}>📝 Weinregal befüllen</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('weinboerse')}
                >
                  <Text style={styles.menuItemText}>🌐 Weinbörse</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('community')}
                >
                  <Text style={styles.menuItemText}>👥 Community</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('shop')}
                >
                  <Text style={styles.menuItemText}>🛒 Shop</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.menuItem} 
                  onPress={() => handleNavigation('profil')}
                >
                  <Text style={styles.menuItemText}>⚙️ Profil/Verwaltung</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.menuItem, styles.logoutMenuItem]} 
                  onPress={onLogout}
                >
                  <Text style={[styles.menuItemText, styles.logoutText]}>🚪 Abmelden</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
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
    paddingBottom: 75, // 75px (BottomNavigation) + 0px (gewünschtes Padding)
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
    width: 44, // Gleichgroß wie Hamburger-Menü
    height: 44, // Gleichgroß wie Hamburger-Menü
    borderRadius: 22, // Halbe Breite für Kreis
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileIconCircle: {
    width: 44, // Gleichgroß wie Hamburger-Menü
    height: 44, // Gleichgroß wie Hamburger-Menü
    borderRadius: 22, // Halbe Breite für Kreis
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  profileIconImage: {
    width: 44, // Gleichgroß wie Hamburger-Menü
    height: 44, // Gleichgroß wie Hamburger-Menü
    borderRadius: 22, // Halbe Breite für Kreis
  },
  profileIconText: {
    fontSize: 24, // Etwas kleiner angepasst für 44x44px
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
    width: 80,
    alignItems: 'center',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  userName: {
    fontSize: 20,
    color: '#2c2c2c', // Dunkler Text auf hellem Header
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    flex: 1,
    padding: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 10,
    zIndex: 1, // Sicherstellen, dass Container über der Karte liegen
  },
  infoCardTouchable: {
    flex: 1,
  },
  infoCardGlass: {
    width: '100%',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100, // Mindesthöhe für Container
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
    opacity: 0.85,
    letterSpacing: 0.3,
  },
  infoCardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#DAA520',
    textAlign: 'center',
    textShadowColor: 'rgba(218, 165, 32, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  mapContainer: {
    height: 350, // Feste Höhe statt flex: 1
    alignSelf: 'stretch',
    marginLeft: 16,
    marginRight: 16,
    marginBottom: 30,
    marginTop: 8, // Kleiner Abstand zu den Containern
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(218, 165, 32, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 0, // Sicherstellen, dass Karte unter den Containern liegt
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
  },
  mapPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  wineListFallback: {
    flex: 1,
    padding: 16,
  },
  fallbackTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  fallbackWineCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  fallbackWineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  fallbackWineOwner: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  fallbackWineLocation: {
    fontSize: 12,
    color: '#a9c7cd',
  },
  grid: { flexDirection: 'column', gap: 14 },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
    shadowColor: 'rgba(0, 0, 0, 0.2)',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.4)',
  },
  cardHeaderTitle: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '700',
    opacity: 0.9,
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  cardHeaderWine: {
    backgroundColor: 'rgba(244, 236, 226, 0.75)',
  },
  cardHeaderMarket: {
    backgroundColor: 'rgba(226, 239, 249, 0.75)',
  },
  cardHeaderTrades: {
    backgroundColor: 'rgba(231, 243, 233, 0.75)',
  },
  cardBody: {
    width: '100%',
    paddingHorizontal: 18,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  cardValue: {
    color: '#000000',
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.8,
  },
  cardSplit: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
    gap: 18,
  },
  cardSplitItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 13,
    marginBottom: 4,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  cardValueSmall: {
    color: '#000000',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.6,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  dashboardSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
  },
  // Dashboard Kacheln
  tilesGrid: {
    marginTop: 10,
  },
  tilesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  tile: {
    flex: 1,
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
    minHeight: 120, // Feste Mindesthöhe für alle Buttons
    justifyContent: 'center', // Zentriert den Inhalt vertikal
  },
  // centeredTile entfernt - justifyContent: 'center' ist jetzt direkt im tile Style
  tileFullWidth: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  tileIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  tileTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  tileSubtitle: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    opacity: 0.8,
  },
  tileButton: {
    backgroundColor: '#2c2c2c',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 222, 179, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 120,
    minHeight: 32,
  },
  tileButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
  },
  // Hamburger Menu Styles (wie StartScreen)
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
    minHeight: 200,
    maxHeight: '80%',
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
  // Moderne Pin Styles - Google Maps klassisch rot
  modernPinContainer: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 32,
    height: 48,
  },
  modernPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#EA4335', // Google Maps Rot
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
    zIndex: 1,
  },
  modernPinPoint: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 20,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#EA4335', // Google Maps Rot
    marginTop: -2,
    zIndex: 0,
  },
  modernPinShadow: {
    width: 14,
    height: 8,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    marginTop: -4,
    zIndex: -1,
  },
  // Badge für mehrere Weine
  pinBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  pinBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    paddingHorizontal: 4,
  },
  // Modal Styles - Bottom Sheet
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalBottomSheet: {
    height: '75%', // 75% des Displays
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#CCCCCC',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  modalImageContainer: {
    width: '100%',
    height: 120, // Kleineres Bild
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalImage: {
    width: '100%',
    height: 120,
  },
  modalPlaceholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalPlaceholderText: {
    fontSize: 60,
    opacity: 0.3,
  },
  modalInfoContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalInfoContent: {
    paddingBottom: 16,
  },
  modalWineName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalInfoText: {
    fontSize: 15,
    color: '#4a4a4a',
    marginBottom: 8,
    lineHeight: 22,
  },
  modalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a9c7cd',
    marginTop: 8,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalOwner: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalDistanceText: {
    fontSize: 14,
    color: '#a9c7cd',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalDescriptionContainer: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalDescriptionLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 8,
  },
  modalDescription: {
    fontSize: 14,
    color: '#4a4a4a',
    lineHeight: 20,
  },
  modalButtonsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#F9F9F9',
    gap: 12,
  },
  modalButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  modalButtonSecondary: {
    backgroundColor: '#FFFFFF',
    borderColor: '#a9c7cd',
  },
  modalButtonPrimary: {
    backgroundColor: '#a9c7cd',
    borderColor: '#a9c7cd',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
  },
  // Auswahl-Modal Styles
  selectionModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
    textAlign: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectionModalList: {
    flex: 1,
  },
  selectionModalListContent: {
    padding: 16,
  },
  selectionModalItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectionModalItemContent: {
    flexDirection: 'row',
    padding: 12,
  },
  selectionModalItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  selectionModalItemPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: 'rgba(218, 165, 32, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectionModalItemPlaceholderText: {
    fontSize: 32,
  },
  selectionModalItemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  selectionModalItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  selectionModalItemWinery: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  selectionModalItemVintage: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  selectionModalItemOwner: {
    fontSize: 12,
    color: '#a9c7cd',
    marginTop: 4,
  },
  selectionModalCloseButton: {
    backgroundColor: '#2c2c2c',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectionModalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalImageGalleryContainer: {
    width: '100%',
    height: 120,
    overflow: 'hidden', // Verhindert Überlauf
  },
  modalImageGalleryContent: {
    // Bei pagingEnabled sollten Items direkt nebeneinander liegen, ohne Zentrierung
    // Die Zentrierung erfolgt durch die Items selbst (modalImageGalleryItem)
    flexDirection: 'row', // Explizit horizontal
  },
  modalImageGalleryItem: {
    width: Dimensions.get('window').width, // Volle Breite für pagingEnabled
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0, // Verhindert, dass Items schrumpfen
  },
});
