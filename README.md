# 🍳 Make Food - AI 기반 레시피 추천 서비스

## 프로젝트 소개
Make Food는 사용자의 선호도, 보유 식재료, 영양 목표를 기반으로 개인화된 레시피를 추천하는 AI 기반 서비스입니다.

## 🛠 기술 스택

### Backend
- Java 17
- Spring Boot 3.x
- Spring Security
- JPA/Hibernate
- Python/FastAPI
- MySQL
- Redis

### AI/ML
- Google Gemini
- OpenAI GPT
- OCR (Optical Character Recognition)

### Infrastructure
- AWS (ECS, S3, RDS)
- Docker
- Terraform
- GitHub Actions

### 모니터링/로깅
- Spring Actuator
- Logback

## 🌟 주요 기능
1. **AI 레시피 추천**
   - 사용자 선호도 기반 추천
   - 보유 식재료 기반 추천
   - 영양 목표 기반 추천

2. **식재료 관리**
   - OCR을 통한 영수증 스캔
   - 재고 자동 관리
   - 유통기한 알림

3. **레시피 상호작용**
   - 레시피 저장/좋아요
   - 조리 과정 피드백
   - 단계별 댓글

4. **사용자 맞춤 설정**
   - 알레르기/선호 식재료 설정
   - 영양 목표 설정
   - 보유 조리도구 관리

## 🚀 시작하기

### 요구사항
- Java 17+
- Python 3.9+
- Docker & Docker Compose
- MySQL 8.0+
- Redis 6.0+

### 설치 및 실행

1. 저장소 클론
```bash
git clone https://github.com/[username]/makefood-portfolio.git
cd makefood-portfolio
```

2. 환경 변수 설정
```bash
cp .env.example .env
# .env 파일을 수정하여 필요한 설정값 입력
```

3. 데이터베이스 설정
```bash
mysql -u root -p < food_data_import.sql
```

4. 서비스 실행
```bash
docker-compose up -d
```

## 📝 API 문서
- Spring Boot API: `http://localhost:8080/swagger-ui.html`
- FastAPI: `http://localhost:8000/docs`

## 🔒 보안
- JWT 기반 인증
- OAuth2.0 (Google, Naver)
- Spring Security
- CORS 설정

## 🤝 기여하기
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📜 라이선스
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details 