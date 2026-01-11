
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api/api';
import { Card } from '../shared/Card';

interface Profession {
    id: string;
    name: string;
    category: string;
}

interface ProfessionSelectProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function ProfessionSelect({ value, onChange, className }: ProfessionSelectProps) {
    const [query, setQuery] = useState(value);
    const [professions, setProfessions] = useState<Profession[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Sync internal state if value changes externally
        setQuery(value);
    }, [value]);

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
        onChange(text); // Update parent immediately as text, we'll validate later or allow free text if needed

        if (text.length < 2) {
            setProfessions([]);
            setIsOpen(false);
            return;
        }

        setLoading(true);
        setIsOpen(true);
        try {
            // In a real app we might debounce this
            const results = await api.getProfessions(text);
            setProfessions(results);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (prof: Profession) => {
        setQuery(prof.name);
        onChange(prof.name);
        setIsOpen(false);
    };

    return (
        <div ref={wrapperRef} className={`relative ${className}`}>
            <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => query.length >= 2 && setIsOpen(true)}
                placeholder="Meslek seçmek için yazın..."
                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
                    {loading && <div className="p-2 text-sm text-gray-500">Aranıyor...</div>}
                    {!loading && professions.length === 0 && (
                        <div
                            className="p-2 text-sm text-blue-600 cursor-pointer hover:bg-blue-50"
                            onClick={() => {
                                setIsOpen(false);
                                // onChange is already called on input change, so we just close to "confirm" custom entry
                            }}
                        >
                            "{query}" olarak kullan
                        </div>
                    )}
                    {!loading && professions.map((prof) => (
                        <div
                            key={prof.id}
                            onClick={() => handleSelect(prof)}
                            className="px-4 py-2 text-sm text-gray-700 hover:bg-red-50 cursor-pointer flex justify-between"
                        >
                            <span>{prof.name}</span>
                            <span className="text-xs text-gray-400 self-center">{prof.category}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
