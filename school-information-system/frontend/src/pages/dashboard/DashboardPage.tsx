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
  ListItemText,
  Avatar,
  Chip,
  IconButton,
  Button,
  useTheme,
  Alert,
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
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchDashboardSummary } from '../../store/slices/dashboardSlice';
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

export function DashboardPage() {
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
