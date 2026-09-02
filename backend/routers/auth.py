"""
routers/auth.py
---------------
POST /auth/register
POST /auth/login
"""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import create_access_token, verify_password
from db.session import get_db
from services import customer_service as cs

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    token: str
    customer_id: str


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await cs.get_customer_by_email(db, req.email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")
    if len(req.password) < 8:
        raise HTTPException(status_code=422, detail="Password must be at least 8 characters")

    customer = await cs.create_customer(db, req.email, req.password)
    await db.commit()
    token = create_access_token(customer.customer_id, customer.email)
    return TokenResponse(token=token, customer_id=customer.customer_id)


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    customer = await cs.get_customer_by_email(db, req.email)
    if not customer or not verify_password(req.password, customer.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(customer.customer_id, customer.email)
    return TokenResponse(token=token, customer_id=customer.customer_id)
