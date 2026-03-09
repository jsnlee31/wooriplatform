import React, { useState, useRef } from 'react';
import {
  Box, Typography, Paper, Grid, TextField, Button, Switch, FormControlLabel,
  Dialog, DialogTitle, DialogContent, IconButton, Divider,
  Chip, Tabs, Tab, Card, CardContent, CardActions,
} from '@mui/material';
import {
  Image as ImageIcon, Close as CloseIcon, Save as SaveIcon,
  Visibility as PreviewIcon, Campaign as BannerIcon, TextFields as TextIcon,
  Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon,
  ArrowBack as ArrowBackIcon, ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNotification } from '../../contexts/NotificationContext';

const createDefaultPopup = (id) => ({
  id,
  active: true,
  title: '',
  content: '',
  imageUrl: '',
  linkUrl: '',
  linkText: '',
});

const DEFAULT_POPUPS = [
  {
    id: 1,
    active: true,
    title: '2026년 상반기 시니어 프로그램 모집',
    content: '금융컨설팅, 부동산, 창업 등 다양한 프로그램에 참여하세요!',
    imageUrl: '',
    linkUrl: '/programs',
    linkText: '자세히 보기',
  },
];

const DEFAULT_FOOTER_BANNERS = [
  { id: 1, text: '📢 2026년 상반기 시니어 프로그램 모집 중! 지금 바로 신청하세요.', active: true },
  { id: 2, text: '💼 신규 채용정보가 등록되었습니다. 채용공고를 확인해보세요!', active: true },
  { id: 3, text: '📚 새로운 온라인 강좌 "AI 활용 실무"가 오픈되었습니다.', active: true },
];

