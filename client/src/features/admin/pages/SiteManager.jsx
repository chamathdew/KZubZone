'use client';

import React, { useEffect, useMemo, useState } from 'react';
import apiClient from '@/services/api/apiClient';
import {
  CheckCircle, ExternalLink, Globe2, Image, Link as LinkIcon, ListPlus,
  Palette, RotateCcw, Save, Search, Settings, Trash2, Type, Bot, ShieldAlert
} from 'lucide-react';
import AdminSidebar from '@/features/admin/components/AdminSidebar';
import { defaultSiteContent, mergeSiteContent } from '@/config/siteContent';
import { useSiteContent } from '@/hooks/useSiteContent';
import { resolveLogoUrl } from '@/utils/mediaImages';

const sections = [
  { id: 'brand', label: 'Brand', icon: Palette },
  { id: 'seo', label: 'SEO', icon: Search },
  { id: 'navigation', label: 'Navigation', icon: LinkIcon },
  { id: 'home', label: 'Home Text', icon: Type },
  { id: 'footer', label: 'Footer', icon: Globe2 },
  { id: 'ai', label: 'AI Features', icon: Bot },
  { id: 'system', label: 'System', icon: ShieldAlert },
  { id: 'advanced', label: 'Advanced JSON', icon: Settings }
];

const textFields = {
  brand: [
    ['siteName', 'Site Name'],
    ['shortName', 'Short Name'],
    ['tagline', 'Tagline'],
    ['logoText', 'Logo Text'],
    ['logoUrl', 'Logo Image URL'],
    ['faviconUrl', 'Favicon URL'],
    ['primaryUrl', 'Main Site URL']
  ],
  seo: [
    ['homeTitle', 'Homepage Meta Title'],
    ['homeDescription', 'Homepage Meta Description', 'textarea'],
    ['keywords', 'SEO Keywords', 'textarea'],
    ['ogImage', 'Open Graph Image URL']
  ],
  home: [
    ['catalogTitle', 'Catalog Section Title'],
    ['catalogDescription', 'Catalog Section Description', 'textarea'],
    ['emptyTitle', 'Empty State Title'],
    ['emptyDescription', 'Empty State Description', 'textarea'],
    ['subtitleTitle', 'Subtitle Block Title'],
    ['subtitleEmpty', 'Subtitle Empty Text', 'textarea'],
    ['newsletterTitle', 'Newsletter Title'],
    ['newsletterDescription', 'Newsletter Description', 'textarea'],
    ['newsletterPlaceholder', 'Newsletter Input Placeholder'],
    ['newsletterButton', 'Newsletter Button Text']
  ],
  footer: [
    ['description', 'Footer Description', 'textarea'],
    ['quickLinksTitle', 'Quick Links Heading'],
    ['contactTitle', 'Contact Heading'],
    ['contactText', 'Contact Text', 'textarea'],
    ['email', 'Contact Email'],
    ['requestText', 'Request Link Text'],
    ['followTitle', 'Social Heading'],
    ['newsletterPlaceholder', 'Footer Email Placeholder'],
    ['copyrightSuffix', 'Copyright Text'],
    ['bottomText', 'Bottom Line Text', 'textarea']
  ],
  navigation: [
    ['searchPlaceholder', 'Search Placeholder'],
    ['signInLabel', 'Sign In Label'],
    ['adminLabel', 'Admin Label']
  ],
  ai: [
    ['enableChatbot', 'Enable AI Chatbot Widget', 'checkbox'],
    ['enableSmartSearch', 'Enable AI Smart Search', 'checkbox'],
    ['enableTranslation', 'Enable AI Subtitle Translation', 'checkbox']
  ],
  system: [
    ['maintenanceMode', 'Maintenance Mode Enabled', 'checkbox'],
    ['maintenanceMessage', 'Maintenance Screen Message', 'textarea']
  ]
};

const arrayFields = {
  navigation: [{ key: 'links', title: 'Navbar Links', columns: ['label', 'url'] }],
  footer: [
    { key: 'links', title: 'Footer Links', columns: ['label', 'url'] },
    { key: 'socials', title: 'Social URLs', columns: ['label', 'url'] },
    { key: 'badges', title: 'Footer Badges', columns: ['value'] },
    { key: 'featureLabels', title: 'Footer Feature Labels', columns: ['value'] }
  ]
};

