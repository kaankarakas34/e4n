import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../shared/Card';
import { Button } from '../shared/Button';
import { Search, Users, ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { api } from '../api/api';
import { Modal } from '../shared/Modal';

interface PowerTeam {
    id: string;
    name: string;
    description: string;
    status: string;
    contact_person?: string; // Optional if not in schema yet
}

export function PowerTeams() {
    const { user } = useAuthStore();
    const [teams, setTeams] = useState<PowerTeam[]>([]);
    const [filteredTeams, setFilteredTeams] = useState<PowerTeam[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTeam, setSelectedTeam] = useState<PowerTeam | null>(null);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<string[]>([]);
    const [myTeams, setMyTeams] = useState<string[]>([]);

    useEffect(() => {
        if (user?.id) {
            api.getUserPowerTeams(user.id).then(teams => setMyTeams(teams.map((t: any) => t.id)));
            api.getUserPowerTeamRequests(user.id).then(setPendingRequests);
        }
    }, [user?.id]);

    useEffect(() => {
        if (selectedTeam) {
            setLoadingMembers(true);
            api.getPowerTeamMembers(selectedTeam.id)
                .then(setTeamMembers)
                .catch(() => setTeamMembers([]))
                .finally(() => setLoadingMembers(false));
        } else {
            setTeamMembers([]);
        }
    }, [selectedTeam]);

    useEffect(() => {
        fetchTeams();
    }, []);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = teams.filter(
            (team) =>
                team.name.toLowerCase().includes(lowerTerm) ||
                (team.description && team.description.toLowerCase().includes(lowerTerm))
        );
        setFilteredTeams(filtered);
    }, [searchTerm, teams]);

    const fetchTeams = async () => {
        try {
            const data = await api.getPowerTeams();
            setTeams(data);
            setFilteredTeams(data);
        } catch (error) {
            console.error('Error fetching power teams:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleJoinRequest = async () => {
        if (!selectedTeam || !user?.id) return;

        try {
            await api.requestJoinPowerTeam(user.id, selectedTeam.id);
            setPendingRequests(prev => [...prev, selectedTeam.id]);
        } catch (error) {
            console.error('Failed to send join request:', error);
        }
    };

    return (
        <div className="py-4">
            {/* Search and Filters */}
            <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Lonca ara (isim, meslek grubu, açıklama...)"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Loading State */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="animate-pulse bg-white p-6 rounded-lg h-48 shadow-sm">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Grid of Power Teams */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredTeams.length > 0 ? (
                        filteredTeams.map((team) => (
                            <div
                                key={team.id}
                                className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300 flex flex-col overflow-hidden"
                            >
                                <div className="p-6 flex-1">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="p-3 bg-indigo-50 rounded-lg">
                                            <Users className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <span
                                            className={`px-2 py-1 text-xs font-semibold rounded-full ${team.status === 'ACTIVE'
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {team.status === 'ACTIVE' ? 'Aktif' : 'Taslak'}
                                        </span>
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{team.name}</h3>
                                    <p className="text-gray-600 text-sm line-clamp-3">
                                        {team.description || 'Bu lonca için henüz bir açıklama girilmemiş.'}
                                    </p>
                                </div>
                                <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                    <div className="text-sm text-gray-500">
                                        {/* Placeholder for member count if available, or just static text */}
                                        Profesyonel Ağ
                                    </div>
                                    <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 p-0 font-medium" onClick={() => setSelectedTeam(team)}>
                                        İncele <ArrowRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center">
                            <Users className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-base font-semibold text-gray-900">Sonuç Bulunamadı</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Aradığınız kriterlere uygun bir lonca bulunmuyor.
                            </p>
                        </div>
                    )}
                </div>
            )}

            <Modal
                open={!!selectedTeam}
                title={selectedTeam?.name || ''}
                onClose={() => setSelectedTeam(null)}
            >
                <div className="space-y-6">
                    {selectedTeam?.description && (
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <h4 className="text-sm font-medium text-gray-900 mb-1">Hakkında</h4>
                            <p className="text-sm text-gray-600">{selectedTeam.description}</p>
                        </div>
                    )}

                    <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center justify-between">
                            <span>Mevcut Üyeler</span>
                            <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                {teamMembers.length} Üye
                            </span>
                        </h4>

                        {loadingMembers ? (
                            <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
                        ) : teamMembers.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1">
                                {teamMembers.map((m: any) => (
                                    <div key={m.id} className="flex items-center p-2 border rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="h-8 w-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold mr-3 text-xs">
                                            {m.full_name ? m.full_name.charAt(0) : 'U'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 truncate">{m.full_name || m.name}</p>
                                            <p className="text-xs text-gray-500 truncate">{m.profession}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg text-sm">
                                Bu loncaya henüz hiç üye kaydedilmemiş.
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4 border-t space-x-2">
                        <Button variant="outline" onClick={() => setSelectedTeam(null)}>Kapat</Button>
                        {(() => {
                            if (!selectedTeam) return null;
                            const isMember = myTeams.includes(selectedTeam.id);
                            const isPending = pendingRequests.includes(selectedTeam.id);

                            if (isMember) {
                                return (
                                    <span className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-green-700 bg-green-100">
                                        Zaten Üyesiniz
                                    </span>
                                );
                            }

                            if (isPending) {
                                return (
                                    <Button variant="secondary" disabled className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                        İstek Gönderildi
                                    </Button>
                                );
                            }

                            return (
                                <Button variant="primary" onClick={handleJoinRequest}>
                                    Loncaya Katılma İsteği Gönder
                                </Button>
                            );
                        })()}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
