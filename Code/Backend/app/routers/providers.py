"""DagBot — Providers router.

CRUD and test endpoints for LLM provider management.
"""

from fastapi import APIRouter, HTTPException

from ..models import ProviderConfig, ProviderCreate, ProviderUpdate, ProviderTestResult
from ..provider_factory import list_all_providers, test_provider_connection, fetch_provider_models
from .. import database

router = APIRouter(prefix="/api/providers", tags=["providers"])


@router.get("/{name}/models")
async def get_provider_models(name: str) -> list[str]:
    """Fetch available models for a provider dynamically.

    Args:
        name: Provider key.

    Returns:
        List of model IDs.
    """
    all_providers = await list_all_providers()
    provider = all_providers.get(name)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    return await fetch_provider_models(
        base_url=provider["base_url"],
        api_key=provider["api_key"]
    )


@router.get("")
async def get_providers() -> list[ProviderConfig]:
    """List all configured providers (YAML defaults + custom).

    Returns:
        List of provider configurations with masked API keys.
    """
    all_providers = await list_all_providers()
    result: list[ProviderConfig] = []

    for name, config in all_providers.items():
        api_key = config.get("api_key", "")
        masked_key = ""
        if api_key and api_key not in ("ollama", "lm-studio", "vllm"):
            masked_key = api_key[:8] + "•" * max(0, len(api_key) - 12) + api_key[-4:] if len(api_key) > 12 else "••••••••"
        else:
            masked_key = api_key

        result.append(ProviderConfig(
            name=name,
            display_name=config.get("display_name", name),
            base_url=config.get("base_url", ""),
            api_key=masked_key,
            default_model=config.get("default_model", ""),
            access_method=config.get("access_method", "openai_compatible"),
            icon=config.get("icon", "settings"),
            is_custom=config.get("is_custom", "false") == "true",
        ))

    return result


@router.post("", status_code=201)
async def add_provider(body: ProviderCreate) -> ProviderConfig:
    """Add a new custom provider.

    Args:
        body: Provider configuration to save.

    Returns:
        Saved provider config.
    """
    await database.save_custom_provider(
        name=body.name,
        display_name=body.display_name,
        base_url=body.base_url,
        api_key=body.api_key,
        default_model=body.default_model,
        access_method=body.access_method,
        icon=body.icon,
    )
    return ProviderConfig(
        name=body.name,
        display_name=body.display_name,
        base_url=body.base_url,
        api_key="••••••••" if body.api_key else "",
        default_model=body.default_model,
        access_method=body.access_method,
        icon=body.icon,
        is_custom=True,
    )


@router.put("/{name}")
async def update_provider(name: str, body: ProviderUpdate) -> dict[str, str]:
    """Update an existing custom provider.

    Args:
        name: Provider key.
        body: Fields to update.

    Returns:
        Success confirmation.
    """
    all_providers = await list_all_providers()
    existing = all_providers.get(name)
    if not existing:
        raise HTTPException(status_code=404, detail="Provider not found")

    await database.save_custom_provider(
        name=name,
        display_name=body.display_name or existing.get("display_name", name),
        base_url=body.base_url or existing.get("base_url", ""),
        api_key=body.api_key or existing.get("api_key", ""),
        default_model=body.default_model or existing.get("default_model", ""),
        icon=body.icon or existing.get("icon", "settings"),
    )
    return {"status": "updated"}


@router.delete("/{name}")
async def delete_provider(name: str) -> dict[str, str]:
    """Delete a custom provider.

    Args:
        name: Provider key.

    Returns:
        Success confirmation.

    Raises:
        HTTPException: 404 if not found.
    """
    deleted = await database.delete_custom_provider(name)
    if not deleted:
        raise HTTPException(status_code=404, detail="Provider not found or is a default provider")
    return {"status": "deleted"}


@router.post("/{name}/test")
async def test_connection(name: str) -> ProviderTestResult:
    """Test connection to a provider by sending a minimal request.

    Args:
        name: Provider key.

    Returns:
        Test result with success status, message, and response time.

    Raises:
        HTTPException: 404 if provider not found.
    """
    all_providers = await list_all_providers()
    provider = all_providers.get(name)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")

    result = await test_provider_connection(
        base_url=provider["base_url"],
        api_key=provider["api_key"],
        model=provider.get("default_model", "gpt-3.5-turbo"),
    )
    return ProviderTestResult(**result)  # type: ignore[arg-type]
