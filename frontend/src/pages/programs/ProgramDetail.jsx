import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Divider, Grid, Skeleton, Typography } from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CalendarToday as CalendarIcon,
  Group as GroupIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { programsAPI } from '../../services/api';
import CategoryBadge from '../../components/common/CategoryBadge';
import StatusBadge from '../../components/common/StatusBadge';

const ProgramDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);

  useEffect(() => {
    const fetchProgram = async () => {
      setLoading(true);
      try {
        const response = await programsAPI.getById(id);
        setProgram(response.data?.program || response.data || null);
      } catch {
        setProgram(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProgram();
  }, [id]);

  if (loading) return <Box><Skeleton variant="rectangular" height={200} sx={{ mb: 3 }} /><Skeleton variant="rectangular" height={400} /></Box>;

  if (!program) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">This program was not found in the API.</Typography>
        <Button onClick={() => navigate('/programs')} sx={{ mt: 2 }}>Back to programs</Button>
      </Box>
    );
  }

  const capacity = program.max_participants || 0;
  const current = program.current_participants || 0;
  const percent = capacity > 0 ? Math.min(100, (current / capacity) * 100) : 0;

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/programs')} sx={{ mb: 2 }}>Back to programs</Button>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <CategoryBadge category={program.category} />
                  <StatusBadge status={program.status} />
                </Box>
                <Typography variant="h5" fontWeight={700}>{program.title_ko || program.title}</Typography>
                {program.title_en && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{program.title_en}</Typography>}
              </Box>
              <Divider sx={{ my: 3 }} />
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}><Box sx={{ display: 'flex', gap: 1 }}><CalendarIcon color="action" fontSize="small" /><Box><Typography variant="caption" color="text.secondary">Recruitment</Typography><Typography variant="body2">{program.recruitment_start || '-'} - {program.recruitment_end || '-'}</Typography></Box></Box></Grid>
                <Grid item xs={12} sm={6}><Box sx={{ display: 'flex', gap: 1 }}><CalendarIcon color="action" fontSize="small" /><Box><Typography variant="caption" color="text.secondary">Program period</Typography><Typography variant="body2">{program.program_start || '-'} - {program.program_end || '-'}</Typography></Box></Box></Grid>
                <Grid item xs={12} sm={6}><Box sx={{ display: 'flex', gap: 1 }}><LocationIcon color="action" fontSize="small" /><Box><Typography variant="caption" color="text.secondary">Location</Typography><Typography variant="body2">{program.location || 'Online'}</Typography></Box></Box></Grid>
                <Grid item xs={12} sm={6}><Box sx={{ display: 'flex', gap: 1 }}><PersonIcon color="action" fontSize="small" /><Box><Typography variant="caption" color="text.secondary">Instructor</Typography><Typography variant="body2">{program.instructor || '-'}</Typography></Box></Box></Grid>
              </Grid>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Description</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{program.description_ko || program.description || 'No description provided.'}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Application Status</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <GroupIcon color="action" />
                <Typography variant="body2">{current} / {capacity || '-'} applicants</Typography>
              </Box>
              <Box sx={{ height: 8, backgroundColor: '#E5E5E5', borderRadius: 4, overflow: 'hidden', mb: 3 }}>
                <Box sx={{ height: '100%', width: `${percent}%`, backgroundColor: '#0047BA' }} />
              </Box>
              <Button fullWidth variant="contained" size="large" disabled={program.status === 'closed'} onClick={() => navigate(`/programs/${id}/apply`)}>
                Apply
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProgramDetail;
