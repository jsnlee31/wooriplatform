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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Assignment as ProgramIcon,
  Campaign as AnnouncementIcon,
  People as PeopleIcon,
  School as CourseIcon,
  SupportAgent as ConsultationIcon,
  Work as JobIcon,
} from '@mui/icons-material';
import { dashboardAPI, programsAPI, coursesAPI, jobsAPI, announcementsAPI, consultationsAPI, usersAPI } from '../../services/api';

const metricCards = [
  { key: 'users', label: 'Users', icon: <PeopleIcon />, path: '/admin/users' },
  { key: 'programs', label: 'Programs', icon: <ProgramIcon />, path: '/admin/programs' },
  { key: 'courses', label: 'Courses', icon: <CourseIcon />, path: '/admin/courses' },
  { key: 'jobs', label: 'Jobs', icon: <JobIcon />, path: '/admin/jobs' },
  { key: 'announcements', label: 'Notices', icon: <AnnouncementIcon />, path: '/admin/announcements' },
  { key: 'consultations', label: 'Consultations', icon: <ConsultationIcon />, path: '/admin/consultations' },
];

const countFrom = (payload, keys = []) => {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key].length;
    if (typeof payload?.[key] === 'number') return payload[key];
  }
  if (Array.isArray(payload)) return payload.length;
  return 0;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [metrics, setMetrics] = useState({});
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setMessage('');
      try {
        const [stats, users, programs, courses, jobs, announcements, consultationStats] = await Promise.allSettled([
          dashboardAPI.getStats(),
          usersAPI.getAll(),
          programsAPI.getAll(),
          coursesAPI.getAll(),
          jobsAPI.getAll(),
          announcementsAPI.getAll(),
          consultationsAPI.getAdminStats(),
        ]);

        const statsData = stats.status === 'fulfilled' ? stats.value.data : {};
        const userData = users.status === 'fulfilled' ? users.value.data : {};
        const programData = programs.status === 'fulfilled' ? programs.value.data : {};
        const courseData = courses.status === 'fulfilled' ? courses.value.data : {};
        const jobData = jobs.status === 'fulfilled' ? jobs.value.data : {};
        const announcementData = announcements.status === 'fulfilled' ? announcements.value.data : {};
        const consultationData = consultationStats.status === 'fulfilled' ? consultationStats.value.data : {};

        setMetrics({
          users: statsData.users ?? countFrom(userData, ['users']),
          programs: statsData.programs ?? countFrom(programData, ['programs']),
          courses: statsData.courses ?? countFrom(courseData, ['courses']),
          jobs: statsData.jobs ?? countFrom(jobData, ['jobs']),
          announcements: statsData.announcements ?? countFrom(announcementData, ['announcements']),
          consultations: statsData.consultations ?? consultationData.summary?.total ?? 0,
        });

        setRecent([
          ...(announcementData.announcements || []).slice(0, 3).map((item) => ({ type: 'Notice', title: item.title || item.title_ko, date: item.created_at || item.date })),
          ...(programData.programs || []).slice(0, 3).map((item) => ({ type: 'Program', title: item.title || item.title_ko, date: item.created_at || item.program_start })),
          ...(courseData.courses || []).slice(0, 3).map((item) => ({ type: 'Course', title: item.title || item.title_ko, date: item.created_at })),
        ]);
      } catch {
        setMessage('Unable to load the admin dashboard from the API.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Admin Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">2026 Aichi-Nagoya Asian Games platform live overview.</Typography>
      </Box>

      {message && <Alert severity="warning" sx={{ mb: 2 }}>{message}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {metricCards.map((card) => (
          <Grid item xs={6} md={4} lg={2} key={card.key}>
            <Card onClick={() => navigate(card.path)} sx={{ cursor: 'pointer', height: '100%' }}>
              <CardContent>
                <Box sx={{ color: 'primary.main', mb: 1 }}>{card.icon}</Box>
                {loading ? <Skeleton width={60} height={40} /> : <Typography variant="h4" fontWeight={700}>{Number(metrics[card.key] || 0).toLocaleString()}</Typography>}
                <Typography variant="body2" color="text.secondary">{card.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={700}>Recent API Content</Typography>
            <Button size="small" onClick={() => navigate('/admin/programs')}>Manage content</Button>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Type</TableCell><TableCell>Title</TableCell><TableCell>Date</TableCell></TableRow></TableHead>
              <TableBody>
                {loading ? [1, 2, 3].map((item) => <TableRow key={item}><TableCell colSpan={3}><Skeleton /></TableCell></TableRow>) : recent.length === 0 ? (
                  <TableRow><TableCell colSpan={3} align="center" sx={{ py: 4 }}>No recent API content.</TableCell></TableRow>
                ) : recent.map((item, index) => (
                  <TableRow key={`${item.type}-${index}`}><TableCell>{item.type}</TableCell><TableCell>{item.title || '-'}</TableCell><TableCell>{item.date || '-'}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default AdminDashboard;
