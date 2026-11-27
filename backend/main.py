import os

import logging
import psycopg
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from anthropic import Anthropic

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI(title="Bright Smile Clinic Concierge")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/hello")
def hello():
    try:
        with psycopg.connect(os.environ["DB_CONNECTION_STRING"]) as connection:
            connection.execute("SELECT 1")

        client = Anthropic()
        response = client.messages.create(
            model=os.getenv("ANTHROPIC_MODEL", "claude-haiku-5-5"),
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": "Reply with a short friendly greeting for Bright Smile Dental Center.",
                }
            ],
        )

        output_text = response.content[0].text

        logger.info(f"Claude's Response: {output_text}")
        logger.info(f"Claude's Response Object: {response}")

        return {
            "database": "connected",
            "message": output_text,
        }

    except Exception as e:
        logger.error(f"Error in /api/hello endpoint: {str(e)}")
        raise HTTPException(
            status_code=503,
            detail=f"The demo service is temporarily unavailable. {str(e)}",
        )
