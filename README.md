# Guía de Entrevistas Técnicas para Arquitectos

Aplicación para ayudar a generar y gestionar preguntas para entrevistas técnicas a arquitectos de software.

## Características

- Generación automática de preguntas técnicas utilizando IA (OpenAI)
- Gestión de casos y escenarios de entrevista
- Organización de preguntas en formato jerárquico (preguntas de proceso y consideraciones)
- Selección y seguimiento de preguntas durante las entrevistas
- Almacenamiento persistente de entrevistas y selecciones

## Configuración del Entorno

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```
# OpenAI API Key (requerido)
OPENAI_API_KEY=sk-your-api-key-here

# Entorno (development o production)
NODE_ENV=development

# Puerto del servidor
PORT=3000

# Base de datos
# Para desarrollo local con SQLite, deja DATABASE_URL comentado
# DATABASE_URL=postgres://username:password@host:port/database
```

### Base de Datos

La aplicación soporta dos bases de datos:

- **SQLite**: Usado para desarrollo local (predeterminado)
- **PostgreSQL**: Recomendado para producción

Para usar PostgreSQL, especifica la URL de conexión en la variable de entorno `DATABASE_URL`.

## Instalación

```bash
# Instalar dependencias del servidor
npm install

# Instalar dependencias del cliente
cd client && npm install
```

## Desarrollo

```bash
# Ejecutar servidor de desarrollo
npm run dev

# En otra terminal, ejecutar cliente de desarrollo
cd client && npm start
```

## Despliegue

### Despliegue en Render

El proyecto incluye una configuración `render.yaml` para despliegue sencillo en [Render](https://render.com/).

1. Crea un nuevo servicio Web en Render
2. Conecta tu repositorio
3. Render detectará la configuración automáticamente
4. Configura las variables de entorno:
   - `OPENAI_API_KEY`: Tu clave de API de OpenAI
   - `DATABASE_URL`: Se configura automáticamente cuando conectas una base de datos Postgres

Render creará automáticamente una base de datos PostgreSQL y configurará la URL de conexión.

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

## Diagnóstico de Conexión

La aplicación proporciona una utilidad de diagnóstico para verificar:

1. **Conexión con OpenAI API**: Verifica que la clave API de OpenAI esté configurada correctamente
2. **Conexión con Base de Datos**: Verifica la conexión con PostgreSQL (producción) o SQLite (desarrollo)

Esta herramienta es útil para:
- Comprobar que los servicios están disponibles
- Depurar problemas de conexión 
- Verificar la configuración en diferentes entornos

Para acceder al diagnóstico, abra la aplicación y use el panel de diagnóstico en la parte inferior de la pantalla. 