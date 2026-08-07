// Mock data for RepX store

export const products = [
  {
    id: '1',
    name: 'RepX Training Кроссовки',
    category: 'sneakers',
    subcategory: 'crossfit',
    price: 850000,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800',
      'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800'
    ],
    sizes: [39, 40, 41, 42, 43, 44, 45],
    status: 'available',
    description: 'Профессиональные тренировочные кроссовки RepX для максимальной производительности. Разработаны для интенсивных тренировок с оптимальной поддержкой стопы.'
  },
  {
    id: '2',
    name: 'RepX Pro Кроссовки',
    category: 'sneakers',
    subcategory: 'running',
    price: 950000,
    images: [
      'https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800',
      'https://images.unsplash.com/photo-1539185441755-769473a23570?w=800'
    ],
    sizes: [39, 40, 41, 42, 43, 44],
    status: 'available',
    description: 'Премиальная модель для профессиональных атлетов. Инновационная технология амортизации и дышащий материал.'
  },
  {
    id: '3',
    name: 'RepX Classic Футболка',
    category: 'tshirts',
    price: 250000,
    images: [
      'https://customer-assets-4nw71qhi.emergentagent.net/job_c7a5e226-fc31-497c-bd5e-320bedc19cc3/artifacts/bn79a0oy_IMG_20260729_162355_183.png',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800'
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    status: 'available',
    description: 'Классическая футболка RepX из премиального хлопка. Идеальна для тренировок и повседневной носки.'
  },
  {
    id: '4',
    name: 'RepX Performance Футболка',
    category: 'tshirts',
    price: 280000,
    images: [
      'https://customer-assets-4nw71qhi.emergentagent.net/job_c7a5e226-fc31-497c-bd5e-320bedc19cc3/artifacts/bn79a0oy_IMG_20260729_162355_183.png',
      'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    status: 'pre-order',
    description: 'Технологичная футболка с влагоотводящей тканью для интенсивных тренировок.'
  },
  {
    id: '5',
    name: 'RepX Elite Кроссовки',
    category: 'sneakers',
    subcategory: 'daily',
    price: 1100000,
    images: [
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800',
      'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800'
    ],
    sizes: [40, 41, 42, 43, 44, 45],
    status: 'available',
    description: 'Топовая модель линейки RepX. Максимальный комфорт и стиль для достижения новых высот.'
  },
  {
    id: '6',
    name: 'RepX ONE MORE Футболка',
    category: 'tshirts',
    price: 300000,
    images: [
      'https://customer-assets-4nw71qhi.emergentagent.net/job_c7a5e226-fc31-497c-bd5e-320bedc19cc3/artifacts/bn79a0oy_IMG_20260729_162355_183.png'
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    status: 'available',
    description: 'Лимитированная футболка с фирменным слоганом ONE MORE. Для тех, кто всегда идёт дальше.'
  },
  {
    id: '7',
    name: 'RepX Скакалка Speed',
    category: 'crossfit',
    price: 180000,
    images: [
      'https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800',
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'
    ],
    sizes: ['Единый'],
    status: 'available',
    description: 'Скоростная скакалка RepX с подшипниками и стальным тросом. Идеальна для double-unders и кроссфит-WOD. Регулируемая длина.'
  },
  {
    id: '8',
    name: 'RepX Наколенники',
    category: 'crossfit',
    price: 220000,
    images: [
      'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800'
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    status: 'available',
    description: 'Компрессионные наколенники 7 мм для тяжёлых приседаний и олимпийских движений. Надёжная поддержка коленного сустава.'
  },
  {
    id: '9',
    name: 'RepX Накладки для рук',
    category: 'crossfit',
    price: 150000,
    images: [
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800'
    ],
    sizes: ['S', 'M', 'L'],
    status: 'available',
    description: 'Кожаные накладки (гимнастические grips) для защиты ладоней на турнике и кольцах. Максимальный хват без мозолей.'
  },
  {
    id: '10',
    name: 'RepX Пояс атлетический',
    category: 'crossfit',
    price: 350000,
    images: [
      'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800'
    ],
    sizes: ['M', 'L', 'XL'],
    status: 'pre-order',
    description: 'Тяжелоатлетический пояс RepX из натуральной кожи. Стабилизация корпуса при становой тяге и приседаниях со штангой.'
  }
];

export const categoryFilters = [
  { id: 'all', label: 'ВСЕ' },
  { id: 'sneakers', label: 'КРОССОВКИ' },
  { id: 'tshirts', label: 'ФУТБОЛКИ' },
  { id: 'crossfit', label: 'FOR CROSSFIT' }
];

export const sneakerSubcategories = [
  { id: 'all', label: 'ВСЕ' },
  { id: 'running', label: 'RUNNING' },
  { id: 'crossfit', label: 'CROSSFIT' },
  { id: 'daily', label: 'DAILY' }
];

export const getCategoryLabel = (category) => {
  switch (category) {
    case 'sneakers':
      return 'Кроссовки';
    case 'tshirts':
      return 'Футболка';
    case 'crossfit':
      return 'Для кроссфита';
    default:
      return '';
  }
};

export const manifestoItems = [
  {
    number: '01',
    title: 'ОДИН ПОДХОД',
    text: 'Когда кажется, что сил больше нет — сделай ещё один. Граница возможностей всегда дальше, чем ты думаешь.'
  },
  {
    number: '02',
    title: 'ОДИН ШАГ',
    text: 'Каждое утро начинается с выбора: остаться или двигаться вперёд. RepX — для тех, кто выбирает движение.'
  },
  {
    number: '03',
    title: 'ОДНА ЦЕЛЬ',
    text: 'Стать лучше, чем вчера. Не соревнуйся с другими — соревнуйся с собой. ONE MORE — это философия постоянного роста.'
  }
];