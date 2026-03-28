# CLAUDE.md

## 프로젝트 개요

팔란티어(Palantir) 제품군을 프로토타이핑하고 연구하는 레포지터리입니다.
Foundry, AIP, Gotham 등 팔란티어 플랫폼의 핵심 개념과 아키텍처를 탐구합니다.

## 프로젝트 구조

```
thinking-fde/
├── CLAUDE.md          # 이 파일 - 프로젝트 컨텍스트 및 가이드
└── README.md          # 프로젝트 소개
```

> 프로토타입 모듈이 추가되면 이 구조를 업데이트해주세요.

## 개발 가이드

### 언어 및 도구

- 프로토타입 성격상 언어/프레임워크 제한 없음. 각 프로토타입에 가장 적합한 스택을 자유롭게 선택
- 새 프로토타입을 추가할 때는 해당 디렉토리에 README를 포함하여 목적과 실행 방법을 명시

### 커밋 컨벤션

- 한국어 커밋 메시지 사용
- 형식: `<type>: <설명>` (예: `feat: Ontology 객체 모델 프로토타입 추가`)
- type: `feat`, `fix`, `docs`, `refactor`, `chore`, `research`

### 코드 스타일

- 프로토타입 코드라도 읽기 쉽게 작성
- 핵심 로직에는 주석으로 팔란티어 원본 개념과의 매핑을 설명

## 팔란티어 제품 참고

### Foundry
- **Ontology**: 데이터를 객체(Object), 관계(Link), 액션(Action)으로 모델링
- **Pipeline Builder / Code Repositories**: 데이터 변환 파이프라인
- **Workshop**: 로우코드 앱 빌더
- **OSDK (Ontology SDK)**: 외부에서 Ontology에 접근하는 SDK

### AIP (Artificial Intelligence Platform)
- **AIP Logic**: LLM 기반 함수 작성
- **AIP Assist**: 자연어로 플랫폼 조작

### Gotham
- 인텔리전스 분석 및 운영 플랫폼

## 주의사항

- 이 레포는 연구/학습 목적이며, 팔란티어의 실제 코드나 API를 포함하지 않습니다
- 공개 문서와 데모를 기반으로 개념을 재구성합니다
