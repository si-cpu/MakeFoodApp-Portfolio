import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from 'react-native-paper';
import { theme } from '../../theme/theme';
import Button from '../../components/common/Button';

interface UserStep1Props {
  name: string;
  originalName: string;
  onNicknameChange: (value: string) => void;
  onCheckName: (nickname?: string) => void;
  isNameChecked: boolean;
}

// 닉네임 입력 컴포넌트
const NicknameInput = memo(({ 
  name,
  originalName,
  onNicknameChange,
  onCheckName,
  isNameChecked
}: {
  name: string;
  originalName: string;
  onNicknameChange: (value: string) => void;
  onCheckName: (nickname?: string) => void;
  isNameChecked: boolean;
}) => {
  const [localValue, setLocalValue] = useState('');
  const [localIsNameChecked, setLocalIsNameChecked] = useState(isNameChecked);
  
  // props가 변경되면 로컬 상태 동기화
  React.useEffect(() => {
    setLocalIsNameChecked(isNameChecked);
  }, [isNameChecked]);
  
  // 닉네임이 변경되지 않았으면 중복확인 불필요
  const isNameUnchanged = localValue === originalName || (!localValue && !originalName);
  const isValidNickname = localValue && localValue.trim().length >= 3;
  
  const handleBlur = () => {
    onNicknameChange(localValue);
  };
  
  const handleTextChange = (text: string) => {
    setLocalValue(text);
    // 닉네임이 변경되면 중복확인 상태 리셋
    if (text !== originalName && localIsNameChecked) {
      setLocalIsNameChecked(false);
    }
  };
  
  const handleCheckName = () => {
    // 빈 값이면 기존 닉네임 유지 (중복확인 불필요)
    if (!localValue || localValue.trim() === '') {
      onNicknameChange(originalName || '');
      return;
    }
    
    // 기존 닉네임과 같으면 중복확인 불필요
    if (localValue === originalName) {
      onNicknameChange(localValue);
      return;
    }
    
    // 새로운 닉네임이면 중복확인 실행
    onNicknameChange(localValue);
    onCheckName(localValue);
    
    // 중복확인 후 성공하면 로컬 상태 업데이트 (부모에서 isNameChecked가 true로 변경될 때까지 기다림)
    // useEffect에서 처리됨
  };
  
  // 버튼 스타일 미리 계산
  const getButtonStyle = (): ViewStyle => {
    if (!localValue || localValue.trim() === '') {
      // 빈 값: 기존유지 버튼 (정보 스타일)
      return StyleSheet.flatten([styles.checkButton, styles.infoButton]);
    } else if (localValue === originalName) {
      // 기존과 동일: 기존닉네임 버튼 (정보 스타일)
      return StyleSheet.flatten([styles.checkButton, styles.infoButton]);
    } else if (localIsNameChecked && localValue !== originalName) {
      // 중복확인 완료: 확인완료 버튼 (성공 스타일)
      return StyleSheet.flatten([styles.checkButton, styles.successButton]);
    } else {
      // 중복확인 필요: 중복확인 버튼 (기본 스타일)
      return StyleSheet.flatten([styles.checkButton, styles.primaryButton]);
    }
  };
  
  // 버튼 제목 계산
  const getButtonTitle = () => {
    if (!localValue || localValue.trim() === '') {
      return "기존유지";
    } else if (localValue === originalName) {
      return "기존닉네임";
    } else if (localIsNameChecked && localValue !== originalName) {
      return "✓ 완료";
    } else {
      return "중복확인";
    }
  };
  
  // 버튼 variant는 사용하지 않음 (커스텀 스타일 사용)
  const getButtonVariant = () => {
    return "primary"; // 기본값
  };
  
  // 버튼 텍스트 스타일 계산
  const getButtonTextStyle = () => {
    if (!localValue || localValue.trim() === '') {
      // 기존유지: 회색 텍스트
      return styles.infoButtonText;
    } else if (localValue === originalName) {
      // 기존닉네임: 회색 텍스트
      return styles.infoButtonText;
    } else if (localIsNameChecked && localValue !== originalName) {
      // 확인완료: 흰색 텍스트
      return styles.whiteButtonText;
    } else {
      // 중복확인: 흰색 텍스트
      return styles.whiteButtonText;
    }
  };
  
  // 버튼 비활성화 조건
  const isButtonDisabled = () => {
    // 입력값이 있지만 유효하지 않은 경우만 비활성화
    return localValue && localValue.trim() !== '' && localValue.trim().length < 3;
  };
  
  return (
    <View style={styles.inputSection}>
      <Text style={styles.modernLabel}>닉네임</Text>
      <View style={styles.nameRow}>
        <View style={styles.inputContainer}>
          <TextInput
            value={localValue}
            onChangeText={handleTextChange}
            onBlur={handleBlur}
            placeholder={originalName ? ` ${originalName}` : "닉네임을 입력하세요"}
            style={[
              styles.nicknameInput,
              localIsNameChecked && !isNameUnchanged && styles.checkedInput,
              isNameUnchanged && styles.unchangedInput
            ]}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            keyboardType="default"
            returnKeyType="done"
            blurOnSubmit={false}
            placeholderTextColor={theme.colors.textSecondary}
          />
          {localIsNameChecked && localValue && localValue !== originalName && (
            <View style={styles.checkMark}>
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            </View>
          )}
          {((!localValue || localValue.trim() === '') || localValue === originalName) && originalName && (
            <View style={styles.checkMark}>
              <Ionicons name="information-circle" size={20} color={theme.colors.info} />
            </View>
          )}
        </View>
        <Button
          title={getButtonTitle()}
          onPress={handleCheckName}
          style={getButtonStyle()}
          disabled={isButtonDisabled()}
          textStyle={getButtonTextStyle()}
        />
      </View>
      
      {/* 상태 메시지 */}
      {localIsNameChecked && localValue && localValue !== originalName && (
        <View style={styles.statusMessage}>
          <View style={styles.successContainer}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
            <Text style={styles.successText}>사용 가능한 닉네임입니다</Text>
          </View>
        </View>
      )}
      
      {(!localValue || localValue.trim() === '') && originalName && (
        <View style={styles.statusMessage}>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={16} color={theme.colors.info} />
            <Text style={styles.infoText}>기존 닉네임을 유지합니다</Text>
          </View>
        </View>
      )}
      
      {localValue === originalName && localValue && (
        <View style={styles.statusMessage}>
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle" size={16} color={theme.colors.info} />
            <Text style={styles.infoText}>기존 닉네임과 동일합니다</Text>
          </View>
        </View>
      )}
      
      {/* 도움말 */}
      <View style={styles.helperContainer}>
        <Text style={styles.helperText}>
          💡 닉네임 설정 가이드
        </Text>
        <Text style={styles.helperSubText}>
          • 3글자 이상 입력해주세요{'\n'}
          • 한글, 영문, 숫자만 사용 가능합니다{'\n'}
          • 비워두면 기존 닉네임을 유지합니다
        </Text>
      </View>
    </View>
  );
});

