import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

export default function Footer() {
  const handlePress = (url) => {
    Linking.openURL(url);
  };

  return (
    <View style={styles.footer}>
      <View style={styles.footerContent}>
        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => handlePress('mailto:kontakt@bottle-trade.de')}
        >
          <Text style={styles.footerText}>📧 Kontakt</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => handlePress('https://instagram.com/bottle_trade')}
        >
          <Text style={styles.footerText}>📷 Instagram</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => {/* Impressum Screen öffnen */}}
        >
          <Text style={styles.footerText}>📄 Impressum</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.footerItem}
          onPress={() => {/* Datenschutz Screen öffnen */}}
        >
          <Text style={styles.footerText}>🔒 Datenschutz</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.copyright}>
        © 2024 Bottle-Trade Mobile
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    backgroundColor: '#2c2c2c', // Dunkleres Grau wie Akkordeon-Container
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    marginTop: 'auto', // Footer nach unten schieben
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  footerItem: {
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  footerText: {
    color: '#F5DEB3', // Helles Gold
    fontSize: 12,
    textAlign: 'center',
  },
  copyright: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 10,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});



