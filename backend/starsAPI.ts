import { initInvoice } from '@telegram-apps/sdk';
import axios from 'axios';

const API_URL = '';

const invoice = initInvoice();

export const createInvoiceLink = async (title: string, description: string, payload: string, prices: any) => {
  try {
    const response = await axios.post(`${API_URL}/api/create-invoice`, { title: title, description: description, payload: payload, prices: prices });
    try {
      if (response.data.ok) {
        const invoiceUrl = response.data.result;
        invoice.open(invoiceUrl, 'url').then(async () => {
          await axios.post(`${API_URL}/api/update-premium-status`, { userId: payload, isPremium: true });
        });
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