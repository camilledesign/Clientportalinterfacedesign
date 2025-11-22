import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-Admin-Session", "X-User-Session", "X-Session-Token"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Initialize storage buckets on startup
const initializeBuckets = async () => {
  const bucketNames = ['make-a93d7fb4-assets', 'make-a93d7fb4-logos', 'make-a93d7fb4-documents'];
  
  for (const bucketName of bucketNames) {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
      
      if (!bucketExists) {
        await supabase.storage.createBucket(bucketName, {
          public: false,
          fileSizeLimit: 52428800, // 50MB
        });
        console.log(`Created bucket: ${bucketName}`);
      }
    } catch (error) {
      console.log(`Error initializing bucket ${bucketName}:`, error);
    }
  }
};

// Initialize buckets
initializeBuckets();

// Health check endpoint
app.get("/make-server-a93d7fb4/health", (c) => {
  return c.json({ status: "ok", version: "1.0.1", timestamp: new Date().toISOString() });
});

// Seed database endpoint (for development/testing)
app.post("/make-server-a93d7fb4/seed", async (c) => {
  try {
    console.log('🌱 Seeding database...');
    
    // This endpoint is called from the frontend which handles the actual seeding
    // We just return success since the frontend will make the individual API calls
    return c.json({ 
      success: true,
      message: "Database seeding initiated. The frontend will create clients and requests."
    });
  } catch (error) {
    console.log("❌ Error in seed endpoint:", error);
    return c.json({ error: "Seed endpoint error" }, 500);
  }
});

// Debug endpoint - View all database keys (ADMIN ONLY)
app.get("/make-server-a93d7fb4/debug/database", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    // Get all entries by common prefixes
    const clients = await kv.getByPrefix("client:");
    const users = await kv.getByPrefix("user:");
    const requests = await kv.getByPrefix("request:");
    const sessions = await kv.getByPrefix("session:");
    const adminSessions = await kv.getByPrefix("admin_session:");
    const assets = await kv.getByPrefix("client_assets:");
    
    return c.json({
      database: {
        clients: clients || [],
        users: users || [],
        requests: requests || [],
        sessions: sessions || [],
        adminSessions: adminSessions || [],
        assets: assets || [],
      },
      counts: {
        clients: clients?.length || 0,
        users: users?.length || 0,
        requests: requests?.length || 0,
        sessions: sessions?.length || 0,
        adminSessions: adminSessions?.length || 0,
        assets: assets?.length || 0,
      }
    });
  } catch (error) {
    console.log("❌ Error fetching database debug info:", error);
    return c.json({ error: "Failed to fetch database info" }, 500);
  }
});

// Sync clients from users endpoint (ADMIN ONLY - creates missing client records)
app.post("/make-server-a93d7fb4/debug/sync-clients", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    console.log('🔄 Syncing clients from users...');
    
    // Get all users
    const users = await kv.getByPrefix("user:");
    
    if (!users || users.length === 0) {
      return c.json({ success: true, message: "No users found", synced: 0 });
    }
    
    let syncedCount = 0;
    
    for (const user of users) {
      // Check if client record exists
      const existingClient = await kv.get(`client:${user.clientId}`);
      
      if (!existingClient) {
        // Create missing client record
        const newClient = {
          id: user.clientId,
          name: user.company || user.name,
          email: user.email,
          createdAt: user.createdAt,
          lastActivity: user.createdAt,
          activeRequests: 0,
          status: "active",
        };
        
        await kv.set(`client:${user.clientId}`, newClient);
        console.log(`✅ Created missing client record for: ${user.name} (${user.clientId})`);
        syncedCount++;
      }
    }
    
    console.log(`✅ Sync complete: ${syncedCount} client records created`);
    
    return c.json({ 
      success: true,
      synced: syncedCount,
      message: `Created ${syncedCount} missing client records`
    });
  } catch (error) {
    console.log("❌ Error syncing clients:", error);
    return c.json({ error: "Failed to sync clients" }, 500);
  }
});

