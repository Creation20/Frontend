import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/hooks/useTheme';
import { useLibraryStore } from '../../src/store/useLibraryStore';
import { useUserStore } from '../../src/store/useUserStore';
import { DocumentCard } from '../../src/components/home/DocumentCard';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { documents } = useLibraryStore();
  const { user } = useUserStore();
  const scrollY = useRef(new Animated.Value(0)).current;

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();
  }, []);

  const totalReadingMinutes = Math.floor(
    documents.reduce((sum, d) => sum + (d.readingTime || 0), 0) / 60
  );

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.key === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Floating Executive Header */}
      <Animated.View style={[styles.stickyHeader, { backgroundColor: theme.surface, opacity: headerOpacity, borderBottomColor: theme.border }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerInner}>
             <Text style={[styles.headerTitle, { color: theme.text }]}>Learning Dashboard</Text>
             <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.headerProfile}>
                <Ionicons name="person-circle" size={32} color={theme.primary} />
             </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Animated.View>

      <ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          {/* Executive Greeting */}
          <View style={styles.topSection}>
            <View>
              <Text style={[styles.dateText, { color: theme.primary }]}>
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
              </Text>
              <Text style={[styles.greetingText, { color: theme.text }]}>Welcome, {user.name.split(' ')[0]}</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')} style={styles.mainAvatarBtn}>
               <LinearGradient colors={[theme.primary, theme.accent]} style={styles.avatarGradient}>
                  <Ionicons name="person" size={28} color="#FFF" />
               </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Performance Dashboard Card */}
          <View style={[styles.dashboardCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
             <View style={styles.dashHeader}>
                <View style={[styles.dashIcon, { backgroundColor: theme.primaryLight }]}>
                   <MaterialCommunityIcons name="lightning-bolt" size={20} color={theme.primary} />
                </View>
                <Text style={[styles.dashLabel, { color: theme.textMuted }]}>DAILY PROGRESS</Text>
             </View>
             
             <View style={styles.dashMain}>
                <View>
                   <Text style={[styles.dashValue, { color: theme.text }]}>{totalReadingMinutes}<Text style={styles.dashUnit}>m</Text></Text>
                   <Text style={[styles.dashSubValue, { color: theme.textSecondary }]}>Focused Reading Today</Text>
                </View>
                <View style={styles.streakBox}>
                   <MaterialCommunityIcons name="fire" size={24} color="#FF9500" />
                   <Text style={[styles.streakText, { color: '#FF9500' }]}>{user.streak}</Text>
                </View>
             </View>

             <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
                <LinearGradient 
                  colors={[theme.primary, theme.accent]} 
                  start={{x:0, y:0}} end={{x:1, y:0}}
                  style={[styles.progressFill, { width: '65%' }]} 
                />
             </View>

             <View style={styles.dashFooter}>
                <Text style={[styles.footerText, { color: theme.textMuted }]}>85% Accuracy</Text>
                <Text style={[styles.footerText, { color: theme.textMuted }]}>Goal: 20m</Text>
             </View>
          </View>

          {/* Action Grid */}
          <View style={styles.gridContainer}>
             <ActionItem icon="scan" label="Scan" color="#0B6E6E" onPress={() => router.push('/(tabs)/library')} />
             <ActionItem icon="school" label="Vocab" color="#F59E0B" onPress={() => router.push('/vocabulary')} />
             <ActionItem icon="analytics" label="Stats" color="#8B5CF6" onPress={() => router.push('/(tabs)/profile')} />
             <ActionItem icon="settings" label="Setup" color="#64748B" onPress={() => router.push('/(tabs)/settings')} />
          </View>
        </Animated.View>

        {/* library section remained untouched per request */}
        <View style={styles.libraryHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Library Collection</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/library')}>
            <Text style={[styles.seeAll, { color: theme.primary }]}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.documentList}>
          {documents.slice(0, 4).map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onPress={() => router.push(`/reader/${doc.id}`)}
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function ActionItem({ icon, label, color, onPress }: any) {
  const theme = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[styles.actionItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
       <View style={[styles.actionIconBox, { backgroundColor: color + '15' }]}>
          <Ionicons name={icon} size={22} color={color} />
       </View>
       <Text style={[styles.actionLabel, { color: theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stickyHeader: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100, borderBottomWidth: 1 },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, height: 60 },
  headerTitle: { fontSize: 16, fontWeight: '800' },
  headerProfile: { padding: 4 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60 },
  topSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, marginTop: 20 },
  dateText: { fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: 4 },
  greetingText: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  mainAvatarBtn: { width: 64, height: 64, borderRadius: 32, padding: 2, backgroundColor: '#FFF', elevation: 8 },
  avatarGradient: { flex: 1, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  dashboardCard: { borderRadius: 32, borderWidth: 1, padding: 24, gap: 20, elevation: 2 },
  dashHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dashIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dashLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  dashMain: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dashValue: { fontSize: 42, fontWeight: '900', letterSpacing: -2 },
  dashUnit: { fontSize: 18, marginLeft: 4, opacity: 0.6 },
  dashSubValue: { fontSize: 13, fontWeight: '600' },
  streakBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF7ED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#FFEDD5' },
  streakText: { fontSize: 16, fontWeight: '800' },
  progressTrack: { height: 10, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  dashFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 11, fontWeight: '700' },
  gridContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, marginBottom: 40 },
  actionItem: { width: (width - 76) / 4, padding: 14, borderRadius: 24, borderWidth: 1, alignItems: 'center', gap: 10, elevation: 1 },
  actionIconBox: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 11, fontWeight: '800' },
  libraryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.5 },
  seeAll: { fontSize: 14, fontWeight: '700' },
  documentList: { gap: 16 },
});
