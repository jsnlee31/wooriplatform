import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Grid, IconButton, Skeleton, Typography } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Bookmark as BookmarkIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { jobsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const Favorites = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const response = await jobsAPI.getBookmarks();
        setFavorites(response.data?.bookmarks || []);
      } catch {
        setFavorites([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, []);

  const handleRemove = async (id) => {
    try {
      await jobsAPI.removeBookmark(id);
      setFavorites((items) => items.filter((item) => item.id !== id));
      showSuccess('Removed from saved jobs.');
    } catch {
      showError('Unable to remove saved job.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/jobs')} sx={{ mb: 2 }}>Back to jobs</Button>
        <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <BookmarkIcon color="primary" />
          Saved Jobs
        </Typography>
      </Box>

      {loading ? (
        <Grid container spacing={2}>{[1, 2, 3].map((item) => <Grid item xs={12} sm={6} md={4} key={item}><Skeleton variant="rectangular" height={150} sx={{ borderRadius: 1 }} /></Grid>)}</Grid>
      ) : favorites.length === 0 ? (
        <Card><CardContent sx={{ textAlign: 'center', py: 8 }}><BookmarkIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} /><Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>No saved jobs returned by the API.</Typography><Button variant="contained" onClick={() => navigate('/jobs')}>Browse jobs</Button></CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {favorites.map((job) => (
            <Grid item xs={12} sm={6} md={4} key={job.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ cursor: 'pointer', flex: 1 }} onClick={() => navigate(`/jobs/${job.id}`)}>
                      <Typography variant="caption" color="text.secondary">{job.company || job.organization}</Typography>
                      <Typography variant="subtitle1" fontWeight={600}>{job.title_ko || job.title || job.position}</Typography>
                      <Typography variant="body2" color="text.secondary">{job.location} | {job.employment_type}</Typography>
                      <Typography variant="caption" color="error">Deadline: {job.deadline || '-'}</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleRemove(job.id)} sx={{ color: 'error.main' }}><DeleteIcon fontSize="small" /></IconButton>
                  </Box>
                  <Button fullWidth variant="outlined" size="small" sx={{ mt: 2 }} onClick={() => navigate(`/jobs/${job.id}`)}>View details</Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default Favorites;
