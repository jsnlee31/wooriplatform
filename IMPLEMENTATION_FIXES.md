# Critical Fixes Implementation Guide

## Fix #1: Replace UserManagement Mock Data with API Calls

**File:** `frontend/src/pages/admin/UserManagement.jsx`
**Issue:** Using hardcoded mock users instead of backend API
**Priority:** CRITICAL

### Before (Current - Mock Data):
```jsx
const INITIAL_USERS = [
  { id: 1, name_ko: '홍길동', role: 'learner', ... },
  { id: 2, name_ko: '김철수', role: 'instructor', ... },
];

const UserManagement = () => {
  const [users, setUsers] = useState(INITIAL_USERS); // ❌ Mock data
```

### After (Fixed - Real API):
```jsx
const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  // Fetch users from backend
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const response = await api.get('/users', {
          params: { page, limit: 20, role: roleFilter }
        });
        setUsers(response.data.users);
      } catch (err) {
        setError('Failed to load users');
        showError('사용자 목록을 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page, roleFilter]);

  // Sync data when user is updated
  const handleSaveUser = async (updatedUser) => {
    try {
      const response = await api.put(`/users/${updatedUser.id}`, updatedUser);
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === updatedUser.id ? response.data.user : u
      ));
      showSuccess('사용자가 수정되었습니다');
    } catch (err) {
      showError('사용자 수정에 실패했습니다');
    }
  };
```

---

## Fix #2: Replace CourseManagement Mock Data with API

**File:** `frontend/src/pages/admin/CourseManagement.jsx`
**Issue:** Using hardcoded course array
**Priority:** CRITICAL

### Implementation:
```jsx
const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch courses from API
  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      try {
        const response = await api.get('/courses', {
          params: { page: 1, limit: 100 }
        });
        setCourses(response.data.courses || []);
      } catch (err) {
        showError('강의를 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Create or update course
  const handleSaveCourse = async (courseData) => {
    try {
      if (editMode && selectedCourse) {
        // Update existing course
        const response = await api.put(`/courses/${selectedCourse.id}`, {
          title_ko: courseData.title,
          category: courseData.category,
          description_ko: courseData.description,
          thumbnail_url: courseData.coverImage,
          video_url: courseData.videoUrl,
          // ... other fields
        });
        setCourses(prev => prev.map(c =>
          c.id === selectedCourse.id ? response.data : c
        ));
      } else {
        // Create new course
        const response = await api.post('/courses', {
          title_ko: courseData.title,
          category: courseData.category,
          instructor_id: user.id,
          // ... other fields
        });
        setCourses(prev => [response.data, ...prev]);
      }
      showSuccess(editMode ? '강의가 수정되었습니다' : '강의가 등록되었습니다');
      setDialogOpen(false);
    } catch (err) {
      showError('강의 저장에 실패했습니다');
    }
  };
};
```

---

## Fix #3: Implement Real-Time Sync for Enrollment

**File:** `frontend/src/hooks/useRealtimeSync.js` (NEW FILE)
**Issue:** Enrollment requests not syncing in real-time
**Priority:** CRITICAL

### New Hook:
```jsx
// frontend/src/hooks/useRealtimeSync.js
import { useEffect, useCallback } from 'react';

/**
 * Hook for real-time data synchronization
 * Uses polling as fallback; can be enhanced with WebSocket
 */
export const useRealtimeSync = (
  fetchFunction,
  setData,
  interval = 5000,
  enabled = true
) => {
  useEffect(() => {
    if (!enabled) return;

    // Initial fetch
    fetchFunction();

    // Poll for updates
    const intervalId = setInterval(() => {
      fetchFunction();
    }, interval);

    return () => clearInterval(intervalId);
  }, [fetchFunction, enabled, interval]);
};

// Usage in CourseManagement:
const fetchEnrollments = useCallback(async () => {
  try {
    const response = await api.get('/courses/enrollments');
    setStudentRequests(response.data);
  } catch (err) {
    console.error('Sync error:', err);
  }
}, []);

useRealtimeSync(fetchEnrollments, setStudentRequests, 3000);
```

---

## Fix #4: Add Mobile-Responsive Sidebar

