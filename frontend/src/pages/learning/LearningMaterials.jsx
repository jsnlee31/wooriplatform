import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Chip, CircularProgress, Grid, Typography } from '@mui/material';
import { coursesAPI } from '../../services/api';

const LearningMaterials = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await coursesAPI.getAll();
        setCourses(response.data.courses || response.data || []);
      } catch {
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3 }}><Typography variant="h5" fontWeight={700}>Learning Materials</Typography><Typography variant="body2" color="text.secondary">Training content loaded from the API.</Typography></Box>
      {loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : (
        <Grid container spacing={2}>
          {courses.map((course) => <Grid item xs={12} md={4} key={course.id}><Card><CardContent><Typography variant="h6" fontWeight={700}>{course.title_ko || course.title_en}</Typography><Chip sx={{ my: 1 }} size="small" label={course.category || course.type || 'Course'} /><Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{course.description_ko || course.description_en || 'No description provided.'}</Typography><Button variant="contained" onClick={() => navigate(`/learning/${course.id}`)}>Open</Button></CardContent></Card></Grid>)}
          {courses.length === 0 && <Grid item xs={12}><Card><CardContent><Typography align="center" color="text.secondary">No learning materials returned by the API.</Typography></CardContent></Card></Grid>}
        </Grid>
      )}
    </Box>
  );
};

export default LearningMaterials;