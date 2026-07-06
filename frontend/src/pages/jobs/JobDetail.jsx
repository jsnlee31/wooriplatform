import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Chip, Divider, Grid, Skeleton, Typography } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  CalendarToday as CalendarIcon,
  LocationOn as LocationIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { jobsAPI } from '../../services/api';
import { useNotification } from '../../contexts/NotificationContext';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    const fetchJob = async () => {
      setLoading(true);
      try {
        const response = await jobsAPI.getById(id);
        const nextJob = response.data?.job || response.data;
        setJob(nextJob || null);
        setBookmarked(Boolean(nextJob?.is_bookmarked));
      } catch {
        setJob(null);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  const handleBookmark = async () => {
    try {
      if (bookmarked) {
        await jobsAPI.removeBookmark(id);
        showSuccess('Removed from saved jobs.');
      } else {
        await jobsAPI.bookmark(id);
        showSuccess('Saved job.');
      }
      setBookmarked((value) => !value);
    } catch {
      showError('Unable to update saved jobs.');
    }
  };

  const handleApply = () => {
    if (job.external_url) window.open(job.external_url, '_blank', 'noopener,noreferrer');
    else navigate(`/jobs/${id}/apply`);
  };

  if (loading) {
    return <Box><Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} /><Skeleton variant="rectangular" height={400} /></Box>;
  }

  if (!job) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">This job was not found in the API.</Typography>
        <Button onClick={() => navigate('/jobs')} sx={{ mt: 2 }}>Back to jobs</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/jobs')} sx={{ mb: 2 }}>Back to jobs</Button>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary">{job.company || job.organization || 'Organization'}</Typography>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>{job.title_ko || job.title}</Typography>
                {job.title_en && <Typography variant="body2" color="text.secondary">{job.title_en}</Typography>}
              </Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}><Box sx={{ display: 'flex', gap: 1 }}><LocationIcon color="action" fontSize="small" /><Box><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body2">{job.location || '-'}</Typography></Box></Box></Grid>
                <Grid item xs={12} sm={4}><Box sx={{ display: 'flex', gap: 1 }}><WorkIcon color="action" fontSize="small" /><Box><Typography variant="caption" color="text.secondary">Type</Typography><Typography variant="body2">{job.employment_type || '-'}</Typography></Box></Box></Grid>
                <Grid item xs={12} sm={4}><Box sx={{ display: 'flex', gap: 1 }}><CalendarIcon color="action" fontSize="small" /><Box><Typography variant="caption" color="text.secondary">Deadline</Typography><Typography variant="body2">{job.deadline || '-'}</Typography></Box></Box></Grid>
              </Grid>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Details</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8, mb: 3 }}>{job.description || 'No description provided.'}</Typography>
              {Array.isArray(job.requirements) && job.requirements.length > 0 && (
                <>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Requirements</Typography>
                  {job.requirements.map((item, index) => <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>- {item}</Typography>)}
                </>
              )}
              {Array.isArray(job.benefits) && job.benefits.length > 0 && (
                <>
                  <Typography variant="h6" fontWeight={600} sx={{ mt: 3, mb: 2 }}>Benefits</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>{job.benefits.map((item, index) => <Chip key={index} label={item} variant="outlined" />)}</Box>
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Apply</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Posted: {job.posted_date || job.created_at || '-'}</Typography>
              <Typography variant="body2" color="error" sx={{ mb: 3 }}>Deadline: {job.deadline || '-'}</Typography>
              <Button fullWidth variant="contained" size="large" onClick={handleApply} sx={{ mb: 2 }}>Apply</Button>
              <Button fullWidth variant="outlined" startIcon={bookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />} onClick={handleBookmark}>{bookmarked ? 'Saved' : 'Save job'}</Button>
              {job.contact && <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid #E5E5E5' }}><Typography variant="body2" color="text.secondary">Contact: {job.contact}</Typography></Box>}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default JobDetail;
