"""Agent SDK tool for sending WhatsApp messages and Email invoices/quotes."""

import os
import smtplib
from email.mime.text import MIMEText
from typing import Any
from pydantic import BaseModel, Field
from app.agent.tools.base import BaseTool, ToolMetadata
from app.agent.tools.registry import register_tool
from app.core.logger import logger


@register_tool
class DispatchTool(BaseTool):
    metadata = ToolMetadata(
        name="dispatch_tool",
        description="Send business documents (quotes, invoices, reminders) to clients via WhatsApp or Email.",
    )

    class InputModel(BaseModel):
        channel: str = Field(default="whatsapp")
        document_type: str = Field(default="quote")
        recipient_name: str = Field(default="Valued Client")
        recipient_contact: str = Field(default="+923001234567")
        amount: float = Field(default=0.0)
        details: str = Field(default="")

    class OutputModel(BaseModel):
        status: str
        channel: str
        document_type: str
        recipient_name: str
        recipient_contact: str
        amount: float
        delivered_live: bool
        message: str

    async def execute(self, inputs: InputModel) -> OutputModel:
        res = self.run(
            channel=inputs.channel,
            document_type=inputs.document_type,
            recipient_name=inputs.recipient_name,
            recipient_contact=inputs.recipient_contact,
            amount=inputs.amount,
            details=inputs.details,
        )
        return self.OutputModel(**res)

    def run(
        self,
        channel: str = "whatsapp",
        document_type: str = "quote",
        recipient_name: str = "Valued Client",
        recipient_contact: str = "+923001234567",
        amount: float = 0.0,
        details: str = "",
    ) -> dict[str, Any]:
        doc_label = document_type.replace("_", " ").title()
        delivered_live = False

        if channel.lower() in ["email", "mail"]:
            smtp_host = os.getenv("SMTP_HOST")
            smtp_port = int(os.getenv("SMTP_PORT", "587"))
            smtp_user = os.getenv("SMTP_USER")
            smtp_pass = os.getenv("SMTP_PASSWORD")

            if smtp_host and smtp_user and smtp_pass:
                try:
                    msg = MIMEText(f"Hello {recipient_name},\n\nPlease find your {doc_label} attached.\nAmount: ${amount:,.2f}\nDetails: {details}\n\nBest regards,\nOperation One")
                    msg["Subject"] = f"Operation One - {doc_label}"
                    msg["From"] = smtp_user
                    msg["To"] = recipient_contact

                    with smtplib.SMTP(smtp_host, smtp_port) as server:
                        server.starttls()
                        server.login(smtp_user, smtp_pass)
                        server.send_message(msg)
                    delivered_live = True
                    logger.info("Sent live email via SMTP to %s", recipient_contact)
                except Exception:
                    logger.exception("Failed to send live email via SMTP, falling back to simulated output.")

            msg = f"📧 Sent {doc_label} (${amount:,.2f}) to {recipient_name} via Email ({recipient_contact})." + (" [Live SMTP]" if delivered_live else " [Simulated Dispatch]")
        else:
            msg = f"✅ Sent {doc_label} (${amount:,.2f}) to {recipient_name} via WhatsApp ({recipient_contact}). [Simulated Dispatch]"

        return {
            "status": "success",
            "channel": channel,
            "document_type": document_type,
            "recipient_name": recipient_name,
            "recipient_contact": recipient_contact,
            "amount": amount,
            "delivered_live": delivered_live,
            "message": msg,
        }
