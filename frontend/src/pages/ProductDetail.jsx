import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check, X, ZoomIn, ChevronRight } from 'lucide-react';
import { fetchProductById } from '../utils/products';
import { apiError } from '../utils/api';
import { logAddToCart } from '../utils/orders';
import { formatPrice, addToCart } from '../utils/cart';
import { useLang } from '../context/LanguageContext';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, categoryLabel, lang } = useLang();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [colorIdx, setColorIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Lightbox state: null = closed, 'gallery' = product photos, 'sizeChart' = size chart image
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const found = await fetchProductById(id);
        if (!active) return;
        setProduct(found);
        setSelectedSize(found.sizes[0]);
        setColorIdx(0);
        setSelectedImage(0);
      } catch (e) {
        toast.error(apiError(e));
        navigate('/catalog');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-24 md:pt-28 pb-20 flex items-center justify-center">
        <p className="text-black/40 text-lg">{t('pd_loading')}</p>
      </div>
    );
  }

  if (!product) return null;

  const pageTitle = `${product.name} — купить в Ташкенте | RepX`;
  const pageDescription = product.description
    ? product.description.slice(0, 155)
    : `${product.name} в интернет-магазине RepX. ${formatPrice(product.price)}. Доставка по Ташкенту.`;

  const colors = product.colors || [];
  const hasColors = colors.length > 0;
  const gallery = hasColors ? (colors[colorIdx]?.images || []) : (product.images || []);
  const hasSizeChart = !!product.sizeChart;

  const handleColorSelect = (i) => {
    setColorIdx(i);
    setSelectedImage(0);
  };

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error(t('pd_size_err'));
      return;
    }
    addToCart({
      productId: product.id,
      name: hasColors ? `${product.name} (${colors[colorIdx]?.name})` : product.name,
      price: product.price,
      size: selectedSize,
      image: gallery[0],
    });
    logAddToCart(product, selectedSize);
    toast.success(t('pd_added'));
  };

  const nextImage = () => setSelectedImage((i) => (i + 1) % gallery.length);
  const prevImage = () => setSelectedImage((i) => (i - 1 + gallery.length) % gallery.length);

  const handleDragEnd = (e, info) => {
    const threshold = 60;
    if (info.offset.x < -threshold) nextImage();
    else if (info.offset.x > threshold) prevImage();
  };

  return (
    <div className="min-h-screen bg-white pt-24 md:pt-28 pb-32 md:pb-20">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </Helmet>
      <div className="max-w-7xl mx-auto px-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/catalog')}
          data-testid="pd-back"
          className="flex items-center gap-2 text-black/60 hover:text-black transition-colors mb-8 group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="tracking-wide text-sm">{t('pd_back')}</span>
        </motion.button>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Gallery */}
          <div>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => setLightbox('gallery')}
              className="relative bg-neutral-100 mb-4 aspect-square overflow-hidden rounded-xl cursor-zoom-in"
            >
              <AnimatePresence mode="wait">
                <motion.img
                  key={`${colorIdx}-${selectedImage}`}
                  src={gallery[selectedImage]}
                  alt={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                {product.onSale && (
                  <span className="inline-block px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] font-bold bg-[#BFA982] text-black">
                    🔥 Акция
                  </span>
                )}
                <span
                  className={`inline-block px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] font-medium border backdrop-blur-md ${
                    product.status === 'available'
                      ? 'border-black/20 text-black bg-white/70'
                      : 'border-white/40 text-white bg-black/50'
                  }`}
                >
                  {product.status === 'available' ? t('badge_in') : t('badge_pre')}
                </span>
              </div>
              <div className="absolute bottom-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center">
                <ZoomIn className="w-4 h-4 text-black" />
              </div>
            </motion.div>

            {gallery.length > 1 && (
              <div className="grid grid-cols-5 gap-2 md:gap-3">
                {gallery.map((img, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square bg-neutral-100 overflow-hidden rounded-lg transition-all ${
                      selectedImage === index ? 'ring-2 ring-black' : 'ring-1 ring-black/5 hover:ring-black/30'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <div className="mb-6">
              <p className="text-[11px] text-black/50 tracking-[0.22em] uppercase mb-2">
                {categoryLabel(product.category)}
              </p>
              <h1 className="font-display font-extrabold tracking-[-0.035em] text-4xl md:text-5xl lg:text-6xl leading-[0.95] mb-4">
                {product.name}
              </h1>
              <div className="flex items-baseline gap-3">
                <p className="font-['Anton'] text-3xl md:text-4xl tracking-wide text-[#8A7548]">
                  {formatPrice(product.price)}
                </p>
                {product.onSale && product.oldPrice && (
                  <p className="text-lg text-black/40 line-through">
                    {formatPrice(product.oldPrice)}
                  </p>
                )}
              </div>
            </div>

            {product.status === 'pre-order' && (
              <div
                data-testid="preorder-notice"
                className="mb-6 flex items-start gap-3 rounded-xl border border-[#BFA982]/40 bg-[#FBF6EC] px-4 py-3"
              >
                <div className="mt-0.5 w-8 h-8 rounded-full bg-[#BFA982] text-black grid place-items-center shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13" />
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                    <circle cx="5.5" cy="18.5" r="2.5" />
                    <circle cx="18.5" cy="18.5" r="2.5" />
                  </svg>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.22em] text-[#8A7548] mb-0.5">{t('badge_pre')}</div>
                  <div className="text-sm text-black">{t('preorder_delivery')}</div>
                </div>
              </div>
            )}

            {/* Color selector */}
            {hasColors && (
              <div className="mb-8">
                <h3 className="text-xs uppercase tracking-[0.22em] text-black/60 mb-3">
                  {t('pd_color')}: <span className="text-black font-semibold ml-1">{colors[colorIdx]?.name}</span>
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => handleColorSelect(i)}
                      title={c.name}
                      className={`relative w-14 h-14 md:w-16 md:h-16 rounded-lg overflow-hidden bg-neutral-100 transition-all ${
                        colorIdx === i ? 'ring-2 ring-black' : 'ring-1 ring-black/10 hover:ring-black/40'
                      }`}
                    >
                      {c.images && c.images[0] && (
                        <img src={c.images[0]} alt={c.name} className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8 pb-8 border-b border-black/10">
              <h3 className="text-xs uppercase tracking-[0.22em] text-black/60 mb-3">{t('pd_desc')}</h3>
              <p className="text-black/75 leading-relaxed text-[15px]">{product.description}</p>
            </div>

            {/* Sizes */}
            <div className="mb-8">
              <h3 className="text-xs uppercase tracking-[0.22em] text-black/60 mb-4">{t('pd_size')}</h3>
              <div className="grid grid-cols-6 md:grid-cols-5 gap-2 md:gap-3">
                {product.sizes.map((size) => (
                  <motion.button
                    key={size}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => setSelectedSize(size)}
                    data-testid={`size-${size}`}
                    className={`relative aspect-square flex items-center justify-center font-medium text-sm rounded-lg transition-all ${
                      selectedSize === size
                        ? 'bg-black text-white'
                        : 'bg-white text-black border border-black/10 hover:border-black/60'
                    }`}
                  >
                    {size}
                    {selectedSize === size && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 bg-[#BFA982] rounded-full p-0.5"
                      >
                        <Check className="w-3 h-3 text-black" />
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Size chart */}
              {hasSizeChart && (
                <button
                  onClick={() => setLightbox('sizeChart')}
                  data-testid="pd-size-chart-btn"
                  className="mt-4 flex items-center gap-3 w-full rounded-lg border border-black/10 hover:border-black/30 px-3 py-2.5 transition-colors"
                >
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-neutral-100 shrink-0">
                    <img src={product.sizeChart} alt="size chart" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-sm text-black/70 flex-1 text-left">
                    {lang === 'uz' ? "O'lchamlar jadvali" : 'Таблица размеров'}
                  </span>
                  <ZoomIn className="w-4 h-4 text-black/40" />
                </button>
              )}
            </div>

            {/* Desktop add-to-cart */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddToCart}
              data-testid="pd-add-desktop"
              className="hidden md:block w-full py-4 rounded-full bg-black text-white font-semibold tracking-[0.2em] text-sm uppercase hover:bg-[#BFA982] hover:text-black transition-colors"
            >
              {t('pd_add')}
            </motion.button>

            <div className="mt-8 space-y-2 text-sm text-black/60">
              <p>{t('pd_info1')}</p>
              <p>{t('pd_info2')}</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Sticky mobile CTA (above BottomNav) */}
      <div className="md:hidden fixed bottom-[calc(68px+env(safe-area-inset-bottom))] inset-x-4 z-40">
        <motion.button
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          whileTap={{ scale: 0.98 }}
          onClick={handleAddToCart}
          data-testid="pd-add-mobile"
          className="w-full py-4 rounded-full bg-black text-white font-semibold tracking-[0.2em] text-xs uppercase shadow-2xl shadow-black/30 flex items-center justify-center gap-3"
        >
          <span>{t('pd_add')}</span>
          <span className="opacity-70">·</span>
          <span className="font-['Anton'] text-base tracking-wide">{formatPrice(product.price)}</span>
        </motion.button>
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
          >
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {lightbox === 'gallery' ? (
              <>
                <motion.img
                  key={selectedImage}
                  src={gallery[selectedImage]}
                  alt={product.name}
                  drag={gallery.length > 1 ? 'x' : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.6}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => e.stopPropagation()}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="max-w-[92vw] max-h-[80vh] object-contain touch-pan-y"
                />
                {gallery.length > 1 && (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); prevImage(); }}
                      className="absolute left-3 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); nextImage(); }}
                      className="absolute right-3 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {gallery.map((_, i) => (
                        <div
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${i === selectedImage ? 'bg-white' : 'bg-white/30'}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <motion.img
                src={product.sizeChart}
                alt="size chart"
                onClick={(e) => e.stopPropagation()}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="max-w-[92vw] max-h-[85vh] object-contain rounded-lg"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;
