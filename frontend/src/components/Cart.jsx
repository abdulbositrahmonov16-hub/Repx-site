import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getCart,
  updateCartItem,
  removeFromCart,
  getTotalPrice,
  formatPrice,
  getTelegramCheckoutUrl,
  clearCart
} from '../utils/cart';
import { fetchSettings } from '../utils/settings';
import { createOrder } from '../utils/orders';
import { fetchProducts } from '../utils/products';
import { useLang } from '../context/LanguageContext';
import { toast } from 'sonner';

const coverImage = (p) =>
  (p.colors && p.colors[0] && p.colors[0].images && p.colors[0].images[0]) ||
  (p.images && p.images[0]) ||
  '';

const Cart = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { t } = useLang();
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [telegramUsername, setTelegramUsername] = useState('');
  const [recommended, setRecommended] = useState([]);

  useEffect(() => {
    fetchSettings()
      .then((s) => setTelegramUsername(s.telegram_username || ''))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const updateCart = () => {
      const currentCart = getCart();
      setCart(currentCart);
      setTotal(getTotalPrice(currentCart));
    };
    updateCart();
    window.addEventListener('cartUpdate', updateCart);
    return () => window.removeEventListener('cartUpdate', updateCart);
  }, []);

  // Load "recommended" (Crossfit) items when the cart drawer opens with items.
  useEffect(() => {
    if (isOpen && cart.length > 0 && recommended.length === 0) {
      fetchProducts({ category: 'crossfit' })
        .then((items) => {
          const inCart = new Set(cart.map((c) => c.productId));
          setRecommended(items.filter((p) => !inCart.has(p.id)).slice(0, 6));
        })
        .catch(() => {});
    }
  }, [isOpen, cart, recommended.length]);

  const handleQuantityChange = (productId, size, delta) => {
    const item = cart.find((i) => i.productId === productId && i.size === size);
    if (item) {
      updateCartItem(productId, size, item.quantity + delta);
    }
  };

  const handleRemove = (productId, size) => {
    removeFromCart(productId, size);
    toast.success(t('cart_removed'));
  };

  const goToProduct = (id) => {
    navigate(`/product/${id}`);
    onClose();
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error(t('cart_empty_err'));
      return;
    }
    try {
      await createOrder({ items: cart, total, telegram_username: telegramUsername });
    } catch (e) {
      // Do not block checkout if saving fails.
    }
    const telegramUrl = getTelegramCheckoutUrl(cart, total, telegramUsername);
    window.open(telegramUrl, '_blank');
    toast.success(t('cart_open_tg'));
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
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 h-full w-full md:w-[500px] bg-white z-50 shadow-2xl flex flex-col md:rounded-l-3xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-black/10">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-6 h-6" />
                <h2 className="font-['Anton'] text-2xl tracking-wide">{t('cart_title')}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-6">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <ShoppingBag className="w-16 h-16 text-black/20 mb-4" />
                  <p className="text-black/40 text-lg">{t('cart_empty')}</p>
                  <p className="text-black/30 text-sm mt-2">{t('cart_empty_sub')}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {cart.map((item) => (
                    <motion.div
                      key={`${item.productId}-${item.size}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 100 }}
                      className="flex gap-4 pb-6 border-b border-black/10"
                    >
                      <div className="w-24 h-24 bg-neutral-100 overflow-hidden rounded-xl flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm mb-1 truncate">{item.name}</h3>
                        <p className="text-black/60 text-sm mb-2">{t('cart_size')}: {item.size}</p>
                        <p className="font-['Anton'] text-lg tracking-wide text-[#8A7548]">{formatPrice(item.price)}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.size, -1)}
                            className="p-1.5 border border-black/10 hover:bg-neutral-100 rounded-full transition-colors"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <button
                            onClick={() => handleQuantityChange(item.productId, item.size, 1)}
                            className="p-1.5 border border-black/10 hover:bg-neutral-100 rounded-full transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemove(item.productId, item.size)}
                        className="p-2 hover:bg-red-50 hover:text-red-600 rounded transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </motion.div>
                  ))}

                  {/* Recommended (Crossfit) */}
                  {recommended.length > 0 && (
                    <div className="pt-2">
                      <h3 className="font-['Anton'] text-xl tracking-wide mb-4">{t('recommend')}</h3>
                      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1">
                        {recommended.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => goToProduct(p.id)}
                            className="group flex-shrink-0 w-32 text-left"
                          >
                            <div className="w-32 h-32 rounded-xl overflow-hidden bg-neutral-100 mb-2">
                              <img
                                src={coverImage(p)}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                            </div>
                            <p className="text-xs font-medium line-clamp-2 leading-tight group-hover:text-[#8A7548] transition-colors">{p.name}</p>
                            <p className="text-sm font-['Anton'] tracking-wide text-[#8A7548] mt-1">{formatPrice(p.price)}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart.length > 0 && (
              <div className="border-t border-black/10 p-6 bg-neutral-50">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-lg font-medium">{t('cart_total')}</span>
                  <span className="font-['Anton'] text-3xl tracking-wide text-[#8A7548]">{formatPrice(total)}</span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleCheckout}
                  className="w-full py-4 rounded-full bg-[#BFA982] text-black font-semibold tracking-wide hover:bg-[#A8906A] transition-colors"
                >
                  {t('cart_checkout')}
                </motion.button>
                <p className="text-xs text-black/40 mt-3 text-center">{t('cart_note')}</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Cart;
