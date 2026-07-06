import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { faqAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const FAQManagement = () => {
  const { showError } = useNotification();
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await faqAPI.getAll();
      setFaqs(response.data.faqs || response.data || []);
    } catch {
      setFaqs([]);
      showError('Unable to load FAQ entries from the API.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box><Typography variant="h5" fontWeight={700}>FAQ Management</Typography><Typography variant="body2" color="text.secondary">Real FAQ data only. No seeded FAQ rows are shown.</Typography></Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
      </Box>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        {loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Question</TableCell><TableCell>Category</TableCell><TableCell>Active</TableCell></TableRow></TableHead><TableBody>
            {faqs.map((faq) => <TableRow key={faq.id} hover><TableCell>{faq.question_ko || faq.question_en || faq.question}</TableCell><TableCell>{faq.category_name || faq.category_id || '-'}</TableCell><TableCell>{faq.is_active === false ? 'No' : 'Yes'}</TableCell></TableRow>)}
            {faqs.length === 0 && <TableRow><TableCell colSpan={3} align="center" sx={{ py: 6 }}>No FAQ entries returned by the API.</TableCell></TableRow>}
          </TableBody></Table></TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default FAQManagement;