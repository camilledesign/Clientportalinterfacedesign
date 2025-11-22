import { projectId, publicAnonKey } from './supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-a93d7fb4`;

// ============================================
// USER AUTHENTICATION
// ============================================

// Sign in user
export async function signIn(email: string, password: string) {
  console.log('🔵 SignIn: Calling server signin endpoint');
  
  const response = await fetch(`${API_BASE}/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  
  console.log('🔵 SignIn: Server response', data);
  
  if (!response.ok) {
    throw new Error(data.error || 'Sign in failed');
  }
  
  // Store user email as session (simple approach)
  if (data.success && data.user) {
    localStorage.setItem('user_email', data.user.email);
    localStorage.setItem('user_data', JSON.stringify(data.user));
    console.log('✅ User signed in, email stored:', data.user.email);
  }
  
  return data;
}

// Sign out user
export async function signOut() {
  const email = localStorage.getItem('user_email');
  
  // Clear localStorage
  localStorage.removeItem('user_email');
  localStorage.removeItem('user_data');
  
  console.log('✅ User signed out');
}

export async function getCurrentSession() {
  const email = localStorage.getItem('user_email');
  const userData = localStorage.getItem('user_data');
  
  if (email && userData) {
    console.log('✅ Active session found for:', email);
    return JSON.parse(userData);
  }
  
  console.log('❌ No active session');
  return null;
}

export async function getUserData() {
  const userData = localStorage.getItem('user_data');
  
  if (userData) {
    return JSON.parse(userData);
  }
  
  return null;
}

// ============================================
// USER REQUESTS
// ============================================

export async function submitRequest(requestData: any) {
  const email = localStorage.getItem('user_email');
  
  console.log('🔵 submitRequest: Starting request submission', {
    hasEmail: !!email,
    category: requestData.category,
    title: requestData.title
  });
  
  if (!email) {
    console.error('❌ submitRequest: No email found - user not logged in');
    throw new Error('Not authenticated - please log in');
  }

  const url = `${API_BASE}/user/requests`;
  console.log('🔵 Making POST request to:', url);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-User-Session': email,
    },
    body: JSON.stringify(requestData),
  });

  const data = await response.json();
  
  console.log('🔵 submitRequest: Server response', {
    ok: response.ok,
    status: response.status,
    data: data,
  });
  
  if (!response.ok) {
    console.error('❌ submitRequest: Server returned error', data.error);
    throw new Error(data.error || 'Failed to submit request');
  }
  
  console.log('✅ submitRequest: Request submitted successfully');
  
  return data;
}

export async function getUserRequests() {
  const email = localStorage.getItem('user_email');
  
  console.log('🔵 getUserRequests: Starting request', { hasEmail: !!email });
  
  if (!email) {
    console.error('❌ getUserRequests: No email found');
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE}/user/requests`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-User-Session': email,
    },
  });

  const data = await response.json();
  
  console.log('📦 getUserRequests: Response data', data);
  
  if (!response.ok) {
    console.error('❌ getUserRequests: Request failed', data.error);
    throw new Error(data.error || 'Failed to fetch requests');
  }
  
  return data;
}

export async function getUserAssets() {
  const email = localStorage.getItem('user_email');
  
  console.log('🔵 getUserAssets: Starting request', { hasEmail: !!email });
  
  if (!email) {
    console.error('❌ getUserAssets: No email found');
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE}/user/assets`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-User-Session': email,
    },
  });

  const data = await response.json();
  
  console.log('📦 getUserAssets: Response data', data);
  
  if (!response.ok) {
    console.error('❌ getUserAssets: Request failed', data.error);
    throw new Error(data.error || 'Failed to fetch assets');
  }
  
  return data;
}

// ============================================
// USER PROFILE
// ============================================

export async function getUserProfile() {
  const email = localStorage.getItem('user_email');
  
  if (!email) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE}/user/profile`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-User-Session': email,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch profile');
  }
  
  return data;
}

export async function updateUserProfile(updates: { name?: string; currentPassword?: string; newPassword?: string }) {
  const email = localStorage.getItem('user_email');
  
  if (!email) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(`${API_BASE}/user/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
      'X-User-Session': email,
    },
    body: JSON.stringify(updates),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update profile');
  }
  
  // Update stored user data if name changed
  if (updates.name) {
    const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
    userData.name = updates.name;
    localStorage.setItem('user_data', JSON.stringify(userData));
  }
  
  return data;
}

// ============================================
// ADMIN API
// ============================================

export async function verifyAdminCode(code: string) {
  const sessionToken = localStorage.getItem('admin_session_token');
  
  const response = await fetch(`${API_BASE}/admin/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ code }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to verify admin code');
  }
  
  // Store admin session token
  if (data.sessionToken) {
    localStorage.setItem('admin_session_token', data.sessionToken);
    localStorage.setItem('admin_verified', 'true');
  }
  
  return data;
}

