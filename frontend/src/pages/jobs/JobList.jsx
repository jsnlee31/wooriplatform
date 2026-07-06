import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Card, CardContent, Chip, CircularProgress, Grid, TextField, Typography } from '@mui/material';
import { jobsAPI } from '../../services/api';

const JobList = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await jobsAPI.getAll();
        setJobs(response.data.jobs || response.data || []);
      } catch {
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = jobs.filter((job) => {
    const text = `${job.company_name || job.company || ''} ${job.title_ko || job.title_en || job.title || ''}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}><Typography variant="h5" fontWeight={700}>Jobs</Typography><Typography variant="body2" color="text.secondary">Real opportunities loaded from the API.</Typography></Box>
      <TextField fullWidth size="small" label="Search jobs" value={search} onChange={(event) => setSearch(event.target.value)} sx={{ mb: 2 }} />
      {loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : (
        <Grid container spacing={2}>
          {filtered.map((job) => <Grid item xs={12} md={6} key={job.id}><Card sx={{ cursor: 'pointer' }} onClick={() => navigate(`/jobs/${job.id}`)}><CardContent><Typography variant="caption" color="text.secondary">{job.company_name || job.company || '-'}</Typography><Typography variant="h6" fontWeight={700}>{job.title_ko || job.title_en || job.title}</Typography><Chip sx={{ mt: 1 }} size="small" label={job.location || 'Location TBD'} /></CardContent></Card></Grid>)}
          {filtered.length === 0 && <Grid item xs={12}><Card><CardContent><Typography align="center" color="text.secondary">No jobs returned by the API.</Typography></CardContent></Card></Grid>}
        </Grid>
      )}
    </Box>
  );
};

export default JobList;