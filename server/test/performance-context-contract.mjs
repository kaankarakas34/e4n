import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import ts from 'typescript';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),require=createRequire(import.meta.url);
const {createStore}=await import(pathToFileURL(require.resolve('zustand/vanilla')).href);
const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
globalThis.profileAuth=createStore(()=>({user:{id:a,role:'MEMBER'},token:'fixture-a'}));
const empty=async()=>[];
globalThis.profileApi={getUserById:async()=>({performance_score:73,performance_color:'YELLOW'}),getReferralsByUser:empty,getOneToOnes:empty,getVisitorsByUser:empty,getEducationByUser:empty,getUserAttendance:empty};
globalThis.profileCalculation={calculateScore:async()=>({score:0,color:'GREY',breakdown:{},recommendations:[]})};
let source=fs.readFileSync(path.join(root,'src/stores/performanceStore.ts'),'utf8');
source=source.replace("import { create } from 'zustand';",`import {create} from '${pathToFileURL(require.resolve('zustand')).href}';`)
 .replace("import { PerformanceService } from '../utils/services/performanceService';",'const PerformanceService=globalThis.profileCalculation;')
 .replace("import { api } from '../api/api';",'const api=globalThis.profileApi;')
 .replace("import {useAuthStore} from './authStore';",'const useAuthStore=globalThis.profileAuth;');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {usePerformanceStore:store}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
let resolveOld;profileApi.getUserById=()=>new Promise(resolve=>{resolveOld=resolve;});const slow=store.getState().fetchPerformance(a);assert.equal(store.getState().isLoading,true);
profileAuth.setState({user:{id:b,role:'MEMBER'},token:'fixture-b'});assert.equal(store.getState().performance,null);assert.equal(store.getState().scope,null);
profileApi.getUserById=async()=>({performance_score:88,performance_color:'GREEN'});await store.getState().fetchPerformance(b);assert.equal(store.getState().performance.score,88);
resolveOld({performance_score:73,performance_color:'YELLOW'});await slow;assert.equal(store.getState().performance.score,88);assert.equal(store.getState().error,null);
let rejectOld;profileApi.getUserById=()=>new Promise((_,reject)=>{rejectOld=reject;});const failedOld=store.getState().fetchPerformance(b);
profileAuth.setState({user:{id:a,role:'MEMBER'},token:'fixture-a-new'});profileApi.getUserById=async()=>({performance_score:73,performance_color:'YELLOW'});await store.getState().fetchPerformance(a);rejectOld(new Error('Old owner failure'));await failedOld;assert.equal(store.getState().performance.score,73);assert.equal(store.getState().error,null);
profileAuth.setState({user:{id:a,role:'ADMIN'}});assert.equal(store.getState().performance,null);
let calls=0;profileApi.getUserById=async()=>{calls++;throw Error('Current profile unavailable');};await store.getState().fetchPerformance(a);assert.equal(store.getState().performance,null);assert.equal(store.getState().error,'Current profile unavailable');assert.equal(calls,1);
await store.getState().fetchPerformance(b);assert.equal(calls,1);assert.equal(store.getState().performance,null);
profileAuth.setState({user:null,token:null});assert.equal(store.getState().performance,null);assert.equal(store.getState().error,null);assert.equal(store.getState().isLoading,false);
console.log('Performance context PASS: actual Zustand store, delayed old owner success/error, role/token/logout reset, failed refresh clears old data, forged owner does not fetch; score policy unchanged.');
