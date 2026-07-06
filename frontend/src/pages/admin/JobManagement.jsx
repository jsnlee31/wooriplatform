import React, { useCallback, useEffect, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { jobsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const JobManagement = () => {
  const { showError } = useNotification();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const response = await jobsAPI.getAll();
      setJobs(response.data.jobs || response.data || []);
    } catch {
      setJobs([]);
      showError('Unable to load jobs from the API.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => { load(); }, [load]);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box><Typography variant="h5" fontWeight={700}>Job Management</Typography><Typography variant="body2" color="text.secondary">Real job data only. No seeded job postings are shown.</Typography></Box>
        <Button variant="outlined" startIcon={<RefreshIcon />} onClick={load}>Refresh</Button>
      </Box>
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        {loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : (
          <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Company</TableCell><TableCell>Title</TableCell><TableCell>Location</TableCell><TableCell>Type</TableCell><TableCell>Deadline</TableCell></TableRow></TableHead><TableBody>
            {jobs.map((job) => <TableRow key={job.id} hover><TableCell>{job.company_name || job.company || '-'}</TableCell><TableCell>{job.title_ko || job.title_en || job.title}</TableCell><TableCell>{job.location || '-'}</TableCell><TableCell><Chip size="small" label={job.employment_type || '-'} /></TableCell><TableCell>{job.deadline || '-'}</TableCell></TableRow>)}
            {jobs.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 6 }}>No jobs returned by the API.</TableCell></TableRow>}
          </TableBody></Table></TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default JobManagement;