// Migrate legacy users to new format (ADMIN ONLY)
app.post("/make-server-a93d7fb4/debug/migrate-users", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    console.log('🔄 Migrating legacy users to new format...');
    
    // Get all users
    const allUsers = await kv.getByPrefix("user:");
    
    if (!allUsers || allUsers.length === 0) {
      return c.json({ success: true, message: "No users found", migrated: 0 });
    }
    
    let migratedCount = 0;
    
    for (const user of allUsers) {
      // Check if this is a legacy user (has email in the data and likely stored with key user:email)
      if (user.email && user.id) {
        // Check if new format already exists
        const newFormatUser = await kv.get(`user:${user.id}`);
        
        if (!newFormatUser) {
          // Migrate to new format (key: user:id)
          const migratedUser = {
            ...user,
            lastLoginAt: user.lastLoginAt || user.createdAt,
          };
          
          await kv.set(`user:${user.id}`, migratedUser);
          console.log(`✅ Migrated user: ${user.email} to new format (user:${user.id})`);
          migratedCount++;
          
          // Delete old format if it exists (user:email)
          try {
            await kv.del(`user:${user.email}`);
            console.log(`🗑️ Deleted legacy key: user:${user.email}`);
          } catch (err) {
            console.log(`⚠️ Could not delete legacy key user:${user.email}:`, err);
          }
        }
      }
    }
    
    console.log(`✅ Migration complete: ${migratedCount} users migrated`);
    
    return c.json({ 
      success: true,
      migrated: migratedCount,
      message: `Migrated ${migratedCount} users to new format`
    });
  } catch (error) {
    console.log("❌ Error migrating users:", error);
    return c.json({ error: "Failed to migrate users" }, 500);
  }
});

// Clear database endpoint (ADMIN ONLY - use with caution)
app.post("/make-server-a93d7fb4/debug/clear", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { prefixes } = await c.req.json();
    
    let deletedCount = 0;
    
    for (const prefix of prefixes) {
      const entries = await kv.getByPrefix(prefix);
      
      if (entries && entries.length > 0) {
        for (const entry of entries) {
          // Construct the key based on prefix
          let key = '';
          if (prefix === 'client:') key = `client:${entry.id}`;
          else if (prefix === 'user:') key = `user:${entry.email}`;
          else if (prefix === 'request:') key = `request:${entry.id}`;
          else if (prefix === 'session:') {
            // For sessions, we need to find the key somehow
            // Skip sessions for now as they don't have a standard ID
            continue;
          }
          else if (prefix === 'admin_session:') {
            // Skip admin sessions
            continue;
          }
          else if (prefix === 'client_assets:') key = `client_assets:${entry.clientId || entry.id}`;
          
          if (key) {
            await kv.del(key);
            deletedCount++;
          }
        }
      }
    }
    
    console.log(`✅ Cleared ${deletedCount} entries from database`);
    
    return c.json({ 
      success: true,
      deletedCount,
      message: `Cleared ${deletedCount} entries`
    });
  } catch (error) {
    console.log("❌ Error clearing database:", error);
    return c.json({ error: "Failed to clear database" }, 500);
  }
});

// ============================================
// ADMIN AUTHENTICATION
// ============================================

// Admin verification endpoint
app.post("/make-server-a93d7fb4/admin/verify", async (c) => {
  try {
    const { code } = await c.req.json();
    console.log('🔐 Admin verification attempt');
    
    if (code === "3333") {
      // Admin uses a static token - no database storage needed
      // The frontend will store this locally and we'll verify on each request
      const adminToken = "admin-static-token-3333";
      
      console.log('✅ Admin code verified');
      
      return c.json({ 
        success: true, 
        sessionToken: adminToken
      });
    }
    
    console.log('❌ Invalid admin code');
    return c.json({ success: false, error: "Invalid code" }, 401);
  } catch (error) {
    console.log("❌ Admin verification error:", error);
    return c.json({ error: "Verification failed" }, 500);
  }
});

// ============================================
// CLIENT USER AUTHENTICATION (Simple KV-based)
// ============================================

