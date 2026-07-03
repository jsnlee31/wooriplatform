import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Divider,
  Tabs,
  Tab,
  alpha,
} from '@mui/material';
import {
  SupportAgent as ConsultIcon,
  Close as CloseIcon,
  Videocam as OnlineIcon,
  LocationOn as OfflineIcon,
  Phone as PhoneIcon,
  CheckCircle as CompleteIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Description as FileIcon,
  Image as ImageIcon,
  TextSnippet as TextIcon,
  OpenInNew as OpenIcon,
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { consultationsAPI } from '../../services/api';

// ─── Mock Data ─────────────────────────────────────────────────────────────────

const mockMatrix = [
  { consultant_id: 'c1', consultant_name: '김영수', department: '금융컨설팅', total: 78, completed: 72, scheduled: 4, cancelled: 1, no_show: 1, online_count: 40, offline_count: 28, call_count: 10 },
  { consultant_id: 'c2', consultant_name: '이미영', department: '부동산', total: 65, completed: 57, scheduled: 5, cancelled: 2, no_show: 1, online_count: 30, offline_count: 25, call_count: 10 },
  { consultant_id: 'c3', consultant_name: '박준혁', department: '창업', total: 54, completed: 51, scheduled: 2, cancelled: 1, no_show: 0, online_count: 28, offline_count: 18, call_count: 8 },
  { consultant_id: 'c4', consultant_name: '최수진', department: '디지털', total: 48, completed: 43, scheduled: 3, cancelled: 1, no_show: 1, online_count: 32, offline_count: 10, call_count: 6 },
  { consultant_id: 'c5', consultant_name: '정민호', department: '건강', total: 42, completed: 36, scheduled: 4, cancelled: 1, no_show: 1, online_count: 20, offline_count: 15, call_count: 7 },
  { consultant_id: 'c6', consultant_name: '한소영', department: '사회공헌', total: 38, completed: 35, scheduled: 2, cancelled: 1, no_show: 0, online_count: 18, offline_count: 14, call_count: 6 },
];

const mockSummary = { total: 325, completed: 294, scheduled: 20, cancelled: 7 };

const mockConsultationDetails = {
  c1: [
    { id: 'd1', user_name: '홍길동', user_email: 'hong@email.com', scheduled_at: '2026-03-08 14:00', topic: '노후 재무 플랜', status: '완료', method: '온라인', records: [{ record_type: 'text', content: '자산 포트폴리오 재구성 권장. 채권 비중 확대 필요.' }] },
    { id: 'd2', user_name: '김철수', user_email: 'kim@email.com', scheduled_at: '2026-03-09 10:00', topic: '연금 수령 전략', status: '예약됨', method: '오프라인', records: [] },
    { id: 'd3', user_name: '이영희', user_email: 'lee@email.com', scheduled_at: '2026-03-07 15:00', topic: '부동산 자산 평가', status: '완료', method: '전화', records: [{ record_type: 'text', content: '현재 보유 부동산 시세 분석 완료.' }, { record_type: 'file', file_name: '자산평가보고서.pdf' }] },
    { id: 'd4', user_name: '박민수', user_email: 'park@email.com', scheduled_at: '2026-03-06 09:30', topic: '투자 전략 상담', status: '완료', method: '온라인', records: [{ record_type: 'text', content: 'ETF 분산 투자 전략 설명.' }] },
  ],
  c2: [
    { id: 'd5', user_name: '강서연', user_email: 'kang@email.com', scheduled_at: '2026-03-08 11:00', topic: '부동산 투자 상담', status: '완료', method: '오프라인', records: [{ record_type: 'text', content: '서울 강남 오피스텔 투자 분석.' }] },
    { id: 'd6', user_name: '윤재호', user_email: 'yoon@email.com', scheduled_at: '2026-03-09 14:30', topic: '임대사업 전략', status: '예약됨', method: '온라인', records: [] },
  ],
  c3: [
    { id: 'd7', user_name: '서하나', user_email: 'seo@email.com', scheduled_at: '2026-03-07 10:00', topic: '창업 아이디어 검토', status: '완료', method: '온라인', records: [{ record_type: 'text', content: '카페 창업 비즈니스 모델 분석.' }] },
  ],
};

const statusConfig = {
  '완료': { color: '#166534', bg: '#DCFCE7', icon: <CompleteIcon sx={{ fontSize: 14 }} /> },
  '예약됨': { color: '#1E40AF', bg: '#DBEAFE', icon: <ScheduleIcon sx={{ fontSize: 14 }} /> },
  '취소': { color: '#991B1B', bg: '#FEE2E2', icon: <CancelIcon sx={{ fontSize: 14 }} /> },
  '노쇼': { color: '#92400E', bg: '#FEF3C7', icon: <CancelIcon sx={{ fontSize: 14 }} /> },
};

const methodIcon = {
  '온라인': <OnlineIcon sx={{ fontSize: 14 }} />,
  '오프라인': <OfflineIcon sx={{ fontSize: 14 }} />,
  '전화': <PhoneIcon sx={{ fontSize: 14 }} />,
};

const recordTypeIcon = {
  text: <TextIcon sx={{ fontSize: 16, color: '#0047BA' }} />,
  file: <FileIcon sx={{ fontSize: 16, color: '#DC2626' }} />,
  image: <ImageIcon sx={{ fontSize: 16, color: '#059669' }} />,
};

// ─── Component ─────────────────────────────────────────────────────────────────

const ConsultationManagement = () => {
  const [matrix, setMatrix] = useState([]);
  const [summary, setSummary] = useState({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState(null);
  const [consultantDetails, setConsultantDetails] = useState([]);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [filterTab, setFilterTab] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await consultationsAPI.getAdminStats();
        if (response.data?.matrix?.length > 0) {
          setMatrix(response.data.matrix);
          setSummary(response.data.summary);
        } else {
          setMatrix(mockMatrix);
          setSummary(mockSummary);
        }
      } catch {
        setMatrix(mockMatrix);
        setSummary(mockSummary);
      }
    };
    fetchStats();
  }, []);

  const handleCellClick = async (consultant) => {
    setSelectedConsultant(consultant);
    try {
      const response = await consultationsAPI.getByConsultant(consultant.consultant_id);
      setConsultantDetails(response.data.length > 0 ? response.data : mockConsultationDetails[consultant.consultant_id] || []);
    } catch {
      setConsultantDetails(mockConsultationDetails[consultant.consultant_id] || []);
    }
    setDetailOpen(true);
  };

  const handleSessionClick = (session) => {
    setSelectedSession(session);
    setSessionOpen(true);
  };

  const filteredDetails = filterTab === 0
    ? consultantDetails
    : consultantDetails.filter((d) => {
      const statusMap = { 1: '완료', 2: '예약됨', 3: '취소' };
      return d.status === statusMap[filterTab];
    });

  // Chart data from matrix
  const chartData = matrix.map((m) => ({
    name: m.consultant_name,
    완료: Number(m.completed) || 0,
    예약: Number(m.scheduled) || 0,
    취소: Number(m.cancelled) || 0,
  }));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>상담 관리</Typography>
        <Typography variant="body2" color="text.secondary">
          상담사별 상담 현황을 한눈에 확인하고, 각 셀을 클릭하여 상세 내역을 조회하세요.
        </Typography>
      </Box>

      {/* Summary KPIs */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: '전체 상담', value: summary.total || 0, color: '#0047BA', bg: '#EBF0FA', icon: <ConsultIcon /> },
          { label: '완료', value: summary.completed || 0, color: '#059669', bg: '#ECFDF5', icon: <CompleteIcon /> },
          { label: '예약중', value: summary.scheduled || 0, color: '#1E40AF', bg: '#DBEAFE', icon: <ScheduleIcon /> },
          { label: '취소', value: summary.cancelled || 0, color: '#DC2626', bg: '#FEF2F2', icon: <CancelIcon /> },
        ].map((kpi) => (
          <Grid item xs={6} sm={3} key={kpi.label}>
            <Paper
              elevation={0}
              sx={{
                p: 2.5,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar sx={{ width: 40, height: 40, bgcolor: kpi.bg, color: kpi.color }}>
                  {React.cloneElement(kpi.icon, { fontSize: 'small' })}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>{Number(kpi.value).toLocaleString()}</Typography>
                  <Typography variant="caption" color="text.secondary">{kpi.label}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {/* Bar Chart */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" sx={{ fontSize: '0.9375rem', fontWeight: 700, mb: 2 }}>
              상담사별 상담 건수
            </Typography>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#9CA3AF" width={50} />
                <RechartsTooltip />
                <Bar dataKey="완료" stackId="a" fill="#059669" radius={[0, 0, 0, 0]} barSize={18} />
                <Bar dataKey="예약" stackId="a" fill="#3B82F6" radius={[0, 0, 0, 0]} barSize={18} />
                <Bar dataKey="취소" stackId="a" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Matrix Table */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <Typography variant="h6" sx={{ fontSize: '0.9375rem', fontWeight: 700, mb: 2 }}>
              상담사 × 상담 매트릭스
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem', position: 'sticky', left: 0, bgcolor: '#F8F9FA', zIndex: 1 }}>상담사</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>전체</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>완료</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>예약</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>온라인</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>오프라인</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>전화</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {matrix.map((row) => (
                    <TableRow
                      key={row.consultant_id}
                      hover
                      sx={{
                        cursor: 'pointer',
                        '&:hover': { bgcolor: alpha('#0047BA', 0.04) },
                      }}
                      onClick={() => handleCellClick(row)}
                    >
                      <TableCell
                        sx={{
                          position: 'sticky',
                          left: 0,
                          bgcolor: '#fff',
                          zIndex: 1,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: '#0047BA' }}>
                            {row.consultant_name?.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8125rem' }}>{row.consultant_name}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>{row.department}</Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          size="small"
                          label={row.total}
                          sx={{ height: 24, minWidth: 36, fontWeight: 700, fontSize: '0.8rem', bgcolor: alpha('#0047BA', 0.08), color: '#0047BA' }}
                        />
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>{row.completed}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E40AF' }}>{row.scheduled}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption">{row.online_count}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption">{row.offline_count}</Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="caption">{row.call_count}</Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* ─── Consultant Detail Dialog ──────────────────────────────────────────── */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: '#0047BA', fontSize: '0.9rem' }}>
              {selectedConsultant?.consultant_name?.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700 }}>
                {selectedConsultant?.consultant_name} 상담사
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedConsultant?.department} | 총 {selectedConsultant?.total}건
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setDetailOpen(false)}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>

        <Divider />

        {/* Stats Row */}
        <Box sx={{ px: 3, py: 2, display: 'flex', gap: 2 }}>
          {[
            { label: '완료', value: selectedConsultant?.completed, color: '#059669' },
            { label: '예약', value: selectedConsultant?.scheduled, color: '#1E40AF' },
            { label: '취소', value: selectedConsultant?.cancelled, color: '#DC2626' },
            { label: '노쇼', value: selectedConsultant?.no_show, color: '#92400E' },
          ].map((s) => (
            <Paper key={s.label} elevation={0} sx={{ px: 2, py: 1, borderRadius: '8px', bgcolor: '#F8F9FA', textAlign: 'center', flex: 1 }}>
              <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              <Typography variant="h6" sx={{ fontWeight: 700, color: s.color }}>{s.value || 0}</Typography>
            </Paper>
          ))}
        </Box>

        {/* Filter Tabs */}
        <Box sx={{ px: 3 }}>
          <Tabs value={filterTab} onChange={(_, v) => setFilterTab(v)} sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0, fontSize: '0.8rem' } }}>
            <Tab label={`전체 (${consultantDetails.length})`} />
            <Tab label="완료" />
            <Tab label="예약" />
            <Tab label="취소" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>사용자</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>날짜/시간</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>주제</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>방법</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>상태</TableCell>
                  <TableCell sx={{ fontWeight: 600, fontSize: '0.8rem' }}>기록</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>상세</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDetails.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">해당 상태의 상담이 없습니다.</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDetails.map((d) => {
                    const s = statusConfig[d.status];
                    return (
                      <TableRow key={d.id} hover sx={{ cursor: 'pointer' }} onClick={() => handleSessionClick(d)}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: '0.65rem', bgcolor: '#0047BA' }}>
                              {d.user_name?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontSize: '0.8125rem', fontWeight: 500 }}>{d.user_name}</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>{d.user_email}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">{d.scheduled_at}</Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontSize: '0.8125rem' }}>{d.topic}</Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            icon={methodIcon[d.method]}
                            label={d.method}
                            sx={{ height: 22, fontSize: '0.65rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            icon={s?.icon}
                            label={d.status}
                            sx={{ height: 22, fontSize: '0.65rem', bgcolor: s?.bg, color: s?.color, fontWeight: 600, '& .MuiChip-icon': { color: `${s?.color} !important` } }}
                          />
                        </TableCell>
                        <TableCell>
                          {d.records?.length > 0 ? (
                            <Chip size="small" label={`${d.records.length}건`} sx={{ height: 20, fontSize: '0.65rem' }} />
                          ) : (
                            <Typography variant="caption" color="text.secondary">-</Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small"><OpenIcon sx={{ fontSize: 14 }} /></IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setDetailOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* ─── Session Detail Dialog ─────────────────────────────────────────────── */}
      <Dialog open={sessionOpen} onClose={() => setSessionOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 700 }}>상담 상세</Typography>
          <IconButton size="small" onClick={() => setSessionOpen(false)}><CloseIcon fontSize="small" /></IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          {selectedSession && (
            <Box>
              {/* Participants */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>참여자</Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Paper elevation={0} sx={{ flex: 1, p: 2, borderRadius: '8px', bgcolor: '#F8F9FA' }}>
                  <Typography variant="caption" color="text.secondary">사용자</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: '#059669' }}>
                      {selectedSession.user_name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{selectedSession.user_name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{selectedSession.user_email}</Typography>
                    </Box>
                  </Box>
                </Paper>
                <Paper elevation={0} sx={{ flex: 1, p: 2, borderRadius: '8px', bgcolor: '#F8F9FA' }}>
                  <Typography variant="caption" color="text.secondary">상담사</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Avatar sx={{ width: 28, height: 28, fontSize: '0.7rem', bgcolor: '#0047BA' }}>
                      {selectedConsultant?.consultant_name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{selectedConsultant?.consultant_name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>{selectedConsultant?.department}</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>

              {/* Session Info */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>상담 정보</Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">날짜/시간</Typography>
                  <Typography variant="body2" fontWeight={500}>{selectedSession.scheduled_at}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">방법</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    <Chip size="small" icon={methodIcon[selectedSession.method]} label={selectedSession.method} sx={{ height: 22, fontSize: '0.7rem' }} />
                  </Box>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="caption" color="text.secondary">상태</Typography>
                  <Box sx={{ mt: 0.5 }}>
                    {(() => {
                      const s = statusConfig[selectedSession.status];
                      return <Chip size="small" label={selectedSession.status} sx={{ height: 22, fontSize: '0.7rem', bgcolor: s?.bg, color: s?.color, fontWeight: 600 }} />;
                    })()}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">주제</Typography>
                  <Typography variant="body2" fontWeight={500}>{selectedSession.topic}</Typography>
                </Grid>
              </Grid>

              {/* Records */}
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>상담 기록</Typography>
              {selectedSession.records?.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {selectedSession.records.map((record, i) => (
                    <Paper key={i} elevation={0} sx={{ p: 2, borderRadius: '8px', border: '1px solid', borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {recordTypeIcon[record.record_type] || recordTypeIcon.text}
                        <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'uppercase' }}>
                          {record.record_type === 'text' ? '텍스트 메모' : record.record_type === 'file' ? '첨부 파일' : '이미지'}
                        </Typography>
                      </Box>
                      {record.content && (
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                          {record.content}
                        </Typography>
                      )}
                      {record.file_name && (
                        <Chip
                          size="small"
                          icon={<FileIcon sx={{ fontSize: '14px !important' }} />}
                          label={record.file_name}
                          sx={{ mt: 1, height: 26, fontSize: '0.75rem', cursor: 'pointer' }}
                          onClick={() => {}}
                        />
                      )}
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: '#F8F9FA', borderRadius: '8px' }}>
                  <Typography variant="body2" color="text.secondary">아직 기록이 없습니다.</Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button variant="outlined" onClick={() => setSessionOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConsultationManagement;
