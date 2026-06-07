import React, { createContext, useEffect, useMemo, useState } from 'react';
import apiClient from '../services/api/apiClient';
import { defaultSiteContent, mergeSiteContent } from '../config/siteContent';

export const SiteContentContext = createContext({
  content: defaultSiteContent,
  loading: true,
  refreshSiteContent: () => {}
});

export const SiteContentProvider = ({ children }) => {
  const [content, setContent] = useState(defaultSiteContent);
  const [loading, setLoading] = useState(true);

  const refreshSiteContent = async () => {
    try {
      const res = await apiClient.get('/api/site-content');
      setContent(mergeSiteContent(defaultSiteContent, res.data || {}));
    } catch (error) {
      setContent(defaultSiteContent);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSiteContent();
  }, []);

  useEffect(() => {
    const faviconUrl = content?.brand?.faviconUrl || content?.brand?.logoUrl;
    if (!faviconUrl) return;
    let icon = document.querySelector('link[rel="icon"]');
    if (!icon) {
      icon = document.createElement('link');
      icon.setAttribute('rel', 'icon');
      document.head.appendChild(icon);
    }
    icon.setAttribute('href', faviconUrl);
  }, [content?.brand?.faviconUrl, content?.brand?.logoUrl]);

  const value = useMemo(() => ({ content, loading, refreshSiteContent }), [content, loading]);

  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
};
