#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 MakeFood FastAPI 500 VU 부하 테스트 시작${NC}"
echo "====================================================="
echo -e "${YELLOW}📊 테스트 설정:${NC}"
echo "- Virtual Users: 500"
echo "- Ramp-up Time: 300초 (5분)"
echo "- Test Duration: 600초 (10분)"
echo "- Target: FastAPI (localhost:8000)"
echo ""

# JMeter 설치 확인
if ! command -v jmeter &> /dev/null; then
    echo -e "${RED}❌ JMeter가 설치되지 않았습니다.${NC}"
    echo "설치 방법:"
    echo "1. Homebrew: brew install jmeter"
    echo "2. 또는 Apache JMeter 공식 사이트에서 다운로드"
    exit 1
fi

# FastAPI 서비스 확인
echo -e "${YELLOW}🔍 FastAPI 서비스 상태 확인 중...${NC}"
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${RED}❌ FastAPI 서비스가 실행되지 않고 있습니다.${NC}"
    echo "다음 중 하나를 실행하세요:"
    echo "1. Docker로 실행: cd ../.. && docker-compose -f docker-compose.local.yml up -d fastapi-app"
    echo "2. 직접 실행: cd ../../fastapi_service && uvicorn app.main:app --host 0.0.0.0 --port 8000"
    exit 1
fi

echo -e "${GREEN}✅ FastAPI 서비스가 정상적으로 실행 중입니다.${NC}"
echo ""

# 테스트 결과 디렉토리 생성
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULT_DIR="results_fastapi_${TIMESTAMP}"
mkdir -p "$RESULT_DIR"

echo -e "${YELLOW}🔥 JMeter 성능 테스트 실행 중...${NC}"
echo "결과 저장 위치: $RESULT_DIR"

# JMeter 테스트 실행
jmeter -n -t fastapi_load_test.jmx \
    -Jthreads=500 \
    -Jrampup=300 \
    -Jduration=600 \
    -Jhost=localhost \
    -Jport=8000 \
    -l "$RESULT_DIR/results.jtl" \
    -e -o "$RESULT_DIR/html_report"

# 테스트 결과 확인
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ FastAPI 성능 테스트 완료!${NC}"
    echo ""
    echo -e "${YELLOW}📊 결과 파일:${NC}"
    echo "- JTL 파일: $RESULT_DIR/results.jtl"
    echo "- HTML 리포트: $RESULT_DIR/html_report/index.html"
    echo ""
    
    # 간단한 통계 출력
    if [ -f "$RESULT_DIR/results.jtl" ]; then
        echo -e "${BLUE}📈 간단 통계:${NC}"
        TOTAL_REQUESTS=$(tail -n +2 "$RESULT_DIR/results.jtl" | wc -l | tr -d ' ')
        SUCCESS_RATE=$(tail -n +2 "$RESULT_DIR/results.jtl" | awk -F',' '{if($8=="true") success++; total++} END {printf "%.2f%%", (success/total)*100}')
        AVG_RESPONSE_TIME=$(tail -n +2 "$RESULT_DIR/results.jtl" | awk -F',' '{sum+=$2; count++} END {printf "%.0f", sum/count}')
        
        echo "총 요청 수: $TOTAL_REQUESTS"
        echo "성공률: $SUCCESS_RATE"
        echo "평균 응답시간: ${AVG_RESPONSE_TIME}ms"
        echo ""
    fi
    
    echo -e "${BLUE}📈 HTML 리포트 열기:${NC}"
    echo "open $RESULT_DIR/html_report/index.html"
    echo ""
    
    # HTML 리포트 자동 열기 (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        read -p "HTML 리포트를 열시겠습니까? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open "$RESULT_DIR/html_report/index.html"
        fi
    fi
else
    echo -e "${RED}❌ 성능 테스트 실패${NC}"
    exit 1
fi

echo -e "${GREEN}🎉 테스트 완료!${NC}" 