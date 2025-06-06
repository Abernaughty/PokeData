import { app, InvocationContext, Timer } from "@azure/functions";

export async function refreshData(myTimer: Timer, context: InvocationContext): Promise<void> {
    context.log('RefreshData timer function processed a request.');
    
    if (myTimer.isPastDue) {
        context.log('Timer function is running late!');
    }
    
    // Simple logging for now - this will be replaced with actual logic
    context.log('RefreshData function executed at:', new Date().toISOString());
    context.log('Next timer occurrence:', myTimer.scheduleStatus?.next);
}

// Register the function with Azure Functions runtime
app.timer('refreshData', {
    schedule: '0 0 * * *', // Daily at midnight
    handler: refreshData,
});
