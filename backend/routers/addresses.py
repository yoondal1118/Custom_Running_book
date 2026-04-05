from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
from auth import get_current_user
import models

router = APIRouter()

class AddressRequest(BaseModel):
    recipient_name:  str
    recipient_phone: str
    postal_code:     str
    address1:        str
    address2:        Optional[str] = ""
    is_default:      Optional[bool] = False

def _addr_dict(addr: models.Address) -> dict:
    return {
        "id":              addr.id,
        "recipient_name":  addr.recipient_name,
        "recipient_phone": addr.recipient_phone,
        "postal_code":     addr.postal_code,
        "address1":        addr.address1,
        "address2":        addr.address2,
        "is_default":      addr.is_default,
    }

@router.get("")
def list_addresses(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    addrs = db.query(models.Address).filter(
        models.Address.user_id == current_user.id
    ).order_by(models.Address.is_default.desc(), models.Address.created_at.desc()).all()
    return {"success": True, "data": [_addr_dict(a) for a in addrs]}

@router.post("")
def add_address(
    req: AddressRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 기본 배송지로 설정 시 기존 기본 배송지 해제
    if req.is_default:
        db.query(models.Address).filter(
            models.Address.user_id == current_user.id,
            models.Address.is_default == True
        ).update({"is_default": False})

    addr = models.Address(
        user_id=current_user.id,
        recipient_name=req.recipient_name,
        recipient_phone=req.recipient_phone,
        postal_code=req.postal_code,
        address1=req.address1,
        address2=req.address2 or "",
        is_default=req.is_default,
    )
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return {"success": True, "data": _addr_dict(addr)}

@router.patch("/{address_id}/default")
def set_default(
    address_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    addr = db.query(models.Address).filter(
        models.Address.id == address_id,
        models.Address.user_id == current_user.id
    ).first()
    if not addr:
        raise HTTPException(status_code=404, detail="배송지를 찾을 수 없습니다")

    # 기존 기본 배송지 해제
    db.query(models.Address).filter(
        models.Address.user_id == current_user.id,
        models.Address.is_default == True
    ).update({"is_default": False})

    addr.is_default = True
    db.commit()
    return {"success": True, "message": "기본 배송지가 변경되었습니다"}

@router.delete("/{address_id}")
def delete_address(
    address_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    addr = db.query(models.Address).filter(
        models.Address.id == address_id,
        models.Address.user_id == current_user.id
    ).first()
    if not addr:
        raise HTTPException(status_code=404, detail="배송지를 찾을 수 없습니다")
    db.delete(addr)
    db.commit()
    return {"success": True, "message": "배송지가 삭제되었습니다"}