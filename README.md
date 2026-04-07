# 러닝일지북(Running Book) 서비스 가이드

## 📙 서비스 개요

**러닝일지북**은 당신의 러닝 기록을 세상에 하나 밖에 없는 책으로 만드는 서비스입니다.

### 제작 의도

최근 러닝은 단순한 운동을 넘어 라이프스타일의 일부가 되고 있습니다. 사람들은 자신의 러닝 기록을 SNS에 공유하며 성취감을 나누고 싶어합니다.

**러닝일지북**은 이러한 심리에 부합하면서도 한 걸음 더 나아갑니다:

- **개인의 경험을 책으로 기록**: SNS의 '지나가는 기록'이 아닌, **물리적인 책**으로 영구 보존
- **연 단위 수요 창출**: 단발성 기록이 아닌 매년 새로운 연도의 러닝 기록을 책으로 제작하도록 설계
  - 1월부터 12월까지 한 해의 모든 러닝 기록을 담아내고, 해마다 반복되도록 유도
  - 지속적인 서비스 수요 창출
- **러닝 관련 어플/활동과의 연결**: 러닝을 기록하는 어플과 연동하여 자동으로 책을 만들어주는 API 개발 확장 가능성, 마라톤 대회와의 협업으로 책을 만들 수 있는 기회 제공 등
- **선순환 구조**: 책을 만들기 위해 러닝 기록을 더 꼼꼼히 남기게 되고, 책을 SNS에 공유하면서 파급효과가 커질 경우 더 많은 사람들이 책을 만들기 위해 뛰게 되는 긍정적인 순환

이렇게 만들어진 책은 당신의 노력이 담긴 소중한 추억이 됩니다.

---
## 🛠️ 기술 스택

### 백엔드
- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLite (로컬 개발용)
- **ORM**: SQLAlchemy
- **인증**: JWT (PyJWT, python-jose)
- **외부 API**: BOOKPRINT_API + [BookPrintAPI Python SDK](../bookprintapi/) (포토북 제작 및 주문)

### 프론트엔드
- **Framework**: React 18
- **빌드 도구**: Vite
- **상태 관리**: Context API
- **스타일**: CSS3

---
## 🚀 빠른 시작

### 1단계: 환경 설정

#### 사전 요구사항
- os : window (권장)
- Python 3.11
- Node.js 14 이상
- npm 또는 yarn

#### 설치

**저장소 클론:**
```bash
git clone <repository-url>
cd Custom_Running_book
```

**Python 가상 환경 생성:**
```bash
py -3.11 -m venv venv
# Windows
venv\Scripts\activate  (cmd)
.\venv\Scripts\activate (PowerShell)
# Mac/Linux
source venv/bin/activate
```

**의존성 설치:**
```bash
# 루트에서
pip install -r requirements.txt
playwright install
```

#### 환경 변수 설정

**`.env` 파일 생성** (프로젝트 루트 `Custom_Running_book/`에):
```bash
copy .env.example .env  (cmd)
cp .env.example .env (powershell)
```

`.env` 파일 수정:
```
# BookPrintAPI 설정 (Sandbox 환경)
BOOKPRINT_API_KEY=SBxxxxx.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BOOKPRINT_BASE_URL=https://api-sandbox.sweetbook.com/v1

# JWT 설정
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# 데이터베이스 (SQLite)
DATABASE_URL=sqlite:///./running_book.db
```

---

### 2단계: 로컬에서 실행

#### 터미널 1: 백엔드 실행

```bash
cd backend
uvicorn main:app --reload
```

출력 예시:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

#### 터미널 2: 프론트엔드 실행

```bash
cd frontend
npm install (초기 세팅 시 필요)
npm run dev
```

