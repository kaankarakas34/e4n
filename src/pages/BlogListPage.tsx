import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../api/supabase';
import { BlogPost } from '../types';
import { Calendar, User, ArrowRight, ChevronRight, Home } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Helmet } from 'react-helmet-async';

export function BlogListPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          author:users(name),
          category:blog_categories(name)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setBlogs(data as unknown as BlogPost[]);
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen pb-24">
      <Helmet>
        <title>Rehber | Event4Network</title>
        <meta name="description" content="Event4Network Rehber. Seçici networking, referans kültürü, B2B iş geliştirme ve profesyonel temsil hakkında rehber içerikler." />
        <link rel="canonical" href="https://www.event4network.com/blog" />
      </Helmet>

      {/* Hero Section */}
      <section className="relative py-24 bg-gray-950 text-white overflow-hidden text-center">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 w-[800px] h-[800px] rounded-full bg-red-950/10 blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-red-500/10 text-red-400 font-semibold text-xs tracking-wider uppercase border border-red-500/20 mb-6">
            Bilgi ve Tecrübe Paylaşımı
          </span>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            Rehber
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-4 leading-relaxed font-light">
            Seçici networking prensipleri, referansla müşteri kazanımı ve iş dünyasında profesyonel temsil kültürüne dair rehber içeriklerimiz.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-gray-500 mb-8">
          <Link to="/" className="hover:text-red-600 transition-colors flex items-center">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4 mx-2 text-gray-400" />
          <span className="font-medium text-gray-900">Rehber</span>
        </nav>

        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-24 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="text-gray-400 mb-4">Henüz rehber içeriği bulunmuyor.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogs.map((blog) => (
              <article key={blog.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col h-full group">
                <Link to={`/blog/${blog.slug}`} className="block relative overflow-hidden aspect-[16/9]">
                  {blog.featured_image ? (
                    <img 
                      src={blog.featured_image} 
                      alt={blog.featured_image_alt || blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-50 flex items-center justify-center">
                      <span className="text-gray-400 text-sm">Görsel Yok</span>
                    </div>
                  )}
                  {blog.category?.name && (
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold tracking-wide text-red-600 uppercase shadow-sm">
                      {blog.category.name}
                    </div>
                  )}
                </Link>
                
                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex items-center text-xs text-gray-500 mb-4 gap-4">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <time dateTime={blog.published_at || blog.created_at}>
                        {format(new Date(blog.published_at || blog.created_at), 'd MMM yyyy', { locale: tr })}
                      </time>
                    </div>
                    {blog.author?.name && (
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" />
                        <span>{blog.author.name}</span>
                      </div>
                    )}
                  </div>
                  
                  <Link to={`/blog/${blog.slug}`} className="block group-hover:text-red-600 transition-colors">
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">
                      {blog.title}
                    </h2>
                  </Link>
                  
                  <p className="text-gray-600 mb-6 line-clamp-3 text-sm leading-relaxed flex-grow">
                    {blog.excerpt || (blog.content ? blog.content.substring(0, 150) + '...' : '')}
                  </p>
                  
                  <div className="pt-4 border-t border-gray-100 mt-auto">
                    <Link 
                      to={`/blog/${blog.slug}`}
                      className="inline-flex items-center font-semibold text-red-600 hover:text-red-700 transition-colors text-sm group/btn"
                    >
                      Devamını Oku 
                      <ArrowRight className="ml-1 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
