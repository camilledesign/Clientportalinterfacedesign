/**
 * API Layer - Refactored to use Supabase directly
 * 
 * This file used to call a custom Edge Function on the OLD Supabase project.
 * Now it simply re-exports helpers from utils/supabase/db.ts for backward compatibility.
 * 
 * MIGRATION STATUS: ✅ Complete
 * - All legacy API_BASE calls removed
 * - All localStorage.user_email dependencies removed
 * - All admin_session_token dependencies removed
 * - Now uses Supabase Auth + RLS directly
 */

import { getCurrentUser } from './auth';
import {
  createRequest,
  getUserRequests as dbGetUserRequests,
  getUserAssets as dbGetUserAssets,
  getRequestsByUser,
  getAssetsByUser,
  getAllProfiles,
  uploadAsset,
  RequestRecord,
  AssetRecord,
} from './supabase/db';

// ============================================
// USER REQUESTS (Briefs)
// ============================================

/**
 * Submit a new request (brief)
 * Used by: BrandRequestForm, WebsiteRequestForm, ProductRequestForm
 */
export async function submitRequest(requestData: {
  category: 'brand' | 'website' | 'product';
  title: string;
  [key: string]: any;
}) {
  console.log('🔵 submitRequest: Starting request submission', {
    category: requestData.category,
    title: requestData.title
  });

  const user = await getCurrentUser();

  if (!user) {
    console.error('❌ submitRequest: No authenticated user');
    throw new Error('Not authenticated - please log in');
  }

  try {
    // Create request in Supabase
    const request = await createRequest(
      user.id,
      requestData.category,
      requestData.title,
      requestData // Full payload
    );

    console.log('✅ submitRequest: Request created successfully', request.id);

    return {
      success: true,
      request,
    };
  } catch (error: any) {
    console.error('❌ submitRequest: Failed to create request', error);
    throw new Error(error.message || 'Failed to submit request');
  }
}

/**
 * Get all requests for the current user
 * Used by: RequestHistory component
 */
export async function getUserRequests() {
  console.log('🔵 getUserRequests: Fetching requests for current user');

  const user = await getCurrentUser();

  if (!user) {
    console.error('❌ getUserRequests: No authenticated user');
    throw new Error('Not authenticated');
  }

  try {
    const requests = await dbGetUserRequests(user.id);

    console.log('✅ getUserRequests: Fetched requests', requests.length);

    // Transform to legacy format for backward compatibility
    return {
      requests: requests.map(transformRequestToLegacyFormat),
    };
  } catch (error: any) {
    console.error('❌ getUserRequests: Failed to fetch requests', error);
    throw new Error(error.message || 'Failed to load requests');
  }
}

/**
 * Get all requests (admin)
 * Used by: AdminRequests component
 */
export async function getRequests() {
  console.log('🔵 getRequests: Fetching all requests (admin)');

  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    const { getAllRequests } = await import('./supabase/db');
    const requests = await getAllRequests();

    console.log('✅ getRequests: Fetched all requests', requests.length);

    // Transform to legacy format
    return {
      requests: requests.map(transformRequestToLegacyFormat),
    };
  } catch (error: any) {
    console.error('❌ getRequests: Failed to fetch requests', error);
    throw new Error(error.message || 'Failed to load requests');
  }
}

/**
 * Update request status
 * Used by: AdminRequests component
 */
export async function updateRequestStatus(requestId: string, status: 'pending' | 'in_progress' | 'completed' | 'delivered') {
  console.log('🔵 updateRequestStatus: Updating request', requestId, 'to', status);

  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    const { updateRequestStatus: dbUpdateRequestStatus } = await import('./supabase/db');
    const updated = await dbUpdateRequestStatus(requestId, status);

    console.log('✅ updateRequestStatus: Request updated');

    return {
      success: true,
      request: transformRequestToLegacyFormat(updated),
    };
  } catch (error: any) {
    console.error('❌ updateRequestStatus: Failed to update request', error);
    throw new Error(error.message || 'Failed to update request status');
  }
}

/**
 * Transform Supabase request to legacy format
 */
function transformRequestToLegacyFormat(request: RequestRecord) {
  return {
    id: request.id,
    category: request.type.charAt(0).toUpperCase() + request.type.slice(1),
    title: request.title,
    submitDate: new Date(request.created_at).toLocaleDateString(),
    status: mapStatusToLegacy(request.status),
    brief: request.payload,
    deliveredDate: request.status === 'delivered' ? new Date(request.created_at).toLocaleDateString() : undefined,
  };
}

function mapStatusToLegacy(status: string): 'new' | 'in-progress' | 'completed' | 'delivered' {
  switch (status) {
    case 'pending':
      return 'new';
    case 'in_progress':
      return 'in-progress';
    case 'completed':
      return 'completed';
    case 'delivered':
      return 'delivered';
    default:
      return 'new';
  }
}

