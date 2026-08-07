// Cart utilities using localStorage

export const getCart = () => {
  const cart = localStorage.getItem('repx_cart');
  return cart ? JSON.parse(cart) : [];
};

export const addToCart = (item) => {
  const cart = getCart();
  const existingItem = cart.find(
    (i) => i.productId === item.productId && i.size === item.size
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ ...item, quantity: 1 });
  }

  localStorage.setItem('repx_cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdate'));
  return cart;
};

export const updateCartItem = (productId, size, quantity) => {
  const cart = getCart();
  const item = cart.find((i) => i.productId === productId && i.size === size);
  
  if (item) {
    if (quantity <= 0) {
      return removeFromCart(productId, size);
    }
    item.quantity = quantity;
  }

  localStorage.setItem('repx_cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdate'));
  return cart;
};

export const removeFromCart = (productId, size) => {
  let cart = getCart();
  cart = cart.filter((i) => !(i.productId === productId && i.size === size));
  
  localStorage.setItem('repx_cart', JSON.stringify(cart));
  window.dispatchEvent(new Event('cartUpdate'));
  return cart;
};

export const clearCart = () => {
  localStorage.setItem('repx_cart', JSON.stringify([]));
  window.dispatchEvent(new Event('cartUpdate'));
};

export const getTotalPrice = (cart) => {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const formatPrice = (price) => {
  return new Intl.NumberFormat('uz-UZ').format(price) + ' сум';
};

export const TELEGRAM_USERNAME = 'wmexxa';

export const generateTelegramMessage = (cart, total) => {
  let message = 'Здравствуйте! Хочу купить:\n\n';

  cart.forEach((item, index) => {
    message += `${index + 1}. ${item.name}`;
    message += ` — размер ${item.size}, ${item.quantity} шт.\n`;
  });

  message += `\nСумма: ${formatPrice(total)}\n\n`;
  message += 'Можете прислать реквизиты для оплаты?';

  return encodeURIComponent(message);
};

export const getTelegramCheckoutUrl = (cart, total, username = TELEGRAM_USERNAME) => {
  const handle = (username || TELEGRAM_USERNAME).replace(/^@/, '');
  return `https://t.me/${handle}?text=${generateTelegramMessage(cart, total)}`;
};