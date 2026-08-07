import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';
import { login } from '../utils/auth';
import { apiError } from '../utils/api';

const AdminLogin = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(password);
      onSuccess();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6 pt-28 pb-20">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-[#BFA982]/15 flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#8A7548]" />
          </div>
          <h1 className="font-['Anton'] text-3xl tracking-wide">ВХОД</h1>
        </div>
        <p className="text-black/60 mb-8">Панель администратора RepX</p>

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-2">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            placeholder="Введите пароль"
            className="w-full px-4 py-3 rounded-lg border border-black/10 focus:border-[#BFA982] focus:ring-1 focus:ring-[#BFA982] outline-none transition-colors"
          />

          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading || !password}
            className="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#BFA982] text-black font-semibold tracking-wide hover:bg-[#A8906A] transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'ВОЙТИ'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
