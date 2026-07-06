import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { announcementsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const AnnouncementManagement = () => {
  const { showError } = useNotification();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await announcementsAPI.getAll();
      setAnnouncements(response.data.announcements || response.data || []);
    } catch {
      setAnnouncements([]);
      showError('Unable to load announcements from the API.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Announcement Management</Typography>
          <Typography variant="body2" color="text.secondary">Real announcements only. No seeded notices are shown.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
      </Box>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        {loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer><Table size="small">
            <TableHead><TableRow><TableCell>Title</TableCell><TableCell>Type</TableCell><TableCell>Status</TableCell><TableCell>Created</TableCell></TableRow></TableHead>
            <TableBody>
              {announcements.map((item) => <TableRow key={item.id} hover><TableCell>{item.title_ko || item.title_en || item.title}</TableCell><TableCell><Chip size="small" label={item.type || '-'} /></TableCell><TableCell><Chip size="small" color={item.is_active === false ? 'default' : 'success'} label={item.is_active === false ? 'inactive' : 'active'} /></TableCell><TableCell>{item.created_at || '-'}</TableCell></TableRow>)}
              {announcements.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}>No announcements returned by the API.</TableCell></TableRow>}
            </TableBody>
          </Table></TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default AnnouncementManagement;