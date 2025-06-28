import React from 'react';
import { RefreshControl, RefreshControlProps } from 'react-native';
import { theme } from '../../theme/theme';

interface PullToRefreshProps extends RefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
}

const PullToRefresh: React.FC<PullToRefreshProps> = ({ refreshing, onRefresh, ...props }) => {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      colors={[theme.colors.primary, theme.colors.secondary]}
      progressBackgroundColor={theme.colors.background}
      tintColor={theme.colors.primary}
      {...props}
    />
  );
};

export default PullToRefresh; 