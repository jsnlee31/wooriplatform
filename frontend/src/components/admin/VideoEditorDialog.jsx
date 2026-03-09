import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Box, Typography, Button,
  IconButton, Slider, TextField, Chip, Divider, Paper, Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon, ContentCut as CutIcon, Add as AddIcon, Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon, Pause as PauseIcon, DragIndicator as DragIcon,
  ArrowUpward as MoveUpIcon, ArrowDownward as MoveDownIcon, Refresh as ResetIcon,
  Save as SaveIcon, VideoLibrary as VideoIcon,
} from '@mui/icons-material';

// Format seconds to mm:ss
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// Parse mm:ss to seconds
const parseTime = (str) => {
  const parts = str.split(':');
  if (parts.length === 2) {
    return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
  }
  return parseFloat(str) || 0;
};

// Helper: detect video source type
const getVideoType = (url) => {
  if (!url) return 'none';
  if (url.match(/youtube\.com\/watch|youtu\.be\//)) return 'youtube';
  if (url.match(/vimeo\.com\//)) return 'vimeo';
  return 'direct';
};

const getYouTubeId = (url) => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  return match ? match[1] : null;
};

const getVimeoId = (url) => {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
};

const VideoEditorDialog = ({ open, onClose, videoUrl, videoFile, videoType, onSave }) => {
  const videoRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [objectUrl, setObjectUrl] = useState(null);

  // Segments: array of { id, start, end, label }
  const [segments, setSegments] = useState([]);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(0);

  const sourceType = videoType === 'file' ? 'direct' : getVideoType(videoUrl);
  const isEmbedded = sourceType === 'youtube' || sourceType === 'vimeo';
  const canTrim = sourceType === 'direct';

  // Create object URL for file uploads
  useEffect(() => {
    if (videoFile && open) {
      const url = URL.createObjectURL(videoFile);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setObjectUrl(null);
  }, [videoFile, open]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSegments([]);
      setTrimStart(0);
      setTrimEnd(0);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [open]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      const dur = videoRef.current.duration;
      setDuration(dur);
      setTrimEnd(dur);
      // Initialize with one full segment
      setSegments([{ id: 1, start: 0, end: dur, label: 'Full Video' }]);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTrimChange = (_, newValue) => {
    setTrimStart(newValue[0]);
    setTrimEnd(newValue[1]);
  };

  const addSegmentFromTrim = () => {
    const newSegment = {
      id: Date.now(),
      start: trimStart,
      end: trimEnd,
      label: `Segment ${segments.length + 1} (${formatTime(trimStart)} - ${formatTime(trimEnd)})`,
    };
    setSegments((prev) => [...prev, newSegment]);
  };

  const removeSegment = (segId) => {
    setSegments((prev) => prev.filter((s) => s.id !== segId));
  };

  const moveSegment = (index, direction) => {
    const newSegments = [...segments];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newSegments.length) return;
    [newSegments[index], newSegments[targetIndex]] = [newSegments[targetIndex], newSegments[index]];
    setSegments(newSegments);
  };

  const resetSegments = () => {
    if (duration > 0) {
      setSegments([{ id: 1, start: 0, end: duration, label: 'Full Video' }]);
      setTrimStart(0);
      setTrimEnd(duration);
    }
  };

  const handleSave = () => {
    const trimData = {
      segments: segments.map((s) => ({
        start: s.start,
        end: s.end,
        label: s.label,
        duration: s.end - s.start,
      })),
      totalDuration: segments.reduce((sum, s) => sum + (s.end - s.start), 0),
    };
    onSave(trimData);
    onClose();
  };

  const effectiveSource = objectUrl || videoUrl;

  // Embedded preview (YouTube/Vimeo) - show info panel instead of trim controls
  const renderEmbeddedPreview = () => {
    let embedSrc = '';
    if (sourceType === 'youtube') {
      const ytId = getYouTubeId(videoUrl);
      embedSrc = `https://www.youtube.com/embed/${ytId}?rel=0`;
    } else if (sourceType === 'vimeo') {
      const vmId = getVimeoId(videoUrl);
      embedSrc = `https://player.vimeo.com/video/${vmId}`;
    }

    return (
      <Box>
        {/* Embedded Player */}
        <Box sx={{ position: 'relative', paddingTop: '56.25%', backgroundColor: '#000', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
          <iframe
            src={embedSrc}
            title="Video Preview"
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </Box>

        {/* Segment Planner for embedded videos (manual time entry) */}
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
            Segment Planner
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
            Watch the video above, then manually enter start/end times for each segment you want to keep.
          </Typography>
          <ManualSegmentInput segments={segments} setSegments={setSegments} />
        </Paper>
      </Box>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CutIcon color="primary" />
          <Typography variant="h6" fontWeight={700} fontSize="1rem">Video Editor</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><CloseIcon fontSize="small" /></IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        {isEmbedded ? renderEmbeddedPreview() : (
          <>
            {/* Direct Video Player */}
            <Box sx={{ position: 'relative', backgroundColor: '#000', borderRadius: 1, overflow: 'hidden', mb: 2 }}>
              <video
                ref={videoRef}
                src={effectiveSource}
                style={{ width: '100%', display: 'block', maxHeight: 360 }}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
            </Box>

            {/* Playback Controls */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <IconButton onClick={togglePlay} color="primary" size="small">
                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
              </IconButton>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', minWidth: 100 }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Typography>
              <Box sx={{ flex: 1 }}>
                <Slider
                  value={currentTime}
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  onChange={(_, v) => seekTo(v)}
                  size="small"
                  sx={{ py: 0.5 }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Trim Range Selector */}
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                Trim Range
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Drag the slider to select a range, then click "Add Segment" to add it to the segment list.
              </Typography>

              <Box sx={{ px: 1 }}>
                <Slider
                  value={[trimStart, trimEnd]}
                  min={0}
                  max={duration || 1}
                  step={0.1}
                  onChange={handleTrimChange}
                  valueLabelDisplay="auto"
                  valueLabelFormat={formatTime}
                  size="small"
                  color="secondary"
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <TextField
                  label="Start"
                  value={formatTime(trimStart)}
                  onChange={(e) => setTrimStart(parseTime(e.target.value))}
                  size="small"
                  sx={{ width: 100 }}
                  inputProps={{ style: { fontFamily: 'monospace' } }}
                />
                <TextField
                  label="End"
                  value={formatTime(trimEnd)}
                  onChange={(e) => setTrimEnd(parseTime(e.target.value))}
                  size="small"
                  sx={{ width: 100 }}
                  inputProps={{ style: { fontFamily: 'monospace' } }}
                />
                <Typography variant="caption" color="text.secondary">
                  Duration: {formatTime(trimEnd - trimStart)}
                </Typography>
                <Box sx={{ flex: 1 }} />
                <Button
                  size="small"
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={addSegmentFromTrim}
                  disabled={trimEnd <= trimStart}
                >
                  Add Segment
                </Button>
              </Box>

              {/* Visual timeline bar */}
              <Box sx={{ mt: 2, position: 'relative', height: 24, backgroundColor: '#E5E7EB', borderRadius: 1, overflow: 'hidden' }}>
                {segments.map((seg, i) => {
                  const left = duration > 0 ? (seg.start / duration) * 100 : 0;
                  const width = duration > 0 ? ((seg.end - seg.start) / duration) * 100 : 0;
                  const colors = ['#0047BA', '#059669', '#DC2626', '#7C3AED', '#EA580C', '#0891B2'];
                  return (
                    <Tooltip key={seg.id} title={`${formatTime(seg.start)} - ${formatTime(seg.end)}`}>
                      <Box
                        sx={{
                          position: 'absolute',
                          left: `${left}%`,
                          width: `${width}%`,
                          height: '100%',
                          backgroundColor: colors[i % colors.length],
                          opacity: 0.7,
                          cursor: 'pointer',
                          '&:hover': { opacity: 1 },
                        }}
                        onClick={() => seekTo(seg.start)}
                      />
                    </Tooltip>
                  );
                })}
                {/* Current position indicator */}
                {duration > 0 && (
                  <Box sx={{
                    position: 'absolute',
                    left: `${(currentTime / duration) * 100}%`,
                    top: 0, bottom: 0, width: 2,
                    backgroundColor: '#FF0000',
                    zIndex: 2,
                  }} />
                )}
              </Box>
            </Paper>
          </>
        )}

        {/* Segments List */}
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="subtitle2" fontWeight={600}>
              Segments ({segments.length})
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {canTrim && (
                <Button size="small" startIcon={<ResetIcon />} onClick={resetSegments}>
                  Reset
                </Button>
              )}
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
            Segments will be played in order. Reorder, remove, or add more as needed.
          </Typography>

          {segments.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <VideoIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No segments yet. Use the trim range above to add segments.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {segments.map((seg, index) => (
                <Paper
                  key={seg.id}
                  variant="outlined"
                  sx={{
                    p: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    backgroundColor: '#FAFAFA',
                    '&:hover': { backgroundColor: '#F0F4FF' },
                  }}
                >
                  <DragIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                  <Chip
                    label={`#${index + 1}`}
                    size="small"
                    sx={{ fontWeight: 600, minWidth: 36 }}
                    color="primary"
                    variant="outlined"
                  />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={500}>{seg.label}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {formatTime(seg.start)} ~ {formatTime(seg.end)} ({formatTime(seg.end - seg.start)})
                    </Typography>
                  </Box>
                  {canTrim && (
                    <Button size="small" variant="text" onClick={() => seekTo(seg.start)} sx={{ minWidth: 'auto', fontSize: '0.7rem' }}>
                      Preview
                    </Button>
                  )}
                  <IconButton size="small" onClick={() => moveSegment(index, -1)} disabled={index === 0}>
                    <MoveUpIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => moveSegment(index, 1)} disabled={index === segments.length - 1}>
                    <MoveDownIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => removeSegment(seg.id)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Paper>
              ))}
            </Box>
          )}

          {/* Total Duration Summary */}
          {segments.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Total output duration:
              </Typography>
              <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>
                {formatTime(segments.reduce((sum, s) => sum + (s.end - s.start), 0))}
              </Typography>
            </Box>
          )}
        </Paper>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={segments.length === 0}>
          Save Segments
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Manual segment input for embedded videos (YouTube/Vimeo)
const ManualSegmentInput = ({ segments, setSegments }) => {
  const [startInput, setStartInput] = useState('00:00');
  const [endInput, setEndInput] = useState('00:00');

  const addManualSegment = () => {
    const start = parseTime(startInput);
    const end = parseTime(endInput);
    if (end <= start) return;
    setSegments((prev) => [
      ...prev,
      {
        id: Date.now(),
        start,
        end,
        label: `Segment ${prev.length + 1} (${startInput} - ${endInput})`,
      },
    ]);
    setStartInput('00:00');
    setEndInput('00:00');
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <TextField
        label="Start (mm:ss)"
        value={startInput}
        onChange={(e) => setStartInput(e.target.value)}
        size="small"
        sx={{ width: 120 }}
        inputProps={{ style: { fontFamily: 'monospace' } }}
      />
      <TextField
        label="End (mm:ss)"
        value={endInput}
        onChange={(e) => setEndInput(e.target.value)}
        size="small"
        sx={{ width: 120 }}
        inputProps={{ style: { fontFamily: 'monospace' } }}
      />
      <Button
        size="small"
        variant="contained"
        startIcon={<AddIcon />}
        onClick={addManualSegment}
        disabled={parseTime(endInput) <= parseTime(startInput)}
      >
        Add
      </Button>
    </Box>
  );
};

export default VideoEditorDialog;
