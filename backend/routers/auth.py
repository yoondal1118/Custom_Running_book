from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from database import get_db
import models
from auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter()

class SignupRequest(BaseModel):
    username: str
    name: str
    email: str
    password: str
    password_confirm: str
    address: Optional[str] = ""
    address_detail: Optional[str] = ""
    postal_code: Optional[str] = ""
    phone: Optional[str] = ""

class LoginRequest(BaseModel):
    username: str
    password: str

class UpdateUserRequest(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None
    password_confirm: Optional[str] = None
    address: Optional[str] = None
    address_detail: Optional[str] = None
    postal_code: Optional[str] = None
    phone: Optional[str] = None

@router.post("/signup")
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    if req.password != req.password_confirm:
        raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않습니다")

    if db.query(models.User).filter(models.User.username == req.username).first():
        raise HTTPException(status_code=400, detail="이미 사용 중인 아이디입니다")

    if db.query(models.User).filter(models.User.email == req.email).first():
        raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다")

    user = models.User(
        username=req.username,
        name=req.name,
        email=req.email,
        hashed_password=hash_password(req.password),
        address=req.address,
        address_detail=req.address_detail,
        postal_code=req.postal_code,
        phone=req.phone,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id})
    return {
        "success": True,
        "message": "회원가입 완료",
        "data": {
            "token": token,
            "user": _user_dict(user)
        }
    }

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == req.username).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 올바르지 않습니다")

    token = create_access_token({"sub": user.id})
    return {
        "success": True,
        "message": "로그인 성공",
        "data": {
            "token": token,
            "user": _user_dict(user)
        }
    }

@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    return {"success": True, "data": _user_dict(current_user)}

@router.patch("/me")
def update_me(
    req: UpdateUserRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.email:
        existing = db.query(models.User).filter(
            models.User.email == req.email,
            models.User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="이미 사용 중인 이메일입니다")
        current_user.email = req.email

    if req.password:
        if req.password != req.password_confirm:
            raise HTTPException(status_code=400, detail="비밀번호가 일치하지 않습니다")
        current_user.hashed_password = hash_password(req.password)

    if req.address is not None:
        current_user.address = req.address
    if req.address_detail is not None:
        current_user.address_detail = req.address_detail
    if req.postal_code is not None:
        current_user.postal_code = req.postal_code
    if req.phone is not None:
        current_user.phone = req.phone

    db.commit()
    db.refresh(current_user)
    return {"success": True, "message": "정보가 수정되었습니다", "data": _user_dict(current_user)}

def _user_dict(user: models.User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "name": user.name,
        "email": user.email,
        "address": user.address,
        "address_detail": user.address_detail,
        "postal_code": user.postal_code,
        "phone": user.phone,
    }
