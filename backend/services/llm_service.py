import json
import os
from typing import List, Dict, Any, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage, ToolMessage
from .tool_service import execute_tool, get_tool_schemas
from ..models.card import CaseStudyCard
from dotenv import load_dotenv

load_dotenv()

# Configuration
PRIMARY_MODEL = os.getenv("PRIMARY_MODEL", "qwen/qwen-2.5-72b-instruct:free")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
BASE_URL = "https://openrouter.ai/api/v1"

class LLMService:
    def __init__(self):
        self.llm = ChatOpenAI(
            model=PRIMARY_MODEL,
            api_key=OPENROUTER_API_KEY,
            base_url=BASE_URL,
            temperature=0.7
        )
        self.tools = get_tool_schemas()
        self.bound_llm = self.llm.bind_tools(self.tools)

    def process_query(self, query: str, history: Optional[List[Dict]] = None) -> CaseStudyCard:
        """
        Main reasoning loop: Calls LLM -> Executes Tools -> Synthesizes Card.
        """
        messages = [
            SystemMessage(content=(
                "You are an expert Project Management Learning Assistant. "
                "Your goal is to help students understand PM concepts through real-world stories. "
                "Use the provided tools to retrieve theory (RAG) or search for real-world company examples. "
                "Once you have enough information, generate a structured Case Study Card JSON. "
                "GROUND ALL STORIES IN DATA. Do not hallucinate names or dates."
            )),
            HumanMessage(content=query)
        ]

        # Limit the loop to 5 turns to prevent runaways
        for _ in range(5):
            response = self.bound_llm.invoke(messages)
            
            # If no tool calls, this is the final answer (or should be)
            if not response.tool_calls:
                return self._parse_to_card(response.content)

            # Append LLM response to history
            messages.append(response)

            # Execute tool calls
            for tool_call in response.tool_calls:
                result = execute_tool(tool_call['name'], tool_call['args'])
                messages.append(ToolMessage(
                    content=json.dumps(result),
                    tool_call_id=tool_call['id']
                ))
        
        # If loop exhausts, try to force a final synthesis
        final_response = self.llm.invoke(messages + [HumanMessage(content="Synthesize the final Case Study Card now.")])
        return self._parse_to_card(final_response.content)

    def _parse_to_card(self, content: str) -> CaseStudyCard:
        """
        Parses LLM output into a CaseStudyCard object.
        Includes a retry/correction call if parsing fails.
        """
        try:
            # Attempt to find JSON in the content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            
            data = json.loads(content)
            return CaseStudyCard.model_validate(data)
        except Exception as e:
            print(f"Parsing failed: {e}. Attempting recovery...")
            # Simple recovery call
            correction = self.llm.invoke(f"The following output failed JSON validation for our CaseStudyCard schema. Please fix it and return ONLY the raw JSON.\n\nOutput: {content}")
            return CaseStudyCard.model_validate_json(correction.content)

llm_service = LLMService()
