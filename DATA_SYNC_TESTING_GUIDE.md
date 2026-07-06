# 🔄 DATA INTEGRITY & CROSS-DEVICE SYNC TESTING GUIDE

## Overview

This guide helps verify that data remains consistent across the system when modified from different user roles (Admin, Instructor, Learner) and devices (Desktop, Mobile, Tablet).

---

## 🎯 Key Sync Scenarios to Test

### Scenario 1: Admin Creates Course → Instructor Sees It

```
Timeline:
09:00:00 - Admin (Desktop)
          ✅ Click: Create new course
          ✅ Fill form: Title="Python 101"
          ✅ Click Save
          ✅ Backend: INSERT course into database
          ✅ Frontend: Course appears in list

09:00:02 - Instructor (iPhone Mobile)
          Should see the new course immediately OR within 5 seconds
          
          ❌ Current: Must manually refresh page
          ✅ Target: Auto-update or at least poll every 3-5 seconds
```

**Test Procedure:**

```bash
Step 1: Open TWO browser windows side-by-side
  Left: Admin logged in → /admin/courses
  Right: Instructor logged in → /admin/courses

Step 2: In LEFT window (Admin)
  - Click "강의 등록" button
  - Fill: Title="테스트강의", Category="디지털"
  - Select Instructor
  - Click "저장"

Step 3: Check RIGHT window (Instructor)
  Expected: New course appears within 5 seconds
  
  ✅ PASS: Course visible without refresh
  ⚠️  PASS (but slow): Appears after 5-10 seconds
  ❌ FAIL: Doesn't appear without manual refresh
  ❌ FAIL: Doesn't appear at all
```

**Database Verification:**
```sql
-- Verify course exists in database
SELECT id, title_ko, instructor_id, created_at FROM courses 
WHERE title_ko = 'TestCourse' 
ORDER BY created_at DESC LIMIT 1;

-- Should show: course_id | 테스트강의 | instructor_id | 2026-02-27 09:00:00
```

---

### Scenario 2: Instructor Updates Course → Admin Sees Changes Immediately

```
Timeline:
10:00:00 - Instructor (Mobile)
          Updates course description
          
10:00:01 - ✅ Backend: UPDATE courses SET description=...
          ✅ Frontend: Shows success message

10:00:02 - Admin (Desktop, has same course open)
          Should see updated description
          
          ❌ Current: Might still show old description
          ✅ Target: Auto-refresh within 3-5 seconds
```

**Test Procedure:**

```bash
Step 1: Setup
  - Admin: /admin/courses (open course detail view)
  - Instructor: /admin/courses (find same course, open edit)

Step 2: Instructor modifies
  - Change description to: "Updated content"
  - Click Save

Step 3: Check Admin side
  Expected: Description updates automatically
  
  ✅ PASS: Shows "Updated content" immediately
  ⚠️  PASS: Shows after clicking refresh
  ❌ FAIL: Admin must close and reopen course
  ❌ FAIL: Change never appears
```

**Database Check:**
```sql
SELECT id, description_ko, updated_at FROM courses 
WHERE id = 'course_uuid' 
ORDER BY updated_at DESC LIMIT 1;
```

---

### Scenario 3: Student Requests Enrollment → Admin Approves → Student Sees Approval

```
Timeline:
11:00:00 - Student (Mobile, /learning-materials)
          Clicks "수강신청" for Python course
          
11:00:01 - ✅ Backend: INSERT enrollment request
          ✅ Frontend: Shows "대기중" (Pending)

11:00:05 - Admin (Desktop, /admin/courses/enrollments)
          ⚠️  Doesn't see new request yet (no real-time sync)
          
11:00:30 - Admin manual refreshes
          ✅ Now sees: Student X requesting Python course
          ✅ Clicks "승인" (Approve)

11:00:31 - Backend: UPDATE enrollment SET status='approved'
          ✅ Sends notification (ideally)

11:00:32 - Student (still on Mobile)
          ❌ Current: Still shows "대기중"
          ✅ Target: Should show "승인완료" within 5 seconds
```

**Test Procedure:**

