import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import OptimizedImage from './OptimizedImage';
import { getCurrentUser } from '../services/testAuth';
import { getUser } from '../services/database-web';

export default function ProfileIcon({ onPress, size = 32 }) {
  const [profileImage, setProfileImage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.uid) {
        const userData = await getUser(currentUser.uid);
        if (userData && userData.profilbild) {
          setProfileImage(userData.profilbild);
        }
      }
    } catch (error) {
      console.error('❌ Fehler beim Laden des Profilbildes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      if (currentUser.firstName && currentUser.lastName) {
        return `${currentUser.firstName.charAt(0)}${currentUser.lastName.charAt(0)}`.toUpperCase();
      } else if (currentUser.username) {
        return currentUser.username.substring(0, 2).toUpperCase();
      } else if (currentUser.email) {
        return currentUser.email.substring(0, 2).toUpperCase();
      }
    }
    return 'P';
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.profileIconContainer}
        onPress={onPress}
        disabled={!onPress}
      >
        {profileImage ? (
          <OptimizedImage
            source={{ uri: profileImage }}
            style={[styles.profileIconImage, { width: size, height: size, borderRadius: size / 2 }]}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.profileIconCircle, { width: size, height: size, borderRadius: size / 2 }]}>
            <Text style={[styles.profileIconText, { fontSize: size * 0.56 }]}>{getInitials()}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  profileIconCircle: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  profileIconText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  profileIconImage: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});









