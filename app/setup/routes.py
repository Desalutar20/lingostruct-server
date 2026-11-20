from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import ApplicationConfig

from .modules import Modules


def add_middlewares(app: FastAPI, config: ApplicationConfig):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[config.client_url.encoded_string()],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


def add_routes(app: FastAPI, modules: Modules):
    router_v1 = APIRouter(prefix="/api/v1")

    router_v1.include_router(modules.auth_module.router)

    app.include_router(router_v1)
