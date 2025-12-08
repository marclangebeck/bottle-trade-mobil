import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
import OptimizedImage from '../components/OptimizedImage';
import { collection, getDocs, deleteDoc, doc, writeBatch, updateDoc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase-web';
import { deleteNotificationsForHint } from '../services/database-web';

export default function AdminHintsScreen({ onNavigate, onLogout, isLoggedIn = false, unreadCount = 0 }, isPro = false) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [firestoreHints, setFirestoreHints] = useState([]);

  useEffect(() => {
    loadFirestoreHints();
  }, []);

  const loadFirestoreHints = async () => {
    try {
      setIsLoading(true);
      // Lade alle Chats und filtere nur Hinweise
      const hintsQuery = query(
        collection(db, 'chats'),
        orderBy('createdAt', 'desc')
      );
      const hintsSnapshot = await getDocs(hintsQuery);
      const hintsData = hintsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(hint => {
          // Nur Hinweise (entryType === 'hint')
          if (hint.entryType !== 'hint') return false;
          // Filtere gelöschte Hinweise
          if (hint.deleted === true) return false;
          return true;
        });
      setFirestoreHints(hintsData);
      console.log(`✅ ${hintsData.length} Hinweise geladen`);
    } catch (error) {
      console.error('❌ Error loading hints:', error);
      // Fallback: Lade alle ohne Query
      try {
        const hintsSnapshot = await getDocs(collection(db, 'chats'));
        const hintsData = hintsSnapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(hint => {
            if (hint.entryType !== 'hint') return false;
            if (hint.deleted === true) return false;
            return true;
          });
        setFirestoreHints(hintsData);
        console.log(`✅ ${hintsData.length} Hinweise geladen (Fallback)`);
      } catch (fallbackError) {
        console.error('❌ Error loading hints (Fallback):', fallbackError);
        setFirestoreHints([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHint = async (hintId) => {
    Alert.alert(
      'Hinweis löschen',
      'Möchten Sie diesen Hinweis wirklich löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
          try {
            const hint = firestoreHints.find(h => h.id === hintId);
            const tradeRequestId = hint?.tradeRequestId || hint?.requestId || null;
            
            // Markiere Hinweis als gelöscht in Firestore
            await updateDoc(doc(db, 'chats', hintId), {
              deleted: true,
              deletedAt: new Date(),
              deletedBy: 'admin'
            });
            
            // Lösche zugehörige Notifications
            try {
              const userIds = new Set();
              if (hint?.userId) userIds.add(hint.userId);
              if (hint?.fromUserId) userIds.add(hint.fromUserId);
              if (hint?.toUserId) userIds.add(hint.toUserId);
              
              if (tradeRequestId && userIds.size > 0) {
                await Promise.all(
                  Array.from(userIds).map(uid =>
                    deleteNotificationsForHint(uid, tradeRequestId)
                  )
                );
              }
            } catch (notifError) {
              console.error('⚠️ Fehler beim Löschen der Notifications:', notifError);
            }
            
            // Aktualisiere die Liste
            setFirestoreHints(prev => prev.filter(h => h.id !== hintId));
            
            // Lade die Liste neu
            await loadFirestoreHints();
            
            Alert.alert('Erfolg', 'Hinweis wurde gelöscht!');
          } catch (error) {
            console.error('❌ Fehler beim Löschen:', error);
            Alert.alert('Fehler', 'Hinweis konnte nicht gelöscht werden.');
          }
        }}
      ]
    );
  };

  const handleDeleteAllHints = () => {
    Alert.alert(
      'Alle Hinweise löschen',
      'Möchten Sie wirklich ALLE Hinweise löschen?\n\nDiese Aktion kann nicht rückgängig gemacht werden!',
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Alle löschen', style: 'destructive', onPress: async () => {
          try {
            // Lade alle Hinweise
            const hintsQuery = query(
              collection(db, 'chats'),
              orderBy('createdAt', 'desc')
            );
            let hintsSnapshot;
            try {
              hintsSnapshot = await getDocs(hintsQuery);
            } catch (error) {
              hintsSnapshot = await getDocs(collection(db, 'chats'));
            }
            
            // Filtere nur Hinweise die noch nicht gelöscht sind
            const hintsToDelete = hintsSnapshot.docs.filter(docSnapshot => {
              const hintData = docSnapshot.data();
              if (hintData.entryType !== 'hint') return false;
              if (hintData.deleted === true) return false;
              return true;
            });
            
            if (hintsToDelete.length === 0) {
              Alert.alert('Info', 'Keine Hinweise zum Löschen gefunden.');
              return;
            }
            
            // Markiere alle Hinweise als gelöscht
            const batch = writeBatch(db);
            hintsToDelete.forEach(docSnapshot => {
              batch.update(docSnapshot.ref, {
                deleted: true,
                deletedAt: new Date(),
                deletedBy: 'admin'
              });
            });
            await batch.commit();
            
            console.log(`✅ ${hintsToDelete.length} Hinweise als gelöscht markiert`);
            
            // Lösche zugehörige Notifications
            try {
              const allUsersSnapshot = await getDocs(collection(db, 'users'));
              for (const userDoc of allUsersSnapshot.docs) {
                const userId = userDoc.id;
                const notificationsSnapshot = await getDocs(
                  collection(db, 'users', userId, 'notifications')
                );
                
                const notifBatch = writeBatch(db);
                notificationsSnapshot.docs.forEach(notifDoc => {
                  const notifData = notifDoc.data();
                  // Lösche alle hint-decision und hint-small Notifications
                  if (notifData.type === 'hint-decision' || notifData.type === 'hint-small') {
                    notifBatch.delete(doc(db, 'users', userId, 'notifications', notifDoc.id));
                  }
                });
                if (notificationsSnapshot.docs.length > 0) {
                  await notifBatch.commit();
                }
              }
            } catch (notifError) {
              console.error('⚠️ Fehler beim Löschen der Notifications (fortsetzen):', notifError);
            }
            
            setFirestoreHints([]);
            await loadFirestoreHints();
            
            Alert.alert('Erfolg', `${hintsToDelete.length} Hinweise wurden gelöscht!`);
          } catch (error) {
            console.error('❌ Fehler beim Löschen aller Hinweise:', error);
            Alert.alert('Fehler', 'Hinweise konnten nicht gelöscht werden.');
          }
        }}
      ]
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unbekannt';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleString('de-DE');
    } catch (error) {
      return 'Unbekannt';
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
      <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
      <View style={styles.container}>
        <DynamicHamburgerMenu 
          onNavigate={onNavigate} 
          isLoggedIn={true} 
          onLogout={onLogout} 
          isAdmin={true} 
          unreadCount={unreadCount}
          renderButton={false}
          externalMenuVisible={isMenuVisible}
          onMenuToggle={setIsMenuVisible}
        />
        
        <View style={styles.contentContainer}>
          {/* Logo und Schriftzug mit Hamburger-Menü und Profil-Icon */}
          <View style={styles.logoHeaderContainer}>
            {/* Hamburger-Menü links */}
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
            <TouchableOpacity 
              style={styles.profileIconContainer}
              onPress={() => onNavigate('profil')}
            >
              <View style={styles.profileIconCircle}>
                <Text style={styles.profileIconText}>P</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          {/* Tagline unter dem Logo-Header */}
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>Tausch dich durch die Welt der Weine.</Text>
          </View>
          
          {/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Hinweis-Verwaltung</Text>
            </View>
          </View>
          
<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => onNavigate('admin-dashboard')}
              >
                <Text style={styles.backButtonText}>← Zurück zum Admin-Bereich</Text>
              </TouchableOpacity>
              
              <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Gesamt: {firestoreHints.length} Hinweise</Text>
                <Text style={styles.statsSubtitle}>
                  Alle Hinweise in Firestore
                </Text>
              </View>

              {firestoreHints.length > 0 && (
                <TouchableOpacity 
                  style={styles.deleteAllButton}
                  onPress={handleDeleteAllHints}
                >
                  <Text style={styles.deleteAllButtonText}>🗑️ Alle Hinweise löschen</Text>
                </TouchableOpacity>
              )}

              {isLoading ? (
                <View style={styles.loadingState}>
                  <Text style={styles.loadingText}>Lade Hinweise...</Text>
                </View>
              ) : firestoreHints.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyIcon}>💡</Text>
                  <Text style={styles.emptyTitle}>Keine Hinweise vorhanden</Text>
                </View>
              ) : (
                <View style={styles.hintsList}>
                  {firestoreHints.map((hint) => (
                    <View key={hint.id} style={styles.hintCard}>
                      <View style={styles.hintHeader}>
                        <Text style={styles.hintIcon}>💡</Text>
                        <View style={styles.hintInfo}>
                          <Text style={styles.hintTitle}>
                            Hinweis #{hint.id.substring(0, 8)}
                          </Text>
                          <Text style={styles.hintSource}>Firestore</Text>
                          {hint.hintType && (
                            <Text style={styles.hintType}>Typ: {hint.hintType}</Text>
                          )}
                          {hint.tradeRequestId && (
                            <Text style={styles.hintTradeRequest}>Trade-Request: {hint.tradeRequestId.substring(0, 8)}</Text>
                          )}
                          <Text style={styles.hintDate}>Erstellt: {formatDate(hint.createdAt)}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.deleteButton}
                          onPress={() => handleDeleteHint(hint.id)}
                        >
                          <Text style={styles.deleteButtonText}>🗑️</Text>
                        </TouchableOpacity>
                      </View>
                      {hint.lastMessage && (
                        <Text style={styles.lastMessage}>{hint.lastMessage}</Text>
                      )}
                    </View>
                  ))}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
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
  profileIconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(47, 58, 59, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: '#D2691E',
    paddingBottom: 8,
  },
  statsSubtitle: {
    fontSize: 14,
    color: '#666666',
  },
  deleteAllButton: {
    backgroundColor: '#F44336',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteAllButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#FFFFFF',
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
  },
  hintsList: {
    marginBottom: 20,
  },
  hintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    borderWidth: 1,
    borderColor: 'rgba(47, 58, 59, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  hintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  hintIcon: {
    fontSize: 24,
    marginRight: 6, // Reduziert von 12 auf 6 (50%)
  },
  hintInfo: {
    flex: 1,
  },
  hintTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 2,
  },
  hintSource: {
    fontSize: 12,
    color: '#666666',
    fontStyle: 'italic',
  },
  hintType: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  hintTradeRequest: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  hintDate: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  deleteButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1.5,
    borderColor: '#F44336',
  },
  deleteButtonText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: '#333333',
    marginTop: 5,
  },
  backButton: {
    backgroundColor: '#D2691E',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#D2691E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

