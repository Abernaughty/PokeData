# Pokemon TCG API & PokeData API Documentation Summary

This document provides a comprehensive overview of the Pokemon TCG API and PokeData API, including their endpoints, parameters, base URLs, authentication methods, response formats, and other important information.

## 1. Pokemon TCG API

### Base Information
- **Base URL**: `https://api.pokemontcg.io/v2/`
- **API Key**: Optional but recommended for higher rate limits (register at [Developer Portal](https://dev.pokemontcg.io/))
- **Authentication**: Include API key in headers as `X-Api-Key: your_api_key_here`
- **Format**: All responses are in JSON format
- **Version**: Currently v2 (v1 was deprecated as of August 1, 2021)

### Rate Limits
- **With API key**: 20,000 requests per day by default (can be increased by contacting support)
- **Without API key**: Limited to 1,000 requests per day and 30 requests per minute
- **IP Restrictions**: None when using API key; IP-based limits apply without a key

### Pagination
- Pagination information is included in the response body (not in headers)
- Response includes `page`, `pageSize`, `count`, and `totalCount` fields
- Default page size appears to be 250 items maximum
- Control pagination with query parameters:
  - `page`: Specifies which page of results to return (1-based)
  - `pageSize`: Specifies how many items per page (max 250)

### Endpoints

#### Cards
1. **Get All Cards**
   - **Endpoint**: `GET /cards`
   - **Description**: Retrieves a paginated list of all cards
   - **Parameters**:
     - `page`: Page number (default: 1)
     - `pageSize`: Items per page (default: 250)
     - `q`: Query string for filtering (see Query Syntax section)
     - `orderBy`: Field to sort by (e.g., `name`, `number`, `set.releaseDate`)
   - **Example**: `https://api.pokemontcg.io/v2/cards?page=1&pageSize=10`

2. **Get Specific Card**
   - **Endpoint**: `GET /cards/{id}`
   - **Description**: Retrieves details for a specific card by its ID
   - **Example**: `https://api.pokemontcg.io/v2/cards/xy7-54`

3. **Search Cards**
   - **Endpoint**: `GET /cards?q={query}`
   - **Description**: Searches for cards based on query parameters
   - **Examples**:
     - `https://api.pokemontcg.io/v2/cards?q=name:charizard`
     - `https://api.pokemontcg.io/v2/cards?q=name:gardevoir (subtypes:mega OR subtypes:vmax)`

#### Sets
1. **Get All Sets**
   - **Endpoint**: `GET /sets`
   - **Description**: Retrieves a list of all sets
   - **Parameters**:
     - `page`: Page number (default: 1)
     - `pageSize`: Items per page (default: 250)
     - `q`: Query string for filtering
     - `orderBy`: Field to sort by
   - **Example**: `https://api.pokemontcg.io/v2/sets`

2. **Get Specific Set**
   - **Endpoint**: `GET /sets/{id}`
   - **Description**: Retrieves details for a specific set by its ID
   - **Example**: `https://api.pokemontcg.io/v2/sets/swsh1`

3. **Search Sets**
   - **Endpoint**: `GET /sets?q={query}`
   - **Description**: Searches for sets based on query parameters
   - **Example**: `https://api.pokemontcg.io/v2/sets?q=name:sword`

#### Other Data Endpoints
1. **Get Types**
   - **Endpoint**: `GET /types`
   - **Description**: Retrieves all Pokemon card types

2. **Get Subtypes**
   - **Endpoint**: `GET /subtypes`
   - **Description**: Retrieves all card subtypes (e.g., Basic, EX, MEGA, etc.)

3. **Get Supertypes**
   - **Endpoint**: `GET /supertypes`
   - **Description**: Retrieves all card supertypes (e.g., Pokémon, Trainer, Energy)

4. **Get Rarities**
   - **Endpoint**: `GET /rarities`
   - **Description**: Retrieves all card rarities

### Query Syntax
The Pokemon TCG API supports a Lucene-like query syntax for advanced filtering:

1. **Basic Field Queries**:
   - `name:charizard` - Search for "charizard" in the name field
   - `name:"charizard v"` - Search for the exact phrase "charizard v"
   - `name:char*` - Wildcard search for names starting with "char"
   - `name:/charizard/` - Exact match for name "charizard" (no other words in field)

2. **Logical Operators**:
   - `types:fire AND subtypes:basic` - Cards that are Fire type AND Basic subtype
   - `subtypes:mega OR subtypes:vmax` - Cards that are either Mega OR VMAX
   - `types:water NOT subtypes:basic` - Water type cards that are NOT Basic

3. **Range Queries**:
   - `hp:[100 TO 200]` - Cards with HP between 100 and 200 (inclusive)
   - `hp:{100 TO 200}` - Cards with HP between 100 and 200 (exclusive)
   - `hp:>=150` - Cards with HP greater than or equal to 150
   - `nationalPokedexNumbers:[1 TO 151]` - Original 151 Pokémon

4. **Nested Field Queries**:
   - `set.id:swsh1` - Cards from the set with ID "swsh1"
   - `legalities.standard:legal` - Cards legal in Standard format
   - `legalities.standard:banned` - Cards banned in Standard format

5. **Sorting**:
   - Use the `orderBy` parameter to sort results
   - Example: `orderBy=name` or `orderBy=set.releaseDate`

### Response Format

#### Card Object Properties
The card object contains detailed information including:
- `id`: Unique identifier for the card (e.g., "xy1-1")
- `name`: Card name
- `supertype`: Card supertype (Pokémon, Trainer, Energy)
- `subtypes`: Array of card subtypes
- `hp`: Hit points (for Pokémon cards)
- `types`: Array of energy types
- `evolvesFrom`: What Pokémon this card evolves from
- `evolvesTo`: Array of Pokémon this card evolves to
- `rules`: Array of rule text for the card
- `abilities`: Array of abilities (name, text, type)
- `attacks`: Array of attacks (name, cost, damage, text)
- `weaknesses`: Array of weaknesses (type, value)
- `resistances`: Array of resistances (type, value)
- `retreatCost`: Array of energy types needed to retreat
- `convertedRetreatCost`: Numeric retreat cost
- `set`: Set information object
- `number`: Card number in the set
- `artist`: Card artist
- `rarity`: Card rarity
- `flavorText`: Flavor text on the card
- `nationalPokedexNumbers`: Array of Pokédex numbers
- `legalities`: Object with format legalities (standard, expanded, unlimited)
- `regulationMark`: Letter on card for tournament legality
- `images`: Object with image URLs (small, large)
- `tcgplayer`: Object with TCGPlayer pricing data (in USD)
- `cardmarket`: Object with Cardmarket pricing data (in EUR)

#### Set Object Properties
The set object contains information such as:
- `id`: Set ID (e.g., "swsh1")
- `name`: Set name
- `series`: Series name
- `printedTotal`: Printed total of cards in set
- `total`: Actual total number of cards
- `legalities`: Object with format legalities
- `ptcgoCode`: Code used in Pokémon TCG Online
- `releaseDate`: Release date of the set
- `updatedAt`: Last update timestamp
- `images`: Object with image URLs (symbol, logo)

### Error Handling
- The API uses standard HTTP response codes for success/failure
- 200 range: Success
- 400 range: Client errors (e.g., invalid parameters)
- 500 range: Server errors
- Error responses include a message field with details

### Developer SDKs
The Pokemon TCG API offers SDK support for multiple programming languages:
- Python
- Ruby
- JavaScript
- C#
- Kotlin
- TypeScript
- PHP
- Go
- Dart
- Elixir

## 2. PokeData API (Pokemon TCG Price API)

### Base Information
- **Base URL**: `https://www.pokedata.io/v0/`
- **Description**: Paid API that provides current and historical price data for Pokemon cards and sealed products
- **Access**: Requires Platinum tier subscription ($20/month or $200/year)
- **Documentation**: Available at [Postman Documentation](https://documenter.getpostman.com/view/16115980/2sA3JF9iWW)
- **Authentication**: Bearer Token (received after subscription)
- **Restriction**: Non-commercial use only by default, must contact for other use cases
- **Cost**: API calls consume credits, with different endpoints costing different amounts

### Subscription Tiers
- **Gold Tier** ($6/month or $60/year):
  - Up to 4 portfolios and lists
  - Unlimited historical data
  - Up to 20 price alerts
  - Population history
  - *Does not include API access*

- **Platinum Tier** ($20/month or $200/year):
  - Everything in Gold tier
  - Unlimited portfolios and lists
  - Custom charts
  - Volume data
  - Personal API access

### Credit System
- Different API endpoints consume different amounts of credits
- Sets/Cards endpoints: 5 credits per call
- Pricing endpoints: 10 credits per call
- Credit allocation and refresh rates are tied to subscription level

### Endpoints

1. **List All Sets**
   - **Endpoint**: `GET /sets`
   - **Description**: Retrieves a list of all available sets
   - **Parameters**:
     - `language` (optional): Filter by language. Valid values are: ENGLISH, JAPANESE
   - **API Cost**: 5 Credits
   - **Example**: `https://www.pokedata.io/v0/sets`

2. **List Cards in Set**
   - **Endpoint**: `GET /set`
   - **Description**: Retrieves all cards in a specific set
   - **Parameters**:
     - `set_id` (required): Numeric ID of the set
   - **API Cost**: 5 Credits
   - **Example**: `https://www.pokedata.io/v0/set?set_id=533`

3. **Get Info and Pricing**
   - **Endpoint**: `GET /pricing`
   - **Description**: Retrieves pricing information for a specific card, product, or masterset
   - **Parameters**:
     - `id` (required): Numeric ID of the card, product, or masterset
     - `asset_type` (required): Type of asset. Valid values are: CARD, PRODUCT, MASTERSET
   - **API Cost**: 10 Credits
   - **Example**: `https://www.pokedata.io/v0/pricing?id=66&asset_type=CARD`

### Response Structures

#### Sets Response
Returns an array of set objects with properties:
- `code`: Set code (can be null)
- `id`: Numeric ID for the set
- `language`: Language of the set (ENGLISH or JAPANESE)
- `name`: Name of the set
- `release_date`: Release date of the set

#### Cards in Set Response
Returns an array of card objects with properties:
- `id`: Numeric ID for the card
- `language`: Language of the card
- `name`: Name of the card
- `num`: Card number within the set
- `release_date`: Release date
- `secret`: Boolean indicating if it's a secret rare
- `set_code`: Code for the set (if available)
- `set_id`: Numeric ID of the set
- `set_name`: Name of the set

#### Pricing Response
Returns a detailed object with:
- Card/product metadata (id, language, name, num)
- `pricing` object containing multiple grading categories:
  - Various grading services and conditions (CGC 1.0 through 10, PSA 1 through 10, Raw, etc.)
  - Each entry includes currency and value

### Card Identification System
- Cards are identified by unique numeric IDs in the system
- Cards must be found by first getting a set's ID, then listing all cards in that set
- There is no direct lookup by set code + card number
- The workflow is typically:
  1. List all sets to find the set ID
  2. List all cards in the set to find the specific card ID
  3. Get pricing using the card ID

### API Limitations
- API calls consume credits from your subscription
- Endpoints have specific credit costs (5 for sets/cards, 10 for pricing)
- Limited to non-commercial use by default (must contact for commercial use)
- No historical price timeline endpoint in current documentation

### Features
- Current and accurate Pokemon card values for various grades
- Pricing data for raw cards and sealed products
- Support for both English and Japanese cards
- Complete set listings with release dates
- Detailed card information with set relationships

### Usage Best Practices
1. Cache set and card IDs to minimize API calls
2. Use the correct asset_type parameter to ensure accurate results
3. Consider implementing rate limiting based on your credit allocation
4. For commercial applications, contact PokeData directly

## 3. Alternative APIs

### TCGdex API
- **Base URL**: `https://api.tcgdex.net/v2/`
- **Features**:
  - Available in 14 languages
  - REST and GraphQL API options
  - No API key required (appears to be free and open source)
  - Supports card and set data

### PokéAPI
- **Base URL**: `https://pokeapi.co/api/v2/`
- **Features**:
  - Free and open-source RESTful API
  - Focuses on Pokémon main game series data (not TCG-specific)
  - No authentication required
  - Extensive documentation

## 4. Resources

- [Pokemon TCG API Documentation](https://docs.pokemontcg.io/)
- [Pokemon TCG Developer Portal](https://pokemontcg.io/)
- [PokeData Website](https://www.pokedata.io/)
- [PokeData API Documentation](https://documenter.getpostman.com/view/16115980/2sA3JF9iWW)
- [TCGdex API Documentation](https://tcgdex.dev/)
- [PokéAPI Documentation](https://pokeapi.co/docs/v2)
