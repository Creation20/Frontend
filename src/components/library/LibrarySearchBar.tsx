import React from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function LibrarySearchBar({ query, onChange, theme }: any) {
  return (
    <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Ionicons name="search-outline" size={18} color={theme.textMuted} />
      <TextInput
        placeholder="Search your library..."
        placeholderTextColor={theme.textMuted}
        style={[styles.searchInput, { color: theme.text }]}
        value={query}
        onChangeText={onChange}
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={() => onChange('')}>
          <Ionicons name="close-circle" size={18} color={theme.textMuted} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
});
