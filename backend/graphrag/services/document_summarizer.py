import logging
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate
import os

logger = logging.getLogger(__name__)

class DocumentSummarizer:
    def __init__(self):
        # We use a fast/cheap model for summarization if configured, fallback to standard
        self.llm = ChatOpenAI(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            temperature=0.3,
            max_tokens=200
        )
        self.prompt = ChatPromptTemplate.from_template(
            "You are an expert technical summarizer. \n"
            "Please read the following text (which is the beginning of a larger document) "
            "and provide a concise, factual summary in EXACTLY 100 words or less. \n"
            "Focus on the main topic, key concepts introduced, and the purpose of the document.\n\n"
            "Document Text:\n{text}\n\n"
            "Summary:"
        )
        self.chain = self.prompt | self.llm

    def generate_summary(self, full_text: str) -> str:
        """
        Generates a short summary from the provided document text.
        To save costs and time, we only use the first 3000 characters.
        """
        if not full_text or len(full_text.strip()) == 0:
            return ""

        text_to_summarize = full_text[:3000]
        
        try:
            logger.info("Generating document summary...")
            response = self.chain.invoke({"text": text_to_summarize})
            summary = response.content.strip()
            logger.info("Successfully generated document summary (%d chars).", len(summary))
            return summary
        except Exception as e:
            logger.error("Failed to generate document summary: %s", str(e), exc_info=True)
            return ""
