import React, { useState } from 'react';
import { 
  Github, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  X, 
  Code, 
  Sparkles, 
  FileText 
} from 'lucide-react';

interface GitHubPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Resolve the standalone HTML relative to the current page (GitHub Pages subpaths work)
const standaloneHref = new URL('index-github-pages.html', window.location.href).href;

export const GitHubPagesModal: React.FC<GitHubPagesModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(standaloneHref);
      const htmlText = await res.text();
      
      const blob = new Blob([htmlText], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'index.html';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not download file automatically. You can copy the code instead.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      const res = await fetch(standaloneHref);
      const htmlText = await res.text();
      await navigator.clipboard.writeText(htmlText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('Could not copy to clipboard.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Github className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">Host on GitHub Pages</h3>
              <p className="text-xs text-slate-400">1 single HTML file • Zero backend required</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            This entire chat application has been converted into a <strong>self-contained single-page HTML file (<code className="text-amber-300 font-mono">index.html</code>)</strong>. It connects in real time using client-side MQTT WebSockets and WebCrypto AES-256 with <strong>only a passkey to join</strong>.
          </p>

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all active:scale-[0.99]"
            >
              <Download className="w-4 h-4" />
              {downloading ? 'Downloading...' : 'Download index.html'}
            </button>

            <button
              onClick={handleCopyCode}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied HTML!' : 'Copy 1-Page HTML'}
            </button>
          </div>

          {/* Step by step guide */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-3">
            <div className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              How to Deploy on GitHub Pages (2 Minutes)
            </div>

            <ol className="text-xs text-slate-300 space-y-2 list-decimal list-inside leading-relaxed">
              <li>
                Create a new repository on <span className="font-semibold text-white">GitHub</span> (e.g. <code className="text-indigo-400 font-mono">passchat</code>).
              </li>
              <li>
                Upload the downloaded <code className="text-amber-300 font-mono">index.html</code> into the root of your repository.
              </li>
              <li>
                Go to <span className="font-semibold text-white">Settings</span> → <span className="font-semibold text-white">Pages</span> → Set Branch to <code className="text-indigo-400 font-mono">main</code> / <code className="text-indigo-400 font-mono">/ (root)</code> and click <span className="font-semibold text-white">Save</span>.
              </li>
            </ol>
          </div>

          {/* Direct link preview */}
          <div className="flex items-center justify-between text-xs pt-1">
            <a
              href={standaloneHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open standalone 1-page HTML preview
            </a>
            <span className="text-slate-500 font-mono text-[11px]">index-github-pages.html</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
