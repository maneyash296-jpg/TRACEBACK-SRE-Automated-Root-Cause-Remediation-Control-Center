import React, { useState, useEffect } from 'react';

interface CodeViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePath: string;
  targetLine?: number;
}

export const CodeViewerModal: React.FC<CodeViewerModalProps> = ({
  isOpen,
  onClose,
  filePath,
  targetLine,
}) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !filePath) return;

    const fetchFile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/projects/active/file?path=${encodeURIComponent(filePath)}`);
        if (!res.ok) {
          throw new Error(`Failed to load file (${res.status})`);
        }
        const data = await res.json();
        setContent(data.content || '');
      } catch (err: any) {
        setError(err.message || 'Failed to read file content');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [isOpen, filePath]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard?.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = content.split('\n');

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-[#0b141c] border border-[#2d363e] rounded-xl w-full max-w-4xl max-h-[85vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#141c24] border-b border-[#182028] px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <span className="material-symbols-outlined text-[#418fff] text-[20px]">description</span>
            <span className="font-code-sm font-semibold text-[#dae3ee] truncate">{filePath}</span>
            <span className="font-code-sm text-[#8b919f] text-xs">({lines.length} lines)</span>
            {targetLine && (
              <span className="font-code-sm text-xs bg-[#222b33] text-[#ffb4ab] border border-[#ffb4ab]/30 px-2 py-0.5 rounded">
                Line {targetLine}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="font-code-sm text-xs bg-[#222b33] hover:bg-[#2d363e] border border-[#2d363e] text-[#dae3ee] px-2.5 py-1 rounded flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">
                {copied ? 'check' : 'content_copy'}
              </span>
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#8b919f] hover:text-[#dae3ee] p-1 rounded hover:bg-[#222b33] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="flex-1 overflow-y-auto font-mono text-xs leading-relaxed bg-[#060f16] p-4 select-text">
          {loading && (
            <div className="flex items-center justify-center py-20 text-[#8b919f] gap-2">
              <span className="material-symbols-outlined animate-spin text-[20px]">sync</span>
              <span>Loading AST source...</span>
            </div>
          )}

          {error && (
            <div className="p-6 text-center text-[#ffb4ab]">
              <span className="material-symbols-outlined text-[32px] mb-2">error</span>
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && (
            <div className="flex flex-col">
              {lines.map((line, idx) => {
                const lineNum = idx + 1;
                const isTarget = targetLine && targetLine === lineNum;
                return (
                  <div
                    key={idx}
                    className={`flex items-start py-0.5 px-2 rounded font-code-sm ${
                      isTarget ? 'bg-[#ba1a1a]/25 border-l-2 border-[#ffb4ab]' : 'hover:bg-[#141c24]'
                    }`}
                  >
                    <span className="w-12 shrink-0 select-none text-[#414753] text-right pr-4 font-mono">
                      {lineNum}
                    </span>
                    <pre className="text-[#dae3ee] font-mono whitespace-pre flex-1">
                      {line}
                    </pre>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#141c24] border-t border-[#182028] px-5 py-2 flex items-center justify-between text-[#8b919f] font-code-sm text-xs">
          <span>Python 3.11 AST Static Analysis</span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
};
