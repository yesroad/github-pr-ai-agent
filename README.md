## GitHub PR AI Agent

> GitHub Pull Request 생성 시 코드 변경 사항을 분석하고<br/>
LLM(OpenAI)을 활용해 자동으로 코드 리뷰를 남기는 GitHub App

### Overview
- GitHub App & Webhook 기반 PR 자동 리뷰 시스템
- PR diff를 분석해 요약 및 주요 이슈를 구조화된 형태로 리뷰
- Vercel에 배포된 서버리스 환경에서 운영

### Features
- Pull Request 이벤트 자동 감지 (opened, synchronize, reopened)
- PR diff 기반 코드 분석
- LLM 기반 요약 및 이슈 리뷰 생성
- GitHub PR Review 자동 작성
- 중복 리뷰 방지 (commit SHA 기준)