```bash
Step 1: Open 2 windows
  Window A: Student (logged in as learner)
  Window B: Admin (logged in as admin)

Step 2: In Window A
  - Navigate to /pages/learning/LearningMaterials
  - Find "Python 101" course
  - Click "수강신청"
  - Verify: Shows "대기중" status

Step 3: In Window B
  - Navigate to /admin/courses
  - Go to Enrollments tab
  - Verify: See student's pending request (might need refresh)

Step 4: In Window B (Admin)
  - Click "승인" to approve

Step 5: Back in Window A (Student)
  - Wait 5 seconds
  - Check status
  
  ✅ PASS: Automatically shows "승인완료"
  ⚠️  PASS: Shows after F5 refresh
  ❌ FAIL: Doesn't update without manual refresh
  ❌ FAIL: Request denied despite approval
```

---

### Scenario 4: Consultant Updates Availability → Learner Sees New Slots

```
Timeline:
12:00:00 - Consultant (Instructor)
          Publishes availability for next week
          Sets: Feb 28, 14:00-17:00, 30-min slots
          
12:00:05 - Backend: INSERT slots into consultations
          ✅ Database has 6 new time slots

12:00:10 - Learner (Mobile, /consultations/booking)
          ❌ Still sees old available slots
          
          ✅ Target: Should see new slots within 5 seconds
```

**Test Procedure:**

```bash
Step 1: Open 2 windows
  Window A: Consultant (instructor) → /admin/consultations/availability
  Window B: Learner → /pages/consultations/ConsultationBooking

Step 2: In Window A (Consultant)
  - Click "Add availability"
  - Set date: Feb 28, 2026
  - Time: 14:00-17:00
  - Slot duration: 30 minutes
  - Click "Publish"
  - Verify: Success message

Step 3: In Window B (Learner)
  - Set date: Feb 28
  - Check available times
  
  ✅ PASS: New time slots appear
  ⚠️  PASS: Appear after refresh
  ❌ FAIL: Doesn't see new slots
```

---

### Scenario 5: Admin Removes User → All Related Data Handled

```
Timeline:
13:00:00 - Admin clicks Delete on User "김철수"

Expected Cascade:
  ✅ User deleted from users table
  ✅ Enrollments deleted (or marked inactive)
  ✅ Applications deleted
  ✅ Consultations cancelled
  ✅ No orphaned records

Database Check After Delete:
  SELECT * FROM users WHERE email = 'kim@email.com';
  Result: (empty)
  
  SELECT * FROM course_enrollments 
  WHERE user_id = 'kim_uuid';
  Result: (empty) OR status = 'cancelled'
```

**Test Procedure:**

```bash
Step 1: Note user details
  - Create test user: Test User, test123@email.com
  - Have user enroll in courses
  - Have user request consultations
  - Have user apply to programs

Step 2: As Admin
  - Go to /admin/users
  - Find "Test User"
  - Click Delete → Confirm

Step 3: Verify cleanup
  - ✅ User not in users table
  - ✅ Check courses table: No enrollments by deleted user
  - ✅ Check consultations: Marked cancelled or deleted
  - ✅ Check applications: Marked cancelled or deleted
```

**SQL Verification:**
```sql
-- After deletion, these should be empty or cancelled:
SELECT COUNT(*) FROM course_enrollments 
WHERE user_id = 'deleted_user_uuid';

SELECT COUNT(*) FROM consultations 
WHERE user_id = 'deleted_user_uuid' 
AND status != 'cancelled';

SELECT COUNT(*) FROM program_applications 
WHERE user_id = 'deleted_user_uuid' 
AND status != 'cancelled';
```

---

## 📋 Data Consistency Verification Matrix

### Test Matrix

| Scenario | Admin Action | Instructor Sees | Learner Sees | Time | Status |
|----------|-------------|-----------------|--------------|------|--------|
| Create Course | ✅ Creates course | ❌ No auto-sync | - | 5s | FAIL |
| Update Course | ✅ Updates title | ⚠️ After refresh | - | 10s | SLOW |
| Approve Enrollment | ✅ Clicks approve | - | ⚠️ After refresh | 5s | SLOW |
| Publish Availability | - | ✅ Creates slots | ❌ No auto-sync | 5s | FAIL |
| Change User Role | ✅ Changes role | ⚠️ After refresh | ⚠️ After refresh | 10s | SLOW |
| Delete User | ✅ Deletes | ✅ Cascades | - | 1s | PASS |

**Legend:**
- ✅ PASS: Works immediately
- ⚠️ SLOW: Works but has delay
- ❌ FAIL: Doesn't work without manual intervention

---

## 🔐 Data Validation Rules

### Course Data Integrity

