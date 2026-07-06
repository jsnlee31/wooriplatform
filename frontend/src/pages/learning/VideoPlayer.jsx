import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Typography,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  PlayCircle as PlayIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { coursesAPI } from '../../services/api';
import CategoryBadge from '../../components/common/CategoryBadge';

const getVideoType = (url) => {
  if (!url) return 'none';
  if (url.match(/youtube\.com\/watch|youtube\.com\/shorts\/|youtu\.be\//)) return 'youtube';
  if (url.match(/vimeo\.com\//)) return 'vimeo';
  return 'direct';
};

const getYouTubeId = (url) => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtu\.be\/)([^&\s?]+)/);
  return match ? match[1] : null;
};

const getVimeoId = (url) => {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
};

const VideoEmbed = ({ url, videoRef, onTimeUpdate, onEnded, title }) => {
  const type = getVideoType(url);

  if (type === 'youtube') {
    return <iframe src={`https://www.youtube.com/embed/${getYouTubeId(url)}?rel=0&modestbranding=1`} title={title || 'Video'} style={{ width: '100%', height: '100%', border: 'none' }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
  }

  if (type === 'vimeo') {
    return <iframe src={`https://player.vimeo.com/video/${getVimeoId(url)}?badge=0&autopause=0`} title={title || 'Video'} style={{ width: '100%', height: '100%', border: 'none' }} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />;
  }

  return <video ref={videoRef} src={url} controls style={{ width: '100%', height: '100%' }} onTimeUpdate={onTimeUpdate} onEnded={onEnded} />;
};

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchCourse = async () => {
      setLoading(true);
      try {
        const response = await coursesAPI.getById(id);
        const courseData = response.data?.course || response.data;
        setCourse(courseData || null);
        setCurrentLesson(courseData?.lessons?.[0] || null);
      } catch {
        setCourse(null);
        setCurrentLesson(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  const handleLessonClick = (lesson) => {
    setCurrentLesson(lesson);
    setProgress(0);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current?.duration) setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
  };

  const handleVideoEnd = async () => {
    if (!currentLesson) return;
    try {
      await coursesAPI.updateProgress(id, { lesson_id: currentLesson.id, completed: true });
    } catch {
      // Keep local completion visible when persistence fails.
    }
    if (course?.lessons) {
      setCourse({ ...course, lessons: course.lessons.map((lesson) => lesson.id === currentLesson.id ? { ...lesson, completed: true } : lesson) });
    }
  };

  if (loading) {
    return <Box><Skeleton variant="rectangular" height={400} sx={{ mb: 3 }} /><Skeleton variant="rectangular" height={200} /></Box>;
  }

  if (!course) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" color="text.secondary">This course was not found in the API.</Typography>
        <Button onClick={() => navigate('/learning')} sx={{ mt: 2 }}>Back to learning</Button>
      </Box>
    );
  }

  const lessons = course.lessons || [];
  const completedCount = lessons.filter((lesson) => lesson.completed).length;
  const overallProgress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;
  const videoType = currentLesson?.video_url ? getVideoType(currentLesson.video_url) : 'none';
  const isEmbedded = videoType === 'youtube' || videoType === 'vimeo';

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/learning')} sx={{ mb: 2 }}>Back to learning</Button>
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ mb: 3 }}>
            <Box sx={{ position: 'relative', backgroundColor: '#000', paddingTop: '56.25%' }}>
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {currentLesson?.video_url ? (
                  <VideoEmbed url={currentLesson.video_url} videoRef={videoRef} onTimeUpdate={handleTimeUpdate} onEnded={handleVideoEnd} title={currentLesson.title} />
                ) : (
                  <Box sx={{ textAlign: 'center', color: 'white' }}><PlayIcon sx={{ fontSize: 80, mb: 2 }} /><Typography variant="h6">No video source registered.</Typography></Box>
                )}
              </Box>
            </Box>
            {currentLesson && !isEmbedded && <LinearProgress variant="determinate" value={progress} sx={{ height: 4 }} />}
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}><CategoryBadge category={course.category} /><Typography variant="caption" color="text.secondary">{course.instructor}</Typography></Box>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>{course.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{course.description}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><TimeIcon fontSize="small" color="action" /><Typography variant="body2" color="text.secondary">{course.total_duration || '-'}</Typography></Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><ViewIcon fontSize="small" color="action" /><Typography variant="body2" color="text.secondary">{Number(course.views || 0).toLocaleString()} views</Typography></Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} lg={4}>
          <Card sx={{ position: 'sticky', top: 80 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Lessons</Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography variant="body2" color="text.secondary">Progress</Typography><Typography variant="body2" fontWeight={600}>{overallProgress}%</Typography></Box>
                <LinearProgress variant="determinate" value={overallProgress} sx={{ height: 8, borderRadius: 4 }} />
                <Typography variant="caption" color="text.secondary">{completedCount} / {lessons.length} complete</Typography>
              </Box>
              <Divider sx={{ my: 2 }} />
              <List disablePadding>
                {lessons.length === 0 ? <Typography color="text.secondary">No lessons returned by the API.</Typography> : lessons.map((lesson) => (
                  <ListItem key={lesson.id} disablePadding>
                    <ListItemButton selected={currentLesson?.id === lesson.id} onClick={() => handleLessonClick(lesson)} sx={{ borderRadius: 1, mb: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>{lesson.completed ? <CheckCircleIcon color="success" fontSize="small" /> : <PlayIcon color="action" fontSize="small" />}</ListItemIcon>
                      <ListItemText primary={<Typography variant="body2" fontWeight={currentLesson?.id === lesson.id ? 600 : 400}>{lesson.title}</Typography>} secondary={lesson.duration} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default VideoPlayer;
