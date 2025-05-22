require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const OpenAI = require('openai');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// SQLite connection
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

// Test connection
sequelize.authenticate()
  .then(() => console.log('Connected to SQLite database'))
  .catch(err => console.error('SQLite connection error:', err));

// Define Interview Case Model
const Case = sequelize.define('Case', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  isDefault: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true
});

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Test OpenAI connection endpoint
app.get('/api/test-openai', async (req, res) => {
  try {
    console.log('Testing OpenAI connection...');
    console.log('API Key (first 5 chars):', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 5) + '...' : 'Not set');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello!" }],
    });
    
    res.json({ 
      success: true, 
      message: 'OpenAI connection successful', 
      data: {
        model: completion.model,
        object: completion.object
      }
    });
  } catch (error) {
    console.error('OpenAI connection test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'OpenAI connection failed', 
      error: {
        message: error.message,
        type: error.type,
        code: error.code
      }
    });
  }
});

// API Routes
app.get('/api/cases', async (req, res) => {
  try {
    const cases = await Case.findAll({
      order: [
        ['isDefault', 'DESC'],
        ['name', 'ASC']
      ]
    });
    res.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ message: 'Failed to fetch cases' });
  }
});

app.post('/api/cases', async (req, res) => {
  try {
    const newCase = await Case.create({
      name: req.body.name,
      description: req.body.description || '',
      isDefault: false
    });
    
    res.status(201).json(newCase);
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({ message: 'Failed to create case' });
  }
});

app.post('/api/cases/:id/questions', async (req, res) => {
  console.log('Generating questions for case ID:', req.params.id);
  const debugInfo = {
    openaiApiKey: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 4)}...${process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4)}` : 'Not set',
    openaiConnected: false,
    steps: ['Iniciando solicitud']
  };
  
  try {
    debugInfo.steps.push('Buscando caso en la base de datos');
    const caseData = await Case.findByPk(req.params.id);
    
    if (!caseData) {
      debugInfo.steps.push('Caso no encontrado');
      return res.status(404).json({ 
        message: 'Case not found',
        debug: debugInfo
      });
    }
    
    debugInfo.steps.push('Caso encontrado: ' + caseData.name);
    
    // Verify OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      debugInfo.steps.push('Error: API key de OpenAI no está configurada');
      return res.status(500).json({ 
        message: 'OpenAI API key is not set',
        debug: debugInfo
      });
    }
    
    debugInfo.steps.push('Conectando con OpenAI API');
    console.log('Connecting to OpenAI API with key starting with:', process.env.OPENAI_API_KEY.substring(0, 5));
    
    // Generate questions using OpenAI API
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system", 
            content: "You are an expert technical interviewer for architects. Generate key questions for an interview."
          },
          {
            role: "user", 
            content: `Generate 5-8 key technical interview questions for an architect focusing on "${caseData.name}". 
            Include both process-related questions and questions about key aspects to consider.
            Format the response as a JSON array with objects containing 'question' and 'type' fields,
            where type is either 'process' or 'consideration'.`
          }
        ],
        response_format: { type: "json_object" }
      });
      
      debugInfo.steps.push('Respuesta recibida de OpenAI');
      debugInfo.openaiConnected = true;
      console.log('OpenAI response received');
      
      try {
        const questions = JSON.parse(completion.choices[0].message.content);
        debugInfo.steps.push('Respuesta JSON parseada correctamente');
        
        res.json({
          questions: questions,
          openaiConnected: true,
          debug: debugInfo
        });
      } catch (parseError) {
        debugInfo.steps.push('Error al parsear JSON: ' + parseError.message);
        console.error('Error parsing OpenAI response:', parseError);
        res.status(500).json({ 
          message: 'Failed to parse OpenAI response', 
          rawResponse: completion.choices[0].message.content,
          debug: debugInfo
        });
      }
    } catch (openAiError) {
      debugInfo.steps.push('Error en la llamada a OpenAI: ' + openAiError.message);
      console.error('OpenAI API error:', openAiError);
      
      res.status(500).json({ 
        message: 'Error connecting to OpenAI: ' + openAiError.message,
        debug: debugInfo,
        error: {
          message: openAiError.message,
          type: openAiError.type,
          code: openAiError.code
        }
      });
    }
  } catch (error) {
    debugInfo.steps.push('Error general: ' + error.message);
    console.error('Error generating questions:', error);
    res.status(500).json({ 
      message: 'Failed to generate questions: ' + error.message,
      debug: debugInfo
    });
  }
});

// Serve static files if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Initialize default cases if none exist
const seedDefaultCases = async () => {
  const count = await Case.count();
  if (count === 0) {
    const defaultCases = [
      { name: 'Estrategia Cloud', isDefault: true },
      { name: 'Eficiencia TI', isDefault: true },
      { name: 'Arquitectura Mobile', isDefault: true }
    ];
    
    await Case.bulkCreate(defaultCases);
    console.log('Default cases seeded');
  }
};

// Sync database and start the server
sequelize.sync()
  .then(async () => {
    app.listen(PORT, async () => {
      console.log(`Server running on port ${PORT}`);
      console.log('OpenAI API Key:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.substring(0, 4)}...` : 'Not set');
      try {
        await seedDefaultCases();
      } catch (error) {
        console.error('Error seeding default cases:', error);
      }
    });
  })
  .catch(err => console.error('Error syncing database:', err)); 