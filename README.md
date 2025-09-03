# (사)중독포럼 업무 일정관리 시스템

업무의 시작과 끝, 진행상황을 체크하고 간트차트를 통해 일정 진행을 확인할 수 있는 웹 기반 일정관리 시스템입니다.

## 🚀 주요 기능

### 📊 대시보드
- 전체 업무 현황 요약
- 완료율, 진행률 등 통계 정보
- 오늘 마감 예정 업무 목록
- 주간 진행률 차트

### 📋 업무 관리
- 업무 등록, 수정, 삭제
- 상태별 업무 필터링 (대기중, 진행중, 완료, 지연, 취소)
- 우선순위 설정 (낮음, 보통, 높음, 긴급)
- 진행률 실시간 업데이트
- 담당자 및 부서별 분류

### 📅 간트 차트
- 주간 단위 일정 시각화
- 업무별 진행 상황 표시
- 상태별 색상 구분
- 주간 네비게이션 (이전/다음 주, 오늘 이동)

### 🔍 검색 및 필터
- 업무명, 설명, 담당자 검색
- 상태, 우선순위, 부서, 담당자별 필터링
- 날짜 범위 필터링

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Build Tool**: Vite
- **Routing**: React Router DOM

## 📦 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

### 3. 프로덕션 빌드
```bash
npm run build
```

### 4. 빌드 결과 미리보기
```bash
npm run preview
```

## 🏗️ 프로젝트 구조

```
src/
├── components/          # 재사용 가능한 컴포넌트
│   ├── Header.tsx     # 상단 헤더
│   └── Sidebar.tsx    # 좌측 사이드바
├── pages/              # 페이지 컴포넌트
│   ├── Dashboard.tsx  # 대시보드
│   ├── TaskList.tsx   # 업무 목록
│   ├── GanttChart.tsx # 간트 차트
│   └── TaskForm.tsx   # 업무 등록/수정 폼
├── contexts/           # React Context
│   └── TaskContext.tsx # 업무 상태 관리
├── types/              # TypeScript 타입 정의
│   └── index.ts       # 인터페이스 및 타입
├── App.tsx             # 메인 앱 컴포넌트
├── main.tsx            # 앱 진입점
└── index.css           # 전역 스타일
```

## 🎯 사용법

### 1. 업무 등록
- 사이드바의 "새 업무 등록" 메뉴 클릭
- 업무명, 설명, 담당자, 부서 등 필수 정보 입력
- 시작일과 종료일 설정
- 상태와 우선순위 선택
- 태그 추가 (선택사항)
- 메모 작성 (선택사항)

### 2. 업무 관리
- 업무 목록에서 진행률 슬라이더로 실시간 업데이트
- 상태 변경 및 우선순위 조정
- 업무 수정 및 삭제

### 3. 간트 차트 확인
- 주간 단위로 업무 일정 시각화
- 상태별 색상으로 진행 상황 파악
- 주간 네비게이션으로 다른 주차 확인

### 4. 필터링 및 검색
- 검색창에서 업무명, 설명, 담당자 검색
- 필터 패널에서 상태, 우선순위, 부서별 필터링
- 날짜 범위 설정으로 특정 기간 업무 확인

## 🎨 UI/UX 특징

- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **한국어 지원**: 완전한 한국어 인터페이스
- **직관적인 네비게이션**: 사이드바 기반 메뉴 구조
- **시각적 피드백**: 상태별 색상 및 아이콘 사용
- **접근성**: 키보드 네비게이션 및 스크린 리더 지원

## 🔧 커스터마이징

### 색상 테마 변경
`tailwind.config.js`에서 primary, secondary 색상 수정:

```javascript
colors: {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    // ... 추가 색상
  }
}
```

### 부서 및 담당자 추가
`TaskForm.tsx`와 `TaskList.tsx`에서 부서 및 담당자 옵션 수정

### 상태 및 우선순위 추가
`types/index.ts`에서 TaskStatus, TaskPriority 타입 확장

## 📱 브라우저 지원

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 문의

프로젝트 관련 문의사항이 있으시면 이슈를 등록해 주세요.

---

**© 2025 (사)중독포럼. All rights reserved.**
