import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, CircularProgress, TextField, Typography } from '@mui/material';
import { announcementsAPI } from '../../services/api';

const Notices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await announcementsAPI.getAll();
        setNotices(response.data.announcements || response.data || []);
      } catch {
        setNotices([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = notices.filter((notice) => `${notice.title_ko || notice.title_en || notice.title || ''}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <Box>
      <Box sx={{ mb: 3 }}><Typography variant="h5" fontWeight={700}>Notices</Typography><Typography variant="body2" color="text.secondary">Real announcements from the API.</Typography></Box>
      <TextField fullWidth size="small" label="Search notices" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ mb: 2 }} />
      {loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : filtered.length === 0 ? <Card><CardContent><Typography align="center" color="text.secondary">No notices returned by the API.</Typography></CardContent></Card> : filtered.map((notice) => <Card key={notice.id} sx={{ mb: 1 }}><CardContent><Typography fontWeight={700}>{notice.title_ko || notice.title_en || notice.title}</Typography><Typography variant="body2" color="text.secondary">{notice.created_at || ''}</Typography></CardContent></Card>)}
    </Box>
  );
};

export default Notices;