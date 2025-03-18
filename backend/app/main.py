from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import api
import uvicorn

app = FastAPI(
    title="Multifactor Linear Regression",
    description="API for multifactor linear regression analysis",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React app
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(api.router)


@app.get("/")
async def root():
    return {"message": "Multifactor Linear Regression API is running"}


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
