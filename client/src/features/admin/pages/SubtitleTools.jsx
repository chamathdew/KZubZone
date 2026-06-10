'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import apiClient from '@/services/api/apiClient';
import AdminSidebar from '@/features/admin/components/AdminSidebar';
import {
  Languages, Sparkles, UploadCloud, Download, AlertTriangle, Play,
  CheckCircle, Plus, Trash2, Edit2, RefreshCw, Layers, ArrowRight, Check, Eye, Settings
} from 'lucide-react';

// Time Conversions
const timeToMs = (timeStr) => {
  if (!timeStr) return 0;
  const parts = timeStr.trim().replace(',', '.').split(':');
  if (parts.length < 3) return 0;
  const hrs = parseInt(parts[0], 10) * 3600000;
  const mins = parseInt(parts[1], 10) * 60000;
  const secsParts = parts[2].split('.');
  const secs = parseInt(secsParts[0], 10) * 1000;
  const ms = secsParts[1] ? parseInt(secsParts[1].padEnd(3, '0').slice(0, 3), 10) : 0;
  return hrs + mins + secs + ms;
};

const msToTime = (ms) => {
  const hrs = Math.floor(ms / 3600000);
  ms %= 3600000;
  const mins = Math.floor(ms / 60000);
  ms %= 60000;
  const secs = Math.floor(ms / 1000);
  const mss = ms % 1000;

  const pad = (n, l = 2) => String(n).padStart(l, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(mss, 3)}`;
};

// Robust SRT Parser
const parseSRT = (text) => {
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalizedText.split('\n\n');
  const subtitles = [];
  let sequence = 1;

  for (let block of blocks) {
    block = block.trim();
    if (!block) continue;
    
    const lines = block.split('\n');
    if (lines.length >= 2) {
      let timeIndex = 1;
      if (!lines[timeIndex]?.includes('-->') && lines[0]?.includes('-->')) {
        timeIndex = 0;
      }

      if (lines[timeIndex]?.includes('-->')) {
        const times = lines[timeIndex].split('-->').map(t => t.trim());
        const start = times[0];
        const end = times[1];
        const textLines = timeIndex === 1 ? lines.slice(2) : lines.slice(1);
        const subtitleText = textLines.join('\n').trim();
        subtitles.push({
          id: sequence++,
          start,
          end,
          text: subtitleText
        });
      }
    }
  }
  return subtitles;
};

// SRT Stringifier
const stringifySRT = (subs) => {
  return subs.map((sub, index) => {
    return `${index + 1}\n${sub.start} --> ${sub.end}\n${sub.text}`;
  }).join('\n\n') + '\n';
};

export default function SubtitleTools() {
  const { admin } = useAuth();
  const fileInputRef = useRef(null);

  // Subtitle States
  const [fileName, setFileName] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [subtitles, setSubtitles] = useState([]);
  const [processedSubs, setProcessedSubs] = useState([]);
  const [previewMode, setPreviewMode] = useState('blocks'); // 'blocks' | 'raw'
  const [editableSrtText, setEditableSrtText] = useState('');

  // Control Configs
  const [activeTab, setActiveTab] = useState('upload'); // 'upload', 'brand', 'translate', 'export'
  const [brandingText, setBrandingText] = useState(
    `<font color="#ffcc00">නවතම කොරියානු චිත්රපට සහා රූපවාහිනි කතාමාලා සඳහා සිංහල උපසිරැසි</font>\n<font color="#ff9416">ලබා ගෑනිමට පිවිසෙන්න </font>www.ksubzone.com <font color="#ff9416">අපගේ වෙබ් අඩවියට.</font></b>`
  );

  // Ad Inject Configs
  const [insertStart, setInsertStart] = useState(true);
  const [startTimeStart, setStartTimeStart] = useState('00:00:10,650');
  const [startTimeEnd, setStartTimeEnd] = useState('00:00:50,650');

  const [insertEnd, setInsertEnd] = useState(true);
  const [endDuration, setEndDuration] = useState(30); // in seconds

  const [insertGaps, setInsertGaps] = useState(true);
  const [minGapSeconds, setMinGapSeconds] = useState(45); // minimum gap size to inject ad
  const [detectedGaps, setDetectedGaps] = useState([]);
  const [selectedGaps, setSelectedGaps] = useState([]); // indices of gaps to inject

  // Competitor replacement list
  const [detectedCompetitors, setDetectedCompetitors] = useState([]);
  const [competitorActions, setCompetitorActions] = useState({}); // { subId: 'replace' | 'remove' | 'ignore' }

  // Translation States
  const [translationProgress, setTranslationProgress] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateStatusMsg, setTranslateStatusMsg] = useState('');
  const [translationError, setTranslationError] = useState('');

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleFile = (file) => {
    if (!file.name.endsWith('.srt')) {
      alert('Only .srt files are currently supported.');
      return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setOriginalText(text);
      const parsed = parseSRT(text);
      setSubtitles(parsed);
      setProcessedSubs(JSON.parse(JSON.stringify(parsed))); // Deep copy
      setEditableSrtText(text); // Initialize raw text
      analyzeSubtitle(parsed);

      // Auto-adjust start ad times based on first subtitle
      if (parsed.length > 0) {
        const firstStartMs = timeToMs(parsed[0].start);
        if (firstStartMs > 5000) {
          setInsertStart(true);
          setStartTimeStart('00:00:01,000');
          const endMs = Math.min(31000, firstStartMs - 1500);
          setStartTimeEnd(msToTime(endMs));
        } else {
          setInsertStart(false);
          setStartTimeStart('00:00:00,500');
          setStartTimeEnd(msToTime(Math.max(500, firstStartMs - 500)));
        }
      }

      setActiveTab('brand');
    };
    reader.readAsText(file);
  };

  // Analyze Subtitles for Gaps & Competitors
  const analyzeSubtitle = (subs) => {
    if (subs.length === 0) return;

    // 1. Detect Gaps
    const gaps = [];
    for (let i = 0; i < subs.length - 1; i++) {
      const endMs = timeToMs(subs[i].end);
      const nextStartMs = timeToMs(subs[i + 1].start);
      const gapMs = nextStartMs - endMs;

      if (gapMs >= minGapSeconds * 1000) {
        gaps.push({
          index: i,
          start: subs[i].end,
          end: subs[i + 1].start,
          durationSec: Math.floor(gapMs / 1000),
          recommendedStart: msToTime(endMs + 3000),
          recommendedEnd: msToTime(Math.min(endMs + 33000, nextStartMs - 3000))
        });
      }
    }
    setDetectedGaps(gaps);
    setSelectedGaps(gaps.map((_, idx) => idx)); // Select all by default

    // 2. Detect Competitor Brandings
    const competitorKeywords = [
      'baiscope', 'cineru', 'zoom.lk', 'subz.lk', 'sinhalasub',
      'subz.site', 'subzlk', 'baiscopelk', 'zoom', 'බයිස්කෝප්', 'සිනේරු',
      'cinerulk', 'subz'
    ];

    const detected = [];
    const initialActions = {};

    subs.forEach((sub) => {
      const textLower = (sub.text || '').toLowerCase();
      // Check if text matches competitor brandings
      const matches = competitorKeywords.some(keyword => textLower.includes(keyword)) ||
                      textLower.includes('.lk') || textLower.includes('.com') ||
                      textLower.includes('පරිවර්තනය') || textLower.includes('උපසිරැසි');

      if (matches) {
        detected.push(sub);
        // Default action: if it has website keywords, default to replace.
        initialActions[sub.id] = 'replace';
      }
    });

    setDetectedCompetitors(detected);
    setCompetitorActions(initialActions);
  };

  // Run Subtitle Processing (Branding & Replacements)
  const processBranding = () => {
    let workingSubs = JSON.parse(JSON.stringify(subtitles));

    // 1. Handle Competitor Replacements
    workingSubs = workingSubs.map((sub) => {
      const action = competitorActions[sub.id];
      if (action === 'replace') {
        return { ...sub, text: brandingText };
      } else if (action === 'remove') {
        return null; // Flag for deletion
      }
      return sub;
    }).filter(sub => sub !== null);

    // 2. Inject Ads (Start, End, Gaps)
    const adsToInject = [];

    // Start Ad
    if (insertStart) {
      adsToInject.push({
        start: startTimeStart,
        end: startTimeEnd,
        text: brandingText
      });
    }

    // End Ad
    if (insertEnd && workingSubs.length > 0) {
      const lastSub = workingSubs[workingSubs.length - 1];
      const lastEndMs = timeToMs(lastSub.end);
      const adStartMs = lastEndMs + 2000;
      const adEndMs = adStartMs + (endDuration * 1000);

      adsToInject.push({
        start: msToTime(adStartMs),
        end: msToTime(adEndMs),
        text: brandingText
      });
    }

    // Gap Ads
    if (insertGaps) {
      selectedGaps.forEach((gapIdx) => {
        const gap = detectedGaps[gapIdx];
        if (gap) {
          adsToInject.push({
            start: gap.recommendedStart,
            end: gap.recommendedEnd,
            text: brandingText
          });
        }
      });
    }

    // Combine and sort by start timestamp
    const allSubs = [...workingSubs, ...adsToInject.map((ad, idx) => ({
      id: `ad-${idx}`,
      start: ad.start,
      end: ad.end,
      text: ad.text
    }))];

    allSubs.sort((a, b) => timeToMs(a.start) - timeToMs(b.start));

    // Renumber IDs sequentially
    const finalized = allSubs.map((sub, idx) => ({
      ...sub,
      id: idx + 1
    }));

    setProcessedSubs(finalized);
    setEditableSrtText(stringifySRT(finalized)); // Sync raw text
    alert('Subtitles branded and updated successfully. You can preview changes or proceed to Translate/Export.');
    setActiveTab('export');
  };

  // Chunked AI Translation Logic
  const startTranslation = async () => {
    if (processedSubs.length === 0) {
      alert('Please brand or upload subtitles first.');
      return;
    }
    setIsTranslating(true);
    setTranslationError('');
    setTranslationProgress(0);

    const chunkSize = 40; // Optimal chunk size for Gemini API to not timeout and keep sequence
    const totalSubs = processedSubs.length;
    const totalChunks = Math.ceil(totalSubs / chunkSize);
    const updatedSubs = [...processedSubs];

    try {
      for (let c = 0; c < totalChunks; c++) {
        const startIndex = c * chunkSize;
        const endIndex = Math.min(startIndex + chunkSize, totalSubs);
        const chunk = updatedSubs.slice(startIndex, endIndex);

        setTranslateStatusMsg(`Translating subtitle block ${startIndex + 1} to ${endIndex} of ${totalSubs}...`);

        const chunkSrtText = stringifySRT(chunk);
        
        // Post to existing translate API
        const response = await apiClient.post('/api/admin/ai/translate', {
          srtContent: chunkSrtText
        });

        const translatedChunkText = response.data.translatedSrt;
        const parsedTranslatedChunk = parseSRT(translatedChunkText);

        // Map translations back by index matching
        for (let j = 0; j < chunk.length; j++) {
          const originalItem = chunk[j];
          const translatedItem = parsedTranslatedChunk[j];
          
          if (translatedItem) {
            // Keep original metadata, replace text
            updatedSubs[startIndex + j].text = translatedItem.text;
          }
        }
        const percentage = Math.round(((c + 1) / totalChunks) * 100);
        setTranslationProgress(percentage);
      }

      setProcessedSubs(updatedSubs);
      setEditableSrtText(stringifySRT(updatedSubs)); // Sync raw text
      setTranslateStatusMsg('AI Subtitle Translation completed successfully!');
    } catch (err) {
      console.error(err);
      setTranslationError(
        err.response?.data?.error || 
        err.message || 
        'An error occurred during translation. Please check that GEMINI_API_KEY is configured in your server-php/.env file.'
      );
    } finally {
      setIsTranslating(false);
    }
  };

  // Download Final File
  const handleDownload = () => {
    const srtText = editableSrtText || stringifySRT(processedSubs);
    const blob = new Blob([srtText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Formulate new file name
    const baseName = fileName.replace('.srt', '');
    link.href = url;
    link.download = `${baseName}_KSubZone_branded.srt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-luxury-950 text-slate-100 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
              <Languages className="w-8 h-8 text-brand-accent animate-pulse" />
              Subtitle Branding & AI Translator
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Upload English/Sinhala subtitles, automatically inject branding credits, clean competitor ads, and translate using Gemini 1.5.
            </p>
          </div>

          {/* Workflow Tabs */}
          <div className="flex border-b border-white/5 mb-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-black transition-all ${
                activeTab === 'upload'
                  ? 'border-brand-primary text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              1. Upload
            </button>
            <button
              onClick={() => { if (subtitles.length > 0) setActiveTab('brand'); }}
              disabled={subtitles.length === 0}
              className={`px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                activeTab === 'brand'
                  ? 'border-brand-primary text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              2. Clean & Brand
            </button>
            <button
              onClick={() => { if (subtitles.length > 0) setActiveTab('translate'); }}
              disabled={subtitles.length === 0}
              className={`px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                activeTab === 'translate'
                  ? 'border-brand-primary text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              3. AI Translation
            </button>
            <button
              onClick={() => { if (subtitles.length > 0) setActiveTab('export'); }}
              disabled={subtitles.length === 0}
              className={`px-6 py-3 border-b-2 text-xs uppercase tracking-widest font-black transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                activeTab === 'export'
                  ? 'border-brand-primary text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              4. Export Preview
            </button>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            
            {/* 1. UPLOAD TAB */}
            {activeTab === 'upload' && (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-brand-primary/50 bg-luxury-900/50 hover:bg-luxury-900 transition-all rounded-3xl p-16 flex flex-col items-center justify-center gap-4 cursor-pointer min-h-[350px] text-center"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".srt" 
                  className="hidden" 
                />
                <div className="w-16 h-16 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary border border-brand-primary/20">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Drag & drop your subtitle file here</h3>
                  <p className="text-slate-400 text-xs mt-1">Supports standard SubRip (.srt) subtitle files</p>
                </div>
                <button className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition">
                  Browse Files
                </button>
              </div>
            )}

            {/* 2. CLEAN & BRAND TAB */}
            {activeTab === 'brand' && subtitles.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Configuration Left Panel */}
                <div className="lg:col-span-2 space-y-6">
                  
                  {/* Branding Template Card */}
                  <div className="bg-luxury-900 border border-white/5 rounded-2xl p-6 space-y-4">
                    <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-brand-accent" /> Branding Advertisement Template
                    </h2>
                    <p className="text-slate-400 text-xs">
                      This template will be injected at specified positions and replaces detected competitor credits.
                    </p>
                    <textarea
                      value={brandingText}
                      onChange={(e) => setBrandingText(e.target.value)}
                      rows={4}
                      className="w-full bg-luxury-950 border border-white/10 rounded-xl p-4 text-xs font-mono text-slate-200 outline-none focus:border-brand-primary resize-none"
                    />
                  </div>

                  {/* Ad Placements Configuration */}
                  <div className="bg-luxury-900 border border-white/5 rounded-2xl p-6 space-y-6">
                    <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Settings className="w-4 h-4 text-brand-primary" /> Placement Settings
                    </h2>

                    {/* Start Ad */}
                    <div className="border-b border-white/5 pb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={insertStart} 
                            onChange={(e) => setInsertStart(e.target.checked)}
                            className="rounded accent-brand-primary bg-luxury-950 border-white/10" 
                          />
                          Inject Advertisement at Start
                        </label>
                        <span className="text-[10px] bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-2 py-0.5 rounded font-black">START</span>
                      </div>
                      {insertStart && (
                        <div className="space-y-3 pl-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase block mb-1">Start Time</span>
                              <input 
                                type="text" 
                                value={startTimeStart} 
                                onChange={(e) => setStartTimeStart(e.target.value)}
                                className="w-full bg-luxury-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 outline-none focus:border-brand-primary"
                              />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 uppercase block mb-1">End Time</span>
                              <input 
                                type="text" 
                                value={startTimeEnd} 
                                onChange={(e) => setStartTimeEnd(e.target.value)}
                                className="w-full bg-luxury-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 outline-none focus:border-brand-primary"
                              />
                            </div>
                          </div>
                          
                          {subtitles.length > 0 && (
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t border-white/5">
                              <span className="text-[10px] text-slate-400">
                                First dialogue starts at: <span className="font-mono text-brand-primary font-bold">{subtitles[0].start}</span>
                              </span>
                              
                              {timeToMs(startTimeEnd) >= timeToMs(subtitles[0].start) ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Overlaps dialogue!
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const firstStartMs = timeToMs(subtitles[0].start);
                                      setStartTimeStart('00:00:01,000');
                                      const endMs = Math.max(2000, firstStartMs - 1500);
                                      setStartTimeEnd(msToTime(endMs));
                                    }}
                                    className="px-2 py-0.5 bg-brand-primary/20 border border-brand-primary/30 hover:bg-brand-primary/30 text-brand-primary rounded text-[9px] font-black uppercase tracking-wider transition"
                                  >
                                    Auto-Adjust
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Time slot fits timeline
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* End Ad */}
                    <div className="border-b border-white/5 pb-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={insertEnd} 
                            onChange={(e) => setInsertEnd(e.target.checked)}
                            className="rounded accent-brand-primary bg-luxury-950 border-white/10" 
                          />
                          Inject Advertisement at End
                        </label>
                        <span className="text-[10px] bg-brand-primary/10 border border-brand-primary/20 text-brand-primary px-2 py-0.5 rounded font-black">END</span>
                      </div>
                      {insertEnd && (
                        <div className="grid grid-cols-1 gap-4 pl-6">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase block mb-1">Duration (Seconds)</span>
                            <input 
                              type="number" 
                              value={endDuration} 
                              onChange={(e) => setEndDuration(parseInt(e.target.value, 10) || 30)}
                              className="w-full max-w-[150px] bg-luxury-950 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 outline-none"
                            />
                            <p className="text-[10px] text-slate-500 mt-1">Will automatically insert 2 seconds after the final subtitle block finishes.</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Gap Ads */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-extrabold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            checked={insertGaps} 
                            onChange={(e) => setInsertGaps(e.target.checked)}
                            className="rounded accent-brand-primary bg-luxury-950 border-white/10" 
                          />
                          Inject Advertisement in Middle Gaps
                        </label>
                        <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-black">TIMELINE GAPS</span>
                      </div>
                      
                      {insertGaps && (
                        <div className="pl-6 space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 uppercase">Min Gap Size:</span>
                            <input 
                              type="number" 
                              value={minGapSeconds} 
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10) || 30;
                                setMinGapSeconds(val);
                                // Re-run gap analysis
                                analyzeSubtitle(subtitles);
                              }}
                              className="w-20 bg-luxury-950 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-center font-mono text-slate-300 outline-none"
                            />
                            <span className="text-[10px] text-slate-500">Seconds</span>
                            <button 
                              onClick={() => analyzeSubtitle(subtitles)}
                              className="p-1.5 hover:bg-white/5 rounded-lg border border-white/10 text-slate-400 hover:text-white transition"
                              title="Rescan Gaps"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Gaps List */}
                          {detectedGaps.length === 0 ? (
                            <div className="p-4 bg-luxury-950 border border-white/5 rounded-xl text-center text-xs text-slate-500">
                              No subtitle gaps longer than {minGapSeconds} seconds were found.
                            </div>
                          ) : (
                            <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                              <span className="text-[10px] text-slate-500 uppercase font-black">Select gaps to inject branding ad:</span>
                              {detectedGaps.map((gap, idx) => (
                                <div 
                                  key={idx}
                                  className="flex items-center justify-between p-2.5 bg-luxury-950 border border-white/5 rounded-xl text-xs hover:border-white/10 transition"
                                >
                                  <div className="flex items-center gap-3">
                                    <input 
                                      type="checkbox" 
                                      checked={selectedGaps.includes(idx)}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedGaps(prev => [...prev, idx]);
                                        } else {
                                          setSelectedGaps(prev => prev.filter(v => v !== idx));
                                        }
                                      }}
                                      className="rounded accent-brand-primary"
                                    />
                                    <div>
                                      <span className="font-bold text-slate-300">Gap #{idx + 1}</span>
                                      <span className="text-[10px] text-slate-500 ml-2">Duration: {gap.durationSec}s</span>
                                    </div>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono">
                                    {gap.start.split(',')[0]} <ArrowRight className="inline w-3 h-3 mx-1" /> {gap.end.split(',')[0]}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                  </div>

                </div>

                {/* Competitor Removal Right Panel */}
                <div className="space-y-6">
                  
                  {/* Competitor Detections Card */}
                  <div className="bg-luxury-900 border border-white/5 rounded-2xl p-6 space-y-4">
                    <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4.5 h-4.5 text-amber-500" /> Competitor Ads Clean Up
                    </h2>
                    <p className="text-slate-400 text-xs">
                      We automatically scanned the subtitle file and found these potential competitor branding lines.
                    </p>

                    {detectedCompetitors.length === 0 ? (
                      <div className="p-8 bg-luxury-950 border border-white/5 rounded-2xl text-center text-xs text-emerald-400 flex flex-col items-center justify-center gap-2">
                        <CheckCircle className="w-8 h-8 text-emerald-500" />
                        No competitor brandings found in this subtitle!
                      </div>
                    ) : (
                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                        {detectedCompetitors.map((sub) => (
                          <div 
                            key={sub.id}
                            className="bg-luxury-950 border border-white/10 rounded-xl p-3.5 space-y-2.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono text-slate-500">Block #{sub.id} ({sub.start.split(',')[0]})</span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => setCompetitorActions(prev => ({ ...prev, [sub.id]: 'replace' }))}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    competitorActions[sub.id] === 'replace'
                                      ? 'bg-brand-primary text-white font-black'
                                      : 'bg-white/5 text-slate-400 hover:text-slate-300'
                                  }`}
                                >
                                  Replace
                                </button>
                                <button
                                  onClick={() => setCompetitorActions(prev => ({ ...prev, [sub.id]: 'remove' }))}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    competitorActions[sub.id] === 'remove'
                                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                      : 'bg-white/5 text-slate-400 hover:text-slate-300'
                                  }`}
                                >
                                  Remove
                                </button>
                                <button
                                  onClick={() => setCompetitorActions(prev => ({ ...prev, [sub.id]: 'ignore' }))}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    competitorActions[sub.id] === 'ignore'
                                      ? 'bg-white/10 text-white'
                                      : 'bg-white/5 text-slate-400 hover:text-slate-300'
                                  }`}
                                >
                                  Keep
                                </button>
                              </div>
                            </div>
                            <div className="p-2 bg-luxury-900 border border-white/5 rounded-lg text-slate-400 font-mono text-[10px] break-all whitespace-pre-wrap">
                              {sub.text}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Process Action */}
                  <button
                    onClick={processBranding}
                    className="w-full py-4 bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-95 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition shadow-lg flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4.5 h-4.5" /> Inject Branding & Clean
                  </button>

                </div>

              </div>
            )}

            {/* 3. AI TRANSLATION TAB */}
            {activeTab === 'translate' && (
              <div className="max-w-3xl mx-auto bg-luxury-900 border border-white/5 rounded-3xl p-8 space-y-6">
                <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent">
                    <Sparkles className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white uppercase tracking-wider">AI Subtitle Translator (Gemini)</h2>
                    <p className="text-slate-400 text-xs mt-0.5">Translate your English subtitle dialogues to natural, high-quality Sinhala.</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-brand-primary/5 border border-brand-primary/10 text-xs text-slate-300 leading-relaxed space-y-2">
                  <p className="font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-brand-primary" /> How it works:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400">
                    <li>The subtitles will be split into batches of 40 blocks.</li>
                    <li>We call Gemini 1.5 Flash to translate dialogue text.</li>
                    <li>Exact timestamps, sequence numbers, and text colors are preserved.</li>
                    <li>Requires <b className="text-white">GEMINI_API_KEY</b> configured in the server's backend configuration.</li>
                  </ul>
                </div>

                {/* Progress Indicators */}
                {isTranslating && (
                  <div className="space-y-3 p-6 bg-luxury-950 border border-white/5 rounded-2xl">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-400 uppercase">Translation Progress</span>
                      <span className="font-black text-brand-accent font-mono">{translationProgress}%</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/10">
                      <div 
                        className="bg-gradient-to-r from-brand-primary to-brand-accent h-full transition-all duration-300"
                        style={{ width: `${translationProgress}%` }}
                      />
                    </div>

                    <p className="text-[10px] text-slate-500 font-mono animate-pulse">{translateStatusMsg}</p>
                  </div>
                )}

                {translationError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
                    {translationError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                  <button
                    disabled={isTranslating}
                    onClick={() => setActiveTab('brand')}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-bold border border-white/10 transition"
                  >
                    Go Back
                  </button>
                  <button
                    onClick={startTranslation}
                    disabled={isTranslating}
                    className="px-6 py-3 bg-gradient-to-r from-brand-primary to-brand-accent hover:opacity-90 text-white rounded-xl text-xs font-black uppercase tracking-widest transition flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isTranslating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Translating...
                      </>
                    ) : (
                      <>
                        <Languages className="w-4 h-4" /> Start AI Translation
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* 4. EXPORT TAB */}
            {activeTab === 'export' && processedSubs.length > 0 && (
              <div className="space-y-6">
                
                {/* File summary and download */}
                <div className="bg-luxury-900 border border-white/5 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">Processed Subtitle Ready</h3>
                    <p className="text-slate-400 text-xs mt-1">
                      File: <b className="text-slate-300">{fileName.replace('.srt', '')}_KSubZone_branded.srt</b> • Blocks: <b className="text-brand-primary font-mono">{processedSubs.length}</b>
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveTab('translate')}
                      className="px-5 py-3 bg-brand-accent/10 border border-brand-accent/25 hover:bg-brand-accent/20 text-brand-accent rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" /> AI Translate Now
                    </button>
                    <button
                      onClick={handleDownload}
                      className="px-5 py-3 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 shadow-lg"
                    >
                      <Download className="w-4 h-4" /> Download Subtitle
                    </button>
                  </div>
                </div>

                {/* Subtitle Side by Side Preview */}
                <div className="bg-luxury-900 border border-white/5 rounded-3xl overflow-hidden flex flex-col h-[600px]">
                  <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4 text-brand-primary" />
                      <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">
                        {previewMode === 'blocks' ? 'Live Subtitle Content Preview' : 'Raw SRT Text Editor (Full)'}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3">
                      {previewMode === 'blocks' && (
                        <span className="text-[10px] text-slate-500">Previewing first 200 blocks</span>
                      )}
                      <div className="flex bg-luxury-950 p-1 rounded-xl border border-white/10">
                        <button
                          type="button"
                          onClick={() => setPreviewMode('blocks')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all ${
                            previewMode === 'blocks'
                              ? 'bg-brand-primary text-white shadow-neon-accent'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Visual Preview
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewMode('raw')}
                          className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all ${
                            previewMode === 'raw'
                              ? 'bg-brand-primary text-white shadow-neon-accent'
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          Raw Editor (Full)
                        </button>
                      </div>
                    </div>
                  </div>

                  {previewMode === 'blocks' ? (
                    <div className="flex-grow overflow-auto p-6 space-y-4 select-text">
                      {processedSubs.slice(0, 200).map((sub) => {
                        const isAd = String(sub.id).includes('ad-') || (sub.text || '').includes('ksubzone');
                        return (
                          <div 
                            key={sub.id}
                            className={`p-4 border rounded-2xl flex flex-col sm:flex-row gap-4 items-start ${
                              isAd 
                                ? 'bg-brand-primary/5 border-brand-primary/20' 
                                : 'bg-luxury-950 border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-2 sm:flex-col sm:items-start flex-shrink-0">
                              <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black font-mono ${
                                isAd ? 'bg-brand-primary/20 text-brand-primary' : 'bg-white/5 text-slate-400'
                              }`}>
                                {sub.id}
                              </span>
                              <div className="text-[10px] text-slate-500 font-mono">
                                <div>{sub.start.split(',')[0]}</div>
                                <div className="sm:hidden text-center my-0.5">↓</div>
                                <div>{sub.end.split(',')[0]}</div>
                              </div>
                            </div>

                            <div className="flex-grow">
                              {isAd && (
                                <span className="inline-block px-1.5 py-0.5 mb-1.5 text-[8px] font-black uppercase tracking-wider rounded bg-brand-primary/20 text-brand-primary border border-brand-primary/30">
                                  injected KSubZone ad
                                </span>
                              )}
                              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed select-text" dangerouslySetInnerHTML={{ __html: sub.text || '' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col p-6 bg-luxury-950/40 relative">
                      <textarea
                        value={editableSrtText}
                        onChange={(e) => {
                          const newText = e.target.value;
                          setEditableSrtText(newText);
                          const parsed = parseSRT(newText);
                          setProcessedSubs(parsed);
                        }}
                        placeholder="Paste or edit subtitle content here in standard SRT format..."
                        className="flex-grow w-full bg-luxury-950/80 border border-white/10 rounded-2xl p-4 text-xs font-mono text-slate-200 outline-none focus:border-brand-primary resize-none overflow-y-auto"
                      />
                      <div className="mt-3 flex justify-between items-center text-[10px] text-slate-500 font-mono px-2">
                        <span>Characters: {editableSrtText.length}</span>
                        <span>Subtitle Blocks: {processedSubs.length}</span>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
}
