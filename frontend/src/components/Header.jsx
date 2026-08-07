import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCart } from '../utils/cart';
import { useLang } from '../context/LanguageContext';

const Header = ({ onCartOpen }) => {
  const [cartCount, setCartCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { t, lang, setLang } = useLang();

  useEffect(() => {
    const updateCartCount = () => {
      const cart = getCart();
      setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    };
    updateCartCount();
    window.addEventListener('cartUpdate', updateCartCount);
    return () => window.removeEventListener('cartUpdate', updateCartCount);
  }, []);

  const isActive = (path) => location.pathname === path;

  const LangSwitch = () => (
    <div className="flex items-center rounded-full border border-black/10 overflow-hidden text-xs font-semibold">
      {['ru', 'uz'].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-3 py-1.5 transition-colors ${
            lang === l ? 'bg-[#BFA982] text-black' : 'text-black/60 hover:text-black'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-black/5"
    >
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              className="font-['Anton'] text-3xl tracking-wider"
            >
              REP<span className="text-[#8A7548]">X</span>
            </motion.div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              to="/catalog"
              className={`text-sm tracking-wide transition-colors ${
                isActive('/catalog') ? 'text-[#8A7548]' : 'text-black hover:text-[#8A7548]'
              }`}
            >
              {t('nav_catalog')}
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <LangSwitch />
            <button onClick={onCartOpen} className="relative group" aria-label="Open cart">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <ShoppingBag className="w-6 h-6 text-black group-hover:text-[#8A7548] transition-colors" />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 bg-[#BFA982] text-black text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </motion.div>
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="py-4 flex flex-col gap-4">
                <Link
                  to="/catalog"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`text-sm tracking-wide ${
                    isActive('/catalog') ? 'text-[#8A7548]' : 'text-black'
                  }`}
                >
                  {t('nav_catalog')}
                </Link>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
};

export default Header;
