from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    database_url: str
    
    # LLM Configuration
    use_local_llm: bool = True
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"
    openai_api_key: Optional[str] = None
    
    # App settings
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    allowed_origins: list = ["http://localhost:5173", "http://localhost:3000"]
    
    class Config:
        env_file = ".env"

settings = Settings()