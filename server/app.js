import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, BatchGetCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";

const CARDS_TABLE_NAME = "DecksCards";
const SAVED_DECKS_TABLE_NAME = "DecksSavedDecks";
const SHARED_DECKS_TABLE_NAME = "DecksSharedDecks";

const PASSWORD = "StrawberryPear";

const dynamoDbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoDbClient);

/*/ all the apis
  /sharedDeck - GET/POST
  /sharedCards - GET
  /storeDeck - POST
  /uploadCards - POST
/*/
function replaceCharacterAt(str, index, replacement) {
  return str.substring(0, index) + replacement + str.substring(index + replacement.length);
}

function getUid() {
  const moveAroundPattern = [6, 5, 3, 1, 8, 7, 9];
  const uidLength = 12;

  const now = Date.now();
  const trickyDateString = now.toString(36).substring(3);

  var randomString = ((36 * Math.random()).toString(36) + (36 * Math.random()).toString(36)).replace(/\./g, '').substring(0, uidLength);

  for (const dateStringIndex in trickyDateString) {
    randomString = replaceCharacterAt(randomString, moveAroundPattern[dateStringIndex], trickyDateString[dateStringIndex]);
  }

  return randomString;
};

// sharedDeck - GET
async function getSharedDeck(params, response) {
  const getCommand = new GetCommand({
    TableName: SHARED_DECKS_TABLE_NAME,
    Key: {
      id: params.id
    }
  });

  const getResult = await docClient.send(getCommand);

  if (!getResult.Item) {
    if (response) response({
      statusCode: 404
    });
    return;
  }

  if (response) {
    response({ statusCode: 200, body: JSON.stringify(getResult.Item.deck) });
  }

  const parsed = JSON.parse(getResult.Item.deck);

  return parsed;
};

// sharedDeck - POST
// params: JSON -> {  }
async function postStoreSharedDeck(params, response) {
  const maxLengthBody = 1024 * 128;

  if (params.deck.length > maxLengthBody) {
    response({ statusCode: 400 });
    return false;
  }

  // take the deck, validate that it is a deck, pop it into the database
  try {
    var deckJson = JSON.parse(params.deck);
    
    // check if they're valid
    if (!Array.isArray(deckJson)) {
      throw false;
    }
  } catch (e) {
    response({ statusCode: 400 });
    return;
  }

  const putItemId = getUid();
  const putCommand = new PutCommand({
    TableName: SHARED_DECKS_TABLE_NAME,
    Item: {
      id: putItemId,
      deckName: params.deckName,
      deck: params.deck
    }
  });

  try {
    await docClient.send(putCommand);
  } catch (err) {
    console.error(err);
    response({ statusCode: 500, body: err.message })
    return;
  }

  try {
    // now lets check if all those cards exist
    const batchGetCommand = new BatchGetCommand({
      RequestItems: {
        [CARDS_TABLE_NAME]: {
          Keys: deckJson.map(card => ({ id: card.uid })),
          ProjectionExpression: "id"
        }
      }
    });

    const batchGetResult = await docClient.send(batchGetCommand);
    const inDatabaseCardIds = new Set(batchGetResult.Responses[CARDS_TABLE_NAME].map(card => card.id));
    const deckCardIds = new Set(getAllCardsIdsInDeck(deckJson));

    const cardIdsNotInDatabase = deckCardIds.difference(inDatabaseCardIds);

    if (cardIdsNotInDatabase.size != 0) {
      // still send a 200, but we need to get the rest of the cards
      response({ statusCode: 200, body: JSON.stringify({ id: putItemId, uploadCards: Array.from(cardIdsNotInDatabase) }) });
    }
  } catch (err) {

  }

  response({ statusCode: 200, body: JSON.stringify({ id: putItemId}) });
};

function getAllCardsIdsInDeck(deck) {
  return deck
    .map(card => {
      const upgrades = card.upgrades || [];

      return [{uid: card.uid}, ...upgrades];
    })
    .flat()
    .map(card => card.uid);
};

