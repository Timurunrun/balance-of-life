import { retrieveLaunchParams } from '@telegram-apps/sdk';
import axios from 'axios';

const API_URL = '';

export const authorizeUser = async () => {
  try {
    const { initDataRaw } = retrieveLaunchParams();
    
    if (!initDataRaw) {
      throw new Error('Init data is missing');
    }

    const response = await axios.post(`${API_URL}/api/auth`,
      { initData: initDataRaw },
      { headers: { 'Content-Type': 'application/json' } }
    );

    return response.data.userId;
  } catch (error) {
    throw error;
  }
};