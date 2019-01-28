## group 정보

| 메소드 | 경로        | 짧은 설명             |
| ------ | ----------- | --------------------- |
| GET    | /info/group | 내가 속한 그룹 리스트 |

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
    "message": "Success to Load Group List",
    "data": [
        {
            "g_idx": 131,
            "real_name": "testgroup",
            "ctrl_name": "testgroup_180503191501",
            "photo": " ",
            "default_chatroom_idx": 27
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