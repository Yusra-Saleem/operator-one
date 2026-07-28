"""Dispatch API Router for sending WhatsApp messages and Email invoices/quotes."""

import time
from typing import Literal, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

router = APIRouter(prefix="/dispatch", tags=["Dispatch"])

_dispatch_logs = [
    {
        "id": "DSP-101",
        "channel": "whatsapp",
        "document_type": "Official Receipt",
        "recipient_name": "Fatima Ahmed (Black Dubai Nida Abaya)",
        "recipient_contact": "+92 300 1234567",
        "amount": 22.00,
        "status": "Delivered",
        "time": "10 mins ago",
    },
    {
        "id": "DSP-102",
        "channel": "email",
        "document_type": "Price Quote - Bridal Velvet Set",
        "recipient_name": "Zainab Malik",
        "recipient_contact": "zainab.malik@email.com",
        "amount": 32.00,
        "status": "Sent",
        "time": "1 hour ago",
    },
    {
        "id": "DSP-103",
        "channel": "whatsapp",
        "document_type": "Wholesale Invoice",
        "recipient_name": "Maryam Boutique (50x Scarfs & 30x Caps)",
        "recipient_contact": "+92 321 9876543",
        "amount": 180.00,
        "status": "Delivered",
        "time": "Yesterday",
    },
]


class DispatchRequest(BaseModel):
    channel: Literal["whatsapp", "email"]
    document_type: Literal["quote", "invoice", "payment_reminder", "report"]
    recipient_name: str
    recipient_contact: str  # Phone number for WhatsApp, Email address for Email
    amount: Optional[float] = 0.0
    details: Optional[str] = ""


class DispatchResponse(BaseModel):
    success: bool
    status: str = "success"
    dispatch_id: str
    channel: str
    recipient: str
    document_type: str
    message: str
    timestamp: str


@router.get("/logs")
async def get_dispatch_logs():
    """Retrieve history of dispatched business documents."""
    return _dispatch_logs


@router.post("/send", response_model=DispatchResponse)
async def send_dispatch(payload: DispatchRequest) -> DispatchResponse:
    """Simulate or execute direct dispatch of business documents via WhatsApp or Email."""
    if not payload.recipient_contact.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recipient contact details (phone or email) are required.",
        )

    dispatch_id = f"DSP-{int(time.time())}"
    doc_label = payload.document_type.replace("_", " ").title()

    if payload.channel == "whatsapp":
        msg = f"Successfully dispatched {doc_label} to {payload.recipient_name} via WhatsApp ({payload.recipient_contact})."
    else:
        msg = f"Successfully emailed {doc_label} to {payload.recipient_name} at ({payload.recipient_contact})."

    new_log = {
        "id": dispatch_id,
        "channel": payload.channel,
        "document_type": doc_label,
        "recipient_name": payload.recipient_name,
        "recipient_contact": payload.recipient_contact,
        "amount": payload.amount or 0.0,
        "status": "Sent",
        "time": "Just now",
    }
    _dispatch_logs.insert(0, new_log)

    return DispatchResponse(
        success=True,
        status="success",
        dispatch_id=dispatch_id,
        channel=payload.channel,
        recipient=payload.recipient_contact,
        document_type=payload.document_type,
        message=msg,
        timestamp=time.strftime("%Y-%m-%d %H:%M:%S"),
    )
