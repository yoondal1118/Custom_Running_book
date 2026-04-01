from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.running_book import create_running_book

router = APIRouter()

class RunRecord(BaseModel):
    date: str           # "2024-01-15"
    km: float
    pace: Optional[str] = ""
    memo: Optional[str] = ""

class Award(BaseModel):
    name: Optional[str] = ""
    result: Optional[str] = ""

class CreateBookRequest(BaseModel):
    name: str
    email: str
    startDate: str
    endDate: str
    bookTitle: Optional[str] = ""
    selectedPiece: Optional[str] = "blue"
    runRecords: list[RunRecord]
    awards: Optional[list[Award]] = []

@router.post("/create")
async def create_book(req: CreateBookRequest):
    try:
        result = await create_running_book(req.dict())
        return {
            "success": True,
            "message": "책이 성공적으로 생성되었습니다",
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
