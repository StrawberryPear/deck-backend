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

function getUid() {
  const moveAroundPattern = [6, 5, 3, 1, 8, 7, 9];
  const uidLength = 12;

  const now = Date.now();
  const trickyDateString = now.toString(36).substring(3);

  var randomString = ((36 * Math.random()).toString(36) + (36 * Math.random()).toString(36)).replace(/\./g, '').substring(0, uidLength);

  for (const dateStringIndex in trickyDateString) {
    randomString[moveAroundPattern[dateStringIndex]] = trickyDateString[dateStringIndex];
  }

  return randomString;
};

// sharedDeck - GET
async function getSharedDeck(params, callback) {
  const getCommand = new GetCommand({
    TableName: SHARED_DECKS_TABLE_NAME,
    Key: {
      id: params.id
    }
  });

  const getResult = await docClient.send(getCommand);

  if (!getResult.Item) {
    if (callback) callback(null, {
      statusCode: 404
    });
    return;
  }

  if (callback) {
    callback(null, { statusCode: 200, body: getResult.Item.deck });
  }

  const parsed = JSON.parse(getResult.Item.deck);

  return parsed;
};

// sharedDeck - POST
// params: JSON -> {  }
async function postStoreSharedDeck(params, callback) {
  const maxLengthBody = 1024 * 128;

  if (params.body.length > maxLengthBody) {
    callback({ statusCode: 400 });
    return false;
  }

  // take the deck, validate that it is a deck, pop it into the database
  try {
    var deckParam = JSON.parse(params.body);
    
    // check if they're valid
    if (!Array.isArray(deckParam.deck)) {
      throw false;
    }
  } catch (e) {
    callback({ statusCode: 400 });
    return;
  }

  const putItemId = getUid();
  const putCommand = new PutCommand({
    TableName: SHARED_DECKS_TABLE_NAME,
    Item: {
      id: putItemId,
      deck: deckParam
    }
  });

  try {
    await docClient.send(putCommand);
  } catch (err) {
    console.error(err);
    callback(null, { statusCode: 500, body: err.message })
    return;
  }

  callback(null, { statusCode: 200, body: { id: putItemId} });
};

// sharedCards - GET
async function getSharedCards(params, callback) {
  const requestedCardUids = params.cards;
  const sharedDeck = await getSharedDeck(params);

  if (!sharedDeck) {
    if (callback) {
      callback(null, {
        statusCode: 404
      });
    }
    return false;
  }

  const sharedDeckParsed = JSON.parse(sharedDeck.deck);
  const sharedCards = sharedDeckParsed
    .map(card => {
      const upgrades = card.upgrades || [];

      return [{uid: card.uid}, ...upgrades];
    })
    .flat()
    .map(card => card.uid);

  const sharedCardSet = new Set(sharedCards);
  const requestedCardSet = new Set(requestedCardUids);

  if (requestedCardSet.difference(sharedCardSet).size != 0) {
    if (callback) {
      callback(null, {
        statusCode: 400
      });
    }
  }

  const keyCardUids = requestedCardUids.map(cardUid => ({
    id: cardUid
  }));

  const getBatchCommand = new BatchGetCommand({
    RequestItems: {
      [CARDS_TABLE_NAME]: {
        Keys: [
          ...keyCardUids
        ]
      }
    }
  });

  const getBatchResult = await docClient.send(getBatchCommand);

  const cardResults = getBatchResult.Responses[CARDS_TABLE_NAME];

  if (!cardResults?.length) {
    callback(null, {
      statusCode: 404
    });
    return;
  }

  const bodyData = JSON.stringify(cardResults);

  callback(null, { statusCode: 200, body: bodyData });
};

// storeDeck - POST
async function postStoreDeck(params, callback) {
  const maxLengthBody = 1024 * 128;

  if (params.body.length > maxLengthBody) {
    callback({ statusCode: 400 });
    return false;
  }

  // take the deck, validate that it is a deck, pop it into the database
  try {
    var deckParam = JSON.parse(params.body);
    
    // check if they're valid
    if (!Array.isArray(deckParam.deck)) {
      throw false;
    }
  } catch (e) {
    callback({ statusCode: 400 });
    return;
  }

  const putItemId = getUid();
  const putCommand = new PutCommand({
    TableName: SAVED_DECKS_TABLE_NAME,
    Item: {
      id: putItemId,
      deck: deckParam
    }
  });

  try {
    await docClient.send(putCommand);
  } catch (err) {
    console.error(err);
    callback(null, { statusCode: 500, body: err.message })
    return;
  }

  callback(null, { statusCode: 200, body: { id: putItemId} });
};

// uploadCards - POST
async function postUploadCards(params, callback) {
  // check if it has the password
  if (params.password != PASSWORD) {
    if (callback) {
      return {
        statusCode: 200
      };
    }
  }

  const putItemId = params.uid;
  const putItemImage = params.image;

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
    callback(null, { statusCode: 500, body: err.message })
    return;
  }
  callback(null, { statusCode: 200, body: { id: putItemId} });
};

export function handler(event, context, callback) {
  const path = event.path;
  const method = event.httpMethod;

  const queryParams = event.queryStringParameters;
  const body = JSON.parse(event.body);

  const params = {...queryParams, ...body};

  console.log(`path: ${path}`);
  console.log(`params: ${JSON.stringify(params)}`);

  switch (path) {
    case "/sharedDeck":
      if (method === "GET") {
        return getSharedDeck(params, callback);
      } else if (method === "POST") {
        return postStoreSharedDeck(params, callback);
      }
      break;
    case "/sharedCards":
      return getSharedCards(params, callback);
      break;
    case "/storeDeck":
      return postStoreDeck(params, callback);
    case "/uploadCards":
      return postUploadCards(params, callback);
    default:
      callback(null, {
        statusCode: 404,
        body: "Not Found"
      });
  };

  return true;
}