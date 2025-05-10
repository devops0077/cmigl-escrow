# Withdrawal Recovery System Documentation

## Overview

The Withdrawal Recovery System is designed to handle interrupted withdrawal processes and ensure that funds are not lost when users experience disconnections, page refreshes, or other interruptions during the withdrawal process. This system consists of:

1. A background job that periodically checks for "stuck" withdrawals
2. Client-side recovery mechanisms to resume interrupted withdrawals
3. Automatic refund processes for failed or long-pending withdrawals
4. Comprehensive logging and monitoring

## System Components

### 1. Background Recovery Job

The core of the recovery system is a scheduled task that runs at regular intervals to identify and process stuck withdrawals. This is implemented in `lib/cron/withdrawal-recovery.ts`.

#### Key Functions:

- `recoverStuckWithdrawals()`: Main entry point that identifies and processes stuck withdrawals
- `findStuckWithdrawals()`: Queries the database for withdrawals that have been pending for too long
- `processStuckWithdrawal()`: Handles individual stuck withdrawals by checking their status with Paystack
- `refundWithdrawal()`: Returns funds to the user's wallet when a withdrawal fails or times out

### 2. API Endpoints

The system exposes API endpoints to trigger the recovery process:

- `/api/cron/withdrawal-recovery`: Dedicated endpoint for the withdrawal recovery job
- `/api/cron/run-all`: Endpoint to run all scheduled tasks, including withdrawal recovery

These endpoints are secured with a secret key to prevent unauthorized access.

### 3. Client-Side Recovery

The client-side component (`components/wallet/withdraw-modal.tsx`) includes mechanisms to:

- Save withdrawal references to localStorage to recover from page refreshes
- Automatically resume monitoring of pending withdrawals when the user returns
- Provide manual refresh options for users to check withdrawal status
- Display clear status information to users

## Configuration

The system uses several configuration parameters that can be adjusted based on your requirements:

- `PENDING_THRESHOLD_HOURS` (default: 2): Time in hours after which a pending withdrawal is considered "stuck"
- `MAX_RETRY_COUNT` (default: 3): Maximum number of retry attempts before auto-refunding
- `AUTO_REFUND_THRESHOLD_HOURS` (default: 24): Time in hours after which a pending withdrawal is automatically refunded

These parameters can be adjusted in `lib/cron/withdrawal-recovery.ts`.

## Security Considerations

The system implements several security measures:

1. API endpoints are protected with a secret key (`CRON_SECRET`)
2. Sensitive data like account numbers are masked in logs
3. All operations are logged for audit purposes
4. Transactions use database transactions to ensure data consistency

## Deployment and Scheduling

### Setting Up the Cron Job

To deploy the recovery system, you need to set up a scheduled task to call the API endpoints at regular intervals. This can be done using:

1. **Vercel Cron Jobs**: If deploying on Vercel, use their built-in cron job functionality:

\`\`\`json
// vercel.json
{
"crons": [
{
"path": "/api/cron/withdrawal-recovery",
"schedule": "0 */1 * * *" // Run every hour
}
]
}
\`\`\`

2. **External Cron Service**: Use a service like Upstash, Cronitor, or EasyCron to make HTTP requests to your API endpoints.

3. **Self-hosted Server**: If you have a dedicated server, set up a traditional cron job:

\`\`\`bash

# Run every hour

0 _/1 _ \* \* curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/cron/withdrawal-recovery
\`\`\`

### Environment Variables

The system requires the following environment variables:

- `CRON_SECRET`: Secret key to authenticate cron job requests
- `PAYSTACK_SECRET_KEY`: Your Paystack secret key for API access
- `DATABASE_URL`: Connection string for your database

## Monitoring and Maintenance

### Logs

The system logs all operations using the application's logging system. Important events to monitor include:

- Stuck withdrawals being detected
- Successful recovery operations
- Failed recovery attempts
- Automatic refunds

### Health Checks

Regularly verify that:

1. The cron job is running as scheduled
2. Stuck withdrawals are being processed
3. Users are receiving refunds when appropriate

### Troubleshooting

Common issues and solutions:

1. **Cron job not running**: Verify your cron configuration and check that the `CRON_SECRET` is correctly set.
2. **Withdrawals not being recovered**: Check logs for errors in the recovery process and verify Paystack API connectivity.
3. **Duplicate refunds**: This shouldn't happen due to the transaction status checks, but if it does, review the transaction logs.

## Future Improvements

Potential enhancements to consider:

1. Implement a dashboard for monitoring stuck withdrawals
2. Add notification system to alert users about refunds
3. Implement more sophisticated retry strategies with exponential backoff
4. Add support for manual intervention for complex cases
5. Integrate with a monitoring service for real-time alerts

## Conclusion

The Withdrawal Recovery System provides a robust solution to ensure that user funds are not lost during the withdrawal process. By automatically detecting and resolving stuck withdrawals, it improves the reliability of the payment system and enhances user trust.
