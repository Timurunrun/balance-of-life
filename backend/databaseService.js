const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

class DatabaseService {
  constructor() {
    this.db = null;
    this.initDatabase();
  }

  async initDatabase() {
    this.db = await open({
      filename: './database.sqlite',
      driver: sqlite3.Database
    });

    const schema = `
      -- Create Users table
      CREATE TABLE IF NOT EXISTS Users (
          user_id INTEGER PRIMARY KEY,
          username TEXT NOT NULL,
          is_premium BOOLEAN NOT NULL DEFAULT FALSE
      );
      -- Create Goals table
      CREATE TABLE IF NOT EXISTS Goals (
          goal_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          goal_name TEXT NOT NULL,
          goal_order INTEGER NOT NULL,
          FOREIGN KEY (user_id) REFERENCES Users(user_id)
      );
      -- Create GoalValues table
      CREATE TABLE IF NOT EXISTS GoalValues (
          value_id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          goal_id INTEGER,
          value INTEGER NOT NULL,
          date TEXT NOT NULL,
          FOREIGN KEY (user_id) REFERENCES Users(user_id),
          FOREIGN KEY (goal_id) REFERENCES Goals(goal_id)
      );
    `;

    await this.db.exec(schema);
  }

  async getGoals(userId) {
    const goals = await this.db.all('SELECT * FROM Goals WHERE user_id = ? ORDER BY goal_order', userId);
    return goals;
  }

  async addGoal(userId, goalName) {
    const maxOrder = await this.db.get('SELECT MAX(goal_order) as maxOrder FROM Goals WHERE user_id = ?', userId);
    const newOrder = (maxOrder?.maxOrder || 0) + 1;
    return this.db.run('INSERT INTO Goals (user_id, goal_name, goal_order) VALUES (?, ?, ?)', [userId, goalName, newOrder]);
  }

  async updateGoal(goalId, goalName) {
    return this.db.run('UPDATE Goals SET goal_name = ? WHERE goal_id = ?', [goalName, goalId]);
  }

  async deleteGoal(goalId) {
    return this.db.run('DELETE FROM Goals WHERE goal_id = ?', goalId);
  }

  async saveGoalValues(userId, values) {
    const date = new Date().toISOString().split('T')[0];
    const stmt = await this.db.prepare('INSERT INTO GoalValues (user_id, goal_id, value, date) VALUES (?, ?, ?, ?)');
    for (const { goalId, value } of values) {
      await stmt.run(userId, goalId, value, date);
    }
    await stmt.finalize();
  }

  async getLatestGoalValues(userId) {
    return this.db.all(`
      SELECT gv.*
      FROM GoalValues gv
      INNER JOIN (
        SELECT goal_id, MAX(date) as max_date
        FROM GoalValues
        WHERE user_id = ?
        GROUP BY goal_id
      ) latest ON gv.goal_id = latest.goal_id AND gv.date = latest.max_date
      WHERE gv.user_id = ?
    `, [userId, userId]);
  }

  async getStatistics(userId, period) {
    const startDate = this.getStartDate(period);
    const endDate = new Date().toISOString().split('T')[0];
  
    const query = `
      SELECT g.goal_name as aspect, AVG(gv.value) as rating
      FROM Goals g
      LEFT JOIN GoalValues gv ON g.goal_id = gv.goal_id
      WHERE g.user_id = ? AND gv.date BETWEEN ? AND ?
      GROUP BY g.goal_id
      ORDER BY g.goal_order
    `;
  
    const results = await this.db.all(query, [userId, startDate, endDate]);
    
    return {
      [period]: results.map(row => ({
        aspect: row.aspect,
        rating: parseFloat(row.rating.toFixed(1)) || 0
      }))
    };
  }
  
  getStartDate(period) {
    const now = new Date();
    switch (period) {
      case 'week':
        now.setDate(now.getDate() - 7);
        break;
      case 'month':
        now.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        now.setFullYear(now.getFullYear() - 1);
        break;
      default:
        throw new Error('Invalid period');
    }
    return now.toISOString().split('T')[0];
  }
  
  async updatePremiumStatus(userId, isPremium) {
    return this.db.run('UPDATE Users SET isPremium = ? WHERE user_id = ?', [isPremium ? 1 : 0, userId]);
  }
  
  async ensureUserExists(userId, username) {
    const user = await this.db.get('SELECT * FROM Users WHERE user_id = ?', userId);
    if (!user) {
      await this.db.run('INSERT INTO Users (user_id, username) VALUES (?, ?)', [userId, username]);
      
      const sampleGoals = ['Семья', 'Деньги', 'Спорт', 'Здоровье', 'Развлечения'];
      for (let i = 0; i < sampleGoals.length; i++) {
        await this.addGoal(userId, sampleGoals[i]);
      }
    } else {
    }
  }
}

module.exports = new DatabaseService();