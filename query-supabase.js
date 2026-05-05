import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://znkforqlpkmakxgvxmco.supabase.co';
const supabaseAnonKey = 'sb_publishable_vxTU9bhfsEe6_EX8SKFUVw_36IzWobr';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function queryAdmins() {
  const { data, error } = await supabase
    .from('users')
    .select('name, email, role')
    .eq('role', 'ADMIN');
  
  if (error) {
    console.error('Hata:', error.message);
  } else {
    console.log('Admin Hesapları:');
    data.forEach(row => {
      console.log(`İsim: ${row.name}, Email: ${row.email}`);
    });
  }
}

queryAdmins();
