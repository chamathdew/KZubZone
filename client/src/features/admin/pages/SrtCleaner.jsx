'use client';

import React, { useState, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import AdminSidebar from '@/features/admin/components/AdminSidebar';
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

export default function SrtCleaner() {
  const { admin } = useAuth();
  const fileInputRef = useRef(null);

  // File states
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [cleanedText, setCleanedText] = useState('');
  const [isCleaned, setIsCleaned] = useState(false);

  // Manual cleanup switches
  const [fixOverlaps, setFixOverlaps] = useState(true);
  const [removeInvalidTimes, setRemoveInvalidTimes] = useState(true);
  const [removeEmptyBrackets, setRemoveEmptyBrackets] = useState(true);
  const [mergeBlankLines, setMergeBlankLines] = useState(true);
  const [mergeSameText, setMergeSameText] = useState(false);

  // Removal tools switches
  const [removeHtml, setRemoveHtml] = useState(true);
  const [removeAds, setRemoveAds] = useState(true);
  const [removeSpeakers, setRemoveSpeakers] = useState(true);
  const [removeMusic, setRemoveMusic] = useState(true);
  const [removeSdh, setRemoveSdh] = useState(true);
  const [removeRoundBrackets, setRemoveRoundBrackets] = useState(true);
  const [removeSquareBrackets, setRemoveSquareBrackets] = useState(true);
  const [removeCurlyBraces, setRemoveCurlyBraces] = useState(true);
  const [removeQuotes, setRemoveQuotes] = useState(true);
  const [removeHashtags, setRemoveHashtags] = useState(true);

  // Formatting & Advanced switches
  const [toLowercase, setToLowercase] = useState(false);
  const [removeAllCaps, setRemoveAllCaps] = useState(false);
  const [stripInlineTimes, setStripInlineTimes] = useState(false);
  const [filterProfanity, setFilterProfanity] = useState(false);
  const [splitLongLines, setSplitLongLines] = useState(false);
  const [convertToVtt, setConvertToVtt] = useState(false);

  // Input states
  const [timeShift, setTimeShift] = useState('');
  const [findReplaceText, setFindReplaceText] = useState('');
  const [specificWords, setSpecificWords] = useState('');

  // Linear resync inputs
  const [wrongTime1, setWrongTime1] = useState('');
  const [correctTime1, setCorrectTime1] = useState('');
  const [wrongTime2, setWrongTime2] = useState('');
  const [correctTime2, setCorrectTime2] = useState('');

  // Drag and Drop
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      loadSubtitleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      loadSubtitleFile(e.target.files[0]);
    }
  };

  const loadSubtitleFile = (selectedFile) => {
    if (!selectedFile.name.endsWith('.srt')) {
      alert('Only .srt files are currently supported.');
      return;
    }
    setFile(selectedFile);
    setFileName(selectedFile.name);
    setFileSize((selectedFile.size / 1024).toFixed(1));
    setIsCleaned(false);
    setCleanedText('');
  };

  // Run the cleaning procedure with optional configuration override
  const runCleanerWithOptions = (options) => {
    if (!file) return;

    const config = {
      fixOverlaps,
      removeInvalidTimes,
      removeEmptyBrackets,
      mergeBlankLines,
      mergeSameText,
      removeHtml,
      removeAds,
      removeSpeakers,
      removeMusic,
      removeSdh,
      removeRoundBrackets,
      removeSquareBrackets,
      removeCurlyBraces,
      removeQuotes,
      removeHashtags,
      toLowercase,
      removeAllCaps,
      stripInlineTimes,
      filterProfanity,
      splitLongLines,
      convertToVtt,
      timeShift,
      findReplaceText,
      specificWords,
      wrongTime1,
      correctTime1,
      wrongTime2,
      correctTime2,
      ...options
    };

    const reader = new FileReader();
    reader.onload = (e) => {
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

      setCleanedText(finalStr);
      setIsCleaned(true);
    };
    reader.readAsText(file);
  };

  const handleCleanSRT = () => {
    runCleanerWithOptions({});
  };

  // One-click Smart Auto-clean configuration
  const handleRunSmartBot = () => {
    const smartOptions = {
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
      correctTime2: ''
    };

    // Sync switches in UI state
    setFixOverlaps(true);
    setRemoveInvalidTimes(true);
    setRemoveEmptyBrackets(true);
    setMergeBlankLines(true);
    setRemoveHtml(true);
    setRemoveAds(true);
    setRemoveSpeakers(true);
    setRemoveMusic(true);
    setRemoveSdh(true);
    setRemoveRoundBrackets(true);
    setRemoveSquareBrackets(true);
    setRemoveCurlyBraces(true);
    setRemoveQuotes(false);
    setRemoveHashtags(true);
    setMergeSameText(false);
    setToLowercase(false);
    setRemoveAllCaps(false);
    setStripInlineTimes(false);
    setFilterProfanity(false);
    setSplitLongLines(false);
    setConvertToVtt(false);
    setTimeShift('');
    setFindReplaceText('');
    setSpecificWords('');
    setWrongTime1('');
    setCorrectTime1('');
    setWrongTime2('');
    setCorrectTime2('');

    runCleanerWithOptions(smartOptions);
  };

  const triggerDownload = () => {
    if (!cleanedText) return;
    const blob = new Blob([cleanedText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const baseName = fileName.replace('.srt', '');
    const extension = convertToVtt ? 'vtt' : 'srt';
    link.href = url;
    link.download = `${baseName}_cleaned.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFile(null);
    setFileName('');
    setFileSize(0);
    setCleanedText('');
    setIsCleaned(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Custom switch toggle component
  const Switch = ({ checked, onChange, label }) => (
    <label className="flex items-center justify-between p-3.5 bg-white/[0.02] border border-white/5 rounded-2xl hover:border-brand-primary/20 cursor-pointer select-none transition">
      <span className="text-xs font-bold text-slate-300 pr-4">{label}</span>
      <div className="relative">
        <input 
          type="checkbox" 
          checked={checked} 
          onChange={(e) => onChange(e.target.checked)} 
          className="sr-only" 
        />
        <div className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-brand-primary' : 'bg-slate-700'}`} />
        <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
      </div>
    </label>
  );

  return (
    <div className="min-h-screen bg-luxury-950 text-slate-100 flex flex-col md:flex-row">
      <AdminSidebar />

      <main className="flex-grow p-6 sm:p-8 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Header */}
          <div className="text-left border-b border-white/5 pb-4">
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
              <Wand2 className="w-8 h-8 text-brand-primary animate-pulse" />
              SRT Cleaner
            </h1>
            <p className="text-slate-400 text-xs mt-1">
              Professional subtitle tools. Fix timings, remove ads, and format automatically.
            </p>
          </div>

          {/* 1. Drag & Drop File Zone */}
          {!file ? (
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-white/10 hover:border-brand-primary/40 bg-white/[0.01] hover:bg-white/[0.03] transition-all rounded-3xl p-14 flex flex-col items-center justify-center gap-4 cursor-pointer text-center"
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
                <p className="text-slate-500 text-xs mt-1">Supports standard SubRip (.srt) subtitle files up to 5MB</p>
              </div>
              <button className="px-5 py-2.5 bg-brand-primary hover:bg-brand-primary/90 text-white rounded-xl text-xs font-black uppercase tracking-wider transition">
                Browse Files
              </button>
            </div>
          ) : (
            <div className="border border-white/10 bg-white/[0.02] p-5 rounded-3xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-brand-primary/15 border border-brand-primary/25 flex items-center justify-center text-brand-primary flex-shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white truncate pr-2">{fileName}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{fileSize} KB • Maximum file size 5MB</p>
                </div>
              </div>
              <button 
                onClick={handleReset}
                className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {file && (
            <div className="space-y-6">
              
              {/* 2. Smart Bot Card */}
              <div className="bg-luxury-900 border border-red-500/20 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                  <Bot className="w-24 h-24 text-brand-secondary" />
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/20 flex items-center justify-center text-brand-secondary flex-shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="text-left space-y-3">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      Smart Bot (Auto-Clean)
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                      Let the bot scan your file and automatically remove ads, watermarks, bad timings, and spam.
                    </p>
                    <button 
                      onClick={handleRunSmartBot}
                      className="px-5 py-2.5 bg-gradient-to-r from-brand-secondary to-brand-primary hover:brightness-110 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" /> Run Smart Bot
                    </button>
                    <p className="text-[10px] text-slate-500">
                      * Ignores manual options below and applies recommended settings.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Essential Cleanup (Manual) */}
              <div className="bg-luxury-900 border border-white/5 rounded-3xl p-6 space-y-4 text-left">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4.5 h-4.5 text-brand-accent" /> Essential Cleanup (Manual)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <Switch checked={fixOverlaps} onChange={setFixOverlaps} label="Fix Overlaps & Durations" />
                  <Switch checked={removeInvalidTimes} onChange={setRemoveInvalidTimes} label="Remove Invalid Times (<0s)" />
                  <Switch checked={removeEmptyBrackets} onChange={setRemoveEmptyBrackets} label="Remove Empty Brackets () []" />
                  <Switch checked={mergeBlankLines} onChange={setMergeBlankLines} label="Merge Consecutive Blank Lines" />
                  <Switch checked={mergeSameText} onChange={setMergeSameText} label="Merge cues with the same text" />
                </div>
              </div>

              {/* 4. Removal Tools */}
              <div className="bg-luxury-900 border border-white/5 rounded-3xl p-6 space-y-4 text-left">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Trash2 className="w-4.5 h-4.5 text-red-400" /> Removal Tools
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <Switch checked={removeHtml} onChange={setRemoveHtml} label="Remove HTML Tags" />
                  <Switch checked={removeAds} onChange={setRemoveAds} label="Remove Ads & Watermarks" />
                  <Switch checked={removeSpeakers} onChange={setRemoveSpeakers} label="Remove Speaker Names" />
                  <Switch checked={removeMusic} onChange={setRemoveMusic} label="Remove Music Notes (♪)" />
                  <Switch checked={removeSdh} onChange={setRemoveSdh} label="Remove SDH Descriptions" />
                  <Switch checked={removeRoundBrackets} onChange={setRemoveRoundBrackets} label="Remove Text in (Round Brackets)" />
                  <Switch checked={removeSquareBrackets} onChange={setRemoveSquareBrackets} label="Remove Text in [Square Brackets]" />
                  <Switch checked={removeCurlyBraces} onChange={setRemoveCurlyBraces} label="Remove Text in {Curly Braces}" />
                  <Switch checked={removeQuotes} onChange={setRemoveQuotes} label='Remove Text in "Quotes"' />
                  <Switch checked={removeHashtags} onChange={setRemoveHashtags} label="Remove Text in #Hashtags#" />
                </div>
              </div>

              {/* 5. Formatting & Advanced */}
              <div className="bg-luxury-900 border border-white/5 rounded-3xl p-6 space-y-6 text-left">
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Settings className="w-4.5 h-4.5 text-brand-primary" /> Formatting & Advanced
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  <Switch checked={toLowercase} onChange={setToLowercase} label="Convert Text to Lowercase" />
                  <Switch checked={removeAllCaps} onChange={setRemoveAllCaps} label="Remove ALL CAPS Lines" />
                  <Switch checked={stripInlineTimes} onChange={setStripInlineTimes} label="Strip Inline Times [00:12]" />
                  <Switch checked={filterProfanity} onChange={setFilterProfanity} label="Filter Profanity" />
                  <Switch checked={splitLongLines} onChange={setSplitLongLines} label="Split Long Lines (> 45 chars)" />
                  <Switch checked={convertToVtt} onChange={setConvertToVtt} label="Convert to VTT Format (Web)" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Time Shift (Milliseconds)</span>
                    <input 
                      type="text" 
                      placeholder="-500 or 1000"
                      value={timeShift}
                      onChange={(e) => setTimeShift(e.target.value)}
                      className="w-full bg-luxury-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-primary"
                    />
                    <span className="text-[9px] text-slate-500 block">-500 (earlier), 1000 (later)</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Find & Replace</span>
                    <textarea 
                      placeholder="Find | Replace"
                      rows={1}
                      value={findReplaceText}
                      onChange={(e) => setFindReplaceText(e.target.value)}
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
                        value={wrongTime1}
                        onChange={(e) => setWrongTime1(e.target.value)}
                        className="w-full bg-luxury-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-primary font-mono"
                      />
                      <input 
                        type="text" 
                        placeholder="Point 1: Correct Time"
                        value={correctTime1}
                        onChange={(e) => setCorrectTime1(e.target.value)}
                        className="w-full bg-luxury-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-primary font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <input 
                        type="text" 
                        placeholder="Point 2: Wrong Time"
                        value={wrongTime2}
                        onChange={(e) => setWrongTime2(e.target.value)}
                        className="w-full bg-luxury-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-primary font-mono"
                      />
                      <input 
                        type="text" 
                        placeholder="Point 2: Correct Time"
                        value={correctTime2}
                        onChange={(e) => setCorrectTime2(e.target.value)}
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
                    value={specificWords}
                    onChange={(e) => setSpecificWords(e.target.value)}
                    className="w-full bg-luxury-950 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-primary resize-y"
                  />
                  <span className="text-[9px] text-slate-500 block">Comma-separated values</span>
                </div>
              </div>

              {/* 6. Action Button */}
              <button 
                onClick={handleCleanSRT}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-widest rounded-2xl transition shadow-lg shadow-red-500/10 text-xs sm:text-sm"
              >
                Clean Subtitles
              </button>

              {/* 7. Success Banner */}
              {isCleaned && (
                <div className="border border-emerald-500/20 bg-emerald-500/5 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-wider">Success!</h3>
                    <p className="text-xs text-slate-400 mt-1">Your subtitle has been cleaned and optimized.</p>
                  </div>
                  <button 
                    onClick={triggerDownload}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-wider text-xs rounded-xl flex items-center gap-2 transition shadow-lg shadow-emerald-500/10"
                  >
                    <Download className="w-4 h-4" /> Download File
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
