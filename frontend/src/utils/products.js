// Product store backed by the FastAPI + MongoDB backend.
// Changes made in the Admin panel are persisted server-side and visible to everyone.

import api from './api';

export const fetchProducts = async (params = {}) => {
  const { data } = await api.get('/products', { params });
  return data;
};

export const fetchProductById = async (id) => {
  const { data } = await api.get(`/products/${id}`);
  return data;
};

export const createProduct = async (product) => {
  const { data } = await api.post('/products', product);
  return data;
};

export const updateProduct = async (id, product) => {
  const { data } = await api.put(`/products/${id}`, product);
  return data;
};

export const deleteProduct = async (id) => {
  const { data } = await api.delete(`/products/${id}`);
  return data;
};

// Uploads a File to the backend, which stores it in Cloudinary and returns a URL.
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.url || data.secure_url;
};
