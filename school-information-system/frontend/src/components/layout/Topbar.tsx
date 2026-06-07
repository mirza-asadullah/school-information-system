import { useState, useEffect, type MouseEvent } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
  useTheme,
  Breadcrumbs,
  Link,
  Dialog,
  DialogContent,
  DialogTitle,
  InputBase,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import SearchIcon from '@mui/icons-material/Search';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import CircleIcon from '@mui/icons-material/Circle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoIcon from '@mui/icons-material/Info';
import BookIcon from '@mui/icons-material/Book';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleTheme } from '../../store/slices/themeSlice';
import { logout } from '../../store/slices/authSlice';
import { ROUTES } from '../../utils/menu';

interface TopbarProps {
  onToggleSidebar: () => void;
  onToggleMobileSidebar: () => void;
  sidebarOpen: boolean;
}

export function Topbar({ onToggleSidebar, onToggleMobileSidebar, sidebarOpen }: TopbarProps) {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Handle Ctrl+K shortcut to search
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleThemeToggle = () => {
    dispatch(toggleTheme());
  };

  const openProfileMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const closeProfileMenu = () => {
    setAnchorEl(null);
  };

  const openNotificationsMenu = (event: MouseEvent<HTMLButtonElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const closeNotificationsMenu = () => {
    setNotificationAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleNavigateTo = (path: string) => {
    navigate(path);
    closeProfileMenu();
  };

  // Generate breadcrumbs from route path
  const pathnames = location.pathname.split('/').filter((x) => x);

  const getBreadcrumbTitle = (path: string) => {
    const map: Record<string, string> = {
      dashboard: 'Dashboard',
      schools: 'Schools',
      students: 'Students',
      courses: 'Courses',
      enrollments: 'Enrollments',
      attendance: 'Attendance',
      exams: 'Exams',
      results: 'Results',
      openeducat: 'OpenEduCat Integration',
      openedx: 'Open edX Integration',
      profile: 'User Profile',
      settings: 'System Settings',
    };
    return map[path] || path.charAt(0).toUpperCase() + path.slice(1);
  };

  // Quick search features
  const searchItems = [
    { title: 'Dashboard', path: ROUTES.dashboard, subtitle: 'View stats and growth' },
    { title: 'Manage Students', path: ROUTES.students, subtitle: 'View, add, edit students' },
    { title: 'Courses Catalogue', path: ROUTES.courses, subtitle: 'Review lessons and subjects' },
    { title: 'Attendance Logs', path: ROUTES.attendance, subtitle: 'Check and mark registers' },
    { title: 'Exams Schedule', path: ROUTES.exams, subtitle: 'View midterm and finals' },
    { title: 'Open edX Setup', path: ROUTES.openedx, subtitle: 'API parameters for LMS integration' },
  ];

  const filteredSearchItems = searchItems.filter(item =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppBar position="fixed" sx={{ zIndex: theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
        {/* Toggle Collapsible Hamburger Actions */}
        <Stack direction="row" spacing={2} alignItems="center">
          {/* Desktop Toggle Button */}
          <IconButton
            color="inherit"
            onClick={onToggleSidebar}
            edge="start"
            sx={{ display: { xs: 'none', md: 'flex' }, mr: 1 }}
          >
            {sidebarOpen ? <MenuOpenIcon /> : <MenuIcon />}
          </IconButton>

          {/* Mobile Drawer Trigger */}
          <IconButton
            color="inherit"
            onClick={onToggleMobileSidebar}
            edge="start"
            sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Dynamic Breadcrumbs */}
          <Breadcrumbs
            aria-label="breadcrumb"
            separator="›"
            sx={{ display: { xs: 'none', sm: 'block' }, color: 'text.secondary' }}
          >
            <Link
              component={RouterLink}
              underline="hover"
              color="text.secondary"
              to={ROUTES.dashboard}
              sx={{ display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: '0.875rem' }}
            >
              SIS
            </Link>
            {pathnames.map((value, index) => {
              const last = index === pathnames.length - 1;
              const to = `/${pathnames.slice(0, index + 1).join('/')}`;

              return last ? (
                <Typography
                  key={to}
                  color="text.primary"
                  sx={{ display: 'flex', alignItems: 'center', fontWeight: 600, fontSize: '0.875rem' }}
                >
                  {getBreadcrumbTitle(value)}
                </Typography>
              ) : (
                <Link
                  component={RouterLink}
                  underline="hover"
                  color="text.secondary"
                  to={to}
                  key={to}
                  sx={{ fontWeight: 500, fontSize: '0.875rem' }}
                >
                  {getBreadcrumbTitle(value)}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Stack>

        {/* Right Nav Items */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Search Trigger Button with Shortcut text */}
          <Stack
            direction="row"
            alignItems="center"
            onClick={() => setSearchOpen(true)}
            sx={{
              bgcolor: theme.palette.mode === 'light' ? '#f1f5f9' : '#0f172a',
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '20px',
              px: 2,
              py: 0.5,
              cursor: 'pointer',
              display: { xs: 'none', md: 'flex' },
              color: 'text.secondary',
              mr: 1,
              width: 180,
              justifyContent: 'space-between',
              transition: 'all 0.2s',
              '&:hover': {
                borderColor: 'primary.light',
                bgcolor: theme.palette.mode === 'light' ? '#e2e8f0' : '#1e293b',
              },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <SearchIcon sx={{ fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                Search...
              </Typography>
            </Stack>
            <Typography
              variant="caption"
              sx={{
                bgcolor: theme.palette.mode === 'light' ? '#e2e8f0' : '#1e293b',
                px: 1,
                py: 0.25,
                borderRadius: '4px',
                fontSize: '0.7rem',
                fontWeight: 700,
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              Ctrl K
            </Typography>
          </Stack>

          {/* Search icon for mobile screen size */}
          <IconButton
            color="inherit"
            onClick={() => setSearchOpen(true)}
            sx={{ display: { xs: 'flex', md: 'none' } }}
          >
            <SearchIcon />
          </IconButton>

          {/* Light / Dark Mode Toggle */}
          <IconButton color="inherit" onClick={handleThemeToggle}>
            {theme.palette.mode === 'dark' ? (
              <Brightness7Icon sx={{ color: 'warning.light' }} />
            ) : (
              <Brightness4Icon sx={{ color: 'text.secondary' }} />
            )}
          </IconButton>

          {/* Notifications area */}
          <IconButton color="inherit" onClick={openNotificationsMenu}>
            <Badge badgeContent={3} color="error" variant="dot">
              <NotificationsIcon sx={{ color: 'text.secondary' }} />
            </Badge>
          </IconButton>

          {/* User Profile dropdown menu button */}
          <Tooltip title="Account profile">
            <IconButton onClick={openProfileMenu} sx={{ p: 0.25, border: `2px solid ${theme.palette.divider}` }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'primary.main',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                }}
              >
                {user?.name?.charAt(0) ?? 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Stack>
      </Toolbar>

      {/* Notifications Popover Dropdown Menu */}
      <Menu
        anchorEl={notificationAnchorEl}
        open={Boolean(notificationAnchorEl)}
        onClose={closeNotificationsMenu}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 320,
            maxHeight: 400,
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
            p: 0,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            System Notifications
          </Typography>
          <Typography variant="caption" color="primary" sx={{ cursor: 'pointer', fontWeight: 600 }}>
            Clear All
          </Typography>
        </Box>
        <Divider />
        <List sx={{ p: 0 }}>
          <ListItemButton onClick={closeNotificationsMenu} sx={{ px: 2, py: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText
              primary="New School Setup Successfully"
              secondary="Lincoln High School registered on server"
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary' }}
            />
          </ListItemButton>
          <Divider />
          <ListItemButton onClick={closeNotificationsMenu} sx={{ px: 2, py: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <BookIcon sx={{ color: 'primary.main', fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText
              primary="Physics Midterm Scheduled"
              secondary="Midterm scheduled for Grade 12 students"
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary' }}
            />
          </ListItemButton>
          <Divider />
          <ListItemButton onClick={closeNotificationsMenu} sx={{ px: 2, py: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 32 }}>
              <InfoIcon sx={{ color: 'warning.main', fontSize: 18 }} />
            </ListItemIcon>
            <ListItemText
              primary="Attendance Review Needed"
              secondary="Math 101 class attendance rate below 85%"
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: '0.75rem', color: 'text.secondary' }}
            />
          </ListItemButton>
        </List>
      </Menu>

      {/* User Profile settings action menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeProfileMenu}
        PaperProps={{
          sx: {
            mt: 1.5,
            width: 220,
            borderRadius: '12px',
            border: `1px solid ${theme.palette.divider}`,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
            {user?.name ?? 'Guest User'}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ fontSize: '0.75rem' }}>
            {user?.email ?? 'guest@example.com'}
          </Typography>
          <Typography
            variant="caption"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 0.5,
              mt: 1,
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              px: 1,
              py: 0.25,
              borderRadius: '4px',
              fontWeight: 700,
              fontSize: '0.65rem',
            }}
          >
            <CircleIcon sx={{ fontSize: 6, color: '#22c55e' }} />
            {user?.role ?? 'GUEST'}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => handleNavigateTo(ROUTES.profile)} sx={{ gap: 1.5, py: 1.25 }}>
          <PersonIcon fontSize="small" sx={{ color: 'text.secondary' }} /> Profile Info
        </MenuItem>
        <MenuItem onClick={() => handleNavigateTo(ROUTES.settings)} sx={{ gap: 1.5, py: 1.25 }}>
          <SettingsIcon fontSize="small" sx={{ color: 'text.secondary' }} /> Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ gap: 1.5, py: 1.25, color: 'error.main' }}>
          <LogoutIcon fontSize="small" /> Logout
        </MenuItem>
      </Menu>

      {/* Modern Search overlay box */}
      <Dialog
        open={searchOpen}
        onClose={() => {
          setSearchOpen(false);
          setSearchQuery('');
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            mt: '10vh',
            top: 0,
            position: 'absolute',
          },
        }}
      >
        <DialogTitle sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <SearchIcon sx={{ color: 'primary.main' }} />
            <InputBase
              placeholder="Search features, students, courses..."
              fullWidth
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ fontSize: '1.1rem' }}
            />
          </Stack>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0, maxHeight: 300, overflowY: 'auto' }}>
          {filteredSearchItems.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No items match your query</Typography>
            </Box>
          ) : (
            <List sx={{ py: 1 }}>
              {filteredSearchItems.map((item) => (
                <ListItem key={item.path} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchQuery('');
                      navigate(item.path);
                    }}
                    sx={{ px: 3, py: 1.5 }}
                  >
                    <ListItemText
                      primary={item.title}
                      secondary={item.subtitle}
                      primaryTypographyProps={{ fontWeight: 600, fontSize: '0.95rem' }}
                      secondaryTypographyProps={{ fontSize: '0.8rem' }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
      </Dialog>
    </AppBar>
  );
}
