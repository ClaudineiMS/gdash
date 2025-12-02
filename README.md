# Sistema de coleta e processamento de dados climáticos

Este projeto é uma aplicação full-stack para **coleta, enfileiramento, processamento, armazenamento e exibição de dados de clima**, usando **Python**, **Go**, **RabbitMQ**, **Nest** e **React**.

Este projeto é estruturado seguindo uma arquitetura de **micro serviços**, onde cada responsabilidade do sistema é isolada em um serviço independente. Isso facilita a escalabilidade, manutenção e evolução da aplicação ao longo do tempo.

**Estrutura geral do projeto**:

```
├── backend
├── data-acquisition
├── frontend
└── go-worker
```

![Arquitetura do Sistema](./img/clima.jpg)

---

### 1. **Data Acquisition (Python Producer)**

Este microserviço executa um ciclo contínuo (a cada 30 segundos) composto por:

 - Buscar coordenadas (latitude/longitude) da cidade via API de geocodificação
 - Consultar dados climáticos usando a latitude e longitude
 - Interpretar e traduzir o weathercode da API
 - Formata o JSON de saída
 - Enviar a mensagem normalizada para o RabbitMQ
 - Repetir o processo em loop

**Saída**
```json
{
  "city": "Belo Horizonte",
  "timestamp_utc": "2025-11-22T03:38:00Z",
  "temperature_c": 21.5,
  "humidity_pct": 76,
  "wind_speed_kmh": 10.4,
  "condition_text": "Nublado",
  "rain_probability_pct": 42
}
```

**Configuração de ambiente (.env)**

O serviço lê suas configurações do **.env**, isso permite trocar cidade, API ou fila sem alterar o código.

Variáveis: 
 - URL da API Open-Meteo
 - URL da API de geocodificação
 - Cidade alvo
 - URL de conexão do RabbitMQ

**Execução via Docker**

Utiliza a imagem **python:3.11-slim**, instala as dependências do projeto a partir do **requirements.txt**, copia o código fonte para o contêiner e define o comando final que executa o serviço.

---

### 2. **Go Worker** 

**worker em Go** que consome mensagens de clima (`WeatherMessage`) de uma fila RabbitMQ (`weather_queue`) e as processa. As mensagens são exibidas no console em formato de log.

### Funcionalidades

- Conecta ao RabbitMQ usando URL configurável via variável de ambiente.
- Consome mensagens da fila `weather_queue`.
- Exibe o **JSON formatado** das mensagens no console.
- Confirma (ack) cada mensagem após processamento.

---

### 3. **Backend Nest**

O back-end é construído com NestJS e TypeScript, responsável por gerenciar usuários, processar dados climáticos e fornecer endpoints para consumo pelo front-end. Ele é organizado em módulos e segue boas práticas de arquitetura modular do NestJS.

**Estrutura Geral**

O diretório src contém todo o código da aplicação, organizado da seguinte forma:

 - app.controller.ts / app.service.ts / app.module.ts / main.ts:
   Ponto de entrada da aplicação e configuração global do módulo principal.

  **Módulo Users (src/users):**
    Responsável por gerenciar usuários da aplicação. Inclui:

- **DTOs:** Objetos de transferência de dados para criação e atualização de usuários.
- **user.controller.ts:** Define os endpoints relacionados a usuários (CRUD).
- **user.service.ts:** Contém a lógica de negócio para operações de usuários.
- **user.schema.ts:** Define o schema do usuário para integração com o banco de dados.

**Módulo Weather (src/weather):**
    Responsável por processar e fornecer dados climáticos. Inclui:

- **weather.controller.ts:** Endpoints para consulta e processamento de dados do clima.
- **weather.service.ts:** Contém a lógica de negócio para lidar com dados climáticos e integração com serviços externos (como Open-Meteo ou OpenWeather).
- **weather.schema.ts:** Define o schema dos dados de clima no banco de dados.

**Funcionalidade Geral**

O back-end da funciona como a espinha dorsal da aplicação, recebendo e processando dados climáticos, gerenciando usuários e expondo APIs REST para o front-end. Ele se integra com:

- Banco de dados (MongoDB).
- Fila de mensagens (RabbitMQ) para processamentos assíncronos no worker Go.
- Serviços externos de clima para coletar dados em tempo real.

---

## 4. **Frontend**