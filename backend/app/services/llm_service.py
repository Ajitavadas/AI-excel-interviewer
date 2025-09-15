import httpx
import json
from typing import Optional, Dict, Any
from app.core.config import settings

class LLMService:
    def __init__(self):
        self.use_local = settings.use_local_llm
        self.base_url = settings.ollama_base_url
        self.model = settings.ollama_model
        
    async def generate_response(self, prompt: str, system_message: Optional[str] = None) -> str:
        if self.use_local:
            return await self._call_ollama(prompt, system_message)
        else:
            return await self._call_openai(prompt, system_message)
    
    async def _call_ollama(self, prompt: str, system_message: Optional[str] = None) -> str:
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": self.model,
                    "messages": messages,
                    "stream": False
                }
            )
            result = response.json()
            return result["message"]["content"]
    
    async def _call_openai(self, prompt: str, system_message: Optional[str] = None):
        # OpenAI implementation (requires API key)
        pass

llm_service = LLMService()