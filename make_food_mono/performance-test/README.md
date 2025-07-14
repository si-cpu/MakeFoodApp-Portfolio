# MakeFood API 부하 테스트 - 500 VU

## 🚀 테스트 개요

- **Virtual Users**: 500명
- **Ramp-up Time**: 300초 (5분)
- **Test Duration**: 600초 (10분)
- **테스트 엔드포인트**:
  - `/api/health` - 헬스체크
  - `/api/recipes` - 레시피 조회
  - `/api/ingredients` - 재료 조회

## 📋 준비사항

### 1. JMeter 설치
```bash
# macOS (Homebrew)
brew install jmeter

# 수동 설치
# https://jmeter.apache.org/download_jmeter.cgi 에서 다운로드
```

### 2. 서버 실행

#### 로컬 서버 실행
```bash
# Spring Boot 서버 시작
cd make_food_mono
./gradlew bootRun

# 또는
java -jar build/libs/make-food-mono-0.0.1-SNAPSHOT.jar
```

#### Docker 환경 실행 (권장)
```bash
# Docker Compose로 전체 스택 실행
docker-compose up -d spring-app redis

# 헬스체크 확인
curl http://localhost:8080/api/health
```

## 🔥 테스트 실행

### Docker 환경 테스트 (권장)

#### 방법 1: 간단한 Docker 테스트
```bash
cd make_food_mono/performance-test
./docker_quick_test.sh
```

#### 방법 2: 본격 500 VU Docker 부하 테스트
```bash
cd make_food_mono/performance-test
./docker_load_test.sh
```

### 로컬 서버 테스트

#### 방법 1: 스크립트 실행
```bash
cd make_food_mono/performance-test
./run_load_test.sh
```

#### 방법 2: 직접 JMeter 실행
```bash
cd make_food_mono/performance-test

# GUI 모드 (개발/디버깅용)
jmeter -t simple_load_test.jmx

# Non-GUI 모드 (실제 테스트용)
jmeter -n -t simple_load_test.jmx \
    -l results/results.jtl \
    -e -o results/html_report
```

#### 방법 3: 간단한 커맨드라인 테스트
```bash
# 500 VU로 10분간 테스트
jmeter -n \
    -Jthreads=500 \
    -Jrampup=300 \
    -Jduration=600 \
    -Jtarget=localhost:8080 \
    -t simple_load_test.jmx \
    -l results/$(date +%Y%m%d_%H%M%S).jtl
```

## 🐳 Docker 환경 설정

### Docker Compose 서비스
- **spring-app**: Spring Boot API 서버 (포트 8080)
- **redis**: Redis 캐시 (포트 6379)
- **fastapi-app**: FastAPI 서비스 (포트 8000)

### Docker 명령어
```bash
# 컨테이너 시작
docker-compose up -d spring-app redis

# 컨테이너 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs spring-app

# 리소스 사용량 확인
docker stats spring-app redis

# 컨테이너 정리
docker-compose down
```

## 📊 결과 분석

### 주요 메트릭
- **TPS (Transactions Per Second)**: 초당 처리 트랜잭션 수
- **Response Time**: 평균, 90%, 95%, 99% 응답시간
- **Error Rate**: 에러율 (5% 미만 권장)
- **Throughput**: 처리량

### 성능 기준
- ✅ **우수**: TPS > 1000, 평균 응답시간 < 200ms, 에러율 < 1%
- ⚠️ **보통**: TPS > 500, 평균 응답시간 < 500ms, 에러율 < 3%
- ❌ **개선필요**: TPS < 500, 평균 응답시간 > 500ms, 에러율 > 5%

### Docker vs 로컬 성능 비교
Docker 환경에서는 일반적으로:
- 응답시간이 5-10% 증가
- TPS가 10-15% 감소
- 메모리 사용량이 약간 증가

## 🔧 테스트 커스터마이징

### 사용자 수 변경
```bash
# Docker 테스트: 1000 VU로 테스트
sed -i 's/500/1000/g' docker_simple_test.jmx

# 로컬 테스트: 1000 VU로 테스트
sed -i 's/500/1000/g' simple_load_test.jmx
```

### 테스트 시간 변경
```bash
# 30분(1800초)으로 테스트
sed -i 's/600/1800/g' docker_simple_test.jmx
```

### 타겟 서버 변경
```bash
# 운영 서버로 테스트
sed -i 's/localhost:8080/makefood-api.store/g' docker_simple_test.jmx
```

## 📈 모니터링

### 서버 리소스 모니터링
```bash
# CPU, Memory 사용량 모니터링 (Docker)
docker stats spring-app redis

# JVM 메트릭 확인
curl http://localhost:8080/actuator/metrics

# Prometheus 메트릭 (모니터링 스택 실행 시)
curl http://localhost:9090/metrics
```

### 데이터베이스 모니터링
```bash
# MySQL 프로세스 확인
SHOW PROCESSLIST;

# 느린 쿼리 확인
SHOW VARIABLES LIKE 'slow_query_log';
```

## 🚨 주의사항

1. **Docker 환경 테스트 권장**: 로컬 환경과 분리되어 더 안정적
2. **네트워크 대역폭 확인**: 500 VU는 상당한 네트워크 트래픽 생성
3. **Docker 리소스 확인**: Docker Desktop의 CPU, Memory 할당량 확인
4. **테스트 환경 격리**: 다른 서비스와 분리된 환경에서 테스트

## 🛠️ 트러블슈팅

### Docker 관련 오류
```
Docker daemon not running: Docker Desktop 실행 확인
-> Docker Desktop 시작

Container failed to start: 포트 충돌
-> lsof -i :8080 으로 포트 사용 확인 후 프로세스 종료

Out of memory: Docker 메모리 부족
-> Docker Desktop Settings에서 메모리 할당량 증가
```

### 연결 오류
```
Connection refused: 컨테이너가 실행되지 않음
-> docker-compose ps로 상태 확인
-> docker-compose logs spring-app로 로그 확인
```

### 메모리 부족
```
OutOfMemoryError: JMeter JVM 메모리 부족
-> JMeter 힙 메모리 증가: export HEAP="-Xms1g -Xmx4g"
```

### 너무 많은 에러
```
Error Rate > 10%: 서버 과부하
-> Virtual User 수 감소 또는 Ramp-up 시간 증가
-> Docker 컨테이너 리소스 제한 확인
```

## 🎯 테스트 파일 목록

- `docker_simple_test.jmx`: Docker 환경용 JMeter 테스트 계획
- `docker_load_test.sh`: Docker 환경 500 VU 부하 테스트 스크립트
- `docker_quick_test.sh`: Docker 환경 간단 테스트 스크립트
- `simple_load_test.jmx`: 로컬 환경용 JMeter 테스트 계획
- `run_load_test.sh`: 로컬 환경 부하 테스트 스크립트
- `quick_test.sh`: 로컬 환경 간단 테스트 스크립트 