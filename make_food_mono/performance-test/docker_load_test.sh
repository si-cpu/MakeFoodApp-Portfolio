#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🐳 MakeFood API Docker 환경 부하 테스트 시작 - 500 VU${NC}"
echo "======================================================"
echo -e "${YELLOW}📊 테스트 설정:${NC}"
echo "- Virtual Users: 500"
echo "- Ramp-up Time: 300초 (5분)"
echo "- Test Duration: 600초 (10분)"
echo "- Target: Docker 컨테이너 (localhost:8080)"
echo ""

# 프로젝트 루트로 이동
cd ../..

# 기존 컨테이너 정리
echo -e "${YELLOW}🧹 기존 컨테이너 정리 중...${NC}"
docker-compose -f docker-compose.local.yml down --volumes 2>/dev/null || true

# Docker 컨테이너 시작
echo -e "${YELLOW}🚀 Docker 컨테이너 빌드 및 시작 중...${NC}"
if ! docker-compose -f docker-compose.local.yml up --build -d; then
    echo -e "${RED}❌ Docker 컨테이너 시작 실패${NC}"
    exit 1
fi

# 컨테이너 시작 대기
echo -e "${YELLOW}⏳ 컨테이너 시작 대기 중 (최대 180초)...${NC}"
for i in {1..180}; do
    if curl -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 컨테이너 준비 완료! (${i}초)${NC}"
        break
    fi
    if [ $i -eq 180 ]; then
        echo -e "${RED}❌ 컨테이너 시작 실패 - 180초 타임아웃${NC}"
        echo "컨테이너 상태 확인:"
        docker-compose -f docker-compose.local.yml ps
        echo ""
        echo "컨테이너 로그:"
        docker-compose -f docker-compose.local.yml logs spring-app
        exit 1
    fi
    printf "."
    sleep 1
done

echo ""

# 성능 테스트 실행
echo -e "${YELLOW}🔥 JMeter 성능 테스트 실행 중...${NC}"
cd make_food_mono/performance-test

# JMeter 설치 확인
if ! command -v jmeter &> /dev/null; then
    echo -e "${RED}❌ JMeter가 설치되지 않았습니다.${NC}"
    echo "설치 방법:"
    echo "1. Homebrew: brew install jmeter"
    echo "2. 또는 Apache JMeter 공식 사이트에서 다운로드"
    exit 1
fi

# 테스트 결과 디렉토리 생성
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULT_DIR="results_${TIMESTAMP}"
mkdir -p "$RESULT_DIR"

# JMeter 테스트 실행
jmeter -n -t docker_simple_test.jmx \
    -Jthreads=500 \
    -Jrampup=300 \
    -Jduration=600 \
    -Jhost=localhost \
    -Jport=8080 \
    -l "$RESULT_DIR/results.jtl" \
    -e -o "$RESULT_DIR/html_report"

# 테스트 결과 확인
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 성능 테스트 완료!${NC}"
    echo ""
    echo -e "${YELLOW}📊 결과 파일:${NC}"
    echo "- JTL 파일: $RESULT_DIR/results.jtl"
    echo "- HTML 리포트: $RESULT_DIR/html_report/index.html"
    echo ""
    echo -e "${BLUE}📈 HTML 리포트 열기:${NC}"
    echo "open $RESULT_DIR/html_report/index.html"
else
    echo -e "${RED}❌ 성능 테스트 실패${NC}"
fi

# 컨테이너 정리
echo -e "${YELLOW}🧹 테스트 완료 - 컨테이너 정리 중...${NC}"
cd ../..
docker-compose -f docker-compose.local.yml down --volumes

echo -e "${GREEN}🎉 테스트 완료!${NC}" 