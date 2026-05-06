from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "mistral"
    cache_maxsize: int = 512
    cache_ttl_seconds: int = 30
    classify_timeout_seconds: float = 8.0

    class Config:
        env_file = ".env"


settings = Settings()
