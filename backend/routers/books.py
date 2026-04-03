from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
from services.running_book import create_running_book, calc_price

router = APIRouter()

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

@router.post("/estimate")
async def estimate_price(
    req: CreateBookRequest,
    current_user: models.User = Depends(get_current_user),
):
    has_appendix = any(a.name for a in (req.awards or []))
    price_info = calc_price(has_appendix)
    return {"success": True, "data": price_info}

@router.post("/create")
async def create_book(
    req: CreateBookRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        import traceback
        has_appendix = any(a.name for a in (req.awards or []))
        price_info = calc_price(has_appendix)

        order_data = {
            **req.dict(),
            "name":  current_user.name,
            "email": current_user.email,
        }
        result = await create_running_book(order_data)

        order = models.Order(
            user_id=current_user.id,
            book_uid=result["book_uid"],
            book_title=req.bookTitle,
            record_year=req.recordYear,
            month_count=12,
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
                "order_id":   order.id,
                "price_info": price_info,
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))