// sharedCards - GET
async function getSharedCards(params, response) {
  const requestedCardUids = params.cards;
  const sharedDeck = await getSharedDeck(params);

  if (!sharedDeck) {
    if (response) {
      response({ statusCode: 404 });
    }
    return false;
  }

  const sharedDeckParsed = JSON.parse(sharedDeck.deck);
  const sharedCards = getAllCardsIdsInDeck(sharedDeckParsed);

  const sharedCardSet = new Set(sharedCards);
  const requestedCardSet = new Set(requestedCardUids);

  if (requestedCardSet.difference(sharedCardSet).size != 0) {
    if (response) {
      response({ statusCode: 400 });
    }
  }

  const keyCardUids = requestedCardUids.map(cardUid => ({
    id: cardUid
  }));

  const getBatchCommand = new BatchGetCommand({
    RequestItems: {
      [CARDS_TABLE_NAME]: {
        Keys: keyCardUids
      }
    }
  });

  const getBatchResult = await docClient.send(getBatchCommand);

  const cardResults = getBatchResult.Responses[CARDS_TABLE_NAME];

  if (!cardResults?.length) {
    response({ statusCode: 404 });
    return;
  }

  const bodyData = JSON.stringify(cardResults);

  response({ statusCode: 200, body: bodyData });
};

// storeDeck - POST
async function postStoreDeck(params, response) {
  const maxLengthBody = 1024 * 128;

  if (params.deck.length > maxLengthBody) {
    response({ statusCode: 400 });
    return false;
  }

  // take the deck, validate that it is a deck, pop it into the database
  try {
    var deckParam = JSON.parse(params.deck);
    
    // check if they're valid
    if (!Array.isArray(deckParam)) {
      throw false;
    }
  } catch (e) {
    response({ statusCode: 400 });
    return;
  }

  const putItemId = getUid();
  const putCommand = new PutCommand({
    TableName: SAVED_DECKS_TABLE_NAME,
    Item: {
      id: putItemId,
      deckName: params.deckName,
      deck: deckParam
    }
  });

  try {
    await docClient.send(putCommand);
  } catch (err) {
    console.error(err);
    response({ statusCode: 500, body: err.message })
    return;
  }

  response({ statusCode: 200, body: JSON.stringify({ id: putItemId}) });
};

// uploadCards - POST
async function postUploadCards(params, response) {
  // check if we have the card
  const getCommand = new GetCommand({
    TableName: CARDS_TABLE_NAME,
    Key: {
      id: params.uid
    }
  });
  const getItemResult = await docClient.send(getCommand);

  // check if it has the password, only the password can override the database cards
  if (getItemResult.Item && params.password != PASSWORD) {
    if (response) {
      return {
        statusCode: 200
      };
    }
  }

  const putItemId = params.uid;
  const putItemImage = params.image;

  console.log(`Attempting to Put, ${putItemId}, at length, ${putItemImage.length}`);

  const putCommand = new PutCommand({
    TableName: CARDS_TABLE_NAME,
    Item: {
      id: putItemId,
      image: putItemImage
    }
  });

  try {
    await docClient.send(putCommand);
  } catch (err) {
    console.error(err);
    response({ statusCode: 500, body: err.message })
    return;
  }
  response({ statusCode: 200, body: JSON.stringify({ id: putItemId}) });
};

export function handler(event, context, callback) {
  const path = event.path;
  const method = event.httpMethod;

  const queryParams = event.queryStringParameters;
  const body = JSON.parse(event.body);

  const params = {...queryParams, ...body};

  const imageLessParams = {...params, image: (params.image ?? "").length}

  console.log(`path: ${path}`);
  console.log(`params: ${JSON.stringify(imageLessParams)}`);

  const response = (responseObject) => {
    callback(null, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, PUT, DELETE',
      ...responseObject
    });
  }

  switch (path) {
    case "/sharedDeck":
      if (method === "GET") {
        return getSharedDeck(params, response);
      } else if (method === "POST") {
        return postStoreSharedDeck(params, response);
      }
      break;
    case "/sharedCards":
      return getSharedCards(params, response);
      break;
    case "/storeDeck":
      return postStoreDeck(params, response);
    case "/uploadCards":
      return postUploadCards(params, response);
    default:
      response({
        statusCode: 404,
        body: "Not Found"
      });
  };

  return true;
}