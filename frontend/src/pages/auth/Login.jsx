import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Alert, Box, Button, Container, Paper, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import AsianGamesCursorIcon from '../../components/common/AsianGamesCursorIcon';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    const result = await login(data.email, data.password);
    if (result.success) navigate('/');
    else {
      setError(result.error || 'Login failed.');
      showError(result.error || 'Login failed.');
    }
    setLoading(false);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', bgcolor: '#F8F9FA', py: 4 }}>
      <Container maxWidth="sm">
        <Paper elevation={0} sx={{ p: 4, border: '1px solid #E5E5E5' }}>
          <Box sx={{ mb: 2 }}>
            <AsianGamesCursorIcon compact />
          </Box>
          <Typography variant="h5" fontWeight={700} color="primary" align="center">2026 Aichi-Nagoya Asian Games</Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>National Team Delegation Platform</Typography>
          <Alert severity="info" sx={{ mb: 3 }}>
            Admin: <strong>admin@asiangames.com</strong> / demo1234<br />
            Coach: <strong>coach@asiangames.com</strong> / demo1234<br />
            Athlete: <strong>athlete@asiangames.com</strong> / demo1234
          </Alert>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField fullWidth label="Email" type="email" sx={{ mb: 2 }} {...register('email', { required: 'Email is required' })} error={!!errors.email} helperText={errors.email?.message} />
            <TextField fullWidth label="Password" type="password" sx={{ mb: 3 }} {...register('password', { required: 'Password is required' })} error={!!errors.password} helperText={errors.password?.message} />
            <Button type="submit" fullWidth variant="contained" size="large" disabled={loading}>{loading ? 'Signing in...' : 'Sign In'}</Button>
          </Box>
          <Typography variant="body2" align="center" sx={{ mt: 3 }}><Link to="/register">Create account</Link></Typography>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
