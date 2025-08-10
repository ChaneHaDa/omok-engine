from fastapi import FastAPI

from routers.ws import router as ws_router


app = FastAPI()


# WebSocket 라우터 등록
app.include_router(ws_router)