// NEW: Initialize/upsert user profile (Supabase Auth)
app.post("/make-server-a93d7fb4/users/init-profile", async (c) => {
  try {
    const userId = c.req.header('X-User-Token');
    
    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profileData = await c.req.json();
    const { id, email, name, company, clientId, status, lastLoginAt } = profileData;

    console.log(`🔵 Initializing user profile for: ${email} (${id})`);

    // Build stable key using Supabase Auth user ID
    const userKey = `user:${id}`;
    
    // Check if user exists
    const existingUser = await kv.get(userKey);
    
    if (existingUser) {
      // Update existing user (only lastLoginAt and status)
      const updatedUser = {
        ...existingUser,
        lastLoginAt,
        status: status || existingUser.status,
      };
      
      await kv.set(userKey, updatedUser);
      console.log(`✅ Updated existing user: ${email}`);
      
      // Make sure client exists
      const client = await kv.get(`client:${existingUser.clientId}`);
      if (!client) {
        // Create missing client
        const newClient = {
          id: existingUser.clientId,
          name: company || name,
          email: email,
          createdAt: existingUser.createdAt || new Date().toISOString(),
          lastActivity: lastLoginAt,
          activeRequests: 0,
          status: "active",
        };
        await kv.set(`client:${existingUser.clientId}`, newClient);
        console.log(`✅ Created missing client: ${newClient.name}`);
      }
      
      return c.json({ 
        success: true, 
        user: updatedUser,
        isNewUser: false 
      });
    }

    // Create new user
    const newUser = {
      id,
      email,
      name,
      company,
      clientId,
      status: status || 'active',
      createdAt: new Date().toISOString(),
      lastLoginAt,
    };

    await kv.set(userKey, newUser);
    console.log(`✅ Created new user: ${email} (${id})`);

    // Create client record if it doesn't exist
    const existingClient = await kv.get(`client:${clientId}`);
    if (!existingClient) {
      const newClient = {
        id: clientId,
        name: company || name,
        email: email,
        createdAt: new Date().toISOString(),
        lastActivity: lastLoginAt,
        activeRequests: 0,
        status: "active",
      };

      await kv.set(`client:${clientId}`, newClient);
      console.log(`✅ Created new client: ${newClient.name} (${clientId})`);
    }

    return c.json({ 
      success: true, 
      user: newUser,
      isNewUser: true 
    });
  } catch (error) {
    console.log("❌ Error initializing user profile:", error);
    return c.json({ error: "Failed to initialize user profile" }, 500);
  }
});

// Check if client exists for email
app.post("/make-server-a93d7fb4/users/check-client", async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email required" }, 400);
    }

    // Try to find existing user by email (old format)
    const oldUser = await kv.get(`user:${email}`);
    
    if (oldUser && oldUser.clientId) {
      console.log(`✅ Found existing client for ${email}: ${oldUser.clientId}`);
      return c.json({ clientId: oldUser.clientId });
    }

    console.log(`❌ No existing client found for ${email}`);
    return c.json({ clientId: null });
  } catch (error) {
    console.log("❌ Error checking client:", error);
    return c.json({ error: "Failed to check client" }, 500);
  }
});

// Sign in user with email and password (LEGACY - kept for backward compatibility)
app.post("/make-server-a93d7fb4/auth/signin", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    console.log(`🔵 Sign-in attempt with email: ${email}`);
    
    // Get user from KV store
    const user = await kv.get(`user:${email}`);
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return c.json({ error: "Invalid credentials" }, 401);
    }
    
    // Check password
    if (user.password !== password) {
      console.log(`❌ Invalid password for: ${email}`);
      return c.json({ error: "Invalid credentials" }, 401);
    }
    
    console.log(`✅ User signed in: ${email}`);

    // Return success with user data
    return c.json({ 
      success: true,
      user: { 
        email: user.email,
        name: user.name,
        clientId: user.clientId,
      }
    });
  } catch (error) {
    console.log("❌ Error signing in:", error);
    return c.json({ error: "Failed to sign in" }, 500);
  }
});

// Verify user (for authenticated requests)
app.post("/make-server-a93d7fb4/auth/verify", async (c) => {
  try {
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: "Email required" }, 400);
    }
    
    // Look up user by email
    const user = await kv.get(`user:${email}`);
    
    if (!user) {
      console.log(`❌ User verification failed: ${email}`);
      return c.json({ error: "User not found" }, 401);
    }
    
    return c.json({ 
      success: true,
      user: { 
        id: user.id, 
        email: user.email,
        name: user.name,
        clientId: user.clientId
      }
    });
  } catch (error) {
    console.log("❌ Error verifying user:", error);
    return c.json({ error: "Failed to verify user" }, 500);
  }
});

// Sign out user (just for logging purposes)
app.post("/make-server-a93d7fb4/auth/signout", async (c) => {
  try {
    const { email } = await c.req.json();
    console.log(`✅ User signed out: ${email || 'unknown'}`);
    return c.json({ success: true });
  } catch (error) {
    console.log("❌ Error signing out:", error);
    return c.json({ error: "Failed to sign out" }, 500);
  }
});

