"""DagBot — LLM Provider Factory.

Creates LangChain ChatOpenAI instances for any OpenAI-compatible provider.
Uses the Strategy pattern: all providers share the same interface via base_url.
"""

import time
from typing import Dict, Optional

import httpx
from langchain_openai import ChatOpenAI

from .config import get_config
from . import database


async def _get_all_providers() -> Dict[str, Dict[str, str]]:
    """Merge YAML providers with custom DB providers.

    Custom providers override YAML providers with the same name.

    Returns:
        Dictionary of all available providers keyed by name.
    """
    config = get_config()
    providers: Dict[str, Dict[str, str]] = {}

    # Load from YAML config
    for name, prov_config in config.providers.items():
        providers[name] = {
            "name": name,
            "display_name": prov_config.get("display_name", name),
            "base_url": prov_config.get("base_url", ""),
            "api_key": prov_config.get("api_key", ""),
            "default_model": prov_config.get("default_model", ""),
            "access_method": prov_config.get("access_method", "openai_compatible"),
            "icon": prov_config.get("icon", "settings"),
            "description": prov_config.get("description", ""),
            "recommended": prov_config.get("recommended", False),
            "models": prov_config.get("models", []),
            "is_custom": "false",
        }

    # Merge custom providers from DB
    custom = await database.list_custom_providers()
    for prov in custom:
        providers[prov["name"]] = {
            **prov,
            "is_custom": "true",
        }

    return providers


async def get_provider_config(provider_name: str) -> Optional[Dict[str, str]]:
    """Get configuration for a specific provider.

    Args:
        provider_name: The provider key (e.g. 'openrouter').

    Returns:
        Provider config dict or None if not found.
    """
    all_providers = await _get_all_providers()
    return all_providers.get(provider_name)


async def list_all_providers() -> Dict[str, Dict[str, str]]:
    """List all available providers (YAML + custom).

    Returns:
        Dict of provider configs keyed by name.
    """
    return await _get_all_providers()


def create_chat_model(
    base_url: str,
    api_key: str,
    model: str,
    temperature: float = 0.7,
    top_p: float = 1.0,
    max_tokens: Optional[int] = None,
    presence_penalty: float = 0.0,
    frequency_penalty: float = 0.0,
) -> ChatOpenAI:
    """Create a LangChain ChatOpenAI instance for any OpenAI-compatible provider.

    Args:
        base_url: Provider API base URL.
        api_key: Provider API key.
        model: Model identifier string.
        temperature: Sampling temperature (0.0 to 2.0).
        top_p: Top-p nucleus sampling (0.0 to 1.0).
        max_tokens: Maximum output tokens.
        presence_penalty: Presence penalty (-2.0 to 2.0).
        frequency_penalty: Frequency penalty (-2.0 to 2.0).

    Returns:
        Configured ChatOpenAI instance ready for streaming.
    """
    kwargs: Dict[str, object] = {
        "model": model,
        "api_key": api_key,
        "base_url": base_url,
        "temperature": temperature,
        "top_p": top_p,
        "streaming": True,
        "model_kwargs": {
            "presence_penalty": presence_penalty,
            "frequency_penalty": frequency_penalty,
        },
        "http_client": httpx.Client(timeout=60.0),
        "http_async_client": httpx.AsyncClient(timeout=60.0),
    }

    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens

    return ChatOpenAI(**kwargs)  # type: ignore[arg-type]


async def test_provider_connection(
    base_url: str,
    api_key: str,
    model: str,
) -> Dict[str, object]:
    """Test a provider connection by sending a minimal request.

    Args:
        base_url: Provider API base URL.
        api_key: Provider API key.
        model: Model identifier.

    Returns:
        Dict with 'success' bool, 'message' str, and 'response_time_ms' float.
    """
    start = time.monotonic()
    try:
        llm = create_chat_model(base_url=base_url, api_key=api_key, model=model, max_tokens=5)
        response = await llm.ainvoke("Say 'ok'")
        elapsed = (time.monotonic() - start) * 1000
        return {
            "success": True,
            "message": f"Connected successfully. Response: {response.content[:50]}",
            "response_time_ms": round(elapsed, 1),
        }
    except Exception as exc:
        elapsed = (time.monotonic() - start) * 1000
        return {
            "success": False,
            "message": f"Connection failed: {exc}",
            "response_time_ms": round(elapsed, 1),
        }


async def fetch_provider_models(base_url: str, api_key: str) -> list[str]:
    """Fetch available models from an OpenAI-compatible /models endpoint.

    Args:
        base_url: Provider API base URL.
        api_key: Provider API key.

    Returns:
        List of model ID strings.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            headers = {"Authorization": f"Bearer {api_key}"} if api_key else {}
            # Ensure base_url doesn't end with slash before appending /models
            url = f"{base_url.rstrip('/')}/models"
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()

            # Standards OpenAI /models response is a list of objects under 'data'
            if isinstance(data, dict) and "data" in data:
                return sorted([m["id"] for m in data["data"] if isinstance(m, dict) and "id" in m])
            # Some providers might return a list directly
            elif isinstance(data, list):
                return sorted([m["id"] if isinstance(m, dict) else str(m) for m in data])
            
            return []
    except Exception as exc:
        print(f"Error fetching models from {base_url}: {exc}")
        return []
