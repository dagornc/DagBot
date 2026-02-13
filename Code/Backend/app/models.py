"""DagBot — Pydantic models for API requests and responses.

Strict typing, no `Any` usage per project mandates.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# --- Chat Models ---

class ChatMessage(BaseModel):
    """A single chat message in a conversation."""

    role: str = Field(..., description="Message role: 'system', 'user', or 'assistant'")
    content: str | List[Dict[str, Any]] = Field(..., description="Message content text or multimodal parts")


class ChatRequest(BaseModel):
    """Request body for the chat streaming endpoint."""

    provider: str = Field(..., description="Provider name (e.g. 'openrouter')")
    model: str = Field(..., description="Model identifier (e.g. 'google/gemini-2.0-flash-exp:free')")
    messages: List[ChatMessage] = Field(..., description="Conversation messages")
    system_prompt: Optional[str] = Field(None, description="System prompt to prepend")
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID")
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0, description="Sampling temperature")
    top_p: Optional[float] = Field(None, ge=0.0, le=1.0, description="Top-p sampling")
    max_tokens: Optional[int] = Field(None, ge=1, le=128000, description="Max output tokens")
    presence_penalty: Optional[float] = Field(None, ge=-2.0, le=2.0)
    frequency_penalty: Optional[float] = Field(None, ge=-2.0, le=2.0)


# --- Conversation Models ---

class ConversationCreate(BaseModel):
    """Request body to create a new conversation."""

    title: Optional[str] = Field("New Chat", description="Conversation title")
    system_prompt: Optional[str] = Field(None, description="System prompt for this conversation")


class ConversationUpdate(BaseModel):
    """Request body to update a conversation."""

    title: Optional[str] = None
    system_prompt: Optional[str] = None


class ConversationResponse(BaseModel):
    """Response for a single conversation."""

    id: str
    title: str
    system_prompt: Optional[str] = None
    created_at: str
    updated_at: str
    preview: Optional[str] = None
    message_count: int = 0


class MessageResponse(BaseModel):
    """Response for a single message."""

    id: str
    conversation_id: str
    role: str
    content: str
    provider: Optional[str] = None
    model: Optional[str] = None
    created_at: str


class ConversationDetailResponse(BaseModel):
    """Full conversation with messages."""

    id: str
    title: str
    system_prompt: Optional[str] = None
    created_at: str
    updated_at: str
    messages: List[MessageResponse] = []


# --- Provider Models ---

class ProviderConfig(BaseModel):
    """Configuration for a single LLM provider."""

    name: str = Field(..., description="Unique provider key")
    display_name: str = Field(..., description="Human-readable provider name")
    base_url: str = Field(..., description="API base URL")
    api_key: str = Field("", description="API key (may be masked)")
    default_model: str = Field("", description="Default model for this provider")
    access_method: str = Field("openai_compatible", description="API compatibility type")
    icon: str = Field("settings", description="Icon identifier")
    is_custom: bool = Field(False, description="Whether provider was added by user")
    description: Optional[str] = Field(None, description="Short description of the provider")
    recommended: bool = Field(False, description="Whether the provider is recommended")
    models: List[str] = Field(default_factory=list, description="List of available models")


class ProviderCreate(BaseModel):
    """Request to add a new provider."""

    name: str
    display_name: str
    base_url: str
    api_key: str = ""
    default_model: str = ""
    access_method: str = "openai_compatible"
    icon: str = "settings"
    description: Optional[str] = None
    recommended: bool = False
    models: List[str] = []


class ProviderUpdate(BaseModel):
    """Request to update an existing provider."""

    display_name: Optional[str] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    default_model: Optional[str] = None
    icon: Optional[str] = None


class ProviderTestResult(BaseModel):
    """Result of testing a provider connection."""

    success: bool
    message: str
    response_time_ms: Optional[float] = None


# --- Prompt Library Models ---

class PromptCreate(BaseModel):
    """Request to create a new saved prompt."""

    title: str = Field(..., description="Prompt title")
    content: str = Field(..., description="System prompt content")
    category: str = Field("General", description="Category tag")
    tags: List[str] = Field(default_factory=list, description="Optional tags")
    is_favorite: bool = Field(False, description="Whether prompt is favorited")


class PromptUpdate(BaseModel):
    """Request to update an existing prompt."""

    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    is_favorite: Optional[bool] = None


class PromptResponse(BaseModel):
    """Response for a single saved prompt."""

    id: str
    title: str
    content: str
    category: str
    tags: List[str] = []
    is_favorite: bool = False
    created_at: str
    updated_at: str
