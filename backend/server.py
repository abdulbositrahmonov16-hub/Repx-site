"""
RepX Store — FastAPI backend.

Features:
  - Products CRUD (MongoDB)
  - Image upload to Cloudinary (returns secure_url)
  - JWT admin auth (password-only). Protects write operations + upload.
  - Auto-seeds products + admin password hash on first run
"""

from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import uuid
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import cloudinary
import cloudinary.uploader

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ----------------------------------------------------------------------------
# Database
# ----------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ----------------------------------------------------------------------------
# Auth / JWT config
# ----------------------------------------------------------------------------
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]

# ----------------------------------------------------------------------------
# Cloudinary config
# ----------------------------------------------------------------------------
cloudinary.config(
    cloud_name=os.environ["CLOUDINARY_CLOUD_NAME"],
    api_key=os.environ["CLOUDINARY_API_KEY"],
    api_secret=os.environ["CLOUDINARY_API_SECRET"],
    secure=True,
)

# ----------------------------------------------------------------------------
# Uploads directory (kept for backward-compat serving of old local images)
# ----------------------------------------------------------------------------
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# ----------------------------------------------------------------------------
# App & router
# ----------------------------------------------------------------------------
app = FastAPI(title="RepX Store API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("repx")


# ----------------------------------------------------------------------------
# Auth helpers
# ----------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token() -> str:
    payload = {
        "sub": "admin",
        "role": "admin",
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def require_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Требуется авторизация")
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("role") != "admin":
            raise HTTPException(status_code=401, detail="Недостаточно прав")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Сессия истекла, войдите снова")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Недействительный токен")


# ----------------------------------------------------------------------------
# Models
# ----------------------------------------------------------------------------
class Color(BaseModel):
    name: str
    images: List[str] = []


class ProductBase(BaseModel):
    name: str
    category: str  # 'sneakers' | 'tshirts' (Одежда) | 'crossfit'
    subcategory: Optional[str] = None  # sneakers: 'running'|'crossfit'|'daily'; tshirts (Одежда): 'tshirts'|'shorts'|'socks'
    price: int
    images: List[str] = []
    colors: List[Color] = []  # optional per-color image galleries
    sizes: List[Any] = []  # mixed: numbers (39..46) or strings ('S','M','Единый')
   status: str = "available"  # 'available' | 'pre-order'
    description: str = ""
    sizeChart: Optional[str] = None  # URL to size chart image, shown on product page


class Product(ProductBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    price: Optional[int] = None
    images: Optional[List[str]] = None
    colors: Optional[List[Color]] = None
    sizes: Optional[List[Any]] = None
   status: Optional[str] = None
    description: Optional[str] = None
    sizeChart: Optional[str] = None


class LoginRequest(BaseModel):
    password: str


class SettingsUpdate(BaseModel):
    telegram_username: Optional[str] = None
    home_categories: Optional[Dict[str, str]] = None  # {sneakers, tshirts, crossfit} -> image url


class OrderItem(BaseModel):
    productId: Optional[str] = None
    name: str
    price: int = 0
    size: Optional[Any] = None
    quantity: int = 1
    image: Optional[str] = None


class OrderCreate(BaseModel):
    items: List[OrderItem]
    total: int
    telegram_username: Optional[str] = ""
    customer_name: Optional[str] = ""
    customer_phone: Optional[str] = ""
    comment: Optional[str] = ""


# CRM statuses. 'sold' is the only status that counts towards revenue.
ORDER_STATUSES = ["new", "contacted", "sold", "canceled"]
# Legacy values that used to mean "sold" in older builds.
SOLD_STATUSES = ["sold", "done", "completed", "Completed", "выполнен", "Выполнен"]


class Order(OrderCreate):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    status: str = "new"  # new | contacted | sold | canceled
    manager_note: Optional[str] = ""
    sold_at: Optional[str] = None
    created_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat()
    )
    updated_at: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    """Partial CRM update: status and/or client card fields."""

    status: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    telegram_username: Optional[str] = None
    manager_note: Optional[str] = None


class CartEvent(BaseModel):
    product_id: Optional[str] = None
    name: Optional[str] = ""
    size: Optional[str] = ""


# ----------------------------------------------------------------------------
# Routes: health
# ----------------------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "RepX Store API is running"}


# ----------------------------------------------------------------------------
# Routes: auth
# ----------------------------------------------------------------------------
@api_router.post("/auth/login")
async def login(body: LoginRequest):
    settings = await db.admin_settings.find_one({"key": "admin"}, {"_id": 0})
    if not settings or not verify_password(body.password, settings["password_hash"]):
        raise HTTPException(status_code=401, detail="Неверный пароль")
    return {"token": create_access_token(), "token_type": "bearer"}


@api_router.get("/auth/me")
async def me(admin: dict = Depends(require_admin)):
    return {"role": admin.get("role")}


# ----------------------------------------------------------------------------
# Routes: settings (public read, admin write)
# ----------------------------------------------------------------------------
@api_router.get("/settings")
async def get_settings():
    doc = await db.settings.find_one({"key": "store"}, {"_id": 0})
    return {
        "telegram_username": (doc or {}).get("telegram_username", ""),
        "home_categories": (doc or {}).get("home_categories", {}),
    }


@api_router.put("/settings")
async def update_settings(body: SettingsUpdate, admin: dict = Depends(require_admin)):
    updates = {}
    if body.telegram_username is not None:
        updates["telegram_username"] = body.telegram_username.strip().lstrip("@")
    if body.home_categories is not None:
        # store as flat dict {category: url}
        updates["home_categories"] = {
            k: v for k, v in body.home_categories.items() if isinstance(v, str)
        }
    if updates:
        await db.settings.update_one(
            {"key": "store"}, {"$set": updates}, upsert=True
        )
    doc = await db.settings.find_one({"key": "store"}, {"_id": 0}) or {}
    return {
        "telegram_username": doc.get("telegram_username", ""),
        "home_categories": doc.get("home_categories", {}),
    }


# ----------------------------------------------------------------------------
# Routes: orders (public create, admin manage)
# ----------------------------------------------------------------------------
@api_router.post("/orders", response_model=Order)
async def create_order(body: OrderCreate):
    order = Order(**body.model_dump())
    await db.orders.insert_one(order.model_dump())
    return order


@api_router.get("/orders", response_model=List[Order])
async def list_orders(admin: dict = Depends(require_admin)):
    docs = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)
    return docs


