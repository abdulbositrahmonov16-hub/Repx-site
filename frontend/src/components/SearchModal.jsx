import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search as SearchIcon, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchProducts } from '../utils/products';
import { formatPrice } from '../utils/cart';
import { useLang } from '../context/LanguageContext';

const coverImage = (p) =>
  (p.colors && p.colors[0] && p.colors[0].images && p.colors[0].images[0]) ||
  (p.images && p.images[0]) ||
  '';

const SearchModal = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const { t, categoryLabel } = useLang();

  // Fetch products once on first open (cached for session)
  useEffect(() => {
    if (isOpen && products.length === 0) {
      setLoading(true);
      fetchProducts()
        .then(setProducts)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    if (isOpen) {
      // Autofocus input after animation
      const id = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(id);
    }
  }, [isOpen, products.length]);

  // Reset query on close
  useEffect(() => {
    if (!isOpen) setQuery('');
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products.slice(0, 8);
    return products
      .filter((p) => {
        const inName = p.name?.toLowerCase().includes(q);
        const inCat = p.category?.toLowerCase().includes(q);
        const inDesc = p.description?.toLowerCase().includes(q);
        return inName || inCat || inDesc;
      })
      .slice(0, 20);
  }, [products, query]);

  const handleSelect = (id) => {
    navigate(`/product/${id}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[60] backdrop-blur-sm"
            data-testid="search-backdrop"
          />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-4 md:top-10 inset-x-4 md:inset-x-0 md:mx-auto md:max-w-2xl z-[70] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            data-testid="search-modal"
          >
            {/* Input row */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-black/10">
              <SearchIcon className="w-5 h-5 text-black/50" strokeWidth={1.7} />
              <input
                ref={inputRef}
                data-testid="search-input"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search_placeholder')}
                className="flex-1 bg-transparent border-0 focus:outline-none text-lg placeholder:text-black/30"
              />
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-black/60 hover:text-black"
                data-testid="search-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="text-center py-10 text-black/40 text-sm">
                  {t('loading')}
                </div>
              )}

              {!loading && results.length === 0 && (
                <div className="text-center py-12 px-6">
                  <p className="text-black/40 text-sm">{t('search_no_results')}</p>
                </div>
              )}

              {!loading && results.length > 0 && (
                <ul className="divide-y divide-black/[0.06]">
                  {!query && (
                    <li className="px-5 py-3 text-[10px] uppercase tracking-[0.22em] text-black/40">
                      {t('search_popular')}
                    </li>
                  )}
                  {results.map((p) => (
                    <li key={p.id}>
                      <button
                        onClick={() => handleSelect(p.id)}
                        data-testid={`search-result-${p.id}`}
                        className="w-full flex items-center gap-4 px-5 py-3 text-left hover:bg-neutral-50 transition-colors group"
                      >
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-neutral-100 flex-shrink-0">
                          <img
                            src={coverImage(p)}
                            alt={p.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{p.name}</p>
                          <p className="text-xs text-black/50">{categoryLabel(p.category)}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-['Anton'] text-lg tracking-wide">
                            {formatPrice(p.price)}
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-black/30 group-hover:text-black group-hover:translate-x-0.5 transition-all" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
