/**
 * ShareMenu Component
 * 
 * Share menu for Discover items (Twitter, LinkedIn, Email, Copy link, Export PDF)
 */

import { useState } from 'react';
import { Share2, Twitter, Linkedin, Mail, Link as LinkIcon, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ShareMenuProps {
  item: {
    id: string;
    title: string;
    summary: string;
    url?: string;
  };
  onShare?: (platform: string) => void;
}

export default function ShareMenu({ item, onShare }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = item.url || `${window.location.origin}/discover/${item.id}`;
  const shareText = `${item.title} - ${item.summary.substring(0, 100)}...`;

  const handleShare = async (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(shareText);

    switch (platform) {
      case 'twitter':
        window.open(
          `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
          '_blank',
          'width=550,height=420'
        );
        break;
      case 'linkedin':
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
          '_blank',
          'width=550,height=420'
        );
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(item.title)}&body=${encodedText}%20${encodedUrl}`;
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          toast.success('Link copied to clipboard');
          setTimeout(() => setCopied(false), 2000);
        } catch (err) {
          toast.error('Failed to copy link');
        }
        break;
      case 'pdf':
        // Generate PDF (client-side)
        try {
          const PDF = await loadJsPDF();
          const doc = new PDF();
          
          doc.setFontSize(18);
          doc.text(item.title, 10, 20);
          
          doc.setFontSize(12);
          const splitSummary = doc.splitTextToSize(item.summary, 180);
          doc.text(splitSummary, 10, 35);
          
          doc.text(`Source: ${shareUrl}`, 10, doc.internal.pageSize.height - 10);
          
          doc.save(`${item.title.substring(0, 50)}.pdf`);
          toast.success('PDF downloaded');
        } catch (err) {
          console.error('PDF generation error:', err);
          toast.error('Failed to generate PDF');
        }
        break;
    }

    if (onShare) {
      onShare(platform);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-white/5 text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
        title="Share"
        aria-label="Share item"
      >
        <Share2 className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="py-1">
              <button
                onClick={() => handleShare('twitter')}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <Twitter className="w-4 h-4 text-blue-400" />
                Share on Twitter
              </button>
              <button
                onClick={() => handleShare('linkedin')}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <Linkedin className="w-4 h-4 text-blue-500" />
                Share on LinkedIn
              </button>
              <button
                onClick={() => handleShare('email')}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <Mail className="w-4 h-4 text-slate-400" />
                Share via Email
              </button>
              <div className="border-t border-white/10 my-1" />
              <button
                onClick={() => handleShare('copy')}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-400" />
                    Copied!
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4 text-slate-400" />
                    Copy Link
                  </>
                )}
              </button>
              <button
                onClick={() => handleShare('pdf')}
                className="w-full px-4 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
              >
                <FileText className="w-4 h-4 text-slate-400" />
                Export as PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
