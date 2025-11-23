import { useState, useEffect } from "react";
import { ArrowLeft, Upload, Download, ExternalLink, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { Button } from "../ui/button";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import { getClient, getClientAssets, updateClientAssets, uploadFile, updateClient, updateUserPassword, createMetadataAsset, updateMetadataAsset } from "../../utils/api";
import { Input } from "../ui/input";

interface AdminClientDetailProps {
  clientId: string;
  onBack: () => void;
  globalRefreshToken?: number;
}

const tabs = ["Brand", "Website", "Product", "Notes", "Settings"];

export function AdminClientDetail({ clientId, onBack, globalRefreshToken = 0 }: AdminClientDetailProps) {
  const [activeTab, setActiveTab] = useState("Brand");
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);
  const [assets, setAssets] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [editingColor, setEditingColor] = useState<number | null>(null);
  const [colorForm, setColorForm] = useState({ name: '', hex: '#' });

  // Website state
  const [showWebsiteForm, setShowWebsiteForm] = useState(false);
  const [editingWebsite, setEditingWebsite] = useState<string | null>(null);
  const [websiteForm, setWebsiteForm] = useState({ name: '', url: '', thumbnail: '' });

  // Product state
  const [showFigmaForm, setShowFigmaForm] = useState(false);
  const [editingFigma, setEditingFigma] = useState<string | null>(null);
  const [figmaForm, setFigmaForm] = useState({ name: '', url: '' });
  const [showChangelogForm, setShowChangelogForm] = useState(false);
  const [editingChangelog, setEditingChangelog] = useState<string | null>(null);
  const [changelogForm, setChangelogForm] = useState({ date: '', note: '' });

  // Notes state
  const [notes, setNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  
  // Loading states for various operations to prevent stuck UI
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadClientData();
  }, [clientId, globalRefreshToken]); // Re-fetch when clientId or globalRefreshToken changes

  const loadClientData = async () => {
    let isMounted = true; // Track if component is still mounted

    try {
      setLoading(true);
      console.log('🔄 Loading client data for ID:', clientId);
      
      const [clientData, assetsData] = await Promise.all([
        getClient(clientId),
        getClientAssets(clientId)
      ]);
      
      // Only update state if component is still mounted
      if (!isMounted) return;
      
      console.log('✅ Client data loaded:', clientData);
      console.log('✅ Assets data loaded:', assetsData);
      
      setClient(clientData.client);
      setAssets(assetsData);
    } catch (error: any) {
      if (!isMounted) return;
      
      console.error('❌ Error loading client data:', {
        clientId,
        error: error.message,
        stack: error.stack
      });
      
      // Initialize with empty data instead of failing
      setClient({ id: clientId, name: 'Client', email: '' });
      setAssets({
        brandAssets: { logos: [], colors: [], guidelines: [] },
        websiteAssets: [],
        productAssets: { figmaLinks: [], changelog: [] }
      });
    } finally {
      if (!isMounted) return;
      setLoading(false);
    }

    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;
    };
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      console.log('🔵 Uploading logo for client:', clientId);
      
      // Use the correct uploadFile API with label and description
      const result = await uploadFile(clientId, file, 'Brand Logo', 'Main brand logo');
      
      console.log('✅ Logo uploaded successfully:', result);
      
      // Reload client data to show the new asset
      await loadClientData();
      
      alert('✅ Logo uploaded successfully!');
    } catch (error: any) {
      console.error('❌ Logo upload failed:', error);
      alert(`Failed to upload logo: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteLogo = async (logoId: string) => {
    if (!confirm('Are you sure you want to delete this logo?')) return;

    try {
      // Delete from database and storage
      const { deleteAsset } = await import('../../utils/api');
      await deleteAsset(logoId);

      // Reload client data to refresh assets
      await loadClientData();

      alert('✅ Logo deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting logo:', error);
      alert(`❌ Failed to delete logo: ${error.message}`);
    }
  };

  const handleAddColor = async () => {
    if (!colorForm.name || !colorForm.hex) {
      alert('Please enter both name and hex color');
      return;
    }

    try {
      // Convert hex to RGB
      const hex = colorForm.hex.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const rgb = `${r}, ${g}, ${b}`;

      // Create metadata asset in database
      // NO "Brand Color - " prefix - just use the name directly
      const description = `HEX: ${colorForm.hex} | RGB: ${rgb}`;
      await createMetadataAsset(clientId, colorForm.name, description);

      // Reload client data to refresh assets
      await loadClientData();

      setEditingColor(null);
      setColorForm({ name: '', hex: '#' });
      alert('✅ Color added successfully!');
    } catch (error: any) {
      console.error('Error adding color:', error);
      alert(`❌ Failed to add color: ${error.message}`);
    }
  };

  const handleEditColor = (index: number) => {
    const color = assets.brandAssets.colors[index];
    setEditingColor(index);
    setColorForm({ name: color.name, hex: color.hex });
  };

  const handleUpdateColor = async () => {
    if (!colorForm.name || !colorForm.hex) return;

    try {
      const color = assets.brandAssets.colors[editingColor!];
      
      // Convert hex to RGB
      const hex = colorForm.hex.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      const rgb = `${r}, ${g}, ${b}`;

      // Update metadata asset in database
      // NO "Brand Color - " prefix - just use the name directly
      const description = `HEX: ${colorForm.hex} | RGB: ${rgb}`;
      await updateMetadataAsset(color.id, {
        label: colorForm.name,
        description
      });

      // Reload client data to refresh assets
      await loadClientData();

      setEditingColor(null);
      setColorForm({ name: '', hex: '#' });
      alert('✅ Color updated successfully!');
    } catch (error: any) {
      console.error('Error updating color:', error);
      alert(`❌ Failed to update color: ${error.message}`);
    }
  };

  const handleDeleteColor = async (index: number) => {
    if (!confirm('Are you sure you want to delete this color?')) return;

    try {
      const color = assets.brandAssets.colors[index];
      
      // Delete from database
      const { deleteAsset } = await import('../../utils/api');
      await deleteAsset(color.id);

      // Reload client data to refresh assets
      await loadClientData();

      alert('✅ Color deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting color:', error);
      alert(`❌ Failed to delete color: ${error.message}`);
    }
  };

  const handleGuidelineUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      console.log('🔵 Uploading guideline for client:', clientId);
      
      // Upload using proper API
      await uploadFile(clientId, file, 'Brand Guidelines', `Complete brand style guide - ${file.name}`);
      
      // Reload client data to show the new asset
      await loadClientData();
      
      alert('✅ Guideline uploaded successfully!');
    } catch (error: any) {
      console.error('❌ Guideline upload failed:', error);
      alert(`Failed to upload guideline: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteGuideline = async (guidelineId: string) => {
    if (!confirm('Are you sure you want to delete this guideline?')) return;

    try {
      // Delete from database and storage
      const { deleteAsset } = await import('../../utils/api');
      await deleteAsset(guidelineId);

      // Reload client data to refresh assets
      await loadClientData();

      alert('✅ Guideline deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting guideline:', error);
      alert(`❌ Failed to delete guideline: ${error.message}`);
    }
  };

  // Website handlers
  const handleWebsiteThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const result = await uploadFile(file, 'make-a93d7fb4-assets', `${clientId}/websites/${file.name}`);
      setWebsiteForm({ ...websiteForm, thumbnail: result.url });
    } catch (error: any) {
      console.error('Error uploading thumbnail:', error);
      alert(`❌ Failed to upload thumbnail: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleAddWebsite = async () => {
    if (!websiteForm.name || !websiteForm.url) {
      alert('Please enter both name and URL');
      return;
    }

    try {
      // Create metadata asset in database
      const description = `URL: ${websiteForm.url}${websiteForm.thumbnail ? ' | With thumbnail' : ''}`;
      await createMetadataAsset(clientId, `Website - ${websiteForm.name}`, description);

      // Reload client data to refresh assets
      await loadClientData();

      setShowWebsiteForm(false);
      setWebsiteForm({ name: '', url: '', thumbnail: '' });
      alert('✅ Website asset added successfully!');
    } catch (error: any) {
      console.error('Error adding website:', error);
      alert(`❌ Failed to add website: ${error.message}`);
    }
  };

  const handleEditWebsite = (siteId: string) => {
    const site = assets.websiteAssets.find((s: any) => s.id === siteId);
    if (site) {
      setEditingWebsite(siteId);
      setWebsiteForm({ name: site.name, url: site.url, thumbnail: site.thumbnail || '' });
      setShowWebsiteForm(true);
    }
  };

  const handleUpdateWebsite = async () => {
    if (!websiteForm.name || !websiteForm.url) return;

    try {
      // Update metadata asset in database
      const description = `URL: ${websiteForm.url}${websiteForm.thumbnail ? ' | With thumbnail' : ''}`;
      await updateMetadataAsset(editingWebsite!, {
        label: `Website - ${websiteForm.name}`,
        description
      });

      // Reload client data to refresh assets
      await loadClientData();

      setShowWebsiteForm(false);
      setEditingWebsite(null);
      setWebsiteForm({ name: '', url: '', thumbnail: '' });
      alert('✅ Website asset updated successfully!');
    } catch (error: any) {
      console.error('Error updating website:', error);
      alert(`❌ Failed to update website: ${error.message}`);
    }
  };

  const handleDeleteWebsite = async (siteId: string) => {
    if (!confirm('Are you sure you want to delete this website asset?')) return;

    try {
      // Delete from database
      const { deleteAsset } = await import('../../utils/api');
      await deleteAsset(siteId);

      // Reload client data to refresh assets
      await loadClientData();

      alert('✅ Website asset deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting website:', error);
      alert(`❌ Failed to delete website: ${error.message}`);
    }
  };

  // Figma handlers
  const handleAddFigmaLink = async () => {
    if (!figmaForm.name || !figmaForm.url) {
      alert('Please enter both name and URL');
      return;
    }

    try {
      // Create metadata asset in database
      const description = `URL: ${figmaForm.url} | Figma design file`;
      await createMetadataAsset(clientId, `Figma - ${figmaForm.name}`, description);

      // Reload client data to refresh assets
      await loadClientData();

      setShowFigmaForm(false);
      setFigmaForm({ name: '', url: '' });
      alert('✅ Figma link added successfully!');
    } catch (error: any) {
      console.error('Error adding figma link:', error);
      alert(`❌ Failed to add figma link: ${error.message}`);
    }
  };

  const handleEditFigmaLink = (linkId: string) => {
    const link = assets.productAssets.figmaLinks.find((l: any) => l.id === linkId);
    if (link) {
      setEditingFigma(linkId);
      setFigmaForm({ name: link.name, url: link.url });
      setShowFigmaForm(true);
    }
  };

  const handleUpdateFigmaLink = async () => {
    if (!figmaForm.name || !figmaForm.url) return;

    try {
      // Update metadata asset in database
      const description = `URL: ${figmaForm.url} | Figma design file`;
      await updateMetadataAsset(editingFigma!, {
        label: `Figma - ${figmaForm.name}`,
        description
      });

      // Reload client data to refresh assets
      await loadClientData();

      setShowFigmaForm(false);
      setEditingFigma(null);
      setFigmaForm({ name: '', url: '' });
      alert('✅ Figma link updated successfully!');
    } catch (error: any) {
      console.error('Error updating figma link:', error);
      alert(`❌ Failed to update figma link: ${error.message}`);
    }
  };

  const handleDeleteFigmaLink = async (linkId: string) => {
    if (!confirm('Are you sure you want to delete this Figma link?')) return;

    try {
      // Delete from database
      const { deleteAsset } = await import('../../utils/api');
      await deleteAsset(linkId);

      // Reload client data to refresh assets
      await loadClientData();

      alert('✅ Figma link deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting figma link:', error);
      alert(`❌ Failed to delete figma link: ${error.message}`);
    }
  };

  // Changelog handlers
  const handleAddChangelog = async () => {
    if (!changelogForm.date || !changelogForm.note) {
      alert('Please enter both date and note');
      return;
    }

    try {
      // Create metadata asset in database
      await createMetadataAsset(clientId, `Changelog - ${changelogForm.date}`, changelogForm.note);

      // Reload client data to refresh assets
      await loadClientData();

      setShowChangelogForm(false);
      setChangelogForm({ date: '', note: '' });
      alert('✅ Changelog entry added successfully!');
    } catch (error: any) {
      console.error('Error adding changelog:', error);
      alert(`❌ Failed to add changelog: ${error.message}`);
    }
  };

  const handleEditChangelog = (entryId: string) => {
    const entry = assets.productAssets.changelog.find((e: any) => e.id === entryId);
    if (entry) {
      setEditingChangelog(entryId);
      // Extract date from version field and note from title field (from DB mapping)
      setChangelogForm({ date: entry.version || entry.date, note: entry.title || entry.note });
      setShowChangelogForm(true);
    }
  };

  const handleUpdateChangelog = async () => {
    if (!changelogForm.date || !changelogForm.note) return;

    try {
      // Update metadata asset in database
      await updateMetadataAsset(editingChangelog!, {
        label: `Changelog - ${changelogForm.date}`,
        description: changelogForm.note
      });

      // Reload client data to refresh assets
      await loadClientData();

      setShowChangelogForm(false);
      setEditingChangelog(null);
      setChangelogForm({ date: '', note: '' });
      alert('✅ Changelog entry updated successfully!');
    } catch (error: any) {
      console.error('Error updating changelog:', error);
      alert(`❌ Failed to update changelog: ${error.message}`);
    }
  };

  const handleDeleteChangelog = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this changelog entry?')) return;

    try {
      // Delete from database
      const { deleteAsset } = await import('../../utils/api');
      await deleteAsset(entryId);

      // Reload client data to refresh assets
      await loadClientData();

      alert('✅ Changelog entry deleted successfully!');
    } catch (error: any) {
      console.error('Error deleting changelog:', error);
      alert(`❌ Failed to delete changelog: ${error.message}`);
    }
  };

  // Notes handler
  const handleSaveNotes = async () => {
    try {
      setSavingNotes(true);
      const updatedClient = {
        ...client,
        notes
      };

      await updateClient(clientId, { notes });
      setClient(updatedClient);
      alert('✅ Notes saved successfully!');
    } catch (error: any) {
      console.error('Error saving notes:', error);
      alert(`❌ Failed to save notes: ${error.message}`);
    } finally {
      setSavingNotes(false);
    }
  };

  useEffect(() => {
    if (client) {
      setNotes(client.notes || '');
    }
  }, [client]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-[rgba(0,0,0,0.5)]">Loading client data...</div>
      </div>
    );
  }

  if (!client || !assets) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">Failed to load client data</div>
      </div>
    );
  }

  const { brandAssets, websiteAssets, productAssets } = assets;

  return (
    <div>
      {/* Back Button & Header */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-[#0071E3] hover:text-[#0077ED] mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back to Clients
      </button>

      <div className="mb-8">
        <h1 className="text-[32px] text-[#111111] mb-2">{client.name}</h1>
        <p className="text-[rgba(0,0,0,0.5)]">{client.email}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b border-[#F5F5F7]">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 transition-all ${
              activeTab === tab
                ? "text-[#0071E3] border-b-2 border-[#0071E3]"
                : "text-[rgba(0,0,0,0.5)] hover:text-[#111111]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {/* Brand Tab */}
        {activeTab === "Brand" && (
          <div className="space-y-6">
            {/* Logos */}
            <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#111111]">Logos</h3>
                <label>
                  <input
                    type="file"
                    accept="image/*,.svg"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[#0071E3] hover:text-[#0077ED] hover:bg-[#F5F5F7] rounded-lg"
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload New'}
                    </span>
                  </Button>
                </label>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {brandAssets?.logos?.length > 0 ? (
                  brandAssets.logos.map((logo: any) => (
                    <div
                      key={logo.id}
                      className="group relative aspect-square bg-[#F5F5F7] rounded-[16px] overflow-hidden border border-[rgba(0,0,0,0.06)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] transition-all"
                    >
                      <ImageWithFallback
                        src={logo.url}
                        alt={logo.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                          <a
                            href={logo.url}
                            download
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                          >
                            <Download className="w-4 h-4 text-[#111111]" />
                          </a>
                          <button
                            onClick={() => handleDeleteLogo(logo.id)}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="text-white text-sm">{logo.name}</div>
                        <div className="text-white/60 text-xs">{logo.format}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8 text-[rgba(0,0,0,0.5)]">
                    No logos uploaded yet. Click "Upload New" to add one.
                  </div>
                )}
              </div>
            </div>

            {/* Colors */}
            <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#111111]">Brand Colors</h3>
                {editingColor === null && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[#0071E3] hover:text-[#0077ED] hover:bg-[#F5F5F7] rounded-lg"
                    onClick={() => {
                      setEditingColor(-1);
                      setColorForm({ name: '', hex: '#' });
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Color
                  </Button>
                )}
              </div>

              {/* Add/Edit Color Form */}
              {editingColor !== null && (
                <div className="mb-4 p-4 bg-[#F5F5F7] rounded-[12px] border-2 border-[#0071E3]">
                  <div className="flex gap-3 mb-3">
                    <Input
                      placeholder="Color name (e.g., Primary)"
                      value={colorForm.name}
                      onChange={(e) => setColorForm({ ...colorForm, name: e.target.value })}
                      className="flex-1 rounded-lg bg-white"
                    />
                    <div className="flex gap-2 items-center">
                      <Input
                        type="text"
                        placeholder="#000000"
                        value={colorForm.hex}
                        onChange={(e) => setColorForm({ ...colorForm, hex: e.target.value })}
                        className="w-32 rounded-lg bg-white font-mono"
                      />
                      <input
                        type="color"
                        value={colorForm.hex.length === 7 ? colorForm.hex : '#000000'}
                        onChange={(e) => setColorForm({ ...colorForm, hex: e.target.value })}
                        className="w-12 h-10 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingColor(null);
                        setColorForm({ name: '', hex: '' });
                      }}
                      className="rounded-lg"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={editingColor === -1 ? handleAddColor : handleUpdateColor}
                      className="rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {editingColor === -1 ? 'Add' : 'Update'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-4 gap-4">
                {brandAssets?.colors?.length > 0 ? (
                  brandAssets.colors.map((color: any, index: number) => (
                    <div
                      key={index}
                      className="group relative bg-[#F5F5F7] rounded-[16px] p-4 border border-[rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all"
                    >
                      <div
                        className="w-full h-20 rounded-[12px] mb-3 shadow-inner"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="text-[#111111] text-sm mb-1">{color.name}</div>
                      <div className="text-[rgba(0,0,0,0.5)] text-xs font-mono">{color.hex}</div>
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => handleEditColor(index)}
                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-[#0071E3] hover:text-white transition-colors shadow-md"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteColor(index)}
                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shadow-md"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 text-center py-8 text-[rgba(0,0,0,0.5)]">
                    No colors added yet. Click "Add Color" to add one.
                  </div>
                )}
              </div>
            </div>

            {/* Guidelines */}
            <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#111111]">Brand Guidelines</h3>
                <label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleGuidelineUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-[#0071E3] hover:text-[#0077ED] hover:bg-[#F5F5F7] rounded-lg"
                    disabled={uploading}
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4 mr-2" />
                      {uploading ? 'Uploading...' : 'Upload New'}
                    </span>
                  </Button>
                </label>
              </div>
              <div className="space-y-3">
                {brandAssets?.guidelines?.length > 0 ? (
                  brandAssets.guidelines.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="group flex items-center gap-4 p-4 bg-[#F5F5F7] rounded-[12px] hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all"
                    >
                      <div className="w-12 h-12 bg-red-100 rounded-[8px] flex items-center justify-center flex-shrink-0">
                        <span className="text-red-500 text-xs">PDF</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-[#111111]">{doc.name}</div>
                        <div className="text-xs text-[rgba(0,0,0,0.5)]">{doc.size}</div>
                      </div>
                      <a
                        href={doc.url}
                        download
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#111111] hover:text-[rgba(0,0,0,0.6)] hover:bg-[#F5F5F7] rounded-lg"
                          asChild
                        >
                          <span>
                            <Download className="w-4 h-4" />
                          </span>
                        </Button>
                      </a>
                      <button
                        onClick={() => handleDeleteGuideline(doc.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          asChild
                        >
                          <span>
                            <Trash2 className="w-4 h-4" />
                          </span>
                        </Button>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[rgba(0,0,0,0.5)]">
                    No guidelines uploaded yet. Click "Upload New" to add one.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Website Tab */}
        {activeTab === "Website" && (
          <div className="space-y-4">
            <div className="flex justify-end mb-4">
              <Button 
                onClick={() => {
                  setShowWebsiteForm(true);
                  setEditingWebsite(null);
                  setWebsiteForm({ name: '', url: '', thumbnail: '' });
                }}
                className="rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white px-6 py-3"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Website Asset
              </Button>
            </div>

            {/* Website Form */}
            {showWebsiteForm && (
              <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-2 border-[#0071E3] mb-4">
                <h4 className="text-[#111111] mb-4">{editingWebsite ? 'Edit' : 'Add'} Website Asset</h4>
                <div className="space-y-4">
                  <Input
                    placeholder="Website name (e.g., Main Website)"
                    value={websiteForm.name}
                    onChange={(e) => setWebsiteForm({ ...websiteForm, name: e.target.value })}
                    className="rounded-lg"
                  />
                  <Input
                    placeholder="URL (e.g., https://example.com)"
                    value={websiteForm.url}
                    onChange={(e) => setWebsiteForm({ ...websiteForm, url: e.target.value })}
                    className="rounded-lg"
                  />
                  <div>
                    <label className="block text-sm text-[rgba(0,0,0,0.6)] mb-2">Thumbnail (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleWebsiteThumbnailUpload}
                      className="w-full"
                      disabled={uploading}
                    />
                    {websiteForm.thumbnail && (
                      <div className="mt-2">
                        <ImageWithFallback src={websiteForm.thumbnail} alt="Preview" className="w-32 h-20 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setShowWebsiteForm(false);
                        setEditingWebsite(null);
                        setWebsiteForm({ name: '', url: '', thumbnail: '' });
                      }}
                      className="rounded-lg"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      onClick={editingWebsite ? handleUpdateWebsite : handleAddWebsite}
                      className="rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {editingWebsite ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {websiteAssets && websiteAssets.length > 0 ? (
                websiteAssets.map((site: any) => (
                  <div
                    key={site.id}
                    className="bg-white rounded-[24px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] transition-all group"
                  >
                    <div className="relative aspect-video bg-[#F5F5F7] overflow-hidden">
                      {site.thumbnail ? (
                        <ImageWithFallback
                          src={site.thumbnail}
                          alt={site.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[rgba(0,0,0,0.3)]">
                          <ExternalLink className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button
                          onClick={() => handleEditWebsite(site.id)}
                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-[#0071E3] hover:text-white transition-colors shadow-md"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteWebsite(site.id)}
                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shadow-md"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="p-4">
                      <h4 className="text-[#111111] mb-2">{site.name}</h4>
                      <a
                        href={site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#0071E3] hover:text-[#0077ED] text-sm transition-colors"
                      >
                        {site.url}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 text-[rgba(0,0,0,0.5)]">
                  No website assets yet. Click "Add Website Asset" to add one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Tab */}
        {activeTab === "Product" && (
          <div className="space-y-6">
            {/* Figma Links */}
            <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#111111]">Figma Files</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowFigmaForm(true);
                    setEditingFigma(null);
                    setFigmaForm({ name: '', url: '' });
                  }}
                  className="text-[#0071E3] hover:text-[#0077ED] hover:bg-[#F5F5F7] rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Link
                </Button>
              </div>

              {/* Figma Form */}
              {showFigmaForm && (
                <div className="mb-4 p-4 bg-[#F5F5F7] rounded-[12px] border-2 border-[#0071E3]">
                  <div className="space-y-3">
                    <Input
                      placeholder="File name (e.g., Dashboard Designs)"
                      value={figmaForm.name}
                      onChange={(e) => setFigmaForm({ ...figmaForm, name: e.target.value })}
                      className="rounded-lg bg-white"
                    />
                    <Input
                      placeholder="Figma URL"
                      value={figmaForm.url}
                      onChange={(e) => setFigmaForm({ ...figmaForm, url: e.target.value })}
                      className="rounded-lg bg-white"
                    />
                  </div>
                  <div className="flex gap-2 justify-end mt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowFigmaForm(false);
                        setEditingFigma(null);
                        setFigmaForm({ name: '', url: '' });
                      }}
                      className="rounded-lg"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={editingFigma ? handleUpdateFigmaLink : handleAddFigmaLink}
                      className="rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {editingFigma ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {productAssets?.figmaLinks?.length > 0 ? (
                  productAssets.figmaLinks.map((link: any) => (
                    <div
                      key={link.id}
                      className="group flex items-center gap-4 p-4 bg-[#F5F5F7] rounded-[12px] hover:bg-white hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] transition-all"
                    >
                      <div className="w-12 h-12 bg-purple-100 rounded-[8px] flex items-center justify-center flex-shrink-0">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <path d="M7 7h10v10H7z" fill="#a855f7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-[#111111]">{link.name}</div>
                        <div className="text-xs text-[rgba(0,0,0,0.5)]">Figma Design File</div>
                      </div>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[rgba(0,0,0,0.3)] hover:text-[#0071E3] transition-colors"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => handleEditFigmaLink(link.id)}
                        className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-[#0071E3] hover:text-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteFigmaLink(link.id)}
                        className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shadow-sm opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[rgba(0,0,0,0.5)]">
                    No Figma links yet. Click "Add Link" to add one.
                  </div>
                )}
              </div>
            </div>

            {/* Changelog */}
            <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#111111]">Changelog</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setShowChangelogForm(true);
                    setEditingChangelog(null);
                    setChangelogForm({ date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), note: '' });
                  }}
                  className="text-[#0071E3] hover:text-[#0077ED] hover:bg-[#F5F5F7] rounded-lg"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Entry
                </Button>
              </div>

              {/* Changelog Form */}
              {showChangelogForm && (
                <div className="mb-4 p-4 bg-[#F5F5F7] rounded-[12px] border-2 border-[#0071E3]">
                  <div className="space-y-3">
                    <Input
                      placeholder="Date (e.g., May 12, 2024)"
                      value={changelogForm.date}
                      onChange={(e) => setChangelogForm({ ...changelogForm, date: e.target.value })}
                      className="rounded-lg bg-white"
                    />
                    <textarea
                      placeholder="Changelog note..."
                      value={changelogForm.note}
                      onChange={(e) => setChangelogForm({ ...changelogForm, note: e.target.value })}
                      className="w-full h-24 p-3 bg-white rounded-lg border border-[rgba(0,0,0,0.06)] outline-none focus:border-[#0071E3] transition-all resize-none text-[#111111]"
                    />
                  </div>
                  <div className="flex gap-2 justify-end mt-3">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setShowChangelogForm(false);
                        setEditingChangelog(null);
                        setChangelogForm({ date: '', note: '' });
                      }}
                      className="rounded-lg"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={editingChangelog ? handleUpdateChangelog : handleAddChangelog}
                      className="rounded-lg bg-[#0071E3] hover:bg-[#0077ED] text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {editingChangelog ? 'Update' : 'Add'}
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {productAssets?.changelog?.length > 0 ? (
                  productAssets.changelog.map((entry: any) => (
                    <div key={entry.id} className="group flex gap-4 pb-4 border-b border-[#F5F5F7] last:border-b-0 last:pb-0">
                      <div className="w-3 h-3 bg-[#0071E3] rounded-full mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="text-[rgba(0,0,0,0.5)] text-sm mb-1">{entry.date}</div>
                        <div className="text-[#111111]">{entry.note}</div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditChangelog(entry.id)}
                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-[#0071E3] hover:text-white transition-colors shadow-sm"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteChangelog(entry.id)}
                          className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shadow-sm"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-[rgba(0,0,0,0.5)]">
                    No changelog entries yet. Click "Add Entry" to add one.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === "Notes" && (
          <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h3 className="text-[#111111] mb-4">Private Notes</h3>
            <textarea
              placeholder="Add internal notes about this client..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-64 p-4 bg-[#F5F5F7] rounded-[12px] border border-[rgba(0,0,0,0.06)] outline-none focus:border-[#0071E3] focus:bg-white transition-all resize-none text-[#111111]"
            />
            <div className="flex justify-end mt-4">
              <Button 
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className="rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white px-6 py-3"
              >
                {savingNotes ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "Settings" && (
          <div className="bg-white rounded-[24px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <h3 className="text-[#111111] mb-4">User Settings</h3>
            <p className="text-[rgba(0,0,0,0.5)] mb-6">
              Manage login credentials for this client
            </p>

            <div className="space-y-6">
              {/* Email Display */}
              <div>
                <label className="block text-[rgba(0,0,0,0.7)] mb-2">Email</label>
                <div className="px-4 py-3 bg-[#F5F5F7] rounded-[12px] text-[rgba(0,0,0,0.5)]">
                  {client.email}
                </div>
              </div>

              {/* Password Reset */}
              <div className="border-t border-[#F5F5F7] pt-6">
                <h4 className="text-[#111111] mb-4">Change Password</h4>
                <p className="text-sm text-[rgba(0,0,0,0.5)] mb-4">
                  Set a new password for this client
                </p>
                
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const newPassword = formData.get('newPassword') as string;
                    const confirmPassword = formData.get('confirmPassword') as string;

                    if (!newPassword || !confirmPassword) {
                      alert('Please fill in both password fields');
                      return;
                    }

                    if (newPassword !== confirmPassword) {
                      alert('Passwords do not match');
                      return;
                    }

                    if (newPassword.length < 4) {
                      alert('Password must be at least 4 characters');
                      return;
                    }

                    if (!confirm(`Are you sure you want to change the password for ${client.name}?`)) {
                      return;
                    }

                    try {
                      await updateUserPassword(client.email, newPassword);
                      alert('✅ Password updated successfully!');
                      e.currentTarget.reset();
                    } catch (error: any) {
                      alert(`❌ Failed to update password: ${error.message}`);
                    }
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="newPassword" className="block text-[rgba(0,0,0,0.7)] mb-2">
                      New Password
                    </label>
                    <Input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      placeholder="Enter new password"
                      className="rounded-[12px]"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-[rgba(0,0,0,0.7)] mb-2">
                      Confirm Password
                    </label>
                    <Input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      placeholder="Confirm new password"
                      className="rounded-[12px]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button 
                      type="submit"
                      className="rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white px-6 py-3"
                    >
                      Update Password
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}