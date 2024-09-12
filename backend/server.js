const express = require('express');
const cors = require('cors');
const dbService = require('./DatabaseService');
const { validate, parse } = require('@telegram-apps/init-data-node');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/auth', async (req, res) => {
  try {
    console.log('Received auth request');
    const { initData } = req.body;
    if (!initData) {
      console.error('Init data is missing');
      return res.status(400).json({ error: 'Init data is missing' });
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      console.error('BOT_TOKEN is not set in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log('Validating init data');
    try {
      validate(initData, botToken, {
        expiresIn: 3600,
      });
    } catch (validationError) {
      console.error('Init data validation failed:', validationError);
      return res.status(401).json({ error: 'Invalid init data' });
    }

    console.log('Parsing init data');
    const parsedInitData = parse(initData);

    const userId = parsedInitData.user.id.toString();
    console.log(`User ID: ${userId}`);

    console.log('Ensuring user exists in the database');
    try {
      await dbService.ensureUserExists(userId, parsedInitData.user.username);
    } catch (dbError) {
      console.error('Error ensuring user exists:', dbError);
      return res.status(500).json({ error: 'Database error' });
    }

    console.log('Auth successful');
    res.json({ userId });
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.get('/goals/:userId', async (req, res) => {
  try {
    console.log(`Fetching goals for user: ${req.params.userId}`);
    const goals = await dbService.getGoals(req.params.userId);
    console.log('Fetched goals:', goals);
    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/statistics/:userId/:period', async (req, res) => {
  try {
    const { userId, period } = req.params;
    const statistics = await dbService.getStatistics(userId, period);
    res.json(statistics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/goals', async (req, res) => {
  try {
    const { userId, goalName } = req.body;
    const result = await dbService.addGoal(userId, goalName);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/goals/:goalId', async (req, res) => {
  try {
    const { goalName } = req.body;
    const result = await dbService.updateGoal(req.params.goalId, goalName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/goals/:goalId', async (req, res) => {
  try {
    const result = await dbService.deleteGoal(req.params.goalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/goal-values', async (req, res) => {
  try {
    const { userId, values } = req.body;
    await dbService.saveGoalValues(userId, values);
    res.status(201).json({ message: 'Goal values saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/goal-values/:userId', async (req, res) => {
  try {
    const values = await dbService.getLatestGoalValues(req.params.userId);
    res.json(values);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});