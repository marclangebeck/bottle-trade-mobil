import React, { useState } from 'react';
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

export default function SurveyAnswerScreen({ onNavigate, onLogout, survey, onAnswerSurvey, isLoggedIn = false, unreadNotifications = 0, unreadHints = 0 }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAnswerSubmit = () => {
    console.log('Submit-Button geklickt, selectedOption:', selectedOption);
    if (selectedOption === null) {
      Alert.alert('Fehler', 'Bitte wählen Sie eine Antwort aus.');
      return;
    }

    setIsSubmitting(true);
    
    // Hier würde die Antwort in Firebase gespeichert werden
    if (onAnswerSurvey) {
      const success = onAnswerSurvey(survey.id, selectedOption);
      
      if (success) {
        Alert.alert(
          'Antwort abgesendet!', 
          `Vielen Dank für Ihre Teilnahme! Sie erhalten ${survey.btpReward} BTP als Belohnung.`,
          [
            { text: 'OK', onPress: () => onNavigate('notifications') }
          ]
        );
      } else {
        Alert.alert(
          'Bereits teilgenommen', 
          'Sie haben bereits an dieser Umfrage teilgenommen.',
          [
            { text: 'OK', onPress: () => onNavigate('notifications') }
          ]
        );
      }
    }
    
    setIsSubmitting(false);
  };

  if (!survey) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Umfrage nicht gefunden</Text>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => onNavigate('notifications')}
          >
            <Text style={styles.backButtonText}>Zurück zu Nachrichten</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
        borderBottomWidth: 0.5,
        borderBottomColor: 'rgba(255, 255, 255, 0.2)'
      }} />
      
      <View style={styles.container}>
        <DynamicHamburgerMenu 
          onNavigate={onNavigate} 
          isLoggedIn={true} 
          onLogout={onLogout} 
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
              <Text style={styles.greeting}>Umfrage</Text>
            </View>
            <View style={styles.headerRight} />
          </View>
          
          <ScrollView 
            style={styles.content} 
            showsVerticalScrollIndicator={false}
            scrollEnabled={survey?.options?.length > 3}
          >
            <View style={styles.dashboardContainer}>
              {/* Survey Info */}
              <View style={styles.surveyInfo}>
                <Text style={styles.surveyTitle}>{survey.title}</Text>
                <Text style={styles.surveyQuestion}>{survey.question}</Text>
                <View style={styles.rewardInfo}>
                  <Text style={styles.rewardText}>🎁 Belohnung: {survey.btpReward} BTP</Text>
                </View>
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
                <Text style={styles.statsTitle}>Umfrage-Statistiken</Text>
                <View style={styles.statsRow}>
                  <Text style={styles.statText}>Teilnehmer: {survey.responses}</Text>
                  <Text style={styles.statText}>Erstellt: {survey.createdAt}</Text>
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
        unreadNotifications={unreadNotifications}
        unreadHints={unreadHints}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: 'rgba(218, 165, 32, 0.4)', // Warmes Gold mit Glassmorphism
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
    minHeight: 90,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(218, 165, 32, 0.5)', // Warmes Gold Akzent
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(218, 165, 32, 0.3)',
    // Glassmorphism Effekt
    shadowColor: '#DAA520',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
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
    backgroundColor: '#2c2c2c', // Dunkler auf hellem Header
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c2c2c', // Dunkler Text auf hellem Header
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
  content: {
    flex: 1,
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
    color: '#2f3a3b',
    marginBottom: 20,
  },
});
