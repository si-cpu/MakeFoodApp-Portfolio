import React from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme/theme';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

interface Step1Props {
  // 상태값들
  name: string;
  marketingConsent: boolean;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  isNameChecked: boolean;
  
  // 핸들러들
  onNicknameChange: (nickname: string) => void;
  onCheckName: (nickname: string) => void;
  onMarketingConsentChange: (value: boolean) => void;
  onTermsAgreedChange: (value: boolean) => void;
  onPrivacyAgreedChange: (value: boolean) => void;
  
  // 유틸
  navigation: any;
}

// 닉네임 입력 컴포넌트
const NicknameInput = React.memo(({ 
  onCheckName, 
  onNicknameChange,
  initialValue = '',
  isNameChecked
}: {
  onCheckName: (nickname: string) => void;
  onNicknameChange: (nickname: string) => void;
  initialValue?: string;
  isNameChecked?: boolean;
}) => {
  console.log('🔄 NicknameInput 리렌더링');
  const [localValue, setLocalValue] = React.useState(initialValue);
  const [localIsNameChecked, setLocalIsNameChecked] = React.useState(isNameChecked || false);
  
  // initialValue가 변경되면 localValue도 업데이트
  React.useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);
  
  // props가 변경되면 로컬 상태 동기화
  React.useEffect(() => {
    setLocalIsNameChecked(isNameChecked || false);
  }, [isNameChecked]);
  
  const handleBlur = () => {
    console.log('📝 NicknameInput onBlur:', localValue);
    onNicknameChange(localValue);
  };
  
  const handleTextChange = (text: string) => {
    setLocalValue(text);
    // 닉네임이 변경되면 중복확인 상태 리셋
    if (text !== initialValue && localIsNameChecked) {
      setLocalIsNameChecked(false);
    }
  };
  
  const handleCheckName = () => {
    // 먼저 상위 상태를 업데이트하고 중복확인 실행
    onNicknameChange(localValue);
    onCheckName(localValue);
  };
  
  // 버튼 스타일 계산
  const getButtonStyle = () => {
    if (localIsNameChecked && localValue === initialValue) {
      // 확인완료: 성공 스타일
      return StyleSheet.flatten([styles.checkButton, styles.successButton]);
    } else {
      // 중복확인: 기본 스타일
      return StyleSheet.flatten([styles.checkButton, styles.primaryButton]);
    }
  };
  
  // 버튼 제목 계산
  const getButtonTitle = () => {
    if (localIsNameChecked && localValue === initialValue) {
      return "✓ 완료";
    } else {
      return "중복확인";
    }
  };
  
  // 버튼 텍스트 스타일 계산
  const getButtonTextStyle = () => {
    return styles.whiteButtonText;
  };
  
  // 닉네임이 유효한지 체크 (3글자 이상, 공백 제거 후)
  const isValidNickname = localValue && localValue.trim().length >= 3;
  
  return (
    <View style={styles.nameRow}>
      <View style={styles.inputContainer}>
        <TextInput
          value={localValue}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          placeholder="닉네임을 입력하세요"
          style={[
            styles.nicknameInput,
            localIsNameChecked && localValue === initialValue && styles.checkedInput
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
        {localIsNameChecked && localValue === initialValue && (
          <View style={styles.checkMark}>
            <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
          </View>
        )}
      </View>
      <Button
        title={getButtonTitle()}
        onPress={handleCheckName}
        style={getButtonStyle()}
        textStyle={getButtonTextStyle()}
        disabled={!isValidNickname}
      />
    </View>
  );
});

const Step1 = React.memo(({
  name,
  marketingConsent,
  termsAgreed,
  privacyAgreed,
  isNameChecked,
  onNicknameChange,
  onCheckName,
  onMarketingConsentChange,
  onTermsAgreedChange,
  onPrivacyAgreedChange,
  navigation
}: Step1Props) => {
  console.log('🔄 Step1 리렌더링');
  
  return (
    <Card style={styles.modernCard}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Ionicons name="person-outline" size={24} color={theme.colors.primary} />
          <Text style={styles.cardTitle}>기본 정보</Text>
        </View>
        
        <Text style={styles.modernLabel}>닉네임</Text>
        <NicknameInput
          onNicknameChange={onNicknameChange}
          onCheckName={onCheckName}
          initialValue={name}
          isNameChecked={isNameChecked}
        />
        
        <View style={styles.agreementSection}>
          <Text style={styles.agreementTitle}>서비스 이용 동의</Text>
          
          {/* 마케팅 정보 수신 동의 (선택) */}
          <TouchableOpacity 
            style={[
              styles.checkRow, 
              styles.optionalAgreement,
              marketingConsent && styles.checkedRow
            ]}
            onPress={() => onMarketingConsentChange(!marketingConsent)}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxContainer}>
              <View style={[
                styles.customCheckbox,
                marketingConsent && styles.customCheckboxChecked
              ]}>
                {marketingConsent && (
                  <Ionicons name="checkmark" size={18} color={theme.colors.white} />
                )}
              </View>
            </View>
            <View style={styles.agreementTextContainer}>
              <Text style={[styles.checkText, marketingConsent && styles.checkedText]}>
                마케팅 정보 수신 동의 
              </Text>
              <Text style={styles.optionalText}>(선택)</Text>
            </View>
          </TouchableOpacity>
          
          {/* 이용약관 동의 (필수) */}
          <TouchableOpacity 
            style={[
              styles.checkRow, 
              styles.requiredAgreement,
              termsAgreed && styles.checkedRow
            ]}
            onPress={() => onTermsAgreedChange(!termsAgreed)}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxContainer}>
              <View style={[
                styles.customCheckbox,
                termsAgreed && styles.customCheckboxChecked
              ]}>
                {termsAgreed && (
                  <Ionicons name="checkmark" size={18} color={theme.colors.white} />
                )}
              </View>
            </View>
            <View style={styles.agreementTextContainer}>
              <View style={styles.agreementTextRow}>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('Terms');
                  }}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>이용약관</Text>
                  <Ionicons name="open-outline" size={16} color={theme.colors.white} style={styles.linkIcon} />
                </TouchableOpacity>
                <Text style={[styles.checkText, termsAgreed && styles.checkedText]}>에 동의합니다</Text>
              </View>
              <Text style={styles.requiredText}>(필수)</Text>
            </View>
          </TouchableOpacity>
          
          {/* 개인정보처리방침 동의 (필수) */}
          <TouchableOpacity 
            style={[
              styles.checkRow, 
              styles.requiredAgreement,
              privacyAgreed && styles.checkedRow
            ]}
            onPress={() => onPrivacyAgreedChange(!privacyAgreed)}
            activeOpacity={0.7}
          >
            <View style={styles.checkboxContainer}>
              <View style={[
                styles.customCheckbox,
                privacyAgreed && styles.customCheckboxChecked
              ]}>
                {privacyAgreed && (
                  <Ionicons name="checkmark" size={18} color={theme.colors.white} />
                )}
              </View>
            </View>
            <View style={styles.agreementTextContainer}>
              <View style={styles.agreementTextRow}>
                <TouchableOpacity 
                  onPress={(e) => {
                    e.stopPropagation();
                    navigation.navigate('PrivacyPolicy');
                  }}
                  style={styles.linkButton}
                >
                  <Text style={styles.linkText}>개인정보처리방침</Text>
                  <Ionicons name="open-outline" size={16} color={theme.colors.white} style={styles.linkIcon} />
                </TouchableOpacity>
                <Text style={[styles.checkText, privacyAgreed && styles.checkedText]}>에 동의합니다</Text>
              </View>
              <Text style={styles.requiredText}>(필수)</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Card.Content>
    </Card>
  );
});

