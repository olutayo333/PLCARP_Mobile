import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://plrcap-backend.ambitiousground-313553a9.westeurope.azurecontainerapps.io/api/v1'
//'https://pluralcode-api.onrender.com/api/v1';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
});

// Add interceptor for auth
axiosInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const uploadFile = async (file: any, onUploadProgress?: (progressEvent: any) => void) => {
  const formData = new FormData();
  // In React Native, file is usually an object with uri, name, and type
  formData.append('file', file);

  try {
    const response = await axiosInstance.post('/upload', formData, {
      onUploadProgress,
    });
    return response.data;
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
};

export default axiosInstance;
