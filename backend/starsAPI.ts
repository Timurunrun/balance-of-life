import { initInvoice } from '@telegram-apps/sdk';
import axios from 'axios';

const API_URL = 'http://localhost:3001';

const invoice = initInvoice();

export const createInvoiceLink = async (title: string, description: string, payload: string, prices: any) => {
  try {
    const response = await axios.post(`${API_URL}/create-invoice`, { title: title, description: description, payload: payload, prices: prices });
    try {
      if (response.data.ok) {
        invoice.open(response.data.result, 'url');
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      throw error;
    }
  } catch (error) {
    throw error;
  }
};