import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  CalendarMonth as CalendarIcon,
  Check as CheckIcon,
  ChevronLeft as PrevIcon,
  ChevronRight as NextIcon,
  Delete as DeleteIcon,
  EventAvailable as AvailableIcon,
  EventBusy as BookedIcon,
} from '@mui/icons-material';
import dayjs from 'dayjs';
import { consultationsAPI } from '../../services/api';

const TIME_SLOTS = [];
for (let hour = 9; hour < 17; hour += 1) {
  TIME_SLOTS.push(`${String(hour).padStart(2, '0')}:00`);
  TIME_SLOTS.push(`${String(hour).padStart(2, '0')}:30`);
}

const endTimeFor = (time) => {
  const [hour, minute] = time.split(':').map(Number);
  return `${String(hour + (minute === 30 ? 1 : 0)).padStart(2, '0')}:${minute === 30 ? '00' : '30'}`;
};

const ConsultantSchedule = () => {
  const [currentWeek, setCurrentWeek] = useState(dayjs().startOf('week').add(1, 'day'));
  const [mySlots, setMySlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [slotToDelete, setSlotToDelete] = useState(null);

  const weekDays = useMemo(() => Array.from({ length: 5 }, (_, index) => currentWeek.add(index, 'day')), [currentWeek]);

  useEffect(() => {
    const fetchSlots = async () => {
      setMessage('');
      try {
        const response = await consultationsAPI.getMyAvailability({
          date_from: weekDays[0].format('YYYY-MM-DD'),
          date_to: weekDays[4].format('YYYY-MM-DD'),
        });
        setMySlots(Array.isArray(response.data) ? response.data : []);
      } catch {
        setMySlots([]);
        setMessage('Unable to load availability from the API.');
      }
    };
    fetchSlots();
  }, [weekDays]);

  const getSlotForCell = (date, time) => mySlots.find((slot) => slot.available_date === date.format('YYYY-MM-DD') && slot.start_time === time);

  const toggleSelect = (date, time) => {
    const key = `${date.format('YYYY-MM-DD')}_${time}`;
    if (getSlotForCell(date, time)) return;
    setSelectedSlots((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handlePublish = async () => {
    if (selectedSlots.size === 0) return;
    setSaving(true);
    setMessage('');
    try {
      const slots = Array.from(selectedSlots).map((key) => {
        const [date, time] = key.split('_');
        return { date, start_time: time, end_time: endTimeFor(time) };
      });
      await consultationsAPI.publishAvailability({ slots });
      setMySlots((previous) => [...previous, ...slots.map((slot) => ({ id: `local-${slot.date}-${slot.start_time}`, available_date: slot.date, start_time: slot.start_time, end_time: slot.end_time, is_booked: false }))]);
      setSelectedSlots(new Set());
      setMessage('Availability published.');
    } catch {
      setMessage('Unable to publish availability through the API.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!slotToDelete) return;
    try {
      await consultationsAPI.deleteAvailability(slotToDelete.id);
      setMySlots((previous) => previous.filter((slot) => slot.id !== slotToDelete.id));
      setMessage('Availability removed.');
    } catch {
      setMessage('Unable to delete availability through the API.');
    } finally {
      setSlotToDelete(null);
    }
  };

  const totalSlots = mySlots.length;
  const bookedSlots = mySlots.filter((slot) => slot.is_booked).length;
  const availableCount = totalSlots - bookedSlots;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Consultant Schedule</Typography>
          <Typography variant="body2" color="text.secondary">Publish real availability for athlete consultations.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handlePublish} disabled={selectedSlots.size === 0 || saving}>
          {selectedSlots.size > 0 ? `Publish ${selectedSlots.size}` : 'Publish availability'}
        </Button>
      </Box>

      {message && <Alert severity={message.includes('Unable') ? 'warning' : 'success'} sx={{ mb: 2 }}>{message}</Alert>}

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Published', value: totalSlots, color: '#0047BA', bg: '#EBF0FA', icon: <CalendarIcon /> },
          { label: 'Booked', value: bookedSlots, color: '#059669', bg: '#ECFDF5', icon: <BookedIcon /> },
          { label: 'Available', value: availableCount, color: '#EA580C', bg: '#FFF7ED', icon: <AvailableIcon /> },
        ].map((stat) => (
          <Grid item xs={4} key={stat.label}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '8px', bgcolor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color }}>{stat.icon}</Box>
                <Box><Typography variant="h6" fontWeight={700}>{stat.value}</Typography><Typography variant="caption" color="text.secondary">{stat.label}</Typography></Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton onClick={() => setCurrentWeek((week) => week.subtract(7, 'day'))}><PrevIcon /></IconButton>
              <Typography fontWeight={700}>{weekDays[0].format('YYYY-MM-DD')} - {weekDays[4].format('YYYY-MM-DD')}</Typography>
              <IconButton onClick={() => setCurrentWeek((week) => week.add(7, 'day'))}><NextIcon /></IconButton>
            </Box>
            <Button variant="outlined" size="small" onClick={() => setCurrentWeek(dayjs().startOf('week').add(1, 'day'))}>This week</Button>
          </Box>

          <TableContainer sx={{ maxHeight: 560 }}>
            <Table size="small" stickyHeader>
              <TableHead><TableRow><TableCell>Time</TableCell>{weekDays.map((day) => <TableCell key={day.format('YYYY-MM-DD')} align="center">{day.format('ddd MM/DD')}</TableCell>)}</TableRow></TableHead>
              <TableBody>
                {TIME_SLOTS.map((time) => (
                  <TableRow key={time}>
                    <TableCell>{time}</TableCell>
                    {weekDays.map((day) => {
                      const slot = getSlotForCell(day, time);
                      const key = `${day.format('YYYY-MM-DD')}_${time}`;
                      const isSelected = selectedSlots.has(key);
                      const isPast = day.isBefore(dayjs(), 'day');
                      return (
                        <TableCell key={day.format('YYYY-MM-DD')} align="center" onClick={() => !isPast && !slot && toggleSelect(day, time)} sx={{ cursor: isPast || slot ? 'default' : 'pointer', bgcolor: isSelected ? alpha('#0047BA', 0.08) : slot?.is_booked ? alpha('#059669', 0.06) : slot ? alpha('#0047BA', 0.04) : 'inherit' }}>
                          {slot?.is_booked ? <Chip size="small" label={slot.booked_by_name || 'Booked'} color="success" /> : slot ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}><Chip size="small" label="Available" /><IconButton size="small" onClick={(event) => { event.stopPropagation(); setSlotToDelete(slot); }}><DeleteIcon fontSize="small" color="error" /></IconButton></Box>
                          ) : isSelected ? <Chip size="small" icon={<CheckIcon />} label="Selected" color="primary" /> : null}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Dialog open={Boolean(slotToDelete)} onClose={() => setSlotToDelete(null)}>
        <DialogTitle>Delete availability</DialogTitle>
        <DialogContent><Typography>{slotToDelete?.available_date} {slotToDelete?.start_time} - {slotToDelete?.end_time}</Typography></DialogContent>
        <DialogActions><Button onClick={() => setSlotToDelete(null)}>Cancel</Button><Button variant="contained" color="error" onClick={handleDeleteSlot}>Delete</Button></DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConsultantSchedule;