// ============================================
// USER ASSETS
// ============================================

/**
 * Get all assets for the current user
 * Used by: AssetsLibrary component
 */
export async function getUserAssets() {
  console.log('🔵 getUserAssets: Fetching assets for current user');

  const user = await getCurrentUser();

  if (!user) {
    console.error('❌ getUserAssets: No authenticated user');
    throw new Error('Not authenticated');
  }

  try {
    const { getAssetSignedUrl } = await import('./supabase/db');
    const assets = await dbGetUserAssets(user.id);

    console.log('✅ getUserAssets: Fetched assets', assets.length);

    // Generate signed URLs for all assets
    const assetsWithUrls = await Promise.all(
      assets.map(async (asset) => {
        try {
          const url = await getAssetSignedUrl(asset.file_path, 3600);
          return { ...asset, url };
        } catch (error) {
          console.error('❌ Failed to get signed URL for asset:', asset.id, error);
          return { ...asset, url: '' };
        }
      })
    );

    // Transform to match UI component expectations
    const brandLogos = assetsWithUrls.filter(a =>
      a.label.toLowerCase().includes("logo") ||
      a.description?.toLowerCase().includes("logo") ||
      a.label.toLowerCase().includes("brand")
    ).map(a => ({
      id: a.id,
      name: a.label,
      url: a.url,
      thumbnail: a.url,
      formats: [a.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'],
    }));

    const brandColors = assetsWithUrls.filter(a =>
      a.label.toLowerCase().includes("color") ||
      a.description?.toLowerCase().includes("color")
    ).map(a => ({
      id: a.id,
      name: a.label,
      hex: a.description?.match(/#[0-9A-Fa-f]{6}/)?.[0] || '#000000',
      rgb: a.description?.match(/rgb\([^)]+\)/)?.[0] || 'rgb(0, 0, 0)',
    }));

    const brandGuidelines = assetsWithUrls.filter(a =>
      a.label.toLowerCase().includes("guideline") ||
      a.description?.toLowerCase().includes("guideline") ||
      a.label.toLowerCase().includes("guide")
    ).map(a => ({
      id: a.id,
      name: a.label,
      type: a.mime_type || 'Document',
      description: a.description,
      url: a.url,
      lastUpdated: new Date(a.created_at).toLocaleDateString(),
    }));

    const websiteAssets = assetsWithUrls.filter(a =>
      a.label.toLowerCase().includes("website") ||
      a.description?.toLowerCase().includes("website") ||
      a.label.toLowerCase().includes("web")
    ).map(a => ({
      id: a.id,
      name: a.label,
      url: a.url,
      thumbnail: a.url,
      lastUpdated: new Date(a.created_at).toLocaleDateString(),
    }));

    const figmaLinks = assetsWithUrls.filter(a =>
      a.label.toLowerCase().includes("figma") ||
      a.description?.toLowerCase().includes("figma") ||
      a.label.toLowerCase().includes("product")
    ).map(a => ({
      id: a.id,
      name: a.label,
      url: a.url,
      thumbnail: a.url,
      lastUpdated: new Date(a.created_at).toLocaleDateString(),
    }));

    const changelog = assetsWithUrls.filter(a =>
      a.label.toLowerCase().includes("changelog") ||
      a.description?.toLowerCase().includes("changelog") ||
      a.label.toLowerCase().includes("change log")
    ).map(a => ({
      id: a.id,
      version: a.label,
      title: a.description || a.label,
      changes: [a.description || 'No details available'],
      date: new Date(a.created_at).toLocaleDateString(),
    }));

    // Return in the structure expected by AssetsLibrary
    return {
      assets: {
        brandAssets: {
          logos: brandLogos,
          colors: brandColors,
          guidelines: brandGuidelines,
        },
        websiteAssets: websiteAssets,
        productAssets: {
          figmaLinks: figmaLinks,
          changelog: changelog,
        },
      },
    };
  } catch (error: any) {
    console.error('❌ getUserAssets: Failed to fetch assets', error);
    throw new Error(error.message || 'Failed to load assets');
  }
}

// ============================================
// USER PROFILE
// ============================================

/**
 * Get current user's profile
 * DEPRECATED: Use getCurrentUser() from utils/auth.ts instead
 */
export async function getUserProfile() {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  // Return minimal user data
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
    },
  };
}

/**
 * Update user profile
 * DEPRECATED: Use direct Supabase queries instead
 */
export async function updateUserProfile(updates: any) {
  console.log('⚠️ updateUserProfile is deprecated - use Supabase directly');
  throw new Error('This function is deprecated. Update your profile through Supabase directly.');
}

// ============================================
// ADMIN - CLIENT MANAGEMENT
// ============================================

/**
 * Get all clients (profiles)
 * Used by: AdminDashboard component
 */
