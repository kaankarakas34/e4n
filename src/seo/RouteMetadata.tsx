import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import catalog from './routeCatalog.json';
import { networkingGuides, networkingGuidesModified } from '../data/networkingGuides';

import { SITE_URL, jsonLd } from './metadata';

export function RouteMetadata() {
  const { pathname } = useLocation();
  const path = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  const route = catalog.find(row => row.path === path);
  const guide = networkingGuides.find(row => row.path === path);
  const dynamic = /^\/(blog|event)\/[^/]+$/.test(path);
  if (dynamic) return <Helmet><meta name="robots" content="noindex, follow" /></Helmet>;
  const title = route?.title || (dynamic ? 'E4N İçerik ve Etkinlik | Event4Network' : 'Event4Network Üye Alanı');
  const description = route?.description || 'Event4Network üyelik, topluluk ve etkinlik bilgileri.';
  const canonical = route || dynamic ? SITE_URL + path : undefined;
  const index = route ? route.index : dynamic;
  const graph: object[] = [
    { '@type': 'Organization', '@id': SITE_URL + '/#organization', name: 'Event4Network', alternateName: 'E4N', url: SITE_URL + '/', logo: SITE_URL + '/e4n-logo.png', sameAs: ['https://www.linkedin.com/company/event4network/', 'https://www.instagram.com/event4network/'] },
    { '@type': 'WebSite', '@id': SITE_URL + '/#website', name: 'Event4Network', url: SITE_URL + '/', inLanguage: 'tr-TR', publisher: { '@id': SITE_URL + '/#organization' } },
  ];
  if (route && path !== '/') graph.push({
    '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Event4Network', item: SITE_URL + '/' },
      { '@type': 'ListItem', position: 2, name: route.title.split(' | ')[0], item: canonical },
    ],
  });
  if (guide) graph.push({
    '@type': 'Article', '@id': canonical + '#article', headline: guide.title,
    mainEntityOfPage: canonical, inLanguage: 'tr-TR', dateModified: networkingGuidesModified,
    author: { '@id': SITE_URL + '/#organization' }, publisher: { '@id': SITE_URL + '/#organization' },
  });
  return <Helmet>
    <title>{title}</title>
    <meta name="description" content={description} />
    <meta name="robots" content={index ? 'index, follow' : 'noindex, follow'} />
    {canonical && <link rel="canonical" href={canonical} />}
    <meta property="og:type" content={guide ? 'article' : 'website'} />
    <meta property="og:locale" content="tr_TR" />
    <meta property="og:site_name" content="Event4Network" />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {canonical && <meta property="og:url" content={canonical} />}
    <meta property="og:image" content={SITE_URL + '/biz_kimiz_network.png'} />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={SITE_URL + '/biz_kimiz_network.png'} />
    <script id="e4n-site-schema" type="application/ld+json">{jsonLd({ '@context': 'https://schema.org', '@graph': graph })}</script>
  </Helmet>;
}
