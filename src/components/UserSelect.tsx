
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const wrapperRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            const inWrapper = wrapperRef.current && wrapperRef.current.contains(target);
            const inDropdown = dropdownRef.current && dropdownRef.current.contains(target);

            if (!inWrapper && !inDropdown) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update position whenever we open or resize
    const updatePosition = () => {
        if (wrapperRef.current) {
            const rect = wrapperRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width
            });
        }
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true); // Capture scroll to update/close
        }
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isOpen]);

    const handleSearch = async (text: string) => {
        setQuery(text);
        if (text.length < 2) {
            setUsers([]);
            setIsOpen(false);
            return;
        }

        if (!isOpen) {
            setIsOpen(true);
            updatePosition();
        }

        setLoading(true);
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
        setQuery('');
    };

    const dropdown = isOpen ? (
        <div
            ref={dropdownRef}
            style={{
                position: 'absolute',
                top: coords.top,
                left: coords.left,
                width: coords.width,
                zIndex: 9999
            }}
            className="bg-white rounded-md shadow-xl border border-gray-200 max-h-60 overflow-auto"
        >
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
    ) : null;

    return (
        <div ref={wrapperRef} className={`relative ${className || ''}`}>
            <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => { if (query.length >= 2) setIsOpen(true); }}
                placeholder={placeholder || "Üye ara..."}
                className="block w-full text-[10px] border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 py-1 px-2"
            />
            {isOpen && createPortal(dropdown, document.body)}
        </div>
    );
}
