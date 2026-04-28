FROM node:20-slim

WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o restante do código
COPY . .

# Expõe a porta padrão do Vite
EXPOSE 5173

# Comando para rodar em modo desenvolvimento
# O --host é crucial para o Docker conseguir expor a porta
CMD ["npm", "run", "dev", "--", "--host"]
