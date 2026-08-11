# 이벤트 배너 — 시트 두 탭

기존 탭은 그대로 두고 **새 탭 두 개**만 추가하면 됩니다.
탭이 없어도 배너는 지금과 똑같이 만들어집니다 (이벤트 섹션만 안 붙습니다).

## EventMaster — 이벤트 종류

| typeKey | titleLabel | bodyLabel | enabled | sortOrder |
|---|---|---|---|---|
| firstcome | 선착순 이벤트 | 구매 선착순 | TRUE | 1 |
| done | 구매 완료 이벤트 | 구매 완료 인증 | TRUE | 2 |
| proof | 구매 인증 이벤트 | 구매 인증 | TRUE | 3 |

- `titleLabel` 제목에 들어갑니다 — **선착순 이벤트 (10명)**
- `bodyLabel` 본문 첫 줄에 들어갑니다 — **구매 선착순 10명에게**
- `bodyLabel` 을 비우면 `titleLabel` 을 씁니다.
- 종류는 몇 개든 됩니다. 여기 추가하면 설정 화면 목록에 바로 나옵니다.

## GiftMaster — 선물

| giftKey | label | particle | url | enabled | sortOrder |
|---|---|---|---|---|---|
| npay3000 | 네이버 포인트 3천원 | | (이미지 주소) | TRUE | 1 |
| npay5000 | 네이버 포인트 5천원 | | | TRUE | 2 |
| musicpairing | 뮤직페어링 디퓨저(향 랜덤) | | | TRUE | 3 |
| squeegee_refill | 스퀴지 리필 | | | TRUE | 4 |

- `label` 이 배너에 그대로 나옵니다.
- `particle` **비워두세요.** 을/를을 자동으로 고릅니다.
  끝의 괄호는 떼고 판단합니다 — `디퓨저(향 랜덤)` 은 디퓨저 기준이라 **를** 입니다.
  자동이 틀리는 경우에만 여기에 직접 적으면 그 값이 이깁니다.
- `url` 은 240×240 으로 잘려 들어갑니다. 정사각형 이미지를 넣으세요.

`.fig` 에 있던 선물 15종의 `giftKey` 초기값:

```
npay3000  npay5000  grayscrubber  squeegee_refill  dustra_refill
rebag_weekly  rebag  airbium  bamboo30roll  anhanji
musicpairing  tongue_cleaner  starbucks_ice  starbucks_hot  twosome_ice
```

## 완성되는 문장

```
[제목]  titleLabel (인원명)
[본문]  bodyLabel + 인원 + 명에게
        label + 을/를   드립니다.
```

인원은 시트가 아니라 **행사 설정 [5] 이벤트** 에서 그때그때 정합니다.
