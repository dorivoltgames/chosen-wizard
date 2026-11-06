# 선택받은 마법사 · The Chosen Wizard · 選ばれし魔法使い

도트 인생 시뮬레이터. 태어나서 마왕까지, 선택으로 이어지는 한 번의 인생. 한국어 · English · 日本語
A pixel-art life simulator: from birth to the Demon Lord, shaped by your choices.
ドット絵の人生シミュレーター。誕生から魔王まで、選択でつながる一度の人生。

▶ https://dorivoltgames.github.io/chosen-wizard/

made by **dorivoltgames**

## 마법 공명 2.1 · 여섯 구간

랜덤 탄생, 직접 치르는 시험, 학교생활과 뜻밖의 인연, 카드 성장과 한 손가락 회피 전투.
모험은 총 6스테이지이며, 마왕성에서 끝난다. 세 신규 지역, 몬스터 9종과 보스 3종,
마법 조합 6개, 선택에 반응하는 도트 장면을 추가했다. 활성 엔딩은 42개다.
이전 2.0에서 발견한 8개 엔딩과 공유 링크는 보관한다.

1. 초원 / 요정의 숲
2. 사막 / 안개 늪 / 해적 해안
3. 설원 / 불꽃 화산 / 수정 동굴
4. 던전 / 하늘 유적 / 태엽 시계탑
5. 별빛 항로
6. 마왕성

같은 스테이지의 지역 중 하나를 방문한다. 3개 이상인 구간은 기존 방식대로 후보
두 곳을 제시한다. 출신과 인연에 따른 길, 보스 대화·잠입 등 원래 특성 분기는 유지한다.

개발 미리보기: `npm run preview` · 검증: `npm test` (Node 22.13+).
`?playtest=1`에서는 별도 저장 공간으로 지역·마법·선택 장면을 바로 체험할 수 있다.

- [2.1 패치노트](PATCH_NOTES.md)
- [6스테이지와 신규 지역](docs/STAGE-EXPANSION.md)
- [선택 연출과 보스 검증](docs/STORY-SCENES.md)
- [마법 조합](docs/RESONANCE-PLAYTEST.md)
- [이전 2.0 기록 및 통계 서버 구조](docs/CROSSROADS.md)

게임은 GitHub Pages, 통계는 기존 Cloudflare Worker와 Stats Durable Object를 사용한다.

(c) dorivoltgames. All rights reserved. 플레이와 링크 공유는 환영, 코드·그림·글의 복제와 재업로드는 허락 없이 할 수 없어요. See LICENSE.txt.
