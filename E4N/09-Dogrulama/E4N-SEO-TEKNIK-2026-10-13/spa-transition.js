async (page) => {
 await page.setViewportSize({width:1280,height:900});
 await page.goto('http://127.0.0.1:4178/networking/istanbul');
 await page.locator('main h1').waitFor({state:'visible'});
 await page.getByRole('link',{name:'Üyelik',exact:true}).first().click();
 await page.waitForURL('**/uyelik');
 await page.getByRole('heading',{name:"E4N'ye üye olun, size uygun gruba başvurun",exact:true}).waitFor({state:'visible'});
 await page.waitForFunction(() => document.querySelector('link[rel=canonical]')?.getAttribute('href')==='https://www.event4network.com/uyelik' && document.querySelector('meta[name=robots]')?.getAttribute('content')==='index, follow');
 const metadata=await page.evaluate(()=>({path:location.pathname,canonical:[...document.querySelectorAll('link[rel=canonical]')].map(x=>x.href),descriptions:document.querySelectorAll('meta[name=description]').length,robots:document.querySelector('meta[name=robots]')?.getAttribute('content'),h1:document.querySelectorAll('h1').length}));
 if(metadata.canonical.length!==1||metadata.descriptions!==1||metadata.robots!=='index, follow'||metadata.h1!==1)throw Error('SPA metadata transition: '+JSON.stringify(metadata));
 return {cityNoindexToMembershipIndex:metadata};
}
