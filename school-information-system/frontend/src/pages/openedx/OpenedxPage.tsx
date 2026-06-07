import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

export function OpenedxPage() {
  return (
    <Box>
      <Stack spacing={2}>
        <Typography variant="h4">Open edX Integration</Typography>
        <Typography color="text.secondary">Configure Open edX sync tasks, learner syncing, and course distribution workflows.</Typography>
        <Card>
          <CardContent>
            <Typography variant="body1">This integration module will expose course creation, learner sync, and enrollment synchronization dashboards.</Typography>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
}
