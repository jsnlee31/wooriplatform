import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Skeleton,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { consultationsAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

const steps = ['Consultant', 'Time', 'Details', 'Confirm'];
const methods = ['online', 'offline', 'phone'];

const getConsultantId = (consultant) => consultant?.id || consultant?.consultant_id;
const getConsultantName = (consultant) => consultant?.name_ko || consultant?.name || consultant?.consultant_name || 'Consultant';

const ConsultationBooking = () => {
  const navigate = useNavigate();
  useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [consultants, setConsultants] = useState([]);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [topic, setTopic] = useState('');
  const [method, setMethod] = useState('online');
  const [loading, setLoading] = useState(true);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadConsultants = async () => {
      setLoading(true);
      setMessage('');
      try {
        const response = await consultationsAPI.getConsultants();
        setConsultants(Array.isArray(response.data) ? response.data : []);
      } catch {
        setConsultants([]);
        setMessage('Unable to load consultants from the API.');
      } finally {
        setLoading(false);
      }
    };
    loadConsultants();
  }, []);

  useEffect(() => {
    if (!selectedConsultant) return;

    const loadAvailability = async () => {
      setSlotsLoading(true);
      setAvailableSlots([]);
      setSelectedDate('');
      setSelectedSlot(null);
      setMessage('');
      try {
        const response = await consultationsAPI.getAvailability(getConsultantId(selectedConsultant));
        const slots = Array.isArray(response.data) ? response.data : [];
        setAvailableSlots(slots.filter((slot) => !slot.is_booked));
      } catch {
        setMessage('Unable to load available time slots from the API.');
      } finally {
        setSlotsLoading(false);
      }
    };

    loadAvailability();
  }, [selectedConsultant]);

  const uniqueDates = useMemo(
    () => [...new Set(availableSlots.map((slot) => slot.available_date))].sort(),
    [availableSlots]
  );
  const slotsForDate = availableSlots.filter((slot) => slot.available_date === selectedDate);

  const canProceed = () => {
    if (activeStep === 0) return Boolean(selectedConsultant);
    if (activeStep === 1) return Boolean(selectedSlot);
    if (activeStep === 2) return Boolean(topic.trim());
    return true;
  };

  const bookConsultation = async () => {
    try {
      await consultationsAPI.book({
        consultant_id: getConsultantId(selectedConsultant),
        slot_id: selectedSlot.id,
        topic,
        method,
      });
      setSuccess(true);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Booking failed. Please try again.');
    }
  };

  if (success) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <CheckIcon sx={{ fontSize: 64, color: '#059669', mb: 2 }} />
        <Typography variant="h5" fontWeight={700}>Consultation booked</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, mb: 4 }}>
          {getConsultantName(selectedConsultant)} | {selectedSlot?.available_date} {selectedSlot?.start_time}
        </Typography>
        <Button variant="contained" onClick={() => navigate('/activities/consultations')}>View my consultations</Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Consultation Booking</Typography>
        <Typography variant="body2" color="text.secondary">Book support sessions for Asian Games athletes and staff.</Typography>
      </Box>

      {message && <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setMessage('')}>{message}</Alert>}

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>

      {activeStep === 0 && (
        <Grid container spacing={2}>
          {loading ? [1, 2, 3].map((item) => (
            <Grid item xs={12} md={4} key={item}><Skeleton variant="rectangular" height={150} sx={{ borderRadius: 1 }} /></Grid>
          )) : consultants.length === 0 ? (
            <Grid item xs={12}><Alert severity="info">No consultants are currently available.</Alert></Grid>
          ) : consultants.map((consultant) => {
            const selected = getConsultantId(selectedConsultant) === getConsultantId(consultant);
            return (
              <Grid item xs={12} md={4} key={getConsultantId(consultant)}>
                <Card onClick={() => setSelectedConsultant(consultant)} sx={{ cursor: 'pointer', border: '2px solid', borderColor: selected ? '#0047BA' : 'transparent' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: '#0047BA' }}>{getConsultantName(consultant).charAt(0)}</Avatar>
                      <Box>
                        <Typography fontWeight={700}>{getConsultantName(consultant)}</Typography>
                        <Typography variant="body2" color="text.secondary">{consultant.department || consultant.position || 'Delegation support'}</Typography>
                      </Box>
                      {selected && <CheckIcon sx={{ ml: 'auto', color: '#0047BA' }} />}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {activeStep === 1 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card><CardContent>
              <Typography fontWeight={700} sx={{ mb: 2 }}>Date</Typography>
              {slotsLoading ? [1, 2, 3].map((item) => <Skeleton key={item} height={42} sx={{ mb: 1 }} />) : uniqueDates.length === 0 ? <Alert severity="info">No available dates returned.</Alert> : uniqueDates.map((date) => (
                <Button key={date} fullWidth variant={selectedDate === date ? 'contained' : 'outlined'} onClick={() => { setSelectedDate(date); setSelectedSlot(null); }} sx={{ mb: 1, justifyContent: 'space-between' }}>
                  {dayjs(date).format('MM/DD (ddd)')}
                  <Chip size="small" label={availableSlots.filter((slot) => slot.available_date === date).length} />
                </Button>
              ))}
            </CardContent></Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card><CardContent>
              <Typography fontWeight={700} sx={{ mb: 2 }}>Time</Typography>
              {!selectedDate ? <Typography color="text.secondary">Select a date first.</Typography> : (
                <Grid container spacing={1.5}>
                  {slotsForDate.map((slot) => (
                    <Grid item xs={6} sm={4} md={3} key={slot.id}>
                      <Button fullWidth variant={selectedSlot?.id === slot.id ? 'contained' : 'outlined'} onClick={() => setSelectedSlot(slot)}>
                        {slot.start_time} - {slot.end_time}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              )}
            </CardContent></Card>
          </Grid>
        </Grid>
      )}

      {activeStep === 2 && (
        <Card><CardContent>
          <TextField label="Topic" placeholder="Training, nutrition, recovery, mental care..." fullWidth multiline rows={4} value={topic} onChange={(event) => setTopic(event.target.value)} sx={{ mb: 3 }} />
          <Typography fontWeight={700} sx={{ mb: 1 }}>Method</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {methods.map((option) => <Button key={option} variant={method === option ? 'contained' : 'outlined'} onClick={() => setMethod(option)}>{option}</Button>)}
          </Box>
        </CardContent></Card>
      )}

      {activeStep === 3 && (
        <Card sx={{ maxWidth: 640, mx: 'auto' }}><CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Confirm booking</Typography>
          <Typography>Consultant: {getConsultantName(selectedConsultant)}</Typography>
          <Typography>Time: {selectedSlot?.available_date} {selectedSlot?.start_time} - {selectedSlot?.end_time}</Typography>
          <Typography>Method: {method}</Typography>
          <Typography sx={{ mb: 3 }}>Topic: {topic}</Typography>
          <Button fullWidth variant="contained" onClick={bookConsultation}>Confirm booking</Button>
        </CardContent></Card>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button startIcon={<BackIcon />} disabled={activeStep === 0} onClick={() => setActiveStep((step) => step - 1)}>Back</Button>
        {activeStep < 3 && <Button endIcon={<NextIcon />} variant="contained" disabled={!canProceed()} onClick={() => setActiveStep((step) => step + 1)}>Next</Button>}
      </Box>
    </Box>
  );
};

export default ConsultationBooking;
