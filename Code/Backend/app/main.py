"""DagBot — FastAPI Application Entry Point.

Configures CORS, mounts routers, and initializes the database on startup.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import chat, conversations, providers, prompts

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("dagbot_backend.log"),
    ],
)
logger = logging.getLogger("dagbot")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan handler — init DB on startup.

    Args:
        app: The FastAPI application instance.

    Yields:
        Control to the application request handling.
    """
    logger.info("🦖 DagBot backend starting up...")
    await init_db()
    logger.info("Database initialized successfully")
    yield
    logger.info("DagBot backend shutting down...")


app = FastAPI(
    title="DagBot API",
    description="Multi-provider AI Chatbot Backend",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(providers.router)
app.include_router(prompts.router)


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint.

    Returns:
        Status and app name.
    """
    return {"status": "healthy", "app": "DagBot"}