export default function SiteManager() {
  const { refreshSiteContent } = useSiteContent();
  const [activeSection, setActiveSection] = useState('brand');
  const [draft, setDraft] = useState(defaultSiteContent);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [jsonDraft, setJsonDraft] = useState('');

  useEffect(() => {
    const loadContent = async () => {
      try {
        const res = await apiClient.get('/api/admin/site-content');
        const mergedContent = mergeSiteContent(defaultSiteContent, res.data || {});
        setDraft(mergedContent);
        setJsonDraft(JSON.stringify(mergedContent, null, 2));
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load site builder settings.');
      } finally {
        setLoading(false);
      }
    };
    loadContent();
  }, []);

  const updateField = (section, key, value) => {
    setDraft((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  useEffect(() => {
    if (activeSection !== 'advanced') return;
    setJsonDraft(JSON.stringify(draft, null, 2));
  }, [activeSection]);

  const updateArrayItem = (section, key, index, field, value) => {
    setDraft((prev) => {
      const nextItems = [...(prev[section]?.[key] || [])];
      if (field === 'value') {
        nextItems[index] = value;
      } else {
        nextItems[index] = { ...(nextItems[index] || {}), [field]: value };
      }
      return { ...prev, [section]: { ...prev[section], [key]: nextItems } };
    });
  };

  const addArrayItem = (section, key, columns) => {
    setDraft((prev) => {
      const item = columns.includes('value') ? '' : columns.reduce((acc, col) => ({ ...acc, [col]: '' }), {});
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [key]: [...(prev[section]?.[key] || []), item]
        }
      };
    });
  };

  const removeArrayItem = (section, key, index) => {
    setDraft((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: (prev[section]?.[key] || []).filter((_, itemIndex) => itemIndex !== index)
      }
    }));
  };

  const saveContent = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      let contentToSave = draft;
      if (activeSection === 'advanced') {
        contentToSave = mergeSiteContent(defaultSiteContent, JSON.parse(jsonDraft));
        setDraft(contentToSave);
      }

      const res = await apiClient.put('/api/admin/site-content', contentToSave);
      setDraft(mergeSiteContent(defaultSiteContent, res.data.content || draft));
      await refreshSiteContent();
      setSuccess('Site builder saved. Public website content updated.');
    } catch (err) {
      setError(err instanceof SyntaxError ? 'Advanced JSON has invalid formatting.' : err.response?.data?.message || 'Failed to save site builder settings.');
    } finally {
      setSaving(false);
    }
  };

  const resetSection = () => {
    setDraft((prev) => ({ ...prev, [activeSection]: defaultSiteContent[activeSection] }));
  };

  const activeFields = textFields[activeSection] || [];
  const activeArrays = arrayFields[activeSection] || [];
  const brand = draft.brand || {};

  return (
    <div className="min-h-screen bg-luxury-950 text-slate-100 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-brand-primary mb-2">Full Site Builder</p>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">Edit Every Public Site Label</h1>
              <p className="text-slate-400 text-xs mt-1 max-w-2xl">
                Control logo, site names, SEO, URLs, navbar links, homepage wording, footer text, socials, and repeated UI labels from one admin screen.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="h-10 px-4 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-slate-200 hover:bg-white/[0.07] flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" /> Preview Site
              </a>
              <button
                type="button"
                onClick={resetSection}
                className="h-10 px-4 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-slate-200 hover:bg-white/[0.07] flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Reset Section
              </button>
              <button
                type="button"
                onClick={saveContent}
                disabled={saving || loading}
                className="h-10 px-5 rounded-xl bg-brand-primary text-xs font-black uppercase tracking-wider text-white hover:bg-brand-primary/85 disabled:opacity-60 flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Website'}
              </button>
            </div>
          </div>

          {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>}
          {success && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {success}
            </div>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-[220px_minmax(0,1fr)_300px] gap-6">
            <aside className="rounded-2xl border border-white/5 bg-luxury-900 p-3 h-fit grid grid-cols-2 sm:grid-cols-4 xl:flex xl:flex-col gap-2 xl:gap-0 xl:space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                const active = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full h-11 px-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-3 transition ${
                      active ? 'bg-brand-primary text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {section.label}
                  </button>
                );
              })}
            </aside>

            <section className="rounded-2xl border border-white/5 bg-luxury-900 p-5 sm:p-6">
              {loading ? (
                <div className="py-16 text-center text-sm text-slate-500">Loading site builder...</div>
              ) : (
                <div className="space-y-6">
                  {activeSection === 'advanced' ? (
                    <label>
                      <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">Complete Site Content JSON</span>
                      <textarea
                        rows={26}
                        value={jsonDraft}
                        onChange={(event) => setJsonDraft(event.target.value)}
                        spellCheck={false}
                        className="w-full rounded-xl border border-white/10 bg-luxury-950 px-3 py-3 font-mono text-xs leading-5 text-slate-100 outline-none focus:border-brand-primary"
                      />
                    </label>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeFields.map(([key, label, type]) => (
                        <label key={key} className={type === 'textarea' ? 'md:col-span-2' : ''}>
                          <span className="mb-1.5 block text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span>
                          {type === 'textarea' ? (
                            <textarea
                              rows={4}
                              value={draft[activeSection]?.[key] || ''}
                              onChange={(event) => updateField(activeSection, key, event.target.value)}
                              className="w-full rounded-xl border border-white/10 bg-luxury-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-brand-primary"
                            />
                          ) : type === 'checkbox' ? (
                            <div className="flex items-center h-10">
                              <input
                                type="checkbox"
                                checked={!!draft[activeSection]?.[key]}
                                onChange={(event) => updateField(activeSection, key, event.target.checked)}
                                className="w-5 h-5 rounded border-white/10 bg-luxury-950 text-brand-primary focus:ring-brand-primary focus:ring-offset-luxury-950 cursor-pointer"
                              />
                              <span className="ml-2.5 text-sm text-slate-300">Enabled</span>
                            </div>
                          ) : (
                            <input
                              type="text"
                              value={draft[activeSection]?.[key] || ''}
                              onChange={(event) => updateField(activeSection, key, event.target.value)}
                              className="w-full h-10 rounded-xl border border-white/10 bg-luxury-950 px-3 text-sm text-slate-100 outline-none focus:border-brand-primary"
                            />
                          )}
                        </label>
                      ))}
                    </div>
                  )}

                  {activeArrays.map((group) => (
                    <div key={group.key} className="rounded-2xl border border-white/5 bg-luxury-950/60 p-4">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <h3 className="text-xs font-black uppercase tracking-wider text-white">{group.title}</h3>
                        <button
                          type="button"
                          onClick={() => addArrayItem(activeSection, group.key, group.columns)}
                          className="h-8 px-3 rounded-lg bg-white/5 border border-white/10 text-[10px] font-bold text-slate-200 hover:bg-white/10 flex items-center gap-1.5"
                        >
                          <ListPlus className="w-3.5 h-3.5" /> Add
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(draft[activeSection]?.[group.key] || []).map((item, index) => (
                          <div key={`${group.key}-${index}`} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_36px] gap-2">
                            {group.columns.map((column) => (
                              <input
                                key={column}
                                type="text"
                                placeholder={column === 'value' ? 'Text' : column}
                                value={column === 'value' ? item : item?.[column] || ''}
                                onChange={(event) => updateArrayItem(activeSection, group.key, index, column, event.target.value)}
                                className={`${group.columns.length === 1 ? 'sm:col-span-2' : ''} h-10 rounded-xl border border-white/10 bg-luxury-900 px-3 text-xs text-slate-100 outline-none focus:border-brand-primary`}
                              />
                            ))}
                            <button
                              type="button"
                              onClick={() => removeArrayItem(activeSection, group.key, index)}
                              className="h-10 rounded-xl border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20 flex items-center justify-center"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <aside className="rounded-2xl border border-white/5 bg-luxury-900 p-5 h-fit space-y-5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Settings className="w-4 h-4 text-brand-accent" /> Live Brand Preview
                </h3>
                <p className="mt-1 text-[11px] leading-5 text-slate-500">This mirrors the public navbar and footer brand state after saving.</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-luxury-950 p-4">
                <div className="flex items-center gap-3">
                  {brand.logoUrl ? (
                    <img src={resolveLogoUrl(brand.logoUrl)} alt={brand.siteName || 'Logo'} className="h-12 w-auto object-contain" />
                  ) : (
                    <span className="h-12 w-12 rounded-xl bg-brand-primary/15 border border-brand-primary/25 flex items-center justify-center">
                      <Image className="w-5 h-5 text-brand-primary" />
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-lg font-black text-white">{brand.logoText || brand.siteName}</p>
                    <p className="truncate text-xs text-slate-400">{brand.tagline}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-400">
                <p><span className="text-slate-500">Site:</span> {brand.siteName}</p>
                <p><span className="text-slate-500">URL:</span> {brand.primaryUrl}</p>
                <p><span className="text-slate-500">Nav Links:</span> {(draft.navigation?.links || []).length}</p>
                <p><span className="text-slate-500">Footer Links:</span> {(draft.footer?.links || []).length}</p>
                <p>
                  <span className="text-slate-500">Maintenance:</span>{' '}
                  {draft.system?.maintenanceMode ? (
                    <span className="text-red-400 font-bold uppercase">Active</span>
                  ) : (
                    <span className="text-emerald-400 font-bold uppercase">Disabled</span>
                  )}
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}
