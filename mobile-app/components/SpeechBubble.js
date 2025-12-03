import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * SpeechBubble Komponente - Sprechblase mit Titel, Text und Navigation-Buttons
 * 
 * @param {string} title - Titel der Sprechblase
 * @param {string} text - Text der Sprechblase
 * @param {string} position - Position relativ zum Element: 'top', 'bottom', 'left', 'right'
 * @param {string} arrowDirection - Richtung des Pfeils: 'up', 'down', 'left', 'right'
 * @param {function} onNext - Callback für "Weiter"-Button
 * @param {function} onBack - Callback für "Zurück"-Button
 * @param {function} onSkip - Callback für "Überspringen"-Button
 * @param {boolean} showBack - Ob "Zurück"-Button angezeigt werden soll
 * @param {boolean} showSkip - Ob "Überspringen"-Button angezeigt werden soll
 * @param {boolean} isLastStep - Ob dies der letzte Step ist
 * @param {number} x - X-Position der Sprechblase (optional, wird automatisch berechnet)
 * @param {number} y - Y-Position der Sprechblase (optional, wird automatisch berechnet)
 * @param {number} currentStep - Aktueller Step (0-basiert) für Fortschrittsanzeige
 * @param {number} totalSteps - Gesamtanzahl der Steps für Fortschrittsanzeige
 */
export default function SpeechBubble({
  title = '',
  text = '',
  position = 'bottom',
  arrowDirection = 'up',
  onNext = () => {},
  onBack = () => {},
  onSkip = () => {},
  showBack = false,
  showSkip = true,
  isLastStep = false,
  x = null,
  y = null,
  currentStep = 0,
  totalSteps = 0,
}) {
  // Berechne Position der Sprechblase
  const getBubbleStyle = () => {
    const bubbleWidth = Math.min(SCREEN_WIDTH - 40, 320);
    const defaultStyle = {
      width: bubbleWidth,
    };

    if (x !== null && y !== null) {
      // Benutzerdefinierte Position
      let left = x;
      let top = y;

      // Anpassung basierend auf Position
      switch (position) {
        case 'top':
          top = y - 150; // Über dem Element
          break;
        case 'bottom':
          top = y + 10; // Unter dem Element
          break;
        case 'left':
          left = x - bubbleWidth - 10;
          break;
        case 'right':
          left = x + 10;
          break;
      }

      // Stelle sicher, dass die Sprechblase nicht außerhalb des Bildschirms ist
      if (left < 20) left = 20;
      if (left + bubbleWidth > SCREEN_WIDTH - 20) {
        left = SCREEN_WIDTH - bubbleWidth - 20;
      }
      if (top < 20) top = 20;
      if (top > SCREEN_HEIGHT - 300) top = SCREEN_HEIGHT - 300;

      return {
        ...defaultStyle,
        position: 'absolute',
        left,
        top,
        zIndex: 99999,
        elevation: 99999,
      };
    }

    // Zentrierte Position (Fallback)
    return {
      ...defaultStyle,
      position: 'absolute',
      left: SCREEN_WIDTH / 2 - bubbleWidth / 2,
      top: SCREEN_HEIGHT / 2 - 150,
      zIndex: 99999,
      elevation: 99999,
    };
  };

  // Pfeil-Rendering basierend auf Richtung
  const renderArrow = () => {
    const arrowSize = 10;
    const arrowStyle = {
      width: 0,
      height: 0,
      position: 'absolute',
    };

    switch (arrowDirection) {
      case 'up':
        return (
          <View
            style={[
              arrowStyle,
              {
                bottom: -arrowSize,
                left: '50%',
                marginLeft: -arrowSize,
                borderLeftWidth: arrowSize,
                borderRightWidth: arrowSize,
                borderTopWidth: arrowSize,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderTopColor: '#FFFFFF',
              },
            ]}
          />
        );
      case 'down':
        return (
          <View
            style={[
              arrowStyle,
              {
                top: -arrowSize,
                left: '50%',
                marginLeft: -arrowSize,
                borderLeftWidth: arrowSize,
                borderRightWidth: arrowSize,
                borderBottomWidth: arrowSize,
                borderLeftColor: 'transparent',
                borderRightColor: 'transparent',
                borderBottomColor: '#FFFFFF',
              },
            ]}
          />
        );
      case 'left':
        return (
          <View
            style={[
              arrowStyle,
              {
                right: -arrowSize,
                top: '50%',
                marginTop: -arrowSize,
                borderTopWidth: arrowSize,
                borderBottomWidth: arrowSize,
                borderLeftWidth: arrowSize,
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
                borderLeftColor: '#FFFFFF',
              },
            ]}
          />
        );
      case 'right':
        return (
          <View
            style={[
              arrowStyle,
              {
                left: -arrowSize,
                top: '50%',
                marginTop: -arrowSize,
                borderTopWidth: arrowSize,
                borderBottomWidth: arrowSize,
                borderRightWidth: arrowSize,
                borderTopColor: 'transparent',
                borderBottomColor: 'transparent',
                borderRightColor: '#FFFFFF',
              },
            ]}
          />
        );
      default:
        return null;
    }
  };

  const bubbleStyle = getBubbleStyle();

  console.log('🎯 SpeechBubble: Rendere MIT Position', { 
    x, 
    y, 
    title, 
    text, 
    bubbleStyle,
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
  });

  // KEINE Animation - sofort sichtbar
  return (
    <View
      style={[
        styles.container,
        bubbleStyle,
      ]}
      pointerEvents="auto"
    >
      <View style={styles.bubble} pointerEvents="auto">
        {/* Header-Bereich: Fortschrittsanzeige links, Rundgang beenden rechts */}
        <View style={styles.headerContainer}>
          {/* Fortschrittsanzeige links */}
          {totalSteps > 0 && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Schritt {currentStep + 1} von {totalSteps}
              </Text>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${((currentStep + 1) / totalSteps) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          )}
          
          {/* Rundgang beenden-Button rechts */}
          {showSkip && (
            <TouchableOpacity
              style={styles.skipButton}
              onPress={onSkip}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Rundgang beenden</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Titel */}
        {title ? (
          <Text style={styles.title}>{title}</Text>
        ) : null}

        {/* Text */}
        {text ? <Text style={styles.text}>{text}</Text> : null}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          {/* Zurück-Button */}
          {showBack && (
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Text style={styles.buttonSecondaryText}>Zurück</Text>
            </TouchableOpacity>
          )}

          {/* Weiter/Abgeschlossen-Button */}
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary]}
            onPress={onNext}
            activeOpacity={0.7}
          >
            <Text style={styles.buttonPrimaryText}>
              {isLastStep ? 'Abgeschlossen' : 'Weiter'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 99999,
    maxWidth: 320,
    elevation: 99999, // Für Android
  },
  bubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    position: 'relative',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c2c2c',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    color: '#4a4a4a',
    lineHeight: 20,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#a9c7cd',
  },
  buttonPrimaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c2c2c',
  },
  buttonSecondary: {
    backgroundColor: '#666666',
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    minHeight: 40,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  skipButtonText: {
    fontSize: 12,
    color: '#999999',
    textDecorationLine: 'underline',
  },
  progressContainer: {
    flex: 1,
    marginRight: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 6,
    textAlign: 'left',
  },
  progressBarContainer: {
    width: '100%',
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#a9c7cd',
    borderRadius: 2,
  },
});
