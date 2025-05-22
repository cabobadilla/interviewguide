require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');
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

// Define Question Model
const Question = sequelize.define('Question', {
  question: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'general'
  }
}, {
  timestamps: true
});

// Define Interview Model
const Interview = sequelize.define('Interview', {
  interviewCode: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  interviewDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  candidateName: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  }
}, {
  timestamps: true
});

// Define Selected Question Model (preguntas seleccionadas en cada entrevista)
const SelectedQuestion = sequelize.define('SelectedQuestion', {
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  timestamps: true
});

// Define relationships
Case.hasMany(Question);
Question.belongsTo(Case);

Interview.belongsTo(Case);
Case.hasMany(Interview);

Interview.belongsToMany(Question, { through: SelectedQuestion });
Question.belongsToMany(Interview, { through: SelectedQuestion });

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
    
    // Log de depuración para ver qué casos están disponibles
    console.log("Casos disponibles en la base de datos:", 
      cases.map(c => ({ id: c.id, name: c.name, isDefault: c.isDefault }))
    );
    
    res.json(cases);
  } catch (error) {
    console.error('Error fetching cases:', error);
    res.status(500).json({ message: 'Failed to fetch cases' });
  }
});

// Endpoint para obtener un caso específico
app.get('/api/cases/:id', async (req, res) => {
  try {
    const caseId = req.params.id;
    const caseData = await Case.findByPk(caseId);
    
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    res.json(caseData);
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({ message: 'Failed to fetch case' });
  }
});

// Endpoint para actualizar un caso
app.put('/api/cases/:id', async (req, res) => {
  try {
    const caseId = req.params.id;
    const { name, description } = req.body;
    
    const caseData = await Case.findByPk(caseId);
    
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Verificar si el nuevo nombre ya existe (excluyendo el caso actual)
    if (name && name !== caseData.name) {
      const existingCase = await Case.findOne({ 
        where: { 
          name,
          id: { [Op.ne]: caseId }
        } 
      });
      
      if (existingCase) {
        return res.status(400).json({ message: 'Ya existe un caso con ese nombre' });
      }
    }
    
    // Actualizar los campos
    await caseData.update({
      name: name || caseData.name,
      description: description !== undefined ? description : caseData.description
    });
    
    res.json(caseData);
  } catch (error) {
    console.error('Error updating case:', error);
    res.status(500).json({ message: 'Failed to update case' });
  }
});

