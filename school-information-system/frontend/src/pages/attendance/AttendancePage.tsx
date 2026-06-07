import { useEffect, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  MenuItem,
  Divider,
  Grid,
  Skeleton,
  Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { useSnackbar } from 'notistack';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchSchools } from '../../store/slices/schoolSlice';
import { fetchCourses } from '../../store/slices/courseSlice';
import { fetchStudents } from '../../store/slices/studentSlice';
import { fetchEnrollments } from '../../store/slices/enrollmentSlice';
import { attendanceService } from '../../api/services/attendanceService';

export function AttendancePage() {
  const dispatch = useAppDispatch();
  const { enqueueSnackbar } = useSnackbar();

  // Select states from Redux slices
  const { items: schools } = useAppSelector((state) => state.schools);
  const { items: courses } = useAppSelector((state) => state.courses);
  const { items: students } = useAppSelector((state) => state.students);
  const { items: enrollments } = useAppSelector((state) => state.enrollments);

  // Filter States
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Attendance Register states
  const [register, setRegister] = useState<Record<number, { status: string; remarks: string; existingId?: string }>>({});
  const [loadingRegister, setLoadingRegister] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  useEffect(() => {
    dispatch(fetchSchools());
    dispatch(fetchCourses());
    dispatch(fetchStudents());
    dispatch(fetchEnrollments());
  }, [dispatch]);

  // Set default selections once data loads
  useEffect(() => {
    if (schools.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(String(schools[0].id));
    }
  }, [schools, selectedSchoolId]);

  useEffect(() => {
    const schoolCourses = courses.filter((c: any) => c.school_id === Number(selectedSchoolId));
    if (schoolCourses.length > 0) {
      setSelectedCourseId(String(schoolCourses[0].id));
    } else {
      setSelectedCourseId('');
    }
  }, [selectedSchoolId, courses]);

  // Load attendance records from API for selected course and date to check for updates
  const loadRegister = async () => {
    if (!selectedCourseId || !attendanceDate) return;
    setLoadingRegister(true);
    try {
      // Query attendance list filtered by date and course
      const response = await attendanceService.list({
        course_id: selectedCourseId,
        attendance_date: attendanceDate,
        per_page: 100
      });

      const recordsList = response.items || [];
      const newRegister: typeof register = {};
      
      // Populate state register
      recordsList.forEach((rec: any) => {
        newRegister[rec.student_id] = {
          status: rec.status,
          remarks: rec.remarks || '',
          existingId: rec.id
        };
      });

      // Default other active enrolled students to 'present'
      courseStudents.forEach((student: any) => {
        if (!newRegister[student.id]) {
          newRegister[student.id] = {
            status: 'present',
            remarks: ''
          };
        }
      });

      setRegister(newRegister);
    } catch (err) {
      enqueueSnackbar('Failed to load existing attendance register.', { variant: 'error' });
    } finally {
      setLoadingRegister(false);
    }
  };

  // Find students enrolled in the selected course
  const enrolledStudentIds = enrollments
    .filter((e: any) => e.course_id === Number(selectedCourseId) && e.status === 'active')
    .map((e: any) => e.student_id);

  const courseStudents = students.filter((s: any) => enrolledStudentIds.includes(s.id));

  // Reload register when selections change
  useEffect(() => {
    if (selectedCourseId && attendanceDate && students.length > 0 && enrollments.length > 0) {
      loadRegister();
    }
  }, [selectedCourseId, attendanceDate, students, enrollments]);

  const handleStatusChange = (studentId: number, status: string) => {
    setRegister((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleRemarksChange = (studentId: number, remarks: string) => {
    setRegister((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks,
      },
    }));
  };

  const handleMarkAll = (status: string) => {
    const updated = { ...register };
    courseStudents.forEach((s: any) => {
      updated[s.id] = {
        ...updated[s.id],
        status,
      };
    });
    setRegister(updated);
  };

  const handleSaveRegister = async () => {
    setSaveLoading(true);
    try {
      const promises = courseStudents.map(async (student: any) => {
        const item = register[student.id] || { status: 'present', remarks: '' };
        
        if (item.existingId) {
          // Record exists, update it
          return attendanceService.update(item.existingId, {
            status: item.status,
            remarks: item.remarks || null
          });
        } else {
          // Create new record
          return attendanceService.create({
            student_id: student.id,
            course_id: Number(selectedCourseId),
            attendance_date: attendanceDate,
            status: item.status,
            remarks: item.remarks || null
          });
        }
      });

      await Promise.all(promises);
      enqueueSnackbar('Attendance register saved successfully', { variant: 'success' });
      loadRegister();
    } catch (error: any) {
      const msg = error.response?.data?.detail || 'Failed to save attendance register.';
      enqueueSnackbar(msg, { variant: 'error' });
    } finally {
      setSaveLoading(false);
    }
  };

  const schoolCourses = courses.filter((c: any) => c.school_id === Number(selectedSchoolId));

  return (
    <Stack spacing={3} className="fade-in">
      {/* Header section */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Daily Attendance Register
          </Typography>
          <Typography color="text.secondary">
            Select course syllabus, set attendance dates, and log student presence status.
          </Typography>
        </Stack>
      </Stack>

      {/* Grid selections layout */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Register Filters
              </Typography>
              <Divider sx={{ mb: 2.5 }} />
              <Stack spacing={2.5}>
                <TextField
                  select
                  label="Select School"
                  fullWidth
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                >
                  {schools.map((s: any) => (
                    <MenuItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Choose Course Class"
                  fullWidth
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  disabled={schoolCourses.length === 0}
                >
                  {schoolCourses.map((c: any) => (
                    <MenuItem key={c.id} value={String(c.id)}>
                      {c.code} - {c.title}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Attendance Date"
                  type="date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Attendance Listing Panel */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              {!selectedCourseId ? (
                // Empty state selection guide
                <Box sx={{ py: 10, textAlign: 'center' }}>
                  <Stack spacing={2} alignItems="center" justifyContent="center">
                    <Box sx={{ bgcolor: 'rgba(37, 99, 235, 0.08)', p: 2, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <HelpOutlineIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      No Course Selected
                    </Typography>
                    <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
                      Please select a school and course in the filter sidebar to view the attendance log.
                    </Typography>
                  </Stack>
                </Box>
              ) : loadingRegister ? (
                // Loading skeleton list
                <Box sx={{ p: 3 }}>
                  <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
                  <Skeleton variant="rectangular" width="100%" height={240} sx={{ borderRadius: '12px' }} />
                </Box>
              ) : courseStudents.length === 0 ? (
                // Empty state no students enrolled in selected course
                <Box sx={{ py: 10, px: 3, textAlign: 'center' }}>
                  <Stack spacing={2} alignItems="center" justifyContent="center">
                    <Box sx={{ bgcolor: 'rgba(239, 68, 68, 0.08)', p: 2, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <FactCheckIcon sx={{ fontSize: 48, color: 'error.main' }} />
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      No Students Enrolled
                    </Typography>
                    <Typography color="text.secondary" sx={{ maxWidth: 320 }}>
                      There are no active student enrollments mapped to the selected course.
                    </Typography>
                    <Button variant="contained" href="/enrollments" sx={{ mt: 1 }}>
                      Enroll Students
                    </Button>
                  </Stack>
                </Box>
              ) : (
                // Attendance register table listing
                <Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2, bgcolor: theme => theme.palette.mode === 'light' ? '#f8fafc' : '#0f172a' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Class List ({courseStudents.length} Students)
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" onClick={() => handleMarkAll('present')}>
                        All Present
                      </Button>
                      <Button size="small" color="error" onClick={() => handleMarkAll('absent')}>
                        All Absent
                      </Button>
                    </Stack>
                  </Stack>
                  <Divider />

                  <TableContainer component={Box}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Student Details</TableCell>
                          <TableCell>Presence Status</TableCell>
                          <TableCell>Remarks / Comments</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {courseStudents.map((student: any) => {
                          const stateItem = register[student.id] || { status: 'present', remarks: '' };
                          return (
                            <TableRow key={student.id} hover>
                              <TableCell>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {student.first_name} {student.last_name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Adm No: {student.admission_no}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <RadioGroup
                                  row
                                  value={stateItem.status}
                                  onChange={(e) => handleStatusChange(student.id, e.target.value)}
                                >
                                  <FormControlLabel
                                    value="present"
                                    control={<Radio size="small" color="success" />}
                                    label={<Typography variant="body2">Present</Typography>}
                                  />
                                  <FormControlLabel
                                    value="absent"
                                    control={<Radio size="small" color="error" />}
                                    label={<Typography variant="body2">Absent</Typography>}
                                  />
                                  <FormControlLabel
                                    value="late"
                                    control={<Radio size="small" color="warning" />}
                                    label={<Typography variant="body2">Late</Typography>}
                                  />
                                  <FormControlLabel
                                    value="excused"
                                    control={<Radio size="small" color="info" />}
                                    label={<Typography variant="body2">Excused</Typography>}
                                  />
                                </RadioGroup>
                              </TableCell>
                              <TableCell>
                                <TextField
                                  placeholder="Add comments..."
                                  size="small"
                                  fullWidth
                                  value={stateItem.remarks}
                                  onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                  disabled={saveLoading}
                                />
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Divider />
                  
                  {/* Register submission footer bar */}
                  <Box sx={{ p: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={saveLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                      onClick={handleSaveRegister}
                      disabled={saveLoading}
                      sx={{ px: 4 }}
                    >
                      {saveLoading ? 'Saving Register...' : 'Save Attendance Register'}
                    </Button>
                  </Box>
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
