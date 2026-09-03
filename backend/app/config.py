import os
from typing import List

class Settings:
    PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Nexgile-DecarbX Environmental Intelligence Platform")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    PORT: int = int(os.getenv("PORT", "8000"))
    DEBUG: bool = os.getenv("DEBUG", "True").lower() in ("true", "1", "yes")

    SECRET_KEY: str = os.getenv("SECRET_KEY", "nexgile-decarbx-super-secure-production-jwt-secret-key-2025")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    def __init__(self):
        if not self.DATABASE_URL:
            # If running on Vercel or AWS Lambda, the root filesystem is read-only.
            # We copy the pre-seeded SQLite database to /tmp so all writes succeed!
            if os.getenv("VERCEL") == "1" or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"):
                import shutil
                import tempfile
                tmp_dir = tempfile.gettempdir()
                tmp_db = os.path.join(tmp_dir, "decarbx.db")
                backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                orig_db = os.path.join(backend_dir, "decarbx.db")
                if not os.path.exists(tmp_db) and os.path.exists(orig_db):
                    shutil.copyfile(orig_db, tmp_db)
                clean_path = tmp_db.replace("\\", "/")
                self.DATABASE_URL = f"sqlite:///{clean_path}"
            else:
                self.DATABASE_URL = "sqlite:///./decarbx.db"

    CORS_ORIGINS: List[str] = [
        origin.strip() 
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173").split(",")
        if origin.strip()
    ]

settings = Settings()
