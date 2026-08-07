import { createContext, useContext, useState, useCallback } from 'react';

const translations = {
  ru: {
    nav_catalog: 'КАТАЛОГ',
    hero_cta: 'НАЧАТЬ ПОКУПКИ',
    home_collection: 'КОЛЛЕКЦИЯ',
    home_subtitle: 'Экипировка для достижения новых высот',
    all_catalog: 'ВЕСЬ КАТАЛОГ',
    cat_sneakers: 'Кроссовки',
    cat_tshirts: 'Футболка',
    cat_crossfit: 'Для кроссфита',
    home_sneakers: 'КРОССОВКИ',
    home_tshirts: 'ФУТБОЛКИ',
    home_crossfit: 'CROSSFIT',
    home_sneakers_desc: 'Максимальная производительность',
    home_tshirts_desc: 'Комфорт в каждом движении',
    home_crossfit_desc: 'Экипировка для WOD',
    catalog_title: 'КАТАЛОГ',
    catalog_subtitle: 'Экипировка для достижения новых высот',
    f_all: 'ВСЕ',
    f_sneakers: 'КРОССОВКИ',
    f_tshirts: 'ФУТБОЛКИ',
    f_crossfit: 'FOR CROSSFIT',
    st_all: 'Все',
    st_in: 'В наличии',
    st_pre: 'Под заказ',
    loading: 'Загрузка товаров...',
    not_found: 'Товары не найдены',
    retry: 'Повторить',
    more: 'ПОДРОБНЕЕ',
    badge_in: 'В НАЛИЧИИ',
    badge_pre: 'ПОД ЗАКАЗ',
    pd_back: 'НАЗАД К КАТАЛОГУ',
    pd_desc: 'ОПИСАНИЕ',
    pd_color: 'ЦВЕТ',
    pd_size: 'ВЫБЕРИТЕ РАЗМЕР',
    pd_add: 'ДОБАВИТЬ В КОРЗИНУ',
    pd_loading: 'Загрузка...',
    pd_info1: '• Бесплатная доставка по Ташкенту',
    pd_info2: '• Качественный товар, проверено',
    pd_size_err: 'Выберите размер',
    pd_added: 'Товар добавлен в корзину!',
    cart_title: 'КОРЗИНА',
    cart_empty: 'Корзина пуста',
    cart_empty_sub: 'Добавьте товары из каталога',
    cart_size: 'Размер',
    cart_total: 'ИТОГО:',
    cart_checkout: 'ОФОРМИТЬ В TELEGRAM',
    cart_note: 'Заказ будет отправлен в Telegram для оформления',
    cart_removed: 'Товар удалён из корзины',
    cart_empty_err: 'Корзина пуста',
    cart_open_tg: 'Открываем Telegram для оформления!',
    recommend: 'РЕКОМЕНДУЕМ',
    sort_by: 'Сортировка',
    sort_new: 'По новизне',
    sort_price_asc: 'Цена: по возрастанию',
    sort_price_desc: 'Цена: по убыванию',
  },
  uz: {
    nav_catalog: 'KATALOG',
    hero_cta: 'XARIDNI BOSHLASH',
    home_collection: 'KOLLEKSIYA',
    home_subtitle: "Yangi cho'qqilarni zabt etish uchun jihozlar",
    all_catalog: 'BUTUN KATALOG',
    cat_sneakers: 'Krossovkalar',
    cat_tshirts: 'Futbolka',
    cat_crossfit: 'Krossfit uchun',
    home_sneakers: 'KROSSOVKALAR',
    home_tshirts: 'FUTBOLKALAR',
    home_crossfit: 'CROSSFIT',
    home_sneakers_desc: 'Maksimal samaradorlik',
    home_tshirts_desc: 'Har bir harakatda qulaylik',
    home_crossfit_desc: 'WOD uchun jihozlar',
    catalog_title: 'KATALOG',
    catalog_subtitle: "Yangi cho'qqilar uchun jihozlar",
    f_all: 'HAMMASI',
    f_sneakers: 'KROSSOVKALAR',
    f_tshirts: 'FUTBOLKALAR',
    f_crossfit: 'CROSSFIT',
    st_all: 'Hammasi',
    st_in: 'Mavjud',
    st_pre: 'Buyurtma uchun',
    loading: 'Yuklanmoqda...',
    not_found: 'Mahsulot topilmadi',
    retry: 'Qayta urinish',
    more: 'BATAFSIL',
    badge_in: 'MAVJUD',
    badge_pre: 'BUYURTMA',
    pd_back: 'KATALOGGA QAYTISH',
    pd_desc: 'TAVSIF',
    pd_color: 'RANG',
    pd_size: "O'LCHAMNI TANLANG",
    pd_add: "SAVATGA QO'SHISH",
    pd_loading: 'Yuklanmoqda...',
    pd_info1: "• Toshkent bo'ylab bepul yetkazib berish",
    pd_info2: '• Sifatli mahsulot, tekshirilgan',
    pd_size_err: "O'lchamni tanlang",
    pd_added: "Mahsulot savatga qo'shildi!",
    cart_title: 'SAVAT',
    cart_empty: "Savat bo'sh",
    cart_empty_sub: "Katalogdan mahsulot qo'shing",
    cart_size: "O'lcham",
    cart_total: 'JAMI:',
    cart_checkout: 'TELEGRAM ORQALI RASMIYLASHTIRISH',
    cart_note: 'Buyurtma Telegram orqali rasmiylashtiriladi',
    cart_removed: 'Mahsulot savatdan olib tashlandi',
    cart_empty_err: "Savat bo'sh",
    cart_open_tg: 'Telegram ochilmoqda!',
    recommend: 'TAVSIYA ETAMIZ',
    sort_by: 'Saralash',
    sort_new: 'Yangi',
    sort_price_asc: "Narx: o'sish bo'yicha",
    sort_price_desc: "Narx: kamayish bo'yicha",
  },
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('repx_lang') || 'ru');

  const setLang = useCallback((l) => {
    localStorage.setItem('repx_lang', l);
    setLangState(l);
  }, []);

  const t = useCallback((key) => translations[lang]?.[key] ?? key, [lang]);
  const categoryLabel = useCallback((cat) => t(`cat_${cat}`), [t]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, categoryLabel }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
