async (page) => {
 const questions=await page.evaluate(()=>[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>JSON.parse(s.textContent)).find(s=>s['@type']==='FAQPage').mainEntity);
 const matches=[];
 for(const q of questions){
  if(!await page.evaluate(a=>document.body.textContent.includes(a),q.acceptedAnswer.text)){
   await page.getByRole('button',{name:q.name,exact:true}).click();
  }
  matches.push({question:q.name,answerInDOM:await page.evaluate(a=>document.body.textContent.includes(a),q.acceptedAnswer.text)});
 }
 return {count:matches.length,answersMatched:matches.filter(x=>x.answerInDOM).length,matches,scope:'Rendered accordion answers compared to JSON-LD; Google Rich Results eligibility not asserted.'};
}
