// api/client.ts
// Central axios instance — all API calls go through here

import axios from 'axios';

const client = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach user_id to every request automatically from localStorage
client.interceptors.request.use((config) => {
  const userJson = localStorage.getItem('buffaloffit_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user?.id) {
        // Add user_id as query param (our backend reads it this way)
        config.params = { ...config.params, user_id: user.id };
      }
    } catch {}
  }
  return config;
});

export default client;
