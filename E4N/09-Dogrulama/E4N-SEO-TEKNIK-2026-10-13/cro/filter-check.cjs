async (page) => {
 const ensure=(ok,message)=>{if(!ok)throw new Error(message)};
 await page.getByRole('group',{name:'Şehir filtresi',exact:true}).waitFor();
 const rows=[];
 for(const width of [320,390,768]){
  await page.setViewportSize({width,height:844});
  const row=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,buttons:[...document.querySelectorAll('[role="group"] button')].map(b=>({text:b.textContent,height:b.getBoundingClientRect().height,selected:b.getAttribute('aria-pressed')}))}));
  ensure(row.width===width&&row.scrollWidth===width,'Horizontal overflow');ensure(row.buttons.every(b=>b.height>=44),'Small touch target');rows.push(row);
 }
 const cities=page.getByRole('group',{name:'Şehir filtresi',exact:true});await cities.getByRole('button',{name:'İstanbul',exact:true}).click();ensure(await cities.getByRole('button',{name:'İstanbul',exact:true}).getAttribute('aria-pressed')==='true','Selected city missing');ensure(await cities.getByRole('button',{name:'Tümü',exact:true}).getAttribute('aria-pressed')==='false','Old city selected');
 const types=page.getByRole('group',{name:'Etkinlik türü filtresi',exact:true});await types.getByRole('button',{name:'Eğitim',exact:true}).click();ensure(await types.getByRole('button',{name:'Eğitim',exact:true}).getAttribute('aria-pressed')==='true','Selected type missing');
 const modes=page.getByRole('group',{name:'Etkinlik formatı filtresi',exact:true});await modes.getByRole('button',{name:'Online',exact:true}).click();ensure(await modes.getByRole('button',{name:'Online',exact:true}).getAttribute('aria-pressed')==='true','Selected format missing');
 await page.setViewportSize({width:320,height:844});await modes.scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/e4n-cro/filters-fixed-320.png'});
 return {url:page.url(),rows,selectionControls:true,scope:page.url().includes('127.0.0.1')?'Isolated local production build with read-only empty-event fixture':'Real production anonymous browser'};
}
