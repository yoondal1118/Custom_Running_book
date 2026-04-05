from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
import models
from routers import books, orders, auth, addresses

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="러닝일지북 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,      prefix="/api/auth",      tags=["auth"])
app.include_router(books.router,     prefix="/api/books",     tags=["books"])
app.include_router(orders.router,    prefix="/api/orders",    tags=["orders"])
app.include_router(addresses.router, prefix="/api/addresses", tags=["addresses"])

@app.get("/")
def root():
    return {"status": "ok", "service": "러닝일지북 API"}