import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Skeleton,
  Typography,
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Campaign as AnnouncementIcon,
  Chat as ChatIcon,
  MenuBook as MenuBookIcon,
  School as SchoolIcon,
  Work as WorkIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { dashboardAPI } from '../../services/api';
import CategoryBadge from '../../components/common/CategoryBadge';
import StatusBadge from '../../components/common/StatusBadge';

const StatCard = ({ icon, label, value, path }) => {
  const navigate = useNavigate();
  return (
    <Card onClick={() => path && navigate(path)} sx={{ cursor: path ? 'pointer' : 'default', height: '100%' }}>
      <CardContent>
        <Box sx={{ color: 'primary.main', mb: 1 }}>{icon}</Box>
        <Typography variant="h4" fontWeight={700}>{Number(value || 0).toLocaleString()}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </CardContent>
    </Card>
  );
};

const EmptyState = ({ text }) => (
  <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>{text}</Typography>
);

const Home = () => {
  useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setMessage('');
      try {
        const response = await dashboardAPI.getHome();
        setDashboardData(response.data || {});
      } catch {
        setDashboardData({});
        setMessage('Unable to load dashboard data from the API.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const stats = dashboardData?.stats || {};
  const announcements = dashboardData?.announcements || [];
  const programs = dashboardData?.programs || [];
  const jobs = dashboardData?.jobs || [];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Asian Games Delegation Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">Live programs, learning, consultations, and notices.</Typography>
      </Box>

      {message && <Alert severity="warning" sx={{ mb: 2 }}>{message}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {loading ? [1, 2, 3].map((item) => <Grid item xs={12} md={4} key={item}><Skeleton variant="rectangular" height={120} /></Grid>) : (
          <>
            <Grid item xs={12} md={4}><StatCard icon={<AssignmentIcon />} label="Applied programs" value={stats.appliedPrograms} path="/programs" /></Grid>
            <Grid item xs={12} md={4}><StatCard icon={<ChatIcon />} label="Scheduled consultations" value={stats.scheduledConsultations} path="/activities/consultations" /></Grid>
            <Grid item xs={12} md={4}><StatCard icon={<SchoolIcon />} label="Ongoing courses" value={stats.ongoingCourses} path="/learning" /></Grid>
          </>
        )}
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}><AnnouncementIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />Announcements</Typography>
                <Button size="small" onClick={() => navigate('/announcements')}>View all</Button>
              </Box>
              {loading ? [1, 2, 3].map((item) => <Skeleton key={item} height={48} />) : announcements.length === 0 ? <EmptyState text="No announcements returned by the API." /> : announcements.slice(0, 5).map((item) => (
                <Box key={item.id} onClick={() => navigate(`/announcements/${item.id}`)} sx={{ py: 1.5, borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                  <Typography fontWeight={600}>{item.title || item.title_ko}</Typography>
                  <Typography variant="caption" color="text.secondary">{item.created_at || item.date}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}><WorkIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />Job Recommendations</Typography>
                <Button size="small" onClick={() => navigate('/jobs')}>View all</Button>
              </Box>
              {loading ? [1, 2].map((item) => <Skeleton key={item} height={56} />) : jobs.length === 0 ? <EmptyState text="No job recommendations returned by the API." /> : jobs.slice(0, 4).map((job) => (
                <Box key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} sx={{ py: 1.5, borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                  <Typography fontWeight={600}>{job.title || job.title_ko || job.position}</Typography>
                  <Typography variant="caption" color="text.secondary">{job.company || job.organization} | {job.location}</Typography>
                </Box>
              ))}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}><MenuBookIcon fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />Programs</Typography>
                <Button size="small" onClick={() => navigate('/programs')}>View all</Button>
              </Box>
              <Grid container spacing={2}>
                {loading ? [1, 2].map((item) => <Grid item xs={12} md={6} key={item}><Skeleton variant="rectangular" height={150} /></Grid>) : programs.length === 0 ? <Grid item xs={12}><EmptyState text="No programs returned by the API." /></Grid> : programs.slice(0, 4).map((program) => (
                  <Grid item xs={12} md={6} key={program.id}>
                    <Card variant="outlined" onClick={() => navigate(`/programs/${program.id}`)} sx={{ cursor: 'pointer' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', gap: 1, mb: 1 }}><CategoryBadge category={program.category} /><StatusBadge status={program.status} /></Box>
                        <Typography fontWeight={700}>{program.title || program.title_ko}</Typography>
                        <Typography variant="body2" color="text.secondary">{program.program_start || program.recruitment_start} - {program.program_end || program.recruitment_end}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
