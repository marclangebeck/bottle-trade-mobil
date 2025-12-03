import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import OptimizedImage from './components/OptimizedImage';

export default function InfoScreen({ onNavigate, onShowRegister }) {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const welcomeText = 'Du liebst Wein und hast mehr Flaschen, als du trinken kannst? Bei Bottle-Trade kannst du deine überzähligen Weine einfach tauschen – regional, nachhaltig und ganz ohne Zwischenhändler. Entdecke neue Sorten, teile deinen Geschmack und vernetze dich mit anderen Weinliebhabern in deiner Umgebung.';

  const sections = [
    {
      id: 'target',
      title: 'Für wen ist BOTTLE-TRADE gedacht?',
      content: [
        { icon: '🍷', title: 'Weinliebhaber mit vollem Keller', desc: 'Tausche deine überzähligen Weine gegen spannende Neuheiten.', color: '#CD5C5C' },
        { icon: '🔍', title: 'Genießer mit Entdeckergeist', desc: 'Probiere die neuesten Empfehlungen aus deiner Region.', color: '#a9c7cd' },
        { icon: '♻️', title: 'Nachhaltigkeits-Profis', desc: 'Gib ungenutzte Flaschen weiter, statt sie verstauben zu lassen.', color: '#90EE90' }
      ]
    },
    {
      id: 'benefits',
      title: 'Warum BOTTLE-TRADE?',
      content: [
        { icon: '🍷', title: 'Neue Weine entdecken – ohne zu kaufen', desc: 'Erlebe Vielfalt an Aromen und Regionen, ohne den Kaufzwang.', color: '#FF6B6B' },
        { icon: '👥', title: 'Community & Austausch', desc: 'Finde Gleichgesinnte in deiner Nähe, die dein Weininteresse teilen.', color: '#4ECDC4' },
        { icon: '🌍', title: 'Regional vernetzt', desc: 'Tausche unkompliziert mit Weinfreunden aus der Nachbarschaft.', color: '#45B7D1' },
        { icon: '🌱', title: 'Nachhaltiger Genuss', desc: 'Reduziere Verschwendung und genieße nachhaltig.', color: '#96CEB4' }
      ]
    },
    {
      id: 'how-it-works',
      title: 'Wie funktioniert BOTTLE-TRADE?',
      content: [
        { icon: '📱', title: '1. App herunterladen & registrieren', desc: 'Lade die Bottle-Trade App herunter und erstelle dein kostenloses Profil.', color: '#FF9F43' },
        { icon: '🍷', title: '2. Weinregal befüllen', desc: 'Fotografiere deine Weine und lade sie in dein digitales Weinregal hoch.', color: '#A55EEA' },
        { icon: '🔍', title: '3. Weine durchstöbern', desc: 'Entdecke spannende Weine von anderen Nutzern in deiner Umgebung.', color: '#26DE81' },
        { icon: '🤝', title: '4. Tausch anfragen', desc: 'Sende eine Tauschanfrage an den Besitzer des gewünschten Weins.', color: '#FC5C65' },
        { icon: '📦', title: '5. Treffen & tauschen', desc: 'Verabrede dich zum persönlichen Treffen und tausche eure Weine.', color: '#45AAF2' }
      ]
    },
    {
      id: 'start',
      title: 'Registriere dich jetzt!',
      content: 'Erstelle dein kostenloses Nutzerkonto und leg gleich los:',
      hasButton: true
    }
  ];

  const renderContent = (section) => {
    if (Array.isArray(section.content)) {
      return section.content.map((item, index) => (
        <View key={index} style={styles.contentCard}>
          {item.icon && <Text style={styles.contentIcon}>{item.icon}</Text>}
          <View style={styles.contentTextContainer}>
            <Text style={[styles.contentTitle, { color: item.color || '#FFFFFF' }]}>{item.title}</Text>
            <Text style={styles.contentDescription}>{item.desc}</Text>
          </View>
        </View>
      ));
    }
    return <Text style={styles.contentText}>{section.content}</Text>;
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Subtiler Hintergrund-Gradient für Glassmorphismus-Effekt */}
      <LinearGradient
        colors={[
          '#2c2c2c',
          '#1a1a1a',
          '#2c2c2c',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backgroundGradient}
      />
      
      {/* Zurück-Button */}
      {onNavigate && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => onNavigate('welcome')}
          activeOpacity={0.7}
        >
          <Text style={styles.backButtonText}>← Zurück</Text>
        </TouchableOpacity>
      )}
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo - größer und mittig am oberen Rand */}
        <View style={styles.logoContainer}>
          <OptimizedImage 
            source={require('./assets/images/Logo_white.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Bottle Trade</Text>
        </View>
        
        {/* Content Container */}
        <View style={styles.contentContainer}>
          <Text style={styles.mainTitle}>Bottle-Trade leicht erklärt</Text>
          <Text style={styles.welcomeText}>{welcomeText}</Text>
          
          {sections.map((section) => (
            <View key={section.id} style={styles.accordionSection}>
              <TouchableOpacity 
                style={styles.accordionHeader}
                onPress={() => toggleSection(section.id)}
                activeOpacity={0.8}
              >
                <View style={styles.headerContent}>
                  <Text style={styles.headerTitle}>{section.title}</Text>
                </View>
                <Text style={styles.arrowIcon}>
                  {expandedSections[section.id] ? '▼' : '▶'}
                </Text>
              </TouchableOpacity>
              
              {expandedSections[section.id] && (
                <View style={styles.accordionContent}>
                  {renderContent(section)}
                  {section.hasButton && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={onShowRegister}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.buttonGradient}
                      />
                      <Text style={styles.actionButtonText}>Jetzt registrieren</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#2c2c2c',
    paddingHorizontal: 0,
    marginHorizontal: 0,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 70 : 50,
    left: 20,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  logoContainer: {
    width: '100%',
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 300,
    height: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 38.4,
    fontWeight: '700',
    marginTop: 20,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  contentContainer: {
    width: '100%',
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  welcomeText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    textAlign: 'justify',
    marginBottom: 30,
  },
  accordionSection: {
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  arrowIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  accordionContent: {
    padding: 18,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  contentCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  contentIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  contentTextContainer: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  contentDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  contentText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    marginBottom: 15,
  },
  actionButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.25)',
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(76, 175, 80, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  buttonGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 20,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 1,
  },
});
