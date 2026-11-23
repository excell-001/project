export function formatDateID(dateString, options = {}) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '-';

  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    ...options,
  });
}

export function formatScore(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '-';
  }
  return Number(value).toLocaleString('id-ID', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export const SUPERVISION_STATUS_MAP = {
  scheduled: {
    label: 'Dijadwalkan',
    variant: 'info',
  },
  in_progress: {
    label: 'Sedang Dinilai',
    variant: 'warning',
  },
  awaiting_signature: {
    label: 'Menunggu TTD Guru',
    variant: 'purple',
  },
  completed: {
    label: 'Selesai',
    variant: 'success',
  },
};