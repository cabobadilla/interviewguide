# Asistente de Entrevistas Técnicas para Arquitectos

Esta aplicación ayuda a los entrevistadores a preparar preguntas clave para entrevistas técnicas a arquitectos, utilizando la API de OpenAI para generar preguntas relevantes según el caso seleccionado.

## Funcionalidades

- Selección de casos de entrevista desde una lista predefinida
- Posibilidad de agregar nuevos casos personalizados
- Generación automática de preguntas utilizando GPT-3.5 Turbo
- Clasificación de preguntas por tipo (proceso o consideraciones)

## Tecnologías Utilizadas

- Backend: Node.js con Express
- Frontend: React
- Base de datos: SQLite (base de datos local)
- API: OpenAI (GPT-3.5 Turbo)

## Requisitos

- Node.js y npm
- Clave API de OpenAI

## Configuración

1. Clonar el repositorio
2. Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```
OPENAI_API_KEY=tu_clave_api_de_openai
NODE_ENV=development
PORT=3000
```

3. Instalar dependencias:
```bash
npm install
cd client && npm install
```

4. Para desarrollo local:
```bash
# Terminal 1: Iniciar el servidor
npm run dev

# Terminal 2: Iniciar el cliente
cd client && npm start
```

## Despliegue en Render.com

1. Crea una cuenta en [Render.com](https://render.com/) si aún no tienes una.

2. Crea un nuevo servicio Web:
   - Conecta tu repositorio de GitHub
   - Establece el "Build Command": `npm install && cd client && npm install && npm run build`
   - Establece el "Start Command": `npm start`

3. Configura las variables de entorno en Render:
   - OPENAI_API_KEY
   - NODE_ENV=production
   - PORT=10000 (Render asignará automáticamente este valor)

4. Haz clic en "Create Web Service" y espera a que se complete el despliegue.

## Estructura del Proyecto

```
/
├── client/               # Frontend React
│   ├── public/           # Archivos estáticos
│   └── src/              # Código fuente React
│       ├── components/   # Componentes React
│       └── App.js        # Componente principal
├── index.js              # Punto de entrada del servidor
├── database.sqlite       # Base de datos SQLite (se creará automáticamente)
├── package.json          # Dependencias y scripts
└── .env                  # Variables de entorno (no incluido en git)
```

## Casos Predefinidos

La aplicación incluye los siguientes casos predeterminados:
- Estrategia Cloud
- Eficiencia TI
- Arquitectura Mobile

También puedes agregar casos personalizados a través de la interfaz. 