import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Animated, Dimensions, Easing } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BOTTOM_NAV_HEIGHT = 75;
const TAB_COUNT = 4;
const INFO_TAB_INDEX = 3;

export default function NewsPopup({ visible, onClose, onNavigate, unreadCount = 0, anchorLayout = null }) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const translateYAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.circle),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 160,
          easing: Easing.in(Easing.circle),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

const tabWidth = SCREEN_WIDTH / TAB_COUNT;
let anchorCenterX;
let baseBottomOffset;
let targetTranslateY;

if (
  anchorLayout &&
  Number.isFinite(anchorLayout.x) &&
  Number.isFinite(anchorLayout.y) &&
  Number.isFinite(anchorLayout.width) &&
  Number.isFinite(anchorLayout.height)
) {
  anchorCenterX = anchorLayout.x + anchorLayout.width / 2;
  const distanceFromBottom = SCREEN_HEIGHT - (anchorLayout.y + anchorLayout.height);
  baseBottomOffset = Math.max(0, distanceFromBottom + anchorLayout.height / 2);
  targetTranslateY = -(anchorLayout.height / 2 + 12);
} else {
  anchorCenterX = tabWidth * (INFO_TAB_INDEX + 0.5);
  baseBottomOffset = BOTTOM_NAV_HEIGHT / 2;
  targetTranslateY = -(BOTTOM_NAV_HEIGHT / 2 + 12);
}

const horizontalOffset = anchorCenterX - SCREEN_WIDTH / 2;

const translateY = translateYAnim.interpolate({
  inputRange: [0, 1],
  outputRange: [0, targetTranslateY],
});

console.log('[NewsPopup] anchorLayout', anchorLayout);
console.log('[NewsPopup] offsets', { anchorCenterX, horizontalOffset, baseBottomOffset, targetTranslateY });

  const handleNotificationPress = () => {
    onClose();
    if (onNavigate) {
      onNavigate('notifications');
    }
  };

  const handleHintsPress = () => {
    onClose();
    if (onNavigate) {
      onNavigate('infobox');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          style={[
            styles.popupContainer,
            {
              bottom: baseBottomOffset,
              transform: [
                { translateX: horizontalOffset },
                { translateY },
                { scale },
              ],
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.popupContent}>
              {/* Glühlampe - Hinweise */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleHintsPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>💡</Text>
                  {unreadCount > 0 && (
                    <View style={styles.iconBadge}>
                      <Text style={styles.iconBadgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {/* InfoBox Button - zeigt alle Notifications */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleNotificationPress}
                activeOpacity={0.7}
              >
                <View style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>📰</Text>
                  {unreadCount > 0 && (
                    <View style={styles.iconBadge}>
                      <Text style={styles.iconBadgeText}>
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  popupContainer: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  popupContent: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  iconButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  iconEmoji: {
    fontSize: 21,
  },
  iconBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#F44336',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  hintBadge: {
    backgroundColor: '#FF9800',
  },
  iconBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

