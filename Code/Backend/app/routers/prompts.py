"""DagBot — Prompts router.

CRUD endpoints for the Prompt Library (Promptothèque).
"""

from fastapi import APIRouter, HTTPException

from ..models import PromptCreate, PromptUpdate, PromptResponse
from .. import database

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


@router.get("")
async def list_prompts() -> list[PromptResponse]:
    """List all saved prompts ordered by most recent.

    Returns:
        List of saved prompts.
    """
    prompts = await database.list_prompts()
    return [PromptResponse(**p) for p in prompts]  # type: ignore[arg-type]


@router.post("", status_code=201)
async def create_prompt(body: PromptCreate) -> PromptResponse:
    """Create a new saved prompt.

    Args:
        body: Prompt data with title, content, category, tags.

    Returns:
        Created prompt with generated ID.
    """
    prompt = await database.create_prompt(
        title=body.title,
        content=body.content,
        category=body.category,
        tags=body.tags,
        is_favorite=body.is_favorite,
    )
    return PromptResponse(**prompt)  # type: ignore[arg-type]


@router.put("/{prompt_id}")
async def update_prompt(prompt_id: str, body: PromptUpdate) -> dict[str, str]:
    """Update an existing saved prompt.

    Args:
        prompt_id: Prompt UUID hex.
        body: Fields to update.

    Returns:
        Success confirmation.

    Raises:
        HTTPException: 404 if not found.
    """
    updated = await database.update_prompt(
        prompt_id,
        title=body.title,
        content=body.content,
        category=body.category,
        tags=body.tags,
        is_favorite=body.is_favorite,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return {"status": "updated"}


@router.delete("/{prompt_id}")
async def delete_prompt(prompt_id: str) -> dict[str, str]:
    """Delete a saved prompt.

    Args:
        prompt_id: Prompt UUID hex.

    Returns:
        Success confirmation.

    Raises:
        HTTPException: 404 if not found.
    """
    deleted = await database.delete_prompt(prompt_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Prompt not found")
    return {"status": "deleted"}
