import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform, 
  FlatList,
  Modal,
  TextInput,
  Alert,
  Dimensions
} from 'react-native';
import OptimizedImage from '../components/OptimizedImage';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import { getCurrentUser } from '../services/testAuth';
import { getUser } from '../services/database-web';
import {
  createWish,
  updateWish,
  deleteWish,
  getWishesForUser,
  subscribeWishesForUser,
  checkWishMatches,
  checkAllWishMatches,
} from '../services/database-web';

const SCREEN_WIDTH = Dimensions.get('window').width;

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

export default function WunschlisteScreen({ 
  onNavigate, 
  onLogout, 
  isAdmin = false, 
  isLoggedIn = false, 
  unreadNotifications = 0, 
  unreadHints = 0,
  wishlistMatchCount = 0,
  onWishlistUpdated = null
}) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [userBtp, setUserBtp] = useState(0);
  const [profileImage, setProfileImage] = useState(null);
  const [wishes, setWishes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedWish, setSelectedWish] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    winery: '',
    vintage: '',
    region: '',
    grapeVariety: '',
    notes: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckingMatches, setIsCheckingMatches] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      setUserBtp(user?.btp ?? 0);
      loadProfileImage(user.uid);
      loadWishes(user.uid);
      
      // Echtzeit-Updates abonnieren
      const unsubscribe = subscribeWishesForUser(user.uid, (updatedWishes) => {
        setWishes(updatedWishes);
      });
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, []);

  const loadProfileImage = async (userId) => {
    try {
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

  const loadWishes = async (userId) => {
    try {
      setIsLoading(true);
      const userWishes = await getWishesForUser(userId);
      setWishes(userWishes);
      
      // Prüfe Matches beim Laden
      await checkAllWishMatches(userId);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Wünsche:', error);
      Alert.alert('Fehler', 'Wünsche konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWish = () => {
    setFormData({
      name: '',
      winery: '',
      vintage: '',
      region: '',
      grapeVariety: '',
      notes: '',
    });
    setIsEditing(false);
    setIsFormModalVisible(true);
  };

  const handleEditWish = (wish) => {
    setFormData({
      name: wish.name || '',
      winery: wish.winery || '',
      vintage: wish.vintage?.toString() || '',
      region: wish.region || '',
      grapeVariety: wish.grapeVariety || '',
      notes: wish.notes || '',
    });
    setSelectedWish(wish);
    setIsEditing(true);
    setIsFormModalVisible(true);
  };

  const handleDeleteWish = (wish) => {
    Alert.alert(
      'Wunsch löschen',
      'Möchten Sie diesen Wunsch wirklich löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = getCurrentUser();
              await deleteWish(user.uid, wish.id);
              
              // Aktualisiere Badge in App.js
              if (onWishlistUpdated) {
                onWishlistUpdated();
              }
              
              Alert.alert('Erfolg', 'Wunsch wurde gelöscht.');
            } catch (error) {
              console.error('❌ Fehler beim Löschen:', error);
              Alert.alert('Fehler', 'Wunsch konnte nicht gelöscht werden.');
            }
          },
        },
      ]
    );
  };

  const handleSaveWish = async () => {
    // Validierung: Mindestens ein Feld muss ausgefüllt sein
    const hasAnyField = formData.name || formData.winery || formData.vintage || 
                       formData.region || formData.grapeVariety;
    if (!hasAnyField) {
      Alert.alert('Fehler', 'Mindestens ein Feld (Name, Weingut, Jahrgang, Region oder Rebsorte) muss ausgefüllt sein.');
      return;
    }

    try {
      const user = getCurrentUser();
      if (!user || !user.uid) {
        Alert.alert('Fehler', 'Bitte melden Sie sich an.');
        return;
      }

      const wishData = {
        name: formData.name.trim() || null,
        winery: formData.winery.trim() || null,
        vintage: formData.vintage ? parseInt(formData.vintage, 10) : null,
        region: formData.region.trim() || null,
        grapeVariety: formData.grapeVariety.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (isEditing && selectedWish) {
        await updateWish(user.uid, selectedWish.id, wishData);
        Alert.alert('Erfolg', 'Wunsch wurde aktualisiert.');
      } else {
        await createWish(user.uid, wishData);
        Alert.alert('Erfolg', 'Wunsch wurde erstellt.');
      }

      setIsFormModalVisible(false);
      setFormData({
        name: '',
        winery: '',
        vintage: '',
        region: '',
        grapeVariety: '',
        notes: '',
      });
      setIsEditing(false);
      setSelectedWish(null);

      // Prüfe Matches nach dem Speichern
      await checkAllWishMatches(user.uid);
      
      // Aktualisiere Badge in App.js
      if (onWishlistUpdated) {
        onWishlistUpdated();
      }
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      Alert.alert('Fehler', error.message || 'Wunsch konnte nicht gespeichert werden.');
    }
  };

  const handleWishPress = (wish) => {
    setSelectedWish(wish);
    setIsDetailModalVisible(true);
  };

  const handleCheckMatches = async () => {
    try {
      const user = getCurrentUser();
      if (!user || !user.uid) {
        return;
      }

      setIsCheckingMatches(true);
      await checkAllWishMatches(user.uid);
      
      // Aktualisiere Badge in App.js
      if (onWishlistUpdated) {
        onWishlistUpdated();
      }
      
      Alert.alert('Erfolg', 'Match-Prüfung abgeschlossen.');
    } catch (error) {
      console.error('❌ Fehler bei Match-Prüfung:', error);
      Alert.alert('Fehler', 'Match-Prüfung konnte nicht durchgeführt werden.');
    } finally {
      setIsCheckingMatches(false);
    }
  };

  const handleViewMatches = (wish) => {
    // Navigiere zur Weinbörse mit gefilterter Ansicht
    // TODO: Filter-Parameter an Weinbörse übergeben
    onNavigate('weinboerse');
    setIsDetailModalVisible(false);
  };

  // Filtere Wünsche nach Suchtext
  const filteredWishes = wishes.filter(wish => {
    if (!searchQuery || searchQuery.trim() === '') {
      return true;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const name = wish.name?.toLowerCase() || '';
    const winery = wish.winery?.toLowerCase() || '';
    const region = wish.region?.toLowerCase() || '';
    const grapeVariety = wish.grapeVariety?.toLowerCase() || '';
    const notes = wish.notes?.toLowerCase() || '';
    
    return name.includes(query) ||
           winery.includes(query) ||
           region.includes(query) ||
           grapeVariety.includes(query) ||
           notes.includes(query);
  });

  const renderWishCard = ({ item }) => {
    // Baue Kriterien-Text
    const criteria = [];
    if (item.name) criteria.push(item.name);
    if (item.winery) criteria.push(item.winery);
    if (item.vintage) criteria.push(item.vintage.toString());
    if (item.region) criteria.push(item.region);
    if (item.grapeVariety) criteria.push(item.grapeVariety);
    const criteriaText = criteria.join(', ');

    return (
      <TouchableOpacity
        style={[
          styles.wishCard,
          item.hasMatch && styles.wishCardWithMatch
        ]}
        onPress={() => handleWishPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <Text style={styles.cardIconText}>🍷</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {criteriaText || 'Wunsch'}
              </Text>
              {item.hasMatch && (
                <View style={styles.matchBadge}>
                  <Text style={styles.matchBadgeText}>
                    ✓ {item.matchedWineIds?.length || 0} Match{item.matchedWineIds?.length !== 1 ? 'es' : ''}
                  </Text>
                </View>
              )}
            </View>
            {item.hasMatch && (
              <View style={styles.matchIndicator}>
                <Text style={styles.matchIndicatorText}>✨</Text>
              </View>
            )}
          </View>
          
          {item.notes && (
            <Text style={styles.cardNotes} numberOfLines={2}>
              {item.notes}
            </Text>
          )}
          
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditWish(item)}
            >
              <Text style={styles.actionButtonText}>✏️ Bearbeiten</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteWish(item)}
            >
              <Text style={styles.actionButtonText}>🗑️ Löschen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const currentUser = getCurrentUser();

  return (
    <View style={styles.container}>
      {/* StatusBar-Ersatz für iPhone */}
      <View
        style={{
          height: Platform.OS === 'ios' ? 60 : 0,
          backgroundColor: '#2c2c2c',
          width: '100%',
        }}
      />

      <DynamicHamburgerMenu
        onNavigate={onNavigate}
        isLoggedIn={true}
        onLogout={onLogout}
        isAdmin={isAdmin}
        unreadNotifications={unreadNotifications}
        renderButton={false}
        externalMenuVisible={isMenuVisible}
        onMenuToggle={setIsMenuVisible}
      />

      <View style={styles.contentContainer}>
        {/* Logo-Header */}
        <View style={styles.logoHeaderContainer}>
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
                    {getInitials(currentUser)}
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
            <Text style={styles.greeting}>Wunschliste</Text>
          </View>
        </View>

        {/* Suchfeld */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Wünsche durchsuchen..."
            placeholderTextColor="rgba(255, 255, 255, 0.5)"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Wünsche-Liste */}
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Lädt...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredWishes}
            renderItem={renderWishCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'Keine Wünsche gefunden'
                    : 'Noch keine Wünsche vorhanden'}
                </Text>
              </View>
            }
          />
        )}

        {/* FAB für neuen Wunsch */}
        <TouchableOpacity style={styles.fab} onPress={handleAddWish}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* Button für Match-Prüfung */}
        {wishes.length > 0 && (
          <TouchableOpacity
            style={[styles.checkButton, isCheckingMatches && styles.checkButtonDisabled]}
            onPress={handleCheckMatches}
            disabled={isCheckingMatches}
          >
            <Text style={styles.checkButtonText}>
              {isCheckingMatches ? 'Prüft...' : '🔍 Matches prüfen'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadNotifications={unreadNotifications}
        unreadHints={unreadHints}
      />

      {/* Formular-Modal */}
      <Modal
        visible={isFormModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsFormModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsFormModalVisible(false)}
          />
          <View style={styles.modalBottomSheet}>
            <View style={styles.modalDragHandle} />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsFormModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalTitle}>
                {isEditing ? 'Wunsch bearbeiten' : 'Neuer Weinwunsch'}
              </Text>
              <Text style={styles.modalSubtitle}>
                Mindestens ein Feld muss ausgefüllt sein
              </Text>

              {/* Weinname */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Weinname (optional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="z.B. Riesling"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={formData.name}
                  onChangeText={(text) =>
                    setFormData({ ...formData, name: text })
                  }
                />
              </View>

              {/* Weingut */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Weingut (optional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="z.B. Weingut Müller"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={formData.winery}
                  onChangeText={(text) =>
                    setFormData({ ...formData, winery: text })
                  }
                />
              </View>

              {/* Jahrgang */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Jahrgang (optional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="z.B. 2020"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={formData.vintage}
                  onChangeText={(text) =>
                    setFormData({ ...formData, vintage: text })
                  }
                  keyboardType="numeric"
                />
              </View>

              {/* Region */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Region (optional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="z.B. Mosel"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={formData.region}
                  onChangeText={(text) =>
                    setFormData({ ...formData, region: text })
                  }
                />
              </View>

              {/* Rebsorte */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Rebsorte (optional)</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="z.B. Riesling"
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={formData.grapeVariety}
                  onChangeText={(text) =>
                    setFormData({ ...formData, grapeVariety: text })
                  }
                />
              </View>

              {/* Notizen */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Notizen (optional)</Text>
                <TextInput
                  style={[styles.formInput, styles.formTextArea]}
                  placeholder="Zusätzliche Informationen..."
                  placeholderTextColor="rgba(255, 255, 255, 0.5)"
                  value={formData.notes}
                  onChangeText={(text) =>
                    setFormData({ ...formData, notes: text })
                  }
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Speichern-Button */}
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveWish}
              >
                <Text style={styles.saveButtonText}>
                  {isEditing ? 'Aktualisieren' : 'Erstellen'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Detail-Modal */}
      <Modal
        visible={isDetailModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsDetailModalVisible(false)}
          />
          <View style={styles.modalBottomSheet}>
            <View style={styles.modalDragHandle} />
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsDetailModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>✕</Text>
            </TouchableOpacity>

            {selectedWish && (
              <ScrollView
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.modalTitle}>Wunsch-Details</Text>

                <View style={styles.detailSection}>
                  {selectedWish.name && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Weinname:</Text>
                      <Text style={styles.detailValue}>{selectedWish.name}</Text>
                    </View>
                  )}
                  {selectedWish.winery && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Weingut:</Text>
                      <Text style={styles.detailValue}>{selectedWish.winery}</Text>
                    </View>
                  )}
                  {selectedWish.vintage && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Jahrgang:</Text>
                      <Text style={styles.detailValue}>{selectedWish.vintage}</Text>
                    </View>
                  )}
                  {selectedWish.region && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Region:</Text>
                      <Text style={styles.detailValue}>{selectedWish.region}</Text>
                    </View>
                  )}
                  {selectedWish.grapeVariety && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Rebsorte:</Text>
                      <Text style={styles.detailValue}>{selectedWish.grapeVariety}</Text>
                    </View>
                  )}
                  {selectedWish.notes && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Notizen:</Text>
                      <Text style={styles.detailValue}>{selectedWish.notes}</Text>
                    </View>
                  )}
                </View>

                {selectedWish.hasMatch && (
                  <View style={styles.matchSection}>
                    <Text style={styles.matchSectionTitle}>
                      ✨ {selectedWish.matchedWineIds?.length || 0} Match{selectedWish.matchedWineIds?.length !== 1 ? 'es' : ''} gefunden!
                    </Text>
                    <TouchableOpacity
                      style={styles.viewMatchesButton}
                      onPress={() => handleViewMatches(selectedWish)}
                    >
                      <Text style={styles.viewMatchesButtonText}>
                        Zur Weinbörse
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={styles.detailActionButton}
                    onPress={() => {
                      setIsDetailModalVisible(false);
                      handleEditWish(selectedWish);
                    }}
                  >
                    <Text style={styles.detailActionButtonText}>✏️ Bearbeiten</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.detailActionButton, styles.deleteButton]}
                    onPress={() => {
                      setIsDetailModalVisible(false);
                      handleDeleteWish(selectedWish);
                    }}
                  >
                    <Text style={styles.detailActionButtonText}>🗑️ Löschen</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 0, // Auf 0px gesetzt, damit Tagline direkt darunter liegt
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
    justifyContent: 'center',
    position: 'relative',
  },
  wishlistHeartContainer: {
    position: 'relative',
  },
  wishlistHeart: {
    fontSize: 24,
    color: '#FFFFFF',
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
  },
  logoImageWrapper: {
    width: 40,
    height: 40,
    marginLeft: 6, // Reduziert von 12 auf 6 (50%)
    marginRight: 6, // Reduziert von 12 auf 6 (50%)
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
    borderWidth: 2,
    borderColor: '#FFFFFF',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#2c2c2c',
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#2c2c2c',
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
  clearButton: {
    marginLeft: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  wishCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  wishCardWithMatch: {
    borderColor: '#a9c7cd',
    borderWidth: 2,
    backgroundColor: 'rgba(218, 165, 32, 0.1)',
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6, // Reduziert von 12 auf 6 (50%)
  },
  cardIconText: {
    fontSize: 24,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  matchBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#a9c7cd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 5,
  },
  matchBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2c2c2c',
  },
  matchIndicator: {
    marginLeft: 10,
  },
  matchIndicatorText: {
    fontSize: 24,
  },
  cardNotes: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#DAA520', // Gold
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabText: {
    fontSize: 32,
    color: '#2c2c2c',
    fontWeight: 'bold',
  },
  checkButton: {
    position: 'absolute',
    left: 20,
    bottom: 100,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  checkButtonDisabled: {
    opacity: 0.5,
  },
  checkButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalBottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '90%',
    backgroundColor: '#2c2c2c',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalCloseButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalCloseButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF', // Weiß
    marginBottom: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  formInput: {
    height: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 15,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  formTextArea: {
    height: 100,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#DAA520', // Gold
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  detailSection: {
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    width: 100,
  },
  detailValue: {
    fontSize: 14,
    color: '#FFFFFF',
    flex: 1,
  },
  matchSection: {
    backgroundColor: 'rgba(218, 165, 32, 0.2)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#a9c7cd',
  },
  matchSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#a9c7cd',
    marginBottom: 15,
    textAlign: 'center',
  },
  viewMatchesButton: {
    backgroundColor: '#a9c7cd',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewMatchesButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
  detailActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    marginBottom: 40,
  },
  detailActionButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  detailActionButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
