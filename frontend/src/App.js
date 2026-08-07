import React, { useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { useSmoothScroll } from "@/hooks/useSmoothScroll";
import { LanguageProvider } from "@/context/LanguageContext";

// Components
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Cart from "@/components/Cart";
import ScrollToTop from "@/components/ScrollToTop";

// Pages
import Home from "@/pages/Home";
import Catalog from "@/pages/Catalog";
import ProductDetail from "@/pages/ProductDetail";
import AdminPanel from "@/pages/AdminPanel";

function App() {
  const [cartOpen, setCartOpen] = useState(false);
  useSmoothScroll();

  return (
    <LanguageProvider>
      <div className="App">
        <BrowserRouter>
          <ScrollToTop />
          <Header onCartOpen={() => setCartOpen(true)} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Routes>
          <Footer />
          <Cart isOpen={cartOpen} onClose={() => setCartOpen(false)} />
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </div>
    </LanguageProvider>
  );
}

export default App;
