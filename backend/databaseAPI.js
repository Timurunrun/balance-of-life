import axios from 'axios';

const API_URL = 'http://localhost:3001';

export const getGoals = async (userId) => {
  const response = await axios.get(`${API_URL}/goals/${userId}`);
  return response.data;
};

export const addGoal = async (userId, goalName, goalOrder) => {
  const response = await axios.post(`${API_URL}/goals`, { userId, goalName, goalOrder });
  return response.data;
};

export const updateGoal = async (goalId, goalName) => {
  const response = await axios.put(`${API_URL}/goals/${goalId}`, { goalName });
  return response.data;
};

export const deleteGoal = async (goalId) => {
  const response = await axios.delete(`${API_URL}/goals/${goalId}`);
  return response.data;
};

export const reorderGoals = async (userId, goals) => {
  const response = await axios.put(`${API_URL}/goals/reorder`, { userId, goals });
  return response.data;
};

export const saveGoalValues = async (userId, values) => {
  const response = await axios.post(`${API_URL}/goal-values`, { userId, values });
  return response.data;
};

export const getLatestGoalValues = async (userId) => {
  const response = await axios.get(`${API_URL}/goal-values/${userId}`);
  return response.data;
};

export const getStatistics = async (userId, period) => {
  const response = await axios.get(`${API_URL}/statistics/${userId}/${period}`);
  return response.data;
};