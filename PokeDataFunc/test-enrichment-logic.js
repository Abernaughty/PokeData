// test-enrichment-logic.js
const testCard = {
    "id": "sv8pt5-155",
    "setCode": "PRE",
    "setId": "sv8pt5",
    "setName": "Prismatic Evolutions",
    "cardId": "sv8pt5-155",
    "cardName": "Espeon ex",
    "cardNumber": "155",
    "rarity": "Special Illustration Rare",
    "imageUrl": "https://images.pokemontcg.io/sv8pt5/155.png",
    "imageUrlHiRes": "https://images.pokemontcg.io/sv8pt5/155_hires.png",
    "tcgPlayerPrice": {
        "market": 344.29,
        "low": 325.5,
        "mid": 375.14,
        "high": 899.95
    }
};

// Test property existence and condition evaluation
console.log("Card object keys:", Object.keys(testCard));
console.log("Has 'pokeDataId' property:", testCard.hasOwnProperty('pokeDataId'));
console.log("pokeDataId value:", testCard.pokeDataId);
console.log("typeof pokeDataId:", typeof testCard.pokeDataId);
console.log("!card.pokeDataId evaluates to:", !testCard.pokeDataId);
console.log("card && !card.pokeDataId evaluates to:", testCard && !testCard.pokeDataId);

// Test with different property states
const cardWithUndefinedProperty = { ...testCard, pokeDataId: undefined };
console.log("\nWith undefined property:");
console.log("Has 'pokeDataId' property:", cardWithUndefinedProperty.hasOwnProperty('pokeDataId'));
console.log("!card.pokeDataId evaluates to:", !cardWithUndefinedProperty.pokeDataId);

const cardWithNullProperty = { ...testCard, pokeDataId: null };
console.log("\nWith null property:");
console.log("Has 'pokeDataId' property:", cardWithNullProperty.hasOwnProperty('pokeDataId'));
console.log("!card.pokeDataId evaluates to:", !cardWithNullProperty.pokeDataId);

// Test the actual condition from the function
function testCondition(card) {
    if (card && !card.pokeDataId) {
        return "Condition is TRUE - enrichment would trigger";
    } else {
        return "Condition is FALSE - enrichment would NOT trigger";
    }
}

console.log("\nTesting condition with original card:", testCondition(testCard));
console.log("Testing condition with undefined property:", testCondition(cardWithUndefinedProperty));
console.log("Testing condition with null property:", testCondition(cardWithNullProperty));

// Test with the actual card object from CosmosDB
const cosmosDbCard = {
    "id": "sv8pt5-155",
    "setCode": "PRE",
    "setId": "sv8pt5",
    "setName": "Prismatic Evolutions",
    "cardId": "sv8pt5-155",
    "cardName": "Espeon ex",
    "cardNumber": "155",
    "rarity": "Special Illustration Rare",
    "imageUrl": "https://images.pokemontcg.io/sv8pt5/155.png",
    "imageUrlHiRes": "https://images.pokemontcg.io/sv8pt5/155_hires.png",
    "tcgPlayerPrice": {
        "market": 344.29,
        "low": 325.5,
        "mid": 375.14,
        "high": 899.95
    },
    "_rid": "WAoyALIZ6AjSBAAAAAAAAA==",
    "_self": "dbs/WAoyAA==/colls/WAoyALIZ6Ag=/docs/WAoyALIZ6AjSBAAAAAAAAA==/",
    "_etag": "\"00006db6-0000-0300-0000-682dc0880000\"",
    "_attachments": "attachments/",
    "_ts": 1747828872
};

console.log("\nTesting with actual CosmosDB card object:");
console.log("Has 'pokeDataId' property:", cosmosDbCard.hasOwnProperty('pokeDataId'));
console.log("card && !card.pokeDataId evaluates to:", cosmosDbCard && !cosmosDbCard.pokeDataId);
console.log("Condition result:", testCondition(cosmosDbCard));

// Test with additional CosmosDB metadata properties
console.log("\nCosmosDB metadata properties:");
console.log("_rid:", cosmosDbCard._rid);
console.log("_self:", cosmosDbCard._self);
console.log("_etag:", cosmosDbCard._etag);
console.log("_attachments:", cosmosDbCard._attachments);
console.log("_ts:", cosmosDbCard._ts);

// Test if any of these properties might be affecting the condition
console.log("\nTesting if CosmosDB metadata affects condition:");
const cardWithoutMetadata = { ...cosmosDbCard };
delete cardWithoutMetadata._rid;
delete cardWithoutMetadata._self;
delete cardWithoutMetadata._etag;
delete cardWithoutMetadata._attachments;
delete cardWithoutMetadata._ts;

console.log("Condition with metadata:", testCondition(cosmosDbCard));
console.log("Condition without metadata:", testCondition(cardWithoutMetadata));