// ============================================
// DATABASE SEEDING (Removed - users created manually)
// ============================================

// Note: User accounts should be created manually in Supabase
// with the following structure:
// Key: user:{email}
// Value: {
//   id: "uuid",
//   email: "email@example.com",
//   password: "password",
//   name: "User Name",
//   company: "Company Name",
//   clientId: "client-uuid",
//   createdAt: "ISO timestamp"
// }

// Helper to verify admin session
const verifyAdminSession = async (sessionToken: string | undefined) => {
  console.log('🔐 Verifying admin session...', {
    hasToken: !!sessionToken,
    tokenPreview: sessionToken ? `${sessionToken.substring(0, 8)}...` : 'none'
  });
  
  if (!sessionToken) {
    console.log('❌ No session token provided');
    return false;
  }
  
  // Check if the token is the static admin token
  if (sessionToken === "admin-static-token-3333") {
    console.log('✅ Admin session verified');
    return true;
  }
  
  console.log('❌ Invalid admin session token');
  return false;
};

// Helper to get admin session token from request
const getAdminSessionToken = (c: any) => {
  // Try custom header first (preferred method)
  const customHeader = c.req.header('X-Admin-Session');
  if (customHeader) {
    console.log('🔑 Admin session from X-Admin-Session header');
    return customHeader;
  }
  
  // Fallback to Authorization header (but skip if it's the anon key)
  const authHeader = c.req.header('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    // Don't use the token if it's the public anon key
    if (token !== Deno.env.get('SUPABASE_ANON_KEY')) {
      console.log('🔑 Admin session from Authorization header');
      return token;
    }
  }
  
  console.log('❌ No admin session token found');
  return undefined;
};

// Helper to get user session token from request
const getUserSessionToken = (c: any) => {
  // Try custom header first (preferred method)
  const customHeader = c.req.header('X-User-Session');
  if (customHeader) {
    console.log('🔑 User session from X-User-Session header');
    return customHeader;
  }
  
  console.log('❌ No user session token found');
  return undefined;
};

// Helper to verify user session
const verifyUserSession = async (sessionToken: string | undefined) => {
  console.log('🔐 Verifying user session...', {
    hasToken: !!sessionToken,
    tokenPreview: sessionToken ? `${sessionToken.substring(0, 8)}...` : 'none'
  });
  
  if (!sessionToken) {
    console.log('❌ No session token provided');
    return null;
  }
  
  // Session token is now the user's email
  const user = await kv.get(`user:${sessionToken}`);
  
  if (!user) {
    console.log('❌ User not found for email:', sessionToken);
    return null;
  }
  
  console.log('✅ User session verified:', {
    email: user.email,
    clientId: user.clientId
  });
  
  return {
    email: user.email,
    clientId: user.clientId,
    userId: user.id,
    name: user.name
  };
};

// ============================================
// CLIENTS
// ============================================

// Get all clients
app.get("/make-server-a93d7fb4/clients", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const clients = await kv.getByPrefix("client:");
    return c.json({ clients: clients || [] });
  } catch (error) {
    console.log("Error fetching clients:", error);
    return c.json({ error: "Failed to fetch clients" }, 500);
  }
});

// Get single client
app.get("/make-server-a93d7fb4/clients/:id", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const id = c.req.param('id');
    const client = await kv.get(`client:${id}`);
    
    if (!client) {
      return c.json({ error: "Client not found" }, 404);
    }
    
    return c.json({ client });
  } catch (error) {
    console.log("Error fetching client:", error);
    return c.json({ error: "Failed to fetch client" }, 500);
  }
});

// Create client
app.post("/make-server-a93d7fb4/clients", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const clientData = await c.req.json();
    const { name, email, status, password, userName } = clientData;
    
    // Validate required fields
    if (!name || !email) {
      return c.json({ error: "Name and email are required" }, 400);
    }
    
    // Check if user already exists
    const existingUser = await kv.get(`user:${email}`);
    if (existingUser) {
      return c.json({ error: "A user with this email already exists" }, 409);
    }
    
    const clientId = crypto.randomUUID();
    const userId = crypto.randomUUID();
    
    // Create client record
    const newClient = {
      id: clientId,
      name,
      email,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      activeRequests: 0,
      status: status || "active",
    };
    
    await kv.set(`client:${clientId}`, newClient);
    console.log(`✅ Created client: ${name} (${clientId})`);
    
    // Create user account if password provided
    if (password) {
      const newUser = {
        id: userId,
        email: email,
        password: password,
        name: userName || name,
        company: name,
        clientId: clientId,
        createdAt: new Date().toISOString()
      };
      
      await kv.set(`user:${email}`, newUser);
      console.log(`✅ Created user account: ${email} with password`);
    }
    
    return c.json({ 
      success: true,
      client: newClient,
      userCreated: !!password
    });
  } catch (error) {
    console.log("❌ Error creating client:", error);
    return c.json({ error: "Failed to create client" }, 500);
  }
});

