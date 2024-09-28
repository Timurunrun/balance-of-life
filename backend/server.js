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

const motivationalMessages = [
  "Время оценить свой баланс жизни! Зайди в приложение и узнай, как ты сегодня!",
  "Как ты сегодня? Оцени свои сферы жизни и найди гармонию!",
  "Не забывай о важности баланса! Открой приложение и сделай шаг к улучшению.",
  "Сегодня отличный день, чтобы проанализировать свою жизнь! Заходи в приложение.",
  "Ты готов сделать свою жизнь лучше? Оцени свои достижения в приложении!",
  "Каждый шаг важен! Проверь свой баланс жизни прямо сейчас.",
  "Давай сделаем паузу и оценим, как ты проводишь время. Заходи в приложение!",
  "Удели себе время! Открой приложение и оцени свой прогресс.",
  "Помни, что мелочи имеют значение. Заходи в приложение, чтобы увидеть свои успехи!",
  "Как ты заботишься о своем благополучии? Оцени свои сферы жизни в приложении!",
  "Не упускай шанс на саморазвитие! Открой приложение и узнай, что можно улучшить.",
  "Каждый день — это возможность. Зайди в приложение и оцени свой баланс!",
  "Ты заслуживаешь счастья и гармонии! Заходи в приложение и начни свой путь.",
  "Время для самоанализа! Открой приложение и посмотри, что можно изменить.",
  "Пора делать что-то для себя! Оцени свои сферы жизни в приложении.",
  "Как ты сегодня? Открой приложение и найди свой баланс.",
  "Твои достижения важны! Заходи в приложение и отслеживай прогресс.",
  "Не забывай про отдых и здоровье! Оцени свой баланс в приложении.",
  "Сделай первый шаг к гармонии! Заходи в приложение и начни сегодня.",
  "Как ты заботишься о своем счастье? Открой приложение и проанализируй свою жизнь.",
  "Каждый день — это новая возможность! Заходи в приложение и оцени свои цели.",
  "Напоминаем: твое время — это важно! Оцени свои приоритеты в приложении.",
  "Как ты сегодня? Удели минутку себе и оцени свой баланс в приложении!",
  "Ты на правильном пути! Заходи в приложение и проверь свои достижения.",
  "Зайди в приложение и посмотри, что ты достиг! Это твой момент.",
  "Ты заслуживаешь времени для себя! Оцени свои сферы жизни в приложении.",
  "Время для новых целей! Заходи в приложение и начни свой путь к успеху.",
  "Не упускай шанс изменить свою жизнь! Открой приложение и сделай шаг вперед.",
  "Твоя жизнь — это твой выбор! Заходи в приложение и оцени свои приоритеты.",
  "Сделай паузу и задумайся о своих целях. Оцени свой баланс в приложении.",
  "Ты готов к изменениям? Заходи в приложение и начни свой путь к лучшему.",
  "Каждый день — это шанс стать лучше! Открой приложение и оцени свои успехи.",
  "Как ты оцениваешь свою жизнь? Заходи в приложение и найди гармонию.",
  "Не забывай о своих мечтах! Заходи в приложение и проанализируй свои цели.",
  "Время для нового начала! Открой приложение и оцени свой прогресс.",
  "Ты на правильном пути! Заходи в приложение и посмотри, как ты движешься к своим целям.",
  "Как ты заботишься о себе? Открой приложение и проанализируй свои сферы жизни.",
  "Твое время важно! Зайди в приложение и найди свой баланс.",
  "Проверь, как ты проводишь время! Открой приложение и оцени свои достижения.",
  "Сделай шаг к гармонии! Заходи в приложение и узнай, как ты сегодня.",
  "Каждый день — это новая возможность! Заходи в приложение и оцени свой баланс.",
  "Твое счастье — в твоих руках! Открой приложение и начни изменения.",
  "Время для саморазмышления! Заходи в приложение и оцени свою жизнь.",
  "Ты заслуживаешь лучшего! Открой приложение и работай над собой.",
  "Сделай паузу и подумай о своих приоритетах. Заходи в приложение и оцени свои сферы.",
  "Как ты сегодня? Открой приложение и найди баланс в жизни.",
  "Напоминаем о важности заботы о себе! Заходи в приложение и оцени свой прогресс.",
  "Ты способен на большее! Открой приложение и сделай шаг к своей мечте.",
  "Пора действовать! Заходи в приложение и оцени, что ты можешь улучшить."
];

const getMotivationalMessages = () => {
  const index = Math.floor(Math.random() * motivationalMessages.length);
  return motivationalMessages[index];
};

app.post('/api/auth', async (req, res) => {
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

app.get('/api/goals/:userId', async (req, res) => {
  try {
    const goals = await dbService.getGoals(req.params.userId);
    res.json(goals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/statistics/:userId/:period', async (req, res) => {
  try {
    const { userId, period } = req.params;
    const statistics = await dbService.getStatistics(userId, period);
    res.json(statistics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/goals', async (req, res) => {
  try {
    const { userId, goalName } = req.body;
    const result = await dbService.addGoal(userId, goalName);
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/goals/:goalId', async (req, res) => {
  try {
    const { goalName } = req.body;
    const result = await dbService.updateGoal(req.params.goalId, goalName);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/goals/:goalId', async (req, res) => {
  try {
    const result = await dbService.deleteGoal(req.params.goalId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/goal-values', async (req, res) => {
  try {
    const { userId, values } = req.body;
    await dbService.saveGoalValues(userId, values);
    res.status(201).json({ message: 'Goal values saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/goal-values/:userId', async (req, res) => {
  try {
    const values = await dbService.getLatestGoalValues(req.params.userId);
    res.json(values);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/premium-status/:userId', async (req, res) => {
  try {
    const isPremium = await dbService.getPremiumStatus(req.params.userId);
    res.json({ isPremium });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/update-premium-status', async (req, res) => {
  try {
    const { userId, isPremium } = req.body;
    await dbService.updatePremiumStatus(userId, isPremium);
    res.json({ message: 'Premium status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/create-invoice', async (req, res) => {
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

app.get('/api/reminder/:userId', async (req, res) => {
  try {
    const reminder = await dbService.getReminder(req.params.userId);
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reminder', async (req, res) => {
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
        const message = getMotivationalMessages();
        await bot.sendMessage(
          reminder.user_id,
          message
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