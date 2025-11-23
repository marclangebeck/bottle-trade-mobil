import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  StatusBar
} from 'react-native';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import BottomNavigation from '../components/BottomNavigation';

const { width } = Dimensions.get('window');

export default function SurveyResultsScreen({ onNavigate, onLogout, survey, surveyAnswers = [], isLoggedIn = false, unreadNotifications = 0, unreadHints = 0 }) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [results, setResults] = useState(null);

  const calculateResults = () => {
    if (!survey || !survey.options) return;

    const optionCounts = {};
    const totalAnswers = surveyAnswers.filter(answer => answer.surveyId === survey.id).length;

    // Initialisiere alle Optionen mit 0
    survey.options.forEach((option, index) => {
      optionCounts[index] = 0;
    });

    // Zähle die Antworten
    surveyAnswers
      .filter(answer => answer.surveyId === survey.id)
      .forEach(answer => {
        if (optionCounts[answer.selectedOption] !== undefined) {
          optionCounts[answer.selectedOption]++;
        }
      });

    // Berechne Prozente
    const resultsWithPercentages = Object.keys(optionCounts).map(optionIndex => {
      const count = optionCounts[optionIndex];
      const percentage = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0;
      return {
        option: survey.options[optionIndex],
        count,
        percentage
      };
    });

    setResults({
      totalAnswers,
      optionResults: resultsWithPercentages
    });
  };

  useEffect(() => {
    if (survey && surveyAnswers) {
      calculateResults();
    }
  }, [survey, surveyAnswers]);

  const handleBack = () => {
    onNavigate('admin-surveys');
  };

  if (!survey) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
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
              <Text style={styles.greeting}>Umfrage-Auswertung</Text>
            </View>
            <View style={styles.headerRight} />
          </View>
        </View>
        <View style={styles.content}>
          <Text style={styles.errorText}>Keine Umfrage ausgewählt</Text>
        </View>
        <Footer />
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
            <Text style={styles.greeting}>Umfrage-Auswertung</Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.surveyInfo}>
          <Text style={styles.surveyTitle}>{survey.title}</Text>
          <Text style={styles.surveyQuestion}>{survey.question}</Text>
          <Text style={styles.surveyStats}>
            {results ? `${results.totalAnswers} Antworten` : 'Lade...'}
          </Text>
        </View>

        {results && (
          <View style={styles.resultsContainer}>
            <Text style={styles.resultsTitle}>Ergebnisse:</Text>
            
            {results.optionResults.map((result, index) => (
              <View key={index} style={styles.resultItem}>
                <View style={styles.resultHeader}>
                  <Text style={styles.resultOption}>{result.option}</Text>
                  <Text style={styles.resultStats}>
                    {result.count} Stimmen ({result.percentage}%)
                  </Text>
                </View>
                
                <View style={styles.progressBarContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      { width: `${result.percentage}%` }
                    ]} 
                  />
                </View>
              </View>
            ))}

            {results.totalAnswers === 0 && (
              <Text style={styles.noAnswersText}>
                Noch keine Antworten erhalten
              </Text>
            )}
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Export', 'Export-Funktion wird implementiert')}
          >
            <Text style={styles.actionButtonText}>📊 Exportieren</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Teilen', 'Teilen-Funktion wird implementiert')}
          >
            <Text style={styles.actionButtonText}>📤 Teilen</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Footer />
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
  backButton: {
    padding: 10,
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
  content: {
    flex: 1,
    padding: 20,
  },
  surveyInfo: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  surveyTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  surveyQuestion: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 22,
  },
  surveyStats: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
  },
  resultsTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  resultItem: {
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultOption: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
    marginRight: 10,
  },
  resultStats: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  noAnswersText: {
    color: '#CCCCCC',
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 0.45,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#2f3a3b',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 50,
  },
});