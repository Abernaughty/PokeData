module.exports = async function (context, req) {
    context.log('GetCardInfo function processed a request.');
    
    const cardId = req.params.cardId;
    
    if (!cardId) {
        context.res = {
            status: 400,
            body: { error: "Card ID is required" }
        };
        return;
    }
    
    // Simple response for now - this will be replaced with actual logic
    const responseMessage = {
        message: `GetCardInfo function working! Card ID: ${cardId}`,
        cardId: cardId,
        timestamp: new Date().toISOString()
    };

    context.res = {
        status: 200,
        body: responseMessage
    };
};
