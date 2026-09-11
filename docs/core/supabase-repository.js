(()=>{
'use strict';
if(window.PonderaSupabaseRepository)return;

const required=value=>{if(!value)throw new Error('Configuração do Supabase ausente.');return value;};
const unwrap=({data,error})=>{if(error)throw error;return data;};

function create(config){
  const factory=required(window.supabase?.createClient),url=required(config.supabaseUrl),key=required(config.supabasePublishableKey||config.supabaseAnonKey);
  const client=factory(url,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});

  async function session(){return unwrap(await client.auth.getSession())?.session||null;}
  async function signIn(email,password){return unwrap(await client.auth.signInWithPassword({email,password}));}
  async function signUp(email,password,displayName){return unwrap(await client.auth.signUp({email,password,options:{data:{full_name:displayName||''},emailRedirectTo:location.origin+location.pathname}}));}
  async function signInWithGoogle(){return unwrap(await client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}}));}
  async function resetPassword(email){return unwrap(await client.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname+'#reset-password'}));}
  async function signOut(){return unwrap(await client.auth.signOut());}
  function onAuthStateChange(handler){return client.auth.onAuthStateChange(handler);}

  async function profile(){
    const current=await session();if(!current?.user)return null;
    const [profileRow,roles]=await Promise.all([
      client.from('profiles').select('*').eq('id',current.user.id).single(),
      client.from('user_roles').select('role').eq('user_id',current.user.id)
    ]);
    return{...unwrap(profileRow),roles:(unwrap(roles)||[]).map(row=>row.role)};
  }

  async function portfolios(){return unwrap(await client.from('portfolios').select('*').is('archived_at',null).order('created_at',{ascending:true}))||[];}
  async function createPortfolio(input){return unwrap(await client.from('portfolios').insert({name:input.name,description:input.description||null,include_in_consolidated:input.includeInConsolidated!==false,base_currency:input.baseCurrency||'BRL'}).select('*').single());}
  async function updatePortfolio(id,input){return unwrap(await client.from('portfolios').update({name:input.name,description:input.description||null,include_in_consolidated:input.includeInConsolidated!==false,base_currency:input.baseCurrency||'BRL'}).eq('id',id).select('*').single());}
  async function archivePortfolio(id){return unwrap(await client.from('portfolios').update({archived_at:new Date().toISOString()}).eq('id',id).select('id').single());}

  async function scopedRows(table,portfolioIds,columns='*'){
    if(!portfolioIds.length)return[];
    return unwrap(await client.from(table).select(columns).in('portfolio_id',portfolioIds))||[];
  }

  async function loadContext(context){
    const list=await portfolios(),ids=context.type==='portfolio'?[context.portfolioId]:list.filter(row=>row.include_in_consolidated).map(row=>row.id),allowed=new Set(list.map(row=>row.id));
    if(ids.some(id=>!allowed.has(id)))throw new Error('Carteira não encontrada ou sem permissão.');
    const [transactions,classes,segments,assets,dividendEvents]=await Promise.all([
      scopedRows('transactions',ids),scopedRows('asset_classes',ids),scopedRows('segments',ids),scopedRows('assets',ids),scopedRows('dividend_events',ids)
    ]);
    return{portfolios:list,portfolioIds:ids,transactions,classes,segments,assets,dividendEvents};
  }

  async function replaceTransactions(portfolioId,transactions){return unwrap(await client.rpc('replace_portfolio_transactions',{p_portfolio_id:portfolioId,p_transactions:transactions}));}
  async function replaceAllocations(portfolioId,classes,segments){return unwrap(await client.rpc('replace_portfolio_allocations',{p_portfolio_id:portfolioId,p_classes:classes,p_segments:segments}));}

  return Object.freeze({client,session,profile,portfolios,createPortfolio,updatePortfolio,archivePortfolio,loadContext,replaceTransactions,replaceAllocations,signIn,signUp,signInWithGoogle,resetPassword,signOut,onAuthStateChange});
}

window.PonderaSupabaseRepository=Object.freeze({version:'3.0.0',create});
})();
