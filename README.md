# 우리집 통장 — 배포 가이드

구성: **GitHub Pages(프론트) + Cloudflare Workers(API) + Cloudflare D1(DB)** — 전부 무료 티어로 충분합니다.

## 1. Cloudflare 준비

```bash
npm install -g wrangler
wrangler login
```

`worker` 폴더로 이동해서 D1 데이터베이스 생성:

```bash
cd worker
wrangler d1 create household-ledger
```

출력되는 `database_id` 값을 복사해서 `wrangler.toml`의 `database_id = "REPLACE_AFTER_WRANGLER_D1_CREATE"` 부분에 붙여넣으세요.

테이블 생성:

```bash
wrangler d1 execute household-ledger --file=./schema.sql --remote
```

PIN 번호 등록 (부부만 아는 숫자, 원하는 값으로):

```bash
wrangler secret put PIN
# 프롬프트에 예: 4821 입력
```

`wrangler.toml`의 `ALLOWED_ORIGIN`을 본인 GitHub Pages 주소로 수정 (예: `https://saebyeol.github.io`).

배포:

```bash
wrangler deploy
```

배포 완료 후 나오는 주소 (예: `https://household-ledger-api.saebyeol.workers.dev`)를 기억해두세요.

## 2. 프론트엔드 설정

`index.html` 안의 이 부분을 방금 받은 Worker 주소로 수정:

```js
window.API_BASE = "https://household-ledger-api.YOUR_SUBDOMAIN.workers.dev";
```

## 3. GitHub Pages 배포

```bash
# 새 저장소 만든 뒤
git init
git add index.html README.md
git commit -m "우리집 통장 초기 배포"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/household-ledger.git
git push -u origin main
```

GitHub 저장소 → Settings → Pages → Branch를 `main` / `root`로 설정하면
`https://YOUR_USERNAME.github.io/household-ledger/` 에서 바로 접속 가능합니다.

## 4. 사용

- 접속하면 PIN 입력 화면이 뜹니다. Worker에 등록한 PIN을 입력하세요.
- 이후 모든 데이터는 Cloudflare D1에 저장되어, 남편/아내가 각자 기기에서 같은 PIN으로 접속하면 **같은 데이터**를 봅니다.
- 입력 후 약 0.9초 뒤 자동으로 서버에 저장됩니다 (상단 "저장 중...→저장됨" 표시로 확인).

## 참고 / 한계

- **보안 수준**: PIN 하나로 지키는 방식이라 매우 강력한 보안은 아니에요. 개인/부부 용도로는 충분하지만, 진짜 민감한 정보(계좌 실번호 등)는 넣지 않는 걸 추천해요.
- **데이터 구조**: 전체 데이터를 하나의 JSON 블롭으로 저장하는 단순한 방식이에요. 나중에 항목이 아주 많아지면(수백~수천 건) 테이블을 분리하는 게 좋지만, 부부 가계부 규모에서는 문제없어요.
- **무료 티어 한도**: Cloudflare Workers 무료 티어는 하루 10만 요청, D1은 5GB 저장공간 — 개인 사용에는 절대 넘길 일이 없습니다.
