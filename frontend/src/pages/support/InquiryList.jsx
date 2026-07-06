import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { inquiriesAPI } from '../../services/api';

const InquiryList = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await inquiriesAPI.getMine();
        setInquiries(response.data.inquiries || response.data || []);
      } catch {
        setInquiries([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Box><Typography variant="h5" fontWeight={700}>My Inquiries</Typography><Typography variant="body2" color="text.secondary">Real support inquiries from the API.</Typography></Box><Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/support/inquiry')}>New Inquiry</Button></Box>
      {loading ? <Box sx={{ py: 8, textAlign: 'center' }}><CircularProgress /></Box> : inquiries.length === 0 ? <Card><CardContent><Typography align="center" color="text.secondary">No inquiries returned by the API.</Typography></CardContent></Card> : inquiries.map((item) => <Card key={item.id} sx={{ mb: 1 }}><CardContent><Typography fontWeight={700}>{item.title}</Typography><Typography variant="body2" color="text.secondary">{item.status || 'open'}</Typography></CardContent></Card>)}
    </Box>
  );
};

export default InquiryList;