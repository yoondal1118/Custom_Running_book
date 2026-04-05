from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id               = Column(Integer, primary_key=True, index=True)
    username         = Column(String, unique=True, index=True, nullable=False)
    name             = Column(String, nullable=False)
    email            = Column(String, unique=True, index=True, nullable=False)
    hashed_password  = Column(String, nullable=False)
    phone            = Column(String, nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())

    addresses = relationship("Address", back_populates="user", cascade="all, delete-orphan")
    orders    = relationship("Order", back_populates="user")


class Address(Base):
    __tablename__ = "addresses"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=False)
    recipient_name  = Column(String, nullable=False)
    recipient_phone = Column(String, nullable=False)
    postal_code     = Column(String, nullable=False)
    address1        = Column(String, nullable=False)
    address2        = Column(String, nullable=True)
    is_default      = Column(Boolean, default=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    user   = relationship("User", back_populates="addresses")
    orders = relationship("Order", back_populates="address")


class Order(Base):
    __tablename__ = "orders"

    id            = Column(Integer, primary_key=True, index=True)
    user_id       = Column(Integer, ForeignKey("users.id"), nullable=False)
    address_id    = Column(Integer, ForeignKey("addresses.id"), nullable=True)
    book_uid      = Column(String, nullable=False)
    order_uid     = Column(String, nullable=True)
    book_title    = Column(String, nullable=True)
    record_year   = Column(Integer, nullable=True)
    month_count   = Column(Integer, nullable=True)
    total_price   = Column(Integer, nullable=True)
    status        = Column(String, default="paid")
    cancel_reason = Column(Text, nullable=True)
    ordered_at    = Column(DateTime(timezone=True), server_default=func.now())

    user    = relationship("User", back_populates="orders")
    address = relationship("Address", back_populates="orders")