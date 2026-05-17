import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../api/supabase';
import { BlogPost } from '../types';
import { Button } from '../shared/Button';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function AdminBlogs() {
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('blogs')
        .select(`
          *,
          author:users(name),
          category:blog_categories(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBlogs(data as unknown as BlogPost[]);
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu blog yazısını silmek istediğinize emin misiniz?')) return;
    
    try {
      const { error } = await supabase.from('blogs').delete().eq('id', id);
      if (error) throw error;
      setBlogs(blogs.filter(b => b.id !== id));
    } catch (err) {
      console.error('Error deleting blog:', err);
      alert('Silinirken bir hata oluştu.');
    }
  };

  const filteredBlogs = blogs.filter(b => 
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.status && b.status.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Yönetimi</h1>
          <p className="text-sm text-gray-500 mt-1">Sistemdeki tüm blog yazılarını ve SEO ayarlarını yönetin.</p>
        </div>
        <Button onClick={() => navigate('/admin/blogs/new')} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Yeni Yazı Ekle
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Başlık veya duruma göre ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Başlık / Slug</th>
                <th className="px-6 py-4">Durum</th>
                <th className="px-6 py-4">Yayın Tarihi</th>
                <th className="px-6 py-4">SEO Durumu</th>
                <th className="px-6 py-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Yükleniyor...
                  </td>
                </tr>
              ) : filteredBlogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Blog yazısı bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{blog.title}</div>
                      <div className="text-gray-500 text-xs mt-1">/{blog.slug}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${blog.status === 'published' ? 'bg-green-100 text-green-800' : 
                          blog.status === 'draft' ? 'bg-gray-100 text-gray-800' : 
                          blog.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                          'bg-red-100 text-red-800'}`}>
                        {blog.status === 'published' ? 'Yayında' : 
                         blog.status === 'draft' ? 'Taslak' : 
                         blog.status === 'scheduled' ? 'Planlandı' : 'Arşivlendi'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {blog.published_at ? format(new Date(blog.published_at), 'd MMM yyyy, HH:mm', { locale: tr }) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className={blog.meta_title ? 'text-green-600' : 'text-red-500'}>
                          {blog.meta_title ? '✓ Meta Başlık' : '✗ Meta Başlık Yok'}
                        </span>
                        <span className={blog.meta_description ? 'text-green-600' : 'text-red-500'}>
                          {blog.meta_description ? '✓ Meta Açıklama' : '✗ Meta Açıklama Yok'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/blogs/${blog.id}`)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Düzenle"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(blog.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Sil"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
