export default async function (context: any, req: any): Promise<void> {
    context.log('GetCardsBySet function processed a request.');
    
    const setId = req.params.setId;
    
    if (!setId) {
        context.res = {
            status: 400,
            body: { error: "Set ID is required" }
        };
        return;
    }
    
    // Simple response for now - this will be replaced with actual logic
    const responseMessage = {
        message: `GetCardsBySet function working! Set ID: ${setId}`,
        setId: setId,
        timestamp: new Date().toISOString()
    };

    context.res = {
        status: 200,
        body: responseMessage
    };
}
