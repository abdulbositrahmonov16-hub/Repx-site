# RepX-site — PRD (update)

Дата обновления: 2026-02-07

## Что было сделано в этой итерации

### Фаза 1 — Багфикс скролла (главный приоритет)
- `frontend/src/hooks/useSmoothScroll.js` — рефакторинг: инстанс Lenis теперь хранится в ref и в модульном singleton `lenisSingleton` (экспорт `getLenis()`). Хук возвращает ref.
- `frontend/src/components/ScrollToTop.jsx` — новый компонент. На смену `pathname`:
  - Дергает `lenis.scrollTo(0, { immediate: true, force: true })` если Lenis доступен
  - Вызывает `window.scrollTo({ top: 0, behavior: 'auto' })` как fallback / belt-and-braces
  - На mount отключает `history.scrollRestoration = 'manual'`, чтобы браузер не восстанавливал старую позицию на back-nav
- `frontend/src/App.js` — `<ScrollToTop />` подключён внутри `<BrowserRouter>` перед `<Routes>`.

### Фаза 2 — Хедер каталога (`Catalog.jsx`)
- Высота: `46vh min-h-[340px]` → **`38vh min-h-[280px]`**
- Шрифт заголовка: `font-['Anton']` → **`font-display font-extrabold`** (Bricolage Grotesque 800 → Space Grotesk fallback), tracking `[-0.045em]`, uppercase, `text-5xl md:text-7xl lg:text-8xl leading-[0.9]`
- Градиент: **`from-black/95 via-black/60 to-black/20`** (глубже)
- Добавлен subtle noise/grain overlay (SVG turbulence, `mix-blend-overlay`, opacity 0.18)
- Пилюля-бейдж «ВЕСЬ КАТАЛОГ» с champagne-точкой, backdrop-blur

### Фаза 3 — Сетка карточек
- Grid: **`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`** (мобильный всегда ≥2 колонки)
- Gap: `gap-4 sm:gap-6 lg:gap-8`
- Карточка: **`aspect-[4/5]`** вертикальная (было square)
- Скругление: `rounded-2xl` → **`rounded-xl`**
- Убран hover-оверлей с текстом «Подробнее» — заменён на подъём `whileHover={{ y: -6 }}` + `whileHover={{ scale: 1.05 }}` на картинке + маленькая кнопка ↗ в углу
- Статус-бейдж: пилюля-заливка → **тонкий бордер `border-black/20`**, `bg-white/70 backdrop-blur`, чёрный/белый текст
- Индикаторы цветов: **`w-4 h-4`** с `ring-1 ring-black/70` (тёмная обводка вместо белой)
- Название: **`font-semibold`**, `truncate`
- Категория **под ценой**, мелким кеглем `text-xs text-black/50`
- Цена: остался `Anton` как акцент бренда, `text-xl`

### Фаза 4 — Фильтры + сортировка
- Пилюли категорий: **`py-2 px-5 text-sm`**, активная **`bg-black text-white`** (золото убрано), неактивные `border-black/10`
- Статус-фильтры: тоньше `px-3.5 py-1.5 text-xs`, активные — чёрные
- Добавлен **`<select>` для сортировки** (справа от фильтров): По новизне / Цена ↑ / Цена ↓ — с data-testid, работает через `useMemo`
- Sticky-панель: **`sticky top-16 md:top-20 z-20 bg-white/80 backdrop-blur-xl`** с нижней хейрлайн-границей
- Счётчик результатов (справа снизу от статус-фильтров)

### Фаза 5 — Страница товара (`ProductDetail.jsx`)
- Отступы: **`pt-24 md:pt-28`** (меньше пустоты на мобильном) + `pb-32 md:pb-20` (место под sticky CTA)
- Галерея: **`rounded-2xl` → `rounded-xl`**, миниатюры **`grid-cols-5`** (было 4), тонкий ring вместо золотого
- Заголовок: `font-['Anton']` → **`font-display font-extrabold`**, tracking `[-0.035em]`, `text-4xl md:text-5xl lg:text-6xl`
- Кнопка «В корзину»: **sticky снизу на мобильном** `fixed bottom-4 inset-x-4 md:static`, `md:hidden`-версия с ценой, `md:block`-версия внутри правой колонки
- Размеры: `grid-cols-5` → **`grid-cols-6 md:grid-cols-5`** (плотнее на мобильном), активная — чёрная, чек в champagne-кружочке
- Статус-пилюля переехала в top-left и стала тонкой (бордер + backdrop)
- Убраны золотые ring-offset, заменены на `ring-2 ring-black`

### Фаза 6 — Проверка
- `yarn build` → **Compiled successfully** (180 KB gz, 11.67 KB CSS)
- Backend endpoints (`/api/products`) не изменены — только добавлены отсутствующие env-переменные в `backend/.env` (JWT_SECRET, ADMIN_PASSWORD, CLOUDINARY_*) для локального запуска, без правок логики
- Regress: сохранены i18n (RU/UZ), корзина (localStorage), Header/Footer/Cart/AdminPanel

### Дополнения
- `tailwind.config.js`: добавлен `fontFamily.display` (Bricolage Grotesque → Space Grotesk fallback)
- `public/index.html`: подключены Google Fonts Bricolage Grotesque + Space Grotesk (сохранён Anton для акцента цены)
- `LanguageContext.js`: добавлены ключи `sort_by`, `sort_new`, `sort_price_asc`, `sort_price_desc` для RU и UZ

## Проверенные сценарии (Playwright)
- Home → Catalog: `scrollY = 0` ✓
- Catalog → Product: `scrollY = 0` ✓  (главный баг из ТЗ)
- Product → Back: `scrollY = 0` ✓
- Sort «Цена: по убыванию»: порядок 1 100 000 → 950 000 → 850 000 → 350 000 ✓
- Filter «Кроссовки»: 3 позиции ✓
- Build: compiles, no errors ✓

## Что НЕ трогали (гарантия)
- `backend/server.py`, схема MongoDB, эндпойнты `/api/products`, `/api/upload`
- `frontend/src/utils/products.js`, `utils/cart.js`, `utils/api.js`
- `context/LanguageContext.js` — только добавлены новые ключи, старые не менялись
- Роутинг, локализация, корзина, админка, Header/Footer/Cart
