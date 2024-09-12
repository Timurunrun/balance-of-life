const express = require('express');
const cors = require('cors');
const dbService = require('./DatabaseService');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Routes
app.get('/goals/:userId', async (req, res) => {
  try {
    const goals = await dbService.getGoals(req.params.userId);
    res.json(goals);
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