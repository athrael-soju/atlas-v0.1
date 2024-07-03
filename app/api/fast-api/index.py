from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/fast-api")
async def read_root(response: Response):
    vercel_auth_secret = os.getenv("VERCEL_AUTH_SECRET")
    if vercel_auth_secret:
        response.headers["x-vercel-protection-bypass"] = vercel_auth_secret
    return {"message": "Hello from FastAPI!"}
    
