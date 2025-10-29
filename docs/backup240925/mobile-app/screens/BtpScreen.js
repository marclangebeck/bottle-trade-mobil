import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ImageBackground, Platform, Image, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import DynamicHamburgerMenu from '../DynamicHamburgerMenu';
import Footer from '../Footer';
import OptimizedImage from '../components/OptimizedImage';

export default function BtpScreen({ onNavigate, onLogout }) {
  // State für aktiven Tab
  const [activeTab, setActiveTab] = useState('kaufen');
  
  // Mock-Daten für BTP
  const userBtp = 1250;
  
  const transactions = [
    {
      id: 1,
      amount: 100,
      reason: 'Wein verkauft - Chardonnay 2020',
      timestamp: '2024-01-15 14:30',
      type: 'earned'
    },
    {
      id: 2,
      amount: -50,
      reason: 'Wein gekauft - Pinot Noir 2019',
      timestamp: '2024-01-14 10:15',
      type: 'spent'
    },
    {
      id: 3,
      amount: 25,
      reason: 'Newsletter-Anmeldung',
      timestamp: '2024-01-13 09:00',
      type: 'bonus'
    },
    {
      id: 4,
      amount: -200,
      reason: 'Wein gekauft - Cabernet Sauvignon 2018',
      timestamp: '2024-01-12 16:45',
      type: 'spent'
    },
  ];

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
      
      <DynamicHamburgerMenu onNavigate={onNavigate} isLoggedIn={true} onLogout={onLogout} />
      
      <View style={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>💰 Bottle-Trade-Points</Text>
        </View>
        
        {/* BTP Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceContainer}>
            <Text style={styles.balanceAmount}>{userBtp}</Text>
            <Image 
              source={require('../assets/images/btp.png')}
              style={styles.btpImage}
              resizeMode="contain"
              fadeDuration={0}
              cache="force-cache"
            />
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'kaufen' && styles.activeTab]}
            onPress={() => setActiveTab('kaufen')}
          >
            <Text style={[styles.tabText, activeTab === 'kaufen' && styles.activeTabText]}>
              BTP kaufen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'free' && styles.activeTab]}
            onPress={() => setActiveTab('free')}
          >
            <Text style={[styles.tabText, activeTab === 'free' && styles.activeTabText]}>
              BTP for free
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'nutzen' && styles.activeTab]}
            onPress={() => setActiveTab('nutzen')}
          >
            <Text style={[styles.tabText, activeTab === 'nutzen' && styles.activeTabText]}>
              BTP nutzen
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollContainer}>
          {/* Tab Content */}
          {activeTab === 'kaufen' && (
            <View style={styles.tabContent}>
              <Text style={styles.tabTitle}>BTP kaufen</Text>
              <Text style={styles.tabSubtitle}>Inhalt kommt hier hin</Text>
            </View>
          )}

          {activeTab === 'free' && (
            <View style={styles.tabContent}>
              <Text style={styles.tabTitle}>BTP for free</Text>
              <Text style={styles.tabSubtitle}>Inhalt kommt hier hin</Text>
            </View>
          )}

          {activeTab === 'nutzen' && (
            <View style={styles.tabContent}>
              <Text style={styles.tabTitle}>BTP nutzen</Text>
              <Text style={styles.tabSubtitle}>Inhalt kommt hier hin</Text>
            </View>
          )}
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
  scrollContainer: {
    flex: 1,
    padding: 20,
  },
  // Tab Navigation Styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    margin: 20,
    marginTop: 0,
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#2c2c2c',
  },
  tabText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  activeTabText: {
    fontWeight: 'bold',
  },
  // Tab Content Styles
  tabContent: {
    padding: 20,
  },
  tabTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
    textAlign: 'center',
  },
  tabSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  header: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    marginTop: Platform.OS === 'ios' ? 60 : 50,
  },
  title: {
    fontSize: 20,
    fontWeight: 'normal',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    margin: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceLabel: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  balanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceAmount: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 15,
  },
  btpImage: {
    width: 60,
    height: 60,
  },
  actionsSection: {
    margin: 20,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    padding: 20,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  infoSection: {
    margin: 20,
    marginTop: 0,
  },
  infoText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  transactionsSection: {
    margin: 20,
    marginTop: 0,
  },
  transactionCard: {
    backgroundColor: 'rgba(60, 60, 60, 0.8)',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 1,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionReason: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  transactionTime: {
    fontSize: 12,
    color: '#FFFFFF',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
