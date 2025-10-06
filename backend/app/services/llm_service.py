import httpx
import json
import structlog
from typing import Optional, Dict, Any
from app.core.config import settings

logger = structlog.get_logger()

class LLMService:
    def __init__(self):
        self.use_local = getattr(settings, 'use_local_llm', True)
        self.base_url = getattr(settings, 'ollama_base_url', 'http://ollama:11434')
        self.model = getattr(settings, 'ollama_model', 'phi4-mini:latest')
        self.timeout = 30.0
    
    async def generate_response(self, prompt: str, system_message: Optional[str] = None) -> str:
        """Generate response using configured LLM"""
        if self.use_local:
            return await self._call_ollama(prompt, system_message)
        else:
            return await self._call_openai(prompt, system_message)
    
    async def _call_ollama(self, prompt: str, system_message: Optional[str] = None) -> str:
        """Call Ollama API with proper error handling"""
        try:
            messages = []
            if system_message:
                messages.append({"role": "system", "content": system_message})
            messages.append({"role": "user", "content": prompt})
            
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                logger.info(f"Calling Ollama at {self.base_url}/api/chat with model {self.model}")
                
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json={
                        "model": self.model,
                        "messages": messages,
                        "stream": False,
                        "options": {
                            "temperature": 0.7,
                            "top_p": 0.9
                        }
                    }
                )
                
                if response.status_code == 200:
                    result = response.json()
                    return result.get("message", {}).get("content", "I'm sorry, I couldn't generate a response.")
                else:
                    logger.error(f"Ollama API error: {response.status_code} - {response.text}")
                    return self._fallback_response(prompt)
                    
        except httpx.TimeoutException:
            logger.error("Ollama API timeout")
            return "I'm taking longer than expected to respond. Let me try a different approach."
        except httpx.ConnectError:
            logger.error("Cannot connect to Ollama service")
            return self._fallback_response(prompt)
        except Exception as e:
            logger.error(f"Ollama API error: {e}")
            return self._fallback_response(prompt)
    
    def _fallback_response(self, prompt: str) -> str:
        """Provide intelligent fallback responses when LLM is unavailable"""
        prompt_lower = prompt.lower()
        
        if "welcome" in prompt_lower or "greet" in prompt_lower:
            return """Welcome to the AI Excel Interviewer! 

I'm here to assess your Excel skills through a series of questions and practical tasks. This interview will take about 20-30 minutes and will cover:

- Formulas and Functions (VLOOKUP, HLOOKUP, INDEX/MATCH)
- Data Analysis and Pivot Tables  
- Charts and Visualization
- Data Validation and Formatting
- Advanced Excel Features

Are you ready to begin? Let's start with a fundamental question about Excel formulas."""

        elif "vlookup" in prompt_lower:
            return """Excellent! VLOOKUP is indeed a fundamental Excel function. 

Let's move to the next area: **Pivot Tables**

Here's your next question: You have a large dataset with sales data containing columns for Date, Salesperson, Product, Region, and Sales Amount. You need to create a summary showing total sales by region and by month.

How would you approach this using Excel? Please describe the steps you would take to create an effective pivot table for this analysis."""

        elif "pivot" in prompt_lower:
            return """Great approach to pivot tables! 

Now let's test your formula skills: **Advanced Formulas**

Question: You need to create a commission calculation with these rules:
- Sales under $5,000: 2% commission
- Sales $5,000 to $15,000: 5% commission  
- Sales over $15,000: 8% commission

What Excel formula would you write to calculate commission for a sales amount in cell B2? Please provide the complete formula."""

        else:
            return """Thank you for your response. That shows good Excel knowledge!

Let me ask you about another important Excel feature. How comfortable are you with data validation and ensuring data quality in Excel spreadsheets? 

Can you describe a situation where you would use data validation, and what specific validation rules you might implement?"""

    async def _call_openai(self, prompt: str, system_message: Optional[str] = None):
        """OpenAI implementation (requires API key) - placeholder for now"""
        return "OpenAI integration not configured. Using local LLM mode."

# Global instance
llm_service = LLMService()