import axios from 'axios';

const API_URL = '';

export const getGoals = async (userId) => {
  const response = await axios.get(`${API_URL}/api/goals/${userId}`);
  return response.data;
};

export const addGoal = async (userId, goalName, goalOrder) => {
  const response = await axios.post(`${API_URL}/api/goals`, { userId, goalName, goalOrder });
  return response.data;
};

export const updateGoal = async (goalId, goalName) => {
  const response = await axios.put(`${API_URL}/api/goals/${goalId}`, { goalName });
  return response.data;
};

export const deleteGoal = async (goalId) => {
  const response = await axios.delete(`${API_URL}/api/goals/${goalId}`);
  return response.data;
};

export const reorderGoals = async (userId, goals) => {
  const response = await axios.put(`${API_URL}/api/goals/reorder`, { userId, goals });
  return response.data;
};

export const saveGoalValues = async (userId, values) => {
  const response = await axios.post(`${API_URL}/api/goal-values`, { userId, values });
  return response.data;
};

export const getLatestGoalValues = async (userId) => {
  const response = await axios.get(`${API_URL}/api/goal-values/${userId}`);
  return response.data;
};

export const getStatistics = async (userId, period) => {
  const response = await axios.get(`${API_URL}/api/statistics/${userId}/${period}`);
  return response.data;
};

export const getPremiumStatus = async (userId) => {
  const response = await axios.get(`${API_URL}/api/premium-status/${userId}`);
  return response.data.isPremium;
};

export const getReminder = async (userId) => {
  const response = await axios.get(`${API_URL}/api/reminder/${userId}`);
  return response.data;
};

export const setReminder = async (userId, frequency, time, timezone) => {
  const response = await axios.post(`${API_URL}/api/reminder`, { userId, frequency, time, timezone });
  return response.data;
};