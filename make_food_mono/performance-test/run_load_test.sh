#!/bin/bash

# MakeFood API 부하 테스트 실행 스크립트
# 500 Virtual Users

echo "🚀 MakeFood API 부하 테스트 시작 - 500 VU"
echo "========================================"

# JMeter 설치 확인
if ! command -v jmeter &> /dev/null; then
    echo "❌ JMeter가 설치되지 않았습니다."
    echo "다음 명령어로 설치하세요:"
    echo "brew install jmeter (macOS)"
    echo "또는 https://jmeter.apache.org/download_jmeter.cgi 에서 다운로드"
    exit 1
fi

# 테스트 결과 디렉토리 생성
mkdir -p results
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
RESULT_DIR="results/load_test_$TIMESTAMP"
mkdir -p $RESULT_DIR

echo "📊 테스트 설정:"
echo "- Virtual Users: 500"
echo "- Ramp-up Time: 300초 (5분)"
echo "- Test Duration: 1800초 (30분)"
echo "- Target URL: http://localhost:8080/api"
echo "- 결과 저장 위치: $RESULT_DIR"
echo ""

# 서버 상태 확인
echo "🔍 서버 상태 확인 중..."
if curl -f -s http://localhost:8080/api/health > /dev/null; then
    echo "✅ 서버가 정상적으로 응답합니다."
else
    echo "❌ 서버가 응답하지 않습니다. 서버를 먼저 시작해주세요."
    echo "Spring Boot 서버를 시작하세요: ./gradlew bootRun"
    exit 1
fi

echo ""
echo "⏰ 10초 후 테스트를 시작합니다..."
for i in {10..1}; do
    echo -n "$i "
    sleep 1
done
echo ""
echo ""

# JMeter 테스트 실행
echo "🔥 부하 테스트 실행 중..."
jmeter -n -t MakeFood_LoadTest_500VU.jmx \
    -l $RESULT_DIR/results.jtl \
    -e -o $RESULT_DIR/html_report \
    -Jjmeter.reportgenerator.overall_granularity=60000 \
    -Jjmeter.reportgenerator.graph.responseTimeDistribution.property.set_granularity=100

# 테스트 완료
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 부하 테스트가 완료되었습니다!"
    echo ""
    echo "📈 결과 확인:"
    echo "- HTML 리포트: $RESULT_DIR/html_report/index.html"
    echo "- Raw 데이터: $RESULT_DIR/results.jtl"
    echo ""
    echo "🌐 HTML 리포트 열기:"
    echo "open $RESULT_DIR/html_report/index.html"
    echo ""
    
    # 간단한 통계 출력
    if [ -f "$RESULT_DIR/results.jtl" ]; then
        echo "📊 간단 통계:"
        echo "총 요청 수: $(tail -n +2 $RESULT_DIR/results.jtl | wc -l)"
        echo "성공률: $(tail -n +2 $RESULT_DIR/results.jtl | awk -F',' '{if($8=="true") success++; total++} END {printf "%.2f%%", (success/total)*100}')"
        echo ""
    fi
    
    # HTML 리포트 자동 열기 (macOS)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        read -p "HTML 리포트를 열시겠습니까? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            open $RESULT_DIR/html_report/index.html
        fi
    fi
else
    echo "❌ 부하 테스트 실행 중 오류가 발생했습니다."
    exit 1
fi 