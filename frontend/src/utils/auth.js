import api, { TOKEN_KEY } from './api';

export const isAuthed = () => !!localStorage.getItem(TOKEN_KEY);

export const login = async (password) => {
  const { data } = await api.post('/auth/login', { password });
  localStorage.setItem(TOKEN_KEY, data.token);
  return data.token;
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
};
