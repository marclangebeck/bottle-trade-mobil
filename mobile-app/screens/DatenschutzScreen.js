import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Platform } from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import BottomNavigation from '../components/BottomNavigation';
import OptimizedImage from '../components/OptimizedImage';
import { getCurrentUser } from '../services/testAuth';
import { getUser } from '../services/database-web';

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

export default function DatenschutzScreen({ onNavigate, onLogout, isAdmin = false, unreadCount = 0, isLoggedIn = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        loadProfileImage(currentUser.uid);
      }
    }
  }, [isLoggedIn]);

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
        isLoggedIn={isLoggedIn} 
        onLogout={onLogout} 
        isAdmin={isAdmin} 
        unreadCount={unreadCount}
        renderButton={false}
        externalMenuVisible={isMenuVisible}
        onMenuToggle={setIsMenuVisible}
      />
      
      <View style={styles.contentContainer}>
          {/* Logo und Schriftzug mit Hamburger-Menü */}
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
            {isLoggedIn ? (
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
            ) : (
              <View style={styles.headerRight} />
            )}
          </View>
          
          {/* Tagline unter dem Logo-Header */}
          <View style={styles.taglineContainer}>
            <Text style={styles.taglineText}>Tausch dich durch die Welt der Weine.</Text>
          </View>
          
          {/* Header mit Überschrift */}
          <View style={styles.header}>
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Datenschutzerklärung</Text>
            </View>
          </View>

        {/* Content */}
        <ScrollView 
          style={styles.content} 
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.dashboardContainer}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📄 Datenschutzerklärung für die Bottle-Trade App</Text>
              <Text style={styles.text}>
                Stand: 01.12.2025
              </Text>
              <Text style={styles.divider}>⸻</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>1. Verantwortlicher</Text>
              <Text style={styles.text}>
                Verantwortlich für die Datenverarbeitung in dieser App im Sinne der DSGVO ist:
              </Text>
              <Text style={styles.text}>
                Bottle-Trade{'\n'}
                Marc Langebeck{'\n'}
                Moltkestr. 41{'\n'}
                24105 Kiel{'\n'}
                Deutschland{'\n'}
                {'\n'}
                E-Mail: kontakt@bottle-trade.de
              </Text>
              <Text style={styles.divider}>⸻</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>2. Überblick über die Datenverarbeitung</Text>
              <Text style={styles.text}>
                Wenn Sie unsere App nutzen, verarbeiten wir personenbezogene Daten.
                Personenbezogene Daten sind alle Informationen, mit denen Sie persönlich identifiziert werden können.
              </Text>
              <Text style={styles.text}>
                Im Folgenden erläutern wir, welche Daten wir verarbeiten, zu welchen Zwecken und auf welcher Rechtsgrundlage.
              </Text>
              <Text style={styles.divider}>⸻</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>3. Welche Daten verarbeiten wir?</Text>
              
              <Text style={styles.subsectionTitle}>3.1 Registrierungs- und Profildaten</Text>
              <Text style={styles.text}>
                Bei der Registrierung und Nutzung der App verarbeiten wir insbesondere:
              </Text>
              <Text style={styles.bulletPoint}>• Benutzername</Text>
              <Text style={styles.bulletPoint}>• E-Mail-Adresse</Text>
              <Text style={styles.bulletPoint}>• Vor- und Nachname</Text>
              <Text style={styles.bulletPoint}>• Adressdaten (Straße, PLZ, Ort)</Text>
              <Text style={styles.bulletPoint}>• Passwort (verschlüsselt gespeichert)</Text>
              <Text style={styles.bulletPoint}>• Profilbild (optional)</Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Zweck:</Text>
              </Text>
              <Text style={styles.bulletPoint}>• Erstellung und Verwaltung Ihres Nutzerkontos</Text>
              <Text style={styles.bulletPoint}>• Darstellung Ihres Profils in der App</Text>
              <Text style={styles.bulletPoint}>• Ermöglichung von Tauschgeschäften</Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Rechtsgrundlage:</Text>
              </Text>
              <Text style={styles.text}>
                Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung – Nutzung der App und Tauschplattform).
              </Text>
              <Text style={styles.divider}>⸻</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>3.2 Inhaltsdaten in der App</Text>
              <Text style={styles.text}>
                Dazu gehören insbesondere:
              </Text>
              <Text style={styles.bulletPoint}>• Wein-Daten (Einträge im Weinregal)</Text>
              <Text style={styles.bulletPoint}>• Angaben zu Angeboten und Gesuchen</Text>
              <Text style={styles.bulletPoint}>• Tausch-Anfragen und Tausch-Historie</Text>
              <Text style={styles.bulletPoint}>• Chat-Nachrichten mit anderen Nutzern</Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Zweck:</Text>
              </Text>
              <Text style={styles.bulletPoint}>• Bereitstellung der Tauschfunktionen</Text>
              <Text style={styles.bulletPoint}>• Kommunikation zwischen Tauschpartnern</Text>
              <Text style={styles.bulletPoint}>• Dokumentation der durchgeführten Tauschgeschäfte</Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Rechtsgrundlage:</Text>
              </Text>
              <Text style={styles.text}>
                Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
              </Text>
              <Text style={styles.divider}>⸻</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>3.3 Kommunikationsdaten</Text>
              <Text style={styles.bulletPoint}>• E-Mails an uns</Text>
              <Text style={styles.bulletPoint}>• Systemnachrichten in der App</Text>
              <Text style={styles.bulletPoint}>• ggf. Push-Benachrichtigungen (soweit aktiviert)</Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Zweck:</Text>
              </Text>
              <Text style={styles.bulletPoint}>• Beantwortung von Anfragen</Text>
              <Text style={styles.bulletPoint}>• Informationen zu Tauschvorgängen, Systemhinweisen und sicherheitsrelevanten Themen</Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Rechtsgrundlage:</Text>
              </Text>
              <Text style={styles.text}>
                Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und{'\n'}
                Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer funktionierenden Kommunikation).
              </Text>
              <Text style={styles.text}>
                Soweit Sie optional Push-Benachrichtigungen aktivieren, erfolgt dies auf Grundlage Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
                Die Einwilligung können Sie jederzeit in den App-Einstellungen widerrufen.
              </Text>
              <Text style={styles.divider}>⸻</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>3.4 Nutzungs- und Gerätedaten</Text>
              <Text style={styles.text}>
                Bei der Nutzung der App werden aus technischen Gründen automatisiert bestimmte Daten erfasst, z. B.:
              </Text>
              <Text style={styles.bulletPoint}>• Geräteinformationen (Gerätemodell, Betriebssystemversion, App-Version)</Text>
              <Text style={styles.bulletPoint}>• Zeitpunkt der Nutzung</Text>
              <Text style={styles.bulletPoint}>• technische Logdaten (z. B. Fehlermeldungen)</Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Zweck:</Text>
              </Text>
              <Text style={styles.bulletPoint}>• Sicherstellung der technischen Funktionsfähigkeit</Text>
              <Text style={styles.bulletPoint}>• Fehleranalyse und Stabilitätsverbesserung</Text>
              <Text style={styles.bulletPoint}>• Missbrauchs- und Angriffserkennung</Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Rechtsgrundlage:</Text>
              </Text>
              <Text style={styles.text}>
                Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und stabilen Betrieb der App).
              </Text>
              <Text style={styles.divider}>⸻</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.subsectionTitle}>3.5 Adressweitergabe an Tauschpartner</Text>
              <Text style={styles.text}>
                Im Rahmen eines zustande gekommenen Tauschgeschäfts kann es erforderlich sein, dass Ihr Tauschpartner Ihre Adresse erhält (z. B. zur postalischen Versendung einer Flasche).
              </Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Zweck:</Text>
              </Text>
              <Text style={styles.text}>
                Durchführung des vereinbarten Tauschgeschäfts zwischen den Nutzern.
              </Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Rechtsgrundlage:</Text>
              </Text>
              <Text style={styles.text}>
                Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung – Tauschabwicklung).
              </Text>
              <Text style={styles.divider}>⸻</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>4. Firebase / Google Cloud</Text>
              <Text style={styles.text}>
                Wir verwenden für die technische Bereitstellung der App und die Speicherung von Daten Dienste von Google Firebase (Google Cloud).
              </Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Dienstanbieter:</Text>
              </Text>
              <Text style={styles.text}>
                Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.
              </Text>
              <Text style={styles.text}>
                Dazu können insbesondere gehören:
              </Text>
              <Text style={styles.bulletPoint}>• Firebase Authentication (Login/Registrierung)</Text>
              <Text style={styles.bulletPoint}>• Cloud Firestore / Realtime Database (Speicherung von App-Daten)</Text>
              <Text style={styles.bulletPoint}>• Cloud Storage (z. B. Profilbilder)</Text>
              <Text style={styles.bulletPoint}>• ggf. Firebase Cloud Messaging (Push-Benachrichtigungen)</Text>
              <Text style={styles.text}>
                Wir haben Firebase so konfiguriert, dass Daten möglichst in Rechenzentren innerhalb der EU gespeichert werden. Dennoch kann nicht ausgeschlossen werden, dass Daten im Rahmen des Google-Konzerns auch in Drittländer (insbesondere die USA) übertragen werden.
              </Text>
              <Text style={styles.text}>
                Für diese Fälle stützt sich Google auf EU-Standardvertragsklauseln im Sinne von Art. 46 DSGVO. Weitere Informationen finden Sie in der Datenschutzerklärung von Google:
              </Text>
              <Text style={styles.text}>
                https://policies.google.com/privacy
              </Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Rechtsgrundlage:</Text>
              </Text>
              <Text style={styles.text}>
                Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) und{'\n'}
                Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einer sicheren, skalierbaren Infrastruktur).
              </Text>
              <Text style={styles.divider}>⸻</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>5. Werden Daten zu Werbezwecken genutzt?</Text>
              <Text style={styles.text}>
                Wir verwenden derzeit keine Werbe-Tracking-Tools und keine Werbe-Netzwerke (Ad Networks).
                Es findet kein Profiling zu Werbezwecken statt.
              </Text>
              <Text style={styles.text}>
                Sollten wir in Zukunft Werbe-Technologien einführen, werden wir die Datenschutzerklärung entsprechend anpassen und – soweit erforderlich – Ihre Einwilligung einholen.
              </Text>
              <Text style={styles.divider}>⸻</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>6. Speicherdauer und Löschung</Text>
              <Text style={styles.text}>
                Wir speichern personenbezogene Daten grundsätzlich nur so lange, wie es für die in dieser Erklärung genannten Zwecke erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
              </Text>
              <Text style={styles.text}>
                Wenn Sie Ihr Nutzerkonto löschen lassen möchten, werden wir Ihre personenbezogenen Daten löschen, soweit keine gesetzlichen Aufbewahrungspflichten (z. B. nach Handels- oder Steuerrecht) entgegenstehen.
              </Text>
              <Text style={styles.text}>
                Chat-Inhalte und Tausch-Historien können aus Gründen der Nachvollziehbarkeit und Beweissicherung für einen angemessenen Zeitraum gespeichert bleiben; personenbezogene Bezüge werden dabei soweit möglich reduziert.
              </Text>
              <Text style={styles.divider}>⸻</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>7. Ihre Rechte</Text>
              <Text style={styles.text}>
                Sie haben bezüglich Ihrer personenbezogenen Daten die folgenden Rechte:
              </Text>
              <Text style={styles.bulletPoint}>• Recht auf Auskunft (Art. 15 DSGVO)</Text>
              <Text style={styles.bulletPoint}>• Recht auf Berichtigung (Art. 16 DSGVO)</Text>
              <Text style={styles.bulletPoint}>• Recht auf Löschung (Art. 17 DSGVO)</Text>
              <Text style={styles.bulletPoint}>• Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</Text>
              <Text style={styles.bulletPoint}>• Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</Text>
              <Text style={styles.bulletPoint}>• Widerspruchsrecht (Art. 21 DSGVO)</Text>
              <Text style={styles.bulletPoint}>• Recht auf Widerruf einer Einwilligung (Art. 7 Abs. 3 DSGVO)</Text>
              <Text style={styles.bulletPoint}>• Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)</Text>
              <Text style={styles.text}>
                Zur Ausübung Ihrer Rechte können Sie uns jederzeit unter kontakt@bottle-trade.de kontaktieren.
              </Text>
              <Text style={styles.text}>
                <Text style={styles.boldText}>Zuständige Aufsichtsbehörde ist in der Regel:</Text>
              </Text>
              <Text style={styles.text}>
                Unabhängiges Landeszentrum für Datenschutz Schleswig-Holstein (ULD){'\n'}
                Holstenstraße 98{'\n'}
                24103 Kiel{'\n'}
                Deutschland
              </Text>
              <Text style={styles.divider}>⸻</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>8. Datensicherheit</Text>
              <Text style={styles.text}>
                Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten gegen Verlust, Zerstörung, unbefugten Zugriff oder unbefugte Veränderung zu schützen. Dazu gehören u. a.:
              </Text>
              <Text style={styles.bulletPoint}>• Verschlüsselte Datenübertragung (TLS/HTTPS)</Text>
              <Text style={styles.bulletPoint}>• Beschränkung des Zugriffs auf personenbezogene Daten</Text>
              <Text style={styles.bulletPoint}>• Regelmäßige Aktualisierung der Systeme</Text>
              <Text style={styles.text}>
                Bitte beachten Sie, dass eine völlig lückenlose Sicherheit bei der Datenübertragung im Internet nicht gewährleistet werden kann.
              </Text>
              <Text style={styles.divider}>⸻</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>9. Änderungen dieser Datenschutzerklärung</Text>
              <Text style={styles.text}>
                Wir behalten uns vor, diese Datenschutzerklärung anzupassen, wenn sich die App oder die zugrunde liegenden Verarbeitungen ändern oder neue rechtliche Vorgaben dies erfordern.
              </Text>
              <Text style={styles.text}>
                Die jeweils aktuelle Version ist in der App unter „Datenschutz" einsehbar.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Fixed Bottom Navigation */}
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
    backgroundColor: '#2c2c2c',
  },
  contentContainer: {
    flex: 1,
  },
  logoHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 10 : 40,
    paddingBottom: 0, // Auf 0px gesetzt, damit Tagline direkt darunter liegt
    backgroundColor: '#2c2c2c',
  },
  headerLeft: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: 48,
    flexDirection: 'column',
  },
  hamburgerContainer: {
    // Kein marginRight mehr, da in headerLeft
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
  headerRight: {
    flex: 0,
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#2c2c2c',
  },
  scrollContentContainer: {
    padding: 20,
    paddingBottom: 100,
  },
  dashboardContainer: {
    flex: 1,
  },
  section: {
    marginBottom: 30,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 15,
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
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
    marginTop: 15,
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginBottom: 10,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
    marginLeft: 10,
    marginBottom: 5,
  },
  linkButton: {
    marginTop: 10,
    paddingVertical: 10,
  },
  linkText: {
    fontSize: 16,
    color: '#a9c7cd',
    fontWeight: '600',
  },
  divider: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginVertical: 15,
    opacity: 0.6,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#2c2c2c',
  },
});

