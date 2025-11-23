import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { WebsiteAssets } from "./assets/WebsiteAssets";
import { BrandAssets } from "./assets/BrandAssets";
import { ProductAssets } from "./assets/ProductAssets";
import { getUserAssets } from "../utils/api";
import { handlePossibleSessionError } from "../utils/supabase/errors";

interface AssetsLibraryProps {
  globalRefreshToken?: number;
}

export function AssetsLibrary({ globalRefreshToken = 0 }: AssetsLibraryProps) {
  const [activeTab, setActiveTab] = useState("brand");
  const [assets, setAssets] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch assets function - defined outside useEffect so it can be called from error handler
  const fetchAssets = async () => {
    let isMounted = true;

    try {
      setLoading(true);
      setError("");
      
      console.log('🔵 AssetsLibrary: Fetching assets...');
      
      // Fetch assets using API helper
      const result = await getUserAssets();
      
      if (!isMounted) return;
      
      console.log('✅ AssetsLibrary: Fetched assets:', result.assets);
      
      setAssets(result.assets);
    } catch (err: any) {
      if (!isMounted) return;
      
      // Check if it's a session error
      if (handlePossibleSessionError(err)) {
        // Session expired - global handler will redirect to login
        return;
      }
      
      console.error("❌ AssetsLibrary: Error fetching assets:", err);
      setError(err.message || "Failed to load assets");
    } finally {
      if (!isMounted) return;
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  };

  useEffect(() => {
    fetchAssets();
  }, [globalRefreshToken]); // Re-fetch when globalRefreshToken changes

  if (loading) {
    return (
      <section className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h2 className="text-[#111111] mb-2">Your Assets Library</h2>
          <p className="text-[rgba(0,0,0,0.6)]">All your delivered work organized by category</p>
        </div>
        <div className="bg-white rounded-[16px] p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-[rgba(0,0,0,0.06)]">
          <p className="text-[rgba(0,0,0,0.6)]">Loading assets...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h2 className="text-[#111111] mb-2">Your Assets Library</h2>
          <p className="text-[rgba(0,0,0,0.6)]">All your delivered work organized by category</p>
        </div>
        <div className="bg-red-50 rounded-[16px] p-6 border border-red-200">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchAssets}
            className="mt-3 text-sm text-[#0071E3] hover:text-[#0077ED] transition-colors"
          >
            Try again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-[#111111] mb-2">Your Assets Library</h2>
        <p className="text-[rgba(0,0,0,0.6)]">All your delivered work organized by category</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-[#F5F5F7] p-1 rounded-full border-0 gap-2">
          <TabsTrigger 
            value="brand"
            className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
          >
            Brand
          </TabsTrigger>
          <TabsTrigger 
            value="website" 
            className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
          >
            Website
          </TabsTrigger>
          <TabsTrigger 
            value="product"
            className="rounded-full px-6 data-[state=active]:bg-white data-[state=active]:shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
          >
            Product
          </TabsTrigger>
        </TabsList>

        <TabsContent value="brand" className="mt-6">
          <BrandAssets assets={assets?.brandAssets} />
        </TabsContent>

        <TabsContent value="website" className="mt-6">
          <WebsiteAssets assets={assets?.websiteAssets} />
        </TabsContent>

        <TabsContent value="product" className="mt-6">
          <ProductAssets assets={assets?.productAssets} />
        </TabsContent>
      </Tabs>
    </section>
  );
}