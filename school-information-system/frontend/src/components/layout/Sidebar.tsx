import { useState } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import {
  Box,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useTheme,
  Collapse,
  ListSubheader,
  Tooltip,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { ROUTES, navigationGroups, NavigationItem } from '../../utils/menu';
import { useAppSelector } from '../../store/hooks';

const drawerWidth = 280;
const collapsedWidth = 80;

interface SidebarProps {
  open: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ open, mobileOpen, onMobileClose }: SidebarProps) {
  const theme = useTheme();
  const location = useLocation();
  const user = useAppSelector((state) => state.auth.user);

  const isSelected = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const renderItem = (item: NavigationItem, collapsed: boolean) => {
    const active = isSelected(item.path);
    const itemContent = (
      <ListItemButton
        component={RouterLink}
        to={item.path}
        onClick={() => {
          if (mobileOpen) onMobileClose();
        }}
        sx={{
          minHeight: 48,
          justifyContent: collapsed ? 'center' : 'initial',
          px: 2.5,
          py: 1.25,
          mx: 1,
          borderRadius: '10px',
          mb: 0.5,
          color: active ? 'primary.main' : 'text.secondary',
          bgcolor: active 
            ? theme.palette.mode === 'light' ? 'rgba(37, 99, 235, 0.08)' : 'rgba(96, 165, 250, 0.15)'
            : 'transparent',
          '&:hover': {
            bgcolor: active 
              ? theme.palette.mode === 'light' ? 'rgba(37, 99, 235, 0.12)' : 'rgba(96, 165, 250, 0.2)'
              : theme.palette.mode === 'light' ? '#f1f5f9' : '#1e293b',
            color: active ? 'primary.main' : 'text.primary',
            '& .MuiListItemIcon-root': {
              color: active ? 'primary.main' : 'text.primary',
            },
          },
          transition: 'all 0.2s ease-in-out',
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: collapsed ? 'auto' : 2.5,
            justifyContent: 'center',
            color: active ? 'primary.main' : 'text.secondary',
            transition: 'color 0.2s ease-in-out',
          }}
        >
          {item.icon}
        </ListItemIcon>
        {!collapsed && (
          <ListItemText 
            primary={item.title} 
            primaryTypographyProps={{ 
              fontWeight: active ? 600 : 500, 
              fontSize: '0.875rem' 
            }} 
          />
        )}
      </ListItemButton>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.path} title={item.title} placement="right" arrow>
          {itemContent}
        </Tooltip>
      );
    }

    return <React.Fragment key={item.path}>{itemContent}</React.Fragment>;
  };

  const drawerContent = (collapsed: boolean) => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Brand Header */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={collapsed ? 0 : 1.5}
        sx={{
          py: 2.5,
          px: collapsed ? 0 : 3,
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: 64,
        }}
      >
        <Box
          sx={{
            bgcolor: theme.palette.mode === 'light' ? 'primary.main' : 'primary.dark',
            color: '#ffffff',
            p: 1,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)',
          }}
        >
          <SchoolIcon sx={{ fontSize: 24 }} />
        </Box>
        {!collapsed && (
          <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Outfit', letterSpacing: '0.01em' }}>
            Academica<span style={{ color: theme.palette.primary.main }}>SIS</span>
          </Typography>
        )}
      </Stack>
      <Divider sx={{ mx: 2, mb: 2 }} />

      {/* Nav List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', px: 0 }}>
        {navigationGroups.map((group) => {
          // Filter items based on roles if needed. Super admins can see everything.
          const visibleItems = group.items.filter((item) => {
            // Apply role restriction logic
            if (user?.role === 'STUDENT') {
              return ['Dashboard', 'Students', 'Courses', 'Results', 'Profile'].includes(item.title);
            }
            if (user?.role === 'SCHOOL_ADMIN') {
              return item.title !== 'Schools'; // School admins can manage students/courses but not root schools list
            }
            return true; // SUPER_ADMIN
          });

          if (visibleItems.length === 0) return null;

          return (
            <List
              key={group.groupName}
              subheader={
                !collapsed && (
                  <ListSubheader
                    disableSticky
                    sx={{
                      bgcolor: 'transparent',
                      color: 'text.disabled',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                      pl: 3.5,
                      py: 1,
                    }}
                  >
                    {group.groupName}
                  </ListSubheader>
                )
              }
            >
              {visibleItems.map((item) => renderItem(item, collapsed))}
            </List>
          );
        })}
      </Box>

      {/* Profile summary on bottom when expanded */}
      {!collapsed && user && (
        <Box sx={{ p: 2, m: 2, bgcolor: theme.palette.mode === 'light' ? '#f8fafc' : '#0f172a', borderRadius: '12px', border: `1px solid ${theme.palette.divider}` }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '0.875rem',
              }}
            >
              {user.name?.charAt(0) ?? 'A'}
            </Box>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }} noWrap>
                {user.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }} noWrap>
                {user.role?.replace('_', ' ')}
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: open ? drawerWidth : collapsedWidth }, flexShrink: { md: 0 }, transition: theme.transitions.create('width', { duration: theme.transitions.duration.enteringScreen }) }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: drawerWidth },
        }}
      >
        {drawerContent(false)}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : collapsedWidth,
            boxSizing: 'border-box',
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
      >
        {drawerContent(!open)}
      </Drawer>
    </Box>
  );
}
