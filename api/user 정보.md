## user 정보

| 메소드 | 경로       | 짧은 설명 |
| ------ | ---------- | --------- |
| GET    | /info/user | user 정보 |

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
    "message" : "Success to Load User Information",
    "data" : [
                {
                    "u_idx": 2,
                    "name": "상은",
                    "phone": "010-6211-4771",
                    "bio": null,
                    "photo": "https:///mybuckethahaha.ss3.ap-northeast-2.amazonaws.com/mybuckethahaha/1515681636954.jpg",
                    "id": "starbucks@gmail.com"
                },
              {
                    "u_idx": 16,
                    "name": "안다혜",
                    "phone": "010-2639-4203",
                    "bio": null,
                    "photo": null,
                    "id": "ahndh8@gmail.com"
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