import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { checkPublishedWinesLimit, checkMonthlyTradesLimit, checkWineRegalLimit, checkWishlistLimit } from '../services/subscriptionLimits';

/**
 * LimitInfoBanner - Zeigt dezent Limits für Basic-User an
 * 
 * @param {string} type - Typ des Limits: 'weinboerse', 'weinregal', 'wunschliste'
 * @param {string} userId - User-ID
 * @param {boolean} isPro - Ob User Pro-Version hat
 * @param {boolean} isLoggedIn - Ob User eingeloggt ist
 */
export default function LimitInfoBanner({ type, userId, isPro = false, isLoggedIn = false }) {
  const [limitInfo, setLimitInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Nur laden wenn User eingeloggt und Basic-Version
    if (!isLoggedIn || isPro || !userId) {
      setIsLoading(false);
      return;
    }

    const loadLimitInfo = async () => {
      try {
        setIsLoading(true);
        let result = null;

        switch (type) {
          case 'weinboerse':
            // Für Weinbörse: Zeige beide Limits (veröffentlichte Weine + Trades)
            const [winesResult, tradesResult] = await Promise.all([
              checkPublishedWinesLimit(userId),
              checkMonthlyTradesLimit(userId)
            ]);
            result = {
              wines: winesResult,
              trades: tradesResult
            };
            break;
          case 'weinregal':
            result = await checkWineRegalLimit(userId);
            break;
          case 'wunschliste':
            result = await checkWishlistLimit(userId);
            break;
          default:
            result = null;
        }

        setLimitInfo(result);
      } catch (error) {
        console.error('❌ Fehler beim Laden der Limit-Info:', error);
        setLimitInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadLimitInfo();
  }, [type, userId, isPro, isLoggedIn]);

  // Nicht anzeigen wenn:
  // - User nicht eingeloggt
  // - User Pro-Version hat
  // - Keine Limit-Info verfügbar
  if (!isLoggedIn || isPro || isLoading || !limitInfo) {
    return null;
  }

  // Render-Funktion für Weinbörse (zwei Limits)
  if (type === 'weinboerse' && limitInfo.wines && limitInfo.trades) {
    const winesUsed = limitInfo.wines.current;
    const winesLimit = limitInfo.wines.limit;
    const tradesUsed = limitInfo.trades.current;
    const tradesLimit = limitInfo.trades.limit;

    return (
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          <Text style={styles.bannerIcon}>ℹ️</Text>
          {' '}
          <Text style={styles.bannerTextContent}>
            Basic-Version: {winesUsed}/{winesLimit} Weine in der Weinbörse, {tradesUsed}/{tradesLimit} Trades diesen Monat
          </Text>
        </Text>
      </View>
    );
  }

  // Render-Funktion für Weinregal
  if (type === 'weinregal' && limitInfo.current !== undefined) {
    const used = limitInfo.current;
    const limit = limitInfo.limit;

    return (
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          <Text style={styles.bannerIcon}>ℹ️</Text>
          {' '}
          <Text style={styles.bannerTextContent}>
            Basic-Version: {used}/{limit} Weine im Weinregal
          </Text>
        </Text>
      </View>
    );
  }

  // Render-Funktion für Wunschliste
  if (type === 'wunschliste' && limitInfo.current !== undefined) {
    const used = limitInfo.current;
    const limit = limitInfo.limit;

    return (
      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          <Text style={styles.bannerIcon}>ℹ️</Text>
          {' '}
          <Text style={styles.bannerTextContent}>
            Basic-Version: {used}/{limit} Wünsche in der Wunschliste
          </Text>
        </Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: 'rgba(218, 165, 32, 0.15)', // Dezent goldener Hintergrund
    borderLeftWidth: 3,
    borderLeftColor: '#DAA520', // Gold-Akzent
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 6,
  },
  bannerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  bannerIcon: {
    fontSize: 14,
  },
  bannerTextContent: {
    fontSize: 12,
  },
});












