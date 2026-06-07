import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

export function OpeneducatPage() {
  return (
    <Box>
      <Stack spacing={2}>
        <Typography variant="h4">OpenEduCat Integration</Typography>
        <Typography color="text.secondary">Manage OpenEduCat configurations, sync operations, and integration health status.</Typography>
        <Card>
          <CardContent>
            <Typography variant="body1">This module will support sync history, connection testing, and sync actions for schools, students, courses, and enrollments.</Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
