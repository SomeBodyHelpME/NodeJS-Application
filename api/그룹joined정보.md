## 그룹 joined 정보

| 메소드 | 경로               | 짧은 설명        |
| ------ | ------------------ | ---------------- |
| GET    | /info/joined/group | 그룹 joined 정보 |

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
    "message" : "Success to Load Group Joined Information",
  	"data" : [{"u_idx" : 1, "g_idx" : 1},{"u_idx" : 2, "g_idx" : 1},{},{}]
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