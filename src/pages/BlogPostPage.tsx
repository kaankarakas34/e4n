import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { supabase } from '../api/supabase';
import { BlogPost } from '../types';
import { Calendar, User, ChevronRight, Home } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Helmet } from 'react-helmet-async';

export function BlogPostPage() {
  const { slug } = useParams();
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchBlog(slug);
    }
  }, [slug]);

  const fetchBlog = async (slug: string) => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          author:users(name),
          category:blog_categories(name)
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      if (!data) throw new Error('Not found');
      
      setBlog(data as unknown as BlogPost);
    } catch (err) {
      console.error('Error fetching blog post:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (error || !blog) {
    return <Navigate to="/blog" replace />;
  }

  const defaultCanonicalUrl = `https://www.event4network.com/blog/${blog.slug}`;
  const canonicalUrl = blog.canonical_url || defaultCanonicalUrl;
  
  // JSON-LD Schema
  const schemaOrgJSONLD = {
    "@context": "https://schema.org",
    "@type": blog.schema_type || "BlogPosting",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    },
    "headline": blog.meta_title || blog.title,
    "description": blog.meta_description || blog.excerpt,
    "image": blog.featured_image ? [blog.featured_image] : [],
    "author": {
      "@type": "Person",
      "name": blog.author?.name || "Event4Network"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Event4Network",
      "logo": {
        "@type": "ImageObject",
        "url": "https://www.event4network.com/logo.png"
      }
    },
    "datePublished": blog.published_at || blog.created_at,
    "dateModified": blog.updated_at
  };

  return (
    <div className="bg-white min-h-screen">
      <Helmet>
        {/* Basic SEO */}
        <title>{blog.meta_title || `${blog.title} - Event4Network`}</title>
        <meta name="description" content={blog.meta_description || blog.excerpt || blog.title} />
        
        {/* Keywords */}
        {(blog.focus_keyword || (blog.secondary_keywords && blog.secondary_keywords.length > 0)) && (
          <meta name="keywords" content={[blog.focus_keyword, ...(blog.secondary_keywords || [])].filter(Boolean).join(', ')} />
        )}

        {/* Canonical URL */}
        <link rel="canonical" href={canonicalUrl} />

        {/* Robots */}
        <meta name="robots" content={blog.robots || 'index, follow'} />

        {/* Open Graph */}
        <meta property="og:type" content="article" />
        <meta property="og:title" content={blog.og_title || blog.meta_title || blog.title} />
        <meta property="og:description" content={blog.og_description || blog.meta_description || blog.excerpt} />
        <meta property="og:url" content={canonicalUrl} />
        {blog.featured_image && <meta property="og:image" content={blog.featured_image} />}
        
        {/* Twitter Card fallback (even though not explicitly requested, good standard practice, but we skip custom fields) */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.og_title || blog.meta_title || blog.title} />
        <meta name="twitter:description" content={blog.og_description || blog.meta_description || blog.excerpt} />
        {blog.featured_image && <meta name="twitter:image" content={blog.featured_image} />}

        {/* Article Meta */}
        <meta property="article:published_time" content={blog.published_at || blog.created_at} />
        <meta property="article:modified_time" content={blog.updated_at} />
        {blog.author?.name && <meta property="article:author" content={blog.author.name} />}
        {blog.tags?.map(tag => (
          <meta property="article:tag" content={tag} key={tag} />
        ))}

        {/* Schema JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify(schemaOrgJSONLD)}
        </script>
      </Helmet>

      <article className="pb-24">
        {/* Header/Hero Section */}
        <div className="relative bg-gray-900 text-white py-24 lg:py-32 overflow-hidden">
          {blog.featured_image && (
            <div className="absolute inset-0 z-0">
              <img 
                src={blog.featured_image} 
                alt={blog.featured_image_alt || blog.title} 
                className="w-full h-full object-cover opacity-30"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent"></div>
            </div>
          )}
          
          <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {blog.category?.name && (
              <span className="inline-block px-4 py-1.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-sm font-bold tracking-wider uppercase mb-6">
                {blog.category.name}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-8 shadow-sm">
              {blog.title}
            </h1>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-gray-300 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <time dateTime={blog.published_at || blog.created_at}>
                  {format(new Date(blog.published_at || blog.created_at), 'd MMMM yyyy', { locale: tr })}
                </time>
              </div>
              {blog.author?.name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{blog.author.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-12">
            
            {/* Breadcrumb inside the content box */}
            <nav className="flex items-center text-sm text-gray-500 mb-8 border-b border-gray-100 pb-6">
              <Link to="/" className="hover:text-red-600 transition-colors flex items-center">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
              <Link to="/blog" className="hover:text-red-600 transition-colors">
                Blog
              </Link>
              <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
              <span className="font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs">
                {blog.title}
              </span>
            </nav>

            {/* Content Area */}
            {/* We use dangerouslySetInnerHTML because content could be HTML output from a rich text editor */}
            <div 
              className="prose prose-lg prose-red max-w-none text-gray-700 leading-relaxed
                prose-headings:font-bold prose-headings:text-gray-900
                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:mb-6 prose-a:text-red-600 hover:prose-a:text-red-700
                prose-img:rounded-2xl prose-img:shadow-md
                prose-blockquote:border-l-4 prose-blockquote:border-red-500 prose-blockquote:bg-gray-50 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:rounded-r-lg"
              dangerouslySetInnerHTML={{ __html: blog.content?.replace(/\n/g, '<br />') || '' }}
            />

            {/* Tags */}
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-12 pt-8 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-4">Etiketler</h3>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
