import { X, Download, ExternalLink, FileText, Image as ImageIcon } from "lucide-react";
import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface BriefData {
  requestType: string;
  category: "Brand" | "Website" | "Product";
  title: string;
  date: string;
  // Common fields
  description?: string;
  // Website specific
  websiteType?: string;
  pages?: string;
  goal?: string;
  copyStatus?: string;
  // Brand specific
  brandName?: string;
  tagline?: string;
  audience?: string;
  competitors?: string;
  assetType?: string;
  format?: string;
  // Product specific
  platform?: string[];
  featureName?: string;
  userStory?: string;
  screenName?: string;
  currentIssue?: string;
  priority?: string;
  // Attachments
  images?: string[];
  pdfs?: { name: string; url: string }[];
  links?: string[];
}

interface BriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  brief: BriefData;
}

export function BriefModal({ isOpen, onClose, brief }: BriefModalProps) {
  if (!isOpen) return null;

  const renderField = (label: string, value: string | string[] | undefined) => {
    if (!value) return null;
    
    const displayValue = Array.isArray(value) ? value.join(", ") : value;
    
    return (
      <div className="mb-4">
        <div className="text-sm text-[rgba(0,0,0,0.5)] mb-1">{label}</div>
        <div className="text-[#111111]">{displayValue}</div>
      </div>
    );
  };

  const renderAttachments = () => {
    const hasImages = brief.images && brief.images.length > 0;
    const hasPdfs = brief.pdfs && brief.pdfs.length > 0;
    const hasLinks = brief.links && brief.links.length > 0;

    if (!hasImages && !hasPdfs && !hasLinks) return null;

    return (
      <div className="mt-8 pt-6 border-t-2 border-[#F5F5F7] space-y-6">
        {/* Images */}
        {hasImages && (
          <div>
            <div className="text-sm text-[rgba(0,0,0,0.5)] mb-3">Reference Images</div>
            <div className="grid grid-cols-2 gap-3">
              {brief.images.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-video bg-[#F5F5F7] rounded-[12px] overflow-hidden border border-[rgba(0,0,0,0.06)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] transition-all"
                >
                  <ImageWithFallback
                    src={url}
                    alt={`Reference ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-full p-2">
                      <ExternalLink className="w-4 h-4 text-[#111111]" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* PDFs */}
        {hasPdfs && (
          <div>
            <div className="text-sm text-[rgba(0,0,0,0.5)] mb-3">Documents</div>
            <div className="space-y-2">
              {brief.pdfs.map((pdf, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-[#F5F5F7] rounded-[12px] border border-[rgba(0,0,0,0.06)] hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-[8px] flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#111111] truncate">{pdf.name}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.5)]">PDF Document</div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-3 text-[#111111] hover:text-[rgba(0,0,0,0.6)] hover:bg-[#F5F5F7] rounded-lg transition-all"
                      onClick={() => window.open(pdf.url, '_blank')}
                    >
                      Preview
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 text-[#111111] hover:text-[rgba(0,0,0,0.6)] hover:bg-[#F5F5F7] rounded-lg transition-all"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = pdf.url;
                        a.download = pdf.name;
                        a.click();
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {hasLinks && (
          <div>
            <div className="text-sm text-[rgba(0,0,0,0.5)] mb-3">Reference Links</div>
            <div className="space-y-2">
              {brief.links.map((url, index) => (
                <a
                  key={index}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-[#F5F5F7] rounded-[12px] border border-[rgba(0,0,0,0.06)] hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all group"
                >
                  <div className="w-10 h-10 bg-white rounded-[8px] flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="w-5 h-5 text-[#0071E3]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[#0071E3] group-hover:text-[#0077ED] truncate">{url}</div>
                    <div className="text-xs text-[rgba(0,0,0,0.5)]">External Link</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred Background */}
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* A4 Paper */}
      <div className="relative bg-white rounded-[8px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] max-w-[595px] w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-[#F5F5F7] hover:bg-[#E5E5E7] flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5 text-[#111111]" />
        </button>

        {/* Paper Content - Scrollable */}
        <div className="overflow-y-auto max-h-[90vh] p-12">
          {/* Header */}
          <div className="mb-8 pb-6 border-b-2 border-[#F5F5F7]">
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                brief.category === "Brand" ? "bg-purple-100 text-purple-700" :
                brief.category === "Website" ? "bg-blue-100 text-blue-700" :
                "bg-green-100 text-green-700"
              }`}>
                {brief.category}
              </span>
              <span className="text-sm text-[rgba(0,0,0,0.5)]">{brief.date}</span>
            </div>
            <h2 className="text-[28px] text-[#111111] mb-2">{brief.title}</h2>
            <div className="text-sm text-[rgba(0,0,0,0.5)]">Request Type: {brief.requestType}</div>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Website Brief */}
            {brief.category === "Website" && (
              <>
                {renderField("Website Type", brief.websiteType)}
                {renderField("Pages Needed", brief.pages)}
                {renderField("Primary Goal", brief.goal)}
                {renderField("Copy Status", brief.copyStatus)}
                {renderField("Description", brief.description)}
              </>
            )}

            {/* Brand Brief */}
            {brief.category === "Brand" && (
              <>
                {renderField("Brand Name", brief.brandName)}
                {renderField("Tagline", brief.tagline)}
                {renderField("Target Audience", brief.audience)}
                {renderField("Competitors", brief.competitors)}
                {renderField("Asset Type", brief.assetType)}
                {renderField("Format", brief.format)}
                {renderField("Description", brief.description)}
              </>
            )}

            {/* Product Brief */}
            {brief.category === "Product" && (
              <>
                {renderField("Platform", brief.platform)}
                {renderField("Feature Name", brief.featureName)}
                {renderField("User Story", brief.userStory)}
                {renderField("Screen Name", brief.screenName)}
                {renderField("Current Issue", brief.currentIssue)}
                {renderField("Priority", brief.priority)}
                {renderField("Description", brief.description)}
              </>
            )}
          </div>

          {/* Attachments */}
          {renderAttachments()}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t-2 border-[#F5F5F7]">
            <Button
              onClick={onClose}
              className="w-full rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white py-6"
            >
              Close Brief
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}