'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import apiClient from '@/services/api/apiClient';
import { useAuth } from '@/features/auth/hooks/useAuth';
import AdminSidebar from '@/features/admin/components/AdminSidebar';
import {
  BookOpenText, Database, Edit3, Eye, Film, Languages, LayoutDashboard,
  Plus, Save, Settings, Star, Trash2, Tv, Users, X, UploadCloud
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

const autoFormatText = (text) => {
  if (!text) return '';

  let lines = text.replace(/\r\n/g, '\n').split('\n');
  let formattedLines = [];
  let inFaqBlock = false;
  let faqBuffer = [];
  let inTableBlock = false;
  let tableBuffer = [];

  const flushFaq = () => {
    if (faqBuffer.length > 0) {
      formattedLines.push('[FAQ]');
      formattedLines.push(...faqBuffer);
      formattedLines.push('[/FAQ]');
      formattedLines.push('');
      faqBuffer = [];
    }
    inFaqBlock = false;
  };

  const flushTable = () => {
    if (tableBuffer.length > 0) {
      const headerRow = tableBuffer[0];
      const cols = headerRow.length;
      
      formattedLines.push('| ' + headerRow.join(' | ') + ' |');
      formattedLines.push('| ' + Array(cols).fill('---').join(' | ') + ' |');
      
      for (let i = 1; i < tableBuffer.length; i++) {
        formattedLines.push('| ' + tableBuffer[i].join(' | ') + ' |');
      }
      formattedLines.push('');
      tableBuffer = [];
    }
    inTableBlock = false;
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    // stand-alone youtube URL
    const ytMatch = line.match(/^(?:https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(?:&\S*)?)$/i);
    if (ytMatch) {
      flushFaq();
      flushTable();
      formattedLines.push(`[youtube: ${ytMatch[1]}]`);
      formattedLines.push('');
      continue;
    }

    // copy-pasted TSV table
    if (line.includes('\t')) {
      flushFaq();
      inTableBlock = true;
      const cells = line.split('\t').map(c => c.trim());
      tableBuffer.push(cells);
      continue;
    } else if (inTableBlock && !line.includes('\t')) {
      flushTable();
    }

    // question & answer detection
    const qMatch = line.match(/^(?:ප්‍රශ්නය|ප්‍රශ්න|Question|Q)\s*[:\.-]\s*(.+)$/i);
    const aMatch = line.match(/^(?:පිළිතුර|පිළිතුරු|Answer|A)\s*[:\.-]\s*(.+)$/i);

    if (qMatch) {
      inFaqBlock = true;
      faqBuffer.push(`Q: ${qMatch[1].trim()}`);
      continue;
    } else if (aMatch) {
      faqBuffer.push(`A: ${aMatch[1].trim()}`);
      continue;
    } else if (inFaqBlock && (line.startsWith('*') || line.startsWith('-') || line.startsWith('#') || line === '')) {
      flushFaq();
    } else if (inFaqBlock && faqBuffer.length > 0) {
      faqBuffer[faqBuffer.length - 1] += '\n' + line;
      continue;
    }

    // list items normalisation
    if (line.match(/^[•o\+\-]\s*(.+)$/)) {
      const bulletContent = line.replace(/^[•o\+\-]\s*/, '').trim();
      formattedLines.push(`* ${bulletContent}`);
      continue;
    }

    // headings auto-detection
    if (line.length > 0 && line.length < 80) {
      const isPlain = !line.startsWith('#') && !line.startsWith('*') && !line.startsWith('-') && !/^\d+\./.test(line) && !line.startsWith('|');
      const noPunctuation = !line.endsWith('.') && !line.endsWith('?') && !line.endsWith('!') && !line.endsWith(')');
      
      if (isPlain && noPunctuation) {
        formattedLines.push(`## ${line}`);
        formattedLines.push('');
        continue;
      }
    }

    formattedLines.push(line);
  }

  flushFaq();
  flushTable();

  let result = formattedLines.join('\n');
  result = result.replace(/\n{3,}/g, '\n\n');
  return result;
};

const htmlToMarkdown = (htmlText) => {
  if (typeof window === 'undefined') return { title: '', metaDescription: '', content: '', coverImage: '' };
  
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, 'text/html');

  // Extract Title
  let title = '';
  const titleTag = doc.querySelector('title');
  if (titleTag) title = titleTag.textContent.trim();
  if (!title) {
    const h1Tag = doc.querySelector('h1');
    if (h1Tag) title = h1Tag.textContent.trim();
  }

  // Extract Meta Description
  let metaDescription = '';
  const metaDescTag = doc.querySelector('meta[name="description"]');
  if (metaDescTag) metaDescription = metaDescTag.getAttribute('content') || '';

  // Extract First Image as Cover Image
  let coverImage = '';
  const firstImg = doc.querySelector('img');
  if (firstImg) {
    coverImage = firstImg.getAttribute('src') || '';
  }

  // Helper function to recursively walk node and build markdown
  const walk = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent.replace(/\u00a0/g, ' ');
    }
    
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }
    
    const tag = node.tagName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'head') {
      return '';
    }

    // Special handling for FAQPage schema section
    if (tag === 'section' && node.getAttribute('itemtype')?.includes('FAQPage')) {
      let faqText = '\n\n[FAQ]\n';
      const questions = node.querySelectorAll('[itemtype*="Question"]');
      questions.forEach(qNode => {
        const qNameNode = qNode.querySelector('[itemprop="name"]');
        const aTextNode = qNode.querySelector('[itemprop="text"]');
        if (qNameNode && aTextNode) {
          const qText = qNameNode.textContent.trim();
          const aText = convertInlineHtml(aTextNode);
          faqText += `Q: ${qText}\n`;
          faqText += `A: ${aText}\n`;
        }
      });
      faqText += '[/FAQ]\n\n';
      return faqText;
    }

    // Inline formatting tags
    if (tag === 'strong' || tag === 'b') {
      return `**${childNodesToMarkdown(node)}**`;
    }
    if (tag === 'em' || tag === 'i') {
      return `*${childNodesToMarkdown(node)}*`;
    }
    if (tag === 'code') {
      return `\`${node.textContent}\``;
    }
    if (tag === 'a') {
      const href = node.getAttribute('href') || '';
      return `[${childNodesToMarkdown(node)}](${href})`;
    }
    if (tag === 'span') {
      return childNodesToMarkdown(node);
    }
    
    // Images in body
    if (tag === 'img') {
      const src = node.getAttribute('src') || '';
      const alt = node.getAttribute('alt') || '';
      return `\n\n![${alt}](${src})\n\n`;
    }

    // YouTube embeds
    if (tag === 'iframe') {
      const src = node.getAttribute('src') || '';
      const ytMatch = src.match(/(?:embed\/|watch\?v=)([a-zA-Z0-9_-]+)/);
      if (ytMatch) {
        return `\n\n[youtube: ${ytMatch[1]}]\n\n`;
      }
    }

    // Headings
    if (/^h[1-6]$/.test(tag)) {
      const level = parseInt(tag.charAt(1));
      const hashes = level === 1 ? '##' : '#'.repeat(level);
      return `\n\n${hashes} ${node.textContent.trim()}\n\n`;
    }

    // Lists
    if (tag === 'ul') {
      let listItems = '';
      node.childNodes.forEach(li => {
        if (li.tagName && li.tagName.toLowerCase() === 'li') {
          listItems += `* ${childNodesToMarkdown(li).trim()}\n`;
        }
      });
      return `\n\n${listItems}\n\n`;
    }
    if (tag === 'ol') {
      let listItems = '';
      let index = 1;
      node.childNodes.forEach(li => {
        if (li.tagName && li.tagName.toLowerCase() === 'li') {
          listItems += `${index}. ${childNodesToMarkdown(li).trim()}\n`;
          index++;
        }
      });
      return `\n\n${listItems}\n\n`;
    }

    // Tables
    if (tag === 'table') {
      let tableMarkdown = '\n\n';
      const rows = Array.from(node.querySelectorAll('tr'));
      if (rows.length > 0) {
        let maxCols = 0;
        rows.forEach(row => {
          const cells = row.querySelectorAll('th, td');
          if (cells.length > maxCols) maxCols = cells.length;
        });
        
        rows.forEach((row, rowIndex) => {
          const cells = Array.from(row.querySelectorAll('th, td')).map(cell => {
            return convertInlineHtml(cell).trim().replace(/\|/g, '\\|');
          });
          
          while (cells.length < maxCols) {
            cells.push('');
          }
          
          tableMarkdown += `| ${cells.join(' | ')} |\n`;
          
          if (rowIndex === 0) {
            const separator = Array(maxCols).fill('---');
            tableMarkdown += `| ${separator.join(' | ')} |\n`;
          }
        });
      }
      return tableMarkdown + '\n';
    }

    // Paragraph / Div / Block containers
    if (tag === 'p' || tag === 'div' || tag === 'section' || tag === 'article' || tag === 'body') {
      const text = node.textContent.trim();
      const ytMatch = text.match(/^(?:https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(?:&\S*)?)$/i);
      if (ytMatch) {
        return `\n\n[youtube: ${ytMatch[1]}]\n\n`;
      }
      
      const content = childNodesToMarkdown(node).trim();
      return content ? `\n\n${content}\n\n` : '';
    }

    if (tag === 'br') {
      return '\n';
    }

    return childNodesToMarkdown(node);
  };

  const childNodesToMarkdown = (parentNode) => {
    let text = '';
    parentNode.childNodes.forEach(child => {
      text += walk(child);
    });
    return text;
  };

  const convertInlineHtml = (inlineElement) => {
    let text = '';
    inlineElement.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        text += child.textContent.replace(/\u00a0/g, ' ');
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const cTag = child.tagName.toLowerCase();
        if (cTag === 'strong' || cTag === 'b') {
          text += `**${convertInlineHtml(child)}**`;
        } else if (cTag === 'em' || cTag === 'i') {
          text += `*${convertInlineHtml(child)}*`;
        } else if (cTag === 'span') {
          text += convertInlineHtml(child);
        } else if (cTag === 'a') {
          text += `[${convertInlineHtml(child)}](${child.getAttribute('href') || ''})`;
        } else {
          text += convertInlineHtml(child);
        }
      }
    });
    return text;
  };

  const body = doc.body || doc;
  let markdown = walk(body);
  markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();

  return { title, metaDescription, content: markdown, coverImage };
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
  const [showAssistant, setShowAssistant] = useState(false);
  const [rawText, setRawText] = useState('');
  const [importedFileName, setImportedFileName] = useState('');
  const fileInputRef = useRef(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportedFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const ext = file.name.split('.').pop().toLowerCase();
      if (ext === 'html' || ext === 'htm') {
        const result = htmlToMarkdown(text);
        if (result.title) updateField('title', result.title);
        if (result.metaDescription) updateField('metaDescription', result.metaDescription);
        if (result.coverImage) updateField('coverImage', result.coverImage);
        if (result.content) updateField('content', result.content);

        setShowAssistant(false);
        setImportedFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        setRawText(text);
        setImportedFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

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
    setShowAssistant(false);
    setImportedFileName('');
    setRawText('');
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
    setShowAssistant(false);
    setImportedFileName('');
    setRawText('');
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

              {/* HTML / Text Import — Always Visible */}
              <div className="border border-brand-primary/20 bg-brand-primary/[0.04] rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <UploadCloud className="w-4 h-4 text-brand-primary" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Import HTML / Text File</h4>
                  <span className="ml-auto text-[9px] text-slate-500 font-bold uppercase tracking-wider">Supports .html · .htm · .txt</span>
                </div>
                <div
                  className="relative border-2 border-dashed border-brand-primary/25 hover:border-brand-primary/60 rounded-xl p-5 flex flex-col items-center justify-center bg-black/20 cursor-pointer transition-all duration-200 group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".html,.htm,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <UploadCloud className="w-9 h-9 text-brand-primary/60 group-hover:text-brand-primary mb-2 transition" />
                  {importedFileName ? (
                    <p className="text-xs text-emerald-400 font-bold">{importedFileName} — importing…</p>
                  ) : (
                    <>
                      <p className="text-xs text-slate-300 font-semibold">Click here to select a file</p>
                      <p className="text-[10px] text-slate-500 mt-1">HTML imports auto-fill title, cover image, meta, and body content</p>
                    </>
                  )}
                </div>
              </div>

              {/* Collapsible Paste Assistant */}
              <div className="border border-white/5 bg-luxury-950/40 rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">Text Paste Assistant</h4>
                    <p className="text-[10px] text-slate-500 mt-0.5">Auto-format headings, lists, tables, FAQs from raw text.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAssistant(!showAssistant)}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold uppercase tracking-wider transition text-brand-primary"
                  >
                    {showAssistant ? 'Hide' : 'Open'}
                  </button>
                </div>

                {showAssistant && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                    <div>
                      <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Paste Unformatted Draft Here</label>
                      <textarea
                        rows="6"
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder="Paste text from Google Docs, website articles, excel tables, or translators here. Headers, lists, tables, youtube videos, and FAQ lines will be auto-formatted."
                        className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary leading-relaxed"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2.5 justify-between items-center">
                      <button
                        type="button"
                        onClick={() => {
                          const formatted = autoFormatText(rawText);
                          updateField('content', formatted);
                          setShowAssistant(false);
                          setRawText('');
                        }}
                        className="px-4 py-2 bg-brand-primary hover:bg-opacity-90 rounded-xl text-xs font-bold uppercase tracking-wider transition text-white"
                      >
                        Auto-Format &amp; Paste into Article Body
                      </button>
                      <div className="text-[9px] text-slate-400 space-y-0.5 max-w-sm text-right bg-white/[0.02] p-2 rounded-lg border border-white/5">
                        <p className="font-extrabold uppercase text-brand-primary text-[8px]">💡 Formatting Cheat Sheet</p>
                        <p>Heading: Write on its own line (no trailing dot)</p>
                        <p>Bullets: Start lines with <code className="text-brand-primary font-mono">*</code> or <code className="text-brand-primary font-mono">-</code></p>
                        <p>Table: Paste Excel/Sheets cells directly (with tabs)</p>
                        <p>FAQ: Use lines starting with <code className="text-brand-primary font-mono">Q:</code> and <code className="text-brand-primary font-mono">A:</code></p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Article Body</label>
                <textarea required rows="12" value={form.content} onChange={(e) => updateField('content', e.target.value)} placeholder="Write the full article here. Use blank lines to separate paragraphs. Use markdown headers (##, ###), tables (|col|), and FAQ syntax (Q: and A:)." className="w-full px-3 py-2 bg-luxury-950 border border-white/10 rounded-xl text-slate-200 text-xs outline-none focus:border-brand-primary leading-relaxed" />
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
