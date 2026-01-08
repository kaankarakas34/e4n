import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/api';
import { Card, CardContent, CardHeader, CardTitle } from './Card';
import { Users, User } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export function GroupMembersWidget() {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [groupName, setGroupName] = useState('');

    useEffect(() => {
        const loadMembers = async () => {
            if (!user?.id) return;
            try {
                // Get user's group
                const groups = await api.getUserGroups(user.id);
                if (groups.length > 0) {
                    const gid = groups[0].id; // Primary group
                    setGroupName(groups[0].name);
                    const mems = await api.getGroupMembers(gid);
                    setMembers(mems);
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        loadMembers();
    }, [user]);

    if (!user) return null;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-bold flex items-center">
                    <Users className="h-5 w-5 mr-2 text-indigo-600" />
                    {groupName ? `${groupName} Üyeleri` : 'Grup Üyeleri'}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-sm text-gray-500 py-4">Yükleniyor...</div>
                ) : members.length === 0 ? (
                    <div className="text-sm text-gray-500 py-4">Grup üyeliği bulunamadı.</div>
                ) : (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                        {members.map((member) => (
                            <div
                                key={member.id}
                                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors group"
                                onClick={() => navigate(`/profile/${member.id}`)}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border border-gray-100 flex-shrink-0">
                                        {member.profile_image ? (
                                            <img src={member.profile_image} alt={member.full_name} className="h-full w-full object-cover" />
                                        ) : (
                                            <User className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 group-hover:underline">
                                            {member.full_name || member.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate max-w-[140px]">{member.profession}</p>
                                    </div>
                                </div>
                                <div className={`h-2 w-2 rounded-full ${member.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`} title={member.status === 'ACTIVE' ? 'Aktif' : 'Pasif'}></div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
