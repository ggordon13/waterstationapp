import { NextResponse } from "next/server";
import { ScanCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "@/lib/dynamodb";

export async function GET() {
  try {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: "WaterStationCustomers"
      })
    );

    return NextResponse.json(result.Items || []);
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();

    const { name, address, tag } = body;
    if (!name || !address || !tag) {
      return NextResponse.json(
        { error: "Name, address, and tag are required." },
        { status: 400 }
      );
    }

    const customerId = `CUS-${Date.now().toString()}`;

    const newCustomer = {
      customerId,
      name,
      address,
      tag,
      createdAt: new Date().toISOString(),
    };

    await dynamo.send(
      new PutCommand({
        TableName: "WaterStationCustomers",
        Item: newCustomer,
      })
    );

    return NextResponse.json({ success: true, customer: newCustomer });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to add customer" },
      { status: 500 }
    );
  }
}
