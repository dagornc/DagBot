"""DagBot — Conversations router.

CRUD endpoints for conversation management.
"""

from fastapi import APIRouter, HTTPException

from ..models import ConversationCreate, ConversationUpdate, ConversationResponse, ConversationDetailResponse
from .. import database

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("")
async def list_conversations() -> list[ConversationResponse]:
    """List all conversations ordered by most recent."""
    convs = await database.list_conversations()
    return [ConversationResponse(**c) for c in convs]  # type: ignore[arg-type]


@router.post("", status_code=201)
async def create_conversation(body: ConversationCreate) -> ConversationResponse:
    """Create a new conversation.

    Args:
        body: ConversationCreate with optional title and system_prompt.

    Returns:
        Created conversation with generated ID.
    """
    conv = await database.create_conversation(
        title=body.title or "New Chat",
        system_prompt=body.system_prompt,
    )
    return ConversationResponse(
        id=conv["id"],
        title=conv["title"],
        system_prompt=conv.get("system_prompt"),
        created_at=conv["created_at"],
        updated_at=conv["updated_at"],
    )


@router.get("/{conv_id}")
async def get_conversation(conv_id: str) -> ConversationDetailResponse:
    """Get a conversation with all its messages.

    Args:
        conv_id: Conversation UUID hex.

    Returns:
        Full conversation with messages.

    Raises:
        HTTPException: 404 if conversation not found.
    """
    conv = await database.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return ConversationDetailResponse(**conv)  # type: ignore[arg-type]


@router.patch("/{conv_id}")
async def update_conversation(conv_id: str, body: ConversationUpdate) -> dict[str, str]:
    """Update a conversation's title or system prompt.

    Args:
        conv_id: Conversation UUID hex.
        body: Fields to update.

    Returns:
        Success confirmation.

    Raises:
        HTTPException: 404 if not found.
    """
    updated = await database.update_conversation(
        conv_id,
        title=body.title,
        system_prompt=body.system_prompt,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "updated"}


@router.delete("/{conv_id}")
async def delete_conversation(conv_id: str) -> dict[str, str]:
    """Delete a conversation and all its messages.

    Args:
        conv_id: Conversation UUID hex.

    Returns:
        Success confirmation.

    Raises:
        HTTPException: 404 if not found.
    """
    deleted = await database.delete_conversation(conv_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"status": "deleted"}
