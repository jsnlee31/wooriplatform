import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { programsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const ProgramManagement = () => {
  const { showError } = useNotification();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await programsAPI.getAll();
      setPrograms(response.data.programs || response.data || []);
    } catch {
      setPrograms([]);
      showError('Unable to load programs from the API.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box><Typography variant="h5" fontWeight={700}>Program Management</Typography><Typography variant="body2" color="text.secondary">Real programs only. No seeded program applications are shown.</Typography></Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
      </Box>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        {loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Title</TableCell><TableCell>Category</TableCell><TableCell>Status</TableCell><TableCell>Recruitment</TableCell><TableCell>Capacity</TableCell></TableRow></TableHead><TableBody>
            {programs.map((program) => <TableRow key={program.id} hover><TableCell>{program.title_ko || program.title_en}</TableCell><TableCell><Chip size="small" label={program.category || '-'} /></TableCell><TableCell>{program.status || '-'}</TableCell><TableCell>{program.recruitment_start || '-'} - {program.recruitment_end || '-'}</TableCell><TableCell>{program.current_participants || 0}/{program.max_participants || '-'}</TableCell></TableRow>)}
            {programs.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>No programs returned by the API.</TableCell></TableRow>}
          </TableBody></Table></TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default ProgramManagement;