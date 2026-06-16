'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api/apiClient';
import { ArrowLeft, CalendarDays, Clock3, Tag, Eye, Sun, Moon } from 'lucide-react';
import SeoTags from '@/components/seo/SeoTags';

// Helper to extract YouTube ID from URL
const getYoutubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// Helper to parse line-by-line inline markdown-like formatting (bold, italic, links)
const renderFormattedText = (text, isDarkMode) => {
  if (!text) return '';
  
  const regex = /(\*\*.*?\*\*|\*.*?\*|\[.*?\]\(.*?\))/g;
  const matches = text.match(regex);
  
  if (!matches) {
    return text;
  }
  
  const parts = [];
  let lastIndex = 0;
  
  text.replace(regex, (match, offset) => {
    if (offset > lastIndex) {
      parts.push(text.substring(lastIndex, offset));
    }
    
    if (match.startsWith('**') && match.endsWith('**')) {
      const content = match.slice(2, -2);
      parts.push(
        <strong key={offset} className={`font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {content}
        </strong>
      );
    } else if (match.startsWith('*') && match.endsWith('*')) {
      const content = match.slice(1, -1);
      parts.push(
        <em key={offset} className={`italic ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
          {content}
        </em>
      );
    } else if (match.startsWith('[') && match.includes('](')) {
      const closeBracket = match.indexOf(']');
      const label = match.slice(1, closeBracket);
      const url = match.slice(closeBracket + 2, -1);
      parts.push(
        <a 
          key={offset} 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={`font-bold underline transition ${
            isDarkMode 
              ? 'text-violet-400 hover:text-violet-300' 
              : 'text-brand-primary hover:text-brand-secondary'
          }`}
        >
          {label}
        </a>
      );
    }
    
    lastIndex = offset + match.length;
    return match;
  });
  
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }
  
  return parts;
};

// Helper to parse FAQ lines into Q&A lists
const parseFaqItems = (text) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];
  let currentQ = null;
  let currentA = null;
  
  for (let line of lines) {
    if (line.startsWith('Q:') || line.startsWith('Q :')) {
      if (currentQ && currentA) {
        items.push({ q: currentQ, a: currentA });
      }
      currentQ = line.replace(/^Q\s*:\s*/i, '').trim();
      currentA = null;
    } else if (line.startsWith('A:') || line.startsWith('A :')) {
      currentA = line.replace(/^A\s*:\s*/i, '').trim();
    } else {
      if (currentA) {
        currentA += '\n' + line;
      } else if (currentQ) {
        currentQ += ' ' + line;
      }
    }
  }
  if (currentQ && currentA) {
    items.push({ q: currentQ, a: currentA });
  }
  return items;
};

// Parser to split markdown text into block components
const parseArticleBlocks = (content) => {
  if (!content) return [];
  
  const normalized = content.replace(/\r\n/g, '\n');
  const rawBlocks = normalized.split(/\n\n+/);
  const blocks = [];
  
  for (let rawBlock of rawBlocks) {
    const block = rawBlock.trim();
    if (!block) continue;
    
    // 1. YouTube embeds
    const ytMatch = block.match(/^\[youtube:\s*(.+?)\]$/i) || block.match(/^(https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(?:&\S*)?)$/i);
    if (ytMatch) {
      const videoId = ytMatch[2] || getYoutubeId(ytMatch[1]);
      if (videoId) {
        blocks.push({ type: 'youtube', videoId });
        continue;
      }
    }
    
    // 2. Images with captions: ![caption](url)
    const imgMatch = block.match(/^!\[(.*?)\]\((.*?)\)$/);
    if (imgMatch) {
      blocks.push({ type: 'image', caption: imgMatch[1], url: imgMatch[2] });
      continue;
    }
    
    // 3. Headings
    if (block.startsWith('### ')) {
      blocks.push({ type: 'h3', text: block.slice(4).trim() });
      continue;
    }
    if (block.startsWith('## ')) {
      blocks.push({ type: 'h2', text: block.slice(3).trim() });
      continue;
    }
    if (block.startsWith('# ')) {
      blocks.push({ type: 'h1', text: block.slice(2).trim() });
      continue;
    }
    
    // 4. Tables: Lines beginning/ending with pipe
    if (block.startsWith('|')) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length >= 2) {
        const headers = lines[0].replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
        const hasDelimiter = lines[1] && lines[1].includes('-');
        const dataStartIdx = hasDelimiter ? 2 : 1;
        
        const rows = [];
        for (let i = dataStartIdx; i < lines.length; i++) {
          const cells = lines[i].replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim());
          rows.push(cells);
        }
        blocks.push({ type: 'table', headers, rows });
        continue;
      }
    }
    
    // 5. Bullet Lists
    if (block.startsWith('* ') || block.startsWith('- ')) {
      const items = block.split('\n').map(line => {
        const clean = line.trim();
        if (clean.startsWith('* ')) return clean.slice(2);
        if (clean.startsWith('- ')) return clean.slice(2);
        return clean;
      }).filter(Boolean);
      blocks.push({ type: 'bullet-list', items });
      continue;
    }
    
    // 6. Numbered Lists
    if (/^\d+\.\s/.test(block)) {
      const items = block.split('\n').map(line => {
        return line.replace(/^\d+\.\s+/, '').trim();
      }).filter(Boolean);
      blocks.push({ type: 'number-list', items });
      continue;
    }
    
    // 7. FAQ Block: [FAQ] ... [/FAQ]
    if (block.startsWith('[FAQ]') && block.endsWith('[/FAQ]')) {
      const faqText = block.slice(5, -6).trim();
      const faqItems = parseFaqItems(faqText);
      blocks.push({ type: 'faq', items: faqItems });
      continue;
    }
    
    // 8. Auto-detect Q&A pattern in block
    if (block.includes('\nQ:') || block.startsWith('Q:')) {
      const faqItems = parseFaqItems(block);
      if (faqItems.length > 0) {
        blocks.push({ type: 'faq', items: faqItems });
        continue;
      }
    }
    
    // 9. Standard Paragraphs
    blocks.push({ type: 'paragraph', text: block });
  }
  return blocks;
};

