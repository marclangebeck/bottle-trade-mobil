import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
import OptimizedImage from '../components/OptimizedImage';
import { getSurvey, hasUserAnsweredSurvey } from '../services/database-web';
import { getCurrentUser } from '../services/testAuth';

export default function SurveyAnswerScreen({ onNavigate, onLogout, survey: surveyProp, onAnswerSurvey, surveyId, isLoggedIn = false, unreadCount = 0 }, isPro = false) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [survey, setSurvey] = useState(surveyProp);
  const [isLoading, setIsLoading] = useState(!surveyProp);
  const [hasAnswered, setHasAnswered] = useState(false);

  // Lade Survey aus Firestore, wenn nicht als Prop übergeben
  useEffect(() => {
    const loadSurvey = async () => {
      const targetSurveyId = surveyId || surveyProp?.id;
      if (!targetSurveyId) {
        setIsLoading(false);
        return;
      }

      if (surveyProp) {
        // Survey wurde als Prop übergeben, verwende es
        setSurvey(surveyProp);
        setIsLoading(false);
      } else {
        // Lade Survey aus Firestore
        try {
          setIsLoading(true);
          const loadedSurvey = await getSurvey(targetSurveyId);
          if (loadedSurvey) {
            setSurvey(loadedSurvey);
          } else {
            Alert.alert('Fehler', 'Umfrage nicht gefunden.');
            onNavigate('infobox');
          }
        } catch (error) {
          console.error('❌ Fehler beim Laden der Umfrage:', error);
          Alert.alert('Fehler', 'Umfrage konnte nicht geladen werden.');
          onNavigate('infobox');
        } finally {
          setIsLoading(false);
        }
      }

      // Prüfe, ob User bereits geantwortet hat
      const currentUser = getCurrentUser();
      if (currentUser?.uid) {
        try {
          const answered = await hasUserAnsweredSurvey(currentUser.uid, targetSurveyId);
          setHasAnswered(answered);
        } catch (error) {
          console.error('❌ Fehler beim Prüfen der Antwort:', error);
        }
      }
    };

    loadSurvey();
  }, [surveyId, surveyProp?.id]);

  const handleAnswerSubmit = async () => {
    console.log('Submit-Button geklickt, selectedOption:', selectedOption);
    if (selectedOption === null) {
      Alert.alert('Fehler', 'Bitte wählen Sie eine Antwort aus.');
      return;
    }

    if (hasAnswered) {
      Alert.alert('Bereits teilgenommen', 'Sie haben bereits an dieser Umfrage teilgenommen.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Verwende onAnswerSurvey Handler aus App.js (Firestore-Integration)
      if (onAnswerSurvey) {
        const success = await onAnswerSurvey(survey.id, selectedOption);
        
        if (success) {
          setHasAnswered(true);
          Alert.alert(
            'Antwort abgesendet!', 
            'Vielen Dank für Ihre Teilnahme!',
            [
              { text: 'OK', onPress: () => onNavigate('infobox') }
            ]
          );
        } else {
          Alert.alert(
            'Bereits teilgenommen', 
            'Sie haben bereits an dieser Umfrage teilgenommen.',
            [
              { text: 'OK', onPress: () => onNavigate('infobox') }
            ]
          );
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Absenden der Antwort:', error);
      Alert.alert('Fehler', 'Antwort konnte nicht gespeichert werden: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#a9c7cd" />
          <Text style={styles.loadingText}>Lade Umfrage...</Text>
        </View>
      </View>
    );
  }

  if (!survey) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Umfrage nicht gefunden</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => onNavigate('infobox')}
          >
            <Text style={styles.backButtonText}>← Zurück</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (hasAnswered) {
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
                <View style={styles.greetingContainer}>
                  <Text style={styles.greeting}>Umfrage</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Sie haben bereits an dieser Umfrage teilgenommen.</Text>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => onNavigate('infobox')}
              >
                <Text style={styles.backButtonText}>Zurück zur InfoBox</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        <Footer />
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
              <View style={styles.greetingContainer}>
                <Text style={styles.greeting}>Umfrage</Text>
              </View>
            </View>
          </View>
          
          {/* Zurück-Button */}
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => onNavigate('infobox')}
          >
            <Text style={styles.backButtonText}>← Zurück</Text>
          </TouchableOpacity>
          
          <ScrollView 
            style={styles.scrollContent} 
            contentContainerStyle={styles.scrollContentContainer}
            showsVerticalScrollIndicator={false}
            scrollEnabled={survey?.options?.length > 3}
          >
            <View style={styles.dashboardContainer}>
              {/* Survey Info */}
              <View style={styles.surveyInfo}>
                <Text style={styles.surveyTitle}>{survey.title}</Text>
                <Text style={styles.surveyQuestion}>{survey.question}</Text>
              </View>

              {/* Answer Options */}
              <View style={styles.optionsContainer}>
                <Text style={styles.optionsTitle}>Bitte wählen Sie eine Antwort:</Text>
                {survey.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionButton,
                      selectedOption === index && styles.selectedOption
                    ]}
                    onPress={() => {
                      console.log('Option geklickt:', index, option);
                      setSelectedOption(index);
                      console.log('SelectedOption gesetzt auf:', index);
                    }}
                  >
                    <View style={styles.optionContent}>
                      <View style={[
                        styles.radioCircle,
                        selectedOption === index && styles.selectedRadio
                      ]}>
                        {selectedOption === index && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[
                        styles.optionText,
                        selectedOption === index && styles.selectedOptionText
                      ]}>
                        {option}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Submit Button */}
              <TouchableOpacity 
                style={[
                  styles.submitButton,
                  (selectedOption === null || isSubmitting) && styles.submitButtonDisabled
                ]}
                onPress={handleAnswerSubmit}
                disabled={selectedOption === null || isSubmitting}
              >
                <Text style={[
                  styles.submitButtonText,
                  (selectedOption === null || isSubmitting) && styles.submitButtonTextDisabled
                ]}>
                  {isSubmitting ? 'Wird abgesendet...' : 'Antwort absenden'}
                </Text>
              </TouchableOpacity>

              {/* Survey Stats */}
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>Umfrage-Informationen</Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statText}>
                    Erstellt: {survey.createdAt 
                      ? (survey.createdAt.toDate ? survey.createdAt.toDate().toLocaleDateString('de-DE') : survey.createdAt)
                      : 'Unbekannt'}
                  </Text>
                  {survey.status && (
                    <Text style={styles.statText}>
                      Status: {survey.status === 'active' ? 'Aktiv' : survey.status === 'closed' ? 'Geschlossen' : survey.status}
                    </Text>
                  )}
                </View>
              </View>
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
    paddingBottom: 0, // Auf 0px gesetzt, damit Tagline direkt darunter liegt
    backgroundColor: '#2c2c2c',
    position: 'relative',
    marginTop: 0,
    minHeight: 60,
    borderTopWidth: 1,
    borderTopColor: 'rgba(218, 165, 32, 0.2)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(218, 165, 32, 0.2)',
  },
  backButton: {
    padding: 10,
    marginBottom: 0,
    marginHorizontal: 20,
  },
  backButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
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
    borderRadius: 22,
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
    justifyContent: 'center', // Vertikale Zentrierung für die Überschrift
  },
  headerRight: {
    flex: 0,
    width: 80,
    alignItems: 'center',
  },
  greetingContainer: {
    // Hintergrund und Border entfernt für elegantes Design
    justifyContent: 'center',
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
  scrollContent: {
    flex: 1,
    backgroundColor: '#2c2c2c',
    marginTop: 0,
    paddingTop: 0,
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
    paddingTop: 0,
  },
  dashboardContainer: {
    padding: 20,
  },
  surveyInfo: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  surveyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  surveyQuestion: {
    fontSize: 18,
    color: '#CCCCCC',
    lineHeight: 24,
    marginBottom: 15,
  },
  rewardInfo: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  optionButton: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 1,
    elevation: 1,
  },
  selectedOption: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: '#4CAF50',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
  },
  optionText: {
    fontSize: 16,
    color: '#FFFFFF',
    flex: 1,
  },
  selectedOptionText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#666',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  submitButtonTextDisabled: {
    color: '#999',
  },
  statsContainer: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 12,
    padding: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 14,
    color: '#CCCCCC',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FFFFFF',
  },
});
