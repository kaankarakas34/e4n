import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Badge } from '../shared/Badge';
import { Input } from '../shared/Input';
import { 
  Shield,
  Users,
  Key,
  Edit,
  Trash2,
  Plus,
  CheckCircle,
  XCircle,
  UserPlus,
  Settings,
  Lock,
  Unlock
} from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  is_active: boolean;
  created_at: string;
  user_count: number;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

const mockPermissions: Permission[] = [
  { id: '1', name: 'admin.dashboard', description: 'Admin paneline erişim', category: 'Admin' },
  { id: '2', name: 'members.view', description: 'Üye listesini görüntüleme', category: 'Üyeler' },
  { id: '3', name: 'members.create', description: 'Yeni üye oluşturma', category: 'Üyeler' },
  { id: '4', name: 'members.edit', description: 'Üye bilgilerini düzenleme', category: 'Üyeler' },
  { id: '5', name: 'members.delete', description: 'Üye silme', category: 'Üyeler' },
  { id: '6', name: 'events.view', description: 'Etkinlikleri görüntüleme', category: 'Etkinlikler' },
  { id: '7', name: 'events.create', description: 'Yeni etkinlik oluşturma', category: 'Etkinlikler' },
  { id: '8', name: 'events.edit', description: 'Etkinlik düzenleme', category: 'Etkinlikler' },
  { id: '9', name: 'events.delete', description: 'Etkinlik silme', category: 'Etkinlikler' },
  { id: '10', name: 'courses.view', description: 'Kursları görüntüleme', category: 'Kurslar' },
  { id: '11', name: 'courses.create', description: 'Yeni kurs oluşturma', category: 'Kurslar' },
  { id: '12', name: 'courses.edit', description: 'Kurs düzenleme', category: 'Kurslar' },
  { id: '13', name: 'courses.delete', description: 'Kurs silme', category: 'Kurslar' },
  { id: '14', name: 'reports.view', description: 'Raporları görüntüleme', category: 'Raporlar' },
  { id: '15', name: 'settings.manage', description: 'Sistem ayarlarını yönetme', category: 'Ayarlar' },
  { id: '16', name: 'roles.manage', description: 'Rol ve yetkileri yönetme', category: 'Yetkilendirme' }
];

const mockRoles: Role[] = [
  {
    id: '1',
    name: 'Super Admin',
    description: 'Sistemde tüm yetkilere sahip süper yönetici',
    permissions: ['admin.dashboard', 'members.view', 'members.create', 'members.edit', 'members.delete', 'events.view', 'events.create', 'events.edit', 'events.delete', 'courses.view', 'courses.create', 'courses.edit', 'courses.delete', 'reports.view', 'settings.manage', 'roles.manage'],
    is_active: true,
    created_at: '2024-01-01',
    user_count: 2
  },
  {
    id: '2',
    name: 'Admin',
    description: 'Yönetici paneline erişimi olan admin',
    permissions: ['admin.dashboard', 'members.view', 'members.create', 'members.edit', 'events.view', 'events.create', 'events.edit', 'courses.view', 'courses.create', 'courses.edit', 'reports.view'],
    is_active: true,
    created_at: '2024-01-15',
    user_count: 5
  },
  {
    id: '3',
    name: 'Event Manager',
    description: 'Etkinlikleri yönetme yetkisine sahip kullanıcı',
    permissions: ['events.view', 'events.create', 'events.edit', 'members.view'],
    is_active: true,
    created_at: '2024-02-01',
    user_count: 3
  },
  {
    id: '4',
    name: 'Instructor',
    description: 'Kurs içerikleri oluşturabilen eğitmen',
    permissions: ['courses.view', 'courses.create', 'courses.edit', 'members.view'],
    is_active: true,
    created_at: '2024-02-15',
    user_count: 8
  },
  {
    id: '5',
    name: 'Member',
    description: 'Standart üye yetkileri',
    permissions: ['events.view', 'courses.view'],
    is_active: true,
    created_at: '2024-03-01',
    user_count: 250
  }
];

