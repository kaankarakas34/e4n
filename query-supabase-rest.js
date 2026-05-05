const supabaseUrl = 'https://znkforqlpkmakxgvxmco.supabase.co';
const supabaseAnonKey = 'sb_publishable_vxTU9bhfsEe6_EX8SKFUVw_36IzWobr';

async function queryAdmins() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/users?role=eq.ADMIN&select=name,email,role`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Hata:', response.status, errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Admin Hesapları (Supabase):');
    if (data.length === 0) {
      console.log('Hiç admin bulunamadı (veya RLS engelliyor).');
    } else {
      data.forEach(row => {
        console.log(`İsim: ${row.name}, Email: ${row.email}`);
      });
    }
  } catch (err) {
    console.error('Hata:', err.message);
  }
}

queryAdmins();
