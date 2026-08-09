import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { sneakerSubcategories } from '../mockData';
import { fetchProducts } from '../utils/products';
import { formatPrice } from '../utils/cart';
import { useLang } from '../context/LanguageContext';

const CATALOG_HERO = 'https://customer-assets-gfyr7b9c.emergentagent.net/job_repx-shop/artifacts/rgk7kivn_IMG_20260803_125419_953.jpg';

const coverImage = (p) =>
  (p.colors && p.colors[0] && p.colors[0].images && p.colors[0].images[0]) ||
  (p.images && p.images[0]) ||
  '';

const Catalog = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, categoryLabel } = useLang();
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
  const [subFilter, setSubFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('new');
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = async (attempt = 0) => {
    setLoading(true);
    if (attempt === 0) setError('');
    try {
      setAllProducts(await fetchProducts());
      setError('');
    } catch (e) {
      // Backend may be booting after a redeploy — retry a couple of times
      // before showing the error UI.
      if (attempt < 2) {
        setTimeout(() => loadProducts(attempt + 1), 800 * (attempt + 1));
        return;
      }
      setError(apiError(e));
    } finally {
      if (attempt === 0 || attempt >= 2) setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    window.addEventListener('productsUpdate', loadProducts);
    return () => window.removeEventListener('productsUpdate', loadProducts);
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    let result = filter === 'all' ? allProducts : allProducts.filter((p) => p.category === filter);
    if (filter === 'sneakers' && subFilter !== 'all') {
      result = result.filter((p) => p.subcategory === subFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }

    const sorted = [...result];
    if (sortBy === 'price_asc') sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === 'price_desc') sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    // 'new' preserves incoming order (backend returns latest first)
    return sorted;
  }, [filter, subFilter, statusFilter, sortBy, allProducts]);

  const handleFilterChange = (id) => {
    setFilter(id);
    setSubFilter('all');
  };

  const filters = [
    { id: 'all', label: t('f_all') },
    { id: 'sneakers', label: t('f_sneakers') },
    { id: 'tshirts', label: t('Одежда / Носки / Шорты') },
    { id: 'crossfit', label: t('f_crossfit') },
  ];

  const statusFilters = [
    { id: 'all', label: t('st_all') },
    { id: 'available', label: t('st_in') },
    { id: 'pre-order', label: t('st_pre') },
  ];

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* HERO — modern take: shorter, deeper gradient, geometric sans, subtle grain */}
      <section
        data-testid="catalog-hero"
        className="relative h-[38vh] min-h-[280px] flex items-end overflow-hidden"
      >
        <motion.div
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${CATALOG_HERO})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/20" />
        {/* Subtle noise overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.18] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto w-full px-6 pb-8 md:pb-10">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-white/20 rounded-full text-[10px] uppercase tracking-[0.28em] text-white/80 backdrop-blur"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#BFA982]" />
            {t('all_catalog')}
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-extrabold uppercase text-white text-5xl md:text-7xl lg:text-8xl leading-[0.9] tracking-[-0.045em]"
          >
            {t('catalog_title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/70 text-sm md:text-base mt-3 max-w-lg"
          >
            {t('catalog_subtitle')}
          </motion.p>
        </div>
      </section>

      {/* Filter bar — sticky on desktop only (mobile scrolls with content) */}
      <div className="md:sticky md:top-20 md:z-20 bg-white md:bg-white/80 md:backdrop-blur-xl md:border-b md:border-black/[0.06]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-wrap items-center gap-3 md:gap-4 justify-between">
            {/* Category pills */}
            <div className="flex gap-2 flex-wrap" data-testid="filter-categories">
              {filters.map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleFilterChange(f.id)}
                  data-testid={`filter-${f.id}`}
                  className={`py-2 px-5 rounded-full text-sm font-medium tracking-wide transition-all duration-300 border ${
                    filter === f.id
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black/70 border-black/10 hover:border-black/40 hover:text-black'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status + sneaker sub-filters */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {statusFilters.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide border transition-all duration-300 ${
                  statusFilter === s.id
                    ? 'border-black bg-black text-white'
                    : 'border-black/10 text-black/60 hover:border-black/40 hover:text-black'
                }`}
              >
                {s.label}
              </button>
            ))}

            <AnimatePresence>
              {filter === 'sneakers' && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex gap-2 items-center overflow-hidden"
                >
                  <span className="mx-1 h-4 w-px bg-black/10" />
                  {sneakerSubcategories.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSubFilter(s.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide border transition-all duration-300 ${
                        subFilter === s.id
                          ? 'border-[#BFA982] bg-[#BFA982]/15 text-[#8A7548]'
                          : 'border-black/10 text-black/60 hover:border-black/40 hover:text-black'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </motion.div>
              )}
                 {filter === 'tshirts' && (
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          className="flex gap-2 items-center overflow-flow-hidden"
        >
          <span className="mx-1 h-4 w-px bg-black/10" />
          <button
            onClick={() => setSubFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
              subFilter === 'all'
                ? 'border-[#BFA982] bg-[#BFA982]/15 text-[#8A7548]'
                : 'border-black/10 text-black/60 hover:border-black/40 hover:text-black'
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setSubFilter('tshirts_main')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
              subFilter === 'tshirts_main'
                ? 'border-[#BFA982] bg-[#BFA982]/15 text-[#8A7548]'
                : 'border-black/10 text-black/60 hover:border-black/40 hover:text-black'
            }`}
          >
            Футболки
          </button>
          <button
            onClick={() => setSubFilter('shorts')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
              subFilter === 'shorts'
                ? 'border-[#BFA982] bg-[#BFA982]/15 text-[#8A7548]'
                : 'border-black/10 text-black/60 hover:border-black/40 hover:text-black'
            }`}
          >
            Шорты
          </button>
          <button
            onClick={() => setSubFilter('socks')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-300 ${
              subFilter === 'socks'
                ? 'border-[#BFA982] bg-[#BFA982]/15 text-[#8A7548]'
                : 'border-black/10 text-black/60 hover:border-black/40 hover:text-black'
            }`}
          >
            Носки
          </button>
        </motion.div>
      )}
 </AnimatePresence>

            <div className="ml-auto text-xs text-black/50" data-testid="results-count">
              {filteredProducts.length}
            </div>
          </div>
        </div>
      </div>

      {/* Product grid */}
      <div className="max-w-7xl mx-auto px-6 pt-10">
        <motion.div
          layout
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8"
          data-testid="products-grid"
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6 }}
                onClick={() => navigate(`/product/${product.id}`)}
                data-testid={`product-card-${product.id}`}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-xl bg-neutral-100 aspect-[4/5]">
                  <motion.img
                    src={coverImage(product)}
                    alt={product.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    initial={{ scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  />

                  {/* Status pill — thin outline, no gold fill */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    <span
                      className={`inline-block px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] font-medium border backdrop-blur-md ${
                        product.status === 'available'
                          ? 'border-black/20 text-black bg-white/70'
                          : 'border-white/40 text-white bg-black/50'
                      }`}
                    >
                      {product.status === 'available' ? t('badge_in') : t('badge_pre')}
                    </span>
                    )}
                  </div>

                  {/* Colors — smaller, thin dark ring */}
                  {product.colors && product.colors.length > 1 && (
                    <div className="absolute bottom-3 left-3 flex gap-1">
                      {product.colors.slice(0, 4).map((c, i) => (
                        <span
                          key={i}
                          className="w-4 h-4 rounded-full ring-1 ring-black/70 overflow-hidden bg-neutral-200"
                        >
                          {c.images && c.images[0] && (
                            <img src={c.images[0]} alt={c.name} className="w-full h-full object-cover" />
                          )}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Subtle arrow hint on hover — replaces text overlay */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black text-white rounded-full p-2">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="pt-3 px-1 flex flex-col justify-between flex-grow">

    <h3 className="font-bold text-sm leading-snug text-zinc-900 line-clamp-2 min-h-[36px] mb-1">
      {product.name}
    </h3>
    <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">
      {categoryLabel(product.category)}
    </p>

  <div className="mt-2 pt-1.5 border-t border-zinc-100">
    <p className="font-['Anton'] text-base font-black text-black tracking-wide">
      {formatPrice(product.price)}
    </p>
  </div> 
                </div>

              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {loading && (
          <div className="text-center py-20">
            <p className="text-black/40 text-lg">{t('loading')}</p>
          </div>
        )}
        {!loading && error && (
          <div className="text-center py-20">
            <p className="text-red-500 text-lg mb-4">{error}</p>
            <button
              onClick={loadProducts}
              className="px-6 py-3 rounded-full bg-black text-white font-medium tracking-wide hover:bg-[#BFA982] hover:text-black transition-colors"
            >
              {t('retry')}
            </button>
          </div>
        )}
        {!loading && !error && filteredProducts.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-black/40 text-lg">{t('not_found')}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Catalog;
