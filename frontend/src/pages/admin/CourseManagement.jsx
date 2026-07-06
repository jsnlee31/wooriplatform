import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { Add as AddIcon, Refresh as RefreshIcon, Upload as UploadIcon } from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';
import { coursesAPI } from '../../services/api';

const MAX_VIDEO_SIZE_MB = 300;
const CATEGORIES = ['Sports', 'Strength Training', 'Nutrition', 'Mental Coaching', 'Rehabilitation', 'Team Building', 'Technical Skills'];

const emptyForm = {
  title_ko: '',
  title_en: '',
  category: 'Sports',
  description_ko: '',
  type: 'video',
  video_url: '',
  document_url: '',
  thumbnail_url: '',
  duration_minutes: '',
  file_size: '',
  is_featured: false,
};

const CourseManagement = () => {
  const { showSuccess, showError } = useNotification();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const fileInputRef = useRef(null);

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await coursesAPI.getAll();
      setCourses(response.data.courses || response.data || []);
    } catch (error) {
      setCourses([]);
      showError('Unable to load courses from the API.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchCourses();
    const interval = setInterval(fetchCourses, 5000);
    return () => clearInterval(interval);
  }, [fetchCourses]);

  const openCreate = () => {
    setEditingCourse(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (course) => {
    setEditingCourse(course);
    setForm({
      ...emptyForm,
      title_ko: course.title_ko || '',
      title_en: course.title_en || '',
      category: course.category || 'Sports',
      description_ko: course.description_ko || '',
      type: course.type || 'video',
      video_url: course.video_url || '',
      document_url: course.document_url || '',
      thumbnail_url: course.thumbnail_url || '',
      duration_minutes: course.duration_minutes || '',
      file_size: course.file_size || '',
      is_featured: !!course.is_featured,
    });
    setDialogOpen(true);
  };

  const handleVideoFile = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_VIDEO_SIZE_MB) {
      showError(`Video file is ${sizeMB.toFixed(1)}MB. Maximum allowed size is ${MAX_VIDEO_SIZE_MB}MB.`);
      event.target.value = '';
      return;
    }
    setForm({
      ...form,
      file_size: sizeMB < 1 ? `${Math.round(sizeMB * 1024)}KB` : `${sizeMB.toFixed(1)}MB`,
    });
    showSuccess('File size accepted. Upload storage wiring is still handled by the backend/API.');
  };

  const saveCourse = async () => {
    if (!form.title_ko.trim()) {
      showError('Course title is required.');
      return;
    }

    const payload = {
      ...form,
      duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
    };

    try {
      if (editingCourse) {
        await coursesAPI.update(editingCourse.id, payload);
        showSuccess('Course updated.');
      } else {
        await coursesAPI.create(payload);
        showSuccess('Course created.');
      }
      setDialogOpen(false);
      await fetchCourses();
    } catch (error) {
      showError(error.response?.data?.error || 'Unable to save course.');
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Course Management</Typography>
          <Typography variant="body2" color="text.secondary">Real training content for Asian Games athletes.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchCourses}>Refresh</Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>Add Course</Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
        {loading ? (
          <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Views</TableCell>
                  <TableCell>Downloads</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id} hover>
                    <TableCell>{course.title_ko || course.title_en}</TableCell>
                    <TableCell><Chip size="small" label={course.category || '-'} /></TableCell>
                    <TableCell>{course.type || '-'}</TableCell>
                    <TableCell>{course.view_count || 0}</TableCell>
                    <TableCell>{course.download_count || 0}</TableCell>
                    <TableCell align="right"><Button size="small" onClick={() => openEdit(course)}>Edit</Button></TableCell>
                  </TableRow>
                ))}
                {courses.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 6 }}>No courses returned by the API.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingCourse ? 'Edit Course' : 'Add Course'}</DialogTitle>
        <DialogContent dividers sx={{ display: 'grid', gap: 2, pt: 2 }}>
          <TextField label="Course title" value={form.title_ko} onChange={(event) => setForm({ ...form, title_ko: event.target.value })} required />
          <TextField label="English title" value={form.title_en} onChange={(event) => setForm({ ...form, title_en: event.target.value })} />
          <FormControl>
            <InputLabel>Category</InputLabel>
            <Select label="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              {CATEGORIES.map((category) => <MenuItem key={category} value={category}>{category}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Description" multiline rows={4} value={form.description_ko} onChange={(event) => setForm({ ...form, description_ko: event.target.value })} />
          <TextField label="Video URL" value={form.video_url} onChange={(event) => setForm({ ...form, video_url: event.target.value })} />
          <TextField label="Document URL" value={form.document_url} onChange={(event) => setForm({ ...form, document_url: event.target.value })} />
          <TextField label="Thumbnail URL" value={form.thumbnail_url} onChange={(event) => setForm({ ...form, thumbnail_url: event.target.value })} />
          <TextField label="Duration minutes" type="number" value={form.duration_minutes} onChange={(event) => setForm({ ...form, duration_minutes: event.target.value })} />
          <Box>
            <input hidden ref={fileInputRef} type="file" accept="video/*" onChange={handleVideoFile} />
            <Button variant="outlined" startIcon={<UploadIcon />} onClick={() => fileInputRef.current?.click()}>
              Check Video File Size
            </Button>
            {form.file_size && <Chip sx={{ ml: 1 }} size="small" label={form.file_size} />}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveCourse}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourseManagement;
