import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';

const config = {
  BASE_URL,
};

export default config;