import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import LoadingIndicator from './LoadingIndicator';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSearch?: (text?: string) => void;
  placeholder?: string;
  loading?: boolean;
  style?: ViewStyle;
  autoFocus?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  onSearch,
  placeholder = '검색...',
  loading = false,
  style,
  autoFocus = false,
}) => {
  const handleSearch = () => {
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleClear = () => {
    onChangeText('');
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.searchInputContainer}>
        <Ionicons name="search" size={20} color={theme.colors.textLight} style={styles.searchIcon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textLight}
          style={styles.textInput}
          autoFocus={autoFocus}
          returnKeyType="search"
          onSubmitEditing={handleSearch}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color={theme.colors.textLight} />
          </TouchableOpacity>
        )}
      </View>
      {onSearch && (
        <TouchableOpacity
          style={[styles.searchButton, loading && styles.searchButtonLoading]}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <LoadingIndicator/> 
          ) : (
            <Ionicons name="search" size={18} color={theme.colors.primary} />
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  textInput: {
    flex: 1,
    fontSize: theme.typography.fontSize.base,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    paddingVertical: theme.spacing.xs,
  },
  clearButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  searchButtonLoading: {
    opacity: 0.6,
  },
});

export default SearchBar; 