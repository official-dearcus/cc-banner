{
  "_읽는법": [
    "이 파일만 고치면 됩니다. 스크립트는 건드릴 필요 없습니다.",
    "templates — 시스템이 그리는 템플릿 ID 목록. 새 제품군을 만들면 여기에 이름을 추가하세요.",
    "themes — 시스템이 제공하는 테마(색) 목록.",
    "checks — 피그마 좌표와 코드 상수를 1:1로 비교할 항목. 필요한 만큼만 넣으면 됩니다.",
    "  node   피그마 레이어 이름 경로. '섹션이름 > 레이어이름' 형태.",
    "  expect 코드가 쓰는 값. 코드 상수를 고치면 여기도 같이 고쳐야 합니다.",
    "  oneOf  설계상 조건에 따라 값이 갈리는 항목. 목록 중 하나면 통과합니다.",
    "  tolerance 이 항목만 허용 오차를 따로 줄 때 사용합니다.",
    "피드 슬라이드 장수는 검사하지 않습니다 — 옵션 개수에 따라 달라지기 때문입니다.",
    "다만 _01 부터 번호가 빠지거나 겹치면 잡아냅니다."
  ],
  "fileKey": "ntJksHwmqR5j3t1n6Dw3TK",
  "tolerance": 0.5,
  "templates": [
    "bamboo500_01",
    "bamboo500_02",
    "nuvolafamily_01",
    "nuvolafamily_02",
    "nuvolafamily_03"
  ],
  "themes": [
    "green",
    "blue",
    "pink",
    "yellow",
    "orange",
    "mint"
  ],
  "checks": [
    {
      "node": "bamboo500_01-detail_green > option-body",
      "expect": {
        "x": 60,
        "y": 150,
        "w": 740
      },
      "note": "02-design-tokens.js  OPT['01'].body"
    },
    {
      "node": "bamboo500_01-detail_green > option-list",
      "expect": {
        "y": 188,
        "w": 740
      },
      "note": "02-design-tokens.js  OPT['01'].list.y"
    },
    {
      "node": "bamboo500_01-detail_green > option_02",
      "expect": {
        "y": 380,
        "h": 360
      },
      "note": "카드 pitch 380 / 카드 높이 360"
    },
    {
      "node": "bamboo500_01-feed_04 > option-list",
      "expect": {
        "x": 60,
        "y": 319,
        "w": 960
      },
      "note": "15-render-thumb-feed.js:602  feedCard(ctx, r, 60, 319, th, 960)"
    },
    {
      "node": "bamboo500_01-feed_04 > option_05",
      "expect": {
        "w": 960
      },
      "note": "피드 마지막 장: 옵션 홀수면 520(하단 로고) / 짝수면 468",
      "oneOf": {
        "h": [
          468,
          520
        ]
      }
    },
    {
      "node": "bamboo500_01-feed_04 > box-img",
      "expect": {
        "x": 10,
        "w": 416
      },
      "note": "카드 높이에 따라 448 / 500 — option_05 와 같은 분기",
      "oneOf": {
        "h": [
          448,
          500
        ]
      }
    },
    {
      "node": "bamboo500_01-feed_04 > option",
      "expect": {
        "x": 474,
        "w": 448
      },
      "note": "15-render-thumb-feed.js:301 ix = x+474 · 피그마는 auto-layout 반올림으로 472.7 (허용 2px)",
      "tolerance": 2
    },
    {
      "node": "nuvolafamily_01-detail_green > option-body",
      "expect": {
        "x": 60,
        "y": 150,
        "w": 740
      },
      "note": "누볼라 본문 박스"
    },
    {
      "node": "nuvolafamily_01-detail_green > option-list",
      "expect": {
        "y": 204,
        "w": 740
      },
      "note": "누볼라는 뱀부(188)와 y 가 다름"
    },
    {
      "node": "nuvolafamily_01-detail_green > color_option",
      "expect": {
        "x": 40,
        "y": 416,
        "w": 780
      },
      "note": "12-render-nuvola.js NV.color optY 416 / optW 780 — 780을 860 가운데 두면 x=40"
    },
    {
      "node": "nuvolafamily_03-detail_green > color_option",
      "expect": {
        "x": 30,
        "w": 800
      },
      "note": "03 은 colorBox:true → nvColor() bw=800, bx=(860-800)/2=30"
    }
  ]
}