// Get questions for a case
app.get('/api/cases/:id/questions', async (req, res) => {
  try {
    const caseId = req.params.id;
    console.log(`Fetching questions for case ID: ${caseId}`);
    
    let caseData = await Case.findByPk(caseId);
    
    if (!caseData) {
      // Intentar buscar por nombre
      caseData = await Case.findOne({ where: { name: caseId } });
      
      if (!caseData) {
        return res.status(404).json({ message: 'Case not found' });
      }
    }
    
    // Buscar preguntas asociadas a este caso
    const questions = await Question.findAll({
      where: { CaseId: caseData.id },
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Found ${questions.length} questions for case: ${caseData.name}`);
    
    res.json({
      case: caseData,
      questions: questions
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Failed to fetch questions' });
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
    // Listar todos los casos para depuración
    const allCases = await Case.findAll();
    const casesInfo = allCases.map(c => ({ id: c.id, name: c.name }));
    console.log('Todos los casos en la base de datos:', casesInfo);
    debugInfo.cases = casesInfo;
    debugInfo.steps.push(`Casos disponibles: ${allCases.length}`);
    
    let caseData = null;
    const caseId = req.params.id;
    
    // Si el ID es numérico, buscar por ID
    if (!isNaN(caseId)) {
      debugInfo.steps.push(`Buscando caso por ID: ${caseId}`);
      caseData = await Case.findByPk(parseInt(caseId, 10));
    }
    
    // Si no se encontró por ID o el ID no es numérico, buscar por nombre exacto
    if (!caseData) {
      debugInfo.steps.push(`No se encontró por ID, buscando por nombre exacto: ${caseId}`);
      caseData = await Case.findOne({ 
        where: { name: caseId } 
      });
    }
    
    // Si aún no se encuentra, buscar por nombre parcial
    if (!caseData) {
      debugInfo.steps.push(`No se encontró por nombre exacto, buscando por coincidencia parcial`);
      caseData = await Case.findOne({ 
        where: { 
          name: { 
            [Op.like]: `%${caseId}%` 
          } 
        } 
      });
    }
    
    // Probar con los nombres predeterminados si aún no se encuentra
    if (!caseData) {
      const defaultNames = ['Estrategia Cloud', 'Eficiencia TI', 'Arquitectura Mobile'];
      if (defaultNames.includes(caseId)) {
        debugInfo.steps.push(`Buscando caso predeterminado: ${caseId}`);
        caseData = await Case.findOne({ where: { name: caseId } });
      }
    }
    
    // Buscar entre todos los casos
    if (!caseData && allCases.length > 0) {
      debugInfo.steps.push(`Usando el primer caso disponible como alternativa`);
      caseData = allCases[0];
    }
    
    // Si finalmente no se encuentra ningún caso
    if (!caseData) {
      debugInfo.steps.push(`No se encontró ningún caso, creando uno temporal`);
      
      // Crear un caso temporal para la consulta
      const tempCaseName = caseId || "Entrevista técnica";
      caseData = { name: tempCaseName };
      
      // Opcionalmente, guardar este caso en la base de datos
      try {
        const newCase = await Case.create({
          name: tempCaseName,
          isDefault: false
        });
        debugInfo.steps.push(`Caso temporal creado en la base de datos: ${newCase.name} (ID: ${newCase.id})`);
        caseData = newCase;
      } catch (createError) {
        debugInfo.steps.push(`Error al crear caso temporal: ${createError.message}`);
      }
    }
    
    return await generateQuestionsForCase(caseData, req, res, debugInfo);
  } catch (error) {
    debugInfo.steps.push(`Error general: ${error.message}`);
    console.error('Error generating questions:', error);
    res.status(500).json({ 
      message: `Failed to generate questions: ${error.message}`,
      debug: debugInfo
    });
  }
});

// Función separada para generar preguntas
async function generateQuestionsForCase(caseData, req, res, debugInfo) {
  debugInfo.steps.push('Caso encontrado: ' + caseData.name);
  
  // Verify OpenAI API key is set
  if (!process.env.OPENAI_API_KEY) {
    debugInfo.steps.push('Error: API key de OpenAI no está configurada');
    return res.status(500).json({ 
      message: 'OpenAI API key is not set',
      debug: debugInfo
    });
  }
  
  // Verificar si ya existen preguntas para este caso
  let existingQuestions = [];
  if (caseData.id) {
    existingQuestions = await Question.findAll({
      where: { CaseId: caseData.id },
      order: [['createdAt', 'DESC']],
      limit: 10
    });
    
    if (existingQuestions.length > 0) {
      debugInfo.steps.push(`Se encontraron ${existingQuestions.length} preguntas guardadas previamente`);
      
      // Si hay preguntas recientes, devolverlas directamente
      if (existingQuestions.length >= 5 && !req.query.refresh) {
        debugInfo.steps.push('Usando preguntas existentes en lugar de generar nuevas');
        debugInfo.openaiConnected = true; // Para indicar que el proceso fue exitoso
        
        return res.json({
          case: caseData,
          questions: existingQuestions,
          openaiConnected: true,
          fromCache: true,
          debug: debugInfo
        });
      }
    }
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
          content: "Eres un experto entrevistador técnico para arquitectos. Genera preguntas clave para una entrevista en español."
        },
        {
          role: "user", 
          content: `Genera entre 5 y 8 preguntas técnicas clave en español para una entrevista a un arquitecto enfocadas en "${caseData.name}". 
          Incluye tanto preguntas relacionadas con el proceso como preguntas sobre aspectos clave a considerar.
          Formatea la respuesta como un objeto JSON con una propiedad "questions" que contenga un array de objetos con campos "question" y "type",
          donde "type" puede ser "process" (para preguntas de proceso) o "consideration" (para preguntas de consideraciones).
          Todas las preguntas deben estar en español.`
        }
      ],
      response_format: { type: "json_object" }
    });
    
    debugInfo.steps.push('Respuesta recibida de OpenAI');
    debugInfo.openaiConnected = true;
    console.log('OpenAI response received');
    
    try {
      const questionData = JSON.parse(completion.choices[0].message.content);
      debugInfo.steps.push('Respuesta JSON parseada correctamente');
      console.log('Parsed response:', questionData);
      
      let savedQuestions = [];
      
      // Guardar las preguntas en la base de datos
      if (caseData.id && questionData.questions && Array.isArray(questionData.questions)) {
        debugInfo.steps.push(`Guardando ${questionData.questions.length} preguntas en la base de datos`);
        
        // Primero eliminamos preguntas anteriores si hay más de 20
        const count = await Question.count({ where: { CaseId: caseData.id } });
        if (count > 20) {
          const oldQuestions = await Question.findAll({
            where: { CaseId: caseData.id },
            order: [['createdAt', 'ASC']],
            limit: count - 20
          });
          
          if (oldQuestions.length > 0) {
            await Question.destroy({
              where: { id: oldQuestions.map(q => q.id) }
            });
            debugInfo.steps.push(`Se eliminaron ${oldQuestions.length} preguntas antiguas`);
          }
        }
        
        // Guardar las nuevas preguntas
        for (const q of questionData.questions) {
          const newQuestion = await Question.create({
            question: q.question,
            type: q.type,
            CaseId: caseData.id
          });
          savedQuestions.push(newQuestion);
        }
        debugInfo.steps.push(`${savedQuestions.length} preguntas guardadas exitosamente`);
      } else {
        debugInfo.steps.push('No se pudieron guardar las preguntas (caso sin ID o formato incorrecto)');
        savedQuestions = questionData.questions || [];
      }
      
      return res.json({
        case: caseData,
        questions: savedQuestions.length > 0 ? savedQuestions : questionData.questions || [],
        openaiConnected: true,
        debug: debugInfo
      });
    } catch (parseError) {
      debugInfo.steps.push('Error al parsear JSON: ' + parseError.message);
      console.error('Error parsing OpenAI response:', parseError);
      return res.status(500).json({ 
        message: 'Failed to parse OpenAI response', 
        rawResponse: completion.choices[0].message.content,
        debug: debugInfo
      });
    }
  } catch (openAiError) {
    debugInfo.steps.push('Error en la llamada a OpenAI: ' + openAiError.message);
    console.error('OpenAI API error:', openAiError);
    
    return res.status(500).json({ 
      message: 'Error connecting to OpenAI: ' + openAiError.message,
      debug: debugInfo,
      error: {
        message: openAiError.message,
        type: openAiError.type,
        code: openAiError.code
      }
    });
  }
}

// Serve static files if in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Initialize default cases if none exist
const seedDefaultCases = async () => {
  try {
    const count = await Case.count();
    console.log(`Casos existentes en la base de datos: ${count}`);
    
    if (count === 0) {
      console.log("Creando casos predeterminados...");
      const defaultCases = [
        { name: 'Estrategia Cloud', isDefault: true },
        { name: 'Eficiencia TI', isDefault: true },
        { name: 'Arquitectura Mobile', isDefault: true }
      ];
      
      const createdCases = await Case.bulkCreate(defaultCases);
      console.log('Casos predeterminados creados:', 
        createdCases.map(c => ({ id: c.id, name: c.name }))
      );
    } else {
      console.log("Ya existen casos en la base de datos, no se crearán predeterminados.");
      // Mostrar casos existentes
      const existingCases = await Case.findAll();
      console.log('Casos existentes:', 
        existingCases.map(c => ({ id: c.id, name: c.name }))
      );
    }
  } catch (error) {
    console.error('Error en seedDefaultCases:', error);
  }
};

// Generar código incremental para entrevistas
const generateInterviewCode = async () => {
  try {
    const count = await Interview.count();
    const nextNumber = count + 1;
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    return `E${year}${month}-${nextNumber.toString().padStart(4, '0')}`;
  } catch (error) {
    console.error('Error generating interview code:', error);
    return `E-${Date.now()}`;
  }
};

// Endpoint para crear una nueva entrevista
app.post('/api/interviews', async (req, res) => {
  try {
    const { caseId, candidateName = '', notes = '' } = req.body;
    
    // Verificar que el caso existe
    const caseData = await Case.findByPk(caseId);
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Generar código único
    const interviewCode = await generateInterviewCode();
    
    // Crear la entrevista
    const interview = await Interview.create({
      interviewCode,
      candidateName,
      notes,
      CaseId: caseId
    });
    
    res.status(201).json(interview);
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({ message: 'Failed to create interview' });
  }
});

// Endpoint para añadir preguntas seleccionadas a una entrevista
app.post('/api/interviews/:id/questions', async (req, res) => {
  try {
    const { questionId, selected } = req.body;
    const interviewId = req.params.id;
    
    // Verificar que la entrevista existe
    const interview = await Interview.findByPk(interviewId);
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    
    // Verificar que la pregunta existe
    const question = await Question.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    
    if (selected) {
      // Contar cuántas preguntas ya están seleccionadas para determinar el orden
      const selectedCount = await SelectedQuestion.count({
        where: { InterviewId: interviewId }
      });
      
      // Añadir la pregunta seleccionada
      await SelectedQuestion.create({
        InterviewId: interviewId,
        QuestionId: questionId,
        order: selectedCount + 1
      });
      
      res.json({ message: 'Question added to interview', order: selectedCount + 1 });
    } else {
      // Eliminar la pregunta si ya no está seleccionada
      await SelectedQuestion.destroy({
        where: {
          InterviewId: interviewId,
          QuestionId: questionId
        }
      });
      
      // Reordenar las preguntas restantes
      const selectedQuestions = await SelectedQuestion.findAll({
        where: { InterviewId: interviewId },
        order: [['order', 'ASC']]
      });
      
      for (let i = 0; i < selectedQuestions.length; i++) {
        await selectedQuestions[i].update({ order: i + 1 });
      }
      
      res.json({ message: 'Question removed from interview' });
    }
  } catch (error) {
    console.error('Error updating selected questions:', error);
    res.status(500).json({ message: 'Failed to update selected questions' });
  }
});

// Endpoint para obtener entrevistas
app.get('/api/interviews', async (req, res) => {
  try {
    const interviews = await Interview.findAll({
      include: [
        { model: Case },
        { model: Question }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    res.json(interviews);
  } catch (error) {
    console.error('Error fetching interviews:', error);
    res.status(500).json({ message: 'Failed to fetch interviews' });
  }
});

// Endpoint para obtener una entrevista específica con sus preguntas seleccionadas
app.get('/api/interviews/:id', async (req, res) => {
  try {
    const interview = await Interview.findByPk(req.params.id, {
      include: [
        { model: Case },
        { 
          model: Question,
          through: {
            attributes: ['order']
          }
        }
      ]
    });
    
    if (!interview) {
      return res.status(404).json({ message: 'Interview not found' });
    }
    
    res.json(interview);
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({ message: 'Failed to fetch interview' });
  }
});

// Sync database and start the server
sequelize.sync() // No forzar recreación para preservar datos
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