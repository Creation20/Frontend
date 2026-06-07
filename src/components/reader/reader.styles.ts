import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * LAYER ARCHITECTURE
 * 5:  Scrollable Content (card, navigation, actions)
 * 10: Focus System (ruler + masks)
 * 20: Fixed Controls (header + toolbar)
 * 30: AI Assistant FAB
 */

export const readerStyles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ─── LAYER 5: SCROLLABLE CONTENT ────────────────────────────────────────────
  scrollContent: {
    paddingTop: 130,
    paddingBottom: 200,
    paddingHorizontal: 20,
    gap: 16,
  },

  // Chunk navigation row
  contentNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 100,
    borderWidth: 1.5,
    gap: 6,
    elevation: 0,
  },
  navButtonText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionInfo: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
  },
  sectionInfoText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
  },

  // Reading content card
  cardContainer: {
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 28,
    minHeight: 340,
    elevation: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
  },

  // Action row below card
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  mainAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 8,
  },
  mainActionText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ─── LAYER 10: FOCUS SYSTEM ─────────────────────────────────────────────────
  focusOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  mask: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  ruler: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    justifyContent: 'center',
  },
  rulerHandle: {
    position: 'absolute',
    right: 0,
    width: 44,
    height: 60,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  rulerLabel: {
    position: 'absolute',
    left: 16,
    top: '50%',
    marginTop: -8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    opacity: 0.4,
  },
  rulerLabelText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },

  // ─── LAYER 20: FIXED HEADER ─────────────────────────────────────────────────
  headerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  headerBlur: {
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  headerBackBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  headerMeta: {
    flex: 1,
    gap: 2,
  },
  headerDocTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  headerChipText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  headerDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  headerShareBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },

  // Progress bar under header
  progressBarContainer: {
    height: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },

  // ─── LAYER 20: FLOATING TOOLBAR ─────────────────────────────────────────────
  toolbarFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },

  // ─── LAYER 30: AI FAB ────────────────────────────────────────────────────────
  assistantFloating: {
    position: 'absolute',
    bottom: 130,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    elevation: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  assistantRing: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    opacity: 0.3,
  },

  // ─── DISTRACTION FREE HINT ──────────────────────────────────────────────────
  tapHint: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    zIndex: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tapHintText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});