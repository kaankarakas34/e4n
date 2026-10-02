import React from 'react';
import { createRoot } from 'react-dom/client';
import AdminReports from '../src/pages/AdminReports';
import '../src/index.css';

// Mount only the report component; the browser runner must intercept its API.
createRoot(document.getElementById('root')!).render(<AdminReports />);
