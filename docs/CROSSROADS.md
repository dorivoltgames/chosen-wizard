# 운명의 갈림길 2.0

## 플레이 변화

- 7세에 영웅·금지마법·고향의 배움터를 선택한다. 영웅 경로는 기존 세 시험을 유지하고, 다른 경로는 수련 선택을 플레이한다.
- 18세에 세 성인 경로 중 하나를 선택한다. 어린 시절의 배움과 인연은 전환 후에도 유지된다.
- 영웅은 출발의 약속, 친구 구조, 마지막 문 앞의 결심을 선택한다. 약속과 친구를 모두 지킨 승리, 표식 없이 운명을 넘어선 승리에 새 엔딩이 있다. 마지막에 예언을 택하면 기존 전투 엔딩 조건으로 돌아간다.
- 금지마법은 신뢰와 연구의 누적에 따라 마지막 선택지가 열린다. 신뢰 2 이상이면 공동 연구, 연구 3 이상이면 이름을 바치는 해답이 열린다. 봉인 완성은 항상 가능하다.
- 고향은 빵집·학교·장터, 투자, 물자 단절 위기, 유산을 선택한다. 기존 고향 엔딩도 선택 가능한 조건으로 남아 있다.
- 기존 39개 엔딩 ID·순서는 그대로이며 새 엔딩 8개가 뒤에 추가되어 총 47개다.
- 도감의 단서를 다음 목표로 고르면 탄생 화면에서 다시 보여 준다. 결과 화면에도 다음 단서를 제안한다.
- 이전 완주 캐릭터가 다음 생의 도서관 이야기로 등장한다. 출생 확률·초기 능력치·난수 순서에 영향을 주지 않는다.
- 오늘의 운명에 순환 과제를 추가했다. 과제 완료 기록과 기존 일일 엔딩 기록을 분리했다.
- 친구 링크에는 출생 seed와 검증된 엔딩·경로 ID를 담는다. 받은 사람은 친구의 결과를 시작과 완주 화면에서 비교한다. 일일 링크는 날짜를 고정해 다음 날 열어도 같은 출생을 사용한다. 예전 `#f...`, `#today` 링크도 지원한다.

## 저장과 번역

기존 `chosen-wizard-life-v1` 저장 키와 필드를 유지한다. 새 데이터는 `crossroads`에 추가하고, 최근 12개 인생과 최근 45개 과제 완료만 보관한다. 한국어·영어·일본어가 새 콘텐츠 전체에 제공된다. 이름은 새 UI에서 HTML로 해석하지 않는다. 친구 결과는 스스로 보고한 이야기이며 순위 인증 정보가 아니다.

## Cloudflare 통계

운영 Worker의 코드와 설정을 읽어 확인했다. 현재 저장소는 D1이 아니라 `STATS` 바인딩의 `Stats` Durable Object이며, `idFromName("main")` 객체의 `c` 키에 기존 누적 집계가 있다. 연결된 namespace의 설정에서도 `use_sqlite: true`, 클래스 `Stats`, Worker `chosen-wizard-stats`를 확인했다. 운영 호환 날짜는 `2026-10-01`이다.

기존 `https://chosen-wizard-stats.dorivoltgames.workers.dev/e`, `/s` 요청 형식과 CORS 정책은 유지한다. 새 엔딩 8개를 서버의 `DX`·`EN` 허용 목록에 추가해야 새 엔딩의 발견 비율과 횟수가 집계된다. 로컬 미리보기와 파일로 연 게임 빌드는 운영 통계를 보내지 않는다.

새 이벤트는 `fate-telemetry.js`에서 기록한다. Worker가 `/funnel/health`에 `{ "version": 2, "enabled": true }`를 반환할 때만 `/funnel/events`로 전송한다. 미지원 시 기존 통계에는 영향을 주지 않고 브라우저에만 보관한다. 이벤트에는 이름, IP, 이메일, 출생 seed를 넣지 않는다. 대기열은 160개, 브라우저의 일별 집계는 30일로 제한된다.

`stats-extension/funnel.mjs`는 기존 Durable Object에 추가하는 코드다. 새 데이터는 `funnel:day:`와 `funnel:event:` 키만 사용하며 기존 `c` 키를 수정하지 않는다. 이벤트 ID 확인과 일별 증가를 한 트랜잭션으로 처리하여 재시도와 객체 재시작에도 중복 집계하지 않는다. 31일을 넘은 새 통계는 기존 flush 알람에서 제한된 개수씩 정리한다. 기존 알람을 뒤로 미루거나 기존 집계·다른 키를 삭제하지 않는다. 새 수집·조회 요청은 기존 수집과 별도의 메모리 요청 제한을 사용한다. 새 D1 데이터베이스나 Durable Object namespace를 만들 필요가 없다.

