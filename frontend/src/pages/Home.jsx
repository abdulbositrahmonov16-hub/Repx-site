import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../context/LanguageContext';

const Hero = () => {
  const navigate = useNavigate();
  const { t } = useLang();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <section ref={ref} className="relative h-screen flex items-end justify-center overflow-hidden bg-black">
      {/* Background Image with Parallax */}
      <motion.div
        style={{ y }}
        className="absolute inset-0 w-full h-full"
      >
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{ 
            backgroundImage: 'url(https://customer-assets-gfyr7b9c.emergentagent.net/job_repx-shop/artifacts/c05thcju_IMG_20260802_192339_265.png)',
            filter: 'brightness(0.85)'
          }}
        />
        {/* Subtle gradient at bottom for button readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      </motion.div>

      {/* Content - only CTA button since logo is on the image */}
      <motion.div 
        style={{ opacity }}
        className="relative z-10 text-center px-6 pb-12 md:pb-16"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            onClick={() => navigate('/catalog')}
            className="group relative px-10 py-4 rounded-full bg-[#BFA982] text-black font-semibold tracking-wide overflow-hidden"
          >
            <motion.span
              className="absolute inset-0 bg-black"
              initial={{ x: '-100%' }}
              whileHover={{ x: 0 }}
              transition={{ duration: 0.3 }}
            />
            <span className="relative z-10 flex items-center gap-2 group-hover:text-white transition-colors">
              {t('hero_cta')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
};

const Marquee = () => {
  const text = 'ONE MORE • REP X • ';
  const repeatedText = text.repeat(20);

  return (
    <div className="bg-[#BFA982] py-6 overflow-hidden">
      <motion.div
        animate={{ x: [0, -1920] }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear'
        }}
        className="whitespace-nowrap font-['Anton'] text-4xl md:text-6xl text-black/80 tracking-wider"
      >
        {repeatedText}
      </motion.div>
    </div>
  );
};

const FeaturedProducts = () => {
  const navigate = useNavigate();
  const { t } = useLang();

  return (
    <section className="py-24 bg-neutral-50">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="font-['Anton'] text-5xl md:text-7xl mb-4">
            {t('home_collection')}
          </h2>
          <p className="text-black/60 text-lg">{t('home_subtitle')}</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Sneakers Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -10 }}
            transition={{ duration: 0.4 }}
            onClick={() => navigate('/catalog?filter=sneakers')}
            className="group relative h-[500px] rounded-3xl overflow-hidden cursor-pointer bg-white"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <motion.div
                initial={{ x: 0 }}
                whileHover={{ x: 10 }}
                className="flex items-center gap-3"
              >
                <Zap className="w-8 h-8" />
                <h3 className="font-['Anton'] text-4xl tracking-wide">{t('home_sneakers')}</h3>
              </motion.div>
              <p className="mt-4 text-white/80">{t('home_sneakers_desc')}</p>
            </div>
          </motion.div>

          {/* T-Shirts Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -10 }}
            onClick={() => navigate('/catalog?filter=tshirts')}
            className="group relative h-[500px] rounded-3xl overflow-hidden cursor-pointer bg-white"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: 'url(https://customer-assets-4nw71qhi.emergentagent.net/job_c7a5e226-fc31-497c-bd5e-320bedc19cc3/artifacts/bn79a0oy_IMG_20260729_162355_183.png)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <motion.div
                initial={{ x: 0 }}
                whileHover={{ x: 10 }}
                className="flex items-center gap-3"
              >
                <Zap className="w-8 h-8" />
                <h3 className="font-['Anton'] text-4xl tracking-wide">{t('home_tshirts')}</h3>
              </motion.div>
              <p className="mt-4 text-white/80">{t('home_tshirts_desc')}</p>
            </div>
          </motion.div>

          {/* CrossFit Card */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -10 }}
            onClick={() => navigate('/catalog?filter=crossfit')}
            className="group relative h-[500px] rounded-3xl overflow-hidden cursor-pointer bg-white"
          >
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800)' }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <motion.div
                initial={{ x: 0 }}
                whileHover={{ x: 10 }}
                className="flex items-center gap-3"
              >
                <Zap className="w-8 h-8" />
                <h3 className="font-['Anton'] text-4xl tracking-wide">{t('home_crossfit')}</h3>
              </motion.div>
              <p className="mt-4 text-white/80">{t('home_crossfit_desc')}</p>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <button
            onClick={() => navigate('/catalog')}
            className="group px-8 py-4 rounded-full border-2 border-black hover:bg-black hover:text-white transition-all duration-300 font-medium tracking-wide"
          >
            <span className="flex items-center gap-2">
              {t('all_catalog')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
        </motion.div>
      </div>
    </section>
  );
};

const Home = () => {
  return (
    <div className="bg-white">
      <Hero />
      <Marquee />
      <FeaturedProducts />
    </div>
  );
};

export default Home;