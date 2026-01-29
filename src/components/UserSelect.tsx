
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/api';

interface User {
    id: string;
    name: string;
    profession: string;
    email: string;
}

interface UserSelectProps {
    onSelect: (user: User) => void;
    placeholder?: string;
    className?: string;
}

export function UserSelect({ onSelect, placeholder, className }: UserSelectProps) {
    const [query, setQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSearch = async (text: string) => {
        setQuery(text);

        if (text.length < 2) {
            setUsers([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        setIsOpen(true);
        try {
            const results = await api.searchMembers({ name: text });
            setUsers(results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (user: User) => {
        setQuery(user.name);
        onSelect(user);
        setIsOpen(false);
        setQuery(''); // Clear after selection or keep? Usually clear if used for action.
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={placeholder || "Üye ara..."}
                className="block w-full text-[10px] border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-1 px-2"
            />
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                    {loading && <div className="p-2 text-xs text-gray-500">Aranıyor...</div>}
                    {!loading && users.length === 0 && (
                        <div className="p-2 text-xs text-gray-500">Sonuç bulunamadı</div>
                    )}
                    {!loading && users.map((user) => (
                        <div
                            key={user.id}
                            onClick={() => handleSelect(user)}
                            className="px-3 py-2 text-xs text-gray-700 hover:bg-indigo-50 cursor-pointer border-b last:border-0"
                        >
                            <div className="font-bold">{user.name}</div>
                            <div className="text-gray-500">{user.profession}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
