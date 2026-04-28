import edge_tts
import os
from uuid import uuid4
from app.core.config import settings

class TTSService:
    def __init__(self):
        # Voz recomendada: Francisca (Feminina) ou Antonio (Masculino) em PT-BR
        self.voice = "pt-BR-FranciscaNeural"

    async def generate_audio(self, text: str) -> str:
        """
        Converte texto em áudio e retorna o caminho do arquivo gerado.
        """
        if not text:
            raise ValueError("O texto para geração de áudio não pode estar vazio.")

        # 1. Gerar nome único para o arquivo de áudio
        filename = f"audio_{uuid4()}.mp3"
        file_path = os.path.join(settings.UPLOAD_DIR, filename)

        # 2. Configurar e executar a síntese de voz
        communicate = edge_tts.Communicate(text, self.voice)
        await communicate.save(file_path)

        return file_path