```javascript
// Validation rules for courses
const courseValidation = {
  title_ko: {
    required: true,
    minLength: 2,
    maxLength: 200,
    pattern: /^[\s\S]*\S[\s\S]*$/, // Not just spaces
  },
  
  description_ko: {
    maxLength: 2000,
  },
  
  category: {
    required: true,
    enum: ['금융컨설팅', '부동산', '창업', '사회공헌', '디지털', '건강', '여가', '재무'],
  },
  
  instructor_id: {
    required: true,
    mustExist: 'users.id', // Foreign key constraint
    mustBeInstructor: true, // User role must be 'instructor'
  },
  
  duration_minutes: {
    min: 1,
    max: 480, // 8 hours max
  },
  
  video_url: {
    ifProvided: {
      pattern: /^https?:\/\/.+/, // Must be valid URL
      checkAvailable: true, // Verify URL returns 200
    },
  },
};
```

### Enrollment Data Integrity

```javascript
const enrollmentValidation = {
  user_id: {
    required: true,
    mustExist: 'users.id',
    mustBeRole: 'learner',
  },
  
  course_id: {
    required: true,
    mustExist: 'courses.id',
  },
  
  status: {
    enum: ['pending', 'approved', 'active', 'completed', 'cancelled'],
    sequence: {
      // Valid state transitions:
      pending: ['approved', 'cancelled'],
      approved: ['active', 'cancelled'],
      active: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
    },
  },
  
  progress: {
    min: 0,
    max: 100,
    type: 'integer',
  },
  
  UNIQUE: ['user_id', 'course_id'], // User can only enroll once per course
};
```

---

## 🧪 Automated Data Integrity Tests

### SQL Verification Queries

```sql
-- ============================================
-- Data Integrity Check Suite
-- ============================================

-- 1. Check for orphaned enrollments
SELECT ce.id, ce.user_id, ce.course_id
FROM course_enrollments ce
LEFT JOIN users u ON ce.user_id = u.id
LEFT JOIN courses c ON ce.course_id = c.id
WHERE u.id IS NULL OR c.id IS NULL;
-- Result: Should be empty (0 rows)

-- 2. Check for duplicate enrollments
SELECT user_id, course_id, COUNT(*) as count
FROM course_enrollments
GROUP BY user_id, course_id
HAVING COUNT(*) > 1;
-- Result: Should be empty (0 rows)

-- 3. Check for invalid enrollment status
SELECT id, status
FROM course_enrollments
WHERE status NOT IN ('pending', 'approved', 'active', 'completed', 'cancelled');
-- Result: Should be empty (0 rows)

-- 4. Check for progress out of range
SELECT id, progress
FROM course_enrollments
WHERE progress < 0 OR progress > 100;
-- Result: Should be empty (0 rows)

-- 5. Check for courses without instructors (if required)
SELECT id, title_ko
FROM courses
WHERE instructor_id IS NULL;
-- Result: Empty if all courses must have instructor

-- 6. Check for inactive users with active enrollments
SELECT ce.id, u.email, u.status, c.title_ko
FROM course_enrollments ce
JOIN users u ON ce.user_id = u.id
JOIN courses c ON ce.course_id = c.id
WHERE u.status != 'active' AND ce.status = 'active';
-- Result: Should be empty (inactive users shouldn't have active enrollments)

-- 7. Check data modification timestamps
SELECT 
  id, created_at, updated_at,
  EXTRACT(EPOCH FROM (updated_at - created_at)) as seconds_since_creation
FROM courses
WHERE updated_at < created_at;
-- Result: Should be empty (updated_at must be >= created_at)

-- 8. Check for courses modified before creation (logical error)
SELECT id, title_ko, created_at, updated_at
FROM courses
WHERE updated_at < created_at;
-- Result: Should be empty
```

### Frontend Data Validation

```javascript
// Verify data types and constraints in console
function validateEnrollment(enrollment) {
  const errors = [];

  // Type checks
  if (typeof enrollment.user_id !== 'string' || !enrollment.user_id) {
    errors.push('Invalid user_id');
  }
  if (typeof enrollment.course_id !== 'string' || !enrollment.course_id) {
    errors.push('Invalid course_id');
  }
  
  // Value range checks
  if (enrollment.progress < 0 || enrollment.progress > 100) {
    errors.push(`Invalid progress: ${enrollment.progress}`);
  }
  
  // Enum checks
  const validStatuses = ['pending', 'approved', 'active', 'completed', 'cancelled'];
  if (!validStatuses.includes(enrollment.status)) {
    errors.push(`Invalid status: ${enrollment.status}`);
  }
  
  // Date checks
  const created = new Date(enrollment.created_at);
  const updated = new Date(enrollment.updated_at);
  if (updated < created) {
    errors.push('Updated time before created time');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

// Usage:
const enrollment = { /* data from API */ };
const validation = validateEnrollment(enrollment);
if (!validation.valid) {
  console.error('Data integrity issues:', validation.errors);
}
```

