const express = require('express');
const cors = require('cors');
const dbService = require('./DatabaseService');
const { validate, parse } = require('@telegram-apps/init-data-node');
require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
const TelegramBot = require('node-telegram-bot-api');
const botToken = process.env.BOT_TOKEN;
const bot = new TelegramBot(botToken);
const moment = require('moment-timezone');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.post('/auth', async (req, res) => {
  try {
    const { initData } = req.body;
    if (!initData) {
      return res.status(400).json({ error: 'Init data is missing' });
    }

    const botToken = process.env.BOT_TOKEN;
    if (!botToken) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    try {
      validate(initData, botToken, {
        expiresIn: 3600,
      });
    } catch (validationError) {
      return res.status(401).json({ error: 'Invalid init data' });
    }

    const parsedInitData = parse(initData);

    const userId = parsedInitData.user.id.toString();

    try {
      await dbService.ensureUserExists(userId, parsedInitData.user.username);
    } catch (dbError) {
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ userId });
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

app.get('/goals/:userId', async (req, res) => {
  try {
    const goals = await dbService.getGoals(req.params.userId);
    res.json(goals);
  } catch (error) {
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

app.get('/premium-status/:userId', async (req, res) => {
  try {
    const isPremium = await dbService.getPremiumStatus(req.params.userId);
    res.json({ isPremium });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-premium-status', async (req, res) => {
  try {
    const { userId, isPremium } = req.body;
    await dbService.updatePremiumStatus(userId, isPremium);
    res.json({ message: 'Premium status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/create-invoice', async (req, res) => {
  try {

    const { title, description, payload, prices } = req.body;

    const botToken = process.env.BOT_TOKEN;
    const url = `https://api.telegram.org/bot${botToken}/createInvoiceLink`;

    const data = {
        title,
        description,
        payload,
        currency: 'XTR',
        prices: JSON.stringify(prices),
    };

    try {
        const response = await axios.post(url, data);
        res.json(response.data);
    } catch (error) {
        throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/reminder/:userId', async (req, res) => {
  try {
    const reminder = await dbService.getReminder(req.params.userId);
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/reminder', async (req, res) => {
  try {
    const { userId, frequency, time, timezone } = req.body;
    await dbService.setReminder(userId, frequency, time, timezone);
    res.status(201).json({ message: 'Reminder set successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

cron.schedule('* * * * *', async () => {
  try {
    const reminders = await dbService.getAllReminders();
    const nowUTC = moment.utc();

    for (const reminder of reminders) {
      const userTime = moment.tz(nowUTC, reminder.timezone);
      const [hours, minutes] = reminder.time.split(':').map(Number);
      const reminderTime = userTime.clone().hours(hours).minutes(minutes).seconds(0).milliseconds(0);

      const lastNotifiedDate = reminder.last_notified ? moment.utc(reminder.last_notified) : null;
      const diffDays = lastNotifiedDate
        ? userTime.startOf('day').diff(moment.tz(lastNotifiedDate, reminder.timezone).startOf('day'), 'days')
        : null;

      if (
        userTime.isSameOrAfter(reminderTime) &&
        (diffDays === null || diffDays >= reminder.frequency)
      ) {
        await bot.sendMessage(
          reminder.user_id,
          'Это ваше запланированное напоминание!'
        );

        await dbService.updateLastNotified(reminder.user_id);
      }
    }
  } catch (error) {
    console.error('Error in scheduled task:', error);
  }
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});