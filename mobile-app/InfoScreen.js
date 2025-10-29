import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet,
  Image,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import Footer from './Footer';
import BottomNavigation from './components/BottomNavigation';

export default function InfoScreen({ onNavigate, onShowRegister, isLoggedIn }) {
  const [expandedSections, setExpandedSections] = useState({});
  const [isMenuVisible, setIsMenuVisible] = useState(false);

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
        { icon: '🔍', title: 'Genießer mit Entdeckergeist', desc: 'Probiere die neuesten Empfehlungen aus deiner Region.', color: '#DAA520' },
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
          <View style={styles.contentText}>
            <Text style={[styles.contentTitle, { color: item.color || '#FFFFFF' }]}>{item.title}</Text>
            <Text style={styles.contentDescription}>{item.desc}</Text>
          </View>
        </View>
      ));
    }
    return <Text style={styles.contentText}>{section.content}</Text>;
  };

   return (
     <View style={{
       flex: 1,
       backgroundColor: '#d5dfe0', // Neue Primärfarbe
     }}>
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
       <DynamicHamburgerMenu 
         onNavigate={onNavigate} 
         isLoggedIn={false} 
         onLogout={() => {}} 
         isAdmin={false} 
         unreadNotifications={0}
         renderButton={false}
         externalMenuVisible={isMenuVisible}
         onMenuToggle={setIsMenuVisible}
       />
       
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
           <Text style={styles.greeting}>Info</Text>
         </View>
         <View style={styles.headerRight} />
       </View>
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingTop: 20 }}>
        <View style={styles.container}>
          <Text style={styles.mainTitle}>Bottle-Trade leicht erklärt</Text>
          <Text style={[styles.welcomeText, { color: '#FFFFFF' }]}>{welcomeText}</Text>
          
          {sections.map((section) => (
            <View key={section.id} style={styles.accordionSection}>
              <TouchableOpacity 
                style={styles.accordionHeader}
                onPress={() => toggleSection(section.id)}
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
                    >
                      <Text style={styles.actionButtonText}>Jetzt registrieren</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          ))}
         </View>
       </ScrollView>
       <Footer />
       <BottomNavigation onNavigate={onNavigate || (() => {})} isLoggedIn={isLoggedIn || false} />
     </View>
   );
 }

const styles = StyleSheet.create({
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
  container: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)', // Dunkelgrau mit Transparenz
    padding: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Subtiler weißer Border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 20,
    width: '100%',
    maxWidth: 350,
    alignSelf: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
    fontWeight: 'bold',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 15,
    marginTop: 20,
  },
  welcomeText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
    textAlign: 'justify',
    fontWeight: 'normal',
    marginBottom: 20,
    marginTop: 5,
  },
      accordionSection: {
        marginBottom: 15,
        backgroundColor: '#2c2c2c', // Gleiche Farbe wie Hinweiscontainer
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
        overflow: 'hidden',
      },
      accordionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        backgroundColor: 'transparent', // 100% transparent
        borderWidth: 0, // Kein Rahmen
        borderRadius: 12,
      },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  arrowIcon: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
      accordionContent: {
        padding: 15,
        backgroundColor: 'transparent', // 100% transparent
        borderWidth: 0, // Kein Rahmen beim Aufklappen
      },
      contentCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
      },
  contentIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  contentText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    fontWeight: 'bold',
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  contentDescription: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    fontWeight: 'bold',
  },
  actionButton: {
    backgroundColor: '#6B8E23',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#556B2F',
    alignItems: 'center',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
