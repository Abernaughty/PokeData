import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function getCardInfo(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`GetCardInfo function processed request for url "${request.url}"`);
    
    const cardId = request.params.cardId;
    
    if (!cardId) {
        return {
            status: 400,
            jsonBody: { error: "Card ID is required" }
        };
    }
    
    // Simple response for now - this will be replaced with actual logic
    const responseMessage = {
        message: `GetCardInfo function working! Card ID: ${cardId}`,
        cardId: cardId,
        timestamp: new Date().toISOString()
    };

    return {
        status: 200,
        jsonBody: responseMessage
    };
}
