import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ImageBackground, Image, ScrollView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import OptimizedImage from './components/OptimizedImage';
// Asset import entfernt - nicht mehr benötigt

// Firebase-Konfiguration
import './config/firebase-web';

import LoginScreen from './LoginScreen';
import RegisterScreen from './RegisterScreen';
import StartScreen from './screens/StartScreen';
import TestApp from './TestApp';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import InfoScreen from './InfoScreen';
import ShopScreen from './ShopScreen';
import WeinregalBefuellenScreen from './WeinregalBefuellenScreen';
import MeinWeinregalScreen from './MeinWeinregalScreen';
import DashboardScreen from './DashboardScreen';
import WeinboerseScreen from './WeinboerseScreen';
import CommunityScreen from './CommunityScreen';
import WeineScreen from './screens/WeineScreen';
import BtpScreen from './screens/BtpScreen';
import ProfilScreen from './screens/ProfilScreen';
import WeinregalEditScreen from './WeinregalEditScreen';
import WeinDetailScreen from './WeinDetailScreen';
import Footer from './Footer';

const Tab = createBottomTabNavigator();

function MainTabs({ onLogout }) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#8B4513',
          borderTopColor: '#D2691E',
          height: 60,
          paddingBottom: 5,
          paddingTop: 5,
        },
        tabBarActiveTintColor: '#F5DEB3',
        tabBarInactiveTintColor: '#CD853F',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Start" 
        component={StartScreen}
        options={{
          tabBarIcon: () => <Text style={styles.tabIcon}>🏠</Text>,
        }}
      />
      <Tab.Screen 
        name="Weine" 
        component={WeineScreen}
        options={{
          tabBarIcon: () => <Text style={styles.tabIcon}>🍷</Text>,
        }}
      />
      <Tab.Screen 
        name="BTP" 
        component={BtpScreen}
        options={{
          tabBarIcon: () => <Text style={styles.tabIcon}>💰</Text>,
        }}
      />
      <Tab.Screen 
        name="Profil" 
        options={{
          tabBarIcon: () => <Text style={styles.tabIcon}>👤</Text>,
        }}
      >
        {() => <ProfilScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('welcome');
  const [imagesLoaded, setImagesLoaded] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState(null); // route state for passing data

  // Bilder werden lazy geladen - keine Preload-Verzögerung
  useEffect(() => {
    // Sofort als geladen markieren für bessere Performance
    setImagesLoaded(true);
  }, []);

  // Firebase Auth State Listener - temporär deaktiviert
  // useEffect(() => {
  //   const unsubscribe = onAuthStateChange((user) => {
  //     console.log('🔄 Auth state changed:', user ? 'User logged in' : 'User logged out');
  //     if (user) {
  //       setUser(user);
  //       setIsLoggedIn(true);
  //       setCurrentScreen('home');
  //       console.log('✅ User logged in:', user.email);
  //     } else {
  //       setUser(null);
  //       setIsLoggedIn(false);
  //       setCurrentScreen('welcome');
  //       console.log('✅ User logged out');
  //     }
  //   });

  //   return () => unsubscribe();
  // }, []);

  const handleLogin = async () => {
    // Temporärer Login für Test
    setIsLoggedIn(true);
    setCurrentScreen('home');
    
    console.log('✅ Test login successful - using existing test user');
  };

  const handleLogout = () => {
    // Temporärer Logout für Test
    setIsLoggedIn(false);
    setCurrentScreen('welcome');
  };

  const handleShowLogin = () => {
    setCurrentScreen('login');
  };

  const handleShowRegister = () => {
    setCurrentScreen('register');
  };

  const handleNavigate = (screen, params = null) => {
    setCurrentScreen(screen);
    setRoute({ params });
  };

         // Loading Screen entfernt für bessere Performance

         if (currentScreen === 'login') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <LoginScreen onLogin={handleLogin} onShowRegister={handleShowRegister} />
               <DynamicHamburgerMenu onNavigate={handleNavigate} isLoggedIn={isLoggedIn} onLogout={handleLogout} />
             </>
           );
         }

         if (currentScreen === 'register') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <RegisterScreen onRegister={handleLogin} onShowLogin={handleShowLogin} />
               <DynamicHamburgerMenu onNavigate={handleNavigate} isLoggedIn={isLoggedIn} onLogout={handleLogout} />
             </>
           );
         }

         if (currentScreen === 'info') {
           return (
             <>
               <StatusBar style="light" />
               <InfoScreen onNavigate={handleNavigate} onShowRegister={handleShowRegister} />
             </>
           );
         }

         if (currentScreen === 'shop') {
           return (
             <>
               <StatusBar style="light" />
               <ShopScreen onNavigate={handleNavigate} isLoggedIn={isLoggedIn} />
             </>
           );
         }

         if (currentScreen === 'weinregal') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <WeinregalBefuellenScreen onNavigate={handleNavigate} onLogout={handleLogout} />
             </>
           );
         }

         if (currentScreen === 'mein-weinregal') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <MeinWeinregalScreen onNavigate={handleNavigate} onLogout={handleLogout} />
             </>
           );
         }

         if (currentScreen === 'weinboerse') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <WeinboerseScreen onNavigate={handleNavigate} onLogout={handleLogout} />
             </>
           );
         }

         if (currentScreen === 'community') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <CommunityScreen onNavigate={handleNavigate} />
               <DynamicHamburgerMenu onNavigate={handleNavigate} isLoggedIn={isLoggedIn} onLogout={handleLogout} />
             </>
           );
         }

         if (currentScreen === 'btp') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <BtpScreen onNavigate={handleNavigate} onLogout={handleLogout} />
             </>
           );
         }

         if (currentScreen === 'profil') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <ProfilScreen onNavigate={handleNavigate} onLogout={handleLogout} />
             </>
           );
         }

         if (currentScreen === 'weinregalEdit') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <WeinregalEditScreen 
                 onNavigate={handleNavigate} 
                 onLogout={handleLogout} 
                 wineData={route?.params?.wineData} 
               />
             </>
           );
         }

         if (currentScreen === 'weinDetail') {
           return (
             <>
               <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
               <StatusBar style="light" />
               <WeinDetailScreen 
                 onNavigate={handleNavigate} 
                 onLogout={handleLogout} 
                 wineData={route?.params?.wineData} 
               />
             </>
           );
         }

         if (currentScreen === 'home') {
           return (
             <>
               <StatusBar style="light" />
               <DashboardScreen 
                 onNavigate={handleNavigate} 
                 onLogout={handleLogout}
                 userName="Max" // Später aus Login-Daten laden
               />
             </>
           );
         }

         return (
           <View style={{
             flex: 1,
             backgroundColor: '#4B0000', // Bordeaux-rot als Vollbild
           }}>
             <RNStatusBar barStyle="light-content" backgroundColor="#2c2c2c" />
             <StatusBar style="light" />
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
             <DynamicHamburgerMenu onNavigate={handleNavigate} isLoggedIn={isLoggedIn} onLogout={handleLogout} />
      
             {/* Header-Bild */}
               <Image 
                 source={require('./assets/images/willkommen.png')}
                 style={{
                   width: '100%',
                   height: 200,
                   marginTop: Platform.OS === 'ios' ? 60 : 50,
                 }}
                 resizeMode="cover"
                 fadeDuration={0}
                 cache="force-cache"
               />
      
             {/* Content Container */}
             <View style={{
               flex: 1,
               padding: 20,
               alignItems: 'center',
               marginTop: Platform.OS === 'ios' ? 0 : 0,
             }}>
        <Text style={{
          fontSize: 32,
          fontWeight: 'bold',
          color: '#FFFFFF',
          marginBottom: 10,
          textAlign: 'center'
        }}>Willkommen</Text>
        <Text style={{
          fontSize: 18,
          color: '#FFFFFF',
          textAlign: 'center',
          marginBottom: 30
        }}>in der Bottle-Trade-App!</Text>

      <View style={styles.buttonGrid}>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={handleShowLogin}
          activeOpacity={0.8}
        >
          <OptimizedImage 
            source={require('./assets/images-optimized/login-bg.jpg')}
            style={styles.buttonImage}
            resizeMode="cover"
          />
          <View style={styles.buttonOverlay}>
            <Text style={styles.buttonText}>Login</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.imageButton}
          onPress={handleShowRegister}
          activeOpacity={0.8}
        >
          <OptimizedImage 
            source={require('./assets/images-optimized/register-bg.jpg')}
            style={styles.buttonImage}
            resizeMode="cover"
          />
          <View style={styles.buttonOverlay}>
            <Text style={styles.buttonText}>Registrieren</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.imageButton} 
          onPress={() => setCurrentScreen('info')}
          activeOpacity={0.8}
        >
          <OptimizedImage 
            source={require('./assets/images-optimized/info-bg.jpg')}
            style={styles.buttonImage}
            resizeMode="cover"
          />
          <View style={styles.buttonOverlay}>
            <Text style={styles.buttonTextMultiLine}>Was ist{'\n'}Bottle-Trade?</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.imageButton} 
          onPress={() => setCurrentScreen('shop')}
          activeOpacity={0.8}
        >
          <OptimizedImage 
            source={require('./assets/images-optimized/shop-bg.jpg')}
            style={styles.buttonImage}
            resizeMode="cover"
          />
          <View style={styles.buttonOverlay}>
            <Text style={styles.buttonText}>Bottle-Trade-Shop</Text>
          </View>
        </TouchableOpacity>

             </View>
             </View>
             <Footer />
           </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#8B4513',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  testContainer: {
    flex: 1,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testText: {
    fontSize: 32,
    color: 'white',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#F5DEB3',
    marginBottom: 40,
    textAlign: 'center',
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    marginTop: 20,
    justifyContent: 'space-between', // Gleichmäßige Verteilung
  },
  imageButton: {
    width: '50%', // Zurück zu 50% für 2x2 Layout
    aspectRatio: 1,
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16, // Moderne abgerundete Ecken
    // Glassmorphism Schatten
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    // Subtiler Border für Glaseffekt
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    // Subtiler Glow-Effekt
    shadowColor: '#FFFFFF',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonImage: {
    width: '100%',
    height: '100%',
  },
  buttonOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 15,
    // Glassmorphism Gradient Overlay
    background: 'linear-gradient(135deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 40,
  },
  button: {
    padding: 18,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientBorder: {
    borderRadius: 20,
    marginBottom: 15,
    padding: 1,
  },
  glassButton: {
    width: '50%',
    aspectRatio: 1,
    padding: 18,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButton: {
    backgroundColor: 'rgba(100, 100, 100, 0.3)',
  },
  registerButton: {
    backgroundColor: 'rgba(120, 120, 120, 0.3)',
  },
  infoButton: {
    backgroundColor: 'rgba(80, 80, 80, 0.3)',
  },
  shopButton: {
    backgroundColor: 'rgba(140, 140, 140, 0.3)',
  },
    buttonText: {
      color: 'rgba(255, 255, 255, 0.85)', // Transparenter Text
      fontSize: 14, // Kleinere Schrift
      fontWeight: '300', // Dünnere Schrift
      // Subtiler Text-Schatten
      textShadowColor: 'rgba(0, 0, 0, 0.6)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    buttonTextMultiLine: {
      color: 'rgba(255, 255, 255, 0.85)', // Transparenter Text
      fontSize: 14, // Kleinere Schrift
      fontWeight: '300', // Dünnere Schrift
      textAlign: 'center',
      lineHeight: 18, // Angepasste Zeilenhöhe
      // Subtiler Text-Schatten
      textShadowColor: 'rgba(0, 0, 0, 0.6)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  glassButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  footer: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tabIcon: {
    fontSize: 20,
  },
  // Info Screen Styles
  infoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginBottom: 10,
  },
  infoSubtitle: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  infoSection: {
    marginBottom: 25,
  },
  infoHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 15,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 16,
    color: 'black',
    lineHeight: 24,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 5,
  },
  infoCardText: {
    fontSize: 14,
    color: 'black',
    lineHeight: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  benefitIcon: {
    fontSize: 24,
    marginRight: 12,
    marginTop: 2,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'black',
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: 'black',
    lineHeight: 20,
  },
  // Loading Screen Styles entfernt
});