// Update client
app.put("/make-server-a93d7fb4/clients/:id", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const id = c.req.param('id');
    const updates = await c.req.json();
    
    const existingClient = await kv.get(`client:${id}`);
    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }
    
    const updatedClient = {
      ...existingClient,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`client:${id}`, updatedClient);
    
    return c.json({ client: updatedClient });
  } catch (error) {
    console.log("Error updating client:", error);
    return c.json({ error: "Failed to update client" }, 500);
  }
});

// Delete client
app.delete("/make-server-a93d7fb4/clients/:id", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const id = c.req.param('id');
    
    const existingClient = await kv.get(`client:${id}`);
    if (!existingClient) {
      return c.json({ error: "Client not found" }, 404);
    }
    
    // Delete the client
    await kv.del(`client:${id}`);
    
    // Also delete client's assets
    await kv.del(`client_assets:${id}`);
    
    // Optionally: Delete all requests for this client
    const allRequests = await kv.getByPrefix("request:");
    const clientRequests = allRequests.filter((req: any) => req.clientId === id);
    for (const request of clientRequests) {
      await kv.del(`request:${request.id}`);
    }
    
    console.log(`✅ Deleted client ${id} and all associated data`);
    
    return c.json({ success: true, message: "Client deleted successfully" });
  } catch (error) {
    console.log("Error deleting client:", error);
    return c.json({ error: "Failed to delete client" }, 500);
  }
});

// ============================================
// REQUESTS
// ============================================

// Get all requests
app.get("/make-server-a93d7fb4/requests", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const requests = await kv.getByPrefix("request:");
    return c.json({ requests: requests || [] });
  } catch (error) {
    console.log("Error fetching requests:", error);
    return c.json({ error: "Failed to fetch requests" }, 500);
  }
});

// Create request
app.post("/make-server-a93d7fb4/requests", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const requestData = await c.req.json();
    const id = crypto.randomUUID();
    
    const newRequest = {
      id,
      ...requestData,
      createdAt: new Date().toISOString(),
      status: requestData.status || "new",
    };
    
    await kv.set(`request:${id}`, newRequest);
    
    // Update client's active request count
    if (requestData.clientId) {
      const client = await kv.get(`client:${requestData.clientId}`);
      if (client) {
        await kv.set(`client:${requestData.clientId}`, {
          ...client,
          activeRequests: (client.activeRequests || 0) + 1,
          lastActivity: new Date().toISOString(),
        });
      }
    }
    
    return c.json({ request: newRequest });
  } catch (error) {
    console.log("Error creating request:", error);
    return c.json({ error: "Failed to create request" }, 500);
  }
});

