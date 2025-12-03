import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Spotlight Komponente - Erstellt einen Spotlight-Effekt um ein UI-Element
 * 
 * @param {number} x - X-Position des Elements
 * @param {number} y - Y-Position des Elements
 * @param {number} width - Breite des Elements
 * @param {number} height - Höhe des Elements
 * @param {string} shape - 'circle' oder 'rectangle'
 * @param {boolean} animated - Ob pulsierende Animation aktiviert sein soll
 * @param {string} glowColor - Farbe des Glow-Effekts
 * @param {number} padding - Padding um das Element
 */
export default function Spotlight({
  x = 0,
  y = 0,
  width = 100,
  height = 100,
  shape = 'rectangle',
  animated = true,
  glowColor = '#FFFFFF',
  padding = 8,
}) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.8)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fade-In Animation beim ersten Render
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  // Pulsierende Animation
  useEffect(() => {
    if (animated) {
      Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 1200,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.8,
              duration: 1200,
              useNativeDriver: true,
            }),
          ]),
        ])
      ).start();
    }
  }, [animated, pulseAnim, opacityAnim]);

  // Berechne Spotlight-Parameter
  const spotlightX = x - padding;
  const spotlightY = y - padding;
  const spotlightWidth = width + (padding * 2);
  const spotlightHeight = height + (padding * 2);
  const spotlightRadius = shape === 'circle' 
    ? Math.max(spotlightWidth, spotlightHeight) / 2 
    : 8;

  // Berechne die vier Overlay-Bereiche um das Spotlight-Loch
  const topHeight = Math.max(0, spotlightY);
  const leftWidth = Math.max(0, spotlightX);
  const rightX = spotlightX + spotlightWidth;
  const rightWidth = Math.max(0, SCREEN_WIDTH - rightX);
  const bottomY = spotlightY + spotlightHeight;
  const bottomHeight = Math.max(0, SCREEN_HEIGHT - bottomY);

  return (
    <Animated.View 
      style={[
        styles.container, 
        {
          opacity: fadeAnim,
        }
      ]} 
      pointerEvents="none"
    >
      {/* Top Overlay */}
      {topHeight > 0 && (
        <View style={[styles.overlay, { top: 0, left: 0, right: 0, height: topHeight }]} />
      )}

      {/* Bottom Overlay */}
      {bottomHeight > 0 && (
        <View style={[styles.overlay, { top: bottomY, left: 0, right: 0, height: bottomHeight }]} />
      )}

      {/* Left Overlay */}
      {leftWidth > 0 && (
        <View style={[styles.overlay, { top: spotlightY, left: 0, width: leftWidth, height: spotlightHeight }]} />
      )}

      {/* Right Overlay */}
      {rightWidth > 0 && (
        <View style={[styles.overlay, { top: spotlightY, left: rightX, width: rightWidth, height: spotlightHeight }]} />
      )}

      {/* Glow-Ring um das Spotlight */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            left: spotlightX - 3,
            top: spotlightY - 3,
            width: spotlightWidth + 6,
            height: spotlightHeight + 6,
            borderRadius: spotlightRadius + 3,
            borderColor: glowColor,
            opacity: opacityAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 9998,
  },
  overlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  glowRing: {
    position: 'absolute',
    borderWidth: 3,
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 12,
    elevation: 12,
  },
});
