from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from database import get_db
from auth import get_current_user
import models, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
from bookprintapi import Client
from dotenv import load_dotenv

load_dotenv()
client = Client(api_key=os.getenv("BOOKPRINT_API_KEY"), environment="sandbox")

router = APIRouter()

class CreateOrderRequest(BaseModel):
    bookUid: str
    quantity: Optional[int] = 1

class CancelRequest(BaseModel):
    cancelReason: str

@router.post("/create")
async def create_order(
    req: CreateOrderRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        result = client.orders.create(
            items=[{"bookUid": req.bookUid, "quantity": req.quantity}],
            shipping={
                "recipientName": current_user.name,
                "recipientPhone": current_user.phone or "",
                "postalCode": current_user.postal_code or "",
                "address1": current_user.address or "",
                "address2": current_user.address_detail or "",
            }
        )
        order_uid = result["data"]["orderUid"]

        # DB 주문에 order_uid 업데이트
        db_order = db.query(models.Order).filter(
            models.Order.book_uid == req.bookUid,
            models.Order.user_id == current_user.id
        ).first()
        if db_order:
            db_order.order_uid = order_uid
            db.commit()

        return {"success": True, "data": result["data"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my")
def my_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.query(models.Order).filter(
        models.Order.user_id == current_user.id
    ).order_by(models.Order.ordered_at.desc()).all()

    result = []
    for o in orders:
        estimated_delivery = (o.ordered_at + timedelta(weeks=2)).strftime("%Y-%m-%d")
        result.append({
            "id": o.id,
            "book_uid": o.book_uid,
            "order_uid": o.order_uid,
            "book_title": o.book_title,
            "record_year": o.record_year,
            "month_count": o.month_count,
            "total_price": o.total_price,
            "status": o.status,
            "cancel_reason": o.cancel_reason,
            "ordered_at": o.ordered_at.strftime("%Y-%m-%d %H:%M"),
            "estimated_delivery": estimated_delivery,
        })
    return {"success": True, "data": result}

@router.post("/{order_id}/cancel")
def cancel_order(
    order_id: int,
    req: CancelRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    order = db.query(models.Order).filter(
        models.Order.id == order_id,
        models.Order.user_id == current_user.id
    ).first()

    if not order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다")
    if order.status == "cancelled":
        raise HTTPException(status_code=400, detail="이미 취소된 주문입니다")

    # Sweetbook API 취소 시도
    if order.order_uid:
        try:
            client.orders.cancel(order.order_uid, req.cancelReason)
        except Exception:
            pass  # Sandbox에서 이미 처리된 경우 무시

    order.status = "cancelled"
    order.cancel_reason = req.cancelReason
    db.commit()

    return {"success": True, "message": "주문이 취소되었습니다"}
