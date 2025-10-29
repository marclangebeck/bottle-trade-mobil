import React from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity,
  Image,
  Platform
} from 'react-native';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import Footer from './Footer';

export default function ShopScreen({ onNavigate, isLoggedIn = false }) {
  return (
    <View style={styles.container}>
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
      
      <DynamicHamburgerMenu onNavigate={onNavigate} isLoggedIn={isLoggedIn} onLogout={() => {}} />
      
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.hamburgerContainer}>
            {/* Hamburger-Button entfernt - wird durch DynamicHamburgerMenu ersetzt */}
          </View>
          <View style={styles.headerCenter}>
            <Text style={styles.greeting}>🛒 Shop</Text>
          </View>
          <View style={styles.headerRight}>
            {/* Platz für zukünftige Elemente */}
          </View>
        </View>
        
        {/* Subtitle unter dem Header */}
        <View style={styles.subtitleContainer}>
          <Text style={styles.headerSubtitle}>Exklusives Zubehör für deinen gelungenen Weinabend</Text>
        </View>
        
        <ScrollView style={styles.content} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', padding: 20, paddingTop: 10 }}>
          <View style={styles.shopContainer}>
            
            <View style={styles.comingSoonContainer}>
              <Text style={styles.comingSoonText}>
                Der Shop ist in Entwicklung und wird bald verfügbar sein!
              </Text>
              <Text style={styles.descriptionText}>
                Hier wirst du bald Weine, Zubehör und exklusive Bottle-Trade Produkte kaufen können.
              </Text>
            </View>

            <View style={styles.featuresContainer}>
              <Text style={styles.featuresTitle}>Geplante Features:</Text>
              <Text style={styles.featureItem}>🎁 Geschenkboxen</Text>
              <Text style={styles.featureItem}>📚 Wein-Bücher</Text>
              <Text style={styles.featureItem}>🍾 Zubehör & Gläser</Text>
              <Text style={styles.featureItem}>... und vieles mehr</Text>
            </View>
          </View>
        </ScrollView>
      </View>
      <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4B0000',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#4B0000',
  },
  // Header Styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    position: 'relative',
    marginTop: Platform.OS === 'ios' ? 60 : 50,
  },
  hamburgerContainer: {
    flex: 0,
    position: 'relative',
    zIndex: 1000,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flex: 0,
    width: 40, // Gleiche Breite wie hamburgerContainer für Zentrierung
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'normal',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitleContainer: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  shopContainer: {
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
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  comingSoonContainer: {
    backgroundColor: '#2c2c2c',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: '#F5DEB3',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresContainer: {
    width: '100%',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  featureItem: {
    fontSize: 14,
    color: '#F5DEB3',
    marginBottom: 5,
    textAlign: 'center',
  },
});