운영 Worker 원본과 계정의 비공개 설정은 이 공개 Git 저장소에 넣지 않았다. `stats-extension/prepare-worker.mjs`는 별도로 다운로드한 원본 `src/index.js`, `src/ids.json`에 검증된 변경을 적용한다. 읽어 확인한 원본의 SHA-256과 다르면 중단하며 비어 있는 새 디렉터리에만 쓴다.

```sh
node stats-extension/prepare-worker.mjs /path/to/original/src /path/to/new/worker-output
```

생성 결과:

- `src/index.js`: 기존 처리에 `/funnel/*`, RPC 메서드, 정리 알람 호출, 새 엔딩 허용 목록을 추가한 Worker.
- `src/ids.json`: 기존 목록을 그대로 보존. 새 엔딩은 확장의 `EXTRA_ENDINGS`를 합쳐 사용한다.
- `src/funnel.mjs`: 새 통계 처리 모듈.
- `wrangler.json`: 기존 Worker 이름·호환 날짜·`STATS`/`Stats` 바인딩과 확인된 SQLite 저장소 export를 유지하는 운영 설정. 새로운 migration은 넣지 않는다.
- `wrangler.local.json`: 로컬 테스트 전용 Worker 이름과 SQLite namespace 초기화 설정. **운영에 사용하지 않는다.**
- `SOURCE.json`: 검토한 원본과 준비된 Worker의 해시 및 배포 전 상태.

검토 후 운영 반영 시에도 Worker 이름 `chosen-wizard-stats`, 클래스 `Stats`, 바인딩 `STATS`, 객체 이름 `main`과 기존 namespace를 유지해야 한다. 새 namespace 생성이나 클래스 rename·delete migration을 적용하지 않는다. 아직 운영 Worker나 게임의 공개 배포는 수행하지 않았다.

추가 통계 조회는 `/funnel/stats?days=7` (1~31일)이며, 일별 `counts`의 키는 `event|path|mode`다. 기존 공개 통계처럼 집계 숫자만 반환한다. 실제 iframe Origin을 포함하여 기존 GitHub Pages·localhost·itch.zone·ssl.hwcdn.net 정책을 유지했다.

수집 단계: 방문/친구 링크 진입 → 탄생 → 실제 삶 시작 → 7세 경로 선택 → 시험 시작/완료(영웅 수련만) → 성인식 → 성인 경로 선택 → 완주 → 공유 시도/네이티브 공유 완료. 공유 취소는 완료로 세지 않으며, 복사는 아직 공유 완료로 집계하지 않는다. 방문자별 D1/D7 재방문 분석은 이 익명 이벤트 확장에 포함되지 않는다.

## 검증

`npm test` (Node 22.13 이상). 외부 패키지 설치는 필요 없다.

- 실제 DOM 없는 게임 엔진으로 80개 seed × 9가지 수련/성인 경로 조합을 시뮬레이션한다. 시험 결과와 전투 승패는 이 테스트에서 입력하므로 브라우저 조작·전투 난이도 검증을 대신하지 않는다.
- 새 엔딩 8개의 도달 가능성, 선택지 조건, 예전 엔딩 ID 보존, 출생 난수 보존, 세 언어, 이전 저장 데이터, 악성·잘못된 친구 링크를 검사한다.
- 통계 모듈은 기존 누적 집계·알람 보존, 객체 재시작과 동시 요청의 중복 방지, 보관 기간 정리, 기존 Worker 미지원, 전송 실패 재시도, 대기열 제한을 검사한다.
- `npm run preview`로 시작 후 브라우저에서 엔딩·공유·도감 화면을 별도로 확인한다.

게임은 빌드 없는 정적 파일이다. `index.html`, `fate-update.js`, `fate-ui.js`, `fate-telemetry.js`, `fate-update.css`, 기존 이미지 파일들을 함께 배포한다. GitHub Pages 공개 반영은 검토된 브랜치를 main에 병합할 때 수행한다.

운영에서 읽어 확보한 Worker 원본에 확장을 적용한 뒤 `wrangler dev --local --config wrangler.local.json`로 실제 로컬 Cloudflare 런타임을 실행하고 `npm run test:worker`로 검증했다. 기존 `/e`·`/s` 집계, 새 엔딩 허용 목록, Durable Object RPC·트랜잭션·중복 방지, CORS, 저장 알람이 함께 동작했다. 이 테스트 스크립트는 localhost URL만 허용하여 운영 통계를 변경하지 않는다.
