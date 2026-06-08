import { useEffect, useState } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
  Box,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemIcon,
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Button,
  useTheme,
  Alert,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
} from '@mui/material';
import { Bar, Doughnut, Line, PolarArea } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Title,
  Filler,
} from 'chart.js';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import BookIcon from '@mui/icons-material/Book';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import AssessmentIcon from '@mui/icons-material/Assessment';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import GradeIcon from '@mui/icons-material/Grade';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDashboardSummary } from '../../store/slices/dashboardSlice';
import { studentService } from '../../api/services/studentService';
import { enrollmentService } from '../../api/services/enrollmentService';
import { attendanceService } from '../../api/services/attendanceService';
import { examService } from '../../api/services/examService';
import { resultService } from '../../api/services/resultService';
import { schoolService } from '../../api/services/schoolService';
import { dashboardService } from '../../api/services/dashboardService';
import { LoadingScreen } from '../../components/common/LoadingScreen';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  RadialLinearScale,
  Tooltip,
  Legend,
  Title,
  Filler
);

function StudentDashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [attendances, setAttendances] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch schools list for lookup
      const schoolsResponse = await schoolService.list();
      setSchools(schoolsResponse.items || schoolsResponse);

      // 2. Fetch logged-in student's profile (automatically filtered on backend by email)
      const studentsResponse = await studentService.list();
      const studentProfile = studentsResponse.items?.[0] || studentsResponse?.[0] || null;
      setProfile(studentProfile);

      if (studentProfile) {
        // 3. Fetch enrollments for student
        const enrollmentsResponse = await enrollmentService.list();
        setEnrollments(enrollmentsResponse.items || enrollmentsResponse);

        // 4. Fetch attendance logs
        const attendanceResponse = await attendanceService.list();
        setAttendances(attendanceResponse.items || attendanceResponse);

        // 5. Fetch exam results
        const resultsResponse = await resultService.list();
        setResults(resultsResponse.items || resultsResponse);

        // 6. Fetch exams for student's school
        const examsResponse = await examService.list();
        setExams(examsResponse.items || examsResponse);
      }
    } catch (error) {
      console.error('Error loading student dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!profile) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error" sx={{ maxWidth: 500, mx: 'auto', borderRadius: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Profile Not Found</Typography>
          <Typography variant="body2">
            We couldn't retrieve a student profile associated with your authenticated email account. Please contact the administration.
          </Typography>
        </Alert>
      </Box>
    );
  }

  const schoolName = schools.find((s: any) => s.id === profile.school_id)?.name || 'Unknown School';
  const totalClasses = attendances.length;
  const presentClasses = attendances.filter((a: any) => a.status === 'present').length;
  const attendanceRate = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 100;

  const enrolledCourseIds = enrollments.map((e: any) => e.course_id);
  const studentExams = exams.filter((exam: any) => enrolledCourseIds.includes(exam.course_id));

  return (
    <Stack spacing={4} className="fade-in">
      {/* Student Welcome Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Welcome back, {profile.first_name}!
          </Typography>
          <Typography color="text.secondary">
            Here is your current academic performance, enrollments, and schedules.
          </Typography>
        </Stack>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={loadData}
          sx={{ borderRadius: '20px', fontWeight: 600 }}
        >
          Refresh Dashboard
        </Button>
      </Stack>

      {/* Tabs Menu */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="student dashboard tabs"
          sx={{
            '& .MuiTab-root': {
              fontWeight: 700,
              fontSize: '0.95rem',
              textTransform: 'none',
              minHeight: 48,
            }
          }}
        >
          <Tab icon={<AccountCircleIcon />} label="My Profile" iconPosition="start" />
          <Tab icon={<BookIcon />} label="My Courses" iconPosition="start" />
          <Tab icon={<FactCheckIcon />} label="My Attendance" iconPosition="start" />
          <Tab icon={<AssessmentIcon />} label="My Exams" iconPosition="start" />
          <Tab icon={<GradeIcon />} label="My Results" iconPosition="start" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <Box sx={{ mt: 2 }}>
        {/* Profile Panel */}
        {activeTab === 0 && (
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <CardContent sx={{ p: 4 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={3} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <Avatar sx={{ width: 100, height: 100, bgcolor: 'secondary.main', fontSize: '2.5rem', fontWeight: 700, mb: 2 }}>
                    {profile.first_name.charAt(0)}{profile.last_name.charAt(0)}
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
                    {profile.first_name} {profile.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                    Admission No: {profile.admission_no}
                  </Typography>
                  <Chip label={profile.status} color={profile.status === 'active' ? 'success' : 'default'} size="small" />
                </Grid>
                
                <Grid item xs={12} md={9}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: 'primary.main' }}>
                    Student Profile Details
                  </Typography>
                  <Divider sx={{ mb: 3 }} />
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Email Address</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{profile.email}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Phone Number</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{profile.phone || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Assigned School</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{schoolName}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Gender</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{profile.gender || '-'}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Date of Birth</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>{profile.date_of_birth || '-'}</Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Courses Panel */}
        {activeTab === 1 && (
          <Grid container spacing={3}>
            {enrollments.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info" sx={{ borderRadius: 2 }}>You are not currently enrolled in any courses.</Alert>
              </Grid>
            ) : (
              enrollments.map((enr: any) => (
                <Grid item xs={12} sm={6} md={4} key={enr.id}>
                  <Card sx={{ height: '100%', borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                        <Box sx={{ p: 1, bgcolor: 'primary.light', color: 'primary.main', borderRadius: 1.5, display: 'flex' }}>
                          <BookIcon />
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', fontFamily: 'monospace' }}>
                            {enr.course?.code}
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>
                            {enr.course?.title}
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {enr.course?.description || 'No course description available.'}
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Chip size="small" label={enr.status} color={enr.status === 'active' ? 'success' : 'default'} />
                        <Typography variant="caption" color="text.secondary">
                          Enrolled: {enr.created_at ? new Date(enr.created_at).toLocaleDateString() : '-'}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        )}

        {/* Attendance Panel */}
        {activeTab === 2 && (
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 3, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Attendance Summary</Typography>
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 3 }}>
                  <CircularProgress variant="determinate" value={attendanceRate} size={140} thickness={6} color={attendanceRate >= 90 ? 'success' : attendanceRate >= 75 ? 'warning' : 'error'} />
                  <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 800 }}>{attendanceRate}%</Typography>
                    <Typography variant="caption" color="text.secondary">Present Rate</Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Classes Attended: {presentClasses} / {totalClasses}
                </Typography>
              </Card>
            </Grid>
            <Grid item xs={12} md={8}>
              <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <TableContainer component={Paper} elevation={0}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Course Code</TableCell>
                        <TableCell>Course Title</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Remarks</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {attendances.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>No attendance records found.</TableCell>
                        </TableRow>
                      ) : (
                        attendances.map((att: any) => (
                          <TableRow key={att.id} hover>
                            <TableCell>{att.attendance_date ? new Date(att.attendance_date).toLocaleDateString() : '-'}</TableCell>
                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{att.course?.code}</TableCell>
                            <TableCell>{att.course?.title}</TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={att.status}
                                color={att.status === 'present' ? 'success' : att.status === 'late' ? 'warning' : 'error'}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>{att.remarks || '-'}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Card>
            </Grid>
          </Grid>
        )}

        {/* Exams Panel */}
        {activeTab === 3 && (
          <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Exam Date</TableCell>
                    <TableCell>Course Code</TableCell>
                    <TableCell>Course Title</TableCell>
                    <TableCell>Exam Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Max Marks</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {studentExams.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>No exams scheduled for your courses.</TableCell>
                    </TableRow>
                  ) : (
                    studentExams.map((exam: any) => (
                      <TableRow key={exam.id} hover>
                        <TableCell>{exam.exam_date ? new Date(exam.exam_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 600 }}>{exam.course?.code}</TableCell>
                        <TableCell>{exam.course?.title}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{exam.title}</TableCell>
                        <TableCell>{exam.exam_type}</TableCell>
                        <TableCell>{exam.max_marks}</TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={exam.status}
                            color={exam.status === 'scheduled' ? 'primary' : exam.status === 'completed' ? 'success' : 'default'}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}

        {/* Results Panel */}
        {activeTab === 4 && (
          <Card sx={{ borderRadius: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
            <TableContainer component={Paper} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Exam Date</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Exam Name</TableCell>
                    <TableCell>Marks Obtained</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Result Status</TableCell>
                    <TableCell>Remarks</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>No exam results published yet.</TableCell>
                    </TableRow>
                  ) : (
                    results.map((res: any) => (
                      <TableRow key={res.id} hover>
                        <TableCell>{res.exam?.exam_date ? new Date(res.exam.exam_date).toLocaleDateString() : '-'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, fontFamily: 'monospace' }}>
                            {res.exam?.course?.code}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {res.exam?.course?.title}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{res.exam?.title}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>
                          {res.marks_obtained} / {res.exam?.max_marks || 100}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={res.grade}
                            color={['A+', 'A', 'B+', 'B'].includes(res.grade) ? 'success' : ['C+', 'C'].includes(res.grade) ? 'warning' : 'error'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={res.status}
                            color={res.status === 'passed' ? 'success' : 'error'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{res.remarks || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>
        )}
      </Box>
    </Stack>
  );
}

export function DashboardPage() {
  const user = useAppSelector((state) => state.auth.user);

  if (user?.role === 'STUDENT') {
    return <StudentDashboard />;
  }

  const theme = useTheme();
  const dispatch = useAppDispatch();
  const { metrics, loading } = useAppSelector((state) => state.dashboard);
  const [analytics, setAnalytics] = useState<any>(null);
  const [fetchingCharts, setFetchingCharts] = useState(true);

  const loadDashboardData = async () => {
    dispatch(fetchDashboardSummary());
    try {
      setFetchingCharts(true);
      const chartsData = await dashboardService.getChartData();
      setAnalytics(chartsData);
    } catch (err) {
      console.error('Failed to load charts data', err);
    } finally {
      setFetchingCharts(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [dispatch]);

  if (loading || fetchingCharts || !analytics) {
    return <LoadingScreen />;
  }

  // Charts configurations
  const growthData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        fill: true,
        label: 'Active Students',
        data: analytics.studentGrowth,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.4,
        pointBackgroundColor: '#2563eb',
      },
    ],
  };

  const attendanceData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'],
    datasets: [
      {
        label: 'Attendance %',
        data: analytics.weeklyAttendance,
        borderColor: '#10b981',
        backgroundColor: '#10b981',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const courseData = {
    labels: analytics.courseDistribution.labels,
    datasets: [
      {
        data: analytics.courseDistribution.data,
        backgroundColor: [
          '#3b82f6', // Mathematics
          '#10b981', // Science
          '#f59e0b', // English
          '#ef4444', // History
          '#8b5cf6', // Computer Science
        ],
        borderWidth: 0,
      },
    ],
  };

  const resultsData = {
    labels: analytics.resultsPerformance.grades,
    datasets: [
      {
        label: 'Number of Students',
        data: analytics.resultsPerformance.counts,
        backgroundColor: '#7c3aed',
        borderRadius: 6,
      },
    ],
  };

  const schoolDistData = {
    labels: analytics.schoolDistribution.labels,
    datasets: [
      {
        data: [metrics.totalSchools, Math.max(1, Math.round(metrics.totalSchools * 0.7)), Math.max(1, Math.round(metrics.totalSchools * 0.5))],
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(139, 92, 246, 0.7)',
          'rgba(236, 72, 153, 0.7)',
        ],
        borderWidth: 1,
        borderColor: theme.palette.divider,
      },
    ],
  };

  const statCards = [
    {
      title: 'Total Schools',
      value: metrics.totalSchools,
      icon: <SchoolIcon sx={{ color: '#2563eb' }} />,
      color: '#2563eb',
      change: '+1 new school this month',
      pct: 100,
    },
    {
      title: 'Total Students',
      value: metrics.totalStudents,
      icon: <GroupIcon sx={{ color: '#7c3aed' }} />,
      color: '#7c3aed',
      change: '+12% growth vs last term',
      pct: 78,
    },
    {
      title: 'Total Courses',
      value: metrics.totalCourses,
      icon: <BookIcon sx={{ color: '#06b6d4' }} />,
      color: '#06b6d4',
      change: '5 specialized subjects added',
      pct: 60,
    },
    {
      title: 'Attendance Rate',
      value: `${metrics.attendanceRate}%`,
      icon: <FactCheckIcon sx={{ color: '#10b981' }} />,
      color: '#10b981',
      change: 'Goal: maintains above 95%',
      pct: metrics.attendanceRate,
    },
    {
      title: 'Active Exams',
      value: metrics.totalExams,
      icon: <AssessmentIcon sx={{ color: '#f59e0b' }} />,
      color: '#f59e0b',
      change: 'Next schedule starts in 5 days',
      pct: 45,
    },
    {
      title: 'Total Enrollments',
      value: metrics.totalEnrollments,
      icon: <AssignmentTurnedInIcon sx={{ color: '#ec4899' }} />,
      color: '#ec4899',
      change: 'Active enrollments this semester',
      pct: 82,
    },
  ];

  return (
    <Stack spacing={4} className="fade-in">
      {/* Dashboard Header Banner */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            Analytics Dashboard
          </Typography>
          <Typography color="text.secondary">
            Performance metrics, attendance analytics, and enrollment trends across schools.
          </Typography>
        </Stack>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={loadDashboardData}
          sx={{ borderRadius: '20px', fontWeight: 600 }}
        >
          Refresh Stats
        </Button>
      </Stack>

      {/* Summary Cards Grid */}
      <Grid container spacing={3}>
        {statCards.map((card, i) => (
          <Grid item xs={12} sm={6} md={4} lg={2} key={i}>
            <Card sx={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      bgcolor: `${card.color}15`,
                      p: 1.25,
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {card.icon}
                  </Box>
                  <Chip
                    size="small"
                    label={<Stack direction="row" alignItems="center" gap={0.25}><ArrowUpwardIcon sx={{ fontSize: '0.75rem' }} /> Live</Stack>}
                    color="success"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                  />
                </Stack>

                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {card.title}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, minHeight: 18 }}>
                    {card.change}
                  </Typography>
                </Stack>

                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={card.pct}
                    sx={{
                      height: 4,
                      borderRadius: 2,
                      bgcolor: `${card.color}15`,
                      '& .MuiLinearProgress-bar': {
                        bgcolor: card.color,
                        borderRadius: 2,
                      },
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Analytical Charts Grid */}
      <Grid container spacing={3}>
        {/* Student growth */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Student Growth Trend
                </Typography>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Stack>
              <Box sx={{ height: 300, display: 'flex', alignItems: 'center' }}>
                <Line data={growthData} options={{ responsive: true, maintainAspectRatio: false }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Course distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Course Distribution
                </Typography>
                <IconButton size="small">
                  <MoreVertIcon />
                </IconButton>
              </Stack>
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <Doughnut
                  data={courseData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Weekly attendance */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Weekly Attendance Analytics
              </Typography>
              <Box sx={{ height: 260 }}>
                <Line data={attendanceData} options={{ responsive: true, maintainAspectRatio: false }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Result performance */}
        <Grid item xs={12} md={6} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                Exam Grades Distribution
              </Typography>
              <Box sx={{ height: 260 }}>
                <Bar data={resultsData} options={{ responsive: true, maintainAspectRatio: false }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* School distribution */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                School Types Distribution
              </Typography>
              <Box sx={{ height: 260, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <PolarArea
                  data={schoolDistData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 10 } } },
                    },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Widgets & Lists Grid */}
      <Grid container spacing={3}>
        {/* Recent admitted students */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent Student Admissions
                </Typography>
                <Button size="small" endIcon={<ArrowForwardIcon />} href="/students">
                  View All
                </Button>
              </Stack>
              <Divider />
              <List sx={{ pt: 1 }}>
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'primary.light' }}>JS</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="John Smith"
                    secondary="Adm: ADM-2026-001 • Grade 10"
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.8rem' }}
                  />
                  <Chip size="small" label="Active" color="success" />
                </ListItem>
                <Divider component="li" />
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'secondary.light' }}>ED</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Emily Davis"
                    secondary="Adm: ADM-2026-002 • Grade 11"
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.8rem' }}
                  />
                  <Chip size="small" label="Active" color="success" />
                </ListItem>
                <Divider component="li" />
                <ListItem sx={{ px: 0, py: 1.5 }}>
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: 'warning.light' }}>MW</Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary="Marcus Wong"
                    secondary="Adm: ADM-2026-003 • Grade 12"
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.8rem' }}
                  />
                  <Chip size="small" label="Pending" color="warning" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Exams widget */}
        <Grid item xs={12} md={6} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Upcoming Exams
                </Typography>
                <Button size="small" endIcon={<ArrowForwardIcon />} href="/exams">
                  Schedule
                </Button>
              </Stack>
              <Divider />
              <List sx={{ pt: 1 }}>
                <ListItem sx={{ px: 0, py: 1.5 }} secondaryAction={
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    June 12
                  </Typography>
                }>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CalendarMonthIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Mathematics Final Exam"
                    secondary="Algebra & Geometry • 100 Marks"
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.8rem' }}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem sx={{ px: 0, py: 1.5 }} secondaryAction={
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    June 15
                  </Typography>
                }>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CalendarMonthIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Chemistry Laboratory Quiz"
                    secondary="Organic Compounds • 50 Marks"
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.8rem' }}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem sx={{ px: 0, py: 1.5 }} secondaryAction={
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                    June 18
                  </Typography>
                }>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <CalendarMonthIcon color="action" />
                  </ListItemIcon>
                  <ListItemText
                    primary="English Literature Essay"
                    secondary="Shakespeare Analysis • 80 Marks"
                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                    secondaryTypographyProps={{ fontSize: '0.8rem' }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Latest Results / Activity Feed */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                Recent Attendance & Grades Activity
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Stack spacing={2}>
                <Alert severity="info" sx={{ borderRadius: '8px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Math 101 Class Attendance Logged
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Grade 10 registered • 96% Present rate (24 present, 1 absent)
                  </Typography>
                </Alert>
                <Alert severity="success" sx={{ borderRadius: '8px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Grade Published: Science Midterm
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Average Score: 78.4% • 15 students got A+ grades.
                  </Typography>
                </Alert>
                <Alert severity="warning" sx={{ borderRadius: '8px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Low Attendance Alert: English 202
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Grade 12 attendance dropped to 81.2% this week. Review pending.
                  </Typography>
                </Alert>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Stack>
  );
}
