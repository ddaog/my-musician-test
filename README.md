# 🍜 내 최애 음식을 맞춰봐 (my-food-test)

내가 좋아하는 음식 TOP10 맞추기 테스트 웹 서비스

## Tech Stack

- **Frontend**: Next.js (App Router)
- **Hosting**: Vercel
- **DB**: Supabase (Postgres)
- **Auth**: editToken 방식 (로그인 없음)

## 로컬 개발

### 1. 환경 변수 설정

```bash
cp .env.example .env.local
```

`.env.local`에 Supabase 정보 입력:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Supabase 테이블 생성

Supabase 대시보드 SQL Editor에서 `supabase/migrations/001_initial.sql` 내용 실행

### 3. 실행

```bash
npm install
npm run dev
```

## URL 구조

| 경로 | 설명 |
|------|------|
| `/` | 홈 |
| `/create` | 문제지 만들기 |
| `/q/[slug]` | 퀴즈 응시 |
| `/q/[slug]/result/[submissionId]` | 결과 |
| `/q/[slug]/leaderboard` | 리더보드 |

## API

- `POST /api/quizzes` - 퀴즈 생성
- `GET /api/quizzes/[slug]` - 퀴즈 조회
- `POST /api/quizzes/[slug]/submit` - 제출
- `GET /api/quizzes/[slug]/leaderboard` - 리더보드

## 배포 (Vercel)

1. Vercel에 프로젝트 연결
2. 환경 변수 설정 (Supabase URL, Anon Key)
3. Deploy
