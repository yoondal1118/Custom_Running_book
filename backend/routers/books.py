from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
from services.running_book import create_running_book
import traceback

router = APIRouter()

BASE_PRICE = 12000
PRICE_PER_MONTH = 1000

class RunRecord(BaseModel):
    date: str
    km: float
    pace: Optional[str] = ""
    memo: Optional[str] = ""

class Award(BaseModel):
    name: Optional[str] = ""
    result: Optional[str] = ""

class CreateBookRequest(BaseModel):
    bookTitle: str
    recordYear: int
    selectedPiece: str
    runRecords: list[RunRecord]
    awards: Optional[list[Award]] = []

def calc_price(run_records: list) -> dict:
    months = set()
    for r in run_records:
        if r.get("date") and r.get("km"):
            months.add(r["date"][:7])
    month_count = len(months)
    total = BASE_PRICE + (month_count * PRICE_PER_MONTH)
    return {
        "base_price": BASE_PRICE,
        "month_count": month_count,
        "month_price": month_count * PRICE_PER_MONTH,
        "total_price": total,
    }

@router.post("/create")
async def create_book(
    req: CreateBookRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        price_info = calc_price([r.dict() for r in req.runRecords])

        order_data = {
            **req.dict(),
            "name": current_user.name,
            "email": current_user.email,
        }
        result = await create_running_book(order_data)

        # DB에 주문 저장
        order = models.Order(
            user_id=current_user.id,
            book_uid=result["book_uid"],
            book_title=req.bookTitle,
            record_year=req.recordYear,
            month_count=price_info["month_count"],
            total_price=price_info["total_price"],
            status="paid",
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        return {
            "success": True,
            "data": {
                **result,
                "order_id": order.id,
                "price_info": price_info,
            }
        }
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/estimate")
async def estimate_price(
    req: CreateBookRequest,
    current_user: models.User = Depends(get_current_user),
):
    price_info = calc_price([r.dict() for r in req.runRecords])
    return {"success": True, "data": price_info}
