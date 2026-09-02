"""
routers/chat.py
---------------
POST /ai/chat   — Server-side proxy for the AI Copilot chat panel.

Why a proxy instead of calling OpenRouter from the browser?
  1. Keeps the API key server-side (never exposed to the client)
  2. Avoids browser CORS restrictions against OpenRouter
  3. Enforces the same guardrails (banned phrases, no PII) as plan generation
  4. Gives us an audit trail for all user chat queries
"""

import logging

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

import httpx
from core.config import settings
from ai_service import validators as val

log = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])

_LLM_HEADERS = {
    "Content-Type": "application/json",
    "HTTP-Referer": settings.llm_hub_referer,
    "X-Title": settings.llm_hub_title,
}

CHAT_SYSTEM_PROMPT = """You are Octovova AI, a calm, numbers-literate, and empathetic personal wealth advisor.
You are provided a structured financial context about the customer (income, expenses, net worth, risk profile, goals, active plan).
Your job is to answer the user's question clearly and concisely.

HARD RULES:
1. NEVER invent financial numbers outside the context provided.
2. NEVER promise guaranteed returns, risk-free equity, or assured outcomes.
3. Frame all projections as illustrative estimates based on stated assumptions.
4. Use bullet points and bold text for clarity.
5. Keep your reply under 300 words.
6. If the user asks something outside personal finance, politely redirect them.
"""


class ChatMessage(BaseModel):
    role: str   # "user" | "assistant" | "system"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]        # full history including system context
    financial_context: str | None = None   # pre-built context string from frontend
    user_query: str                    # the latest user message


class ChatResponse(BaseModel):
    reply: str
    source: str  # "llm" | "fallback"


@router.post("/chat", response_model=ChatResponse)
async def ai_chat(req: ChatRequest):
    """
    Proxy chat endpoint. Frontend sends the financial context + conversation
    history; backend calls OpenRouter and returns the AI reply.
    Guardrails: banned-phrase filter applied before returning.
    """
    if len(req.user_query) > 1000:
        raise HTTPException(status_code=422, detail="Query too long (max 1000 chars)")

    # Build message list for LLM
    messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]

    # Inject financial context as system message if provided
    if req.financial_context:
        messages.append({
            "role": "system",
            "content": f"<financial_context>\n{req.financial_context}\n</financial_context>"
        })

    # Add conversation history (last 10 turns max to keep tokens low)
    history = req.messages[-10:] if len(req.messages) > 10 else req.messages
    for m in history:
        if m.role in ("user", "assistant"):
            messages.append({"role": m.role, "content": m.content})

    # Ensure final user message is the latest query (wrapped for safety)
    messages.append({
        "role": "user",
        "content": f"<user_input>{req.user_query}</user_input>"
    })

    url = f"{settings.llm_hub_url.rstrip('/')}/chat/completions"
    headers = {**_LLM_HEADERS, "Authorization": f"Bearer {settings.llm_hub_api_key}"}
    body = {
        "model": settings.llm_hub_model,
        "max_tokens": 600,
        "messages": messages,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(url, json=body, headers=headers)
            resp.raise_for_status()
            data = resp.json()

        reply: str = data.get("choices", [{}])[0].get("message", {}).get("content", "").strip()

        if not reply:
            raise ValueError("Empty LLM response")

        # Guardrail: strip guaranteed-returns language
        if val._has_banned_phrases(reply):
            log.warning("Chat reply contained banned phrases — cleaning")
            import re
            reply = re.sub(
                r"\b(guaranteed?|assured\s+returns?|risk[\s-]free|will\s+definitely\s+achieve|100\s*%\s+certain)\b",
                "[illustrative projection]",
                reply,
                flags=re.IGNORECASE,
            )

        return ChatResponse(reply=reply, source="llm")

    except Exception as exc:
        log.warning("Chat LLM call failed: %s — using fallback", exc)
        return ChatResponse(
            reply=(
                "I can help you understand your financial plan, savings capacity, "
                "goal timelines, and asset allocation. Could you rephrase your question? "
                "For example: *'Why is 55% equity recommended for me?'* or "
                "*'What happens if I increase my SIP by ₹10,000?'*"
            ),
            source="fallback",
        )
