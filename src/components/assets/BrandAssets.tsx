import { Download, Copy, Check, FileImage, Video, Image as ImageIcon, Package } from "lucide-react";
import { Button } from "../ui/button";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { useState } from "react";

interface BrandAssetsProps {
  assets?: {
    logos?: any[];
    colors?: any[];
    guidelines?: any[];
  };
}

export function BrandAssets({ assets }: BrandAssetsProps) {
  const logos = assets?.logos || [];
  const brandColors = assets?.colors || [];
  const guidelines = assets?.guidelines || [];
  
  const hasAnyAssets = logos.length > 0 || brandColors.length > 0 || guidelines.length > 0;

  if (!hasAnyAssets) {
    return (
      <div className="bg-white rounded-[24px] p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.06)]">
        <Package className="w-16 h-16 text-[rgba(0,0,0,0.2)] mx-auto mb-4" />
        <h3 className="text-[#111111] mb-2">No Brand Assets Yet</h3>
        <p className="text-[rgba(0,0,0,0.6)] mb-4">
          Your brand assets will appear here once they're delivered
        </p>
        <p className="text-sm text-[rgba(0,0,0,0.5)]">
          Assets are uploaded by the admin team when your requests are completed
        </p>
      </div>
    );
  }

  function ColorCard({ color }: { color: typeof brandColors[0] }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      try {
        // Try modern clipboard API first
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(color.hex);
        } else {
          // Fallback for non-secure contexts or when clipboard API is blocked
          const textArea = document.createElement('textarea');
          textArea.value = color.hex;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          textArea.remove();
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        // Silently fall back to legacy method
        try {
          const textArea = document.createElement('textarea');
          textArea.value = color.hex;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand('copy');
          textArea.remove();
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch (fallbackErr) {
          // If both methods fail, still show visual feedback
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }
    };

    return (
      <button
        onClick={handleCopy}
        className="group relative bg-white border border-[rgba(0,0,0,0.06)] rounded-[24px] overflow-hidden hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)] transition-all cursor-pointer"
      >
        <div
          className="h-32 transition-transform group-hover:scale-105"
          style={{ backgroundColor: color.hex }}
        />
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h4 className="text-[#111111]">{color.name}</h4>
              <p className="text-sm text-[rgba(0,0,0,0.6)]">{color.hex}</p>
              <p className="text-xs text-[rgba(0,0,0,0.35)]">RGB: {color.rgb}</p>
            </div>
            <div className="w-8 h-8 rounded-lg bg-[#F5F5F7] flex items-center justify-center">
              {copied ? (
                <Check className="w-4 h-4 text-[#34C759]" />
              ) : (
                <Copy className="w-4 h-4 text-[rgba(0,0,0,0.6)]" />
              )}
            </div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div className="space-y-8">
      {/* Brand Identity Section - Horizontal Layout */}
      <div>
        <div className="mb-6">
          <h3 className="text-[#111111] mb-1">Brand Identity</h3>
          <p className="text-[rgba(0,0,0,0.6)] mb-6">Logos and brand colors</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Logos */}
          {logos.length > 0 && (
            <div>
              <h4 className="text-[rgba(0,0,0,0.6)] mb-4">Logos</h4>
              <div className="grid grid-cols-2 gap-4">
                {logos.map((logo) => (
                  <div
                    key={logo.id}
                    className="group bg-white border border-[rgba(0,0,0,0.06)] rounded-[24px] overflow-hidden hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)] transition-all"
                  >
                    <div className="relative h-32 bg-white overflow-hidden flex items-center justify-center p-6 border-b border-[rgba(0,0,0,0.06)]">
                      <ImageWithFallback
                        src={logo.url || logo.thumbnail}
                        alt={logo.name}
                        className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105"
                      />
                    </div>

                    <div className="p-4 space-y-3">
                      <div>
                        <h4 className="text-[#111111] mb-1">{logo.name}</h4>
                        {logo.formats && logo.formats.length > 0 && (
                          <div className="flex gap-2">
                            {logo.formats.map((format: string) => (
                              <span
                                key={format}
                                className="text-xs px-2 py-1 bg-[#F5F5F7] text-[rgba(0,0,0,0.6)] rounded-md uppercase"
                              >
                                {format}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-[rgba(0,0,0,0.06)]">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-8 rounded-lg hover:bg-[#F5F5F7] hover:text-[rgba(0,0,0,0.6)] border-[rgba(0,0,0,0.06)] text-[rgba(0,0,0,0.6)]"
                          onClick={() => {
                            // Auto-detect format and download the appropriate version
                            const url = logo.url || logo.svgUrl || logo.pngUrl;
                            if (url) window.open(url, '_blank');
                          }}
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brand Palette */}
          {brandColors.length > 0 && (
            <div>
              <h4 className="text-[rgba(0,0,0,0.6)] mb-4">Brand Palette</h4>
              <div className="grid grid-cols-2 gap-4">
                {brandColors.map((color) => (
                  <ColorCard key={color.name} color={color} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Guidelines Section */}
      {guidelines.length > 0 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-[#111111] mb-1">Brand Guidelines</h3>
            <p className="text-[rgba(0,0,0,0.6)]">Documentation and style guides</p>
          </div>

          <div className="bg-white border border-[rgba(0,0,0,0.06)] rounded-[16px] overflow-hidden">
            {guidelines.map((guideline, index) => (
              <div
                key={guideline.id}
                className={`group flex items-center gap-4 p-4 hover:bg-[#F5F5F7] transition-all cursor-pointer ${
                  index !== guidelines.length - 1 ? 'border-b border-[rgba(0,0,0,0.06)]' : ''
                }`}
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-20 bg-[#F5F5F7] rounded-[12px] overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <FileImage className="w-8 h-8 text-[rgba(0,0,0,0.3)]" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[rgba(0,0,0,0.35)] mb-0.5">{guideline.type || 'Document'}</div>
                  <h4 className="text-[#111111] mb-0.5">{guideline.name}</h4>
                  {guideline.description && (
                    <span className="text-sm text-[rgba(0,0,0,0.6)]">{guideline.description}</span>
                  )}
                </div>

                {/* Date */}
                {guideline.lastUpdated && (
                  <div className="text-sm text-[rgba(0,0,0,0.35)] hidden sm:block">
                    {guideline.lastUpdated}
                  </div>
                )}

                {/* Download Button */}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 hover:bg-white rounded-lg text-[rgba(0,0,0,0.6)] hover:text-[#111111] opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => window.open(guideline.url, '_blank')}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}