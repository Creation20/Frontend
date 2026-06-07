import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { Document } from '../../constants/mockData';
import { ProgressBar } from '../common/ProgressBar';
import { Badge } from '../common/Badge';
import { formatRelativeDate } from '../../utils/text.utils';

interface DocumentCardProps {
  document: Document;
  onPress: () => void;
  compact?: boolean;
}

const CATEGORY_ICONS: Record<string, string> = {
  lecture: 'school-outline',
  article: 'newspaper-outline',
  textbook: 'book-outline',
  personal: 'document-text-outline',
};

const CATEGORY_LABELS: Record<string, string> = {
  lecture: 'Lecture Note',
  article: 'Article',
  textbook: 'Textbook',
  personal: 'Document',
};

export function DocumentCard({ document, onPress, compact = false }: DocumentCardProps) {
  const theme = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.shadow,
        },
        compact && styles.cardCompact,
      ]}
    >
      {/* Color Stripe + Icon */}
      <View
        style={[
          styles.stripe,
          { backgroundColor: document.coverColor, width: compact ? 6 : 8 },
        ]}
      />

      <View style={[styles.content, compact && { paddingVertical: 12 }]}>
        {/* Category Badge */}
        <View style={styles.topRow}>
          <Badge
            label={CATEGORY_LABELS[document.category]}
            variant={document.progress > 0 ? 'primary' : 'muted'}
            size="sm"
          />
          {document.lastReadAt && (
            <Text style={[styles.date, { color: theme.textMuted }]}>
              {formatRelativeDate(document.lastReadAt)}
            </Text>
          )}
        </View>

        {/* Title */}
        <Text
          style={[styles.title, { color: theme.text }]}
          numberOfLines={compact ? 1 : 2}
        >
          {document.title}
        </Text>

        {/* Author + Subject */}
        {!compact && (
          <Text style={[styles.meta, { color: theme.textSecondary }]}>
            {document.author} · {document.subject}
          </Text>
        )}

        {/* Progress Row */}
        <View style={styles.progressRow}>
          <ProgressBar
            progress={document.progress}
            height={4}
            color={document.coverColor}
            style={styles.progressBar}
          />
          <Text style={[styles.progressText, { color: theme.textMuted }]}>
            {document.progress}%
          </Text>
        </View>

        {/* Stats Row */}
        {!compact && (
          <View style={styles.statsRow}>
            <StatItem
              icon="time-outline"
              label={`${document.estimatedReadingTime} min`}
              color={theme.textMuted}
            />
            <StatItem
              icon="document-text-outline"
              label={`${document.pages} pages`}
              color={theme.textMuted}
            />
            {(document.bookmarks?.length ?? 0) > 0 && (
              <StatItem
                icon="bookmark-outline"
                label={`${document.bookmarks.length}`}
                color={theme.accent}
              />
            )}
          </View>
        )}
      </View>

      <View style={styles.arrow}>
        <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

function StatItem({
  icon,
  label,
  color,
}: {
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon as any} size={12} color={color} />
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardCompact: {
    borderRadius: 16,
  },
  stripe: {
    width: 8,
  },
  content: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  meta: {
    fontSize: 12,
  },
  date: {
    fontSize: 11,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
  },
  progressText: {
    fontSize: 11,
    fontWeight: '600',
    width: 30,
    textAlign: 'right',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 11,
  },
  arrow: {
    paddingRight: 12,
    justifyContent: 'center',
  },
});
