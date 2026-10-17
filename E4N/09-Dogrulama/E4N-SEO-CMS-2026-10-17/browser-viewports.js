async(page)=>{
 const measurements=[],errors=[];page.on('pageerror',error=>errors.push(error.message));
 const base=page.url().split('/blog/')[0];
 for(const width of [320,390,768,1440]){
  await page.setViewportSize({width,height:900});
  await page.goto(base+'/admin/blogs/fa9527ac-62d8-4a49-8820-b1bfb0034dce');await page.getByText('İçerik planı ve inceleme',{exact:true}).waitFor();
  if(width<1024){const menu=page.getByRole('button',{name:'Open main menu',exact:true});await menu.click();await page.getByRole('link',{name:'Blog Yönetimi',exact:true}).waitFor();await menu.click();}
  const controls=[];for(const name of ['Yayın durumu','İçerik kümesi'])controls.push({name,height:(await page.getByRole('combobox',{name,exact:true}).boundingBox()).height});controls.push({name:'Kaydet',height:(await page.getByRole('button',{name:'Kaydet',exact:true}).boundingBox()).height});if(controls.some(c=>c.height<44))throw new Error('Small touch control '+JSON.stringify(controls));
  for(const tab of ['Genel Bilgiler','SEO Ayarları','İçerik Editörü','Sosyal Medya (Open Graph)']){
   await page.getByRole('button',{name:tab,exact:true}).click();
   const size=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));measurements.push({width,page:'editor',tab,...size});
  }
  await page.getByRole('button',{name:'Genel Bilgiler',exact:true}).click();
  await page.screenshot({path:'C:/Users/murat/.codex/worktrees/e4n-sprint1-foundation/e4n2/E4N/09-Dogrulama/E4N-SEO-CMS-2026-10-17/editor-'+width+'.png',fullPage:true});
  await page.goto(base+'/blog/browser-cms-acceptance');await page.getByRole('navigation',{name:'İlgili içerikler'}).waitFor();
  const size=await page.evaluate(()=>({viewport:innerWidth,scroll:document.documentElement.scrollWidth}));measurements.push({width,page:'article',...size});
 }
 return{measurements,errors,overflow:measurements.filter(m=>m.scroll>m.viewport).length};
}