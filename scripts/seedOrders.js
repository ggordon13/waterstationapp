require("dotenv").config({ path: ".env.local" });

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const db = DynamoDBDocumentClient.from(client);

const names = [
  "Juan Dela Cruz",
  "Maria Santos",
  "Pedro Reyes",
  "Ana Lopez",
  "Carlos Garcia",
  "Liza Tan",
  "Mark Lim",
  "Grace Cruz",
  "Tony Yap",
  "Erik Santos"
];

const tags = ["AREA-A", "AREA-B", "AREA-C", "AREA-D"];

const modes = ["Pick-up", "Delivery"];
const statuses = ["PENDING", "COMPLETED"];

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {

  for (let i = 0; i < 20; i++) {

    const customer = random(names);
    const tag = random(tags);
    const quantity = Math.floor(Math.random() * 5) + 1;

    const mode = random(modes);
    const pricePerUnit = mode === "Pick-up" ? 30 : 35;

    const amount = quantity * pricePerUnit;

    const orderId = Date.now().toString() + Math.random();

    await db.send(
      new PutCommand({
        TableName: "WaterStation",
        Item: {
          pk: "ORDER",
          sk: `ORDER#${orderId}`,

          customer,
          tag,
          quantity,
          mode,
          amount,
          status: random(statuses),

          createdAt: new Date(
            Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
          ).toISOString()
        }
      })
    );

    console.log("Inserted:", customer);
  }

  console.log("Seeding complete 😎");
}

seed();