const BannerManagement = () => {
  const { showSuccess } = useNotification();
  const [tab, setTab] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewType, setPreviewType] = useState('popup');
  const [previewIndex, setPreviewIndex] = useState(0);
  const [editingIndex, setEditingIndex] = useState(null);
  const imageInputRef = useRef(null);

  // Load saved popup banners (now an array) or use defaults
  const [popups, setPopups] = useState(() => {
    try {
      const saved = localStorage.getItem('woori_popup_banners');
      if (saved) return JSON.parse(saved);
      // Migrate from old single popup format
      const oldSaved = localStorage.getItem('woori_popup_banner');
      if (oldSaved) {
        const old = JSON.parse(oldSaved);
        return [{ ...old, id: 1 }];
      }
      return DEFAULT_POPUPS;
    } catch { return DEFAULT_POPUPS; }
  });

  const [footerBanners, setFooterBanners] = useState(() => {
    try {
      const saved = localStorage.getItem('woori_footer_banners');
      return saved ? JSON.parse(saved) : DEFAULT_FOOTER_BANNERS;
    } catch { return DEFAULT_FOOTER_BANNERS; }
  });

  const [footerSpeed, setFooterSpeed] = useState(() => {
    return parseInt(localStorage.getItem('woori_footer_speed') || '30', 10);
  });

  const [footerActive, setFooterActive] = useState(() => {
    return localStorage.getItem('woori_footer_active') !== 'false';
  });

  const handleSavePopups = () => {
    localStorage.setItem('woori_popup_banners', JSON.stringify(popups));
    // Also keep backward-compatible single key for Layout migration
    localStorage.removeItem('woori_popup_banner');
    showSuccess('팝업 배너가 저장되었습니다');
  };

  const handleSaveFooter = () => {
    localStorage.setItem('woori_footer_banners', JSON.stringify(footerBanners));
    localStorage.setItem('woori_footer_speed', String(footerSpeed));
    localStorage.setItem('woori_footer_active', String(footerActive));
    showSuccess('하단 배너가 저장되었습니다');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || editingIndex === null) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      updatePopup(editingIndex, 'imageUrl', ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const addPopup = () => {
    const newId = Math.max(0, ...popups.map((p) => p.id)) + 1;
    setPopups((prev) => [...prev, createDefaultPopup(newId)]);
    setEditingIndex(popups.length);
  };

  const removePopup = (index) => {
    setPopups((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
    else if (editingIndex !== null && editingIndex > index) setEditingIndex(editingIndex - 1);
  };

  const updatePopup = (index, field, value) => {
    setPopups((prev) => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };

  const addFooterBanner = () => {
    const newId = Math.max(0, ...footerBanners.map((b) => b.id)) + 1;
    setFooterBanners((prev) => [...prev, { id: newId, text: '', active: true }]);
  };

  const removeFooterBanner = (id) => {
    setFooterBanners((prev) => prev.filter((b) => b.id !== id));
  };

  const updateFooterBanner = (id, field, value) => {
    setFooterBanners((prev) => prev.map((b) => b.id === id ? { ...b, [field]: value } : b));
  };

  const activePreviewPopups = popups.filter((p) => p.active);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>배너 관리</Typography>
        <Typography variant="body2" color="text.secondary">
          팝업 배너와 하단 롤링 배너를 관리합니다
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => { setTab(v); setEditingIndex(null); }} sx={{ mb: 3, '& .MuiTab-root': { fontSize: '0.875rem' } }}>
        <Tab icon={<BannerIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="팝업 배너" />
        <Tab icon={<TextIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="하단 롤링 배너" />
      </Tabs>

      {/* ─── Popup Banners ───────────────────────────────────────── */}
      {tab === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600} fontSize="0.9375rem">
              팝업 배너 목록 ({popups.length}개)
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" startIcon={<PreviewIcon />}
                onClick={() => { setPreviewType('popup'); setPreviewIndex(0); setPreviewOpen(true); }}
                disabled={activePreviewPopups.length === 0}>
                미리보기
              </Button>
              <Button size="small" variant="contained" startIcon={<SaveIcon />} onClick={handleSavePopups}>
                저장
              </Button>
            </Box>
          </Box>

          {/* Popup cards list */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {popups.map((popup, index) => (
              <Grid item xs={12} sm={6} md={4} key={popup.id}>
                <Card variant="outlined" sx={{
                  borderRadius: '12px',
                  borderColor: editingIndex === index ? 'primary.main' : 'divider',
                  borderWidth: editingIndex === index ? 2 : 1,
                  opacity: popup.active ? 1 : 0.6,
                }}>
                  {popup.imageUrl && (
                    <Box component="img" src={popup.imageUrl} alt="Banner"
                      sx={{ width: '100%', height: 100, objectFit: 'cover' }} />
                  )}
                  <CardContent sx={{ pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Chip label={popup.active ? '활성' : '비활성'} size="small"
                        color={popup.active ? 'success' : 'default'} />
                      <Switch size="small" checked={popup.active}
                        onChange={(e) => updatePopup(index, 'active', e.target.checked)} />
                    </Box>
                    <Typography variant="subtitle2" fontWeight={600} noWrap>
                      {popup.title || '(제목 없음)'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {popup.content || '(내용 없음)'}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
                    <Button size="small" startIcon={<EditIcon />}
                      onClick={() => setEditingIndex(editingIndex === index ? null : index)}>
                      편집
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    <IconButton size="small" color="error" onClick={() => removePopup(index)}
                      disabled={popups.length <= 1}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}

            {/* Add new popup card */}
            <Grid item xs={12} sm={6} md={4}>
              <Card variant="outlined" sx={{
                borderRadius: '12px', borderStyle: 'dashed', display: 'flex',
                alignItems: 'center', justifyContent: 'center', minHeight: 160,
                cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
              }}
                onClick={addPopup}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <AddIcon sx={{ fontSize: 32, color: 'text.secondary', mb: 0.5 }} />
                  <Typography variant="body2" color="text.secondary">새 팝업 추가</Typography>
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* Edit form for selected popup */}
          {editingIndex !== null && popups[editingIndex] && (
            <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'primary.main', borderRadius: '12px' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  팝업 #{editingIndex + 1} 편집
                </Typography>
                <IconButton size="small" onClick={() => setEditingIndex(null)}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField fullWidth label="제목" value={popups[editingIndex].title}
                    onChange={(e) => updatePopup(editingIndex, 'title', e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="내용" multiline rows={3} value={popups[editingIndex].content}
                    onChange={(e) => updatePopup(editingIndex, 'content', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="링크 URL" placeholder="/programs" value={popups[editingIndex].linkUrl}
                    onChange={(e) => updatePopup(editingIndex, 'linkUrl', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="링크 텍스트" value={popups[editingIndex].linkText}
                    onChange={(e) => updatePopup(editingIndex, 'linkText', e.target.value)} />
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>배너 이미지 (선택)</Typography>
                  <input type="file" accept="image/*" ref={imageInputRef} hidden onChange={handleImageUpload} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Button variant="outlined" startIcon={<ImageIcon />} onClick={() => imageInputRef.current?.click()}>
                      이미지 업로드
                    </Button>
                    {popups[editingIndex].imageUrl && (
                      <Box sx={{ position: 'relative' }}>
                        <Box component="img" src={popups[editingIndex].imageUrl} alt="Banner"
                          sx={{ width: 200, height: 100, objectFit: 'cover', borderRadius: '8px', border: '1px solid', borderColor: 'divider' }} />
                        <IconButton size="small"
                          onClick={() => updatePopup(editingIndex, 'imageUrl', '')}
                          sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: '#fff', width: 20, height: 20,
                            '&:hover': { bgcolor: 'error.dark' } }}>
                          <CloseIcon sx={{ fontSize: 12 }} />
                        </IconButton>
                      </Box>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Box>
      )}

      {/* ─── Footer Running Banner ──────────────────────────────── */}
      {tab === 1 && (
        <Paper elevation={0} sx={{ p: 3, border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={600} fontSize="0.9375rem">하단 롤링 배너 설정</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" variant="outlined" startIcon={<PreviewIcon />}
                onClick={() => { setPreviewType('footer'); setPreviewOpen(true); }}>
                미리보기
              </Button>
              <Button size="small" variant="contained" startIcon={<SaveIcon />} onClick={handleSaveFooter}>
                저장
              </Button>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
            <FormControlLabel
              control={<Switch checked={footerActive} onChange={(e) => setFooterActive(e.target.checked)} />}
              label={footerActive ? '활성화' : '비활성화'}
            />
            <TextField label="스크롤 속도 (초)" type="number" size="small" value={footerSpeed}
              onChange={(e) => setFooterSpeed(Math.max(5, Math.min(120, parseInt(e.target.value) || 30)))}
              sx={{ width: 150 }}
              inputProps={{ min: 5, max: 120 }}
              helperText="5~120초"
            />
          </Box>

          {footerBanners.map((banner, index) => (
            <Box key={banner.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Chip label={index + 1} size="small" sx={{ minWidth: 28 }} />
              <Switch size="small" checked={banner.active}
                onChange={(e) => updateFooterBanner(banner.id, 'active', e.target.checked)} />
              <TextField fullWidth size="small" placeholder="배너 텍스트를 입력하세요..."
                value={banner.text}
                onChange={(e) => updateFooterBanner(banner.id, 'text', e.target.value)} />
              <IconButton size="small" color="error" onClick={() => removeFooterBanner(banner.id)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}

          <Button startIcon={<AddIcon />} size="small" onClick={addFooterBanner} sx={{ mt: 1 }}>
            배너 추가
          </Button>
        </Paper>
      )}

      {/* ─── Preview Dialog ───────────────────────────────────────── */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700} fontSize="1rem">
            {previewType === 'popup' ? '팝업 배너 미리보기' : '하단 배너 미리보기'}
          </Typography>
          <IconButton size="small" onClick={() => setPreviewOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {previewType === 'popup' && activePreviewPopups.length > 0 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              {/* Navigation for multiple popups */}
              {activePreviewPopups.length > 1 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 2 }}>
                  <IconButton size="small" disabled={previewIndex === 0}
                    onClick={() => setPreviewIndex((i) => i - 1)}>
                    <ArrowBackIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="body2" fontWeight={600}>
                    {previewIndex + 1} / {activePreviewPopups.length}
                  </Typography>
                  <IconButton size="small" disabled={previewIndex >= activePreviewPopups.length - 1}
                    onClick={() => setPreviewIndex((i) => i + 1)}>
                    <ArrowForwardIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}

              {(() => {
                const popup = activePreviewPopups[previewIndex];
                if (!popup) return null;
                return (
                  <>
                    {popup.imageUrl && (
                      <Box component="img" src={popup.imageUrl} alt="Preview"
                        sx={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: '8px', mb: 2 }} />
                    )}
                    <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>{popup.title || '(제목 없음)'}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{popup.content || '(내용 없음)'}</Typography>
                    {popup.linkText && (
                      <Button variant="contained" size="small">{popup.linkText}</Button>
                    )}
                  </>
                );
              })()}

              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                활성화된 팝업: {activePreviewPopups.length}개
              </Typography>
            </Box>
          )}
          {previewType === 'footer' && (
            <Box sx={{ py: 2 }}>
              <Typography variant="subtitle2" sx={{ mb: 2 }}>미리보기 (스크롤 속도: {footerSpeed}초)</Typography>
              <Box sx={{
                bgcolor: '#0047BA', color: '#fff', p: 1.5, borderRadius: '8px',
                overflow: 'hidden', whiteSpace: 'nowrap', position: 'relative',
              }}>
                <Box sx={{
                  display: 'inline-block', animation: `marquee ${footerSpeed}s linear infinite`,
                  '@keyframes marquee': {
                    '0%': { transform: 'translateX(100%)' },
                    '100%': { transform: 'translateX(-100%)' },
                  },
                }}>
                  {footerBanners.filter((b) => b.active && b.text).map((b) => b.text).join('     |     ') || '(활성화된 배너가 없습니다)'}
                </Box>
              </Box>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                상태: {footerActive ? '활성화' : '비활성화'} · 활성 배너: {footerBanners.filter((b) => b.active).length}개
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default BannerManagement;
