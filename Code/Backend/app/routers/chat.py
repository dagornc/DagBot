"""DagBot — Chat router with SSE streaming.

Provides the main chat endpoint that streams LLM responses via Server-Sent Events.
"""

import json
import logging
from typing import AsyncGenerator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage

from ..models import ChatRequest
from ..provider_factory import create_chat_model, get_provider_config
from .. import database
from ..config import get_config

logger = logging.getLogger("dagbot.chat")
router = APIRouter(prefix="/api/chat", tags=["chat"])


def _build_langchain_messages(
    messages: list,
    system_prompt: str | None = None,
) -> list:
    """Convert ChatMessage list to LangChain message objects.

    Args:
        messages: List of ChatMessage pydantic models.
        system_prompt: Optional system prompt to prepend.

    Returns:
        List of LangChain message objects.
    """
    lc_messages = []

    if system_prompt:
        lc_messages.append(SystemMessage(content=system_prompt))

    for msg in messages:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        elif msg.role == "assistant":
            lc_messages.append(AIMessage(content=msg.content))
        elif msg.role == "system":
            # System messages usually expect string content in many models, 
            # but we pass through if supported.
            lc_messages.append(SystemMessage(content=msg.content))

    return lc_messages


async def _stream_chat(request: ChatRequest) -> AsyncGenerator[str, None]:
    """Generate SSE events from LLM streaming response.

    Args:
        request: The chat request with provider, model, messages, etc.

    Yields:
        SSE-formatted strings with token data or error events.
    """
    provider_config = await get_provider_config(request.provider)
    if not provider_config:
        yield f"data: {json.dumps({'error': f'Provider {request.provider} not found'})}\n\n"
        return

    config = get_config()
    defaults = config.defaults

    temperature = request.temperature if request.temperature is not None else float(defaults.get("temperature", 0.7))
    top_p = request.top_p if request.top_p is not None else float(defaults.get("top_p", 1.0))
    max_tokens = request.max_tokens if request.max_tokens is not None else int(defaults.get("max_tokens", 4096))

    try:
        llm = create_chat_model(
            base_url=provider_config["base_url"],
            api_key=provider_config["api_key"],
            model=request.model,
            temperature=temperature,
            top_p=top_p,
            max_tokens=max_tokens,
            presence_penalty=request.presence_penalty or 0.0,
            frequency_penalty=request.frequency_penalty or 0.0,
        )

        lc_messages = _build_langchain_messages(request.messages, request.system_prompt)

        # Auto-create conversation if needed
        conv_id = request.conversation_id
        if not conv_id:
            first_user_msg = next((m.content for m in request.messages if m.role == "user"), "New Chat")
            title = first_user_msg[:50] + ("..." if len(first_user_msg) > 50 else "")
            conv = await database.create_conversation(title=title, system_prompt=request.system_prompt)
            conv_id = conv["id"]
            yield f"data: {json.dumps({'type': 'conversation_id', 'id': conv_id})}\n\n"

        # Save user message
        last_user_msg = next((m for m in reversed(request.messages) if m.role == "user"), None)
        if last_user_msg:
            await database.add_message(
                conversation_id=conv_id,
                role="user",
                content=last_user_msg.content,
            )

        # Stream LLM response
        full_response = ""
        async for chunk in llm.astream(lc_messages):
            token = chunk.content
            if token:
                full_response += token
                yield f"data: {json.dumps({'type': 'token', 'content': token})}\n\n"

        # Save assistant message
        await database.add_message(
            conversation_id=conv_id,
            role="assistant",
            content=full_response,
            provider=request.provider,
            model=request.model,
        )

        yield f"data: {json.dumps({'type': 'done', 'conversation_id': conv_id})}\n\n"

    except Exception as exc:
        logger.exception("Chat stream error: %s", exc)
        yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"


@router.post("")
async def chat_stream(request: ChatRequest) -> StreamingResponse:
    """Stream a chat response via Server-Sent Events.

    Args:
        request: ChatRequest with provider, model, messages, and options.

    Returns:
        StreamingResponse with text/event-stream content type.
    """
    return StreamingResponse(
        _stream_chat(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
