import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Modal, Dimensions, Animated } from 'react-native';
import Spotlight from './Spotlight';
import SpeechBubble from './SpeechBubble';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * TourOverlay Komponente - Haupt-Overlay für den digitalen Rundgang
 * 
 * Diese Komponente zeigt den Rundgang über dem aktuellen Screen an.
 * Sie ist vollständig isoliert und beeinflusst die bestehende App-Funktionalität nicht.
 * 
 * @param {boolean} visible - Ob der Rundgang sichtbar ist
 * @param {array} tourSteps - Array von Tour-Steps
 * @param {number} currentStepIndex - Index des aktuellen Steps
 * @param {function} onNext - Callback für "Weiter"
 * @param {function} onBack - Callback für "Zurück"
 * @param {function} onSkip - Callback für "Überspringen"
 * @param {function} onClose - Callback zum Schließen des Rundgangs
 * @param {object} elementPositions - Map von Element-IDs zu Positionen: { elementId: { x, y, width, height } }
 */
export default function TourOverlay({
  visible = false,
  tourSteps = [],
  currentStepIndex = 0,
  onNext = () => {},
  onBack = () => {},
  onSkip = () => {},
  onClose = () => {},
  elementPositions = {},
}) {
  // Fade-Animation für Modal
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [internalVisible, setInternalVisible] = useState(false);

  // Aktueller Step
  const currentStep = tourSteps[currentStepIndex] || null;
  const prevStepIndexRef = useRef(currentStepIndex);

  // Element-Positionen für aktuellen Step
  const elementPosition = currentStep?.target
    ? elementPositions[currentStep.target] || null
    : null;

  // Debug-Log für Element-Positionen
  useEffect(() => {
    if (visible && currentStep) {
      console.log('🎯 TourOverlay: Step:', currentStep.id);
      console.log('🎯 TourOverlay: Target:', currentStep.target);
      console.log('🎯 TourOverlay: Element-Position vorhanden?', !!elementPosition);
      console.log('🎯 TourOverlay: Alle Positionen:', Object.keys(elementPositions));
      if (elementPosition) {
        console.log('🎯 TourOverlay: Position:', elementPosition);
      }
    }
  }, [visible, currentStep, elementPosition, elementPositions]);

  // Berechne Spotlight-Positionen
  const spotlightProps = elementPosition
    ? {
        x: elementPosition.x,
        y: elementPosition.y,
        width: elementPosition.width || 100,
        height: elementPosition.height || 100,
        shape: currentStep.spotlightShape || 'rectangle',
        animated: true,
        glowColor: currentStep.glowColor || '#FFFFFF',
        padding: currentStep.spotlightPadding || 8,
      }
    : {
        // Fallback-Position, wenn Element nicht gefunden wurde
        x: SCREEN_WIDTH / 2 - 50,
        y: SCREEN_HEIGHT / 2 - 50,
        width: 100,
        height: 100,
        shape: currentStep?.spotlightShape || 'rectangle',
        animated: true,
        glowColor: currentStep?.glowColor || '#FFFFFF',
        padding: currentStep?.spotlightPadding || 8,
      };

  // Berechne Sprechblasen-Position basierend auf Element-Position
  const getSpeechBubblePosition = () => {
    if (!elementPosition || !currentStep) {
      return { x: SCREEN_WIDTH / 2 - 160, y: SCREEN_HEIGHT / 2 - 100 };
    }

    const bubbleWidth = Math.min(SCREEN_WIDTH - 40, 320);
    let x = elementPosition.x + elementPosition.width / 2 - bubbleWidth / 2;
    let y = elementPosition.y;

    // Anpassung basierend auf bubblePosition
    switch (currentStep.bubblePosition) {
      case 'top':
        // Für Bottom Navigation Buttons: Blase höher platzieren, damit Button vollständig sichtbar ist
        if (currentStep.target && currentStep.target.includes('bottom-nav')) {
          y = elementPosition.y - 200; // Höher für Bottom Navigation Buttons
        } else {
          y = elementPosition.y - 150;
        }
        break;
      case 'bottom':
        y = elementPosition.y + elementPosition.height + 10;
        break;
      case 'left':
        x = elementPosition.x - bubbleWidth - 20; // Mehr Abstand, damit nicht überdeckt
        y = elementPosition.y + elementPosition.height / 2 - 120; // Zentriert vertikal, etwas höher
        // Stelle sicher, dass Bubble nicht außerhalb des Bildschirms ist
        if (x < 20) {
          // Wenn nicht genug Platz links, zeige rechts
          x = elementPosition.x + elementPosition.width + 20;
        }
        // Stelle sicher, dass Bubble nicht über dem Element ist
        if (y < elementPosition.y) {
          y = elementPosition.y + elementPosition.height + 20; // Unter dem Element
        }
        break;
      case 'right':
        x = elementPosition.x + elementPosition.width + 20; // Mehr Abstand
        y = elementPosition.y + elementPosition.height / 2 - 120; // Zentriert vertikal, etwas höher
        // Stelle sicher, dass Bubble nicht außerhalb des Bildschirms ist
        if (x + bubbleWidth > SCREEN_WIDTH - 20) {
          // Wenn nicht genug Platz rechts, zeige links
          x = elementPosition.x - bubbleWidth - 20;
        }
        // Stelle sicher, dass Bubble nicht über dem Element ist
        if (y < elementPosition.y) {
          y = elementPosition.y + elementPosition.height + 20; // Unter dem Element
        }
        break;
      default:
        y = elementPosition.y + elementPosition.height + 10;
    }

    // Stelle sicher, dass die Sprechblase nicht außerhalb des Bildschirms ist
    if (x < 20) x = 20;
    if (x + bubbleWidth > SCREEN_WIDTH - 20) {
      x = SCREEN_WIDTH - bubbleWidth - 20;
    }
    if (y < 20) y = 20;
    if (y > SCREEN_HEIGHT - 250) y = SCREEN_HEIGHT - 250; // Mehr Platz für Bubble
    
    // Stelle sicher, dass Bubble nicht den beschriebenen Bereich überdeckt
    // Wenn Bubble links/rechts ist, prüfe ob sie das Element überdeckt
    if ((currentStep.bubblePosition === 'left' || currentStep.bubblePosition === 'right') &&
        elementPosition &&
        x < elementPosition.x + elementPosition.width &&
        x + bubbleWidth > elementPosition.x &&
        y < elementPosition.y + elementPosition.height &&
        y + 200 > elementPosition.y) {
      // Bubble würde Element überdecken - verschiebe nach unten
      y = elementPosition.y + elementPosition.height + 20;
    }

    return { x, y };
  };

  const speechBubblePosition = currentStep ? getSpeechBubblePosition() : null;

  // Pfeil-Richtung basierend auf tatsächlicher Position der Bubble relativ zum Element
  // Der Pfeil muss ZUM Element zeigen, nicht von der bubblePosition abhängen
  const getArrowDirection = () => {
    if (!elementPosition || !speechBubblePosition) {
      // Fallback: basierend auf bubblePosition
      if (!currentStep) return 'up';
      switch (currentStep.bubblePosition) {
        case 'top': return 'down';
        case 'bottom': return 'up';
        case 'left': return 'right';
        case 'right': return 'left';
        default: return 'up';
      }
    }

    const bubbleWidth = Math.min(SCREEN_WIDTH - 40, 320);
    const bubbleX = speechBubblePosition.x;
    const bubbleY = speechBubblePosition.y;
    const bubbleCenterX = bubbleX + bubbleWidth / 2;
    const bubbleCenterY = bubbleY + 100; // Ungefähre Mitte der Bubble (Titel + Text)
    
    const elementCenterX = elementPosition.x + elementPosition.width / 2;
    const elementCenterY = elementPosition.y + elementPosition.height / 2;

    // Berechne horizontale und vertikale Distanz
    const deltaX = elementCenterX - bubbleCenterX;
    const deltaY = elementCenterY - bubbleCenterY;
    
    // Bestimme primäre Richtung (größere Distanz)
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      // Vertikale Ausrichtung
      return deltaY > 0 ? 'down' : 'up'; // Element ist unter/über der Bubble
    } else {
      // Horizontale Ausrichtung
      return deltaX > 0 ? 'right' : 'left'; // Element ist rechts/links der Bubble
    }
  };

  // Prüfe ob letzter Step
  const isLastStep = currentStepIndex >= tourSteps.length - 1;

  // Prüfe ob erster Step
  const isFirstStep = currentStepIndex === 0;

  // Fade-In/Out Animation für Modal
  useEffect(() => {
    if (visible) {
      setInternalVisible(true);
      Animated.timing(overlayOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setInternalVisible(false);
      });
    }
  }, [visible, overlayOpacity]);

  // Smooth Transition zwischen Steps
  useEffect(() => {
    if (prevStepIndexRef.current !== currentStepIndex && visible) {
      // Kürzerer Fade-Out/In zwischen Steps
      Animated.sequence([
        Animated.timing(overlayOpacity, {
          toValue: 0.5,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
      prevStepIndexRef.current = currentStepIndex;
    }
  }, [currentStepIndex, visible, overlayOpacity]);

  // Wenn nicht sichtbar oder kein Step, nichts rendern
  if (!internalVisible || !currentStep) {
    return null;
  }

  return (
    <Modal
      visible={internalVisible}
      transparent={true}
      animationType="none"
      statusBarTranslucent={true}
      onRequestClose={onSkip}
    >
      <View style={styles.container} pointerEvents="box-none">
        {/* Spotlight - muss pointerEvents="none" haben und ZURÜCK liegen */}
        {spotlightProps && (
          <View style={{ zIndex: 1 }}>
            <Spotlight
              key={`spotlight-${currentStepIndex}-${currentStep?.target}`} // Key für Re-Render bei Step-Wechsel
              {...spotlightProps}
            />
          </View>
        )}

        {/* Sprechblase - IMMER anzeigen, auch wenn keine Element-Position vorhanden ist - VORNE */}
        {currentStep && (() => {
          // Fallback: Zentrierte Position, wenn keine Position vorhanden
          const bubbleWidth = Math.min(SCREEN_WIDTH - 40, 320);
          const bubbleX = speechBubblePosition?.x ?? (SCREEN_WIDTH / 2 - bubbleWidth / 2);
          const bubbleY = speechBubblePosition?.y ?? (SCREEN_HEIGHT / 2 - 150);
          
          console.log('🎯 TourOverlay: Rendere SpeechBubble', {
            title: currentStep.title,
            x: bubbleX,
            y: bubbleY,
            position: currentStep.bubblePosition,
            hasPosition: !!speechBubblePosition,
            screenWidth: SCREEN_WIDTH,
            screenHeight: SCREEN_HEIGHT,
          });
          
          return (
            <View key={`speechbubble-wrapper-${currentStepIndex}`} style={{ zIndex: 9999, position: 'absolute' }}>
              <SpeechBubble
                key={`speechbubble-${currentStepIndex}`}
                title={currentStep.title || 'Willkommen!'}
                text={currentStep.text || 'Starte deinen Rundgang durch die App.'}
                position={currentStep.bubblePosition || 'bottom'}
                arrowDirection={getArrowDirection()}
                onNext={() => {
                  console.log('🎯 TourOverlay: Weiter-Button geklickt');
                  if (isLastStep) {
                    onClose();
                  } else {
                    onNext();
                  }
                }}
                onBack={isFirstStep ? undefined : onBack}
                onSkip={() => {
                  console.log('🎯 TourOverlay: Überspringen-Button geklickt');
                  onSkip();
                }}
                showBack={!isFirstStep}
                showSkip={true}
                isLastStep={isLastStep}
                x={bubbleX}
                y={bubbleY}
                currentStep={currentStepIndex}
                totalSteps={tourSteps.length}
              />
            </View>
          );
        })()}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
});