const styles = StyleSheet.create({
  modernCard: {
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    ...theme.shadows.md,
    zIndex: 0,
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
  modernLabel: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  checkButton: {
    height: 48,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 0,
    borderRadius: theme.borderRadius.md,
    marginLeft: theme.spacing.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 100,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  agreementSection: {
    marginTop: theme.spacing.lg,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    backgroundColor: theme.colors.white,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  linkText: {
    color: theme.colors.white,
    fontFamily: theme.typography.fontFamily.bold,
    fontSize: theme.typography.fontSize.small,
  },
  checkText: {
    color: theme.colors.text,
    fontSize: theme.typography.fontSize.medium,
    marginLeft: theme.spacing.xs,
    lineHeight: theme.typography.fontSize.medium * 1.4,
  },
  nicknameInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingRight: 40,
    fontSize: theme.typography.fontSize.medium,
    color: theme.colors.text,
    backgroundColor: theme.colors.white,
    fontFamily: theme.typography.fontFamily.regular,
  },
  checkboxContainer: {
    marginRight: theme.spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  checkMark: {
    position: 'absolute',
    right: theme.spacing.sm,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  checkedInput: {
    borderColor: theme.colors.success,
    borderWidth: 2,
  },
  checkedButton: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  agreementTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  optionalAgreement: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.borderLight,
  },
  requiredAgreement: {
    backgroundColor: theme.colors.white,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
  },
  agreementTextContainer: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  agreementTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
    marginRight: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  linkIcon: {
    marginLeft: theme.spacing.xs,
  },
  optionalText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.medium,
    marginTop: 2,
  },
  requiredText: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.small,
    fontFamily: theme.typography.fontFamily.bold,
    marginTop: 2,
  },
  checkedRow: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.primary,
    borderWidth: 1.5,
  },
  checkedText: {
    color: theme.colors.success,
  },
  customCheckbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customCheckboxChecked: {
    backgroundColor: theme.colors.primary,
  },
  successButton: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  whiteButtonText: {
    color: theme.colors.white,
  },
});

// why-did-you-render 추적 활성화
Step1.whyDidYouRender = true;
NicknameInput.whyDidYouRender = true;

export default Step1; 