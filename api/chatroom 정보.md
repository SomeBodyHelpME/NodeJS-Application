## chatroom 정보

| 메소드 | 경로           | 짧은 설명               |
| ------ | -------------- | ----------------------- |
| GET    | /info/chatroom | 내가 속한 채팅방 리스트 |

### 요청 헤더

```json
Content-Type: application/x-www-form-urlencoded,
Authorization: token
```

### 응답 바디

#### 컨텐츠 작성 성공

```json
{
    "status" : 200,
    "message" : "Success to Load Chatroom List",
  	"data": [
        {
            "chatroom_idx": 1,
            "real_name": "팀요",
            "ctrl_name": "팀요_180111234037",
            "photo": "https://mybuckethahaha.s3.ap-northeast-2.amazonaws.com/1515681636954.jpg"
        }
    ]
}
```

#### token값에 문제가 있을 경우

```json
{
    "status": 400,
    "message": "Verification Failed"
}
```

#### 서버 내부 에러

```json
{
    "status": 500,
    "message": "Internal Server Error"
}
```
------