@api_router.patch("/orders/{order_id}", response_model=Order)
async def update_order(
    order_id: str, body: OrderStatusUpdate, admin: dict = Depends(require_admin)
):
    updates: Dict[str, Any] = {}

    if body.status is not None:
        if body.status not in ORDER_STATUSES:
            raise HTTPException(status_code=400, detail="Недопустимый статус заказа")
        updates["status"] = body.status
        # Revenue is driven by 'sold': stamp / clear the sale date accordingly.
        updates["sold_at"] = (
            datetime.now(timezone.utc).isoformat() if body.status == "sold" else None
        )

    for field in ("customer_name", "customer_phone", "telegram_username", "manager_note"):
        value = getattr(body, field)
        if value is not None:
            updates[field] = value.strip()

    if not updates:
        raise HTTPException(status_code=400, detail="Нечего обновлять")

    updates["updated_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.orders.update_one({"id": order_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return await db.orders.find_one({"id": order_id}, {"_id": 0})


@api_router.delete("/orders/{order_id}")
async def delete_order(order_id: str, admin: dict = Depends(require_admin)):
    res = await db.orders.delete_one({"id": order_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"success": True}


# ----------------------------------------------------------------------------
# Routes: cart events (lightweight analytics) + stats
# ----------------------------------------------------------------------------
@api_router.post("/events/cart")
async def log_cart_event(body: CartEvent):
    await db.cart_events.insert_one(
        {**body.model_dump(), "created_at": datetime.now(timezone.utc).isoformat()}
    )
    return {"success": True}


@api_router.get("/stats")
async def get_stats(admin: dict = Depends(require_admin)):
    """CRM dashboard numbers. Revenue = sum of totals of orders with status 'sold'."""
    products_count = await db.products.count_documents({})
    orders_count = await db.orders.count_documents({})
    add_to_cart = await db.cart_events.count_documents({})

    by_status: Dict[str, int] = {}
    for status in ORDER_STATUSES:
        query = {"status": {"$in": SOLD_STATUSES}} if status == "sold" else {"status": status}
        by_status[status] = await db.orders.count_documents(query)

    sold_docs = await db.orders.find(
        {"status": {"$in": SOLD_STATUSES}},
        {"_id": 0, "total": 1, "sold_at": 1, "created_at": 1},
    ).to_list(5000)

    def order_total(doc: dict) -> int:
        try:
            return int(doc.get("total") or 0)
        except (TypeError, ValueError):
            return 0

    revenue = sum(order_total(d) for d in sold_docs)
    sold_count = len(sold_docs)

    now = datetime.now(timezone.utc)
    month_prefix = now.strftime("%Y-%m")
    today_prefix = now.strftime("%Y-%m-%d")
    revenue_month = sum(
        order_total(d)
        for d in sold_docs
        if str(d.get("sold_at") or d.get("created_at") or "").startswith(month_prefix)
    )
    revenue_today = sum(
        order_total(d)
        for d in sold_docs
        if str(d.get("sold_at") or d.get("created_at") or "").startswith(today_prefix)
    )

    avg_check = int(revenue / sold_count) if sold_count else 0
    conversion = round(sold_count / orders_count * 100, 1) if orders_count else 0.0

    return {
        "products": products_count,
        "orders": orders_count,
        "new_orders": by_status.get("new", 0),
        "contacted_orders": by_status.get("contacted", 0),
        "sold_orders": sold_count,
        "canceled_orders": by_status.get("canceled", 0),
        "revenue": revenue,
        "revenue_month": revenue_month,
        "revenue_today": revenue_today,
        "avg_check": avg_check,
        "conversion": conversion,
        "add_to_cart": add_to_cart,
    }


# ----------------------------------------------------------------------------
# Routes: products
# ----------------------------------------------------------------------------
@api_router.get("/products", response_model=List[Product])
async def list_products(
    category: Optional[str] = None, subcategory: Optional[str] = None
):
    query = {}
    if category and category != "all":
        query["category"] = category
    if subcategory and subcategory != "all":
        query["subcategory"] = subcategory
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    return products


@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@api_router.post("/products", response_model=Product)
async def create_product(payload: ProductCreate, admin: dict = Depends(require_admin)):
    product = Product(**payload.model_dump())
    await db.products.insert_one(product.model_dump())
    return product


@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(
    product_id: str, payload: ProductUpdate, admin: dict = Depends(require_admin)
):
    existing = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")

    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if updates:
        await db.products.update_one({"id": product_id}, {"$set": updates})

    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, admin: dict = Depends(require_admin)):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"success": True, "message": "Product deleted"}


