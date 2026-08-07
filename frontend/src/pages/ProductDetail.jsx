import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Check } from 'lucide-react';
import { fetchProductById } from '../utils/products';
import { apiError } from '../utils/api';
import { logAddToCart } from '../utils/orders';
import { formatPrice, addToCart } from '../utils/cart';
import { useLang } from '../context/LanguageContext';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, categoryLabel } = useLang();
  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState(null);
  const [colorIdx, setColorIdx] = useState(0);
  const [loading, setLoading] = useState(true);

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

  const colors = product.colors || [];
  const hasColors = colors.length > 0;
  const gallery = hasColors ? (colors[colorIdx]?.images || []) : (product.images || []);

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

  return (
    <div className="min-h-screen bg-white pt-24 md:pt-28 pb-32 md:pb-20">
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
              className="relative bg-neutral-100 mb-4 aspect-square overflow-hidden rounded-xl"
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
              <div className="absolute top-4 left-4">
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
              <p className="font-['Anton'] text-3xl md:text-4xl tracking-wide text-[#8A7548]">
                {formatPrice(product.price)}
              </p>
            </div>

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
    </div>
  );
};

export default ProductDetail;
