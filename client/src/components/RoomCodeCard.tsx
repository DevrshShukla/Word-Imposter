import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  code: string;
}

export const RoomCodeCard: React.FC<Props> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const inviteUrl = `${window.location.origin}?code=${code}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCodeOnly = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
          Room Invitation Code
        </div>
        <div className="flex items-center space-x-3">
          <span className="font-mono text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-indigo-400 tracking-wider">
            {code}
          </span>
          <button
            onClick={handleCopyCodeOnly}
            className="text-xs text-slate-400 hover:text-slate-200 transition underline underline-offset-2"
          >
            Copy code
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={handleCopy}
          className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-md shadow-indigo-950/40"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Link Copied!' : 'Copy Invite Link'}</span>
        </button>
      </div>
    </div>
  );
};
