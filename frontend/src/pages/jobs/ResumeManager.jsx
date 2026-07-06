import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  ArrowBack as ArrowBackIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { resumesAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const ResumeManager = () => {
  const navigate = useNavigate();
  useAuth();
  const { showSuccess, showError } = useNotification();
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingResume, setEditingResume] = useState(null);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const fetchResumes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await resumesAPI.getAll();
      setResumes(response.data?.resumes || []);
    } catch {
      setResumes([]);
      showError('Unable to load resumes from the API.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchResumes();
  }, [fetchResumes]);

  const handleOpenDialog = (resume = null) => {
    setEditingResume(resume);
    reset(resume ? {
      title: resume.title || '',
      summary: resume.content?.summary || '',
      experience: resume.content?.experience || '',
      skills: resume.content?.skills?.join(', ') || '',
      education: resume.content?.education || '',
    } : {
      title: '',
      summary: '',
      experience: '',
      skills: '',
      education: '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingResume(null);
    reset();
  };

  const onSubmit = async (data) => {
    const resumeData = {
      title: data.title,
      content: {
        summary: data.summary,
        experience: data.experience,
        skills: data.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
        education: data.education,
      },
    };

    try {
      if (editingResume) {
        await resumesAPI.update(editingResume.id, resumeData);
        showSuccess('Resume updated.');
      } else {
        await resumesAPI.create(resumeData);
        showSuccess('Resume created.');
      }
      handleCloseDialog();
      fetchResumes();
    } catch {
      showError('Unable to save resume.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this resume?')) return;
    try {
      await resumesAPI.delete(id);
      setResumes((items) => items.filter((resume) => resume.id !== id));
      showSuccess('Resume deleted.');
    } catch {
      showError('Unable to delete resume.');
    }
  };

  const handleSetPrimary = async (id) => {
    try {
      await resumesAPI.setPrimary(id);
      setResumes((items) => items.map((resume) => ({ ...resume, is_primary: resume.id === id })));
      showSuccess('Primary resume updated.');
    } catch {
      showError('Unable to update primary resume.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/jobs')} sx={{ mb: 2 }}>Back to jobs</Button>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5" fontWeight={700}>Resume Management</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Create resume</Button>
        </Box>
      </Box>

      {loading ? (
        <Typography>Loading...</Typography>
      ) : resumes.length === 0 ? (
        <Card><CardContent sx={{ textAlign: 'center', py: 8 }}><Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>No resumes returned by the API.</Typography><Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Create resume</Button></CardContent></Card>
      ) : (
        <Grid container spacing={2}>
          {resumes.map((resume) => (
            <Grid item xs={12} sm={6} md={4} key={resume.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>{resume.title}</Typography>
                        {resume.is_primary && <Chip label="Primary" size="small" color="primary" />}
                      </Box>
                      <Typography variant="caption" color="text.secondary">Updated: {resume.updated_at || '-'}</Typography>
                    </Box>
                    <IconButton size="small" onClick={() => handleSetPrimary(resume.id)} color={resume.is_primary ? 'primary' : 'default'}>
                      {resume.is_primary ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleOpenDialog(resume)}>Edit</Button>
                    <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(resume.id)}>Delete</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingResume ? 'Edit resume' : 'Create resume'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 2 }}>
            <TextField fullWidth label="Title" {...register('title', { required: 'Title is required' })} error={Boolean(errors.title)} helperText={errors.title?.message} sx={{ mb: 2 }} />
            <TextField fullWidth label="Summary" multiline rows={3} {...register('summary')} sx={{ mb: 2 }} />
            <TextField fullWidth label="Experience" multiline rows={4} {...register('experience')} sx={{ mb: 2 }} />
            <TextField fullWidth label="Skills" {...register('skills')} helperText="Separate skills with commas" sx={{ mb: 2 }} />
            <TextField fullWidth label="Education and certifications" multiline rows={2} {...register('education')} />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit(onSubmit)}>{editingResume ? 'Update' : 'Save'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResumeManager;