**File:** `frontend/src/components/admin/AdminLayout.jsx`
**Issue:** Sidebar not accessible on mobile
**Priority:** CRITICAL

### Before:
```jsx
{!isMobile && <Sidebar />}
```

### After:
```jsx
import {
  Drawer,
  useMediaQuery,
  useTheme,
} from '@mui/material';

const AdminLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Mobile Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        anchor="left"
        open={isMobile ? sidebarOpen : true}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: SIDEBAR_WIDTH,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
          },
        }}
      >
        <Sidebar />
      </Drawer>

      {/* Main Content */}
      <Box sx={{ flex: 1 }}>
        <AppBar position="static">
          {isMobile && (
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MenuIcon />
            </IconButton>
          )}
        </AppBar>
        {children}
      </Box>
    </Box>
  );
};
```

---

## Fix #5: Make User Table Mobile-Responsive

**File:** `frontend/src/pages/admin/UserManagement.jsx`
**Issue:** Table columns don't fit on mobile
**Priority:** HIGH

### Implementation:
```jsx
const UserManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Create responsive user card for mobile
  const UserCard = ({ user }) => (
    <Card sx={{ mb: 2, p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight={600}>
          {user.name_ko}
        </Typography>
        <Chip
          label={getRoleLabel(user.role)}
          color={getRoleColor(user.role)}
          size="small"
        />
      </Box>
      <Typography variant="caption" color="text.secondary" display="block">
        Email: {user.email}
      </Typography>
      <Typography variant="caption" color="text.secondary" display="block">
        Department: {user.department}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button size="small" variant="outlined">Edit</Button>
        <Button size="small" variant="outlined">Deactivate</Button>
      </Box>
    </Card>
  );

  return (
    <Box>
      {isMobile ? (
        // Mobile: Card View
        <Box>
          {filtered.map(user => (
            <UserCard key={user.id} user={user} />
          ))}
        </Box>
      ) : (
        // Desktop: Table View
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                {/* ... other columns ... */}
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map(user => (
                <TableRow key={user.id}>
                  {/* ... cells ... */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};
```

---

## Fix #6: Add Form Validation with Real-Time Feedback

**File:** `frontend/src/pages/admin/UserManagement.jsx`
**Issue:** No form validation feedback
**Priority:** HIGH

### Implementation:
```jsx
const UserManagement = () => {
  const [formErrors, setFormErrors] = useState({});

  const validateField = (name, value) => {
    const newErrors = { ...formErrors };

    switch (name) {
      case 'email':
        if (!value) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Invalid email format';
        } else {
          delete newErrors.email;
        }
        break;

      case 'name_ko':
        if (!value.trim()) {
          newErrors.name_ko = 'Name is required';
        } else {
          delete newErrors.name_ko;
        }
        break;

      case 'phone':
        if (!value) {
          newErrors.phone = 'Phone is required';
        } else if (!/^\d{10,11}$/.test(value.replace(/-/g, ''))) {
          newErrors.phone = 'Invalid phone format';
        } else {
          delete newErrors.phone;
        }
        break;
    }

    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  return (
    <Dialog open={editDialogOpen}>
      <DialogContent>
        <TextField
          fullWidth
          label="Email"
          name="email"
          value={form.email}
          onChange={handleFormChange}
          onBlur={(e) => validateField('email', e.target.value)}
          error={!!formErrors.email}
          helperText={formErrors.email}
          margin="normal"
        />
        <TextField
          fullWidth
          label="Name (Korean)"
          name="name_ko"
          value={form.name_ko}
          onChange={handleFormChange}
          error={!!formErrors.name_ko}
          helperText={formErrors.name_ko}
          margin="normal"
        />
      </DialogContent>
    </Dialog>
  );
};
```

---

## Fix #7: Implement Enrollment Approval Real-Time Notification

**File:** `frontend/src/pages/admin/CourseManagement.jsx`
**Issue:** Student doesn't see approval immediately
**Priority:** HIGH

