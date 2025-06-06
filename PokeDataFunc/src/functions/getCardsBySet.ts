import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function getCardsBySet(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`GetCardsBySet function processed request for url "${request.url}"`);
    
    const setId = request.params.setId;
    
    if (!setId) {
        return {
            status: 400,
            jsonBody: { error: "Set ID is required" }
        };
    }
    
    // Simple response for now - this will be replaced with actual logic
    const responseMessage = {
        message: `GetCardsBySet function working! Set ID: ${setId}`,
        setId: setId,
        timestamp: new Date().toISOString()
    };

    return {
        status: 200,
        jsonBody: responseMessage
    };
}
