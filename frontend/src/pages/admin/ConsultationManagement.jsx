import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  CheckCircle as CompleteIcon,
  Close as CloseIcon,
  OpenInNew as OpenIcon,
  Schedule as ScheduleIcon,
  SupportAgent as ConsultIcon,
} from '@mui/icons-material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { consultationsAPI } from '../../services/api';

const statusColors = {
  completed: { color: '#166534', bg: '#DCFCE7' },
  scheduled: { color: '#1E40AF', bg: '#DBEAFE' },
  cancelled: { color: '#991B1B', bg: '#FEE2E2' },
  pending: { color: '#92400E', bg: '#FEF3C7' },
};

const normalizeStatus = (status = '') => String(status).toLowerCase();

const ConsultationManagement = () => {
  const [matrix, setMatrix] = useState([]);
  const [summary, setSummary] = useState({ total: 0, completed: 0, scheduled: 0, cancelled: 0 });
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [consultantDetails, setConsultantDetails] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await consultationsAPI.getAdminStats();
        setMatrix(response.data?.matrix || []);
        setSummary(response.data?.summary || { total: 0, completed: 0, scheduled: 0, cancelled: 0 });
      } catch {
        setMatrix([]);
        setSummary({ total: 0, completed: 0, scheduled: 0, cancelled: 0 });
        setError('Unable to load consultation statistics from the API.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleConsultantClick = async (consultant) => {
    setSelectedConsultant(consultant);
    setConsultantDetails([]);
    try {
      const response = await consultationsAPI.getByConsultant(consultant.consultant_id || consultant.id);
      setConsultantDetails(Array.isArray(response.data) ? response.data : []);
    } catch {
      setConsultantDetails([]);
    }
  };

  const chartData = useMemo(() => matrix.map((item) => ({
    name: item.consultant_name || item.name || 'Consultant',
    completed: Number(item.completed) || 0,
    scheduled: Number(item.scheduled) || 0,
    cancelled: Number(item.cancelled) || 0,
  })), [matrix]);

  const kpis = [
    { label: 'Total', value: summary.total || 0, color: '#0047BA', bg: '#EBF0FA', icon: <ConsultIcon /> },
    { label: 'Completed', value: summary.completed || 0, color: '#059669', bg: '#ECFDF5', icon: <CompleteIcon /> },
    { label: 'Scheduled', value: summary.scheduled || 0, color: '#1E40AF', bg: '#DBEAFE', icon: <ScheduleIcon /> },
    { label: 'Cancelled', value: summary.cancelled || 0, color: '#DC2626', bg: '#FEF2F2', icon: <CancelIcon /> },
  ];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>Consultation Management</Typography>
        <Typography variant="body2" color="text.secondary">Live consultation statistics and session details from the API.</Typography>
      </Box>

      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {kpis.map((kpi) => (
          <Grid item xs={6} sm={3} key={kpi.label}>
            <Paper elevation={0} sx={{ p: 2.5, borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ bgcolor: kpi.bg, color: kpi.color }}>{React.cloneElement(kpi.icon, { fontSize: 'small' })}</Avatar>
                <Box><Typography variant="h5" fontWeight={700}>{Number(kpi.value).toLocaleString()}</Typography><Typography variant="caption" color="text.secondary">{kpi.label}</Typography></Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" sx={{ fontSize: '0.9375rem', fontWeight: 700, mb: 2 }}>Consultations By Staff</Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" width={80} />
                <Tooltip />
                <Bar dataKey="completed" stackId="a" fill="#059669" barSize={18} />
                <Bar dataKey="scheduled" stackId="a" fill="#3B82F6" barSize={18} />
                <Bar dataKey="cancelled" stackId="a" fill="#EF4444" barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '8px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" sx={{ fontSize: '0.9375rem', fontWeight: 700, mb: 2 }}>Staff Matrix</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Staff</TableCell><TableCell align="center">Total</TableCell><TableCell align="center">Completed</TableCell><TableCell align="center">Scheduled</TableCell><TableCell align="center">Cancelled</TableCell></TableRow></TableHead>
                <TableBody>
                  {matrix.length === 0 ? (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>{loading ? 'Loading...' : 'No consultation data available.'}</TableCell></TableRow>
                  ) : matrix.map((row) => (
                    <TableRow key={row.consultant_id || row.id} hover onClick={() => handleConsultantClick(row)} sx={{ cursor: 'pointer' }}>
                      <TableCell><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Avatar sx={{ width: 28, height: 28, bgcolor: '#0047BA', fontSize: '0.75rem' }}>{(row.consultant_name || row.name || 'C').charAt(0)}</Avatar><Box><Typography variant="body2" fontWeight={500}>{row.consultant_name || row.name}</Typography><Typography variant="caption" color="text.secondary">{row.department}</Typography></Box></Box></TableCell>
                      <TableCell align="center"><Chip size="small" label={row.total || 0} /></TableCell>
                      <TableCell align="center">{row.completed || 0}</TableCell>
                      <TableCell align="center">{row.scheduled || 0}</TableCell>
                      <TableCell align="center">{row.cancelled || 0}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={Boolean(selectedConsultant)} onClose={() => setSelectedConsultant(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">{selectedConsultant?.consultant_name || selectedConsultant?.name || 'Consultant'} Sessions</Typography>
          <IconButton size="small" onClick={() => setSelectedConsultant(null)}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Athlete</TableCell><TableCell>Date</TableCell><TableCell>Topic</TableCell><TableCell>Method</TableCell><TableCell>Status</TableCell><TableCell align="center">Open</TableCell></TableRow></TableHead>
              <TableBody>
                {consultantDetails.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>No sessions returned by the API.</TableCell></TableRow>
                ) : consultantDetails.map((session) => {
                  const colors = statusColors[normalizeStatus(session.status)] || statusColors.pending;
                  return (
                    <TableRow key={session.id} hover>
                      <TableCell>{session.user_name || session.athlete_name || '-'}</TableCell>
                      <TableCell>{session.scheduled_at || session.date || '-'}</TableCell>
                      <TableCell>{session.topic || '-'}</TableCell>
                      <TableCell>{session.method || '-'}</TableCell>
                      <TableCell><Chip size="small" label={session.status || 'pending'} sx={{ bgcolor: colors.bg, color: colors.color }} /></TableCell>
                      <TableCell align="center"><IconButton size="small" onClick={() => setSelectedSession(session)}><OpenIcon fontSize="small" /></IconButton></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions><Button onClick={() => setSelectedConsultant(null)}>Close</Button></DialogActions>
      </Dialog>

      <Dialog open={Boolean(selectedSession)} onClose={() => setSelectedSession(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Session Detail</DialogTitle>
        <DialogContent dividers>
          {selectedSession && Object.entries(selectedSession).map(([key, value]) => (
            <Box key={key} sx={{ mb: 1.5 }}>
              <Typography variant="caption" color="text.secondary">{key}</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value ?? '')}</Typography>
            </Box>
          ))}
        </DialogContent>
        <DialogActions><Button onClick={() => setSelectedSession(null)}>Close</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConsultationManagement;