// Component-based Block Renderer
const renderBlock = (block, index, isDarkMode) => {
  switch (block.type) {
    case 'h1':
      return (
        <h1 key={index} className={`text-3xl sm:text-4xl font-serif font-black mt-8 mb-4 leading-tight tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
          {renderFormattedText(block.text, isDarkMode)}
        </h1>
      );
    case 'h2':
      return (
        <h2 key={index} className={`text-2xl sm:text-3xl font-serif font-bold mt-10 mb-5 pb-2 border-b leading-tight tracking-tight ${
          isDarkMode ? 'text-white border-white/10' : 'text-slate-900 border-slate-100'
        }`}>
          {renderFormattedText(block.text, isDarkMode)}
        </h2>
      );
    case 'h3':
      return (
        <h3 key={index} className={`text-xl sm:text-2xl font-serif font-semibold mt-8 mb-4 leading-snug ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
          {renderFormattedText(block.text, isDarkMode)}
        </h3>
      );
    case 'youtube':
      return (
        <div key={index} className={`my-8 aspect-video w-full rounded-2xl overflow-hidden shadow-xl border ${
          isDarkMode ? 'border-white/5 shadow-black/50' : 'border-slate-200 shadow-slate-200/50'
        }`}>
          <iframe
            src={`https://www.youtube.com/embed/${block.videoId}`}
            title="YouTube video player"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    case 'image':
      return (
        <div key={index} className="my-8 flex flex-col items-center">
          <img src={block.url} alt={block.caption || 'Article image'} className={`rounded-2xl w-full object-cover shadow-lg max-h-[520px] border ${
            isDarkMode ? 'border-white/5' : 'border-slate-100'
          }`} />
          {block.caption && (
            <p className={`mt-3 text-xs sm:text-sm italic font-medium text-center px-4 leading-relaxed ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}>
              {block.caption}
            </p>
          )}
        </div>
      );
    case 'bullet-list':
      return (
        <ul key={index} className="list-none my-6 pl-2 space-y-3.5">
          {block.items.map((item, idx) => (
            <li key={idx} className={`flex items-start gap-3 leading-relaxed text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="w-2.5 h-2.5 rounded-full mt-2 shrink-0 bg-brand-primary" />
              <span className="flex-1">{renderFormattedText(item, isDarkMode)}</span>
            </li>
          ))}
        </ul>
      );
    case 'number-list':
      return (
        <ol key={index} className="list-none my-6 pl-2 space-y-3.5">
          {block.items.map((item, idx) => (
            <li key={idx} className={`flex items-start gap-3 leading-relaxed text-base ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              <span className="font-extrabold text-brand-primary shrink-0 min-w-[1.25rem] text-right">{idx + 1}.</span>
              <span className="flex-1">{renderFormattedText(item, isDarkMode)}</span>
            </li>
          ))}
        </ol>
      );
    case 'table':
      return (
        <div key={index} className={`my-8 overflow-x-auto rounded-2xl border shadow-md ${
          isDarkMode ? 'border-white/5 bg-white/[0.01]' : 'border-slate-200 bg-white'
        }`}>
          <table className={`min-w-full divide-y text-left text-sm ${
            isDarkMode ? 'divide-white/5 text-slate-300' : 'divide-slate-200 text-slate-700'
          }`}>
            <thead className={`${isDarkMode ? 'bg-white/[0.03] text-slate-400' : 'bg-slate-50 text-slate-500'} text-[11px] uppercase tracking-wider font-extrabold`}>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} className="px-6 py-4 font-black">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-white/[0.02]' : 'divide-slate-100'}`}>
              {block.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className={`transition ${isDarkMode ? 'hover:bg-white/[0.01]' : 'hover:bg-slate-50/50'}`}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="px-6 py-4 font-medium">{renderFormattedText(cell, isDarkMode)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'faq':
      return (
        <div key={index} className="my-8 space-y-4">
          {block.items.map((item, idx) => (
            <div key={idx} className={`border rounded-2xl p-5 hover:border-brand-primary/30 transition duration-300 ${
              isDarkMode 
                ? 'border-white/5 bg-white/[0.02] shadow-black/30' 
                : 'border-slate-200/80 bg-slate-50/40 shadow-slate-100/50 shadow-sm'
            }`}>
              <h4 className={`text-base sm:text-lg font-bold flex items-start gap-2.5 leading-snug ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}>
                <span className="text-brand-primary text-xl font-black shrink-0 leading-none">Q.</span>
                <span>{renderFormattedText(item.q, isDarkMode)}</span>
              </h4>
              <div className={`mt-3 text-sm sm:text-base pl-7 leading-relaxed space-y-2 ${
                isDarkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                {item.a.split('\n').map((para, pIdx) => (
                  <p key={pIdx}>{renderFormattedText(para, isDarkMode)}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case 'paragraph':
    default:
      return (
        <p key={index} className={`leading-relaxed text-base sm:text-lg mb-6 text-justify ${
          isDarkMode ? 'text-slate-300' : 'text-slate-700'
        }`}>
          {renderFormattedText(block.text, isDarkMode)}
        </p>
      );
  }
};

export default function ArticleDetail({ initialData }) {
  const { slug } = useParams();
  const [theme, setTheme] = useState('light');

  const { data, isLoading, error } = useQuery({
    queryKey: ['articleDetail', slug],
    queryFn: async () => {
      const res = await apiClient.get(`/api/articles/${slug}`);
      return res.data;
    },
    initialData
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center text-brand-primary">
        Loading article...
      </div>
    );
  }

  if (error || !data?.article) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white">Article not found</h1>
          <Link href="/articles" className="mt-4 inline-flex px-4 py-2 rounded-xl bg-brand-primary text-white text-xs font-bold">
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  const { article, related = [] } = data;
  const parsedBlocks = parseArticleBlocks(article.content || '');

  return (
    <div className="min-h-screen bg-transparent pb-16">
      <SeoTags
        title={article.metaTitle || `${article.title} | KSubZone Articles`}
        description={article.metaDescription || article.excerpt}
        keywords={article.seoKeywords || article.tags || []}
        canonical={`https://ksubzone.com/articles/${article.slug}`}
        image={article.coverImage}
      />

      <article>
        <section className="relative min-h-[70vh] lg:min-h-[75vh] overflow-hidden flex items-end border-b border-white/5">
          <img src={article.coverImage || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1800&auto=format&fit=crop'} alt={article.title} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-luxury-950 via-luxury-950/75 to-black/40" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-12 pt-32 text-left">
            <Link href="/articles" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white mb-6">
              <ArrowLeft className="w-4 h-4" /> Back to Articles
            </Link>
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <span className="rounded-full bg-brand-primary/20 border border-brand-primary/40 px-3 py-1 text-brand-primary">{article.category}</span>
              <span className="text-slate-300 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString() : 'Draft'}</span>
              <span className="text-slate-300 flex items-center gap-1.5"><Clock3 className="w-3.5 h-3.5" /> {article.readTime || 5} min read</span>
              {article.viewCount !== undefined && (
                <span className="text-slate-300 flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {article.viewCount} Views</span>
              )}
            </div>
            <h1 className="mt-5 text-4xl sm:text-6xl font-black text-white leading-tight">{article.title}</h1>
            {article.excerpt && <p className="mt-5 text-base sm:text-lg text-slate-200 leading-8">{article.excerpt}</p>}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 text-left">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex flex-wrap gap-2">
              {(article.tags || []).map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                  <Tag className="w-3 h-3 text-brand-primary" /> {tag}
                </span>
              ))}
            </div>

            <button
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition border bg-white/[0.03] border-white/10 text-slate-300 hover:text-white hover:bg-white/[0.08]"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-violet-400" /> Dark Reader
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> Light Reader
                </>
              )}
            </button>
          </div>

          <div className={`rounded-[2rem] shadow-2xl p-6 sm:p-12 border transition-all duration-300 ${
            theme === 'light' 
              ? 'bg-white border-slate-100 text-slate-800' 
              : 'bg-white/[0.02] border-white/5 text-slate-300'
          }`}>
            <div className="max-w-none">
              {parsedBlocks.map((block, index) => renderBlock(block, index, theme === 'dark'))}
            </div>
          </div>

          {related.length > 0 && (
            <div className="mt-12 border-t border-white/5 pt-8">
              <h2 className="text-xl font-black text-white mb-4">Related Articles</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map((item) => (
                  <Link key={item._id} href={`/articles/${item.slug}`} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-brand-primary/40 transition">
                    <img src={item.coverImage || article.coverImage} alt={item.title} className="h-28 w-full object-cover" />
                    <div className="p-4">
                      <p className="text-xs font-black text-white line-clamp-2">{item.title}</p>
                      <p className="mt-2 text-[10px] text-brand-primary font-bold uppercase tracking-wider">{item.category}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </article>
    </div>
  );
}
