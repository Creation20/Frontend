import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../../src/hooks/useTheme';
import { useLibraryStore } from '../../src/store/useLibraryStore';
import { useUserStore, UserBadge } from '../../src/store/useUserStore';
import { ProgressBar } from '../../src/components/common/ProgressBar';
import { AchievementModal } from '../../src/components/modals/AchievementModal';

const { width } = Dimensions.get('window');
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { documents } = useLibraryStore();
  const { user, updateUser, addBadge, fetchProfile, logout } = useUserStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [achievementVisible, setAchievementVisible] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);

  useEffect(() => {
    fetchProfile().catch(err => console.warn('Profile Fetch Error:', err.message));
  }, []);

  const totalReadingSeconds = documents.reduce((s, d) => s + (d.readingTime || 0), 0);
  const totalMinutes = Math.floor(totalReadingSeconds / 60);
  
  const avgWPM = Math.round(
    user.wpmHistory.reduce((a, b) => a + b, 0) / (user.wpmHistory.length || 1)
  );
  
  const avgAccuracy = Math.round(
    user.comprehensionHistory.reduce((a, b) => a + b, 0) / (user.comprehensionHistory.length || 1)
  );

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Sign Out', 
        style: 'destructive', 
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        } 
      },
    ]);
  };

  const handleGenerateReport = async () => {
    const html = `<html><head><style>body { font-family: sans-serif; padding: 40px; } .header { color: #0B6E6E; border-bottom: 2px solid #E2E8F0; padding-bottom: 20px; }</style></head><body><h1 class="header">LexiAid Progress Report</h1><p>Student: ${user.name}</p><p>Avg Speed: ${avgWPM} WPM</p><p>Accuracy: ${avgAccuracy}%</p></body></html>`;
    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch (e) { Alert.alert('Error', 'Report generation failed'); }
  };

  const handleShowAchievement = (badge: UserBadge) => {
    setSelectedBadge(badge);
    setAchievementVisible(true);
  };

  const unlockBadge = (id: string, label: string, icon: string, color: string) => {
     addBadge(id);
     const earnedBadge = useUserStore.getState().user.badges.find(b => b.id === id);
     if (earnedBadge) {
       setSelectedBadge(earnedBadge);
       setAchievementVisible(true);
     }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <LinearGradient colors={[theme.primary, '#063838']} style={styles.headerGradient}>
            <SafeAreaView edges={['top']}>
              <View style={styles.headerTopRow}>
                <Text style={styles.headerLabel}>Student Dashboard</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity onPress={handleGenerateReport} style={styles.headerIconBtn}>
                    <Ionicons name="document-text-outline" size={20} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditModalVisible(true)} style={styles.headerIconBtn}>
                    <Ionicons name="create-outline" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.userInfoRow}>
                <View style={styles.avatarWrapper}>
                  <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                    <Ionicons name="person" size={40} color="#FFF" />
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: theme.success }]} />
                </View>
                <View style={styles.userText}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <View style={styles.levelProgressContainer}>
                    <Text style={styles.levelText}>Level {user.level}</Text>
                    <View style={styles.xpBarTrack}>
                      <View style={[styles.xpBarFill, { width: `${(user.xp % 1000) / 10}%` }]} />
                    </View>
                    <Text style={styles.xpText}>{user.xp % 1000} / 1000 XP</Text>
                  </View>
                </View>
              </View>

              <View style={styles.metricsGrid}>
                <MetricItem value={`${avgWPM}`} sub="WPM" />
                <View style={styles.metricDivider} />
                <MetricItem value={`${avgAccuracy}%`} sub="Accuracy" />
                <View style={styles.metricDivider} />
                <MetricItem value={`${user.streak}`} sub="Streak" />
              </View>
            </SafeAreaView>
          </LinearGradient>
        </View>

        <View style={styles.mainContent}>
          <View style={[styles.mainCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
             <Text style={[styles.cardTitle, { color: theme.text }]}>WPM Improvement</Text>
             <View style={styles.chartContainer}>
                {user.wpmHistory.map((val, i) => (
                   <View key={i} style={styles.barCol}>
                      <View style={[styles.barTrack, { backgroundColor: theme.border }]}>
                         <View style={[styles.barFill, { height: `${(val / 150) * 100}%`, backgroundColor: theme.primary }]} />
                      </View>
                      <Text style={[styles.barLabel, { color: theme.textMuted }]}>{DAYS[i].charAt(0)}</Text>
                   </View>
                ))}
             </View>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 0 }]}>Milestones</Text>
            <Text style={[styles.earnedCount, { color: theme.primary }]}>{user.badges.length}/4 Earned</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.achievementList}>
            {user.badges.map((badge) => (
              <TouchableOpacity key={badge.id} onPress={() => handleShowAchievement(badge)}>
                <AchievementCard badge={badge} earned />
              </TouchableOpacity>
            ))}
            
            {user.badges.length < 4 && (
              <TouchableOpacity 
                style={[styles.achCard, { backgroundColor: theme.surface, borderColor: theme.border, borderStyle: 'dashed' }]}
                onPress={() => unlockBadge('focus-master', 'Deep Focus', 'shield-check', '#10B981')}
              >
                <Ionicons name="add" size={24} color={theme.textMuted} />
                <Text style={[styles.achLabel, { color: theme.textMuted }]}>Claim Next</Text>
              </TouchableOpacity>
            )}
          </ScrollView>

          <View style={styles.menuList}>
            <MenuOption icon="person-outline" label="Account Details" onPress={() => setEditModalVisible(true)} theme={theme} />
            <MenuOption icon="notifications-outline" label="Reminders" theme={theme} />
            <MenuOption icon="help-circle-outline" label="Help & Support" theme={theme} />
            <MenuOption icon="log-out-outline" label="Sign Out" onPress={handleLogout} theme={theme} />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <EditProfileModal visible={editModalVisible} onClose={() => setEditModalVisible(false)} />
      <AchievementModal badge={selectedBadge} visible={achievementVisible} onClose={() => setAchievementVisible(false)} />
    </View>
  );
}

