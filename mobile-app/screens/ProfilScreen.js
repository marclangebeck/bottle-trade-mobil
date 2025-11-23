import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, Platform, StatusBar, TextInput } from 'react-native';
import OptimizedImage from '../components/OptimizedImage';
import { LinearGradient } from 'expo-linear-gradient';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import { getCurrentUser } from '../services/testAuth';
import { getUser, updateUser } from '../services/database-web';

export default function ProfilScreen({ onNavigate, onLogout, isAdmin = false, isLoggedIn = false, unreadCount = 0 }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userBtp, setUserBtp] = useState(0);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    street: '',
    zipCode: '',
    city: '',
    bio: '',
    profilePublic: false,
    newsletter: false,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        Alert.alert('Fehler', 'Kein eingeloggter User gefunden');
        return;
      }
      setUserBtp(currentUser?.btp ?? 0);

      const userData = await getUser(currentUser.uid);
      if (userData) {
        setUser(userData);
        setFormData({
          username: userData.username || '',
          email: userData.email || '',
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          street: userData.street || '',
          zipCode: userData.zipCode || '',
          city: userData.city || '',
          bio: userData.bio || '',
          profilePublic: userData.profilePublic !== undefined ? userData.profilePublic : true,
          newsletter: userData.newsletter !== undefined ? userData.newsletter : false,
        });
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden der User-Daten:', error);
      Alert.alert('Fehler', 'Profil-Daten konnten nicht geladen werden');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.uid) {
        Alert.alert('Fehler', 'Kein eingeloggter User gefunden');
        return;
      }

      // Validierung (Benutzername wird nicht geprüft, da er nicht geändert werden kann)
      if (!formData.email || !formData.firstName || !formData.lastName) {
        Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus (E-Mail, Vorname, Nachname)');
        return;
      }

      // Update User in Firestore (Benutzername wird nicht geändert, da er nur einmal gesetzt werden kann)
      await updateUser(currentUser.uid, {
        // username wird absichtlich nicht aktualisiert - kann nur bei der Registrierung gesetzt werden
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        street: formData.street,
        zipCode: formData.zipCode,
        city: formData.city,
        bio: formData.bio,
        profilePublic: formData.profilePublic,
        newsletter: formData.newsletter,
        updatedAt: new Date(),
      });

      // Lade Daten neu
      await loadUserData();
      setIsEditing(false);
      Alert.alert('Erfolg', 'Profil erfolgreich aktualisiert!');
    } catch (error) {
      console.error('❌ Fehler beim Speichern:', error);
      Alert.alert('Fehler', 'Profil konnte nicht gespeichert werden: ' + error.message);
    }
  };

  const handleCancel = () => {
    // Lade Daten neu, um Änderungen zu verwerfen
    loadUserData();
    setIsEditing(false);
  };

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogout = () => {
    Alert.alert(
      'Abmelden',
      'Möchten Sie sich wirklich abmelden?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Abmelden', onPress: onLogout },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Lade Profil...</Text>
        </View>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Kein Profil gefunden</Text>
        </View>
      </View>
    );
  }

  const displayName = user.firstName && user.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : user.username || user.email || 'Unbekannt';
  const displayLocation = user.city 
    ? `${user.zipCode ? user.zipCode + ' ' : ''}${user.city}`
    : 'Keine Adresse angegeben';

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
          unreadCount={0}
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
          <TouchableOpacity
            style={styles.wishlistButton}
            onPress={() => onNavigate('wunschliste')}
          >
            <Text style={styles.wishlistHeart}>♡</Text>
          </TouchableOpacity>
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
        
        {/* Profil-Icon und Aktionen rechts */}
          <View style={styles.profileSection}>
          <View style={styles.profileIconContainer}>
            <View style={styles.profileIconCircle}>
              <Text style={styles.profileIconText}>P</Text>
            </View>
          </View>
          <View style={styles.profileBtpBadge}>
            <Text style={styles.profileBtpText}>{`${userBtp} BTP`}</Text>
          </View>
          <View style={styles.profileActions}>
            {!isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.profileActionButton}>
                <Text style={styles.editButton}>✏️</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.editActions}>
                <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                  <Text style={styles.cancelButtonText}>❌</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
                  <Text style={styles.saveButtonText}>✅</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
        </View>
        
        {/* Header mit Überschrift */}
        <View style={styles.header}>
          <View style={styles.headerCenter}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>Profil</Text>
            </View>
          </View>
        </View>
        
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.profileCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.charAt(0).toUpperCase()}</Text>
            </View>
            {isEditing ? (
              <>
                <Text style={styles.inputLabel}>Benutzername (kann nicht geändert werden)</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  placeholder="Benutzername"
                  value={formData.username}
                  editable={false}
                />
                <TextInput
                  style={styles.input}
                  placeholder="E-Mail *"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </>
            ) : (
              <>
                <Text style={styles.userName}>{displayName}</Text>
                <Text style={styles.userEmail}>{user.email || 'Keine E-Mail'}</Text>
                <Text style={styles.userUsername}>@{user.username || 'unbekannt'}</Text>
              </>
            )}
            
            {user.isAdmin && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>👑 Admin</Text>
              </View>
            )}
          </View>

          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.btp || 0}</Text>
              <Text style={styles.statLabel}>BTP</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {user.createdAt ? new Date(user.createdAt.seconds * 1000).getFullYear() : 'N/A'}
              </Text>
              <Text style={styles.statLabel}>Mitglied seit</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>-</Text>
              <Text style={styles.statLabel}>Weine</Text>
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Persönliche Daten</Text>
            
            {isEditing ? (
              <>
                <Text style={styles.inputLabel}>E-Mail-Adresse *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="E-Mail-Adresse"
                  value={formData.email}
                  onChangeText={(value) => updateFormData('email', value)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <Text style={styles.inputLabel}>Vorname *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Vorname"
                  value={formData.firstName}
                  onChangeText={(value) => updateFormData('firstName', value)}
                />
                
                <Text style={styles.inputLabel}>Nachname *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Nachname"
                  value={formData.lastName}
                  onChangeText={(value) => updateFormData('lastName', value)}
                />
                
                <Text style={styles.inputLabel}>Straße</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Straße"
                  value={formData.street}
                  onChangeText={(value) => updateFormData('street', value)}
                />
                
                <Text style={styles.inputLabel}>PLZ</Text>
                <TextInput
                  style={styles.input}
                  placeholder="PLZ"
                  value={formData.zipCode}
                  onChangeText={(value) => updateFormData('zipCode', value)}
                  keyboardType="numeric"
                />
                
                <Text style={styles.inputLabel}>Stadt</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Stadt"
                  value={formData.city}
                  onChangeText={(value) => updateFormData('city', value)}
                />
                
                <Text style={styles.inputLabel}>Über mich</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Beschreibung"
                  value={formData.bio}
                  onChangeText={(value) => updateFormData('bio', value)}
                  multiline
                  numberOfLines={4}
                />
              </>
            ) : (
              <>
                <Text style={styles.infoText}>Benutzername: @{user.username || 'unbekannt'}</Text>
                <Text style={styles.infoText}>E-Mail: {user.email || 'Keine E-Mail'}</Text>
                <Text style={styles.infoText}>Name: {displayName}</Text>
                {(user.street || user.city) && (
                  <Text style={styles.infoText}>Adresse: {user.street || ''} {user.zipCode || ''} {user.city || ''}</Text>
                )}
                {user.bio && (
                  <Text style={styles.bio}>{user.bio}</Text>
                )}
                <Text style={styles.location}>📍 {displayLocation}</Text>
              </>
            )}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>Einstellungen</Text>
            
            {isEditing ? (
              <>
                <TouchableOpacity 
                  style={styles.checkboxRow}
                  onPress={() => updateFormData('profilePublic', !formData.profilePublic)}
                >
                  <Text style={styles.checkboxLabel}>Profil öffentlich</Text>
                  <Text style={styles.checkbox}>{formData.profilePublic ? '✅' : '☐'}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.checkboxRow}
                  onPress={() => updateFormData('newsletter', !formData.newsletter)}
                >
                  <Text style={styles.checkboxLabel}>Newsletter abonnieren</Text>
                  <Text style={styles.checkbox}>{formData.newsletter ? '✅' : '☐'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.infoText}>
                  Profil öffentlich: {user.profilePublic ? 'Ja' : 'Nein'}
                </Text>
                <Text style={styles.infoText}>
                  Newsletter: {user.newsletter ? 'Abonniert' : 'Nicht abonniert'}
                </Text>
              </>
            )}
          </View>

          {!isEditing && (
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Abmelden</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
        </View>
        <Footer />
      </View>
      <BottomNavigation
        onNavigate={onNavigate}
        isLoggedIn={isLoggedIn}
        unreadCount={unreadCount}
      />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#2c2c2c', // Einheitlicher Hintergrund
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  logoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40, // 10px für iOS, damit StatusBar nicht verdeckt wird
    paddingBottom: 10,
    borderBottomWidth: 0,
  },
  headerLeft: {
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
    marginLeft: 12,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoHeaderImage: {
    width: 40,
    height: 40,
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
  profileSection: {
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtpBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#DAA520',
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
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 25,
    backgroundColor: '#2c2c2c',
    position: 'relative',
    marginTop: 0,
    minHeight: 70,
    borderTopWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)', // Subtiler goldener Akzent
  },
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
    width: 40,
    alignItems: 'center',
    marginBottom: 8,
  },
  hamburgerButton: {
    padding: 5,
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
  },
  wishlistHeart: {
    fontSize: 24,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  profileActions: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileActionButton: {
    padding: 5,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 0,
    width: 80,
    alignItems: 'flex-end',
  },
  greetingContainer: {
    // Hintergrund und Border entfernt für elegantes Design
  },
  greeting: {
    fontSize: 30,
    fontWeight: '600',
    color: '#DAA520', // Warmes Gold
    textAlign: 'center',
    letterSpacing: 0.5,
    // Eleganter Gradient-Effekt durch Text-Shadow
    textShadowColor: 'rgba(218, 165, 32, 0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
    includeFontPadding: false,
  },
  editButton: {
    fontSize: 24,
    padding: 5,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    padding: 5,
  },
  cancelButtonText: {
    fontSize: 20,
  },
  saveButton: {
    padding: 5,
  },
  saveButtonText: {
    fontSize: 20,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FFFFFF', // Weiße Border
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8B4513',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  userUsername: {
    fontSize: 14,
    color: '#999',
    marginBottom: 15,
    fontStyle: 'italic',
  },
  badge: {
    backgroundColor: '#D2691E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 10,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    elevation: 2,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    marginTop: 10,
    padding: 20,
    borderRadius: 12,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 15,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  bio: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 10,
  },
  location: {
    fontSize: 14,
    color: '#888',
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  disabledInput: {
    backgroundColor: '#E0E0E0',
    color: '#999',
    borderColor: '#CCC',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 5,
  },
  checkboxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEE',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#666',
  },
  checkbox: {
    fontSize: 20,
  },
  logoutButton: {
    backgroundColor: '#F44336',
    margin: 20,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
