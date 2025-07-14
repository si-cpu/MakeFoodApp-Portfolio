# MakeFood Performance Testing Suite 추가

이 브랜치는 MakeFood 애플리케이션의 성능 테스트 도구를 추가합니다.

## 📁 추가된 내용

`make_food_mono/performance-test/` 폴더에 다음과 같은 성능 테스트 도구들이 추가되었습니다:

### 🔧 JMeter 테스트 설정
- `MakeFood_LoadTest_500VU.jmx` - 500 가상 사용자 부하 테스트
- `fastapi_load_test.jmx` - FastAPI 서비스 부하 테스트
- `docker_load_test.jmx` - Docker 환경 부하 테스트
- `simple_load_test.jmx` - 간단한 부하 테스트

### 🚀 실행 스크립트
- `run_load_test.sh` - 메인 부하 테스트 실행
- `fastapi_load_test.sh` - FastAPI 테스트 실행
- `docker_load_test.sh` - Docker 환경 테스트 실행
- `quick_test.sh` - 빠른 테스트 실행

### 📊 테스트 데이터 및 결과
- `health_500vu.dat` - 500 가상 사용자 헬스체크 데이터
- `health_test.dat` - 헬스체크 테스트 데이터
- `jmeter.log` - JMeter 실행 로그

### 📖 문서
- `README.md` - 상세한 사용 가이드

## 🎯 테스트 대상

- **Spring Boot API** 서버 성능 테스트
- **FastAPI** 웹소켓 및 OCR 서비스 성능 테스트
- **Docker** 컨테이너 환경 성능 검증
- **엔드포인트별** 부하 테스트

## 🔒 보안

민감한 정보 보호를 위해 `.gitignore`가 추가되어 다음 파일들이 제외됩니다:
- AWS 액세스 키
- 개인 키 파일
- 환경 설정 파일
- 기타 민감한 정보

## 📈 사용법

각 스크립트는 실행 권한이 부여되어 있으며, 자세한 사용법은 `make_food_mono/performance-test/README.md`를 참조하세요. 