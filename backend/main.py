from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import books, orders

app = FastAPI(title="러닝일지북 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React 개발 서버
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(books.router, prefix="/api/books", tags=["books"])
app.include_router(orders.router, prefix="/api/orders", tags=["orders"])

@app.get("/")
def root():
    return {"status": "ok", "service": "러닝일지북 API"}
