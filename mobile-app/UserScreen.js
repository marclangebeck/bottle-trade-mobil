import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  TextInput,
  Modal,
  FlatList
} from 'react-native';
import OptimizedImage from './components/OptimizedImage';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import BottomNavigation from './components/BottomNavigation';
import ProVersionButton from './components/ProVersionButton';
import { getCurrentUser } from './services/testAuth';
import { getAllUsers, getUser, getWinesByOwner } from './services/database-web';

// Hilfsfunktion für Initialen des aktuellen Users
const getInitialsForCurrentUser = (user) => {
  if (user?.firstName && user?.lastName) {
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  } else if (user?.vorname && user?.nachname) {
    return `${user.vorname.charAt(0)}${user.nachname.charAt(0)}`.toUpperCase();
  } else if (user?.username) {
    return user.username.substring(0, 2).toUpperCase();
  } else if (user?.email) {
    return user.email.substring(0, 2).toUpperCase();
  }
  return 'P';
};

export default function UserScreen({ onNavigate, onLogout, isAdmin = false, unreadCount = 0, isLoggedIn = false, isPro = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [userBtp, setUserBtp] = useState(0);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [viewMode, setViewMode] = useState('container'); // 'container' oder 'list'
  const [userWineCounts, setUserWineCounts] = useState({}); // { userId: count }

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserBtp(user?.btp ?? 0);
      setCurrentUserId(user?.uid ?? '');
      loadProfileImage(user.uid);
    }
    loadUsers();
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

  // Echtzeit-Filterung
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = users.filter(user => {
        const username = (user.username || '').toLowerCase();
        const email = (user.email || '').toLowerCase();
        const vorname = (user.vorname || '').toLowerCase();
        const nachname = (user.nachname || '').toLowerCase();
        const fullName = `${vorname} ${nachname}`.trim().toLowerCase();
        
        return username.includes(query) || 
               email.includes(query) || 
               vorname.includes(query) || 
               nachname.includes(query) ||
               fullName.includes(query);
      });
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const allUsers = await getAllUsers();
      // Hole aktuelle User-ID für Filterung
      const user = getCurrentUser();
      const uid = user?.uid || '';
      // Filtere den aktuellen User heraus (optional)
      const otherUsers = allUsers.filter(user => user.uid !== uid);
      setUsers(otherUsers);
      setFilteredUsers(otherUsers);
      
      // Lade Weinanzahl für jeden User
      await loadWineCountsForUsers(otherUsers);
    } catch (error) {
      console.error('❌ Fehler beim Laden der User:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWineCountsForUsers = async (usersList) => {
    try {
      const counts = {};
      // Lade für jeden User die Anzahl der öffentlichen Weine
      await Promise.all(
        usersList.map(async (user) => {
          try {
            const wines = await getWinesByOwner(user.uid || user.id);
            // Zähle nur öffentliche Weine (status === 'public')
            const publicWines = wines.filter(wine => wine.status === 'public');
            counts[user.uid || user.id] = publicWines.length;
          } catch (error) {
            console.error(`❌ Fehler beim Laden der Weine für User ${user.uid}:`, error);
            counts[user.uid || user.id] = 0;
          }
        })
      );
      setUserWineCounts(counts);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Weinanzahlen:', error);
    }
  };

  const handleUserPress = (user) => {
    // Zeige Modal mit User-Details
    setSelectedUser(user);
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setSelectedUser(null);
  };

  const getInitials = (user) => {
    if (user.vorname && user.nachname) {
      return `${user.vorname.charAt(0)}${user.nachname.charAt(0)}`.toUpperCase();
    } else if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    } else if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <View style={styles.container}>
      {/* StatusBar-Ersatz für iPhone */}
      <View style={{
        height: Platform.OS === 'ios' ? 60 : 0,
        backgroundColor: '#2c2c2c',
        width: '100%',
      }} />
      
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
                    {getInitialsForCurrentUser(getCurrentUser())}
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
            <Text style={styles.greeting} adjustsFontSizeToFit={true} minimumFontScale={0.7} numberOfLines={1}>Userinnen/User</Text>
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
            placeholder="User suchen..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.searchClearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.searchClearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
          
        {viewMode === 'container' ? (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.dashboardContainer}>
            {isLoading && (
              <View style={styles.loadingState}>
                <Text style={styles.loadingIcon}>⏳</Text>
                <Text style={styles.loadingText}>User werden geladen...</Text>
              </View>
            )}

            {!isLoading && filteredUsers.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👤</Text>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? 'Keine User gefunden' : 'Keine User verfügbar'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery 
                    ? 'Versuchen Sie eine andere Suche' 
                    : 'Schauen Sie später wieder vorbei!'}
                </Text>
              </View>
            )}

            {!isLoading && filteredUsers.length > 0 && (
              <View style={styles.usersList}>
                {filteredUsers.map((user) => (
                  <TouchableOpacity 
                    key={user.id || user.uid} 
                    style={styles.userCard}
                    activeOpacity={0.8}
                    onPress={() => handleUserPress(user)}
                  >
                    {/* Profilbild oder Initialen - füllt den Container */}
                    <View style={styles.userImageContainer}>
                      {user.profilbild ? (
                        <OptimizedImage
                          source={{ uri: user.profilbild }}
                          style={styles.userImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.userInitialsContainer}>
                          <Text style={styles.userInitials}>{getInitials(user)}</Text>
                        </View>
                      )}
                      {/* User-Informationen als Overlay unten */}
                      <View style={styles.userInfoOverlay}>
                        <Text style={styles.userNameOverlay} numberOfLines={1}>
                          {user.username || user.email || 'Unbekannt'}
                        </Text>
                        {userWineCounts[user.uid || user.id] !== undefined && (
                          <Text style={styles.userWineCountOverlay} numberOfLines={1}>
                            🍷 {userWineCounts[user.uid || user.id]} {userWineCounts[user.uid || user.id] === 1 ? 'Wein' : 'Weine'} in der Weinbörse
                          </Text>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
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
                  <Text style={styles.loadingText}>User werden geladen...</Text>
                </View>
              ) : filteredUsers.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>👤</Text>
                  <Text style={styles.emptyTitle}>
                    {searchQuery ? 'Keine User gefunden' : 'Keine User verfügbar'}
                  </Text>
                  <Text style={styles.emptySubtitle}>
                    {searchQuery 
                      ? 'Versuchen Sie eine andere Suche' 
                      : 'Schauen Sie später wieder vorbei!'}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredUsers}
                  keyExtractor={(item) => item.id || item.uid || `user-${item.username || item.email}`}
                  renderItem={({ item: user }) => {
                    return (
                      <TouchableOpacity
                        style={styles.listItem}
                        onPress={() => handleUserPress(user)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.listItemImageContainer}>
                          {user.profilbild ? (
                            <OptimizedImage
                              source={{ uri: user.profilbild }}
                              style={styles.listItemImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={styles.listItemPlaceholder}>
                              <Text style={styles.listItemPlaceholderText}>
                                {getInitials(user)}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.listItemTextContainer}>
                          <Text style={styles.listItemText} numberOfLines={1}>
                            {user.username || user.email || 'Unbekannt'}
                          </Text>
                          {userWineCounts[user.uid || user.id] !== undefined && (
                            <Text style={styles.listItemSubtext} numberOfLines={1}>
                              🍷 {userWineCounts[user.uid || user.id]} {userWineCounts[user.uid || user.id] === 1 ? 'Wein' : 'Weine'} in der Weinbörse
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

      {/* User Detail Modal */}
      <Modal
        visible={isModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <TouchableOpacity 
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            {selectedUser && (
              <>
                {/* Schließen-Button */}
                <TouchableOpacity 
                  style={styles.modalCloseButton}
                  onPress={handleCloseModal}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>

                {/* Profilbild */}
                <View style={styles.modalImageContainer}>
                  {selectedUser.profilbild ? (
                    <OptimizedImage
                      source={{ uri: selectedUser.profilbild }}
                      style={styles.modalImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.modalInitialsContainer}>
                      <Text style={styles.modalInitials}>{getInitials(selectedUser)}</Text>
                    </View>
                  )}
                </View>

                {/* Username */}
                <View style={styles.modalInfoContainer}>
                  <Text style={styles.modalUserName}>
                    {selectedUser.username || selectedUser.email || 'Unbekannt'}
                  </Text>
                  {(selectedUser.vorname || selectedUser.nachname) && (
                    <Text style={styles.modalUserFullName}>
                      {[selectedUser.vorname, selectedUser.nachname].filter(Boolean).join(' ')}
                    </Text>
                  )}
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    backgroundColor: '#2c2c2c', // Identisch mit Header
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
  profileSection: {
    width: 48,
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
  },
  searchClearButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
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
    color: '#CCCCCC',
    textAlign: 'center',
    opacity: 0.9,
  },
  usersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  userCard: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    shadowColor: '#a9c7cd',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    padding: 0,
  },
  userImageContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  },
  userImage: {
    width: '100%',
    height: '100%',
  },
  userInitialsContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(218, 165, 32, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitials: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  userInfoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(218, 165, 32, 0.4)',
  },
  userNameOverlay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2c2c2c',
    textAlign: 'center',
    marginBottom: 2,
  },
  userWineCountOverlay: {
    fontSize: 11,
    color: '#2c2c2c',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#2c2c2c',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(218, 165, 32, 0.5)',
    shadowColor: '#a9c7cd',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 12,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(218, 165, 32, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(218, 165, 32, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  modalCloseText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  modalImageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
  modalInitialsContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(218, 165, 32, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalInitials: {
    fontSize: 80,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalInfoContainer: {
    padding: 24,
    alignItems: 'center',
  },
  modalUserName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalUserFullName: {
    fontSize: 18,
    color: '#CCCCCC',
    textAlign: 'center',
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
    borderRadius: 40,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  listItemTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  listItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
    marginBottom: 4,
  },
  listItemSubtext: {
    fontSize: 14,
    color: '#4a4a4a',
    opacity: 0.8,
  },
});

