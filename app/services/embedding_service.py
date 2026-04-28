from sentence_transformers import SentenceTransformer
from typing import List
import numpy as np

class EmbeddingService:
    _model = None # Cache do modelo em memória

    def __init__(self, model_name: str = "paraphrase-multilingual-MiniLM-L12-v2"):
        if EmbeddingService._model is None:
            print(f"--- Carregando modelo de IA: {model_name} ---")
            self.model = SentenceTransformer(model_name)
            EmbeddingService._model = self.model
        else:
            self.model = EmbeddingService._model

    def generate_embedding(self, text: str) -> List[float]:
        """
        Transforma uma string em um vetor de números (floats).
        """
        embedding = self.model.encode(text)
        # Convertemos para lista para ser compatível com o banco de dados
        return embedding.tolist()

    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """
        Gera embeddings para vários textos de uma vez (mais rápido para grandes volumes).
        """
        embeddings = self.model.encode(texts)
        return embeddings.tolist()
