// API Configuration
// In development with Vite, use relative paths to leverage Vite's proxy
// In production, use the full URL
export const API_BASE_URL = typeof import.meta.env.VITE_API_BASE_URL !== 'undefined' && import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL
  : '';

console.log('📋 API_BASE_URL configured as:', API_BASE_URL || '(empty - using relative paths)');
