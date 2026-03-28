# thinking-fde

## GitHub에서 Codex 자동 PR 리뷰 설정

이 저장소에는 GitHub Pull Request가 열리거나 업데이트될 때 Codex가 자동으로 리뷰 코멘트를 남기는 워크플로우가 포함되어 있습니다.

### 1) GitHub Secret 추가

저장소의 **Settings → Secrets and variables → Actions**에서 아래 시크릿을 추가하세요.

- `OPENAI_API_KEY`: OpenAI API 키

### 2) 동작 방식

- 트리거: `pull_request` (`opened`, `synchronize`, `reopened`)
- Codex 실행: `openai/codex-action@v1`
- 결과 게시: PR 코멘트로 자동 등록

워크플로우 파일 위치:

- `.github/workflows/codex-pr-review.yml`

### 3) 실패 방지(중요)

다음 조건에서는 워크플로우가 **실패하지 않고 자동 skip** 되도록 설정되어 있습니다.

- `OPENAI_API_KEY` 시크릿이 없는 경우
- 포크(fork)에서 올라온 PR인 경우 (보안/시크릿 노출 방지)

즉, 체크가 실패로 떨어지기보다 스킵으로 표시됩니다.

### 4) 커스터마이징 포인트

- 리뷰 프롬프트: `.github/workflows/codex-pr-review.yml`의 `prompt` 영역
- 권한: `permissions` 블록에서 최소 권한 원칙으로 조정
- 실행 조건: `on.pull_request.types` 수정
