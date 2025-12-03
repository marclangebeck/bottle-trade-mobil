import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

/**
 * TourProgress Komponente - Zeigt den Fortschritt des Rundgangs
 * 
 * @param {number} currentStep - Aktueller Step (0-basiert)
 * @param {number} totalSteps - Gesamtanzahl der Steps
 * @param {boolean} showProgressBar - Ob Fortschrittsbalken angezeigt werden soll
 */
export default function TourProgress({
  currentStep = 0,
  totalSteps = 0,
  showProgressBar = true,
}) {
  const stepNumber = currentStep + 1; // 1-basiert für Anzeige
  const progress = totalSteps > 0 ? (stepNumber / totalSteps) * 100 : 0;

  return (
    <View style={styles.container} pointerEvents="none">
      {/* Schritt-Anzeige */}
      <Text style={styles.stepText}>
        Schritt {stepNumber} von {totalSteps}
      </Text>

      {/* Fortschrittsbalken */}
      {showProgressBar && totalSteps > 0 && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${progress}%`,
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10000,
    paddingHorizontal: 20,
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  progressBarContainer: {
    width: '100%',
    maxWidth: 300,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#a9c7cd',
    borderRadius: 2,
  },
});

