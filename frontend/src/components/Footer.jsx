import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import { fetchSettings } from '../utils/settings';
import { useLang } from '../context/LanguageContext';

const Footer = () => {
  const [tgUsername, setTgUsername] = useState('');
  const { t } = useLang();

  useEffect(() => {
    let active = true;
    fetchSettings()
      .then((s) => active && setTgUsername(s.telegram_username || ''))
      .catch(() => {});
    const onUpdate = () => {
      fetchSettings()
        .then((s) => setTgUsername(s.telegram_username || ''))
        .catch(() => {});
    };
    window.addEventListener('settingsUpdate', onUpdate);
    return () => {
      active = false;
      window.removeEventListener('settingsUpdate', onUpdate);
    };
  }, []);

  const tgHandle = (tgUsername || 'wmexxa').replace(/^@/, '');
  const tgUrl = `https://t.me/${tgHandle}`;

  return (
    <footer className="bg-black text-white py-16">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-['Anton'] text-4xl tracking-wider mb-4"
            >
              REP<span className="text-[#BFA982]">X</span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-white/60 text-sm"
            >
              ONE MORE — философия постоянного роста
            </motion.p>
          </div>

          {/* Links */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-semibold mb-4 tracking-wide"
            >
              НАВИГАЦИЯ
            </motion.h3>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col gap-2 text-sm text-white/60"
            >
              <a href="/" className="hover:text-[#BFA982] transition-colors">Главная</a>
              <a href="/catalog" className="hover:text-[#BFA982] transition-colors">Каталог</a>
            </motion.div>
          </div>

          {/* Contact */}
          <div>
            <motion.h3
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="font-semibold mb-4 tracking-wide"
            >
              КОНТАКТЫ
            </motion.h3>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="flex flex-col gap-3 text-sm text-white/60"
            >
              <p>repx.uz</p>
              <p>Узбекистан, Ташкент</p>

              {/* Primary contact CTA */}
              <a
                href={tgUrl}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="contact-admin-btn"
                className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#BFA982] text-black font-semibold tracking-wide hover:bg-[#A8906A] transition-colors"
              >
                <Send className="w-4 h-4" />
                {t('contact_admin')}
              </a>

              {/* Social links */}
              <div className="flex gap-3 mt-2">
                <a
                  href={tgUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Telegram"
                  data-testid="footer-telegram-link"
                  className="w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-[#BFA982] hover:text-black transition-colors"
                >
                  <i className="fa-brands fa-telegram text-lg"></i>
                </a>
                <a
                  href="https://www.instagram.com/repx.uz?igsh=N3RoeXlvOGlhNm9o"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  data-testid="footer-instagram-link"
                  className="w-11 h-11 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-[#BFA982] hover:text-black transition-colors"
                >
                  <i className="fa-brands fa-instagram text-lg"></i>
                </a>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 pt-8 border-t border-white/10 text-center text-sm text-white/40"
        >
          © 2026 RepX. Все права защищены.
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
