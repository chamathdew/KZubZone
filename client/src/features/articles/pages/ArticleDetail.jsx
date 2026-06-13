'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api/apiClient';
import { ArrowLeft, CalendarDays, Clock3, Tag } from 'lucide-react';
import SeoTags from '@/components/seo/SeoTags';

export default function ArticleDetail({ initialData }) {
  const { slug } = useParams();

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
  const paragraphs = (article.content || '').split(/\n{2,}/).map(part => part.trim()).filter(Boolean);

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
            </div>
            <h1 className="mt-5 text-4xl sm:text-6xl font-black text-white leading-tight">{article.title}</h1>
            {article.excerpt && <p className="mt-5 text-base sm:text-lg text-slate-200 leading-8">{article.excerpt}</p>}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 text-left">
          <div className="flex flex-wrap gap-2 mb-8">
            {(article.tags || []).map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-300">
                <Tag className="w-3 h-3 text-brand-primary" /> {tag}
              </span>
            ))}
          </div>

          <div className="prose prose-invert max-w-none">
            {paragraphs.map((paragraph, index) => (
              <p key={index} className="text-slate-300 leading-8 text-base mb-6">
                {paragraph}
              </p>
            ))}
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
