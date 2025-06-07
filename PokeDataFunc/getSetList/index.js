module.exports = async function (context, req) {
    context.log('GetSetList function processed a request.');
    
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

    context.res = {
        status: 200,
        body: responseMessage
    };
};
