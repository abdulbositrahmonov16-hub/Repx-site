import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Edit, Trash2, X, Save, Upload, Loader2, LogOut, Send,
  Package, ShoppingCart, Wallet, MousePointerClick, Inbox,
  Search, TrendingUp, CheckCircle2, Receipt
} from 'lucide-react';
import { getCategoryLabel, getSubcategoryLabel } from '../mockData';
import {
  fetchProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} from '../utils/products';
import { formatPrice } from '../utils/cart';
import { isAuthed, logout } from '../utils/auth';
import { apiError } from '../utils/api';
import { fetchSettings, updateSettings } from '../utils/settings';
import { fetchOrders, updateOrder, deleteOrder, fetchStats } from '../utils/orders';
import AdminLogin from '../components/AdminLogin';
import { toast } from 'sonner';

// CRM pipeline. Only 'sold' adds the order total to revenue.
const ORDER_STATUS = {
  new: { label: 'Новый', cls: 'bg-[#BFA982]/15 text-[#8A7548]' },
  contacted: { label: 'Связались', cls: 'bg-blue-50 text-blue-600' },
  sold: { label: 'Продано', cls: 'bg-green-50 text-green-700' },
  canceled: { label: 'Отменён', cls: 'bg-red-50 text-red-600' },
  // legacy value from older orders
  done: { label: 'Продано', cls: 'bg-green-50 text-green-700' },
};

const normalizeStatus = (status) => (status === 'done' || status === 'completed' ? 'sold' : status || 'new');

const ORDER_FILTERS = [
  { key: 'all', label: 'ВСЕ' },
  { key: 'new', label: 'НОВЫЕ' },
  { key: 'contacted', label: 'СВЯЗАЛИСЬ' },
  { key: 'sold', label: 'ПРОДАНО' },
  { key: 'canceled', label: 'ОТМЕНЁН' },
];

