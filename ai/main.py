"""
Nagarik AI microservice — FastAPI entry point.
Runs on port 8001, separate from the Next.js app on port 3000.
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.config import settings
from src.endpoints.analyze import router as analyze_router
from src.endpoints.score_user import router as score_user_router
from src.endpoints.rank_comment import router as rank_router
from src.endpoints.match_research import router as match_router
from src.endpoints.mob_detect import router as mob_router

logging.basicConfig(
    level=settings.log_level.upper(),
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger("nagarik.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Nagarik AI starting up (env=%s)", settings.app_env)
    yield
    logger.info("Nagarik AI shutting down")


app = FastAPI(
    title="Nagarik AI",
    description="Bangla NLP, moderation, and ranking microservice for Sohojatra",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_latency_header(request: Request, call_next):
    start = time.monotonic()
    response = await call_next(request)
    response.headers["X-Process-Time-Ms"] = str(round((time.monotonic() - start) * 1000, 1))
    return response


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(analyze_router)
app.include_router(score_user_router)
app.include_router(rank_router)
app.include_router(match_router)
app.include_router(mob_router)


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["ops"])
async def health() -> dict:
    return {"status": "ok", "env": settings.app_env}


@app.get("/", tags=["ops"])
async def root() -> dict:
    return {
        "service": "Nagarik AI",
        "version": "1.0.0",
        "endpoints": [
            "POST /analyze",
            "POST /score_user",
            "POST /rank_comment",
            "POST /match_research",
            "POST /detect_mob",
        ],
    }
