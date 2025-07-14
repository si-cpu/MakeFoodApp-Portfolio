#!/bin/bash

echo "🚀 MakeFood API 간단 부하 테스트"
echo "================================"

# 서버 상태 확인
echo "🔍 서버 상태 확인 중..."
if curl -f -s http://localhost:8080/api/health > /dev/null; then
    echo "✅ 서버가 정상적으로 응답합니다."
else
    echo "❌ 서버가 응답하지 않습니다."
    echo "서버를 먼저 시작해주세요: cd make_food_mono && ./gradlew bootRun"
    exit 1
fi

echo ""
echo "📊 간단한 성능 테스트 시작..."

# 간단한 ApacheBench 테스트 (JMeter 대신)
if command -v ab &> /dev/null; then
    echo "1️⃣ 헬스체크 엔드포인트 테스트 (100 req, 10 concurrent)"
    ab -n 100 -c 10 http://localhost:8080/api/health
    
    echo ""
    echo "2️⃣ 레시피 조회 엔드포인트 테스트 (50 req, 5 concurrent)"
    ab -n 50 -c 5 http://localhost:8080/api/recipes?page=0&size=20
    
else
    echo "ApacheBench(ab)가 설치되지 않았습니다."
    echo "간단한 curl 테스트를 진행합니다..."
    
    # curl로 간단한 반복 테스트
    echo "🔄 연속 요청 테스트 (10회)..."
    for i in {1..10}; do
        start_time=$(gdate +%s%3N 2>/dev/null || date +%s000)
        response=$(curl -s -w "%{http_code}" http://localhost:8080/api/health -o /dev/null)
        end_time=$(gdate +%s%3N 2>/dev/null || date +%s000)
        duration=$((end_time - start_time))
        echo "Request $i: HTTP $response - ${duration}ms"
    done
fi

echo ""
echo "✅ 간단한 테스트가 완료되었습니다."
echo ""
echo "🔥 본격적인 500 VU 부하 테스트를 원한다면:"
echo "cd performance-test && jmeter -n -t simple_load_test.jmx -l results.jtl" 