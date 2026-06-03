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

const customers = [
  { name: "Juan Dela Cruz", address: "Blk 1 Lot 3 Palsahingin", tag: "AREA-A" },
  { name: "Maria Santos", address: "Zone 2 Mabini St", tag: "AREA-B" },
  { name: "Pedro Reyes", address: "Villa Rosario Subd", tag: "AREA-C" },
  { name: "Ana Lopez", address: "San Pedro Street", tag: "AREA-D" },
  { name: "Carlos Garcia", address: "Sunflower Village", tag: "AREA-A" },
  { name: "Liza Tan", address: "Green Meadows", tag: "AREA-B" },
  { name: "Mark Lim", address: "Purok 5 Riverside", tag: "AREA-C" },
  { name: "Grace Cruz", address: "Golden Homes", tag: "AREA-D" },
  { name: "Tony Yap", address: "Southville 3", tag: "AREA-A" },
  { name: "Erik Santos", address: "Palm Residences", tag: "AREA-B" }
];

async function seed() {

  for (let i = 0; i < customers.length; i++) {

    const customer = customers[i];

    await db.send(
      new PutCommand({
        TableName: "WaterStationCustomers",
        Item: {
          customerId: `CUS-${(i + 1).toString().padStart(3, "0")}`,
          name: customer.name,
          address: customer.address,
          tag: customer.tag,
          createdAt: new Date().toISOString()
        }
      })
    );

    console.log("Inserted:", customer.name);
  }

  console.log("Customer seeding complete 😎");
}

seed();