import { retrieveLaunchParams } from '@telegram-apps/sdk';
import axios from 'axios';

const API_URL = 'http://localhost:3001'; // Make sure this matches your backend URL

export const authorizeUser = async () => {
  try {
    console.log('Retrieving launch params');
    const { initDataRaw } = retrieveLaunchParams();
    
    if (!initDataRaw) {
      console.error('Init data is missing');
      throw new Error('Init data is missing');
    }

    console.log('Sending auth request to server');
    const response = await axios.post(`${API_URL}/auth`, { initData: initDataRaw });

    console.log('Auth response received:', response.data);
    return response.data.userId;
  } catch (error) {
    console.error('Authorization failed:', error);
    throw error;
  }
};