// Helper to get Supabase auth session token
async function getAuthToken(): Promise<string> {
  const token = localStorage.getItem('sb_access_token');
  if (!token) {
    throw new Error('Not authenticated');
  }
  return token;
}

export async function getAdminClients() {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch clients');
  }
  
  return data;
}

export async function getClients() {
  return getAdminClients();
}

export async function updateClient(clientId: string, updates: any) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(updates),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update client');
  }
  
  return data;
}

export async function deleteClient(clientId: string) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete client');
  }
  
  return data;
}

export async function createClient(clientData: any) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(clientData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to create client');
  }
  
  return data;
}

export async function updateUserPassword(clientId: string, newPassword: string) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/password`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ password: newPassword }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update password');
  }
  
  return data;
}

export async function getAdminRequests() {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/requests`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch requests');
  }
  
  return data;
}

export async function getRequests() {
  return getAdminRequests();
}

export async function updateRequestStatus(requestId: string, status: string) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/requests/${requestId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ status }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update request status');
  }
  
  return data;
}

export async function getClient(clientId: string) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch client');
  }
  
  return data;
}

export async function getClientDetails(clientId: string) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch client details');
  }
  
  return data;
}

// Brand tab functions
export async function getClientBrand(clientId: string) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/brand`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch brand data');
  }
  
  return data;
}

export async function updateClientBrand(clientId: string, brandData: any) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/brand`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(brandData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update brand data');
  }
  
  return data;
}

// Website tab functions
export async function getClientWebsite(clientId: string) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/website`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch website data');
  }
  
  return data;
}

export async function updateClientWebsite(clientId: string, websiteData: any) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/website`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(websiteData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update website data');
  }
  
  return data;
}

// Product tab functions
export async function getClientProduct(clientId: string) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/product`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch product data');
  }
  
  return data;
}

export async function updateClientProduct(clientId: string, productData: any) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/product`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(productData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update product data');
  }
  
  return data;
}

// Assets functions
export async function getClientAssets(clientId: string) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/assets`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch assets');
  }
  
  return data;
}

export async function updateClientAssets(clientId: string, assets: any[]) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/assets`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ assets }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update assets');
  }
  
  return data;
}

export async function addClientAsset(clientId: string, assetData: any) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/assets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(assetData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to add asset');
  }
  
  return data;
}

export async function updateClientAsset(clientId: string, assetId: string, assetData: any) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/assets/${assetId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(assetData),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update asset');
  }
  
  return data;
}

export async function deleteClientAsset(clientId: string, assetId: string) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/assets/${assetId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete asset');
  }
  
  return data;
}

// Notes functions
export async function getClientNotes(clientId: string) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/notes`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch notes');
  }
  
  return data;
}

export async function addClientNote(clientId: string, note: string) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ note }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to add note');
  }
  
  return data;
}

export async function updateClientNote(clientId: string, noteId: string, note: string) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/notes/${noteId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ note }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to update note');
  }
  
  return data;
}

export async function deleteClientNote(clientId: string, noteId: string) {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/clients/${clientId}/notes/${noteId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to delete note');
  }
  
  return data;
}

// File upload function
export async function uploadFile(file: File) {
  const authToken = await getAuthToken();
  
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
    body: formData,
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to upload file');
  }
  
  return data;
}

// Database debug functions
export async function getDatabaseDebugInfo() {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/debug/database`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to fetch debug info');
  }
  
  return data;
}

export async function syncClientsFromUsers() {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/debug/sync-clients`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to sync clients');
  }
  
  return data;
}

export async function clearDatabase() {
  const authToken = await getAuthToken();
  
  const response = await fetch(`${API_BASE}/debug/clear`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ 
      prefixes: ['client:', 'request:', 'user:'] 
    }),
  });

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Failed to clear database');
  }
  
  return data;
}

// Admin session management
export async function clearSessionToken() {
  localStorage.removeItem('admin_session_token');
  localStorage.removeItem('admin_verified');
  console.log('✅ Admin session cleared');
}