import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

export const serverRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const legacyPrefixes={attendance:'/api/attendance',auth:'/api/auth',common:'/api',education:'/api/education',events:'/api/events',groups:'/api/groups',memberships:'/api/memberships',notifications:'/api/notifications',onetoones:'/api/one-to-ones',powerteams:'/api/power-teams',referrals:'/api/referrals',reports:'/api/reports',tickets:'/api/tickets',user:'/api/user',users:'/api/users',visitors:'/api/visitors',support:''};
export const keyOf=(method,url)=>method.toUpperCase()+' '+url.replace(/:[^/]+/g,':param');
const join=(prefix,url)=>(prefix+'/'+url).replace(/\/+/g,'/').replace(/\/$/,'')||'/';
const paths=node=>{
  if(!node)return [];
  if(ts.isStringLiteralLike(node))return [node.text];
  if(ts.isArrayLiteralExpression(node))return node.elements.flatMap(paths);
  if(ts.isTemplateExpression(node)){
    let result=[node.head.text];
    for(const span of node.templateSpans){
      if(!ts.isIdentifier(span.expression))return [];
      let ancestor=node.parent,values=[];
      while(ancestor){
        if(ts.isForOfStatement(ancestor)&&ts.isVariableDeclarationList(ancestor.initializer)&&ancestor.initializer.declarations[0]?.name.getText()===span.expression.text){values=paths(ancestor.expression);break;}
        ancestor=ancestor.parent;
      }
      if(!values.length)return [];
      result=result.flatMap(prefix=>values.map(v=>prefix+v+span.literal.text));
    }
    return result;
  }
  return [];
};
const walk=(node,visit)=>{visit(node);ts.forEachChild(node,n=>walk(n,visit));};

// Static entry ownership, not an authorization or production traffic audit.
export function inspectOwnership({read=relative=>fs.readFileSync(path.join(serverRoot,relative),'utf8')}={}) {
  const errors=[],active=[],providers=new Set(),imports=new Map();
  const parse=relative=>ts.createSourceFile(relative,read(relative),ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const index=parse('src/index.js');
  for(const statement of index.statements){
    if(!ts.isImportDeclaration(statement)||!ts.isStringLiteral(statement.moduleSpecifier))continue;
    const source=statement.moduleSpecifier.text;if(!source.startsWith('.'))continue;
    const relative=path.posix.normalize(path.posix.join('src',source));
    const clause=statement.importClause;
    if(clause?.name)imports.set(clause.name.text,{relative,exported:'default'});
    if(clause?.namedBindings&&ts.isNamedImports(clause.namedBindings))for(const e of clause.namedBindings.elements)imports.set(e.name.text,{relative,exported:(e.propertyName??e.name).text});
  }
  const collect=(node,relative,prefix,receiver)=>walk(node,n=>{
    if(!ts.isCallExpression(n)||!ts.isPropertyAccessExpression(n.expression)||n.expression.expression.getText()!==receiver)return;
    const method=n.expression.name.text;if(!['get','post','put','delete','patch','head','options','all'].includes(method))return;
    const urls=n.arguments[0]?paths(n.arguments[0]):[];
    if(!urls.length){errors.push('Unresolved route in '+relative+':'+(node.getSourceFile().getLineAndCharacterOfPosition(n.pos).line+1));return;}
    for(const url of urls){const full=join(prefix,url);if(!full.startsWith('/api/'))continue;active.push({method:method.toUpperCase(),path:full,provider:relative,line:n.getSourceFile().getLineAndCharacterOfPosition(n.getStart()).line+1});}
  });
  providers.add('src/index.js');collect(index,'src/index.js','','app');
  const mounts=new Set(),installations=new Set();
  walk(index,n=>{
    if(!ts.isCallExpression(n))return;
    if(ts.isPropertyAccessExpression(n.expression)&&n.expression.getText()==='app.use'){
      const prefix=n.arguments[0]&&paths(n.arguments[0]);
      for(const argument of n.arguments.slice(1)){
        if(!ts.isIdentifier(argument)||!imports.has(argument.text))continue;
        const {relative}=imports.get(argument.text);if(!prefix?.length){errors.push('Unresolved mount: '+relative);continue;}
        for(const p of prefix){const id=relative+'@'+p;if(mounts.has(id)){errors.push('Repeated mount: '+id);continue;}mounts.add(id);providers.add(relative);collect(parse(relative),relative,p,'router');}
      }
    }
    if(ts.isIdentifier(n.expression)&&imports.has(n.expression.text)&&n.arguments[0]?.getText()==='app'){
      const {relative,exported}=imports.get(n.expression.text),id=relative+'#'+exported;
      if(installations.has(id)){errors.push('Repeated installer: '+id);return;}installations.add(id);providers.add(relative);
      const source=parse(relative),fn=source.statements.find(s=>ts.isFunctionDeclaration(s)&&s.name?.text===exported);
      if(!fn){errors.push('Unresolved installer: '+id);return;}collect(fn,relative,'','app');
    }
  });
  const byKey=new Map();
  for(const route of active){const key=keyOf(route.method,route.path);if(byKey.has(key))errors.push('Duplicate '+key+' in '+byKey.get(key).provider+' and '+route.provider);else byKey.set(key,route);}
  const legacy=[];
  for(const file of fs.readdirSync(path.join(serverRoot,'src/routes'))){
    if(file.endsWith('.js')&&file!=='admin.js'&&!Object.hasOwn(legacyPrefixes,file.slice(0,-3)))errors.push('Unclassified route module: '+file);
  }
  for(const [name,prefix]of Object.entries(legacyPrefixes)){
    const relative='src/routes/'+name+'.js',definitions=[];
    if(providers.has(relative))errors.push('Retained legacy provider mounted: '+relative);
    const source=parse(relative);
    walk(source,n=>{if(!ts.isCallExpression(n)||!ts.isPropertyAccessExpression(n.expression)||!['router','app'].includes(n.expression.expression.getText()))return;
      const method=n.expression.name.text;if(!['get','post','put','delete','patch'].includes(method))return;
      for(const url of paths(n.arguments[0])){const full=join(prefix,url),owner=byKey.get(keyOf(method,full));definitions.push({method:method.toUpperCase(),path:full,activeOwner:owner?.provider??null});}
    });
    legacy.push({provider:relative,status:name==='education'?'retained-deferred-education':'retained-unmounted',definitions});
  }
  return {version:1,entry:'src/index.js',active,providers:[...providers].sort(),legacy,errors};
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const report=inspectOwnership();
  if(process.argv.includes('--json'))process.stdout.write(JSON.stringify(report,null,2)+'\n');
  else console.log(JSON.stringify({activeRoutes:report.active.length,activeProviders:report.providers.length,retainedLegacy:report.legacy.length,errors:report.errors},null,2));
  if(report.errors.length)process.exitCode=1;
}
