import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, Image, ScrollView, Platform } from 'react-native';
import OptimizedImage from './components/OptimizedImage';
import { LinearGradient } from 'expo-linear-gradient';
import Footer from './Footer';
import { loginUser } from './services/testAuth';
import DynamicHamburgerMenu from './DynamicHamburgerMenu';
import BottomNavigation from './components/BottomNavigation';

export default function LoginScreen({ onLogin, onShowRegister, onNavigate, isLoggedIn }) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const handleLogin = async () => {
    if (!emailOrUsername || !password) {
      Alert.alert('Fehler', 'Bitte füllen Sie alle Felder aus');
      return;
    }
    
    try {
      // Echte Firebase Authentication
      const user = await loginUser(emailOrUsername, password);
      console.log('✅ Login successful:', user.email);
      // Direkt zum Dashboard navigieren ohne Alert
      onLogin();
    } catch (error) {
      console.error('❌ Login failed:', error);
      Alert.alert('Fehler', 'Login fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.');
    }
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
               onNavigate={onNavigate || (() => {})} 
               isLoggedIn={isLoggedIn || false} 
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
                 <Text style={styles.greeting}>Anmeldung</Text>
               </View>
               <View style={styles.headerRight} />
             </View>
      
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-start', alignItems: 'center', padding: 5, paddingTop: 20 }}>
        <View style={styles.glassContainer}>
        <Text style={styles.title}>Anmeldung</Text>
      
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="E-Mail oder Benutzername"
            placeholderTextColor="rgba(0, 0, 0, 0.6)"
            value={emailOrUsername}
            onChangeText={setEmailOrUsername}
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Passwort"
            placeholderTextColor="rgba(0, 0, 0, 0.6)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <LinearGradient
            colors={['#6B8E23', '#556B2F']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientBorder}
          >
            <TouchableOpacity style={styles.glassButton} onPress={handleLogin}>
              <Text style={styles.glassButtonText}>Anmelden</Text>
            </TouchableOpacity>
          </LinearGradient>
          
          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={onShowRegister}
          >
            <Text style={styles.linkText}>Noch kein Konto? Jetzt registrieren</Text>
          </TouchableOpacity>
        </View>
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  glassContainer: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)', // Dunkelgrau mit Transparenz
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Subtiler weißer Border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 160,
    height: 160,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 30,
    textAlign: 'center',
  },
  form: {
    width: '100%',
    maxWidth: 450,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    color: '#000000',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  gradientBorder: {
    borderRadius: 20,
    marginTop: 10,
    padding: 1,
  },
  glassButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 18,
    borderRadius: 19,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  glassButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  linkButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#FFFFFF',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
