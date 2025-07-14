#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 MakeFood FastAPI 간단 부하 테스트${NC}"
echo "========================================="
echo -e "${YELLOW}📊 테스트 설정:${NC}"
echo "- 도구: ApacheBench (ab) + curl"
echo "- 대상: FastAPI (localhost:8000)"
echo ""

# FastAPI 서비스 확인
echo -e "${YELLOW}🔍 FastAPI 서비스 상태 확인 중...${NC}"
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${RED}❌ FastAPI 서비스가 실행되지 않고 있습니다.${NC}"
    echo "Docker로 실행: cd ../.. && docker-compose -f docker-compose.local.yml up -d fastapi-app"
    exit 1
fi

echo -e "${GREEN}✅ FastAPI 서비스가 정상적으로 실행 중입니다.${NC}"
echo ""

# ApacheBench 테스트
if command -v ab &> /dev/null; then
    echo -e "${BLUE}🔥 ApacheBench 부하 테스트 실행 중...${NC}"
    echo ""
    
    echo -e "${YELLOW}1️⃣ 헬스체크 엔드포인트 - 1000 요청, 100 동시 연결${NC}"
    ab -n 1000 -c 100 -g health_test.dat http://localhost:8000/health
    echo ""
    
    echo -e "${YELLOW}2️⃣ 헬스체크 엔드포인트 - 5000 요청, 500 동시 연결 (500 VU 시뮬레이션)${NC}"
    ab -n 5000 -c 500 -g health_500vu.dat http://localhost:8000/health
    echo ""
    
    # 결과 요약
    echo -e "${GREEN}✅ ApacheBench 테스트 완료!${NC}"
    echo -e "${BLUE}📊 결과 파일:${NC}"
    echo "- health_test.dat (1000 req, 100 concurrent)"
    echo "- health_500vu.dat (5000 req, 500 concurrent)"
    
else
    echo -e "${YELLOW}⚠️ ApacheBench가 설치되지 않았습니다. curl로 간단 테스트를 진행합니다.${NC}"
    echo ""
    
    echo -e "${BLUE}🔄 curl 기반 연속 요청 테스트${NC}"
    echo ""
    
    # 단일 요청 테스트
    echo -e "${YELLOW}1️⃣ 단일 요청 응답시간 테스트 (50회)${NC}"
    TOTAL_TIME=0
    SUCCESS_COUNT=0
    
    for i in {1..50}; do
        START_TIME=$(gdate +%s%3N 2>/dev/null || date +%s000)
        RESPONSE=$(curl -s -w "%{http_code}" http://localhost:8000/health -o /dev/null)
        END_TIME=$(gdate +%s%3N 2>/dev/null || date +%s000)
        DURATION=$((END_TIME - START_TIME))
        
        if [ "$RESPONSE" = "200" ]; then
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            TOTAL_TIME=$((TOTAL_TIME + DURATION))
            echo "✅ Request $i: ${DURATION}ms"
        else
            echo "❌ Request $i: HTTP $RESPONSE"
        fi
    done
    
    if [ $SUCCESS_COUNT -gt 0 ]; then
        AVG_TIME=$((TOTAL_TIME / SUCCESS_COUNT))
        SUCCESS_RATE=$(echo "scale=2; $SUCCESS_COUNT * 100 / 50" | bc)
        echo ""
        echo -e "${GREEN}📈 테스트 결과:${NC}"
        echo "성공률: ${SUCCESS_RATE}%"
        echo "평균 응답시간: ${AVG_TIME}ms"
        echo "성공한 요청: $SUCCESS_COUNT/50"
    fi
    
    echo ""
    
    # 병렬 요청 테스트
    echo -e "${YELLOW}2️⃣ 병렬 요청 테스트 (100개 동시)${NC}"
    echo "100개의 curl 요청을 동시에 실행합니다..."
    
    # 백그라운드로 100개 요청 실행
    for i in {1..100}; do
        curl -s http://localhost:8000/health > /tmp/curl_result_$i.txt &
    done
    
    # 모든 백그라운드 작업 완료 대기
    wait
    
    # 결과 확인
    SUCCESS_PARALLEL=0
    for i in {1..100}; do
        if [ -f /tmp/curl_result_$i.txt ]; then
            if grep -q "healthy" /tmp/curl_result_$i.txt; then
                SUCCESS_PARALLEL=$((SUCCESS_PARALLEL + 1))
            fi
            rm -f /tmp/curl_result_$i.txt
        fi
    done
    
    PARALLEL_SUCCESS_RATE=$(echo "scale=2; $SUCCESS_PARALLEL * 100 / 100" | bc)
    echo ""
    echo -e "${GREEN}📈 병렬 테스트 결과:${NC}"
    echo "성공률: ${PARALLEL_SUCCESS_RATE}%"
    echo "성공한 요청: $SUCCESS_PARALLEL/100"
fi

echo ""
echo -e "${BLUE}🐳 Docker 컨테이너 리소스 사용량:${NC}"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" make-food-fastapi-local makefood-redis-local 2>/dev/null || echo "Docker 컨테이너를 찾을 수 없습니다."

echo ""
echo -e "${GREEN}🎉 테스트 완료!${NC}"
echo ""
echo -e "${YELLOW}💡 더 강력한 테스트를 원한다면:${NC}"
echo "1. JMeter 설치: brew install jmeter"
echo "2. Apache Bench 설치: brew install apache-bench (이미 있을 수도 있음)"
echo "3. Artillery 설치: npm install -g artillery" 