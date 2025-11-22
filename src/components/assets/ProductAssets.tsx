import { ExternalLink, Clock, Package } from "lucide-react";
import { Button } from "../ui/button";
import { ImageWithFallback } from "../figma/ImageWithFallback";

interface ProductAssetsProps {
  assets?: {
    figmaLinks?: any[];
    changelog?: any[];
  };
}

export function ProductAssets({ assets }: ProductAssetsProps) {
  const figmaBoards = assets?.figmaLinks || [];
  const changelog = assets?.changelog || [];
  
  const hasAnyAssets = figmaBoards.length > 0 || changelog.length > 0;

  if (!hasAnyAssets) {
    return (
      <div className="bg-white rounded-[24px] p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.06)]">
        <Package className="w-16 h-16 text-[rgba(0,0,0,0.2)] mx-auto mb-4" />
        <h3 className="text-[#111111] mb-2">No Product Assets Yet</h3>
        <p className="text-[rgba(0,0,0,0.6)] mb-4">
          Your product designs and files will appear here once they're delivered
        </p>
        <p className="text-sm text-[rgba(0,0,0,0.5)]">
          Assets are uploaded by the admin team when your requests are completed
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Figma Boards */}
      <div>
        <h3 className="text-[#111111] mb-4">Figma Boards</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {figmaBoards.map((board) => (
            <div
              key={board.id}
              className="group bg-white border border-[rgba(0,0,0,0.06)] rounded-[24px] overflow-hidden hover:shadow-[0_18px_40px_rgba(0,0,0,0.10)] transition-all"
            >
              <div className="relative aspect-[16/10] bg-[#F5F5F7] overflow-hidden">
                <ImageWithFallback
                  src={board.thumbnail}
                  alt={board.name}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h4 className="text-[#111111] mb-1">{board.name}</h4>
                  <span className="text-sm text-[rgba(0,0,0,0.6)]">Figma Board</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-[rgba(0,0,0,0.06)]">
                  <span className="text-sm text-[rgba(0,0,0,0.35)]">{board.lastUpdated}</span>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8 px-3 hover:bg-[#F5F5F7] rounded-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Changelog */}
      <div>
        <h3 className="text-[#111111] mb-4">Changelog</h3>
        <div className="space-y-3">
          {changelog.map((entry) => (
            <div
              key={entry.id}
              className="bg-white border border-[rgba(0,0,0,0.06)] rounded-[24px] p-5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-[#F5F5F7] text-[#111111] text-sm">
                      {entry.version}
                    </span>
                    <h4 className="text-[#111111]">{entry.title}</h4>
                  </div>
                  
                  <ul className="space-y-1 pl-4">
                    {entry.changes.map((change, idx) => (
                      <li key={idx} className="text-sm text-[rgba(0,0,0,0.6)] list-disc">
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-1.5 text-[rgba(0,0,0,0.35)] text-sm whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5" />
                  {entry.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}