### Implementation:
```jsx
const CourseManagement = () => {
  // Poll for pending enrollment updates every 3 seconds
  useEffect(() => {
    const pollEnrollments = async () => {
      try {
        const response = await api.get('/courses/enrollments/pending');
        setStudentRequests(response.data);
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    const intervalId = setInterval(pollEnrollments, 3000);
    return () => clearInterval(intervalId);
  }, []);

  const handleApproveStudent = async (studentId) => {
    try {
      await api.post(`/courses/enrollments/${studentId}/approve`, {
        status: 'approved'
      });

      setStudentRequests(prev =>
        prev.map(s => s.id === studentId ? { ...s, status: '승인완료' } : s)
      );

      // Also update enrollments for the learner
      // Send notification (future: WebSocket)
      showSuccess('수강 신청이 승인되었습니다');

      // Notify learner via dashboard update
      // They will see it on next poll/refresh
    } catch (err) {
      showError('승인 처리 실패');
    }
  };
};
```

---

## Fix #8: Increase Touch Target Sizes on Mobile

**File:** `frontend/src/components/common/ResponsiveButton.jsx` (NEW)
**Issue:** Buttons too small for mobile touch
**Priority:** HIGH

### New Component:
```jsx
import { Button } from '@mui/material';
import { useTheme, useMediaQuery } from '@mui/material';

export const ResponsiveButton = (props) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Button
      {...props}
      sx={{
        minHeight: isMobile ? '44px' : '36px',
        minWidth: isMobile ? '44px' : '36px',
        padding: isMobile ? '12px 24px' : '8px 16px',
        fontSize: isMobile ? '16px' : '14px', // Prevents zoom on iOS
        ...props.sx,
      }}
    />
  );
};
```

---

## Fix #9: Improve API Error Messages

**File:** `backend/src/routes/users.js`
**Issue:** Generic error messages
**Priority:** MEDIUM

### Before:
```js
res.status(400).json({ error: 'Email already registered' });
```

### After:
```js
// Create a consistent error response utility
const sendError = (res, status, code, message, details = {}) => {
  res.status(status).json({
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    },
  });
};

// Usage
if (existingUser.rows.length > 0) {
  return sendError(
    res,
    409,
    'EMAIL_ALREADY_EXISTS',
    'This email address is already registered',
    { email: req.body.email }
  );
}

// On frontend
try {
  await authAPI.register(data);
} catch (err) {
  const error = err.response?.data?.error;
  if (error?.code === 'EMAIL_ALREADY_EXISTS') {
    showError('This email is already registered. Please use a different one.');
  } else {
    showError(error?.message || 'Registration failed');
  }
}
```

---

## Fix #10: Add Database Progress Persistence

**File:** `backend/src/routes/courses.js`
**Issue:** Progress not saved to database
**Priority:** CRITICAL

### Implementation:
```js
router.put('/:id/progress', authenticate, async (req, res) => {
  try {
    const { progress, lastAccessedAt } = req.body;

    // Validate progress
    if (progress < 0 || progress > 100) {
      return sendError(
        res, 400, 'INVALID_PROGRESS',
        'Progress must be between 0 and 100'
      );
    }

    // Update or insert enrollment
    const result = await db.query(
      `UPDATE course_enrollments
       SET progress = $1, last_accessed_at = $2, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $3 AND course_id = $4
       RETURNING *`,
      [progress, lastAccessedAt || new Date(), req.user.id, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Enrollment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});
```

---

## Summary of Fixes

| Issue | Fix | Effort | Priority |
|-------|-----|--------|----------|
| Mock Data (Users) | Replace with API calls | 2h | CRITICAL |
| Mock Data (Courses) | Replace with API calls | 2h | CRITICAL |
| Enrollment Not Syncing | Add polling/WebSocket | 4h | CRITICAL |
| Mobile Sidebar | Make responsive drawer | 1h | CRITICAL |
| Progress Not Saved | Implement DB persistence | 2h | CRITICAL |
| Mobile Tables | Convert to cards | 2h | HIGH |
| Form Validation | Add real-time feedback | 3h | HIGH |
| Touch Targets | Increase button sizes | 1h | HIGH |
| Error Messages | Improve clarity | 2h | MEDIUM |
| **Total** | - | **20 hours** | - |

