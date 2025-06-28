import React from 'react';
import { Text, StyleSheet, ScrollView } from 'react-native';
import { theme } from '../../theme/theme';

/**
 * 개인정보처리방침 화면
 * 추후 API 또는 원본 문서를 받아서 표시하도록 변경할 수 있습니다.
 */
const PrivacyPolicyScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>개인정보처리방침</Text>

      {/* 본문 */}
      <Text style={styles.sectionTitle}>1. 총칙</Text>
      <Text style={styles.paragraph}>
        MakeFoodApp(이하 "회사")는 개인정보 보호법, 정보통신망 이용촉진 및 정보보호 등에 관한 법률 등
        관련 법령을 준수하며, 이용자의 개인정보를 안전하게 보호하기 위해 최선을 다하고 있습니다.
        본 개인정보처리방침은 회사가 서비스를 제공함에 있어 어떤 정보를 수집·이용·보관·파기하는지와
        이용자의 권리를 설명합니다.
      </Text>

      <Text style={styles.sectionTitle}>2. 수집하는 개인정보 항목 및 수집 방법</Text>
      <Text style={styles.paragraph}>
        ① 회원 가입 및 서비스 이용 과정에서 다음 정보가 수집될 수 있습니다.{"\n"}
        • 필수: 닉네임, 이메일, 패스워드, 성별, 나이, 가구원 수, 기기 식별자, 접속 로그, 쿠키, 서비스 이용 기록{"\n"}
        • 선택: 선호/비선호/알레르기 재료, 선호 영양정보, 마케팅 수신 여부, 레시피 저장·조회·구매 기록 등
      </Text>
      <Text style={styles.paragraph}>
        ② 수집 방법: 회원 가입, 서비스 이용 과정에서 이용자가 입력하거나 자동으로 생성·수집되는 정보,
        고객센터 상담, 이벤트 응모 등을 통해 수집됩니다.
      </Text>

      <Text style={styles.sectionTitle}>3. 개인정보 이용 목적</Text>
      <Text style={styles.paragraph}>
        • 회원 식별 및 인증, 서비스 제공, 맞춤형 레시피 추천, 장바구니·구매 관리, 고객 문의 처리, 공지사항 전달{"\n"}
        • 통계 분석 및 서비스 개선, 신규 서비스 개발{"\n"}
        • 이벤트·프로모션 등 마케팅(선택 동의 시)
      </Text>

      <Text style={styles.sectionTitle}>4. 보유 및 이용 기간</Text>
      <Text style={styles.paragraph}>
        회사는 원칙적으로 개인정보 수집·이용 목적이 달성되면 지체 없이 파기합니다. 단, 관련 법령에 따라
        보존할 필요가 있는 경우 해당 기간 동안 분리 보관 후 파기합니다(예: 전자상거래법, 통신비밀보호법).
      </Text>

      <Text style={styles.sectionTitle}>5. 개인정보 파기 절차 및 방법</Text>
      <Text style={styles.paragraph}>
        수집·이용 목적 달성 후 별도 DB로 이동하거나 파기하며, 전자적 파일 형태는 복구·재생이 불가능한
        방법으로 삭제, 종이 문서는 분쇄·소각합니다.
      </Text>

      <Text style={styles.sectionTitle}>6. 개인정보 제3자 제공 및 처리위탁</Text>
      <Text style={styles.paragraph}>
        회사는 이용자의 동의가 있거나 법령에 근거한 경우를 제외하고 개인정보를 외부에 제공하지 않습니다.
        서비스 운영을 위해 일부 업무를 외부 전문 업체에 위탁할 수 있으며, 위탁 시 관련 법령에 따라
        계약을 체결하고 관리·감독합니다.
      </Text>

      <Text style={styles.sectionTitle}>7. 이용자의 권리</Text>
      <Text style={styles.paragraph}>
        이용자는 언제든지 자신의 개인정보를 조회·수정·삭제·처리정지를 요청할 수 있습니다. 앱 내 [설정] 또는
        고객센터를 통해 신청할 수 있으며, 회사는 지체 없이 조치합니다.
      </Text>

      <Text style={styles.sectionTitle}>8. 개인정보 보호책임자 및 담당자</Text>
      <Text style={styles.paragraph}>
        • 책임자: 홍길동 (privacy@makefoodapp.com) {"\n"}
        • 담당자: 김영희 (support@makefoodapp.com)
      </Text>

      <Text style={styles.sectionTitle}>9. 고지의 의무</Text>
      <Text style={styles.paragraph}>
        본 방침은 2024-06-19부터 적용됩니다. 내용 추가·삭제·수정이 있을 경우 변경 사항을 시행 7일 전 앱
        공지사항을 통해 고지합니다.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    padding: theme.spacing.large,
  },
  title: {
    fontSize: theme.typography.fontSize.xlarge,
    fontFamily: theme.typography.fontFamily.extraBold,
    color: theme.colors.text,
    marginBottom: theme.spacing.large,
  },
  paragraph: {
    fontSize: theme.typography.fontSize.medium,
    fontFamily: theme.typography.fontFamily.regular,
    color: theme.colors.text,
    marginBottom: theme.spacing.medium,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.large,
    fontFamily: theme.typography.fontFamily.bold,
    color: theme.colors.text,
    marginTop: theme.spacing.large,
    marginBottom: theme.spacing.small,
  },
});

export default PrivacyPolicyScreen; 