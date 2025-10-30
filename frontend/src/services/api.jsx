import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/',
});

export const uploadFile = (formData, onUploadProgress) => {
  return api.post('upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
};

export default {
  uploadFile,
};