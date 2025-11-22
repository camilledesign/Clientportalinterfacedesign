import { createClient, syncClientsFromUsers } from './api';

export async function seedDatabase() {
  try {
    const results = [];
    
    // Try to create Maxime
    try {
      const maximeClient = await createClient({
        name: "Maxime",
        email: "blondy@jointhequest.co",
        password: "1234",
        userName: "Maxime",
        lastActivity: new Date().toISOString(),
      });
      results.push({ name: "Maxime", status: "created", data: maximeClient });
      console.log('✅ Created Maxime');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        results.push({ name: "Maxime", status: "skipped", reason: "already exists" });
        console.log('⏭️ Maxime already exists, skipping');
      } else {
        throw error;
      }
    }

    // Try to create Tom
    try {
      const tomClient = await createClient({
        name: "Tom",
        email: "tom@merciinternet.com",
        password: "1234",
        userName: "Tom",
        lastActivity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      });
      results.push({ name: "Tom", status: "created", data: tomClient });
      console.log('✅ Created Tom');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        results.push({ name: "Tom", status: "skipped", reason: "already exists" });
        console.log('⏭️ Tom already exists, skipping');
      } else {
        throw error;
      }
    }

    // Try to create Marwan
    try {
      const marwanClient = await createClient({
        name: "Marwan",
        email: "marwan@sama.com",
        password: "1234",
        userName: "Marwan",
        lastActivity: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      });
      results.push({ name: "Marwan", status: "created", data: marwanClient });
      console.log('✅ Created Marwan');
    } catch (error: any) {
      if (error.message.includes('already exists')) {
        results.push({ name: "Marwan", status: "skipped", reason: "already exists" });
        console.log('⏭️ Marwan already exists, skipping');
      } else {
        throw error;
      }
    }

    const created = results.filter(r => r.status === 'created').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    
    // If some were skipped, sync missing client records
    if (skipped > 0) {
      console.log('🔄 Syncing missing client records...');
      try {
        const syncResult = await syncClientsFromUsers();
        console.log(`✅ Sync complete: ${syncResult.synced} client records created`);
      } catch (error) {
        console.error('⚠️ Sync failed, but continuing:', error);
      }
    }
    
    console.log(`✅ Database seeding complete: ${created} created, ${skipped} skipped`);
    
    return {
      success: true,
      results,
      summary: { created, skipped }
    };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}