export async function getClients() {
  console.log('🔵 getClients: Fetching all profiles (admin)');

  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    const profiles = await getAllProfiles();

    console.log('✅ getClients: Fetched profiles', profiles.length);

    // Transform to legacy format
    return {
      clients: profiles.map(p => ({
        id: p.id,
        name: p.full_name || 'Unnamed',
        email: p.email || 'No email',
        activeRequests: 0, // TODO: Add count from requests table
        lastActivity: p.created_at,
        status: p.is_admin ? 'admin' : 'active',
      })),
    };
  } catch (error: any) {
    console.error('❌ getClients: Failed to fetch clients', error);
    throw new Error(error.message || 'Failed to load clients');
  }
}

/**
 * Get client details (profile + requests + assets)
 * Used by: AdminClientDetail component
 */
export async function getClientDetails(clientId: string) {
  console.log('🔵 getClientDetails: Fetching details for client', clientId);

  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    const { getProfile } = await import('./supabase/db');
    
    const [profile, requests, assets] = await Promise.all([
      getProfile(clientId),
      getRequestsByUser(clientId),
      getAssetsByUser(clientId),
    ]);

    console.log('✅ getClientDetails: Fetched', { 
      profile: profile ? 'found' : 'not found',
      requests: requests.length,
      assets: assets.length 
    });

    return {
      client: {
        id: clientId,
        name: profile?.full_name || 'Unnamed Client',
        email: profile?.email || '',
        company: profile?.company,
        requests: requests.map(transformRequestToLegacyFormat),
        assets: assets,
      },
    };
  } catch (error: any) {
    console.error('❌ getClientDetails: Failed to fetch client details', error);
    throw new Error(error.message || 'Failed to load client details');
  }
}

/**
 * Get single client (alias for getClientDetails)
 * Used by: AdminClientDetail component
 */
export async function getClient(clientId: string) {
  return getClientDetails(clientId);
}

/**
 * Get client assets
 * Used by: Admin panel asset viewer
 */
export async function getClientAssets(clientId: string) {
  console.log('🔵 getClientAssets: Fetching assets for client', clientId);

  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    const { getAssetSignedUrl } = await import('./supabase/db');
    const assets = await getAssetsByUser(clientId);

    console.log('✅ getClientAssets: Fetched assets', assets.length);

    // Generate signed URLs for all assets
    const assetsWithUrls = await Promise.all(
      assets.map(async (asset) => {
        try {
          const url = await getAssetSignedUrl(asset.file_path, 3600);
          return { ...asset, url };
        } catch (error) {
          console.error('❌ Failed to get signed URL for asset:', asset.id, error);
          return { ...asset, url: '' };
        }
      })
    );

    // Transform to match UI component expectations
    const brandLogos = assetsWithUrls.filter(a =>
      a.label.toLowerCase().includes("logo") ||
      a.description?.toLowerCase().includes("logo")
    ).map(a => ({
      id: a.id,
      name: a.label,
      url: a.url,
      thumbnail: a.url,
      formats: [a.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'],
    }));

    const brandColors = assetsWithUrls.filter(a =>
      a.label.toLowerCase().includes("color") ||
      a.description?.toLowerCase().includes("color")
    ).map(a => ({
      id: a.id,
      name: a.label,
      hex: a.description?.match(/#[0-9A-Fa-f]{6}/)?.[0] || '#000000',
      rgb: a.description?.match(/rgb\([^)]+\)/)?.[0] || 'rgb(0, 0, 0)',
    }));

    const brandGuidelines = assetsWithUrls.filter(a =>
      a.label.toLowerCase().includes("guideline") ||
      a.description?.toLowerCase().includes("guideline") ||
      a.label.toLowerCase().includes("guide")
    ).map(a => ({
      id: a.id,
      name: a.label,
      type: a.mime_type || 'Document',
      description: a.description,
      url: a.url,
      lastUpdated: new Date(a.created_at).toLocaleDateString(),
    }));

    const websiteAssets = assetsWithUrls.filter(a =>
      a.label.toLowerCase().includes("website") ||
      a.description?.toLowerCase().includes("website") ||
      a.label.toLowerCase().includes("web")
    ).map(a => ({
      id: a.id,
      name: a.label,
      url: a.url,
      thumbnail: a.url,
      lastUpdated: new Date(a.created_at).toLocaleDateString(),
    }));

    const figmaLinks = assetsWithUrls.filter(a =>
      a.label.toLowerCase().includes("figma") ||
      a.description?.toLowerCase().includes("figma")
    ).map(a => ({
      id: a.id,
      name: a.label,
      url: a.url,
      thumbnail: a.url,
      lastUpdated: new Date(a.created_at).toLocaleDateString(),
    }));

    const changelog = assetsWithUrls.filter(a =>
      a.label.toLowerCase().includes("changelog") ||
      a.description?.toLowerCase().includes("changelog") ||
      a.label.toLowerCase().includes("change log")
    ).map(a => ({
      id: a.id,
      version: a.label,
      title: a.description || a.label,
      changes: [a.description || 'No details available'],
      date: new Date(a.created_at).toLocaleDateString(),
    }));

    return {
      brandAssets: {
        logos: brandLogos,
        colors: brandColors,
        guidelines: brandGuidelines,
      },
      websiteAssets: websiteAssets,
      productAssets: {
        figmaLinks: figmaLinks,
        changelog: changelog,
      },
    };
  } catch (error: any) {
    console.error('❌ getClientAssets: Failed to fetch assets', error);
    throw new Error(error.message || 'Failed to load assets');
  }
}

