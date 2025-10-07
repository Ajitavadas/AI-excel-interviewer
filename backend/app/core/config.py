from pydantic_settings import BaseSettings
from typing import List, Union
from pydantic import field_validator

class Settings(BaseSettings):
    # Database Configuration
    database_url: str = "postgresql://postgres:postgres@postgres:5432/ai_excel_interviewer"
    
    # Redis Configuration  
    redis_url: str = "redis://redis:6379"
    
    # LLM Configuration
    use_local_llm: bool = True
    ollama_base_url: str = "http://ollama:11434"
    ollama_model: str = "gemma3:1b"
    
    # Application Configuration
    secret_key: str = "your-secret-key-change-in-production"
    
    # CORS Configuration
    allowed_origins: Union[List[str], str] = "http://localhost:3000,http://localhost:5173"
    
    # Development Settings
    debug: bool = True
    log_level: str = "info"
    
    @field_validator('allowed_origins')
    @classmethod
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',') if origin.strip()]
        elif isinstance(v, list):
            return v
        else:
            return ["http://localhost:3000", "http://localhost:5173"]
    
    class Config:
        env_file = ".env"

settings = Settings()