function EditProfileModal({ visible, onClose }: any) {
  const theme = useTheme();
  const { user, updateUser } = useUserStore();
  const [form, setForm] = useState({ name: user.name, username: user.username, email: user.email });

  const handleSave = () => {
    updateUser(form);
    onClose();
    Alert.alert('Success', 'Profile updated successfully!');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.modalContent, { backgroundColor: theme.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color={theme.text} /></TouchableOpacity>
          </View>
          <ScrollView style={{ padding: 24 }}>
            <Input label="Full Name" value={form.name} onChange={(t) => setForm({ ...form, name: t })} theme={theme} />
            <Input label="Username" value={form.username} onChange={(t) => setForm({ ...form, username: t })} theme={theme} />
            <Input label="Email Address" value={form.email} onChange={(t) => setForm({ ...form, email: t })} theme={theme} />
            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: theme.primary }]}><Text style={styles.saveBtnText}>Save Changes</Text></TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function Input({ label, value, onChange, theme }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{label}</Text>
      <TextInput style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]} value={value} onChangeText={onChange} />
    </View>
  );
}

function MetricItem({ value, sub }: any) {
  return (
    <View style={styles.metricItem}>
      <Text style={styles.metricVal}>{value}</Text>
      <Text style={styles.metricSub}>{sub}</Text>
    </View>
  );
}

function AchievementCard({ badge, earned = true }: { badge: UserBadge, earned?: boolean }) {
  const theme = useTheme();
  return (
    <View style={[styles.achCard, { backgroundColor: theme.surface, borderColor: earned ? badge.color : theme.border }]}>
      <View style={[styles.achIcon, { backgroundColor: badge.color + '15' }]}>
        <MaterialCommunityIcons name={badge.icon as any} size={28} color={badge.color} />
      </View>
      <Text style={[styles.achLabel, { color: theme.text }]}>{badge.label}</Text>
    </View>
  );
}

function MenuOption({ icon, label, theme, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={[styles.menuOpt, { borderBottomColor: theme.border }]}>
      <View style={styles.menuOptLeft}><Ionicons name={icon} size={20} color={theme.textSecondary} /><Text style={[styles.menuOptLabel, { color: theme.text }]}>{label}</Text></View>
      <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerContainer: { marginBottom: 20 },
  headerGradient: { paddingHorizontal: 24, paddingBottom: 32, borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  headerLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  headerIconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  userInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: 32 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.2)' },
  statusDot: { position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, borderRadius: 8, borderWidth: 3, borderColor: '#0B6E6E' },
  userText: { gap: 6 },
  userName: { fontSize: 24, fontWeight: '900', color: '#FFF', letterSpacing: -0.5 },
  levelProgressContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  levelText: { fontSize: 12, color: '#FFF', fontWeight: '900' },
  xpBarTrack: { width: 80, height: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' },
  xpBarFill: { height: '100%', backgroundColor: '#F59E0B' },
  xpText: { fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: '700' },
  metricsGrid: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 24, padding: 20, justifyContent: 'space-between', alignItems: 'center' },
  metricItem: { flex: 1, alignItems: 'center', gap: 2 },
  metricVal: { fontSize: 20, fontWeight: '900', color: '#FFF' },
  metricSub: { fontSize: 9, color: 'rgba(255,255,255,0.6)', fontWeight: '800', textTransform: 'uppercase' },
  metricDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.1)' },
  mainContent: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '900', marginBottom: 16, letterSpacing: -0.5 },
  mainCard: { borderRadius: 28, borderWidth: 1, padding: 24, marginBottom: 24 },
  cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 20 },
  chartContainer: { flexDirection: 'row', alignItems: 'flex-end', height: 100, justifyContent: 'space-between' },
  barCol: { alignItems: 'center', gap: 8 },
  barTrack: { width: 10, height: 70, borderRadius: 5, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 5 },
  barLabel: { fontSize: 10, fontWeight: '800' },
  achievementList: { gap: 12, paddingBottom: 10 },
  achCard: { width: 120, height: 120, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  achIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  achLabel: { fontSize: 11, fontWeight: '800', textAlign: 'center' },
  menuList: { gap: 0, marginTop: 12 },
  menuOpt: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 18, borderBottomWidth: 1 },
  menuOptLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuOptLabel: { fontSize: 15, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 32, borderTopRightRadius: 32, height: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  modalTitle: { fontSize: 20, fontWeight: '900' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 8, marginLeft: 4 },
  input: { height: 56, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, fontSize: 16, fontWeight: '600' },
  saveBtn: { height: 60, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginTop: 20, elevation: 4 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
});
