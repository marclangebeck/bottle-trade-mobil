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
  TextInput,
  StatusBar
} from 'react-native';
import { ImageBackground } from 'react-native';
import OptimizedImage from '../components/OptimizedImage';
import Footer from '../Footer';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
import { getCurrentUser } from '../services/testAuth';
import { getUser } from '../services/database-web';
import { 
  getVerifiedWineries, 
  subscribeVerifiedWineries,
  getWineryByOwner 
} from '../services/database-web';

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

export default function WeingueterScreen({ onNavigate, onLogout, isAdmin = false, unreadCount = 0, chats = [], isLoggedIn = false, wishlistMatchCount = 0 }, isPro = false) {
  const [wineries, setWineries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedWinery, setSelectedWinery] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentUserId, setCurrentUserId] = useState('');
  const [btp, setBtp] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [viewMode, setViewMode] = useState('container'); // 'container' oder 'list'
  const [searchText, setSearchText] = useState(''); // Suchtext für Filterung

  useEffect(() => {
    setCurrentUserIdFromAuth();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      loadWineries();
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

  // Filter-Funktion für Weingüter
  const filterWineries = (wineriesList, searchQuery) => {
    let filtered = wineriesList;
    
    // Filtere nach Suchtext
    if (searchQuery && searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(winery => {
        const name = winery.name?.toLowerCase() || '';
        const description = winery.description?.toLowerCase() || '';
        const address = winery.address?.toLowerCase() || '';
        const region = winery.region?.toLowerCase() || '';
        
        return name.includes(query) ||
               description.includes(query) ||
               address.includes(query) ||
               region.includes(query);
      });
    }
    
    return filtered;
  };

  // Gefilterte Weingüter
  const filteredWineries = filterWineries(wineries, searchText);

  const setCurrentUserIdFromAuth = () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.uid) {
        setCurrentUserId(currentUser.uid);
        setBtp(currentUser.btp ?? 0);
      }
    } catch (error) {
      console.error('❌ Fehler beim Abrufen des aktuellen Users:', error);
    }
  };

  const loadWineries = async () => {
    try {
      setIsLoading(true);
      const wineriesData = await getVerifiedWineries();
      setWineries(wineriesData);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Weingüter:', error);
      Alert.alert('Fehler', 'Weingüter konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  // Subscription für Echtzeit-Updates
  useEffect(() => {
    const unsubscribe = subscribeVerifiedWineries((wineriesData) => {
      setWineries(wineriesData);
      setIsLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleWineryPress = (winery) => {
    setSelectedWinery(winery);
    setCurrentImageIndex(0);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedWinery(null);
    setCurrentImageIndex(0);
  };

  const handleImageSwipe = (direction) => {
    if (!selectedWinery || !selectedWinery.images || selectedWinery.images.length === 0) return;
    
    if (direction === 'left') {
      setCurrentImageIndex((prev) => 
        prev < selectedWinery.images.length - 1 ? prev + 1 : 0
      );
    } else {
      setCurrentImageIndex((prev) => 
        prev > 0 ? prev - 1 : selectedWinery.images.length - 1
      );
    }
  };

  const screenWidth = Dimensions.get('window').width;
  const containerWidth = (screenWidth - 40) / 2; // 2 Spalten mit Padding

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
      {/* StatusBar-Ersatz für iPhone */}
      <View style={{
        height: Platform.OS === 'ios' ? 60 : 0,
        backgroundColor: '#2c2c2c',
        width: '100%',
      }} />
      
      <DynamicHamburgerMenu 
        onNavigate={onNavigate} 
        isLoggedIn={isLoggedIn} 
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
          <View style={styles.headerLeftLogo}>
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
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => onNavigate('community')}
            >
              <Text style={styles.backButtonText}>←</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>Weingüter</Text>
          </View>
          <View style={styles.headerRight} />
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
            placeholder="Suche nach Name, Region, Beschreibung..."
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
        
        {viewMode === 'container' ? (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              {isLoading ? (
                <View style={styles.loadingState}>
                  <Text style={styles.loadingIcon}>⏳</Text>
                  <Text style={styles.loadingText}>Weingüter werden geladen...</Text>
                </View>
              ) : filteredWineries.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>🏰</Text>
                  <Text style={styles.emptyTitle}>
                    {searchText ? 'Keine Weingüter gefunden' : 'Keine Weingüter verfügbar'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {searchText ? 'Versuchen Sie eine andere Suche' : 'Schauen Sie später wieder vorbei!'}
                  </Text>
                </View>
              ) : (
                <View style={styles.wineriesList}>
                  {filteredWineries.map((winery, index) => (
                    <TouchableOpacity
                      key={winery.id}
                      style={styles.wineryCard}
                      onPress={() => handleWineryPress(winery)}
                    >
                      {winery.images && winery.images.length > 0 ? (
                        <OptimizedImage
                          source={{ uri: winery.images[0] }}
                          style={styles.wineryCardImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.wineryCardPlaceholder}>
                          <Text style={styles.wineryCardPlaceholderText}>🏰</Text>
                        </View>
                      )}
                      <View style={styles.wineryCardInfo}>
                        <Text style={styles.wineryCardName} numberOfLines={2}>
                          {winery.name}
                        </Text>
                        {winery.region && (
                          <Text style={styles.wineryCardRegion} numberOfLines={1}>
                            {winery.region}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.content}>
            <FlatList
              data={filteredWineries}
              keyExtractor={(item) => item.id}
              renderItem={({ item: winery }) => (
                <TouchableOpacity
                  style={styles.listItem}
                  onPress={() => handleWineryPress(winery)}
                >
                  <View style={styles.listItemImageContainer}>
                    {winery.images && winery.images.length > 0 ? (
                      <OptimizedImage
                        source={{ uri: winery.images[0] }}
                        style={styles.listItemImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.listItemPlaceholder}>
                        <Text style={styles.listItemPlaceholderText}>🏰</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.listItemTextContainer}>
                    <Text style={styles.listItemText} numberOfLines={2}>
                      {winery.name}
                    </Text>
                    {winery.region && (
                      <Text style={styles.listItemRegion} numberOfLines={1}>
                        {winery.region}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                isLoading ? (
                  <View style={styles.loadingState}>
                    <Text style={styles.loadingIcon}>⏳</Text>
                    <Text style={styles.loadingText}>Weingüter werden geladen...</Text>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🏰</Text>
                    <Text style={styles.emptyTitle}>
                      {searchText ? 'Keine Weingüter gefunden' : 'Keine Weingüter verfügbar'}
                    </Text>
                    <Text style={styles.emptySubtitle}>
                      {searchText ? 'Versuchen Sie eine andere Suche' : 'Schauen Sie später wieder vorbei!'}
                    </Text>
                  </View>
                )
              }
              contentContainerStyle={styles.listContent}
            />
          </View>
        )}
      </View>
      
      {/* Detail-Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Bild-Slider */}
            {selectedWinery && selectedWinery.images && selectedWinery.images.length > 0 && (
              <View style={styles.modalImageContainer}>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.modalImageSwipeContainer}
                  contentContainerStyle={styles.modalImageSwipeContent}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(
                      event.nativeEvent.contentOffset.x / screenWidth
                    );
                    setCurrentImageIndex(index);
                  }}
                >
                  {selectedWinery.images.map((image, index) => (
                    <View key={index} style={[styles.imageWrapper, { width: screenWidth }]}>
                      <OptimizedImage
                        source={{ uri: image }}
                        style={styles.modalImage}
                        resizeMode="contain"
                      />
                    </View>
                  ))}
                </ScrollView>
                
                {/* Bild-Indikatoren */}
                {selectedWinery.images.length > 1 && (
                  <View style={styles.imageIndicatorContainer}>
                    {selectedWinery.images.map((_, index) => (
                      <View
                        key={index}
                        style={[
                          styles.imageIndicator,
                          index === currentImageIndex && styles.imageIndicatorActive
                        ]}
                      />
                    ))}
                  </View>
                )}
              </View>
            )}
            
            {/* Info-Container */}
            <ScrollView style={styles.modalInfoContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>{selectedWinery?.name}</Text>
              
              {selectedWinery?.region && (
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>📍 Region:</Text>
                  <Text style={styles.modalInfoValue}>{selectedWinery.region}</Text>
                </View>
              )}
              
              {selectedWinery?.address && (
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>🏠 Adresse:</Text>
                  <Text style={styles.modalInfoValue}>{selectedWinery.address}</Text>
                </View>
              )}
              
              {selectedWinery?.website && (
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>🌐 Website:</Text>
                  <Text style={styles.modalInfoValue}>{selectedWinery.website}</Text>
                </View>
              )}
              
              {selectedWinery?.contactEmail && (
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>📧 E-Mail:</Text>
                  <Text style={styles.modalInfoValue}>{selectedWinery.contactEmail}</Text>
                </View>
              )}
              
              {selectedWinery?.phone && (
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>📞 Telefon:</Text>
                  <Text style={styles.modalInfoValue}>{selectedWinery.phone}</Text>
                </View>
              )}
              
              {selectedWinery?.description && (
                <View style={styles.modalDescriptionContainer}>
                  <Text style={styles.modalDescriptionLabel}>Beschreibung:</Text>
                  <Text style={styles.modalDescriptionText}>
                    {selectedWinery.description}
                  </Text>
                </View>
              )}
            </ScrollView>
            
            {/* Buttons */}
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={handleCloseModal}
              >
                <Text style={styles.modalButtonText}>Schließen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2c2c2c',
  },
  contentContainer: {
    flex: 1,
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
  headerLeftLogo: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
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
    fontSize: 18,
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
  profileSection: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
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
    justifyContent: 'space-between',
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
  headerLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(218, 165, 32, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#DAA520',
    fontSize: 18,
    fontWeight: '600',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    includeFontPadding: false,
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
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#2c2c2c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)',
  },
  viewToggleButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  viewToggleButtonActive: {
    backgroundColor: '#DAA520', // Gold
  },
  viewToggleButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    fontWeight: '600',
  },
  viewToggleButtonTextActive: {
    color: '#2c2c2c', // Schwarz
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2c2c2c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)',
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 15,
    color: '#FFFFFF',
    fontSize: 14,
  },
  searchClearButton: {
    marginLeft: 10,
    padding: 5,
  },
  searchClearButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
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
    paddingVertical: 60,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#2c2c2c',
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  wineriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  wineryCard: {
    width: (Dimensions.get('window').width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  wineryCardImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#f5f5f5',
  },
  wineryCardPlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wineryCardPlaceholderText: {
    fontSize: 48,
  },
  wineryCardInfo: {
    padding: 12,
  },
  wineryCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  wineryCardRegion: {
    fontSize: 12,
    color: '#666',
  },
  listContent: {
    padding: 20,
  },
  listItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
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
    marginRight: 6, // Reduziert von 12 auf 6 (50%)
  },
  listItemImage: {
    width: 80,
    height: 80,
  },
  listItemPlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemPlaceholderText: {
    fontSize: 32,
  },
  listItemTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  listItemRegion: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalImageContainer: {
    height: 300,
    backgroundColor: '#000',
  },
  modalImageSwipeContainer: {
    flex: 1,
  },
  modalImageSwipeContent: {
    alignItems: 'center',
  },
  imageWrapper: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  imageIndicatorContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  imageIndicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  modalInfoContainer: {
    maxHeight: 300,
    padding: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 16,
  },
  modalInfoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  modalInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginRight: 8,
  },
  modalInfoValue: {
    fontSize: 14,
    color: '#2c2c2c',
    flex: 1,
  },
  modalDescriptionContainer: {
    marginTop: 8,
  },
  modalDescriptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  modalDescriptionText: {
    fontSize: 14,
    color: '#2c2c2c',
    lineHeight: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: '#DAA520', // Gold
  },
  modalButtonText: {
    color: '#2c2c2c', // Schwarz
    fontSize: 16,
    fontWeight: '600',
  },
});

