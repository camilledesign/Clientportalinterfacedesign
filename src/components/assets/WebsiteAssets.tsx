import { ExternalLink, Download, Globe, Package } from "lucide-react";
import { Button } from "../ui/button";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface WebsiteAssetsProps {
  assets?: any[];
}

export function WebsiteAssets({ assets = [] }: WebsiteAssetsProps) {
  if (!assets || assets.length === 0) {
    return (
      <div className="bg-white rounded-[24px] p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.06)]">
        <Package className="w-16 h-16 text-[rgba(0,0,0,0.2)] mx-auto mb-4" />
        <h3 className="text-[#111111] mb-2">No Website Assets Yet</h3>
        <p className="text-[rgba(0,0,0,0.6)] mb-4">
          Your website designs and files will appear here once they're delivered
        </p>
        <p className="text-sm text-[rgba(0,0,0,0.5)]">
          Assets are uploaded by the admin team when your requests are completed
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {assets.map((site) => (
        <div
          key={site.id}
          className="group bg-white border border-[rgba(0,0,0,0.06)] rounded-[24px] overflow-hidden hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)] transition-all"
        >
          <div className="relative aspect-[16/10] bg-[#F5F5F7] overflow-hidden">
            <ImageWithFallback
              src={site.thumbnail}
              alt={site.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          <div className="p-4 space-y-3">
            <div>
              <h3 className="text-[#111111] mb-1">{site.name}</h3>
              <div className="flex items-center gap-1.5 text-[rgba(0,0,0,0.6)]">
                <Globe className="w-3.5 h-3.5" />
                <span className="text-sm">{site.url}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[rgba(0,0,0,0.06)]">
              <span className="text-sm text-[rgba(0,0,0,0.35)]">{site.lastUpdated}</span>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-8 px-3 hover:bg-[#F5F5F7] rounded-lg"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="h-8 px-3 hover:bg-[#F5F5F7] rounded-lg"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}