const AdminPanel = () => {
  const [authed, setAuthed] = useState(isAuthed());
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [orderFilter, setOrderFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [savingOrderId, setSavingOrderId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [telegram, setTelegram] = useState('');
  const [savingTg, setSavingTg] = useState(false);
  const [homeImages, setHomeImages] = useState({ sneakers: '', tshirts: '', crossfit: '' });
  const [uploadingHome, setUploadingHome] = useState(null); // 'sneakers' | 'tshirts' | 'crossfit'
  const [savingHome, setSavingHome] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadingColor, setUploadingColor] = useState(null);
  const [uploadingSizeChart, setUploadingSizeChart] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'sneakers',
    subcategory: 'running',
    price: '',
    oldPrice: '',
    onSale: false,
    images: [''],
    colors: [],
    sizes: [],
    status: 'available',
    description: ''
  });

  const loadProducts = async () => {
    setLoading(true);
    try {
      setProducts(await fetchProducts());
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      setOrders(await fetchOrders());
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadStats = async () => {
    try {
      setStats(await fetchStats());
    } catch (e) {
      // non-critical
    }
  };

  const loadSettings = async () => {
    try {
      const s = await fetchSettings();
      setTelegram(s.telegram_username || '');
      setHomeImages({
        sneakers: s.home_categories?.sneakers || '',
        tshirts: s.home_categories?.tshirts || '',
        crossfit: s.home_categories?.crossfit || '',
      });
    } catch (e) {
      // non-critical
    }
  };

  const handleHomeUpload = async (key, file) => {
    if (!file) return;
    setUploadingHome(key);
    try {
      const url = await uploadImage(file);
      setHomeImages((prev) => ({ ...prev, [key]: url }));
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setUploadingHome(null);
    }
  };

  const saveHomeImages = async () => {
    setSavingHome(true);
    try {
      await updateSettings({ home_categories: homeImages });
      toast.success('Фото главной обновлены');
      window.dispatchEvent(new Event('settingsUpdate'));
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSavingHome(false);
    }
  };

  const saveTelegram = async () => {
    setSavingTg(true);
    try {
      const s = await updateSettings({ telegram_username: telegram.replace(/^@/, '') });
      setTelegram(s.telegram_username || '');
      toast.success('Telegram-получатель обновлён');
      window.dispatchEvent(new Event('settingsUpdate'));
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSavingTg(false);
    }
  };

  useEffect(() => {
    if (authed) {
      loadProducts();
      loadOrders();
      loadStats();
      loadSettings();
    }
  }, [authed]);

  const handleLogout = () => {
    logout();
    setAuthed(false);
  };

  const handleOpenModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        category: product.category,
        subcategory:
          product.subcategory ||
          (product.category === 'sneakers' ? 'running' : product.category === 'tshirts' ? 'tshirts' : ''),
        price: product.price.toString(),
        oldPrice: product.oldPrice ? product.oldPrice.toString() : '',
        onSale: product.onSale || false,
        images: product.images,
        sizeChart: product.sizeChart || '',
        colors: product.colors || [],
        sizes: product.sizes,
        status: product.status,
        description: product.description
      });
    } else {
      setEditingProduct(null);
      setFormData({
        name: '',
        category: 'sneakers',
        subcategory: 'running',
        price: '',
        oldPrice: '',
        onSale: false,
        images: [''],
        colors: [],
        sizes: [],
        status: 'available',
        description: '',
        sizeChart: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const baseImages = formData.images.filter((img) => img.trim() !== '');
    const colorsClean = (formData.colors || [])
      .map((c) => ({ name: (c.name || '').trim(), images: (c.images || []).filter((i) => i.trim() !== '') }))
      .filter((c) => c.name && c.images.length > 0);

    if (!formData.name || !formData.price || (baseImages.length === 0 && colorsClean.length === 0)) {
      toast.error('Заполните название, цену и хотя бы одно фото (или расцветку)');
      return;
    }
    if (!formData.sizes || formData.sizes.length === 0) {
      toast.error('Выберите хотя бы один размер');
      return;
    }

    const productData = {
      name: formData.name,
      category: formData.category,
      price: parseInt(formData.price),
      oldPrice: formData.onSale && formData.oldPrice ? parseInt(formData.oldPrice) : null,
      onSale: !!formData.onSale,
      images: baseImages.length ? baseImages : (colorsClean[0]?.images || []),
      colors: colorsClean,
      sizes: formData.sizes,
      status: formData.status,
      description: formData.description,
      sizeChart: formData.sizeChart || null
    };
    if (formData.category === 'sneakers' || formData.category === 'tshirts') {
      productData.subcategory =
        formData.subcategory || (formData.category === 'sneakers' ? 'running' : 'tshirts');
    } else {
      productData.subcategory = null;
    }

    setSaving(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, productData);
        toast.success('Товар обновлён!');
      } else {
        await createProduct(productData);
        toast.success('Товар добавлен!');
      }
      await loadProducts();
      loadStats();
      window.dispatchEvent(new Event('productsUpdate'));
      handleCloseModal();
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить этот товар?')) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      window.dispatchEvent(new Event('productsUpdate'));
      loadStats();
      toast.success('Товар удалён');
    } catch (err) {
      toast.error(apiError(err));
    }
  };

  const handleImageChange = (index, value) => {
    const newImages = [...formData.images];
    newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };

  const addImageField = () => {
    setFormData({ ...formData, images: [...formData.images, ''] });
  };

  const removeImageField = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData({ ...formData, images: newImages });
  };

  const handleFileUpload = async (index, file) => {
    if (!file) return;
    setUploadingIndex(index);
    try {
      const url = await uploadImage(file);
      const newImages = [...formData.images];
      newImages[index] = url;
      setFormData({ ...formData, images: newImages });
      toast.success('Фото загружено!');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSizeChartUpload = async (file) => {
    if (!file) return;
    setUploadingSizeChart(true);
    try {
      const url = await uploadImage(file);
      setFormData((f) => ({ ...f, sizeChart: url }));
      toast.success('Таблица размеров загружена!');
    } catch (err) {
      toast.error(apiError(err));
    } finally {
      setUploadingSizeChart(false);
    }
  };
  const handleSizeToggle = (size) => {
    const newSizes = formData.sizes.includes(size)
      ? formData.sizes.filter((s) => s !== size)
      : [...formData.sizes, size];
    setFormData({ ...formData, sizes: newSizes });
  };

  const addColor = () =>
    setFormData((f) => ({ ...f, colors: [...(f.colors || []), { name: '', images: [''] }] }));
  const removeColor = (ci) =>
    setFormData((f) => ({ ...f, colors: f.colors.filter((_, i) => i !== ci) }));
  const setColorName = (ci, val) =>
    setFormData((f) => {
      const c = [...f.colors]; c[ci] = { ...c[ci], name: val }; return { ...f, colors: c };
    });
  const setColorImage = (ci, ii, val) =>
    setFormData((f) => {
      const c = [...f.colors]; const imgs = [...c[ci].images]; imgs[ii] = val;
      c[ci] = { ...c[ci], images: imgs }; return { ...f, colors: c };
    });
  const addColorImage = (ci) =>
    setFormData((f) => {
      const c = [...f.colors]; c[ci] = { ...c[ci], images: [...c[ci].images, ''] };
      return { ...f, colors: c };
    });
  const removeColorImage = (ci, ii) =>
    setFormData((f) => {
      const c = [...f.colors]; c[ci] = { ...c[ci], images: c[ci].images.filter((_, i) => i !== ii) };
      return { ...f, colors: c };
    });
  const handleColorUpload = async (ci, ii, file) => {
    if (!file) return;
    setUploadingColor(`${ci}-${ii}`);
    try {
      const url = await uploadImage(file);
      setColorImage(ci, ii, url);
      toast.success('Фото загружено!');
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setUploadingColor(null);
    }
  };

  const handleOrderPatch = async (id, patch, successMessage) => {
    setSavingOrderId(id);
    try {
      const updated = await updateOrder(id, patch);
      setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
      // Revenue depends on the 'sold' status, so refresh the CRM numbers.
      loadStats();
      if (successMessage) toast.success(successMessage);
    } catch (e) {
      toast.error(apiError(e));
    } finally {
      setSavingOrderId(null);
    }
  };

  const handleOrderStatus = (id, status) =>
    handleOrderPatch(
      id,
      { status },
      status === 'sold' ? 'Заказ продан — сумма добавлена в выручку' : 'Статус обновлён'
    );

  const handleOrderField = (order, field, value) => {
    if ((order[field] || '') === value) return;
    handleOrderPatch(order.id, { [field]: value });
  };

  const handleOrderDelete = async (id) => {
    if (!window.confirm('Удалить этот заказ?')) return;
    try {
      await deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      loadStats();
      toast.success('Заказ удалён');
    } catch (e) {
      toast.error(apiError(e));
    }
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  const sneakerSizes = [38, 39, 40, 41, 42, 43, 44, 45, 46];
  const shirtSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const crossfitSizes = ['Единый', 'S', 'M', 'L', 'XL'];

  const getSizeOptions = (category) => {
    if (category === 'sneakers') return sneakerSizes;
    if (category === 'crossfit') return crossfitSizes;
    return shirtSizes;
  };

  if (!authed) {
    return <AdminLogin onSuccess={() => setAuthed(true)} />;
  }

  const statCards = [
    { icon: Wallet, label: 'Выручка (продано)', value: stats ? formatPrice(stats.revenue) : '—', sub: stats ? `за месяц: ${formatPrice(stats.revenue_month || 0)}` : '' },
    { icon: TrendingUp, label: 'Сегодня', value: stats ? formatPrice(stats.revenue_today || 0) : '—', sub: stats ? `средний чек: ${formatPrice(stats.avg_check || 0)}` : '' },
    { icon: ShoppingCart, label: 'Заказов', value: stats ? stats.orders : '—', sub: stats ? `${stats.new_orders} новых · ${stats.contacted_orders || 0} в работе` : '' },
    { icon: CheckCircle2, label: 'Продано', value: stats ? stats.sold_orders || 0 : '—', sub: stats ? `конверсия ${stats.conversion || 0}%` : '' },
    { icon: Package, label: 'Товаров', value: stats ? stats.products : '—' },
    { icon: MousePointerClick, label: 'В корзину', value: stats ? stats.add_to_cart : '—' },
  ];

  const orderCounts = orders.reduce((acc, o) => {
    const key = normalizeStatus(o.status);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const visibleOrders = orders.filter((o) => {
    const matchesStatus = orderFilter === 'all' || normalizeStatus(o.status) === orderFilter;
    const q = orderSearch.trim().toLowerCase();
    const haystack = [
      o.customer_name,
      o.customer_phone,
      o.telegram_username,
      o.manager_note,
      ...(o.items || []).map((it) => it.name),
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return matchesStatus && (!q || haystack.includes(q));
  });

  return (
    <div className="min-h-screen bg-neutral-50 pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10 flex-wrap gap-4"
        >
          <div>
            <h1 className="font-['Anton'] text-6xl md:text-8xl tracking-wide mb-2">
              АДМИН
            </h1>
            <p className="text-black/60 text-lg">Панель управления RepX</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-3 rounded-full border-2 border-black/10 hover:bg-white transition-colors font-medium tracking-wide"
          >
            <LogOut className="w-5 h-5" />
            ВЫЙТИ
          </motion.button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl shadow-sm p-5"
            >
              <div className="flex items-center gap-2 text-black/50 mb-2">
                <s.icon className="w-4 h-4" />
                <span className="text-xs tracking-wide uppercase">{s.label}</span>
              </div>
              <p className="font-['Anton'] text-2xl md:text-3xl tracking-wide">{s.value}</p>
              {s.sub ? <p className="text-xs text-[#8A7548] mt-1">{s.sub}</p> : null}
            </motion.div>
          ))}
        </div>

        {/* Telegram settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-2">
            <Send className="w-5 h-5 text-[#8A7548]" />
            <h2 className="font-['Anton'] text-2xl tracking-wide">TELEGRAM ДЛЯ ЗАКАЗОВ</h2>
          </div>
          <p className="text-black/60 text-sm mb-4">
            Юзернейм, на который клиенты отправляют заказ при оформлении. Указывайте без «@».
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center rounded-lg border border-black/10 focus-within:border-[#BFA982] focus-within:ring-1 focus-within:ring-[#BFA982] overflow-hidden transition-colors">
              <span className="px-3 text-black/40 select-none">@</span>
              <input
                type="text"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value.replace(/^@/, ''))}
                placeholder="username"
                className="flex-1 px-1 py-2 outline-none bg-transparent"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveTelegram}
              disabled={savingTg || !telegram}
              className="flex items-center justify-center gap-2 px-6 py-2 rounded-full bg-[#BFA982] text-black font-semibold tracking-wide hover:bg-[#A8906A] transition-colors disabled:opacity-50"
            >
              {savingTg ? <Loader2 className="w-5 h-5 animate-spin" /> : (<><Save className="w-4 h-4" /> СОХРАНИТЬ</>)}
            </motion.button>
          </div>
        </motion.div>

        {/* Home category images */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm p-6 mb-8"
          data-testid="admin-home-images"
        >
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-[#8A7548]" />
            <h2 className="font-['Anton'] text-2xl tracking-wide">ФОТО КАТЕГОРИЙ НА ГЛАВНОЙ</h2>
          </div>
          <p className="text-black/60 text-sm mb-5">
            Загрузите фото для карточек «Кроссовки», «Футболки» и «Кроссфит» на главной странице. Оставьте пустым — покажется дефолтная картинка.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: 'sneakers', label: 'Кроссовки' },
              { key: 'tshirts', label: 'Футболки' },
              { key: 'crossfit', label: 'Кроссфит' },
            ].map(({ key, label }) => (
              <div key={key} className="rounded-xl border border-black/10 p-3">
                <div className="text-xs uppercase tracking-widest text-black/50 mb-2">{label}</div>
                <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-neutral-100 mb-3 group">
                  {homeImages[key] ? (
                    <img
                      src={homeImages[key]}
                      alt={label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black/30 text-sm">
                      Нет фото
                    </div>
                  )}
                  {uploadingHome === key && (
                    <div className="absolute inset-0 bg-black/50 grid place-items-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                  {homeImages[key] && !uploadingHome && (
                    <button
                      onClick={() =>
                        setHomeImages((prev) => ({ ...prev, [key]: '' }))
                      }
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 bg-black/70 text-white rounded-full"
                      aria-label={`Remove ${label} image`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <label
                  className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-full border border-black/10 text-sm font-medium cursor-pointer hover:bg-neutral-50"
                  data-testid={`home-image-upload-${key}`}
                >
                  <Upload className="w-4 h-4" />
                  {homeImages[key] ? 'Заменить' : 'Загрузить'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleHomeUpload(key, e.target.files?.[0])}
                    disabled={uploadingHome === key}
                  />
                </label>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-5">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={saveHomeImages}
              disabled={savingHome}
              data-testid="save-home-images"
              className="flex items-center justify-center gap-2 px-6 py-2 rounded-full bg-black text-white font-semibold tracking-wide hover:bg-black/80 transition-colors disabled:opacity-50"
            >
              {savingHome ? <Loader2 className="w-5 h-5 animate-spin" /> : (<><Save className="w-4 h-4" /> СОХРАНИТЬ ФОТО</>)}
            </motion.button>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 rounded-full font-medium tracking-wide transition-all ${
              activeTab === 'products' ? 'bg-[#BFA982] text-black' : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            ТОВАРЫ
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-3 rounded-full font-medium tracking-wide transition-all flex items-center gap-2 ${
              activeTab === 'orders' ? 'bg-[#BFA982] text-black' : 'bg-white text-black hover:bg-neutral-100'
            }`}
          >
            CRM / ЗАКАЗЫ
            {stats && stats.new_orders > 0 && (
              <span className="bg-black text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {stats.new_orders}
              </span>
            )}
          </button>
          {activeTab === 'products' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenModal()}
              className="ml-auto flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white font-semibold tracking-wide hover:bg-black/80 transition-colors"
            >
              <Plus className="w-5 h-5" />
              ДОБАВИТЬ ТОВАР
            </motion.button>
          )}
        </div>

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl overflow-hidden shadow-sm"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-20 text-black/50">
                <Loader2 className="w-5 h-5 animate-spin" /> Загрузка...
              </div>
            ) : products.length === 0 ? (
              <div className="py-20 text-center text-black/40">Товаров пока нет</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">ИЗОБРАЖЕНИЕ</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">НАЗВАНИЕ</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">КАТЕГОРИЯ</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">ЦЕНА</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">СТАТУС</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold tracking-wide">ДЕЙСТВИЯ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, index) => (
                      <motion.tr
                        key={product.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="border-t border-black/5 hover:bg-neutral-50"
                      >
                        <td className="px-6 py-4">
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg bg-neutral-100"
                          />
                        </td>
                        <td className="px-6 py-4 font-medium">{product.name}</td>
                        <td className="px-6 py-4 text-black/60 text-sm">
                          {getCategoryLabel(product.category)}
                          {product.subcategory && (
                            <span className="block text-[11px] uppercase tracking-wide text-black/35">
                              {getSubcategoryLabel(product.category, product.subcategory)}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">{formatPrice(product.price)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium tracking-wide ${
                            product.status === 'available' ? 'bg-[#BFA982]/10 text-[#8A7548]' : 'bg-black/10 text-black'
                          }`}>
                            {product.status === 'available' ? 'В наличии' : 'Под заказ'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => handleOpenModal(product)} className="p-2 hover:bg-neutral-100 rounded transition-colors">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(product.id)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}

        {/* CRM / ORDERS TAB */}
        {activeTab === 'orders' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl overflow-hidden shadow-sm"
          >
            {/* CRM toolbar: pipeline filters + search */}
            <div className="flex flex-wrap items-center gap-2 p-4 border-b border-black/5">
              {ORDER_FILTERS.map((f) => {
                const count = f.key === 'all' ? orders.length : orderCounts[f.key] || 0;
                return (
                  <button
                    key={f.key}
                    onClick={() => setOrderFilter(f.key)}
                    className={`px-4 py-2 rounded-full text-xs font-semibold tracking-wide transition-colors ${
                      orderFilter === f.key
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 text-black/70 hover:bg-neutral-200'
                    }`}
                  >
                    {f.label} <span className="opacity-60">{count}</span>
                  </button>
                );
              })}
              <div className="ml-auto flex items-center gap-2 px-3 py-2 rounded-full border border-black/10 focus-within:border-[#BFA982] transition-colors">
                <Search className="w-4 h-4 text-black/40" />
                <input
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Поиск: имя, телефон, товар"
                  className="outline-none text-sm bg-transparent w-52"
                />
              </div>
            </div>

            {loadingOrders ? (
              <div className="flex items-center justify-center gap-2 py-20 text-black/50">
                <Loader2 className="w-5 h-5 animate-spin" /> Загрузка...
              </div>
            ) : visibleOrders.length === 0 ? (
              <div className="py-20 flex flex-col items-center text-black/40">
                <Inbox className="w-12 h-12 mb-3 text-black/20" />
                {orders.length === 0 ? 'Заказов пока нет' : 'Ничего не найдено'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">ДАТА</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">КЛИЕНТ</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">ТОВАРЫ</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">СУММА</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">СТАТУС</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold tracking-wide">ЗАМЕТКА</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold tracking-wide">ДЕЙСТВИЯ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleOrders.map((order, index) => {
                      const status = normalizeStatus(order.status);
                      return (
                        <motion.tr
                          key={order.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          className="border-t border-black/5 align-top hover:bg-neutral-50"
                        >
                          <td className="px-6 py-4 text-sm text-black/60 whitespace-nowrap">
                            {formatDate(order.created_at)}
                            {status === 'sold' && order.sold_at && (
                              <span className="block text-[11px] text-green-600">
                                продано: {formatDate(order.sold_at)}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <input
                              defaultValue={order.customer_name || ''}
                              onBlur={(e) => handleOrderField(order, 'customer_name', e.target.value)}
                              placeholder="Имя клиента"
                              className="w-40 px-2 py-1 rounded border border-transparent hover:border-black/10 focus:border-[#BFA982] outline-none text-sm"
                            />
                            <input
                              defaultValue={order.customer_phone || ''}
                              onBlur={(e) => handleOrderField(order, 'customer_phone', e.target.value)}
                              placeholder="Телефон"
                              className="w-40 mt-1 px-2 py-1 rounded border border-transparent hover:border-black/10 focus:border-[#BFA982] outline-none text-sm"
                            />
                            {order.telegram_username ? (
                              <a
                                href={`https://t.me/${String(order.telegram_username).replace(/^@/, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                className="block mt-1 px-2 text-xs text-[#8A7548] hover:underline"
                              >
                                @{String(order.telegram_username).replace(/^@/, '')}
                              </a>
                            ) : null}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <div className="space-y-1">
                              {order.items.map((it, i) => (
                                <div key={i} className="text-black/80">
                                  {it.name}
                                  <span className="text-black/40">
                                    {it.size ? ` · ${it.size}` : ''} × {it.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                            {formatPrice(order.total)}
                            {status === 'sold' && (
                              <span className="block text-[11px] text-green-600">в выручке</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={status}
                              disabled={savingOrderId === order.id}
                              onChange={(e) => handleOrderStatus(order.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-full text-xs font-medium tracking-wide outline-none cursor-pointer border-0 disabled:opacity-50 ${
                                (ORDER_STATUS[status] || ORDER_STATUS.new).cls
                              }`}
                            >
                              <option value="new">Новый</option>
                              <option value="contacted">Связались</option>
                              <option value="sold">Продано</option>
                              <option value="canceled">Отменён</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <textarea
                              defaultValue={order.manager_note || ''}
                              onBlur={(e) => handleOrderField(order, 'manager_note', e.target.value)}
                              rows={2}
                              placeholder="Комментарий менеджера"
                              className="w-48 px-2 py-1 rounded border border-transparent hover:border-black/10 focus:border-[#BFA982] outline-none text-sm resize-none"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              {savingOrderId === order.id && (
                                <Loader2 className="w-4 h-4 animate-spin text-black/30" />
                              )}
                              {status !== 'sold' && (
                                <button
                                  onClick={() => handleOrderStatus(order.id, 'sold')}
                                  title="Отметить как продано"
                                  className="p-2 hover:bg-green-50 hover:text-green-600 rounded transition-colors"
                                >
                                  <Receipt className="w-4 h-4" />
                                </button>
                              )}
                              <button onClick={() => handleOrderDelete(order.id)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Product Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 overflow-y-auto"
            >
              <div className="flex min-h-full items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
                  <div className="flex items-center justify-between p-6 border-b border-black/10">
                    <h2 className="font-['Anton'] text-2xl tracking-wide">
                      {editingProduct ? 'РЕДАКТИРОВАТЬ' : 'ДОБАВИТЬ'} ТОВАР
                    </h2>
                    <button onClick={handleCloseModal} className="p-2 hover:bg-neutral-100 rounded-full transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Название *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-black/10 focus:border-[#BFA982] focus:ring-1 focus:ring-[#BFA982] outline-none transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Категория *</label>
                      <select
                        value={formData.category}
                        onChange={(e) => {
                          const category = e.target.value;
                          setFormData({
                            ...formData,
                            category,
                            subcategory:
                              category === 'sneakers' ? 'running' : category === 'tshirts' ? 'tshirts' : '',
                            sizes: [],
                          });
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-black/10 focus:border-[#BFA982] focus:ring-1 focus:ring-[#BFA982] outline-none transition-colors"
                      >
                        <option value="sneakers">Кроссовки</option>
                        <option value="tshirts">Одежда</option>
                        <option value="crossfit">Для кроссфита</option>
                      </select>
                    </div>

                    {(formData.category === 'sneakers' || formData.category === 'tshirts') && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          {formData.category === 'sneakers' ? 'Раздел кроссовок' : 'Подкатегория одежды'}
                        </label>
                        <select
                          value={formData.subcategory || ''}
                          onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                          className="w-full px-4 py-2 rounded-lg border border-black/10 focus:border-[#BFA982] focus:ring-1 focus:ring-[#BFA982] outline-none transition-colors"
                        >
                          {(formData.category === 'sneakers'
                            ? [
                                { id: 'running', label: 'Running' },
                                { id: 'crossfit', label: 'Crossfit' },
                                { id: 'daily', label: 'Daily' },
                              ]
                            : [
                                { id: 'tshirts', label: 'Футболки' },
                                { id: 'shorts', label: 'Шорты' },
                                { id: 'socks', label: 'Носки' },
                              ]
                          ).map((o) => (
                            <option key={o.id} value={o.id}>{o.label}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">Цена (сум) *</label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-black/10 focus:border-[#BFA982] focus:ring-1 focus:ring-[#BFA982] outline-none transition-colors"
                        required
                      />
                    </div>

                    <div className="rounded-lg border border-black/10 p-4 space-y-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.onSale}
                          onChange={(e) => setFormData({ ...formData, onSale: e.target.checked })}
                          className="w-4 h-4 accent-[#BFA982]"
                        />
                        <span className="text-sm font-medium">Показать как акцию 🔥</span>
                      </label>
                      {formData.onSale && (
                        <div>
                          <label className="block text-sm font-medium mb-2">Старая цена (сум)</label>
                          <p className="text-xs text-black/40 mb-2">Будет показана зачёркнутой рядом с текущей ценой</p>
                          <input
                            type="number"
                            value={formData.oldPrice}
                            onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                            className="w-full px-4 py-2 rounded-lg border border-black/10 focus:border-[#BFA982] focus:ring-1 focus:ring-[#BFA982] outline-none transition-colors"
                          />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Изображения *</label>
                      <p className="text-xs text-black/40 mb-3">Загрузите фото с устройства или вставьте ссылку (URL)</p>
                      <div className="space-y-3">
                        {formData.images.map((img, index) => (
                          <div key={index} className="flex gap-3 items-start">
                            <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-neutral-100 overflow-hidden border border-black/10 flex items-center justify-center">
                              {uploadingIndex === index ? (
                                <Loader2 className="w-6 h-6 text-[#8A7548] animate-spin" />
                              ) : img ? (
                                <img src={img} alt={`preview ${index + 1}`} className="w-full h-full object-cover" />
                              ) : (
                                <Upload className="w-6 h-6 text-black/20" />
                              )}
                            </div>
                            <div className="flex-1 space-y-2">
                              <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-black/15 text-sm font-medium text-black/70 hover:border-[#BFA982] hover:text-[#8A7548] cursor-pointer transition-colors">
                                <Upload className="w-4 h-4" />
                                Загрузить фото
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    handleFileUpload(index, e.target.files[0]);
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                              <input
                                type="url"
                                value={img.startsWith('data:') ? '' : img}
                                onChange={(e) => handleImageChange(index, e.target.value)}
                                placeholder="или вставьте ссылку https://..."
                                className="w-full px-4 py-2 rounded-lg border border-black/10 focus:border-[#BFA982] focus:ring-1 focus:ring-[#BFA982] outline-none transition-colors text-sm"
                              />
                            </div>
                            {formData.images.length > 1 && (
                              <button type="button" onClick={() => removeImageField(index)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors flex-shrink-0">
                                <X className="w-5 h-5" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button type="button" onClick={addImageField} className="text-sm text-[#8A7548] hover:underline">
                          + Добавить ещё фото
                        </button>
                      </div>
                    </div>

                    {/* Colors / variants */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Расцветки (необязательно)</label>
                      <p className="text-xs text-black/40 mb-3">
                        Для товаров с разными цветами. У каждой расцветки — свои фото, клиент выберет цвет на странице товара. Если цвет один — оставьте пусто и используйте «Изображения» выше.
                      </p>
                      <div className="space-y-4">
                        {(formData.colors || []).map((color, ci) => (
                          <div key={ci} className="rounded-xl border border-black/10 p-4">
                            <div className="flex gap-3 items-center mb-3">
                              <input
                                type="text"
                                value={color.name}
                                onChange={(e) => setColorName(ci, e.target.value)}
                                placeholder="Название цвета (напр. Красный)"
                                className="flex-1 px-4 py-2 rounded-lg border border-black/10 focus:border-[#BFA982] focus:ring-1 focus:ring-[#BFA982] outline-none transition-colors text-sm"
                              />
                              <button type="button" onClick={() => removeColor(ci)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="space-y-2">
                              {color.images.map((img, ii) => (
                                <div key={ii} className="flex gap-3 items-center">
                                  <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-neutral-100 overflow-hidden border border-black/10 flex items-center justify-center">
                                    {uploadingColor === `${ci}-${ii}` ? (
                                      <Loader2 className="w-5 h-5 text-[#8A7548] animate-spin" />
                                    ) : img ? (
                                      <img src={img} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <Upload className="w-5 h-5 text-black/20" />
                                    )}
                                  </div>
                                  <label className="flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-dashed border-black/15 text-sm font-medium text-black/70 hover:border-[#BFA982] hover:text-[#8A7548] cursor-pointer transition-colors">
                                    <Upload className="w-4 h-4" /> Фото
                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleColorUpload(ci, ii, e.target.files[0]); e.target.value = ''; }} />
                                  </label>
                                  <input
                                    type="url"
                                    value={img.startsWith('data:') ? '' : img}
                                    onChange={(e) => setColorImage(ci, ii, e.target.value)}
                                    placeholder="или ссылка https://..."
                                    className="flex-1 px-3 py-2 rounded-lg border border-black/10 focus:border-[#BFA982] outline-none transition-colors text-sm"
                                  />
                                  {color.images.length > 1 && (
                                    <button type="button" onClick={() => removeColorImage(ci, ii)} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                                      <X className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              ))}
                              <button type="button" onClick={() => addColorImage(ci)} className="text-sm text-[#8A7548] hover:underline">
                                + Ещё фото для этого цвета
                              </button>
                            </div>
                          </div>
                        ))}
                        <button type="button" onClick={addColor} className="flex items-center gap-2 text-sm font-medium text-black/70 hover:text-[#8A7548]">
                          <Plus className="w-4 h-4" /> Добавить расцветку
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Размеры *</label>
                      <div className="flex flex-wrap gap-2">
                        {getSizeOptions(formData.category).map((size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() => handleSizeToggle(size)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              formData.sizes.includes(size) ? 'bg-[#BFA982] text-black' : 'bg-neutral-100 text-black hover:bg-neutral-200'
                            }`}
                          >
                            {size}
                         </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Таблица размеров (необязательно)</label>
                      <p className="text-xs text-black/40 mb-3">Покажется на странице товара под размерами, клиент сможет открыть её в полный экран</p>
                      <div className="flex gap-3 items-center">
                        <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-neutral-100 overflow-hidden border border-black/10 flex items-center justify-center">
                          {uploadingSizeChart ? (
                            <Loader2 className="w-6 h-6 text-[#8A7548] animate-spin" />
                          ) : formData.sizeChart ? (
                            <img src={formData.sizeChart} alt="size chart preview" className="w-full h-full object-cover" />
                          ) : (
                            <Upload className="w-6 h-6 text-black/20" />
                          )}
                        </div>
                        <div className="flex-1 space-y-2">
                          <label className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 border-dashed border-black/15 text-sm font-medium text-black/70 hover:border-[#BFA982] hover:text-[#8A7548] cursor-pointer transition-colors">
                            <Upload className="w-4 h-4" />
                            Загрузить таблицу
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                handleSizeChartUpload(e.target.files[0]);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          <input
                            type="url"
                            value={formData.sizeChart && formData.sizeChart.startsWith('data:') ? '' : (formData.sizeChart || '')}
                            onChange={(e) => setFormData({ ...formData, sizeChart: e.target.value })}
                            placeholder="или вставьте ссылку https://..."
                            className="w-full px-4 py-2 rounded-lg border border-black/10 focus:border-[#BFA982] focus:ring-1 focus:ring-[#BFA982] outline-none transition-colors text-sm"
                          />
                        </div>
                        {formData.sizeChart && (
                          <button type="button" onClick={() => setFormData({ ...formData, sizeChart: '' })} className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors flex-shrink-0">
                            <X className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Статус</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full px-4 py-2 rounded-lg border border-black/10 focus:border-[#BFA982] focus:ring-1 focus:ring-[#BFA982] outline-none transition-colors"
                      >
                        <option value="available">В наличии</option>
                        <option value="pre-order">Под заказ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Описание</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg border border-black/10 focus:border-[#BFA982] focus:ring-1 focus:ring-[#BFA982] outline-none transition-colors resize-none"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving || uploadingIndex !== null}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-[#BFA982] text-black font-semibold tracking-wide hover:bg-[#A8906A] transition-colors disabled:opacity-50"
                      >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : (<><Save className="w-5 h-5" />{editingProduct ? 'СОХРАНИТЬ' : 'ДОБАВИТЬ'}</>)}
                      </button>
                      <button type="button" onClick={handleCloseModal} className="px-6 py-3 rounded-full border-2 border-black/10 hover:bg-neutral-50 transition-colors font-medium tracking-wide">
                        ОТМЕНА
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminPanel;
