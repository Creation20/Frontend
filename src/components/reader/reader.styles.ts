import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * ROCK-SOLID Z-INDEX ARCHITECTURE
 * 1: Background Layer
 * 5: Scrollable Content Layer (Navigation, Card, Actions)
 * 10: Focus Overlay Layer (Ruler & Masks) - MUST USE pointerEvents="box-none"
 * 20: Control Layer (Header & Toolbar)
 * 30: AI Assistant Layer (Ask Lexi)
 */

export const readerStyles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // LAYER 5: SCROLLABLE CONTENT
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 140, // Space for Header
    paddingBottom: 180, // Space for Toolbar
    paddingHorizontal: 20,
    gap: 20,
  },

  // Content Navigation (Integrated)
  contentNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '800',
  },
  sectionInfo: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  sectionInfoText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },

  // Document Content Card
  cardContainer: {
    borderRadius: 36,
    borderWidth: 2,
    padding: 26,
    minHeight: 320,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },

  // Executive Action Buttons
  actionRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 10,
  },
  mainAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    borderRadius: 22,
    borderWidth: 1.5,
    gap: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  mainActionText: {
    fontSize: 14,
    fontWeight: '800',
  },

  // LAYER 10: FOCUS SYSTEM (Overlays)
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
    width: 48,
    height: 68,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },

  // LAYER 20: CONTROLS
  headerFixed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  metaContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '900',
  },
  headerChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  toolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  toolBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  chipDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  progressBarTrack: {
    height: 3,
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
  },

  toolbarFixed: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 20,
    paddingBottom: 28,
  },

  // LAYER 30: ASSISTANT
  assistantFloating: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 30,
  },
});
