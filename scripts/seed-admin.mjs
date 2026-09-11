const required=name=>{const value=process.env[name]?.trim();if(!value)throw new Error(`Missing required environment variable: ${name}`);return value;};
const url=required('SUPABASE_URL').replace(/\/$/,''),serviceKey=required('SUPABASE_SERVICE_ROLE_KEY'),email=required('ADMIN_EMAIL').toLowerCase(),password=required('ADMIN_PASSWORD');

if(password.length<12)throw new Error('ADMIN_PASSWORD must contain at least 12 characters.');

const headers={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json'};
async function request(path,options={}){const response=await fetch(`${url}${path}`,{...options,headers:{...headers,...options.headers}}),text=await response.text();let data=null;try{data=text?JSON.parse(text):null;}catch{data=text;}if(!response.ok)throw new Error(`${response.status} ${response.statusText}: ${typeof data==='string'?data:JSON.stringify(data)}`);return data;}

const listed=await request('/auth/v1/admin/users?page=1&per_page=1000'),existing=(listed.users||listed||[]).find(user=>String(user.email||'').toLowerCase()===email);
const user=existing
  ?await request(`/auth/v1/admin/users/${existing.id}`,{method:'PUT',body:JSON.stringify({email,password,email_confirm:true})})
  :await request('/auth/v1/admin/users',{method:'POST',body:JSON.stringify({email,password,email_confirm:true,user_metadata:{full_name:'Administrador'}})});

await request('/rest/v1/profiles?on_conflict=id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates'},body:JSON.stringify({id:user.id,email:user.email,display_name:user.user_metadata?.full_name||'Administrador'})});
await request('/rest/v1/user_roles?on_conflict=user_id,role',{method:'POST',headers:{Prefer:'resolution=ignore-duplicates'},body:JSON.stringify({user_id:user.id,role:'admin'})});

console.log(`Administrator seed completed for ${email}. Password was not logged or written to disk.`);
