import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { Add as AddIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { usersAPI } from '../../services/api';

const ROLE_OPTIONS = [
  { value: 'learner', label: 'Athlete' },
  { value: 'instructor', label: 'Coach' },
  { value: 'hr_manager', label: 'Team Manager' },
  { value: 'admin', label: 'Admin' },
];

const emptyForm = {
  name_ko: '',
  name_en: '',
  email: '',
  password: '',
  role: 'learner',
  status: 'active',
  department: '',
  phone: '',
};

const UserManagement = () => {
  const { isAdmin } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getAll({
        search: searchTerm || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
      });
      setUsers(response.data.users || response.data || []);
    } catch (error) {
      setUsers([]);
      showError('Unable to load users from the API.');
    } finally {
      setLoading(false);
    }
  }, [roleFilter, searchTerm, showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      ...emptyForm,
      name_ko: user.name_ko || '',
      name_en: user.name_en || '',
      email: user.email || '',
      role: user.role || 'learner',
      status: user.status || 'active',
      department: user.department || '',
      phone: user.phone || '',
    });
    setDialogOpen(true);
  };

  const saveUser = async () => {
    if (!form.name_ko.trim() || !form.email.trim()) {
      showError('Name and email are required.');
      return;
    }

    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;

      if (editingUser) {
        await usersAPI.update(editingUser.id, payload);
        showSuccess('User updated.');
      } else {
        await usersAPI.create(payload);
        showSuccess('User created.');
      }

      setDialogOpen(false);
      await fetchUsers();
    } catch (error) {
      showError(error.response?.data?.error || 'Unable to save user.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>User Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Real API users for the 2026 Asian Games delegation platform.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchUsers}>Refresh</Button>
          {isAdmin() && <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add User</Button>}
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            fullWidth
            size="small"
            label="Search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
              <MenuItem value="all">All roles</MenuItem>
              {ROLE_OPTIONS.map((role) => (
                <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>{user.name_ko || user.name_en || '-'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Chip size="small" label={user.role} /></TableCell>
                    <TableCell><Chip size="small" color={user.status === 'active' ? 'success' : 'default'} label={user.status || 'unknown'} /></TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell align="right">
                      <Button size="small" onClick={() => openEdit(user)}>Edit</Button>
                    </TableCell>
                  </TableRow>
                ))}
                {users.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                      No users returned by the API.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <TextField label="Korean name" value={form.name_ko} onChange={(event) => setForm({ ...form, name_ko: event.target.value })} required />
          <TextField label="English name" value={form.name_en} onChange={(event) => setForm({ ...form, name_en: event.target.value })} />
          <TextField label="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
          {!editingUser && (
            <TextField label="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          )}
          <FormControl>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              {ROLE_OPTIONS.map((role) => (
                <MenuItem key={role.value} value={role.value}>{role.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField label="Department / sport" value={form.department} onChange={(event) => setForm({ ...form, department: event.target.value })} />
          <TextField label="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveUser}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
