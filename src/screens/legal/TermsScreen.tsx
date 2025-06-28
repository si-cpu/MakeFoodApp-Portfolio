import React from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { theme } from '../../theme/theme';

/**
 * 이용약관 화면
 * 실제 약관 전문을 표시하기 위한 기본 템플릿입니다.
 */
const TermsScreen: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>이용약관</Text>

      {/* 약관 본문 */}
      <Text style={styles.sectionTitle}>제1조 (목적)</Text>
      <Text style={styles.paragraph}>
        본 약관은 MakeFoodApp(이하 "회사")가 모바일 애플리케이션 및 관련 서비스를 통하여 제공하는 모든
        서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리·의무 및 책임사항, 기타 필요한 사항을
        규정함을 목적으로 합니다.
      </Text>

      <Text style={styles.sectionTitle}>제2조 (정의)</Text>
      <Text style={styles.paragraph}>
        1. "이용자"라 함은 본 약관에 따라 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.{"\n"}
        2. "회원"이라 함은 회사와 서비스 이용계약을 체결하고 이용자 ID를 부여받은 자를 말합니다.{"\n"}
        3. "콘텐츠"라 함은 서비스에서 이용 가능한 요리 레시피, 이미지, 텍스트, 영상 등 일체의 정보 또는 자료를
        의미합니다.
      </Text>

      <Text style={styles.sectionTitle}>제3조 (약관의 명시, 효력 및 변경)</Text>
      <Text style={styles.paragraph}>
        ① 회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면 또는 연결화면에 게시합니다.{"\n"}
        ② 회사는 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있으며, 개정 시 시행일 및 개정사유를
        명시하여 현행약관과 함께 서비스 화면에 그 적용일 7일 전부터 공지합니다.
      </Text>

      <Text style={styles.sectionTitle}>제4조 (이용계약 체결)</Text>
      <Text style={styles.paragraph}>
        ① 이용계약은 이용자가 약관 동의 후 회원가입을 신청하고 회사가 이를 승낙함으로써 체결됩니다.{"\n"}
        ② 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 거절하거나 사후에 이용계약을 해지할 수 있습니다.{"\n"}
        • 타인의 명의를 도용한 경우{"\n"}
        • 허위 정보를 기재한 경우 등
      </Text>

      <Text style={styles.sectionTitle}>제5조 (서비스의 제공 및 변경)</Text>
      <Text style={styles.paragraph}>
        ① 회사는 다음 서비스를 제공합니다.{"\n"}
        • 맞춤형 레시피 추천 및 정보 제공{"\n"}
        • 장바구니·구매 기록 관리 및 통계 제공{"\n"}
        • 커뮤니티, 댓글, 북마크 등 부가 서비스
      </Text>

      <Text style={styles.sectionTitle}>제6조 (서비스 이용시간)</Text>
      <Text style={styles.paragraph}>
        서비스는 연중무휴 1일 24시간 제공함을 원칙으로 하되, 회사의 업무상·기술상 이유로 서비스가 일시 중지될
        수 있으며, 이 경우 사전 공지합니다.
      </Text>

      <Text style={styles.sectionTitle}>제7조 (이용자의 의무)</Text>
      <Text style={styles.paragraph}>
        1. 이용자는 관련 법령, 약관, 이용안내 및 서비스와 관련하여 공지한 주의사항을 준수하여야 하며, 다음 행위를
        하여서는 안 됩니다.{"\n"}
        • 타인의 정보 도용, 허위 사실 등록, 서비스 방해 행위 등{"\n"}
        • 회사 및 제3자의 지적재산권 침해, 명예 훼손 행위 등
      </Text>

      <Text style={styles.sectionTitle}>제8조 (콘텐츠의 저작권)</Text>
      <Text style={styles.paragraph}>
        서비스 내 콘텐츠에 대한 저작권 및 지적재산권은 회사 또는 원저작권자에 귀속합니다. 이용자는 서비스를
        통해 얻은 정보를 회사의 사전 서면 동의 없이 복제·송신·출판·배포·방송 기타 방식으로 이용하거나 제3자에게
        제공할 수 없습니다.
      </Text>

      <Text style={styles.sectionTitle}>제9조 (계약 해지 및 이용 제한)</Text>
      <Text style={styles.paragraph}>
        ① 이용자는 언제든지 앱 내 "설정 &gt; 회원 탈퇴"를 통해 이용계약을 해지할 수 있습니다.{"\n"}
        ② 회사는 이용자가 약관을 위반하거나 서비스 운영을 방해하는 경우 사전 통지 없이 서비스 이용을 제한하거나
        계약을 해지할 수 있습니다.
      </Text>

      <Text style={styles.sectionTitle}>제10조 (면책조항)</Text>
      <Text style={styles.paragraph}>
        회사는 천재지변, 불가항력, 이용자의 귀책사유 등으로 인하여 발생한 손해에 대하여 책임을 지지 않습니다.
      </Text>

      <Text style={styles.sectionTitle}>제11조 (분쟁 해결 및 관할법원)</Text>
      <Text style={styles.paragraph}>
        회사와 이용자 간 분쟁이 발생한 경우 상호 협의하여 해결하며, 협의가 이루어지지 않을 경우 민사소송법상
        관할법원에 소를 제기할 수 있습니다.
      </Text>

      <Text style={styles.sectionTitle}>부칙</Text>
      <Text style={styles.paragraph}>
        본 약관은 2024-06-19부터 시행합니다.
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

export default TermsScreen; 