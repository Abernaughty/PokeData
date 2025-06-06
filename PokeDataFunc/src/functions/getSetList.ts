import { HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function getSetList(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`GetSetList function processed request for url "${request.url}"`);
    
    // Simple response for now - this will be replaced with actual logic
    const responseMessage = {
        message: "GetSetList function working!",
        sets: [
            { id: "sv8", name: "Surging Sparks" },
            { id: "sv7", name: "Stellar Crown" },
            { id: "sv6", name: "Twilight Masquerade" }
        ],
        timestamp: new Date().toISOString()
    };

    return {
        status: 200,
        jsonBody: responseMessage
    };
}
