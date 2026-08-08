import React, { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { LanguageProvider } from "@/context/LanguageContext";

// Components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Orders from './pages/Orders';
import Cart from "@/components/Cart";
import ScrollToTop from "@/components/ScrollToTop";
import BottomNav from "@/components/BottomNav";
import SearchModal from "@/components/SearchModal";

// Pages
import Home from "@/pages/Home";
import Catalog from "@/pages/Catalog";
import ProductDetail from "@/pages/ProductDetail";
import AdminPanel from "@/pages/AdminPanel";

import { getCart } from "@/utils/cart";

function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  useSmoothScroll();

  useEffect(() => {
    const update = () => {
      const c = getCart();
      setCartCount(c.reduce((s, i) => s + i.quantity, 0));
    };
    update();
    window.addEventListener("cartUpdate", update);
    return () => window.removeEventListener("cartUpdate", update);
  }, []);

  return (
    <LanguageProvider>
      <div className="App pb-20 md:pb-0">
        <BrowserRouter>
          <ScrollToTop />
          <Header onCartOpen={() => setCartOpen(true)} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin/orders" element={<Orders />} />
          </Routes>
          <Footer />
          <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
          <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
          <BottomNav
            cartCount={cartCount}
            onCartOpen={() => setCartOpen(true)}
            onSearchOpen={() => setSearchOpen(true)}
          />
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </div>
    </LanguageProvider>
  );
}

export default App;
