/* CC 배너 제너레이터 — 03-sample-data
   원본 index.html 에서 기능별로 분리. 로드 순서가 곧 실행 순서다. */
      /* ============================================================
   제품 마스터 (실운영: Google Sheet ProductMaster/TemplateMaster fetch로 교체)
   명세서 §1.1.2 — 제품군 키로 제품 옵션 + 템플릿 목록 조회
   ============================================================ */
      const GROUPS = {
        bamboo500: {
          label: "뱀부500",
          templates: ["01", "02"],
          seller: "wtable_official",
          t1: "Bamboo500 Premium",
          t2: "Series ~60% Open.",
          t1_02: "셀러 × 디어커스",
          t2_02: "뱀부 500 Series",
          copy: "먼지 날림이 적어 안심하고 쓰는 ",
          copyBold: "뱀부 500 시리즈!",
          series: "뱀부500 시리즈 가격 안내",
          rows: [
            {
              name: "뱀부500 화장지 3겹 30롤 2세트",
              optionInfo: [{ label: null, value: "1롤당 663원" }],
              normal: 73800,
              sale: 39800,
              badge: "renewal",
            },
            {
              name: "뱀부500 미용티슈 3겹 150매 6팩 단품",
              optionInfo: [{ label: null, value: "1매당 22원" }],
              normal: 49900,
              sale: 19800,
              badge: "none",
            },
            {
              name: "뱀부500 키친타월 3겹 프리미엄 4롤 단품",
              optionInfo: [{ label: null, value: "10매당 353원" }],
              normal: 29800,
              sale: 19800,
              badge: "none",
            },
            {
              name: "뱀부500 키친타월 3겹 프리미엄 4롤 2세트",
              optionInfo: [{ label: null, value: "10매당 319원" }],
              normal: 59600,
              sale: 35800,
              badge: "none",
            },
            {
              name: "뱀부500 뽑아쓰는 키친타월 100매 10팩",
              optionInfo: [{ label: null, value: "10매당 189원" }],
              normal: 37800,
              sale: 18900,
              badge: "new",
            },
          ],
        },
        cheoma: {
          label: "처마",
          templates: [],
          series: "처마 싱크대 물막이 가격 안내",
          rows: [
            {
              name: "처마 물막이 그란데",
              optionInfo: [],
              normal: 36900,
              sale: 18900,
              badge: "none",
            },
          ],
        },
        nuvola: {
          label: "누볼라 패밀리",
          templates: [],
          series: "누볼라 패밀리 세트 옵션 안내",
          rows: [
            {
              name: "누볼라 욕실화 (키즈)",
              optionInfo: [],
              normal: 28900,
              sale: 14900,
              badge: "none",
            },
          ],
        },
        balena: {
          label: "발리나",
          templates: [],
          series: "발리나 욕실화 특가 오픈",
          rows: [
            {
              name: "발리나 욕실화",
              optionInfo: [],
              normal: 60000,
              sale: 31800,
              badge: "none",
            },
          ],
        },
        ovale: {
          label: "오발레&누볼라키즈",
          templates: [],
          series: "오발레&누볼라키즈 가격 안내",
          rows: [
            {
              name: "누볼라 욕실화 (키즈)",
              optionInfo: [],
              normal: 28900,
              sale: 14900,
              badge: "none",
            },
          ],
        },
        airbium: {
          label: "에어비움",
          templates: [],
          series: "에어비움 고체 탈취제 안내",
          rows: [
            {
              name: "에어비움 고체탈취제 380g 1개 단품",
              optionInfo: [],
              normal: 28800,
              sale: 17800,
              badge: "none",
            },
          ],
        },
        popcorn: {
          label: "팝콘백",
          templates: [],
          series: "팝콘백 옵션 안내",
          rows: [
            {
              name: "팝콘 플리츠백 1세트",
              optionInfo: [],
              normal: 79000,
              sale: 29800,
              badge: "none",
            },
          ],
        },
        ondekko: {
          label: "온더꼬끄",
          templates: [],
          series: "온더꼬끄 한정특가 안내",
          rows: [
            {
              name: "인테리어 안전매트 온더꼬끄 단품 (6개입)",
              optionInfo: [{ label: null, value: "1매당 55,000원" }],
              normal: 99000,
              sale: 55000,
              badge: "none",
            },
          ],
        },
        moajoy: {
          label: "모아조이",
          templates: [],
          series: "모아조이 옵션 안내",
          rows: [
            {
              name: "디어커스 × 브랜드마방소 모아조이 플레이매트",
              optionInfo: [],
              normal: 63800,
              sale: 39800,
              badge: "none",
            },
          ],
        },
      };
