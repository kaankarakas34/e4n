import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { readFile, writeFile, mkdir, unlink } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import catalog from './routeCatalog.json';
import { RouteMetadata } from './RouteMetadata';
import { MainPublicLayout } from '../components/MainPublicLayout';
import { LandingPage } from '../pages/LandingPage';
import { E4NNedir } from '../pages/E4NNedir';
import { NasilCalisir } from '../pages/NasilCalisir';
import { KapaliGruplar } from '../pages/KapaliGruplar';
import { ShufflePage } from '../pages/ShufflePage';
import { KatilimIlkeleri } from '../pages/KatilimIlkeleri';
import { BirebirNetworking } from '../pages/BirebirNetworking';
import { Uyelik } from '../pages/Uyelik';
import { PublicEventsPage } from '../pages/PublicEventsPage';
import { Topluluklarimiz } from '../pages/Topluluklarimiz';
import { BlogListPage } from '../pages/BlogListPage';
import { Hakkimizda } from '../pages/Hakkimizda';
import { SSS } from '../pages/SSS';
import { ContactPage } from '../pages/ContactPage';
import { KVKK } from '../pages/KVKK';
import { PrivacyPolicy } from '../pages/PrivacyPolicy';
import { DegerlendirmeBasvurusu } from '../pages/DegerlendirmeBasvurusu';
import { MemberHandbook } from '../pages/MemberHandbook';
import { PreInformationForm } from '../pages/PreInformationForm';
import { TermsOfUse } from '../pages/TermsOfUse';
import { CookiePolicy } from '../pages/CookiePolicy';
import { DistanceSellingContract } from '../pages/DistanceSellingContract';
import { CancellationRefundPolicy } from '../pages/CancellationRefundPolicy';
import { CityNetworkingPage } from '../pages/CityNetworkingPage';
import { BusinessNetworkingPage } from '../pages/BusinessNetworkingPage';
import { IsCevresiNasilGenisletilirPage } from '../pages/IsCevresiNasilGenisletilirPage';
import { ProfesyonelIsAgiNasilKurulurPage } from '../pages/ProfesyonelIsAgiNasilKurulurPage';
import { NetworkingKartvizitFarkiPage } from '../pages/NetworkingKartvizitFarkiPage';
import { NetworkingSatisFarkiPage } from '../pages/NetworkingSatisFarkiPage';
import { NotFound } from '../pages/NotFound';

const components: Record<string, React.ComponentType> = { LandingPage, E4NNedir, NasilCalisir, KapaliGruplar, ShufflePage, KatilimIlkeleri, BirebirNetworking, Uyelik, PublicEventsPage, Topluluklarimiz, BlogListPage, Hakkimizda, SSS, ContactPage, KVKK, PrivacyPolicy, DegerlendirmeBasvurusu, MemberHandbook, PreInformationForm, TermsOfUse, CookiePolicy, DistanceSellingContract, CancellationRefundPolicy, CityNetworkingPage, BusinessNetworkingPage, IsCevresiNasilGenisletilirPage, ProfesyonelIsAgiNasilKurulurPage, NetworkingKartvizitFarkiPage, NetworkingSatisFarkiPage };
const template = await readFile(resolve('dist/index.html'), 'utf8');
const manifest: object[] = [];
const clientManifest = JSON.parse(await readFile(resolve('dist/.vite/manifest.json'), 'utf8'));
function htmlFor(path: string, Component: React.ComponentType, layout = true) {
  const context = {} as NonNullable<React.ComponentProps<typeof HelmetProvider>['context']>;
  const body = renderToString(<HelmetProvider context={context}><StaticRouter location={path}>
    <RouteMetadata />
    {layout ? <Routes><Route element={<MainPublicLayout />}><Route path={path.startsWith('/networking/') ? '/networking/:city' : path} element={<Component />} /></Route></Routes> : <Component />}
  </StaticRouter></HelmetProvider>);
  const helmet = context.helmet!;
  const head = (['title','meta','link','script'] as const).map(key => helmet[key].toString()).join('\n');
  return template.replace('</head>', head + '\n</head>').replace('<div id="root"></div>', '<div id="root">' + body + '</div>');
}
for (const row of catalog) {
  let html = htmlFor(row.path, components[row.component]);
  const entry = clientManifest['src/pages/' + row.component + '.tsx'];
  if (entry) html = html.replace('</head>', '<link rel="modulepreload" href="/' + entry.file + '"/>\n</head>');
  const file = row.path === '/' ? 'index.html' : row.path.slice(1) + '.html';
  await mkdir(dirname(resolve('dist', file)), { recursive: true });
  await writeFile(resolve('dist', file), html);
  manifest.push({ ...row, file });
}
await writeFile(resolve('dist/404.html'), htmlFor('/__missing__', NotFound, false));
const shell = (index: boolean) => template.replace('</head>', '<title data-rh="true">Event4Network</title><meta data-rh="true" name="description" content="Event4Network üyelik, topluluk ve etkinlik bilgileri."/><meta data-rh="true" name="robots" content="' + (index ? 'index, follow' : 'noindex, follow') + '"/></head>');
await writeFile(resolve('dist/_app.html'), shell(false));
await writeFile(resolve('dist/_content.html'), shell(true));
const sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + catalog.filter(row => row.index).map(row => '  <url><loc>https://www.event4network.com' + row.path + '</loc><lastmod>' + row.lastmod + '</lastmod></url>').join('\n') + '\n</urlset>\n';
await writeFile(resolve('dist/sitemap-static.xml'), sitemap);
await unlink(resolve('dist/sitemap.xml'));
await writeFile(resolve('dist/seo-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('SEO prerender: ' + catalog.length + ' static pages, ' + catalog.filter(row => row.index).length + ' sitemap URLs, real 404 artifact and isolated app/content shells; no API/DB requests.');
