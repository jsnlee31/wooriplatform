import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, Chip, CircularProgress, Grid, Typography } from '@mui/material';
import { programsAPI } from '../../services/api';

const ProgramList = () => {
  const navigate = useNavigate();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await programsAPI.getAll();
        setPrograms(response.data.programs || response.data || []);
      } catch {
        setPrograms([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Programs</Typography>
        <Typography variant="body2" color="text.secondary">Asian Games programs loaded from the API.</Typography>
      </Box>
      {loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : (
        <Grid container spacing={2}>
          {programs.map((program) => (
            <Grid item xs={12} md={6} key={program.id}>
              <Card><CardContent>
                <Typography variant="h6" fontWeight={700}>{program.title_ko || program.title_en}</Typography>
                <Chip sx={{ my: 1 }} size="small" label={program.category || 'Program'} />
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{program.description_ko || program.description_en || 'No description provided.'}</Typography>
                <Button variant="contained" onClick={() => navigate(`/programs/${program.id}`)}>View Details</Button>
              </CardContent></Card>
            </Grid>
          ))}
          {programs.length === 0 && <Grid item xs={12}><Card><CardContent><Typography align="center" color="text.secondary">No programs returned by the API.</Typography></CardContent></Card></Grid>}
        </Grid>
      )}
    </Box>
  );
};

export default ProgramList;