export function AdminRoles() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>(mockRoles);
  const [permissions] = useState<Permission[]>(mockPermissions);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    is_active: true
  });
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const categories = ['ALL', ...Array.from(new Set(permissions.map(p => p.category)))];

  const filteredPermissions = filterCategory === 'ALL' 
    ? permissions 
    : permissions.filter(p => p.category === filterCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingRole) {
      setRoles(roles.map(role => 
        role.id === editingRole.id 
          ? { ...role, ...formData }
          : role
      ));
    } else {
      const newRole: Role = {
        id: Date.now().toString(),
        ...formData,
        created_at: new Date().toISOString(),
        user_count: 0
      };
      setRoles([...roles, newRole]);
    }
    
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      is_active: true
    });
    setShowForm(false);
    setEditingRole(null);
  };

  const handleEdit = (role: Role) => {
    setFormData({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      is_active: role.is_active
    });
    setEditingRole(role);
    setShowForm(true);
  };

  const handleDelete = (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (role && role.user_count > 0) {
      alert('Bu rolde aktif kullanıcılar olduğu için silinemez.');
      return;
    }
    
    if (window.confirm('Bu rolü silmek istediğinize emin misiniz?')) {
      setRoles(roles.filter(role => role.id !== roleId));
    }
  };

  const togglePermission = (permissionName: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionName)
        ? prev.permissions.filter(p => p !== permissionName)
        : [...prev.permissions, permissionName]
    }));
  };

  const toggleRoleStatus = (roleId: string) => {
    setRoles(roles.map(role => 
      role.id === roleId 
        ? { ...role, is_active: !role.is_active }
        : role
    ));
  };

  const getPermissionCategory = (permissionName: string) => {
    const permission = permissions.find(p => p.name === permissionName);
    return permission?.category || 'Diğer';
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Erişim Kısıtlı</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Bu alan yalnızca Admin rolü için.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Rol ve Yetki Yönetimi</h1>
          <div className="flex space-x-3">
            <Button onClick={() => navigate('/admin')} className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Admin Paneli
            </Button>
            <Button onClick={() => setShowForm(true)} className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Yeni Rol
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingRole ? 'Rol Düzenle' : 'Yeni Rol Oluştur'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rol Adı
                    </label>
                    <Input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Açıklama
                    </label>
                    <Input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Rol Aktif
                  </label>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Yetkiler
                    </label>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'ALL' ? 'Tüm Kategoriler' : category}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {filteredPermissions.map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={permission.name}
                          checked={formData.permissions.includes(permission.name)}
                          onChange={() => togglePermission(permission.name)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label htmlFor={permission.name} className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {permission.description}
                          </div>
                          <div className="text-xs text-gray-500">
                            {permission.name} • {permission.category}
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    İptal
                  </Button>
                  <Button type="submit">
                    {editingRole ? 'Güncelle' : 'Oluştur'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {roles.map((role) => (
            <Card key={role.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{role.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={role.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {role.is_active ? 'Aktif' : 'Pasif'}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                      {role.user_count} kullanıcı
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Yetkiler</h4>
                    <div className="flex flex-wrap gap-2">
                      {role.permissions.slice(0, 5).map((permission) => (
                        <Badge key={permission} className="bg-gray-100 text-gray-800 text-xs">
                          {permission}
                        </Badge>
                      ))}
                      {role.permissions.length > 5 && (
                        <Badge className="bg-gray-100 text-gray-800 text-xs">
                          +{role.permissions.length - 5} daha
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t">
                    <div className="text-xs text-gray-500">
                      Oluşturulma: {new Date(role.created_at).toLocaleDateString('tr-TR')}
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(role)}
                        className="flex items-center"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Düzenle
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={role.is_active ? 'destructive' : 'default'}
                        onClick={() => toggleRoleStatus(role.id)}
                        className="flex items-center"
                      >
                        {role.is_active ? (
                          <>
                            <Lock className="h-3 w-3 mr-1" />
                            Pasifleştir
                          </>
                        ) : (
                          <>
                            <Unlock className="h-3 w-3 mr-1" />
                            Aktifleştir
                          </>
                        )}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(role.id)}
                        className="flex items-center"
                        disabled={role.user_count > 0}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Sil
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}