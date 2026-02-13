"""DagBot — SQLite database layer using aiosqlite.

Provides async CRUD operations for conversations, messages, prompts, and providers.
"""

import json
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import aiosqlite

from .config import get_config

_db_path: str = ""


def _now_iso() -> str:
    """Return current UTC time in ISO format."""
    return datetime.now(timezone.utc).isoformat()


def _new_id() -> str:
    """Generate a new UUID hex string."""
    return uuid.uuid4().hex


async def init_db() -> None:
    """Initialize the database and create tables if they don't exist."""
    global _db_path
    _db_path = get_config().database_path

    async with aiosqlite.connect(_db_path) as db:
        await db.executescript("""
            CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL DEFAULT 'New Chat',
                system_prompt TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT NOT NULL,
                role TEXT NOT NULL,
                content TEXT NOT NULL,
                provider TEXT,
                model TEXT,
                created_at TEXT NOT NULL,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS prompts (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'General',
                tags TEXT NOT NULL DEFAULT '[]',
                is_favorite INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS custom_providers (
                name TEXT PRIMARY KEY,
                display_name TEXT NOT NULL,
                base_url TEXT NOT NULL,
                api_key TEXT NOT NULL DEFAULT '',
                default_model TEXT NOT NULL DEFAULT '',
                access_method TEXT NOT NULL DEFAULT 'openai_compatible',
                icon TEXT NOT NULL DEFAULT 'settings',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_messages_conversation
                ON messages(conversation_id);
            CREATE INDEX IF NOT EXISTS idx_prompts_category
                ON prompts(category);
        """)
        await db.commit()


def _get_db_path() -> str:
    """Return the database file path."""
    return _db_path


# --- Conversation CRUD ---

async def create_conversation(
    title: str = "New Chat",
    system_prompt: Optional[str] = None,
) -> Dict[str, str]:
    """Create a new conversation.

    Args:
        title: Conversation title.
        system_prompt: Optional system prompt.

    Returns:
        Dictionary with conversation fields.
    """
    conv_id = _new_id()
    now = _now_iso()
    async with aiosqlite.connect(_db_path) as db:
        await db.execute(
            "INSERT INTO conversations (id, title, system_prompt, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
            (conv_id, title, system_prompt, now, now),
        )
        await db.commit()
    return {"id": conv_id, "title": title, "system_prompt": system_prompt or "", "created_at": now, "updated_at": now}


async def list_conversations() -> List[Dict[str, object]]:
    """Return all conversations ordered by most recent.

    Returns:
        List of conversation dictionaries with preview and message count.
    """
    async with aiosqlite.connect(_db_path) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("""
            SELECT c.*,
                   (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as preview,
                   (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
            FROM conversations c
            ORDER BY c.updated_at DESC
        """)
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"],
                "title": row["title"],
                "system_prompt": row["system_prompt"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
                "preview": (row["preview"] or "")[:100],
                "message_count": row["message_count"],
            }
            for row in rows
        ]


async def get_conversation(conv_id: str) -> Optional[Dict[str, object]]:
    """Get a single conversation with its messages.

    Args:
        conv_id: Conversation UUID hex.

    Returns:
        Conversation dict with messages list, or None if not found.
    """
    async with aiosqlite.connect(_db_path) as db:
        db.row_factory = aiosqlite.Row

        cursor = await db.execute("SELECT * FROM conversations WHERE id = ?", (conv_id,))
        conv = await cursor.fetchone()
        if not conv:
            return None

        msg_cursor = await db.execute(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
            (conv_id,),
        )
        messages = await msg_cursor.fetchall()

        return {
            "id": conv["id"],
            "title": conv["title"],
            "system_prompt": conv["system_prompt"],
            "created_at": conv["created_at"],
            "updated_at": conv["updated_at"],
            "messages": [
                {
                    "id": m["id"],
                    "conversation_id": m["conversation_id"],
                    "role": m["role"],
                    "content": m["content"],
                    "provider": m["provider"],
                    "model": m["model"],
                    "created_at": m["created_at"],
                }
                for m in messages
            ],
        }


