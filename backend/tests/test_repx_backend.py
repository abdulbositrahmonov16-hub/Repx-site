"""RepX Store backend API tests (auth, products CRUD, protected endpoints, Cloudinary upload)."""
import io
import os
import pytest
import requests

# Read backend URL from frontend .env (matches user testing / external URL)
BASE_URL = None
try:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
except Exception:
    pass
if not BASE_URL:
    BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")

API = f"{BASE_URL}/api"
ADMIN_PASSWORD = "Abdul_19"


@pytest.fixture(scope="module")
def session():
    return requests.Session()


@pytest.fixture(scope="module")
def admin_token(session):
    r = session.post(f"{API}/auth/login", json={"password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    assert isinstance(token, str) and len(token) > 20
    return token


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


# ------------- Health -------------
def test_health(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert "message" in r.json()


# ------------- Auth -------------
def test_login_wrong_password(session):
    r = session.post(f"{API}/auth/login", json={"password": "wrong-pass-xyz"})
    assert r.status_code == 401
    assert "Неверный пароль" in r.text

def test_login_success_and_me(session, admin_token):
    r = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {admin_token}"})
    assert r.status_code == 200
    assert r.json().get("role") == "admin"

def test_me_without_token(session):
    r = session.get(f"{API}/auth/me")
    assert r.status_code == 401


# ------------- Products list & seed -------------
def test_list_products_seeded(session):
    r = session.get(f"{API}/products")
    assert r.status_code == 200
    products = r.json()
    assert isinstance(products, list)
    assert len(products) >= 10
    for key in ["id", "name", "category", "price", "images", "sizes", "status", "description"]:
        assert key in products[0], f"missing key {key}"
    sneakers = [p for p in products if p["category"] == "sneakers"]
    assert len(sneakers) >= 3
    for s in sneakers:
        assert s.get("subcategory") in {"running", "crossfit", "daily"}


def test_filter_by_category_sneakers(session):
    r = session.get(f"{API}/products", params={"category": "sneakers"})
    assert r.status_code == 200
    prods = r.json()
    assert len(prods) >= 3
    assert all(p["category"] == "sneakers" for p in prods)


def test_filter_by_subcategory_running(session):
    r = session.get(f"{API}/products", params={"category": "sneakers", "subcategory": "running"})
    assert r.status_code == 200
    prods = r.json()
    assert all(p["subcategory"] == "running" for p in prods)
    assert len(prods) >= 1


def test_get_product_by_id(session):
    r = session.get(f"{API}/products/1")
    assert r.status_code == 200
    p = r.json()
    assert p["id"] == "1"
    assert p["category"] == "sneakers"


def test_get_product_404(session):
    r = session.get(f"{API}/products/nonexistent-xyz-999")
    assert r.status_code == 404


# ------------- Protected endpoints must reject without token -------------
def test_create_without_token_401(session):
    r = session.post(f"{API}/products", json={
        "name": "TEST_", "category": "tshirts", "price": 1, "sizes": ["S"], "images": []
    })
    assert r.status_code == 401

def test_update_without_token_401(session):
    r = session.put(f"{API}/products/1", json={"price": 1})
    assert r.status_code == 401

def test_delete_without_token_401(session):
    r = session.delete(f"{API}/products/1")
    assert r.status_code == 401

def test_upload_without_token_401(session):
    files = {"file": ("x.png", io.BytesIO(b"\x89PNG\r\n\x1a\n"), "image/png")}
    r = session.post(f"{API}/upload", files=files)
    assert r.status_code == 401


# ------------- CRUD (auth required) -------------
def test_crud_lifecycle(session, auth_headers):
    payload = {
        "name": "TEST_RepX Item",
        "category": "tshirts",
        "price": 111000,
        "images": ["https://example.com/x.jpg"],
        "sizes": ["S", "M"],
        "status": "available",
        "description": "TEST description",
    }
    r = session.post(f"{API}/products", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    created = r.json()
    pid = created["id"]
    assert isinstance(pid, str) and len(pid) > 0
    assert created["name"] == payload["name"]
    assert created["price"] == 111000

    try:
        # Appears in list (visible without auth - public GET)
        r = session.get(f"{API}/products")
        assert any(p["id"] == pid for p in r.json())

        # Update price
        r = session.put(f"{API}/products/{pid}", json={"price": 222000}, headers=auth_headers)
        assert r.status_code == 200
        upd = r.json()
        assert upd["price"] == 222000
        assert upd["name"] == payload["name"]

        # Verify persisted (public GET)
        r = session.get(f"{API}/products/{pid}")
        assert r.status_code == 200
        assert r.json()["price"] == 222000

        # PUT 404
        r = session.put(f"{API}/products/does-not-exist-abc", json={"price": 1}, headers=auth_headers)
        assert r.status_code == 404
    finally:
        r = session.delete(f"{API}/products/{pid}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json().get("success") is True

    r = session.get(f"{API}/products/{pid}")
    assert r.status_code == 404

    r = session.delete(f"{API}/products/{pid}", headers=auth_headers)
    assert r.status_code == 404


# ------------- Cloudinary upload -------------
# Minimal valid 1x1 PNG (~ 67 bytes)
PNG_BYTES = bytes.fromhex(
    "89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4"
    "890000000D49444154789C63F8CFC0F00F000501010012D3A4B70000000049454E44AE426082"
)


def test_upload_image_cloudinary(session, auth_headers):
    files = {"file": ("test.png", io.BytesIO(PNG_BYTES), "image/png")}
    r = session.post(f"{API}/upload", files=files, headers=auth_headers)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "secure_url" in data and "url" in data
    assert data["secure_url"].startswith("https://res.cloudinary.com/"), data
    # URL should be reachable
    got = requests.get(data["secure_url"], timeout=15)
    assert got.status_code == 200
    assert got.headers.get("content-type", "").startswith("image/")


def test_upload_rejects_non_image(session, auth_headers):
    files = {"file": ("bad.txt", io.BytesIO(b"hello"), "text/plain")}
    r = session.post(f"{API}/upload", files=files, headers=auth_headers)
    assert r.status_code == 400
