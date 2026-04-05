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

class EstimateRequest(BaseModel):
    bookUid: str
    quantity: Optional[int] = 1

class CancelRequest(BaseModel):
    cancelReason: str

class UpdateShippingRequest(BaseModel):
    addressId: int  # Address 테이블 ID

def _addr_to_shipping(addr: models.Address) -> dict:
    return {
        "recipientName":  addr.recipient_name,
        "recipientPhone": addr.recipient_phone,
        "postalCode":     addr.postal_code,
        "address1":       addr.address1,
        "address2":       addr.address2 or "",
    }

def _order_dict(o: models.Order) -> dict:
    estimated_delivery = (o.ordered_at + timedelta(weeks=2)).strftime("%Y-%m-%d")
    addr = None
    if o.address:
        addr = {
            "id":              o.address.id,
            "recipient_name":  o.address.recipient_name,
            "recipient_phone": o.address.recipient_phone,
            "postal_code":     o.address.postal_code,
            "address1":        o.address.address1,
            "address2":        o.address.address2,
        }
    return {
        "id":                o.id,
        "book_uid":          o.book_uid,
        "order_uid":         o.order_uid,
        "book_title":        o.book_title,
        "record_year":       o.record_year,
        "month_count":       o.month_count,
        "total_price":       o.total_price,
        "status":            o.status,
        "cancel_reason":     o.cancel_reason,
        "ordered_at":        o.ordered_at.strftime("%Y-%m-%d %H:%M"),
        "estimated_delivery": estimated_delivery,
        "address":           addr,
    }

@router.post("/estimate")
async def estimate_order(
    req: EstimateRequest,
    current_user: models.User = Depends(get_current_user),
):
    try:
        result = client.orders.estimate([
            {"bookUid": req.bookUid, "quantity": req.quantity}
        ])
        data = result["data"]
        return {
            "success": True,
            "data": {
                "productAmount":    data.get("productAmount", 0),
                "shippingFee":      data.get("shippingFee", 0),
                "packagingFee":     data.get("packagingFee", 0),
                "totalAmount":      data.get("totalAmount", 0),
                "creditBalance":    data.get("creditBalance", 0),
                "creditSufficient": data.get("creditSufficient", True),
                "currency":         data.get("currency", "KRW"),
            }
        }
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
    return {"success": True, "data": [_order_dict(o) for o in orders]}

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

    if order.order_uid:
        try:
            client.orders.cancel(order.order_uid, req.cancelReason)
        except Exception:
            pass

    order.status = "cancelled"
    order.cancel_reason = req.cancelReason
    db.commit()
    return {"success": True, "message": "주문이 취소되었습니다"}

@router.patch("/{order_id}/shipping")
def update_shipping(
    order_id: int,
    req: UpdateShippingRequest,
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
        raise HTTPException(status_code=400, detail="취소된 주문은 배송지를 변경할 수 없습니다")

    # 선택한 배송지 확인
    addr = db.query(models.Address).filter(
        models.Address.id == req.addressId,
        models.Address.user_id == current_user.id
    ).first()
    if not addr:
        raise HTTPException(status_code=404, detail="배송지를 찾을 수 없습니다")

    # Sweetbook 배송지 변경
    if order.order_uid:
        try:
            client.orders.update_shipping(order.order_uid, **{
                "recipient_name":  addr.recipient_name,
                "recipient_phone": addr.recipient_phone,
                "postal_code":     addr.postal_code,
                "address1":        addr.address1,
                "address2":        addr.address2 or "",
            })
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Sweetbook 배송지 변경 실패: {str(e)}")

    # DB 업데이트
    order.address_id = req.addressId
    db.commit()
    return {"success": True, "message": "배송지가 변경되었습니다", "data": _order_dict(order)}