async def update_conversation(conv_id: str, title: Optional[str] = None, system_prompt: Optional[str] = None) -> bool:
    """Update a conversation's title or system prompt.

    Args:
        conv_id: Conversation UUID hex.
        title: New title (optional).
        system_prompt: New system prompt (optional).

    Returns:
        True if updated, False if not found.
    """
    updates: List[str] = []
    params: List[object] = []
    if title is not None:
        updates.append("title = ?")
        params.append(title)
    if system_prompt is not None:
        updates.append("system_prompt = ?")
        params.append(system_prompt)
    if not updates:
        return False

    updates.append("updated_at = ?")
    params.append(_now_iso())
    params.append(conv_id)

    async with aiosqlite.connect(_db_path) as db:
        cursor = await db.execute(
            f"UPDATE conversations SET {', '.join(updates)} WHERE id = ?",
            params,
        )
        await db.commit()
        return cursor.rowcount > 0


async def delete_conversation(conv_id: str) -> bool:
    """Delete a conversation and all its messages.

    Args:
        conv_id: Conversation UUID hex.

    Returns:
        True if deleted, False if not found.
    """
    async with aiosqlite.connect(_db_path) as db:
        await db.execute("DELETE FROM messages WHERE conversation_id = ?", (conv_id,))
        cursor = await db.execute("DELETE FROM conversations WHERE id = ?", (conv_id,))
        await db.commit()
        return cursor.rowcount > 0


# --- Message CRUD ---

async def add_message(
    conversation_id: str,
    role: str,
    content: str | List[Dict[str, Any]],
    provider: Optional[str] = None,
    model: Optional[str] = None,
) -> Dict[str, str]:
    """Add a message to a conversation.

    Args:
        conversation_id: Parent conversation ID.
        role: Message role ('user', 'assistant', 'system').
        content: Message content (str or list of parts).
        provider: LLM provider used (for assistant messages).
        model: Model used (for assistant messages).

    Returns:
        Dictionary with message fields.
    """
    msg_id = _new_id()
    now = _now_iso()
    
    # Serialize content if it's a list (multimodal)
    db_content = content
    if not isinstance(content, str):
        db_content = json.dumps(content)
        
    async with aiosqlite.connect(_db_path) as db:
        await db.execute(
            "INSERT INTO messages (id, conversation_id, role, content, provider, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (msg_id, conversation_id, role, db_content, provider, model, now),
        )
        await db.execute(
            "UPDATE conversations SET updated_at = ? WHERE id = ?",
            (now, conversation_id),
        )
        await db.commit()
    return {"id": msg_id, "conversation_id": conversation_id, "role": role, "content": content, "created_at": now}


# --- Prompt CRUD ---

async def create_prompt(
    title: str,
    content: str,
    category: str = "General",
    tags: Optional[List[str]] = None,
    is_favorite: bool = False,
) -> Dict[str, object]:
    """Create a new saved prompt.

    Args:
        title: Prompt title.
        content: System prompt content.
        category: Category tag.
        tags: Optional tags list.
        is_favorite: Favorite flag.

    Returns:
        Dictionary with prompt fields.
    """
    prompt_id = _new_id()
    now = _now_iso()
    tags_json = json.dumps(tags or [])
    async with aiosqlite.connect(_db_path) as db:
        await db.execute(
            "INSERT INTO prompts (id, title, content, category, tags, is_favorite, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (prompt_id, title, content, category, tags_json, int(is_favorite), now, now),
        )
        await db.commit()
    return {
        "id": prompt_id, "title": title, "content": content,
        "category": category, "tags": tags or [], "is_favorite": is_favorite,
        "created_at": now, "updated_at": now,
    }


async def list_prompts() -> List[Dict[str, object]]:
    """Return all saved prompts ordered by most recent.

    Returns:
        List of prompt dictionaries.
    """
    async with aiosqlite.connect(_db_path) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM prompts ORDER BY updated_at DESC")
        rows = await cursor.fetchall()
        return [
            {
                "id": row["id"], "title": row["title"], "content": row["content"],
                "category": row["category"], "tags": json.loads(row["tags"]),
                "is_favorite": bool(row["is_favorite"]),
                "created_at": row["created_at"], "updated_at": row["updated_at"],
            }
            for row in rows
        ]