# ----------------------------------------------------------------------------
# Routes: image upload (Cloudinary) — admin only
# ----------------------------------------------------------------------------
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
MAX_UPLOAD_BYTES = 8 * 1024 * 1024  # 8 MB


@api_router.post("/upload")
async def upload_image(
    file: UploadFile = File(...), admin: dict = Depends(require_admin)
):
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Недопустимый формат. Разрешены: JPEG, PNG, WEBP, GIF",
        )

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail="Файл слишком большой. Максимум 8 МБ.",
        )

    try:
        result = cloudinary.uploader.upload(
            contents, folder="repx_store", resource_type="image"
        )
    except Exception as e:
        logger.error("Cloudinary upload failed: %s", e)
        raise HTTPException(status_code=502, detail="Не удалось загрузить изображение")

    return {"url": result["secure_url"], "secure_url": result["secure_url"]}


# ----------------------------------------------------------------------------
# Seed data (runs once if products collection is empty)
# ----------------------------------------------------------------------------
SEED_PRODUCTS = [
    {
        "id": "1",
        "name": "RepX Training Кроссовки",
        "category": "sneakers",
        "subcategory": "crossfit",
        "price": 850000,
        "images": [
            "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
            "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800",
        ],
        "sizes": [39, 40, 41, 42, 43, 44, 45],
        "status": "available",
        "description": "Профессиональные тренировочные кроссовки RepX для максимальной производительности.",
    },
    {
        "id": "2",
        "name": "RepX Pro Кроссовки",
        "category": "sneakers",
        "subcategory": "running",
        "price": 950000,
        "images": ["https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800"],
        "sizes": [39, 40, 41, 42, 43, 44],
        "status": "available",
        "description": "Премиальная модель для бега. Инновационная амортизация и дышащий материал.",
    },
    {
        "id": "5",
        "name": "RepX Elite Кроссовки",
        "category": "sneakers",
        "subcategory": "daily",
        "price": 1100000,
        "images": ["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800"],
        "sizes": [40, 41, 42, 43, 44, 45],
        "status": "available",
        "description": "Топовая модель линейки RepX. Максимальный комфорт и стиль на каждый день.",
    },
    {
        "id": "3",
        "name": "RepX Classic Футболка",
        "category": "tshirts",
        "subcategory": "tshirts",
        "price": 250000,
        "images": [
            "https://customer-assets-4nw71qhi.emergentagent.net/job_c7a5e226-fc31-497c-bd5e-320bedc19cc3/artifacts/bn79a0oy_IMG_20260729_162355_183.png"
        ],
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "status": "available",
        "description": "Классическая футболка RepX из премиального хлопка.",
    },
    {
        "id": "4",
        "name": "RepX Performance Футболка",
        "category": "tshirts",
        "subcategory": "tshirts",
        "price": 280000,
        "images": [
            "https://customer-assets-4nw71qhi.emergentagent.net/job_c7a5e226-fc31-497c-bd5e-320bedc19cc3/artifacts/bn79a0oy_IMG_20260729_162355_183.png"
        ],
        "sizes": ["S", "M", "L", "XL"],
        "status": "pre-order",
        "description": "Технологичная футболка с влагоотводящей тканью для интенсивных тренировок.",
    },
    {
        "id": "6",
        "name": "RepX ONE MORE Футболка",
        "category": "tshirts",
        "subcategory": "tshirts",
        "price": 300000,
        "images": [
            "https://customer-assets-4nw71qhi.emergentagent.net/job_c7a5e226-fc31-497c-bd5e-320bedc19cc3/artifacts/bn79a0oy_IMG_20260729_162355_183.png"
        ],
        "sizes": ["S", "M", "L", "XL", "XXL"],
        "status": "available",
        "description": "Лимитированная футболка с фирменным слоганом ONE MORE.",
    },
    {
        "id": "7",
        "name": "RepX Скакалка Speed",
        "category": "crossfit",
        "price": 180000,
        "images": ["https://images.unsplash.com/photo-1434682881908-b43d0467b798?w=800"],
        "sizes": ["Единый"],
        "status": "available",
        "description": "Скоростная скакалка RepX с подшипниками. Идеальна для double-unders.",
    },
    {
        "id": "8",
        "name": "RepX Наколенники",
        "category": "crossfit",
        "price": 220000,
        "images": ["https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=800"],
        "sizes": ["S", "M", "L", "XL"],
        "status": "available",
        "description": "Компрессионные наколенники 7 мм для тяжёлых приседаний.",
    },
    {
        "id": "9",
        "name": "RepX Накладки для рук",
        "category": "crossfit",
        "price": 150000,
        "images": ["https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800"],
        "sizes": ["S", "M", "L"],
        "status": "available",
        "description": "Кожаные накладки (grips) для защиты ладоней на турнике и кольцах.",
    },
    {
        "id": "10",
        "name": "RepX Пояс атлетический",
        "category": "crossfit",
        "price": 350000,
        "images": ["https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=800"],
        "sizes": ["M", "L", "XL"],
        "status": "pre-order",
        "description": "Тяжелоатлетический пояс RepX из натуральной кожи.",
    },
]


