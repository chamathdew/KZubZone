'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import apiClient from '@/services/api/apiClient';
import AdminSidebar from '@/features/admin/components/AdminSidebar';
import { useToast } from '@/features/admin/components/Toast';
import {
  Wand2, Bot, Trash2, Settings, FileText, CheckCircle2,
  UploadCloud, Download, Sparkles, AlertTriangle, RefreshCw, Languages
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
  if (ms < 0) ms = 0;
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

const DEFAULT_OPTIONS = {
  fixOverlaps: true,
  removeInvalidTimes: true,
  removeEmptyBrackets: true,
  mergeBlankLines: true,
  mergeSameText: false,
  removeHtml: true,
  removeAds: true,
  removeSpeakers: true,
  removeMusic: true,
  removeSdh: true,
  removeRoundBrackets: true,
  removeSquareBrackets: true,
  removeCurlyBraces: true,
  removeQuotes: true,
  removeHashtags: true,
  toLowercase: false,
  removeAllCaps: false,
  stripInlineTimes: false,
  filterProfanity: false,
  splitLongLines: false,
  convertToVtt: false,
  aiPolish: false,
  timeShift: '',
  findReplaceText: '',
  specificWords: '',
  wrongTime1: '',
  correctTime1: '',
  wrongTime2: '',
  correctTime2: '',
};

export default function SrtCleaner() {
  const { admin } = useAuth();
  const fileInputRef = useRef(null);
  const toast = useToast();

  // File states (Multiple Files Queue)
  const [files, setFiles] = useState([]);
  const [activeId, setActiveId] = useState(null);

  // Drag and Drop
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadSubtitleFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      loadSubtitleFiles(e.target.files);
    }
  };

  const loadSubtitleFiles = (selectedFiles) => {
    const newFiles = [];
    for (let i = 0; i < selectedFiles.length; i++) {
      const f = selectedFiles[i];
      if (!f.name.endsWith('.srt')) {
        toast.error(`${f.name} is not supported. Only .srt files are currently supported.`);
        continue;
      }
      const fileId = Math.random().toString(36).substring(2, 9);
      newFiles.push({
        id: fileId,
        file: f,
        name: f.name,
        size: (f.size / 1024).toFixed(1),
        options: { ...DEFAULT_OPTIONS },
        cleanedText: '',
        isCleaned: false,
        isCleaning: false,
        isPolishing: false,
        polishProgress: 0,
        polishStatusMsg: '',
        error: '',
      });
    }
    if (newFiles.length > 0) {
      setFiles(prev => {
        const updated = [...prev, ...newFiles];
        // Auto-select the first file if none is selected
        const currentActive = activeId || newFiles[0].id;
        setActiveId(currentActive);
        return updated;
      });
    }
  };

  const handleRemoveFile = (id) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      if (activeId === id) {
        setActiveId(filtered.length > 0 ? filtered[0].id : null);
      }
      return filtered;
    });
  };

  const updateActiveOption = (key, val) => {
    setFiles(prev => prev.map(f => {
      if (f.id === activeId) {
        return {
          ...f,
          options: {
            ...f.options,
            [key]: val
          }
        };
      }
      return f;
    }));
  };

  const activeFile = files.find(f => f.id === activeId);

  // Run the cleaning procedure for a specific file
  const cleanFile = async (id) => {
    const fileObj = files.find(f => f.id === id);
    if (!fileObj) return;

    setFiles(prev => prev.map(f => f.id === id ? { 
      ...f, 
      isCleaning: true, 
      isCleaned: false,
      error: '',
      polishProgress: 0,
      polishStatusMsg: '' 
    } : f));

    const config = fileObj.options;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const rawText = e.target.result;
        let subs = parseSRT(rawText);

        // 1. Time Shift
        const shiftMs = parseInt(config.timeShift, 10);
        if (!isNaN(shiftMs) && shiftMs !== 0) {
          subs = subs.map(sub => {
            const sMs = timeToMs(sub.start) + shiftMs;
            const eMs = timeToMs(sub.end) + shiftMs;
            return {
              ...sub,
              start: msToTime(sMs),
              end: msToTime(eMs)
            };
          });
        }

        // 2. Linear Resync
        if (config.wrongTime1 && config.correctTime1 && config.wrongTime2 && config.correctTime2) {
          const w1 = timeToMs(config.wrongTime1);
          const c1 = timeToMs(config.correctTime1);
          const w2 = timeToMs(config.wrongTime2);
          const c2 = timeToMs(config.correctTime2);

          if (w2 !== w1) {
            const scale = (c2 - c1) / (w2 - w1);
            const offset = c1 - w1 * scale;

            subs = subs.map(sub => {
              const sMs = timeToMs(sub.start) * scale + offset;
              const eMs = timeToMs(sub.end) * scale + offset;
              return {
                ...sub,
                start: msToTime(sMs),
                end: msToTime(eMs)
              };
            });
          }
        }

        // 3. Fix Overlaps & Durations
        if (config.fixOverlaps) {
          for (let i = 0; i < subs.length; i++) {
            let sMs = timeToMs(subs[i].start);
            let eMs = timeToMs(subs[i].end);

            if (sMs >= eMs) {
              eMs = sMs + 2000;
              subs[i].end = msToTime(eMs);
            }

            if (i < subs.length - 1) {
              const nextStartMs = timeToMs(subs[i + 1].start);
              if (eMs > nextStartMs) {
                eMs = Math.max(sMs + 500, nextStartMs - 50);
                subs[i].end = msToTime(eMs);
              }
            }
          }
        }

        // 4. Remove Invalid Timings
        if (config.removeInvalidTimes) {
          subs = subs.filter(sub => {
            const sMs = timeToMs(sub.start);
            const eMs = timeToMs(sub.end);
            return sMs >= 0 && eMs > sMs;
          });
        }

        // 5. Clean text content of each block
        subs = subs.map(sub => {
          let text = sub.text || '';

          // HTML Tags
          if (config.removeHtml) {
            text = text.replace(/<[^>]*>/g, '');
          }

          // Music Notes
          if (config.removeMusic) {
            text = text.replace(/[♪♫♩#]/g, '');
          }

          // Speaker Names
          if (config.removeSpeakers) {
            text = text.replace(/^[A-Za-z0-9\s_-]+:\s*/gm, '');
            text = text.replace(/^\[[A-Za-z0-9\s_-]+\]\s*:\s*/gm, '');
            text = text.replace(/^\([A-Za-z0-9\s_-]+\)\s*:\s*/gm, '');
          }

          // SDH Descriptions
          if (config.removeSdh) {
            text = text.replace(/\[[A-Za-z\s_-]+\]/g, '');
            text = text.replace(/\([A-Za-z\s_-]+\)/g, '');
            text = text.replace(/\{[A-Za-z\s_-]+\}/g, '');
          }

          // Round Brackets
          if (config.removeRoundBrackets) {
            text = text.replace(/\([^)]*\)/g, '');
          }

          // Square Brackets
          if (config.removeSquareBrackets) {
            text = text.replace(/\[[^\]]*\]/g, '');
          }

          // Curly Braces
          if (config.removeCurlyBraces) {
            text = text.replace(/\{[^}]*\}/g, '');
          }

          // Quotes
          if (config.removeQuotes) {
            text = text.replace(/"([^"]*)"/g, '$1');
            text = text.replace(/'([^']*)'/g, '$1');
          }

          // Hashtags
          if (config.removeHashtags) {
            text = text.replace(/#[^#]*#/g, '');
          }

          // Empty Brackets
          if (config.removeEmptyBrackets) {
            text = text.replace(/\(\s*\)/g, '').replace(/\[\s*\]/g, '').replace(/\{\s*\}/g, '');
          }

          // Ads & Watermarks
          if (config.removeAds) {
            const adKeywords = [
              'www.', '.com', '.org', '.net', '.lk', '.info', 'http://', 'https://',
              'subtitles by', 'opensubtitles', 'translated by', 'synchronized by', 'corrected by',
              'support us', 'subtitles downloaded', 'rip', 'remux', 'bluray', 'web-dl',
              'encode', 'synchronization', 'captioned by', 'join us on'
            ];
            
            text = text.split('\n').filter(line => {
              const lLower = line.toLowerCase();
              const isAd = adKeywords.some(keyword => lLower.includes(keyword)) ||
                           lLower.includes('.lk') || lLower.includes('.com') ||
                           (lLower.includes('@') && !lLower.includes(' '));
              return !isAd;
            }).join('\n');
          }

          // Specific Words
          if (config.specificWords) {
            const words = config.specificWords.split(',').map(w => w.trim()).filter(Boolean);
            if (words.length > 0) {
              const escaped = words.map(w => w.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'));
              const regex = new RegExp(escaped.join('|'), 'gi');
              text = text.replace(regex, '');
            }
          }

          // Find & Replace
          if (config.findReplaceText) {
            const lines = config.findReplaceText.split('\n').filter(Boolean);
            lines.forEach(line => {
              const parts = line.split('|');
              if (parts.length >= 2) {
                const findVal = parts[0].trim();
                const replaceVal = parts.slice(1).join('|').trim();
                if (findVal) {
                  text = text.replaceAll(findVal, replaceVal);
                }
              }
            });
          }

          // Lowercase
          if (config.toLowercase) {
            text = text.toLowerCase();
          }

          // Remove ALL CAPS Lines
          if (config.removeAllCaps) {
            text = text.split('\n')
              .filter(line => line.trim() !== '' && line !== line.toUpperCase())
              .join('\n');
          }

          // Strip Inline Times
          if (config.stripInlineTimes) {
            text = text.replace(/\[\d{2}:\d{2}\]/g, '').replace(/\(\d{2}:\d{2}\)/g, '');
          }

          // Profanity Filter
          if (config.filterProfanity) {
            const profanities = ['fuck', 'shit', 'bitch', 'asshole', 'bastard', 'cunt', 'dick', 'pussy'];
            profanities.forEach(p => {
              const regex = new RegExp(`\\b${p}\\b`, 'gi');
              text = text.replace(regex, '***');
            });
          }

          // Split Long Lines
          if (config.splitLongLines) {
            text = text.split('\n').map(line => {
              if (line.length > 45) {
                const middle = Math.floor(line.length / 2);
                let spaceIdx = line.lastIndexOf(' ', middle);
                if (spaceIdx === -1) spaceIdx = line.indexOf(' ', middle);
                if (spaceIdx !== -1) {
                  return line.substring(0, spaceIdx) + '\n' + line.substring(spaceIdx + 1);
                }
              }
              return line;
            }).join('\n');
          }

          // Merge Consecutive Blank Lines
          if (config.mergeBlankLines) {
            text = text.replace(/\n+/g, '\n').trim();
          }

          return {
            ...sub,
            text
          };
        });

        // Filter out empty subtitles
        subs = subs.filter(sub => sub.text.trim() !== '');

        // Merge cues with same text
        if (config.mergeSameText) {
          const merged = [];
          for (let i = 0; i < subs.length; i++) {
            if (merged.length > 0 && merged[merged.length - 1].text === subs[i].text) {
              const last = merged[merged.length - 1];
              const gapMs = timeToMs(subs[i].start) - timeToMs(last.end);
              if (gapMs < 2000) {
                last.end = subs[i].end;
                continue;
              }
            }
            merged.push({ ...subs[i] });
          }
          subs = merged;
        }

        // Re-index
        subs = subs.map((sub, idx) => ({ ...sub, id: idx + 1 }));

        // 8. AI Polish (Spoken to Formal Written Sinhala)
        if (config.aiPolish) {
          setFiles(prev => prev.map(f => f.id === id ? { 
            ...f, 
            isPolishing: true, 
            polishProgress: 0, 
            polishStatusMsg: 'Initializing AI Sinhala Polishing...' 
          } : f));

          const chunkSize = 40;
          const totalSubs = subs.length;
          const totalChunks = Math.ceil(totalSubs / chunkSize);
          const updatedSubs = [...subs];

          for (let c = 0; c < totalChunks; c++) {
            const startIndex = c * chunkSize;
            const endIndex = Math.min(startIndex + chunkSize, totalSubs);
            const chunk = updatedSubs.slice(startIndex, endIndex);

            setFiles(prev => prev.map(f => f.id === id ? { 
              ...f, 
              polishStatusMsg: `AI Polishing Sinhala blocks ${startIndex + 1} to ${endIndex} of ${totalSubs}...` 
            } : f));

            const chunkSrtText = stringifySRT(chunk);

            const response = await apiClient.post('/api/admin/ai/polish', {
              srtContent: chunkSrtText
            }, {
              timeout: 120000 // 2 minutes custom timeout
            });

            const polishedChunkText = response.data.polishedSrt;
            const parsedPolishedChunk = parseSRT(polishedChunkText);

            for (let j = 0; j < chunk.length; j++) {
              const polishedItem = parsedPolishedChunk[j];
              if (polishedItem) {
                updatedSubs[startIndex + j].text = polishedItem.text;
              }
            }

            const percentage = Math.round(((c + 1) / totalChunks) * 100);
            setFiles(prev => prev.map(f => f.id === id ? { ...f, polishProgress: percentage } : f));
          }

          subs = updatedSubs;
        }

        // Format output string
        let finalStr = '';
        if (config.convertToVtt) {
          finalStr = 'WEBVTT\n\n' + subs.map(sub => {
            const startVtt = sub.start.replace(',', '.');
            const endVtt = sub.end.replace(',', '.');
            return `${sub.id}\n${startVtt} --> ${endVtt}\n${sub.text}`;
          }).join('\n\n') + '\n';
        } else {
          finalStr = stringifySRT(subs);
        }

        setFiles(prev => prev.map(f => f.id === id ? {
          ...f,
          cleanedText: finalStr,
          isCleaned: true,
          isCleaning: false,
          isPolishing: false,
          polishProgress: 100,
          polishStatusMsg: 'Completed successfully'
        } : f));

      } catch (err) {
        console.error(err);
        const errMsg = err.response?.data?.error || err.message || 'Error occurred during translation.';
        setFiles(prev => prev.map(f => f.id === id ? {
          ...f,
          error: errMsg,
          isCleaning: false,
          isPolishing: false
        } : f));
      }
    };
    reader.readAsText(fileObj.file);
  };

  const handleCleanSRT = () => {
    if (activeId) {
      cleanFile(activeId);
    }
  };

  const handleCleanAll = () => {
    const pendingFiles = files.filter(f => !f.isCleaned && !f.isCleaning && !f.isPolishing);
    if (pendingFiles.length === 0) {
      toast.error('No pending files to clean in queue.');
      return;
    }
    toast.info(`Cleaning ${pendingFiles.length} file(s) in queue...`);
    pendingFiles.forEach(f => {
      cleanFile(f.id);
    });
  };

  const handleDownloadAll = () => {
    const cleanedFiles = files.filter(f => f.isCleaned);
    if (cleanedFiles.length === 0) {
      toast.error('No cleaned files to download.');
      return;
    }
    toast.success(`Starting download for ${cleanedFiles.length} file(s)...`);
    cleanedFiles.forEach((f, idx) => {
      setTimeout(() => {
        triggerDownloadForFile(f);
      }, idx * 300);
    });
  };

  const handleClearQueue = () => {
    setFiles([]);
    setActiveId(null);
    toast.success('Queue cleared.');
  };

  const handleApplyActiveSettingsToAll = () => {
    if (!activeId) {
      toast.error('Please select a file first.');
      return;
    }
    const activeConfig = files.find(f => f.id === activeId)?.options;
    if (!activeConfig) return;

    setFiles(prev => prev.map(f => ({
      ...f,
      options: { ...activeConfig }
    })));
    toast.success('Configuration applied to all files in queue.');
  };

  // One-click Smart Auto-clean configuration for a specific file
  const handleRunSmartBotForFile = (id) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        return {
          ...f,
          options: {
            ...f.options,
            fixOverlaps: true,
            removeInvalidTimes: true,
            removeEmptyBrackets: true,
            mergeBlankLines: true,
            removeHtml: true,
            removeAds: true,
            removeSpeakers: true,
            removeMusic: true,
            removeSdh: true,
            removeRoundBrackets: true,
            removeSquareBrackets: true,
            removeCurlyBraces: true,
            removeQuotes: false, // Keep quotes
            removeHashtags: true,
            mergeSameText: false,
            toLowercase: false,
            removeAllCaps: false,
            stripInlineTimes: false,
            filterProfanity: false,
            splitLongLines: false,
            convertToVtt: false,
            timeShift: '',
            findReplaceText: '',
            specificWords: '',
            wrongTime1: '',
            correctTime1: '',
            wrongTime2: '',
            correctTime2: '',
            aiPolish: false
          }
        };
      }
      return f;
    }));

    // Trigger cleaning immediately for this file
    setTimeout(() => {
      cleanFile(id);
    }, 100);
  };

  const triggerDownloadForFile = (f) => {
    if (!f.cleanedText) return;
    const blob = new Blob([f.cleanedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const cleanBaseName = (fileName) => {
      let base = fileName.replace(/\.[a-zA-Z0-9]+$/i, '');
      while (true) {
        const prev = base;
        base = base.replace(/_(KSubZone|KSubZone_branded|cleaned|www\.ksubzone\.com|branded|KSubZonesrt)/gi, '');
        base = base.replace(/-(cleaned|branded)/gi, '');
        if (base === prev) break;
      }
      return base.trim().replace(/\.+$/, '');
    };

    const baseName = cleanBaseName(f.name);
    const extension = f.options.convertToVtt ? 'vtt' : 'srt';
    link.href = url;
    link.download = `${baseName}_www.ksubzone.com.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Custom switch toggle component
  const Switch = ({ optionKey, label }) => {
    const checked = activeFile?.options[optionKey] ?? false;
    return (
      <label className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-brand-primary/20 cursor-pointer select-none transition">
        <span className="text-xs font-bold text-slate-300 pr-4">{label}</span>
        <div className="relative">
          <input 
            type="checkbox" 
            checked={checked} 
            onChange={(e) => updateActiveOption(optionKey, e.target.checked)} 
            className="sr-only" 
          />
          <div className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-brand-primary' : 'bg-slate-700'}`} />
          <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
        </div>
      </label>
    );
  };

  return (
    <div className="min-h-screen bg-luxury-950 text-slate-100 flex flex-col lg:flex-row">
      <AdminSidebar />

      <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-left border-b border-white/5 pb-4">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
              <Wand2 className="w-8 h-8 text-brand-primary animate-pulse" />
              SRT Cleaner
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Professional subtitle tools. Fix timings, remove ads, and format automatically. Supports batch queue processing.
            </p>
          </div>

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column: Files Queue (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-brand-primary" /> Subtitle Queue ({files.length})
              </h2>

              {/* Compact Drag & Drop Upload Zone */}
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 hover:border-brand-primary/40 bg-white/[0.01] hover:bg-white/[0.03] transition-all rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer text-center"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".srt" 
                  multiple
                  className="hidden" 
                />
                <UploadCloud className="w-6 h-6 text-slate-400" />
                <div>
                  <h4 className="text-xs font-bold text-white">Upload SRT subtitles</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Drag & drop or browse (select multiple)</p>
                </div>
              </div>

              {/* Batch Actions Bar */}
              {files.length > 0 && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCleanAll}
                    disabled={files.every(f => f.isCleaned || f.isCleaning || f.isPolishing)}
                    className="flex-grow h-10 bg-brand-primary hover:bg-brand-primary/90 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition shadow-md shadow-brand-primary/10"
                  >
                    <Wand2 className="w-3.5 h-3.5" /> Clean All ({files.filter(f => !f.isCleaned).length})
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDownloadAll}
                    disabled={!files.some(f => f.isCleaned)}
                    className="flex-grow h-10 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-600/10"
                  >
                    <Download className="w-3.5 h-3.5" /> Download All ({files.filter(f => f.isCleaned).length})
                  </button>

                  <button
                    type="button"
                    onClick={handleClearQueue}
                    className="h-10 px-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center justify-center gap-1"
                    title="Clear Queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Reset
                  </button>
                </div>
              )}

              {/* Files list */}
              {files.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs border border-white/5 bg-white/[0.01] rounded-2xl">
                  No files in queue. Upload files above to get started.
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {files.map(f => {
                    const isActive = f.id === activeId;
                    return (
                      <div 
                        key={f.id}
                        onClick={() => setActiveId(f.id)}
                        className={`p-4 rounded-2xl border transition-all cursor-pointer text-left relative ${
                          isActive 
                            ? 'bg-brand-primary/10 border-brand-primary/40' 
                            : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.03]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-grow">
                            <h4 className="text-xs font-bold text-white truncate pr-2" title={f.name}>{f.name}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">{f.size} KB</p>
                          </div>
                          
                          {/* Badges / Delete */}
                          <div className="flex-shrink-0 flex items-center gap-1.5">
                            {f.isCleaning || f.isPolishing ? (
                              <span className="flex items-center gap-1 text-[9px] bg-brand-primary/10 border border-brand-primary/25 text-brand-primary px-2 py-0.5 rounded font-black uppercase animate-pulse">
                                <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Processing
                              </span>
                            ) : f.isCleaned ? (
                              <span className="flex items-center gap-1 text-[9px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-2 py-0.5 rounded font-black uppercase">
                                Cleaned
                              </span>
                            ) : f.error ? (
                              <span className="flex items-center gap-1 text-[9px] bg-red-500/10 border border-red-500/25 text-red-400 px-2 py-0.5 rounded font-black uppercase">
                                Failed
                              </span>
                            ) : (
                              <span className="text-[9px] bg-slate-500/10 border border-slate-500/25 text-slate-400 px-2 py-0.5 rounded font-black uppercase">
                                Pending
                              </span>
                            )}
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveFile(f.id);
                              }}
                              className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition"
                              title="Remove from queue"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Error info */}
                        {f.error && (
                          <p className="text-[9px] text-red-400 font-mono mt-2 p-2 bg-red-950/40 border border-red-900/30 rounded-lg whitespace-pre-wrap break-all" title={f.error}>
                            Error: {f.error}
                          </p>
                        )}

                        {/* Polishing progress bar */}
                        {f.isPolishing && (
                          <div className="space-y-1.5 mt-3">
                            <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold">
                              <span className="truncate max-w-[180px]">{f.polishStatusMsg}</span>
                              <span className="font-bold text-brand-primary">{f.polishProgress}%</span>
                            </div>
                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-brand-primary h-full transition-all duration-300" style={{ width: `${f.polishProgress}%` }} />
                            </div>
                          </div>
                        )}

                        {/* Card Footer Actions */}
                        <div className="flex justify-between items-center gap-2 mt-3 pt-3 border-t border-white/5">
                          <span className="text-[9px] text-slate-500 font-semibold uppercase">
                            {isActive ? 'Active Configuration' : 'Click to select'}
                          </span>
                          <div className="flex gap-2">
                            {f.isCleaned ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  triggerDownloadForFile(f);
                                }}
                                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" /> Download
                              </button>
                            ) : (
                              <button
                                disabled={f.isCleaning}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cleanFile(f.id);
                                }}
                                className="px-2.5 py-1 bg-brand-primary hover:bg-brand-primary/90 disabled:bg-slate-800 disabled:text-slate-500 text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition"
                              >
                                Clean
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Settings Panel (lg:col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
              {activeFile ? (
                <>
                  {/* File Indicator Header */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest block">Configure Settings For:</span>
                      <h3 className="text-xs font-bold text-white truncate pr-2" title={activeFile.name}>{activeFile.name}</h3>
                    </div>
                    
                    <div className="flex gap-2 flex-shrink-0">
                      <button 
                        type="button"
                        onClick={handleApplyActiveSettingsToAll}
                        className="px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 hover:text-white text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5"
                        title="Apply current settings to all subtitles in queue"
                      >
                        <Settings className="w-3.5 h-3.5" /> Apply to All
                      </button>

                      <button 
                        type="button"
                        onClick={() => handleRunSmartBotForFile(activeFile.id)}
                        className="px-3.5 py-2 bg-gradient-to-r from-brand-secondary to-brand-primary hover:brightness-110 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition flex items-center gap-1.5"
                      >
                        <Bot className="w-3.5 h-3.5" /> Smart Auto-Clean
                      </button>
                    </div>
                  </div>

                  {/* 3. Essential Cleanup (Manual) */}
                  <div className="bg-luxury-900 border border-white/5 rounded-3xl p-6 space-y-4 text-left">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Sparkles className="w-4.5 h-4.5 text-brand-accent" /> Essential Cleanup (Manual)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Switch optionKey="fixOverlaps" label="Fix Overlaps & Durations" />
                      <Switch optionKey="removeInvalidTimes" label="Remove Invalid Times (<0s)" />
                      <Switch optionKey="removeEmptyBrackets" label="Remove Empty Brackets () []" />
                      <Switch optionKey="mergeBlankLines" label="Merge Consecutive Blank Lines" />
                      <Switch optionKey="mergeSameText" label="Merge cues with the same text" />
                    </div>
                  </div>

                  {/* 4. Removal Tools */}
                  <div className="bg-luxury-900 border border-white/5 rounded-3xl p-6 space-y-4 text-left">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Trash2 className="w-4.5 h-4.5 text-red-400" /> Removal Tools
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Switch optionKey="removeHtml" label="Remove HTML Tags" />
                      <Switch optionKey="removeAds" label="Remove Ads & Watermarks" />
                      <Switch optionKey="removeSpeakers" label="Remove Speaker Names" />
                      <Switch optionKey="removeMusic" label="Remove Music Notes (♪)" />
                      <Switch optionKey="removeSdh" label="Remove SDH Descriptions" />
                      <Switch optionKey="removeRoundBrackets" label="Remove Text in (Round Brackets)" />
                      <Switch optionKey="removeSquareBrackets" label="Remove Text in [Square Brackets]" />
                      <Switch optionKey="removeCurlyBraces" label="Remove Text in {Curly Braces}" />
                      <Switch optionKey="removeQuotes" label='Remove Text in "Quotes"' />
                      <Switch optionKey="removeHashtags" label="Remove Text in #Hashtags#" />
                    </div>
                  </div>

                  {/* 5. Formatting & Advanced */}
                  <div className="bg-luxury-900 border border-white/5 rounded-3xl p-6 space-y-6 text-left">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                      <Settings className="w-4.5 h-4.5 text-brand-primary" /> Formatting & Advanced
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Switch optionKey="toLowercase" label="Convert Text to Lowercase" />
                      <Switch optionKey="removeAllCaps" label="Remove ALL CAPS Lines" />
                      <Switch optionKey="stripInlineTimes" label="Strip Inline Times [00:12]" />
                      <Switch optionKey="filterProfanity" label="Filter Profanity" />
                      <Switch optionKey="splitLongLines" label="Split Long Lines (> 45 chars)" />
                      <Switch optionKey="convertToVtt" label="Convert to VTT Format (Web)" />
                      <Switch optionKey="aiPolish" label="AI Polish Spoken Sinhala to Formal" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Time Shift (Milliseconds)</span>
                        <input 
                          type="text" 
                          placeholder="-500 or 1000"
                          value={activeFile.options.timeShift || ''}
                          onChange={(e) => updateActiveOption('timeShift', e.target.value)}
                          className="w-full bg-luxury-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-primary font-mono"
                        />
                        <span className="text-[9px] text-slate-500 block">-500 (earlier), 1000 (later)</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Find & Replace</span>
                        <textarea 
                          placeholder="Find | Replace"
                          rows={1}
                          value={activeFile.options.findReplaceText || ''}
                          onChange={(e) => updateActiveOption('findReplaceText', e.target.value)}
                          className="w-full bg-luxury-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-primary font-mono resize-y"
                        />
                        <span className="text-[9px] text-slate-500 block">One per line, e.g. old | new</span>
                      </div>
                    </div>

                    {/* Advanced Resync */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <h4 className="text-xs font-black text-brand-primary uppercase tracking-widest">
                        Advanced Resync (Linear Correction)
                      </h4>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Fix progressive sync issues by setting two reference points. (Format: HH:MM:SS,ms or just Seconds)
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder="Point 1: Wrong Time"
                            value={activeFile.options.wrongTime1 || ''}
                            onChange={(e) => updateActiveOption('wrongTime1', e.target.value)}
                            className="w-full bg-luxury-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-primary font-mono"
                          />
                          <input 
                            type="text" 
                            placeholder="Point 1: Correct Time"
                            value={activeFile.options.correctTime1 || ''}
                            onChange={(e) => updateActiveOption('correctTime1', e.target.value)}
                            className="w-full bg-luxury-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-primary font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder="Point 2: Wrong Time"
                            value={activeFile.options.wrongTime2 || ''}
                            onChange={(e) => updateActiveOption('wrongTime2', e.target.value)}
                            className="w-full bg-luxury-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-primary font-mono"
                          />
                          <input 
                            type="text" 
                            placeholder="Point 2: Correct Time"
                            value={activeFile.options.correctTime2 || ''}
                            onChange={(e) => updateActiveOption('correctTime2', e.target.value)}
                            className="w-full bg-luxury-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-primary font-mono"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Remove Specific Words */}
                    <div className="space-y-2 pt-4 border-t border-white/5">
                      <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Remove Specific Words</span>
                      <textarea 
                        placeholder="e.g. Encoded by, Ripped by..."
                        rows={2}
                        value={activeFile.options.specificWords || ''}
                        onChange={(e) => updateActiveOption('specificWords', e.target.value)}
                        className="w-full bg-luxury-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-primary resize-y"
                      />
                      <span className="text-[9px] text-slate-500 block">Comma-separated values</span>
                    </div>
                  </div>

                  {/* Clean Button */}
                  <button 
                    disabled={activeFile.isCleaning}
                    onClick={() => cleanFile(activeFile.id)}
                    className="w-full py-3.5 bg-red-600 hover:bg-red-700 disabled:bg-slate-800 disabled:text-slate-500 text-white font-black uppercase tracking-widest rounded-2xl transition shadow-lg shadow-red-500/10 text-xs sm:text-sm flex items-center justify-center gap-2"
                  >
                    {activeFile.isCleaning ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Processing AI Polish...
                      </>
                    ) : (
                      'Clean Subtitle'
                    )}
                  </button>

                  {/* Success Banner */}
                  {activeFile.isCleaned && (
                    <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center">
                      <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">Success!</h3>
                        <p className="text-xs text-slate-400 mt-1">Subtitle file has been cleaned and optimized.</p>
                      </div>
                      <button 
                        onClick={() => triggerDownloadForFile(activeFile)}
                        className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-wider text-xs rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-500/10"
                      >
                        <Download className="w-4 h-4" /> Download Cleaned Subtitle
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="h-full min-h-[450px] border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs bg-white/[0.01]">
                  <Wand2 className="w-12 h-12 text-slate-700 mb-4 animate-pulse" />
                  Select a subtitle file from the queue on the left to configure and clean it.
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}
