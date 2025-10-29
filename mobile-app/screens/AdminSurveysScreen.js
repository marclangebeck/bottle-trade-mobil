import React, { useState } from 'react';
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

export default function AdminSurveysScreen({ onNavigate, onLogout, surveys = [], onCreateSurvey, onDeleteSurvey, onEndSurvey, isLoggedIn = false }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isCreatingSurvey, setIsCreatingSurvey] = useState(false);
  const [surveyData, setSurveyData] = useState({
    title: '',
    question: '',
    options: ['', ''],
    btpReward: 5,
    targetGroup: 'all' // all, active, premium
  });

  // Verwende die übergebenen Surveys
  const existingSurveys = surveys;

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
      btpReward: 5,
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
        { text: 'Löschen', style: 'destructive', onPress: () => {
          if (onDeleteSurvey) {
            onDeleteSurvey(survey.id);
            Alert.alert('Erfolg', 'Umfrage wurde gelöscht!');
          } else {
            Alert.alert('Erfolg', 'Umfrage wurde gelöscht!');
            console.log('Umfrage gelöscht:', survey.id);
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
      <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
      
      {/* StatusBar-Ersatz für iPhone */}
      <View style={{
        height: Platform.OS === 'ios' ? 60 : 0,
        backgroundColor: '#2c2c2c',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)'
      }} />
      
      <View style={styles.container}>
        <DynamicHamburgerMenu 
          onNavigate={onNavigate} 
          isLoggedIn={true} 
          onLogout={onLogout} 
          isAdmin={true} 
          unreadNotifications={0}
          renderButton={false}
          externalMenuVisible={isMenuVisible}
          onMenuToggle={setIsMenuVisible}
        />
        
        <View style={styles.contentContainer}>
          {/* Header */}
          <View style={styles.header}>
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
            <View style={styles.headerCenter}>
              <Text style={styles.greeting}>Umfragen</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity 
                style={styles.createButton} 
                onPress={() => setIsCreatingSurvey(!isCreatingSurvey)}
              >
                <Text style={styles.createButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.dashboardContainer}>
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
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Frage *</Text>
                    <TextInput
                      style={[styles.input, styles.textArea]}
                      value={surveyData.question}
                      onChangeText={(text) => setSurveyData({...surveyData, question: text})}
                      placeholder="Welche Weinsorte bevorzugen Sie am meisten?"
                      placeholderTextColor="#999"
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
                          placeholderTextColor="#999"
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
                    <Text style={styles.label}>BTP-Belohnung</Text>
                    <TextInput
                      style={styles.input}
                      value={surveyData.btpReward.toString()}
                      onChangeText={(text) => setSurveyData({...surveyData, btpReward: parseInt(text) || 0})}
                      placeholder="5"
                      placeholderTextColor="#999"
                      keyboardType="numeric"
                    />
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
                        <Text style={styles.statText}>{survey.responses} Antworten</Text>
                        <Text style={styles.statText}>{survey.btpReward} BTP Belohnung</Text>
                        <Text style={styles.statText}>{survey.createdAt}</Text>
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
      <BottomNavigation onNavigate={onNavigate} isLoggedIn={isLoggedIn} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#d5dfe0',
  },
  contentContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 33.75,
    paddingBottom: 33.75,
    backgroundColor: '#2f3a3b',
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
    minHeight: 135,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.3)',
  },
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
    width: 40,
    alignItems: 'center',
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 0,
    width: 80,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  createButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  dashboardContainer: {
    padding: 20,
  },
  createForm: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  addOptionText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  radioGroup: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  radioOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  radioSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  radioText: {
    color: '#FFFFFF',
    fontSize: 14,
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createSurveyButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 15,
    marginLeft: 10,
    alignItems: 'center',
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
  },
  surveyCard: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
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
    color: '#FFFFFF',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: '#4CAF50',
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
    color: '#CCCCCC',
    marginBottom: 15,
  },
  surveyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    fontSize: 12,
    color: '#999',
  },
  surveyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  endButton: {
    backgroundColor: 'rgba(255, 87, 34, 0.2)',
    borderWidth: 1,
    borderColor: '#FF5722',
  },
  deleteButton: {
    backgroundColor: 'rgba(244, 67, 54, 0.2)',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
