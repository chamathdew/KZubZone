import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function FAQAccordion({ faqList = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);

  if (faqList.length === 0) return null;

  const toggleAccordion = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col gap-3">
      {faqList.map((item, index) => {
        const isOpen = activeIndex === index;

        return (
          <div
            key={index}
            className="glass-panel rounded-2xl border border-white/5 overflow-hidden transition-all duration-300 hover:border-brand-primary/20"
          >
            {/* Header Trigger */}
            <button
              onClick={() => toggleAccordion(index)}
              className="w-full px-5 py-4 flex items-center justify-between text-left gap-4 hover:bg-white/5 transition"
            >
              <span className="text-xs sm:text-sm font-semibold text-white">
                {item.question}
              </span>
              <motion.span
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-slate-400 flex-shrink-0"
              >
                <ChevronDown className="w-4 h-4" />
              </motion.span>
            </button>

            {/* Answer body */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-white/5 bg-luxury-900/50">
                    {item.answer}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
