"""
routers/customers.py
--------------------
POST /customers
GET  /customers/{id}/networth
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import get_current_user
from db.session import get_db
from services import customer_service as cs
from services import financial_data_service as fds

router = APIRouter(prefix="/customers", tags=["customers"])


class CreateCustomerRequest(BaseModel):
    name: str
    age: int


class CreateCustomerResponse(BaseModel):
    customer_id: str
    name: str


@router.post("", response_model=CreateCustomerResponse, status_code=201)
async def create_customer(
    req: CreateCustomerRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    customer_id = current_user["customer_id"]
    customer = await cs.update_customer_profile(db, customer_id, req.name, req.age)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    await db.commit()
    return CreateCustomerResponse(customer_id=customer.customer_id, name=customer.name)


@router.get("/{customer_id}/networth")
async def get_networth(
    customer_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _assert_owns(current_user, customer_id)
    return await fds.get_financial_snapshot(db, customer_id)


def _assert_owns(current_user: dict, customer_id: str):
    if current_user["customer_id"] != customer_id:
        raise HTTPException(status_code=403, detail="Access denied")
