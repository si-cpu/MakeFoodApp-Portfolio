#!/bin/bash

echo "🐳 MakeFood Docker 환경 간단 부하 테스트"
echo "========================================"

# Docker Compose 설치 확인
if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
    echo "❌ Docker가 설치되지 않았습니다."
    exit 1
fi

# 프로젝트 루트로 이동
cd "$(dirname "$0")/../.."

echo "🚀 Docker 컨테이너 시작 중..."
docker-compose -f docker-compose.local.yml up -d spring-app redis

# 컨테이너 시작 대기
echo "⏳ 컨테이너 시작 대기 중 (최대 60초)..."
for i in {1..60}; do
    if curl -f -s http://localhost:8080/api/health > /dev/null 2>&1; then
        echo ""
        echo "✅ Spring Boot 컨테이너가 정상적으로 시작되었습니다."
        break
    fi
    
    if [ $i -eq 60 ]; then
        echo ""
        echo "❌ 컨테이너 시작 실패 - 60초 타임아웃"
        exit 1
    fi
    
    echo -n "."
    sleep 1
done

echo ""
echo "📊 간단한 성능 테스트 시작..."

# ApacheBench 테스트 (JMeter 대신)
if command -v ab &> /dev/null; then
    echo ""
    echo "1️⃣ 헬스체크 엔드포인트 테스트 (100 req, 10 concurrent)"
    ab -n 100 -c 10 http://localhost:8080/api/health
    
    echo ""
    echo "2️⃣ 레시피 조회 엔드포인트 테스트 (50 req, 5 concurrent)"
    ab -n 50 -c 5 "http://localhost:8080/api/recipes?page=0&size=20"
    
    echo ""
    echo "3️⃣ 재료 조회 엔드포인트 테스트 (30 req, 3 concurrent)"
    ab -n 30 -c 3 http://localhost:8080/api/ingredients
    
elif command -v curl &> /dev/null; then
    echo ""
    echo "ApacheBench가 없어 curl로 간단한 테스트를 진행합니다..."
    
    # curl로 간단한 반복 테스트
    echo "🔄 헬스체크 연속 요청 테스트 (20회)..."
    for i in {1..20}; do
        start_time=$(gdate +%s%3N 2>/dev/null || date +%s000)
        response=$(curl -s -w "%{http_code}" http://localhost:8080/api/health -o /dev/null)
        end_time=$(gdate +%s%3N 2>/dev/null || date +%s000)
        duration=$((end_time - start_time))
        echo "Request $i: HTTP $response - ${duration}ms"
    done
    
    echo ""
    echo "🔄 레시피 조회 연속 요청 테스트 (10회)..."
    for i in {1..10}; do
        start_time=$(gdate +%s%3N 2>/dev/null || date +%s000)
        response=$(curl -s -w "%{http_code}" "http://localhost:8080/api/recipes?page=0&size=20" -o /dev/null)
        end_time=$(gdate +%s%3N 2>/dev/null || date +%s000)
        duration=$((end_time - start_time))
        echo "Request $i: HTTP $response - ${duration}ms"
    done
else
    echo "❌ curl이 설치되지 않았습니다."
fi

echo ""
echo "🔍 컨테이너 리소스 사용량:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" spring-app redis

echo ""
echo "✅ 간단한 테스트가 완료되었습니다."
echo ""
echo "🔥 본격적인 500 VU 부하 테스트를 원한다면:"
echo "./docker_load_test.sh"
echo ""

read -p "테스트 완료 후 Docker 컨테이너를 정리하시겠습니까? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🧹 Docker 컨테이너 정리 중..."
    docker-compose -f docker-compose.local.yml down
    echo "✅ 컨테이너 정리 완료"
else
    echo "💡 나중에 컨테이너를 정리하려면:"
    echo "docker-compose -f docker-compose.local.yml down"
fi 