// Create request (USER ENDPOINT - for clients to submit requests)
app.post("/make-server-a93d7fb4/user/requests", async (c) => {
  try {
    const accessToken = c.req.header('X-Session-Token');
    
    console.log('🔵 POST /user/requests - Request received', {
      hasSessionHeader: !!c.req.header('X-Session-Token'),
      hasAccessToken: !!accessToken,
      tokenPreview: accessToken ? `${accessToken.substring(0, 8)}...` : 'none'
    });
    
    if (!accessToken) {
      console.log('❌ No access token provided');
      return c.json({ error: "Unauthorized - No access token" }, 401);
    }

    // Get user session
    const session = await kv.get(`session:${accessToken}`);
    
    console.log('🔍 Session lookup result:', {
      sessionFound: !!session,
      sessionClientId: session?.clientId,
      sessionEmail: session?.email,
      isExpired: session ? session.expiresAt < Date.now() : 'N/A'
    });
    
    if (!session || session.expiresAt < Date.now()) {
      console.log('❌ Invalid or expired session');
      return c.json({ error: "Unauthorized - Invalid or expired session" }, 401);
    }

    const requestData = await c.req.json();
    
    console.log('📝 Request data received:', {
      category: requestData.category,
      type: requestData.type,
      title: requestData.title,
      hasDetails: !!requestData.details
    });
    
    const id = crypto.randomUUID();
    
    // Get client data to get client name
    const client = await kv.get(`client:${session.clientId}`);
    
    console.log('👤 Client lookup:', {
      clientFound: !!client,
      clientName: client?.name,
      clientId: session.clientId
    });
    
    const newRequest = {
      id,
      ...requestData,
      clientId: session.clientId,
      clientName: client?.name || session.name,
      createdAt: new Date().toISOString(),
      submitDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: "new",
    };
    
    await kv.set(`request:${id}`, newRequest);
    
    // Update client's active request count
    if (client) {
      await kv.set(`client:${session.clientId}`, {
        ...client,
        activeRequests: (client.activeRequests || 0) + 1,
        lastActivity: new Date().toISOString(),
      });
    }
    
    console.log(`✅ Request created by user ${session.email}: ${newRequest.title} (ID: ${id})`);
    
    return c.json({ success: true, request: newRequest });
  } catch (error) {
    console.log("❌ Error creating user request:", error);
    return c.json({ error: "Failed to create request" }, 500);
  }
});

// Update request status
app.patch("/make-server-a93d7fb4/requests/:id/status", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const id = c.req.param('id');
    const { status } = await c.req.json();
    
    const existingRequest = await kv.get(`request:${id}`);
    if (!existingRequest) {
      return c.json({ error: "Request not found" }, 404);
    }
    
    const updatedRequest = {
      ...existingRequest,
      status,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`request:${id}`, updatedRequest);
    
    return c.json({ request: updatedRequest });
  } catch (error) {
    console.log("Error updating request status:", error);
    return c.json({ error: "Failed to update request status" }, 500);
  }
});

// Get user's requests (USER ENDPOINT)
app.get("/make-server-a93d7fb4/user/requests", async (c) => {
  try {
    const sessionToken = getUserSessionToken(c);
    const session = await verifyUserSession(sessionToken);
    
    if (!session) {
      return c.json({ error: "Unauthorized - Invalid or expired session" }, 401);
    }

    // Fetch all requests and filter by clientId
    const allRequests = await kv.getByPrefix("request:");
    const userRequests = allRequests.filter((req: any) => req.clientId === session.clientId);
    
    console.log(`✅ Fetched ${userRequests.length} requests for user ${session.email}`);
    
    return c.json({ success: true, requests: userRequests || [] });
  } catch (error) {
    console.log("Error fetching user requests:", error);
    return c.json({ error: "Failed to fetch requests" }, 500);
  }
});

// ============================================
// CLIENT ASSETS
// ============================================

// Get client assets
app.get("/make-server-a93d7fb4/clients/:id/assets", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const clientId = c.req.param('id');
    const assets = await kv.get(`client_assets:${clientId}`);
    
    return c.json({ assets: assets || {
      brandAssets: { logos: [], colors: [], guidelines: [] },
      websiteAssets: [],
      productAssets: { figmaLinks: [], changelog: [] },
    }});
  } catch (error) {
    console.log("Error fetching client assets:", error);
    return c.json({ error: "Failed to fetch client assets" }, 500);
  }
});

// Update client assets
app.put("/make-server-a93d7fb4/clients/:id/assets", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const clientId = c.req.param('id');
    const assets = await c.req.json();
    
    await kv.set(`client_assets:${clientId}`, assets);
    
    return c.json({ assets });
  } catch (error) {
    console.log("Error updating client assets:", error);
    return c.json({ error: "Failed to update client assets" }, 500);
  }
});

// Upload file to storage
app.post("/make-server-a93d7fb4/upload", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const bucketName = formData.get('bucket') as string || 'make-a93d7fb4-assets';
    const path = formData.get('path') as string;
    
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }
    
    const fileName = path || `${crypto.randomUUID()}-${file.name}`;
    const fileBuffer = await file.arrayBuffer();
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });
    
    if (error) {
      console.log("Upload error:", error);
      return c.json({ error: "Upload failed" }, 500);
    }
    
    // Create signed URL
    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year
    
    return c.json({ 
      path: data.path,
      url: signedUrlData?.signedUrl,
    });
  } catch (error) {
    console.log("Error uploading file:", error);
    return c.json({ error: "Failed to upload file" }, 500);
  }
});

