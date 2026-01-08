import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export function formatDate(dateString: string | Date | undefined | null) {
    if (!dateString) return '';
    try {
        return format(new Date(dateString), 'd MMMM yyyy HH:mm', { locale: tr });
    } catch {
        return '';
    }
}

export function formatShortDate(dateString: string | Date | undefined | null) {
    if (!dateString) return '';
    try {
        return format(new Date(dateString), 'd MMM yyyy', { locale: tr });
    } catch {
        return '';
    }
}
