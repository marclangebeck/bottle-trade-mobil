// Zentrale Tastatur-Utilities für Formular-Screens
// - scrollToInput: Scrollt präzise zum fokussierten Feld
// - getKeyboardAvoidingViewProps: Einheitliche KAV-Konfiguration für iOS/Android

import { Platform, findNodeHandle, Dimensions } from 'react-native';
import { requestAnimationFrame } from 'react-native/Libraries/Renderer/shims/ReactNative';

// Scrollt zum aktiven Input auf eine einheitliche Zielposition (zentrierter Eindruck).
// targetCenterRatio definiert, wo die Feldmitte landen soll (0.38 ≈ weiter oberhalb der Mitte).
// delayMs sorgt dafür, dass nach Keyboard-/Layout-Updates gemessen wird.
export const scrollToInput = (scrollViewRef, inputRef = null, targetCenterRatio = 0.38, delayMs = 40) => {
  try {
    const scrollView = scrollViewRef?.current;
    const input = inputRef?.current;
    if (!scrollView || !input || !scrollView.scrollTo) return;

    const windowHeight = Dimensions.get('window').height || 800;
    // Zielposition der Feldmitte als Anteil der Bildschirmhöhe
    const desiredCenter = windowHeight * targetCenterRatio;

    const measureWithCenter = (onCenterReady) => {
      if (typeof input.measureInWindow === 'function') {
        input.measureInWindow((_x, y, _w, h) => onCenterReady(y + (h ?? 0) / 2));
        return true;
      }
      const scrollNode = scrollView.getScrollableNode ? scrollView.getScrollableNode() : scrollView;
      const targetHandle = findNodeHandle(scrollNode);
      if (targetHandle && typeof input.measureLayout === 'function') {
        input.measureLayout(
          targetHandle,
          (_x, y, _w, h) => {
            const center = y + (h ?? 50) / 2;
            onCenterReady(center);
          },
          () => scrollView.scrollTo({ y: 120, animated: true })
        );
        return true;
      }
      return false;
    };

    const performScroll = () => {
      const didMeasure = measureWithCenter((centerY) => {
        const targetY = Math.max(centerY - desiredCenter, 0);
        scrollView.scrollTo({ y: targetY, animated: true });
      });
      if (!didMeasure) {
        scrollView.scrollTo({ y: 120, animated: true });
      }
    };

    // Nach dem Fokus kann sich das Layout (Keyboard/Padding) noch ändern.
    // Zwei Animation Frames + kurzer Timeout sorgen für stabile Koordinaten.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (delayMs > 0) {
          setTimeout(performScroll, delayMs);
        } else {
          performScroll();
        }
      });
    });
  } catch (error) {
    console.log('scrollToInput error:', error);
  }
};

// Einheitliche KeyboardAvoidingView-Props (Offset kann bei Bedarf angepasst werden)
export const getKeyboardAvoidingViewProps = (offset = 120) => ({
  behavior: Platform.OS === 'ios' ? 'padding' : 'height',
  keyboardVerticalOffset: offset,
  enabled: true,
});


