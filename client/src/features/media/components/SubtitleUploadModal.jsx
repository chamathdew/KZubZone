import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import apiClient from '@/services/api/apiClient';
import confetti from 'canvas-confetti';
import { useAuth } from '@/features/auth/hooks/useAuth';

const EMPTY_META = {};

export default function SubtitleUploadModal({ isOpen, onClose, mediaId, mediaType, targetMeta = EMPTY_META, onUploadSuccess }) {
  const { user, admin } = useAuth();
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('Sinhala');
  const [version, setVersion] = useState('1.0');
  const [seasonStatus] = useState('Ongoing'); // Always Ongoing; completion determined by backend episode count
  const [releaseNotes, setReleaseNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Adjust state inline during render when the modal opens or targets change
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setError('');
    }
  }

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      const ext = selected.name.split('.').pop().toLowerCase();
      if (!['srt', 'vtt', 'ass'].includes(ext)) {
        setError('Unsupported subtitle file. Please upload an SRT, VTT, or ASS file.');
        setFile(null);
        return;
      }
      setFile(selected);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a subtitle file to upload.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('subtitle', file);
    formData.append('mediaId', mediaId);
    formData.append('mediaType', mediaType);
    formData.append('language', language);
    formData.append('version', version);
    formData.append('releaseNotes', releaseNotes);
    formData.append('seasonStatus', seasonStatus);
    if (targetMeta.seasonNumber) formData.append('seasonNumber', targetMeta.seasonNumber);
    if (targetMeta.episodeNumber) formData.append('episodeNumber', targetMeta.episodeNumber);

    try {
      const endpoint = admin ? '/api/admin/subtitles/upload' : '/api/subtitles/upload';

      await apiClient.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(true);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });

      setTimeout(() => {
        setSuccess(false);
        setFile(null);
        setReleaseNotes('');
        onUploadSuccess?.();
        onClose();
      }, 1000);
    } catch (err) {
      const serverMsg = err.response?.data?.message || '';
      const diag = err.response?.data?.diagnostics;
      let errorText = serverMsg || 'Error uploading subtitle. Please try again.';
      if (diag) {
        errorText += ` [uploads_exists:${diag.uploads_dir_exists}, writable:${diag.uploads_dir_writable}, supabase:${diag.supabase_configured}]`;
      }
      setError(errorText);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-md bg-luxury-900 border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden z-10"
      >
        {/* Glow Header */}
        <div className="absolute -left-12 -top-12 w-28 h-28 bg-brand-primary/10 rounded-full blur-2xl" />

        <div className="flex items-center justify-between mb-4 relative z-10">
          <div>
            <h2 className="text-lg font-bold text-white">Upload Subtitle</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Sinhala and English only{targetMeta.label ? ` • ${targetMeta.label}` : ''}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-white/5 text-slate-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="flex flex-col items-center justify-center py-10 text-center relative z-10">
            <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4 animate-bounce" />
              <h3 className="text-base font-bold text-white mb-2">Subtitle Submitted!</h3>
            <p className="text-xs text-slate-400 max-w-xs">
              {admin
                ? 'Admin subtitle upload was published immediately.'
                : 'Thank you for contributing. Your translation is now in the moderation review queue.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10 text-left">
            {error && (
              <div className="p-3 bg-brand-secondary/15 border border-brand-secondary/30 rounded-xl text-brand-secondary text-xs font-semibold">
                {error}
              </div>
            )}

            {/* File Drag Area */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Subtitle File (.srt, .vtt, .ass)</label>
              <div className="relative border border-dashed border-white/10 hover:border-brand-primary/40 rounded-2xl p-6 flex flex-col items-center justify-center bg-white/[0.02] cursor-pointer transition">
                <input
                  type="file"
                  accept=".srt,.vtt,.ass"
                  onChange={handleFileChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {file ? (
                  <div className="flex flex-col items-center text-center">
                    <FileText className="w-8 h-8 text-brand-primary mb-2" />
                    <p className="text-xs font-semibold text-white truncate max-w-[250px]">{file.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs text-slate-300 font-medium">Click or drag subtitle file here</p>
                    <p className="text-[10px] text-slate-500 mt-1">SRT, VTT, or ASS files (max 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* Input Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-white/5 bg-luxury-800 text-xs text-white focus:outline-none focus:border-brand-primary"
                >
                  <option value="Sinhala">Sinhala</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Version / Synced Release</label>
                <input
                  type="text"
                  placeholder="e.g. 1.0 (WEB-DL)"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-white/5 bg-luxury-800 text-xs text-white focus:outline-none focus:border-brand-primary"
                />
              </div>
            </div>

            {mediaType === 'Episode' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Season</label>
                  <div className="h-10 px-3 rounded-xl border border-white/5 bg-luxury-800 text-xs text-white flex items-center">
                    S{targetMeta.seasonNumber || 1}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Episode</label>
                  <div className="h-10 px-3 rounded-xl border border-white/5 bg-luxury-800 text-xs text-white flex items-center">
                    E{targetMeta.episodeNumber || 1}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 block">Release Notes (Optional)</label>
              <textarea
                placeholder="List subtitle sync/source notes (NF, Viki, WEB-DL, etc.)"
                value={releaseNotes}
                onChange={(e) => setReleaseNotes(e.target.value)}
                rows={3}
                className="w-full p-3 rounded-xl border border-white/5 bg-luxury-800 text-xs text-white focus:outline-none focus:border-brand-primary resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-brand-primary hover:bg-brand-primary/80 disabled:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-brand-primary/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Uploading Subtitle...
                </>
              ) : (
                admin ? 'Publish Subtitle' : 'Submit Subtitle'
              )}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
