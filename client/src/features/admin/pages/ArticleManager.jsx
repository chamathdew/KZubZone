'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/services/api/apiClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import AdminSidebar from '@/features/admin/components/AdminSidebar';
import {
  BookOpenText, Database, Edit3, Eye, Film, Languages, LayoutDashboard,
  Plus, Save, Settings, Star, Trash2, Tv, Users, X
} from 'lucide-react';

const emptyForm = {
  title: '',
  excerpt: '',
  content: '',
  category: 'Guide',
  coverImage: '',
  authorName: 'KSubZone Editorial',
  readTime: 5,
  status: 'Draft',
  isFeatured: false,
  tags: '',
  relatedMediaTitle: '',
  metaTitle: '',
  metaDescription: '',
  seoKeywords: ''
};

const tokenHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('kd_admin_token')}` }
});

export default function ArticleManager() {
  const { admin } = useAuth();
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchArticles = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await apiClient.get('/api/admin/articles', tokenHeaders());
      setArticles(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load articles');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const openCreate = () => {
    setEditingArticle(null);
    setForm(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEdit = (article) => {
    setEditingArticle(article);
    setForm({
      title: article.title || '',
      excerpt: article.excerpt || '',
      content: article.content || '',
      category: article.category || 'Guide',
      coverImage: article.coverImage || '',
      authorName: article.authorName || 'KSubZone Editorial',
      readTime: article.readTime || 5,
      status: article.status || 'Draft',
      isFeatured: Boolean(article.isFeatured),
      tags: (article.tags || []).join(', '),
      relatedMediaTitle: article.relatedMediaTitle || '',
      metaTitle: article.metaTitle || '',
      metaDescription: article.metaDescription || '',
      seoKeywords: (article.seoKeywords || []).join(', ')
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (editingArticle) {
        await apiClient.put(`/api/admin/articles/${editingArticle._id}`, form, tokenHeaders());
      } else {
        await apiClient.post('/api/admin/articles', form, tokenHeaders());
      }
      setShowModal(false);
      fetchArticles(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`Delete article "${article.title}"?`)) return;
    try {
      await apiClient.delete(`/api/admin/articles/${article._id}`, tokenHeaders());
      fetchArticles(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-luxury-950 text-slate-100 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">Manage Articles</h1>
              <p className="text-slate-400 text-xs mt-1">Create, edit, draft, publish, feature and SEO-control KSubZone articles.</p>
            </div>
            <button
              onClick={openCreate}
              className="px-4 py-2.5 bg-brand-primary hover:bg-opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" /> Write Article
            </button>
          </div>

          {error && <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-300">{error}</div>}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-2xl border border-white/5 bg-luxury-900 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total</p>
              <p className="mt-1 text-2xl font-black">{articles.length}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-luxury-900 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Published</p>
              <p className="mt-1 text-2xl font-black text-emerald-400">{articles.filter(a => a.status === 'Published').length}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-luxury-900 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Drafts</p>
              <p className="mt-1 text-2xl font-black text-yellow-400">{articles.filter(a => a.status === 'Draft').length}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-luxury-900 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Featured</p>
              <p className="mt-1 text-2xl font-black text-brand-primary">{articles.filter(a => a.isFeatured).length}</p>
            </div>
          </div>

          <div className="bg-luxury-900 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            {loading ? (
              <div className="text-center py-16 text-slate-500">Loading articles...</div>
            ) : articles.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">No articles yet. Start by writing your first post.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-[10px] uppercase font-bold tracking-widest text-slate-400 bg-luxury-950/30">
                      <th className="p-4">Article</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Views</th>
                      <th className="p-4">Updated</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-xs text-slate-300">
                    {articles.map((article) => (
                      <tr key={article._id} className="hover:bg-white/5 transition">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={article.coverImage || 'https://placehold.co/80x50/111/fff?text=Article'} alt={article.title} className="w-16 h-10 object-cover rounded-lg bg-luxury-950 border border-white/5" />
                            <div>
                              <p className="font-extrabold text-slate-100 text-sm line-clamp-1">{article.title}</p>
                              <p className="text-[10px] text-slate-500 line-clamp-1">{article.excerpt || article.slug}</p>
                              {article.isFeatured && <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[9px] font-bold uppercase">Featured</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-bold">{article.category}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            article.status === 'Published' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                          }`}>
                            {article.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono">{article.viewCount || 0}</td>
                        <td className="p-4 text-slate-400">{article.updatedAt ? new Date(article.updatedAt).toLocaleDateString() : 'N/A'}</td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            {article.status === 'Published' && (
                              <Link href={`/articles/${article.slug}`} className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded transition" title="View Article">
                                <Eye className="w-3.5 h-3.5" />
                              </Link>
                            )}
                            <button onClick={() => openEdit(article)} className="p-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded transition" title="Edit Article">
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(article)} className="p-1.5 bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-secondary rounded transition" title="Delete Article">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-luxury-900 border border-white/10 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 relative">
            <button onClick={() => setShowModal(false)} className="absolute right-4 top-4 p-1 hover:bg-white/5 rounded text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
              <BookOpenText className="w-5 h-5 text-brand-primary" />
              {editingArticle ? 'Edit Article' : 'Write New Article'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Title</label>
                  <input required value={form.title} onChange={(e) => updateField('title', e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Category</label>
                  <input value={form.category} onChange={(e) => updateField('category', e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary" />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Short Excerpt</label>
                <textarea rows="2" value={form.excerpt} onChange={(e) => updateField('excerpt', e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary leading-relaxed" />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Article Body</label>
                <textarea required rows="12" value={form.content} onChange={(e) => updateField('content', e.target.value)} placeholder="Write the full article here. Use blank lines to separate paragraphs." className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary leading-relaxed" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Cover Image URL</label>
                  <input value={form.coverImage} onChange={(e) => updateField('coverImage', e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Read Time (mins)</label>
                  <input type="number" min="1" value={form.readTime} onChange={(e) => updateField('readTime', e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Author</label>
                  <input value={form.authorName} onChange={(e) => updateField('authorName', e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Related Media Title</label>
                  <input value={form.relatedMediaTitle} onChange={(e) => updateField('relatedMediaTitle', e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => updateField('status', e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary">
                    <option value="Draft">Draft</option>
                    <option value="Published">Published</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Tags (comma separated)</label>
                  <input value={form.tags} onChange={(e) => updateField('tags', e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">SEO Keywords (comma separated)</label>
                  <input value={form.seoKeywords} onChange={(e) => updateField('seoKeywords', e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Meta Title</label>
                  <input value={form.metaTitle} onChange={(e) => updateField('metaTitle', e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Meta Description</label>
                  <input value={form.metaDescription} onChange={(e) => updateField('metaDescription', e.target.value)} className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary" />
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-slate-300">
                <input type="checkbox" checked={form.isFeatured} onChange={(e) => updateField('isFeatured', e.target.checked)} className="w-4 h-4 accent-brand-primary" />
                Feature this article on the public articles page
              </label>

              <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-slate-300 transition">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-brand-primary hover:bg-opacity-95 text-white font-bold rounded-xl text-xs transition flex items-center gap-2">
                  <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