const UserStep1 = memo(({ name, originalName, onNicknameChange, onCheckName, isNameChecked }: UserStep1Props) => {
  console.log('🔄 UserStep1 리렌더링');

  return (
    <Card style={styles.modernCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>기본 정보</Text>
        </View>
        
        <NicknameInput
          name={name}
          originalName={originalName}
          onNicknameChange={onNicknameChange}
          onCheckName={onCheckName}
          isNameChecked={isNameChecked}
        />
      </Card.Content>
    </Card>
  );
});

UserStep1.displayName = 'UserStep1';
NicknameInput.displayName = 'NicknameInput';

// React DevTools
UserStep1.whyDidYouRender = true;
NicknameInput.whyDidYouRender = true;

const styles = StyleSheet.create({
  modernCard: {
    borderRadius: theme.borderRadius.xl,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  cardTitle: {
    fontSize: theme.typography.fontSize.xl,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.xs,
  },
  inputSection: {
    marginBottom: theme.spacing.xl,
  },
  modernLabel: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  inputContainer: {
    flex: 1,
    position: 'relative',
    marginRight: theme.spacing.sm,
  },
  nicknameInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingRight: 40, // 아이콘 공간 확보
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
    fontFamily: theme.typography.fontFamily.regular,
    ...theme.shadows.sm,
  },
  checkButton: {
    height: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 0,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  checkedInput: {
    borderColor: theme.colors.success,
  },
  unchangedInput: {
    borderColor: theme.colors.info,
  },
  checkMark: {
    position: 'absolute',
    right: theme.spacing.sm,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  successText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.success,
    marginLeft: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.medium,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.info,
    marginLeft: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily.medium,
  },
  helperContainer: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
  },
  helperText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily.bold,
    marginBottom: theme.spacing.xs,
  },
  helperSubText: {
    fontSize: theme.typography.fontSize.small,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontFamily: theme.typography.fontFamily.regular,
  },
  infoButton: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E9ECEF',
  },
  successButton: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  infoButtonText: {
    color: theme.colors.textSecondary,
  },
  whiteButtonText: {
    color: theme.colors.white,
  },
});

export default UserStep1; 