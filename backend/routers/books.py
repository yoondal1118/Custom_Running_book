from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models
import json
import asyncio
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

class CreateOrderRequest(BaseModel):
    bookUid: str
    bookTitle: str
    recordYear: int
    totalPrice: int
    hasAppendix: bool

@router.post("/estimate")
async def estimate_price(
    req: CreateBookRequest,
    current_user: models.User = Depends(get_current_user),
):
    has_appendix = any(a.name for a in (req.awards or []))
    price_info = calc_price(has_appendix)
    return {"success": True, "data": price_info}

@router.post("/create-stream")
async def create_book_stream(
    req: CreateBookRequest,
    current_user: models.User = Depends(get_current_user),
):
    """SSE로 책 생성 진행률 스트리밍"""
    has_appendix = any(a.name for a in (req.awards or []))
    price_info = calc_price(has_appendix)
    order_data = {
        **req.dict(),
        "name":  current_user.name,
        "email": current_user.email,
    }

    async def event_stream():
        queue = asyncio.Queue()

        async def progress_callback(step: str, pct: int, preview_url: str = None):
            await queue.put({"step": step, "pct": pct, "preview_url": preview_url})

        async def run():
            try:
                result = await create_running_book(order_data, progress_callback)
                await queue.put({"done": True, "result": result, "price_info": price_info})
            except Exception as e:
                import traceback
                traceback.print_exc()
                await queue.put({"error": str(e)})

        task = asyncio.create_task(run())

        while True:
            try:
                msg = await asyncio.wait_for(queue.get(), timeout=120)
                yield f"data: {json.dumps(msg, ensure_ascii=False)}\n\n"
                if msg.get("done") or msg.get("error"):
                    break
            except asyncio.TimeoutError:
                yield f"data: {json.dumps({'error': '타임아웃'})}\n\n"
                break

        await task

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        }
    )

@router.post("/confirm-order")
async def confirm_order(
    req: CreateOrderRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """책 생성 완료 후 주문 확정 (DB 저장)"""
    try:
        order = models.Order(
            user_id=current_user.id,
            book_uid=req.bookUid,
            book_title=req.bookTitle,
            record_year=req.recordYear,
            month_count=12,
            total_price=req.totalPrice,
            status="paid",
        )
        db.add(order)
        db.commit()
        db.refresh(order)
        return {"success": True, "data": {"order_id": order.id}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))