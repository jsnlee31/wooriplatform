import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { inquiriesAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const InquiryManagement = () => {
  const { showError } = useNotification();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await inquiriesAPI.getAll();
      setInquiries(response.data.inquiries || response.data || []);
    } catch {
      setInquiries([]);
      showError('Unable to load inquiries from the API.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box><Typography variant="h5" fontWeight={700}>Inquiry Management</Typography><Typography variant="body2" color="text.secondary">Real support inquiries only. No seeded inquiries are shown.</Typography></Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
      </Box>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        {loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer><Table size="small"><TableHead><TableRow><TableCell>User</TableCell><TableCell>Title</TableCell><TableCell>Category</TableCell><TableCell>Status</TableCell></TableRow></TableHead><TableBody>
            {inquiries.map((item) => <TableRow key={item.id} hover><TableCell>{item.user_name || item.email || '-'}</TableCell><TableCell>{item.title}</TableCell><TableCell>{item.category || '-'}</TableCell><TableCell><Chip size="small" label={item.status || 'open'} /></TableCell></TableRow>)}
            {inquiries.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 6 }}>No inquiries returned by the API.</TableCell></TableRow>}
          </TableBody></Table></TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default InquiryManagement;