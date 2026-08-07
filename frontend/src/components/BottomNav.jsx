import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Grid, Search, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLang } from '../context/LanguageContext';

/**
 * Fixed bottom nav bar for mobile only.
 * Provides the 4 primary entry points the user requested:
 * Home · Catalog · Search · Cart.
 */
const BottomNav = ({ cartCount = 0, onCartOpen, onSearchOpen }) => {
  const location = useLocation();
  const { t } = useLang();

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const item = 'flex flex-col items-center gap-1 flex-1 py-2 text-[10px] font-medium tracking-wide uppercase transition-colors';
  const activeCls = 'text-black';
  const idleCls = 'text-black/45';

  return (
    <nav
      data-testid="bottom-nav"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-black/10 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-stretch">
        <NavLink
          to="/"
          end
          data-testid="bnav-home"
          className={({ isActive }) => `${item} ${isActive ? activeCls : idleCls}`}
        >
          <Home className="w-5 h-5" strokeWidth={1.7} />
          <span>{t('bnav_home')}</span>
        </NavLink>

        <NavLink
          to="/catalog"
          data-testid="bnav-catalog"
          className={({ isActive }) => `${item} ${isActive ? activeCls : idleCls}`}
        >
          <Grid className="w-5 h-5" strokeWidth={1.7} />
          <span>{t('bnav_catalog')}</span>
        </NavLink>

        <button
          data-testid="bnav-search"
          onClick={onSearchOpen}
          className={`${item} ${idleCls} hover:text-black`}
        >
          <Search className="w-5 h-5" strokeWidth={1.7} />
          <span>{t('bnav_search')}</span>
        </button>

        <button
          data-testid="bnav-cart"
          onClick={onCartOpen}
          className={`${item} ${idleCls} hover:text-black relative`}
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5" strokeWidth={1.7} />
            {cartCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1 rounded-full bg-[#BFA982] text-black text-[10px] font-bold flex items-center justify-center"
              >
                {cartCount}
              </motion.span>
            )}
          </div>
          <span>{t('bnav_cart')}</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
