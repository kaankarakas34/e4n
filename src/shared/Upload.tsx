
import { useState, useRef } from 'react';
import { Upload as UploadIcon, X, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface UploadProps {
    onFileSelect: (file: File) => void;
    accept?: string;
    label?: string;
    maxSizeMB?: number;
}

export function Upload({ onFileSelect, accept = 'image/*', label = 'Dosya Yükle', maxSizeMB = 5 }: UploadProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > maxSizeMB * 1024 * 1024) {
            setError(`Dosya boyutu ${maxSizeMB}MB'dan küçük olmalıdır.`);
            return;
        }

        setSelectedFile(file);
        setError(null);
        onFileSelect(file);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setPreviewUrl(null);
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{label}</label>

            {!selectedFile ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-gray-50 transition-colors"
                >
                    <div className="p-3 bg-indigo-50 rounded-full mb-3">
                        <UploadIcon className="h-6 w-6 text-indigo-600" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">Tıklayın veya sürükleyin</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, PDF (Max {maxSizeMB}MB)</p>
                </div>
            ) : (
                <div className="relative border border-gray-200 rounded-lg p-4 bg-white shadow-sm flex items-center space-x-4">
                    <div className="flex-shrink-0 h-16 w-16 bg-gray-100 rounded-md overflow-hidden flex items-center justify-center border border-gray-200">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                        ) : (
                            <FileText className="h-8 w-8 text-gray-400" />
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <button
                        type="button"
                        onClick={clearFile}
                        className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-red-500 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
            )}

            {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
            />
        </div>
    );
}
