import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';
import ProVersionButton from '../components/ProVersionButton';
import OptimizedImage from '../components/OptimizedImage';

export default function AdminSurveysScreen({ onNavigate, onLogout, surveys = [], onCreateSurvey, onDeleteSurvey, onEndSurvey, onGetSurveyAnswers = null, isLoggedIn = false, unreadCount = 0 }, isPro = false) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isCreatingSurvey, setIsCreatingSurvey] = useState(false);
  const [surveyData, setSurveyData] = useState({
    title: '',
    question: '',
    options: ['', ''],
    targetGroup: 'all' // all, active, premium
  });
  const [surveyResponseCounts, setSurveyResponseCounts] = useState({}); // { surveyId: count }

  // Verwende die übergebenen Surveys
  const existingSurveys = surveys;

  // Lade Antworten-Anzahl für alle Surveys
  useEffect(() => {
    if (surveys.length > 0 && onGetSurveyAnswers) {
      const loadResponseCounts = async () => {
        const counts = {};
        for (const survey of surveys) {
          try {
            const answers = await onGetSurveyAnswers(survey.id);
            counts[survey.id] = answers.length;
          } catch (error) {
            console.error(`❌ Fehler beim Laden der Antworten für Survey ${survey.id}:`, error);
            counts[survey.id] = 0;
          }
        }
        setSurveyResponseCounts(counts);
      };
      loadResponseCounts();
    }
  }, [surveys, onGetSurveyAnswers]);

  const handleCreateSurvey = () => {
    console.log('🔄 Erstelle neue Umfrage...', surveyData);
    
    if (!surveyData.title || !surveyData.question) {
      console.log('❌ Fehler: Pflichtfelder nicht ausgefüllt');
      Alert.alert('Fehler', 'Bitte füllen Sie alle Pflichtfelder aus.');
      return;
    }

    // Leere Optionen entfernen
    const validOptions = surveyData.options.filter(option => option.trim() !== '');
    if (validOptions.length < 2) {
      console.log('❌ Fehler: Zu wenige Antwortoptionen');
      Alert.alert('Fehler', 'Bitte geben Sie mindestens 2 Antwortoptionen ein.');
      return;
    }

    console.log('✅ Umfrage-Daten validiert, erstelle Umfrage...');

    // Umfrage über die übergebene Funktion erstellen
    if (onCreateSurvey) {
      onCreateSurvey(surveyData);
      console.log('✅ Umfrage erfolgreich erstellt und an App.js weitergegeben');
    }
    
    Alert.alert('Erfolg', 'Umfrage wurde erfolgreich erstellt und alle Benutzer wurden benachrichtigt!');
    setIsCreatingSurvey(false);
    setSurveyData({
      title: '',
      question: '',
      options: ['', ''],
      targetGroup: 'all'
    });
  };

  const handleViewResults = (survey) => {
    onNavigate('survey-results', { survey });
  };

  const handleEndSurvey = (survey) => {
    Alert.alert(
      'Umfrage beenden',
      `Möchten Sie die Umfrage "${survey.title}" wirklich beenden?\n\nDie Umfrage wird dann geschlossen und kann nicht mehr beantwortet werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Beenden', style: 'destructive', onPress: () => {
          if (onEndSurvey) {
            onEndSurvey(survey.id);
            Alert.alert('Erfolg', 'Umfrage wurde beendet!');
          } else {
            Alert.alert('Erfolg', 'Umfrage wurde beendet!');
            console.log('Umfrage beendet:', survey.id);
          }
        }}
      ]
    );
  };

  const handleDeleteSurvey = (survey) => {
    Alert.alert(
      'Umfrage löschen',
      `Möchten Sie die Umfrage "${survey.title}" wirklich löschen?\n\nDies kann nicht rückgängig gemacht werden!`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: async () => {
          try {
            if (onDeleteSurvey) {
              await onDeleteSurvey(survey.id);
              Alert.alert('Erfolg', 'Umfrage wurde gelöscht!');
            } else {
              Alert.alert('Fehler', 'Lösch-Funktion nicht verfügbar.');
              console.log('onDeleteSurvey nicht verfügbar');
            }
          } catch (error) {
            console.error('❌ Fehler beim Löschen:', error);
            Alert.alert('Fehler', 'Umfrage konnte nicht gelöscht werden: ' + (error.message || 'Unbekannter Fehler'));
          }
        }}
      ]
    );
  };

  const handleToggleStatus = (survey) => {
    const newStatus = survey.status === 'active' ? 'completed' : 'active';
    Alert.alert(
      'Status ändern',
      `Umfrage "${survey.title}" auf "${newStatus === 'active' ? 'Aktiv' : 'Abgeschlossen'}" setzen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Bestätigen', onPress: () => {
          Alert.alert('Erfolg', `Status wurde auf "${newStatus === 'active' ? 'Aktiv' : 'Abgeschlossen'}" geändert!`);
        }}
      ]
    );
  };

  const addOption = () => {
    if (surveyData.options.length < 6) {
      setSurveyData({
        ...surveyData,
        options: [...surveyData.options, '']
      });
    }
  };

  const removeOption = (index) => {
    if (surveyData.options.length > 2) {
      const newOptions = surveyData.options.filter((_, i) => i !== index);
      setSurveyData({
        ...surveyData,
        options: newOptions
      });
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...surveyData.options];
    newOptions[index] = value;
    setSurveyData({
      ...surveyData,
      options: newOptions
    });
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
            <View style={styles.profileSection}>
              <TouchableOpacity 
                style={styles.profileIconContainer}
                onPress={() => onNavigate('profil')}
              >
                <View style={styles.profileIconCircle}>
                  <Text style={styles.profileIconText}>A</Text>
                </View>
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
              <Text style={styles.greeting}>Umfragen</Text>
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
              
              {!isCreatingSurvey && (
                <TouchableOpacity 
                  style={styles.createButton} 
                  onPress={() => setIsCreatingSurvey(!isCreatingSurvey)}
                >
                  <Text style={styles.createButtonText}>+ Neue Umfrage erstellen</Text>
                </TouchableOpacity>
              )}
              
              {isCreatingSurvey ? (
                <View style={styles.createForm}>
                  <Text style={styles.formTitle}>Neue Umfrage erstellen</Text>
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Titel *</Text>
                    <TextInput
                      style={styles.input}
                      value={surveyData.title}
                      onChangeText={(text) => setSurveyData({...surveyData, title: text})}
                      placeholder="z.B. Weinpräferenzen 2024"
                      placeholderTextColor="#999999"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Frage *</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={surveyData.question}
                      onChangeText={(text) => setSurveyData({...surveyData, question: text})}
                      placeholder="Welche Weinsorte bevorzugen Sie am meisten?"
                      placeholderTextColor="#999999"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Antwortoptionen *</Text>
                    {surveyData.options.map((option, index) => (
                      <View key={index} style={styles.optionRow}>
                        <TextInput
                          style={[styles.input, styles.optionInput]}
                          value={option}
                          onChangeText={(text) => updateOption(index, text)}
                          placeholder={`Option ${index + 1}`}
                          placeholderTextColor="#999999"
                        />
                        {surveyData.options.length > 2 && (
                          <TouchableOpacity 
                            style={styles.removeButton}
                            onPress={() => removeOption(index)}
                          >
                            <Text style={styles.removeButtonText}>×</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                    {surveyData.options.length < 6 && (
                      <TouchableOpacity style={styles.addOptionButton} onPress={addOption}>
                        <Text style={styles.addOptionText}>+ Option hinzufügen</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Zielgruppe</Text>
                    <View style={styles.radioGroup}>
                      <TouchableOpacity 
                        style={[styles.radioOption, surveyData.targetGroup === 'all' && styles.radioSelected]}
                        onPress={() => setSurveyData({...surveyData, targetGroup: 'all'})}
                      >
                        <Text style={[styles.radioText, surveyData.targetGroup === 'all' && styles.radioTextSelected]}>
                          Alle Benutzer
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.radioOption, surveyData.targetGroup === 'active' && styles.radioSelected]}
                        onPress={() => setSurveyData({...surveyData, targetGroup: 'active'})}
                      >
                        <Text style={[styles.radioText, surveyData.targetGroup === 'active' && styles.radioTextSelected]}>
                          Nur aktive Benutzer
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.buttonRow}>
                    <TouchableOpacity 
                      style={styles.cancelButton} 
                      onPress={() => setIsCreatingSurvey(false)}
                    >
                      <Text style={styles.cancelButtonText}>Abbrechen</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.createSurveyButton} 
                      onPress={handleCreateSurvey}
                    >
                      <Text style={styles.createSurveyButtonText}>Umfrage erstellen</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <Text style={styles.sectionTitle}>Bestehende Umfragen</Text>
                  {existingSurveys.map((survey) => (
                    <View key={survey.id} style={styles.surveyCard}>
                      <View style={styles.surveyHeader}>
                        <Text style={styles.surveyTitle}>{survey.title}</Text>
                        <View style={[styles.statusBadge, survey.status === 'active' ? styles.activeBadge : styles.completedBadge]}>
                          <Text style={styles.statusText}>
                            {survey.status === 'active' ? 'Aktiv' : 'Abgeschlossen'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.surveyQuestion}>{survey.question}</Text>
                      <View style={styles.surveyStats}>
                        <Text style={styles.statText}>
                          {surveyResponseCounts[survey.id] !== undefined 
                            ? `${surveyResponseCounts[survey.id]} Antworten` 
                            : survey.responses !== undefined 
                              ? `${survey.responses} Antworten` 
                              : 'Lade...'}
                        </Text>
                        <Text style={styles.statText}>
                          {survey.createdAt 
                            ? (survey.createdAt.toDate 
                              ? survey.createdAt.toDate().toLocaleDateString('de-DE') 
                              : survey.createdAt.seconds 
                                ? new Date(survey.createdAt.seconds * 1000).toLocaleDateString('de-DE')
                                : new Date(survey.createdAt).toLocaleDateString('de-DE'))
                            : 'Unbekannt'}
                        </Text>
                      </View>
                      
                      {/* Aktions-Buttons */}
                      <View style={styles.surveyActions}>
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.resultsButton]} 
                          onPress={() => handleViewResults(survey)}
                        >
                          <Text style={styles.actionButtonText}>📊 Auswertung</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.endButton]} 
                          onPress={() => handleEndSurvey(survey)}
                        >
                          <Text style={styles.actionButtonText}>🏁 Beenden</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                          style={[styles.actionButton, styles.deleteButton]} 
                          onPress={() => handleDeleteSurvey(survey)}
                        >
                          <Text style={styles.actionButtonText}>🗑️ Löschen</Text>
                        </TouchableOpacity>
                      </View>
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
    backgroundColor: '#2c2c2c', // Gleiche Farbe wie StatusBar-Ersatz-View, verhindert weißen Strich
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
  },
  greeting: {
    fontSize: 28,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
    includeFontPadding: false,
  },
  backButton: {
    padding: 10,
    marginBottom: 10,
  },
  backButtonText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createButton: {
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
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  createForm: {
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
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2f3a3b',
    marginBottom: 20,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#D2691E',
    paddingBottom: 8,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2f3a3b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
    color: '#333333',
    fontSize: 16,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 14,
    color: '#333333',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionInput: {
    flex: 1,
    marginRight: 10,
  },
  removeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F44336',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addOptionButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#D2691E',
    borderStyle: 'dashed',
  },
  addOptionText: {
    color: '#D2691E',
    fontSize: 16,
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  radioOption: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  radioSelected: {
    backgroundColor: '#D2691E',
    borderColor: '#D2691E',
  },
  radioText: {
    color: '#2f3a3b',
    fontSize: 14,
    fontWeight: '600',
  },
  radioTextSelected: {
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginRight: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#2f3a3b',
    fontSize: 16,
    fontWeight: '600',
  },
  createSurveyButton: {
    flex: 1,
    backgroundColor: '#D2691E',
    borderRadius: 12,
    padding: 15,
    marginLeft: 10,
    alignItems: 'center',
    shadowColor: '#D2691E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createSurveyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#D2691E',
    paddingBottom: 8,
  },
  surveyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#D2691E',
    borderWidth: 1,
    borderColor: 'rgba(47, 58, 59, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  surveyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  surveyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2f3a3b',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#D2691E',
  },
  completedBadge: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  surveyQuestion: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 15,
  },
  surveyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 12,
    color: '#666666',
  },
  surveyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 0.5,
    borderTopColor: '#E0E0E0',
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginHorizontal: 2,
    alignItems: 'center',
  },
  resultsButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#D2691E',
  },
  endButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#FF9800',
  },
  deleteButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2f3a3b',
  },
});
