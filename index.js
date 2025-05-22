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
  try {
    const caseData = await Case.findByPk(req.params.id);
    
    if (!caseData) {
      return res.status(404).json({ message: 'Case not found' });
    }
    
    // Generate questions using OpenAI API
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

    const questions = JSON.parse(completion.choices[0].message.content);
    res.json(questions);
  } catch (error) {
    console.error('Error generating questions:', error);
    res.status(500).json({ message: 'Failed to generate questions' });
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
      try {
        await seedDefaultCases();
      } catch (error) {
        console.error('Error seeding default cases:', error);
      }
    });
  })
  .catch(err => console.error('Error syncing database:', err)); 