출력 예시:
```
VITE v4.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

#### 브라우저 접속
- 프론트엔드: http://localhost:5173/
- 백엔드 API 문서: http://localhost:8000/docs (Swagger UI)

---

## 📖 서비스 흐름

| Step | 기능 | 기술 |
|------|------|------|
| 1️⃣ **회원가입** | 사용자명, 이메일, 비밀번호로 계정 생성 | 자체 구현 (JWT 인증) |
| 2️⃣ **로그인** | JWT 토큰 발급 (로그인 필수) | 자체 구현 |
| 3️⃣ **러닝 기록 입력** | 달력 UI에서 날짜별 러닝 기록, 수상 기록 입력 | 자체 구현 (프론트엔드) |
| 4️⃣ **책 생성** | 입력된 기록으로 포토북 생성<br>(초안 → 표지 → 페이지 → 확정) | **BOOKPRINT_API 사용**<br>(`/books`, `/books/{bookUid}/photos`,<br>`/books/{bookUid}/cover`, `/books/{book_uid}/contents`, `/books/{book_uid}/finalization`) |
| 5️⃣ **미리보기** | 생성된 책의 예상 가격 표시 | **BOOKPRINT_API SDK 사용**<br>(`orders.estimate`) |
| 6️⃣ **배송지 입력** | 배송지 선택 또는 신규 등록 | 자체 구현 (사용자별 관리) |
| 7️⃣ **주문 생성** | 확정된 책으로 최종 주문 | **BOOKPRINT_API SDK 연동**<br>(`orders.create`) |
| 8️⃣ **주문 추적** | 마이페이지에서 주문 상태 확인<br>주문 취소, 배송지 변경 | 자체 구현 (DB) +<br> **BOOKPRINT_API SDK 연동** <br>(`client.orders.cancel`, `client.orders.update_shipping`)

---

## 상세 API 명세서

### 💻 자체 구현 기능

스위트북 API 외에 서비스 운영을 위해 자체 구현한 백엔드 API:

| 엔드포인트 | 기능 |
|-----------|------|
| **POST /api/auth/signup**<br>**POST /api/auth/login**<br>**GET /api/auth/me** | **사용자 인증**: 회원가입, 로그인, 세션 관리 (JWT) |
| **GET /api/addresses**<br>**POST /api/addresses**<br>**PUT /api/addresses/{id}**<br>**DELETE /api/addresses/{id}** | **배송지 관리**: 사용자별 배송지 저장/수정/삭제 (자체 DB) |
| **GET /api/orders/my** | 내 주문 조회, 취소, 배송지 변경<br>(스위트북 API와 자체 DB 병행) |

---



### API 엔드포인트 명세

#### **직접 API 호출 (HTTP 요청)**

| 메서드 | 엔드포인트 | 기능 |
|--------|-----------|------|
| **POST** | `/books` | 책 초안 생성 |
| **POST** | `/books/{bookUid}/photos` | 사진 업로드 |
| **POST** | `/books/{bookUid}/cover` | 커버 추가 |
| **POST** | `/books/{bookUid}/contents` | 페이지 컨텐츠 추가 |
| **POST** | `/books/{bookUid}/finalization` | 책 최종화 |

#### **SDK 호출 (Python bookprintapi 사용)**

| 메서드 | 엔드포인트 | 기능 |
|--------|-----------|------|
| **POST** | `/orders` | 주문 생성 |
| **POST** | `/orders/estimate` | 가격 견적 조회 |
| **DELETE** | `/orders/{orderUid}/cancel` | 주문 취소 |
| **PATCH** | `/orders/{orderUid}/shipping` | 배송지 변경 |

---

## 📝 샘플 데이터 구조

### 러닝 기록 (RunRecord)
```json
{
    "date": "2024-01-15",
    "km": 5.2,
    "pace": "5'30\"",
    "memo": "날씨 좋음, 아침 운동"
}
```

### 수상 기록 (Award)
```json
{
    "name": "풀코스 완주",
    "result": "2024-02-10"
}
```

### 책 생성 요청
```json
{
    "bookTitle": "2024 나의 러닝 여정",
    "recordYear": 2024,
    "selectedPiece": "piece1",
    "runRecords": [
        {"date": "2024-01-15", "km": 5.2, "pace": "5'30\"", "memo": "..."},
        {"date": "2024-01-20", "km": 10.0, "pace": "5'00\"", "memo": "..."}
    ],
    "awards": [
        {"name": "풀코스 완주", "result": "2024-02-10"}
    ]
}
```

---

## 🗄️ 데이터베이스 스키마

### User (사용자)
- id (PK)
- username (unique)
- name
- email
- password (hashed)
- phone
- created_at

### Address (배송지)
- id (PK)
- user_id (FK) → User
- recipient_name
- recipient_phone
- postal_code
- address1
- address2
- is_default
- created_at

### Book (러닝일지북)
- id (PK)
- user_id (FK) → User
- title
- record_year
- book_uid (BookPrintAPI에서 발급)
- status (draft/finalized)
- created_at

### Order (주문)
- id (PK)
- user_id (FK) → User
- book_id (FK) → Book
- order_uid (BookPrintAPI에서 발급)
- address_id (FK) → Address
- total_price
- status
- ordered_at

---

## 🐛 트러블슈팅

### 문제: "API Key not found" 에러
**해결**: `backend/.env` 파일을 생성하고 BOOKPRINT_API_KEY를 입력했는지 확인하세요.

### 문제: CORS 에러 ("No 'Access-Control-Allow-Origin'")
**해결**: 백엔드가 프론트엔드의 요청을 허용하는지 확인하세요.
- 프론트엔드: `http://localhost:5173`
- 백엔드: `http://localhost:8000`
- [backend/main.py](../backend/main.py#L11-L16)에서 CORS 설정 확인

### 문제: ModuleNotFoundError: "No module named 'bookprintapi'"
**해결**: 백엔드 폴더에서 `pip install -e .`를 실행하세요. (또는 bookprintapi 폴더를 Python path에 추가)

### 문제: "Database is locked" 에러
**해결**: SQLite 데이터베이스가 동시에 여러 프로세스에서 접근했을 수 있습니다.
```bash
# 데이터베이스 파일 삭제 후 재시작
rm backend/running_book.db
```

---


**Happy Running & Reading! 📖🏃**