// Get signed URL for file
app.post("/make-server-a93d7fb4/get-signed-url", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const { bucket, path } = await c.req.json();
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year
    
    if (error) {
      return c.json({ error: "Failed to generate signed URL" }, 500);
    }
    
    return c.json({ url: data.signedUrl });
  } catch (error) {
    console.log("Error generating signed URL:", error);
    return c.json({ error: "Failed to generate signed URL" }, 500);
  }
});

// Get user's assets (USER ENDPOINT)
app.get("/make-server-a93d7fb4/user/assets", async (c) => {
  try {
    const sessionToken = getUserSessionToken(c);
    const session = await verifyUserSession(sessionToken);
    
    if (!session) {
      return c.json({ error: "Unauthorized - Invalid or expired session" }, 401);
    }

    // Fetch assets for this client
    const assets = await kv.get(`client_assets:${session.clientId}`);
    
    console.log(`✅ Fetched assets for user ${session.email}`);
    
    return c.json({ 
      success: true, 
      assets: assets || {
        brandAssets: { logos: [], colors: [], guidelines: [] },
        websiteAssets: [],
        productAssets: { figmaLinks: [], changelog: [] },
      }
    });
  } catch (error) {
    console.log("Error fetching user assets:", error);
    return c.json({ error: "Failed to fetch assets" }, 500);
  }
});

// Update user profile (name and password)
app.put("/make-server-a93d7fb4/user/profile", async (c) => {
  try {
    const sessionToken = getUserSessionToken(c);
    const session = await verifyUserSession(sessionToken);
    
    if (!session) {
      return c.json({ error: "Unauthorized - Invalid or expired session" }, 401);
    }

    const { name, currentPassword, newPassword } = await c.req.json();
    
    // Get current user
    const user = await kv.get(`user:${session.email}`);
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return c.json({ error: "Current password required" }, 400);
      }
      
      if (user.password !== currentPassword) {
        return c.json({ error: "Current password is incorrect" }, 401);
      }
    }
    
    // Update user
    const updatedUser = {
      ...user,
      name: name || user.name,
      password: newPassword || user.password,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`user:${session.email}`, updatedUser);
    
    // Update all active sessions with new name
    if (name && name !== user.name) {
      await kv.set(`session:${sessionToken}`, {
        ...session,
        name: name,
      });
    }
    
    console.log(`✅ Profile updated for user ${session.email}`);
    
    return c.json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
      }
    });
  } catch (error) {
    console.log("Error updating user profile:", error);
    return c.json({ error: "Failed to update profile" }, 500);
  }
});

// Get user's profile info
app.get("/make-server-a93d7fb4/user/profile", async (c) => {
  try {
    const sessionToken = getUserSessionToken(c);
    const session = await verifyUserSession(sessionToken);
    
    if (!session) {
      return c.json({ error: "Unauthorized - Invalid or expired session" }, 401);
    }

    // Get user data
    const user = await kv.get(`user:${session.email}`);
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    console.log(`✅ Fetched profile for user ${session.email}`);
    
    return c.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        company: user.company,
      }
    });
  } catch (error) {
    console.log("Error fetching user profile:", error);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

// Update user password (ADMIN ENDPOINT - for admin to change user password)
app.put("/make-server-a93d7fb4/admin/users/:email/password", async (c) => {
  try {
    const sessionToken = getAdminSessionToken(c);
    if (!await verifyAdminSession(sessionToken)) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const email = c.req.param('email');
    const { newPassword } = await c.req.json();
    
    if (!newPassword) {
      return c.json({ error: "New password required" }, 400);
    }
    
    // Get user
    const user = await kv.get(`user:${email}`);
    
    if (!user) {
      return c.json({ error: "User not found" }, 404);
    }
    
    // Update password
    const updatedUser = {
      ...user,
      password: newPassword,
      updatedAt: new Date().toISOString(),
    };
    
    await kv.set(`user:${email}`, updatedUser);
    
    console.log(`✅ Admin updated password for user ${email}`);
    
    return c.json({ 
      success: true,
      message: "Password updated successfully"
    });
  } catch (error) {
    console.log("Error updating user password:", error);
    return c.json({ error: "Failed to update password" }, 500);
  }
});

Deno.serve(app.fetch);