from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user
import models, json, asyncio, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
from bookprintapi import Client
from dotenv import load_dotenv
from services.running_book import create_running_book, calc_price

load_dotenv()
client = Client(api_key=os.getenv("BOOKPRINT_API_KEY"), environment="sandbox")

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
    addressId: int  # Address 테이블 ID

@router.post("/estimate")
async def estimate_price(
    req: CreateBookRequest,
):
    has_appendix = any(a.name for a in (req.awards or []))
    price_info = calc_price(has_appendix)
    return {"success": True, "data": price_info}

@router.post("/create-stream")
async def create_book_stream(
    req: CreateBookRequest,
    current_user: models.User = Depends(get_current_user),
):
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
                msg = await asyncio.wait_for(queue.get(), timeout=180)
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
    """책 생성 완료 후 Sweetbook 주문 생성 + DB 저장"""
    try:
        # 선택한 배송지 조회
        addr = db.query(models.Address).filter(
            models.Address.id == req.addressId,
            models.Address.user_id == current_user.id
        ).first()
        if not addr:
            raise HTTPException(status_code=400, detail="배송지를 찾을 수 없습니다")

        # 1. Sweetbook Orders API 호출 → order_uid 발급
        sweetbook_order = client.orders.create(
            items=[{"bookUid": req.bookUid, "quantity": 1}],
            shipping={
                "recipientName":  addr.recipient_name,
                "recipientPhone": addr.recipient_phone,
                "postalCode":     addr.postal_code,
                "address1":       addr.address1,
                "address2":       addr.address2 or "",
            }
        )
        order_uid = sweetbook_order["data"]["orderUid"]

        # 2. DB 저장
        order = models.Order(
            user_id=current_user.id,
            address_id=req.addressId,
            book_uid=req.bookUid,
            order_uid=order_uid,
            book_title=req.bookTitle,
            record_year=req.recordYear,
            month_count=12,
            total_price=req.totalPrice,
            status="paid",
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        return {
            "success": True,
            "data": {
                "order_id":  order.id,
                "order_uid": order_uid,
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))