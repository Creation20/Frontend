import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserBadge } from '../../store/useUserStore';
import { useTheme } from '../../hooks/useTheme';

interface AchievementModalProps {
  badge: UserBadge | null;
  visible: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

export function AchievementModal({ badge, visible, onClose }: AchievementModalProps) {
  const theme = useTheme();
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible]);

  if (!badge) return null;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <Animated.View 
          style={[
            styles.container, 
            { backgroundColor: theme.surface, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
          ]}
        >
          <LinearGradient
            colors={[badge.color, badge.color + '80']}
            style={styles.badgeBanner}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <MaterialCommunityIcons name={badge.icon as any} size={80} color="#FFF" />
            </Animated.View>
          </LinearGradient>

          <View style={styles.content}>
            <Text style={[styles.congrats, { color: theme.primary }]}>Milestone Unlocked!</Text>
            <Text style={[styles.badgeTitle, { color: theme.text }]}>{badge.label}</Text>
            <Text style={[styles.badgeDesc, { color: theme.textSecondary }]}>{badge.description}</Text>
            
            <View style={[styles.requirementBox, { backgroundColor: theme.primaryLight }]}>
               <Text style={[styles.requirementText, { color: theme.primary }]}>
                 Challenge: {badge.requirement}
               </Text>
            </View>

            <TouchableOpacity 
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: badge.color }]}
            >
              <Text style={styles.closeBtnText}>Keep Reading</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  container: { width: '100%', borderRadius: 32, overflow: 'hidden', elevation: 20 },
  badgeBanner: { height: 200, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 32, alignItems: 'center', gap: 16 },
  congrats: { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 },
  badgeTitle: { fontSize: 28, fontWeight: '900', textAlign: 'center' },
  badgeDesc: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  requirementBox: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
  requirementText: { fontSize: 12, fontWeight: '700' },
  closeBtn: { width: '100%', height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 12 },
  closeBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