// ============================================
// ADMIN - NOTES (Placeholder)
// ============================================

/**
 * These functions are placeholders for future implementation
 * Notes can be stored in a separate 'notes' table
 */

export async function getClientNotes(clientId: string) {
  console.log('⚠️ getClientNotes: Not implemented yet');
  return { notes: [] };
}

export async function createClientNote(clientId: string, note: string) {
  console.log('⚠️ createClientNote: Not implemented yet');
  throw new Error('Notes feature not yet implemented');
}

export async function updateClientNote(noteId: string, note: string) {
  console.log('⚠️ updateClientNote: Not implemented yet');
  throw new Error('Notes feature not yet implemented');
}

export async function deleteClientNote(noteId: string) {
  console.log('⚠️ deleteClientNote: Not implemented yet');
  throw new Error('Notes feature not yet implemented');
}

// ============================================
// ADMIN - FILE UPLOAD
// ============================================

/**
 * Upload file for a client
 * Used by: Admin panel asset uploader
 */
export async function uploadFile(clientId: string, file: File, label: string, description?: string) {
  console.log('🔵 uploadFile: Uploading file for client', clientId);

  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Not authenticated');
  }

  try {
    const result = await uploadAsset(clientId, file, label, description);

    console.log('✅ uploadFile: File uploaded', result.asset.id);

    return {
      success: true,
      asset: result.asset,
      url: result.publicUrl,
    };
  } catch (error: any) {
    console.error('❌ uploadFile: Failed to upload file', error);
    throw new Error(error.message || 'Failed to upload file');
  }
}

// ============================================
// ADMIN - CLIENT CRUD (Placeholder)
// ============================================

/**
 * Create a new client
 * This requires creating an auth user + profile
 * TODO: Implement with Supabase Admin API
 */
export async function createClient(data: any) {
  console.log('⚠️ createClient: Not fully implemented');
  throw new Error('Client creation not yet implemented. Create users through Supabase Auth.');
}

/**
 * Update client profile
 */
export async function updateClient(clientId: string, updates: any) {
  console.log('⚠️ updateClient: Not fully implemented');
  throw new Error('Client updates not yet implemented. Use Profile settings instead.');
}

/**
 * Update client assets (legacy compatibility)
 */
export async function updateClientAssets(clientId: string, assets: any) {
  console.log('⚠️ updateClientAssets: Not fully implemented');
  // This was used for editing brand colors, websites, etc.
  // For now, throw error - assets should be uploaded via uploadFile
  throw new Error('Asset updates not yet implemented. Use uploadFile to add new assets.');
}

/**
 * Update user password (admin)
 */
export async function updateUserPassword(userId: string, newPassword: string) {
  console.log('⚠️ updateUserPassword: Not fully implemented');
  throw new Error('Password updates must be done through Supabase Dashboard for security.');
}

/**
 * Delete client
 */
export async function deleteClient(clientId: string) {
  console.log('⚠️ deleteClient: Not fully implemented');
  throw new Error('Client deletion not yet implemented. Must be done through Supabase Dashboard.');
}

// ============================================
// LEGACY DEBUG/ADMIN FUNCTIONS (Removed)
// ============================================

/**
 * These functions are no longer supported
 * They used to call the old Edge Function endpoints
 */

export async function getDatabaseDebugInfo() {
  console.log('⚠️ getDatabaseDebugInfo: Removed - used legacy API');
  throw new Error('This function has been removed. Use Supabase Dashboard for debugging.');
}

export async function syncClientsFromUsers() {
  console.log('⚠️ syncClientsFromUsers: Removed - used legacy API');
  throw new Error('This function has been removed.');
}

export async function clearDatabase(prefixes?: string[]) {
  console.log('⚠️ clearDatabase: Removed - used legacy API');
  throw new Error('This function has been removed.');
}

export async function verifyAdminCode(code: string) {
  console.log('⚠️ verifyAdminCode: Removed - used legacy admin_session_token');
  throw new Error('Admin authentication now uses profiles.is_admin flag.');
}