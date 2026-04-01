from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))
from bookprintapi import Client
from dotenv import load_dotenv

load_dotenv()
client = Client(api_key=os.getenv("BOOKPRINT_API_KEY"), environment="sandbox")

router = APIRouter()

class Shipping(BaseModel):
    recipientName: str
    recipientPhone: str
    postalCode: str
    address1: str
    address2: Optional[str] = ""
    memo: Optional[str] = ""

class CreateOrderRequest(BaseModel):
    bookUid: str
    quantity: Optional[int] = 1
    shipping: Shipping

class EstimateRequest(BaseModel):
    bookUid: str
    quantity: Optional[int] = 1

@router.post("/estimate")
async def estimate(req: EstimateRequest):
    try:
        result = client.orders.estimate([
            {"bookUid": req.bookUid, "quantity": req.quantity}
        ])
        return {"success": True, "data": result["data"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create")
async def create_order(req: CreateOrderRequest):
    try:
        result = client.orders.create(
            items=[{"bookUid": req.bookUid, "quantity": req.quantity}],
            shipping={
                "recipientName": req.shipping.recipientName,
                "recipientPhone": req.shipping.recipientPhone,
                "postalCode": req.shipping.postalCode,
                "address1": req.shipping.address1,
                "address2": req.shipping.address2,
                "memo": req.shipping.memo,
            }
        )
        return {"success": True, "data": result["data"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_orders():
    try:
        result = client.orders.list()
        return {"success": True, "data": result["data"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{order_uid}")
async def get_order(order_uid: str):
    try:
        result = client.orders.get(order_uid)
        return {"success": True, "data": result["data"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
