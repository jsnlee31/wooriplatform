import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, CircularProgress, Grid, Typography } from '@mui/material';
import { consultationsAPI, coursesAPI } from '../../services/api';

const MyActivities = () => {
  const [consultations, setConsultations] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [consultationResponse, courseResponse] = await Promise.allSettled([
          consultationsAPI.getMine(),
          coursesAPI.getEnrollments(),
        ]);
        setConsultations(consultationResponse.status === 'fulfilled' ? consultationResponse.value.data || [] : []);
        setCourses(courseResponse.status === 'fulfilled' ? courseResponse.value.data || [] : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3 }}><Typography variant="h5" fontWeight={700}>My Activities</Typography><Typography variant="body2" color="text.secondary">Your real enrollments and consultations.</Typography></Box>
      {loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}><Card><CardContent><Typography variant="h6" fontWeight={700}>Courses</Typography>{courses.length === 0 ? <Typography color="text.secondary">No course activity returned by the API.</Typography> : courses.map((course) => <Typography key={course.id} sx={{ mt: 1 }}>{course.title_ko || course.title_en || course.course_id}</Typography>)}</CardContent></Card></Grid>
          <Grid item xs={12} md={6}><Card><CardContent><Typography variant="h6" fontWeight={700}>Consultations</Typography>{consultations.length === 0 ? <Typography color="text.secondary">No consultations returned by the API.</Typography> : consultations.map((item) => <Typography key={item.id} sx={{ mt: 1 }}>{item.topic || item.scheduled_at}</Typography>)}</CardContent></Card></Grid>
        </Grid>
      )}
    </Box>
  );
};

export default MyActivities;