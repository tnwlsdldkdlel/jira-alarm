# 🔔 Jira 알림 앱

Jira에서 멘션되거나 담당인 이슈들을 실시간으로 확인할 수 있는 React 앱입니다.

## ✨ 주요 기능

- 🔍 **멘션된 이슈**: 나에게 멘션된 이슈 확인
- 👤 **담당 이슈**: 내가 담당자인 이슈 확인  
- 📝 **보고한 이슈**: 내가 보고한 이슈 확인
- 🎯 **실시간 업데이트**: 자동 새로고침으로 최신 상태 유지
- 🔧 **개발 모드**: Hot Reload로 실시간 개발

## 🚀 실행 방법

### 개발 모드 (Hot Reload 지원) ⭐

```bash
# 개발 서버 실행 (자동 변경 감지)
npm run dev
```

개발 모드에서는 파일을 수정하면 자동으로 변경이 감지되어 브라우저가 새로고침됩니다.

**접속 URL:**
- 프론트엔드: http://localhost:3000
- API 서버: http://localhost:2001

### Docker Compose로 개발 모드 실행

```bash
# Docker Compose로 개발 모드 실행
docker-compose -f docker-compose.dev.yml up --build
```

### 프로덕션 모드 (Docker)

```bash
# Docker 이미지 빌드
docker build -t jira-alarm .

# 컨테이너 실행 (포트 2001)
docker run -d -p 2001:2001 --name jira-alarm-app jira-alarm

# 로그 확인
docker logs jira-alarm-app

# 컨테이너 중지
docker stop jira-alarm-app
docker rm jira-alarm-app
```

## ⚙️ 설정 방법

1. **Jira 서버 URL**: `https://your-domain.atlassian.net`
2. **이메일 주소**: Jira 계정 이메일
3. **API 토큰**: [Jira API 토큰 생성](https://id.atlassian.com/manage-profile/security/api-tokens)

## 🛠️ 개발 환경

### Hot Reload 설정

- **React 개발 서버**: 포트 3000에서 실행
- **Express API 서버**: 포트 2001에서 실행 (nodemon으로 파일 변경 감지)
- **자동 새로고침**: 파일 수정 시 브라우저 자동 새로고침

### 파일 구조

```
jira-alarm/
├── src/
│   ├── components/     # React 컴포넌트
│   ├── services/       # Jira API 서비스
│   ├── types/          # TypeScript 타입 정의
│   └── App.tsx         # 메인 앱 컴포넌트
├── server/             # Express API 서버
├── Dockerfile          # 프로덕션용 Dockerfile
├── Dockerfile.dev      # 개발용 Dockerfile
└── docker-compose.dev.yml # 개발용 Docker Compose
```

## 🔧 기술 스택

- **Frontend**: React 19, TypeScript, CSS3
- **Backend**: Node.js, Express.js
- **API**: Jira REST API v3
- **Container**: Docker, Docker Compose
- **Development**: Hot Reload, nodemon

## 📝 사용법

1. 개발 서버 실행: `npm run dev`
2. 브라우저에서 http://localhost:3000 접속
3. Jira 설정 정보 입력
4. 연결 테스트 후 이슈 목록 확인
5. 코드 수정 시 자동으로 브라우저 새로고침됨

## 🐛 문제 해결

### CORS 오류
- Express 프록시 서버를 통해 해결됨
- 개발 모드에서는 자동으로 프록시 설정됨

### API 연결 실패
- Jira 서버 URL이 올바른지 확인
- API 토큰이 유효한지 확인
- 네트워크 연결 상태 확인

### Hot Reload가 작동하지 않음
- `npm run dev` 명령어로 실행했는지 확인
- 파일 저장 후 잠시 기다려보기
- 브라우저 캐시 삭제 후 새로고침