@app.on_event("startup")
async def seed_database():
    # Seed admin password hash
    existing_admin = await db.admin_settings.find_one({"key": "admin"})
    if existing_admin is None:
        await db.admin_settings.insert_one(
            {"key": "admin", "password_hash": hash_password(ADMIN_PASSWORD)}
        )
        logger.info("Seeded admin password")
    elif not verify_password(ADMIN_PASSWORD, existing_admin["password_hash"]):
        await db.admin_settings.update_one(
            {"key": "admin"}, {"$set": {"password_hash": hash_password(ADMIN_PASSWORD)}}
        )
        logger.info("Updated admin password hash")

    # Seed store settings (Telegram username for checkout)
    if await db.settings.find_one({"key": "store"}) is None:
        await db.settings.insert_one({"key": "store", "telegram_username": "wmexxa"})
        logger.info("Seeded store settings")

    # Seed products
    count = await db.products.count_documents({})
    if count == 0:
        now = datetime.now(timezone.utc).isoformat()
        docs = [{**p, "created_at": now} for p in SEED_PRODUCTS]
        await db.products.insert_many(docs)
        logger.info("Seeded %d products", len(docs))
    else:
        logger.info("Products already present (%d) — skipping seed", count)


# ----------------------------------------------------------------------------
# Wire up app
# ----------------------------------------------------------------------------
app.include_router(api_router)

# Serve uploaded images (legacy local files).
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