---

## 🔄 Cross-Device Sync Testing

### Setup (3 Devices)

```
Device A: Admin on Desktop (Firefox)
Device B: Instructor on Tablet (Safari)
Device C: Learner on Mobile (Chrome)

All logged in with different accounts
```

### Test Case: Create → Update → Approve → Complete

```
11:00 AM - Device A (Admin)
          Creates course: "Advanced Python"
          
11:00:15 - Device B (Instructor)
           ⏳ Waits 15 seconds
           Refreshes page
           ✅ Sees new course
           
11:05 - Device A (Admin)
        Clicks "Edit" on "Advanced Python"
        Changes description
        Saves
        
11:05:10 - Device B (Instructor)
           Auto-refresh triggers
           ⏳ OR manual refresh after 10s
           ✅ Sees updated description
           
11:10 - Device C (Learner)
        Finds "Advanced Python"
        Clicks "수강신청"
        Status: "대기중"
        
11:10:05 - Device A (Admin)
           Navigates to enrollments
           ⏳ Might need refresh
           Sees learner's request
           Clicks "승인"
           
11:10:10 - Device C (Learner)
           Status updates?
           ❌ FAIL: Still shows "대기중"
           ⚠️  PASS: Shows "승인완료" after refresh
           ✅ PASS: Auto-updates to "승인완료"
```

### Sync Success Criteria

```
✅ EXCELLENT: All updates appear < 2 seconds
✅ GOOD:      All updates appear < 5 seconds
⚠️  ACCEPTABLE: Updates appear < 10 seconds or after refresh
❌ POOR:       Updates require manual page reload
❌ FAIL:       Updates never appear
```

---

## 📊 Cross-Device Sync Report

```markdown
# Cross-Device Sync Test Report
Date: 2026-02-27
Tester: [Name]

## Environment
- Device A: Desktop (1920×1080, Firefox)
- Device B: Tablet (768×1024, Safari)
- Device C: Mobile (375×667, Chrome)
- Network: Wired LAN (100Mbps+)

## Test Results

### Test 1: Admin Creates Course
- Admin creates course ✅ 11:00:00
- Instructor sees it ⚠️  11:00:15 (15s delay)
- Status: SLOW but acceptable

### Test 2: Instructor Updates Description
- Instructor updates ✅ 11:05:00
- Admin sees update ❌ 11:05:30 (needs refresh)
- Status: FAIL - requires manual refresh

### Test 3: Student Enrolls
- Student requests enrollment ✅ 11:10:00
- Admin sees request ⚠️  11:10:30 (30s delay)
- Status: SLOW

### Test 4: Admin Approves
- Admin approves ✅ 11:10:35
- Student sees approval ❌ Never auto-updates
- Status: FAIL - student must refresh

## Summary
- Real-time sync: ❌ NOT implemented
- Polling working: ⚠️  Partially (5-30s delay)
- Manual refresh required: ⚠️  Yes, often

## Recommendations
1. Implement polling every 3-5 seconds
2. Better: WebSocket for real-time updates
3. Add visual indicators (pulse animation) when syncing
```

---

## 🚀 Recommendations

### Immediate Fixes

1. **Add Polling** (Quick fix, 2-3 hour implementation)
   ```javascript
   useEffect(() => {
     const interval = setInterval(() => {
       refetchData();
     }, 5000); // Poll every 5 seconds
     return () => clearInterval(interval);
   }, []);
   ```

2. **Add Loading Indicators**
   - Show "Syncing..." badge
   - Disable interactions during sync
   - Show when last synced

3. **Add Error Recovery**
   - Retry on network error
   - Queue changes offline
   - Sync when back online

### Long-term Solution

1. **Implement WebSocket**
   ```javascript
   // Real-time push updates
   const socket = io(API_URL);
   socket.on('course:updated', (course) => {
     setCourses(prev => prev.map(c => 
       c.id === course.id ? course : c
     ));
   });
   ```

2. **Add Conflict Resolution**
   - Last-write-wins
   - Optimistic locking
   - Merge conflicts

3. **Add Audit Trail**
   - Track all changes
   - Show who changed what
   - Timestamp every update

