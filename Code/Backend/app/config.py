"""DagBot — Configuration loader.

Loads Config/global.yaml and resolves ${VAR} references from .env.
"""

import os
import re
from pathlib import Path
from typing import Dict, Optional

import yaml
from dotenv import load_dotenv

# Resolve project root (DagBot/)
_PROJECT_ROOT = Path(__file__).resolve().parents[3]

# Load .env from project root
load_dotenv(_PROJECT_ROOT / ".env")


def _resolve_env_vars(value: str) -> str:
    """Replace ${VAR} placeholders with environment variable values.

    Args:
        value: String potentially containing ${VAR} patterns.

    Returns:
        Resolved string with env var values substituted.
    """
    pattern = re.compile(r"\$\{(\w+)\}")

    def _replacer(match: re.Match[str]) -> str:
        var_name = match.group(1)
        return os.getenv(var_name, f"MISSING_{var_name}")

    return pattern.sub(_replacer, value)


def _resolve_dict(data: Dict[str, object]) -> Dict[str, object]:
    """Recursively resolve env vars in dictionary values.

    Args:
        data: Dictionary with potentially unresolved ${VAR} strings.

    Returns:
        Dictionary with all string values resolved.
    """
    resolved: Dict[str, object] = {}
    for key, value in data.items():
        if isinstance(value, str):
            resolved[key] = _resolve_env_vars(value)
        elif isinstance(value, dict):
            resolved[key] = _resolve_dict(value)  # type: ignore[arg-type]
        else:
            resolved[key] = value
    return resolved


class AppConfig:
    """Application configuration singleton.

    Loads global.yaml and resolves environment variable references.
    """

    _instance: Optional["AppConfig"] = None
    _config: Dict[str, object]

    def __new__(cls) -> "AppConfig":
        """Create or return existing singleton instance."""
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._load()
        return cls._instance

    def _load(self) -> None:
        """Load and resolve the YAML configuration file."""
        config_path = _PROJECT_ROOT / "Config" / "global.yaml"
        with open(config_path, "r", encoding="utf-8") as f:
            raw = yaml.safe_load(f)
        self._config = _resolve_dict(raw)

    def reload(self) -> None:
        """Force-reload configuration from disk."""
        self._load()

    @property
    def providers(self) -> Dict[str, Dict[str, str]]:
        """Return all configured LLM providers."""
        return self._config.get("llm_providers", {})  # type: ignore[return-value]

    @property
    def defaults(self) -> Dict[str, object]:
        """Return default model parameters."""
        return self._config.get("defaults", {})  # type: ignore[return-value]

    @property
    def app(self) -> Dict[str, object]:
        """Return app-level configuration."""
        return self._config.get("app", {})  # type: ignore[return-value]

    @property
    def database_path(self) -> str:
        """Return the SQLite database file path."""
        db_config = self._config.get("database", {})
        relative = db_config.get("path", "dagbot.db") if isinstance(db_config, dict) else "dagbot.db"
        return str(_PROJECT_ROOT / "Log" / str(relative))

    @property
    def project_root(self) -> Path:
        """Return the project root directory."""
        return _PROJECT_ROOT


def get_config() -> AppConfig:
    """Get the application configuration instance.

    Returns:
        AppConfig singleton instance with resolved configuration.
    """
    return AppConfig()