async def update_prompt(prompt_id: str, **kwargs: object) -> bool:
    """Update a saved prompt.

    Args:
        prompt_id: Prompt UUID hex.
        **kwargs: Fields to update (title, content, category, tags, is_favorite).

    Returns:
        True if updated, False if not found.
    """
    updates: List[str] = []
    params: List[object] = []

    for field in ("title", "content", "category"):
        if field in kwargs and kwargs[field] is not None:
            updates.append(f"{field} = ?")
            params.append(kwargs[field])

    if "tags" in kwargs and kwargs["tags"] is not None:
        updates.append("tags = ?")
        params.append(json.dumps(kwargs["tags"]))

    if "is_favorite" in kwargs and kwargs["is_favorite"] is not None:
        updates.append("is_favorite = ?")
        params.append(int(kwargs["is_favorite"]))  # type: ignore[arg-type]

    if not updates:
        return False

    updates.append("updated_at = ?")
    params.append(_now_iso())
    params.append(prompt_id)

    async with aiosqlite.connect(_db_path) as db:
        cursor = await db.execute(
            f"UPDATE prompts SET {', '.join(updates)} WHERE id = ?",
            params,
        )
        await db.commit()
        return cursor.rowcount > 0


async def delete_prompt(prompt_id: str) -> bool:
    """Delete a saved prompt.

    Args:
        prompt_id: Prompt UUID hex.

    Returns:
        True if deleted, False if not found.
    """
    async with aiosqlite.connect(_db_path) as db:
        cursor = await db.execute("DELETE FROM prompts WHERE id = ?", (prompt_id,))
        await db.commit()
        return cursor.rowcount > 0


# --- Custom Provider CRUD ---

async def save_custom_provider(
    name: str,
    display_name: str,
    base_url: str,
    api_key: str = "",
    default_model: str = "",
    access_method: str = "openai_compatible",
    icon: str = "settings",
) -> Dict[str, str]:
    """Save or update a custom provider.

    Args:
        name: Unique provider key.
        display_name: Human-readable name.
        base_url: API base URL.
        api_key: API key.
        default_model: Default model name.
        access_method: API compatibility type.
        icon: Icon identifier.

    Returns:
        Dictionary with provider fields.
    """
    now = _now_iso()
    async with aiosqlite.connect(_db_path) as db:
        await db.execute(
            """INSERT INTO custom_providers (name, display_name, base_url, api_key, default_model, access_method, icon, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT(name) DO UPDATE SET
                   display_name = excluded.display_name,
                   base_url = excluded.base_url,
                   api_key = excluded.api_key,
                   default_model = excluded.default_model,
                   access_method = excluded.access_method,
                   icon = excluded.icon,
                   updated_at = excluded.updated_at""",
            (name, display_name, base_url, api_key, default_model, access_method, icon, now, now),
        )
        await db.commit()
    return {"name": name, "display_name": display_name, "base_url": base_url, "created_at": now, "updated_at": now}


async def list_custom_providers() -> List[Dict[str, str]]:
    """Return all custom providers.

    Returns:
        List of provider dictionaries.
    """
    async with aiosqlite.connect(_db_path) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute("SELECT * FROM custom_providers ORDER BY created_at ASC")
        rows = await cursor.fetchall()
        return [
            {
                "name": row["name"], "display_name": row["display_name"],
                "base_url": row["base_url"], "api_key": row["api_key"],
                "default_model": row["default_model"], "access_method": row["access_method"],
                "icon": row["icon"],
            }
            for row in rows
        ]


async def delete_custom_provider(name: str) -> bool:
    """Delete a custom provider.

    Args:
        name: Provider unique key.

    Returns:
        True if deleted, False if not found.
    """
    async with aiosqlite.connect(_db_path) as db:
        cursor = await db.execute("DELETE FROM custom_providers WHERE name = ?", (name,))
        await db.commit()
        return cursor.rowcount > 0
