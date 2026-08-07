import api from './api';

export const createOrder = async (order) => {
  const { data } = await api.post('/orders', order);
  return data;
};

export const fetchOrders = async () => {
  const { data } = await api.get('/orders');
  return data;
};

export const updateOrderStatus = async (id, status) => {
  const { data } = await api.patch(`/orders/${id}`, { status });
  return data;
};

export const deleteOrder = async (id) => {
  const { data } = await api.delete(`/orders/${id}`);
  return data;
};

export const fetchStats = async () => {
  const { data } = await api.get('/stats');
  return data;
};

// Fire-and-forget add-to-cart analytics event.
export const logAddToCart = async (product, size) => {
  try {
    await api.post('/events/cart', {
      product_id: product.id,
      name: product.name,
      size: String(size || ''),
    });
  } catch (e) {
    // non-critical
  }
};
