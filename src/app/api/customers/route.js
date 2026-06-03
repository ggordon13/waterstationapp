import { NextResponse } from "next/server";
import { ScanCommand, PutCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
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

export async function PUT(request) {
  try {
    const body = await request.json();
    const { customerId, name, address, tag } = body;

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required." }, { status: 400 });
    }

    const updateExpressionParts = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (name !== undefined) {
      updateExpressionParts.push("#name = :name");
      expressionAttributeNames["#name"] = "name";
      expressionAttributeValues[":name"] = name;
    }
    if (address !== undefined) {
      updateExpressionParts.push("#address = :address");
      expressionAttributeNames["#address"] = "address";
      expressionAttributeValues[":address"] = address;
    }
    if (tag !== undefined) {
      updateExpressionParts.push("#tag = :tag");
      expressionAttributeNames["#tag"] = "tag";
      expressionAttributeValues[":tag"] = tag;
    }

    if (updateExpressionParts.length === 0) {
      return NextResponse.json({ success: true });
    }

    await dynamo.send(
      new UpdateCommand({
        TableName: "WaterStationCustomers",
        Key: { customerId },
        UpdateExpression: `SET ${updateExpressionParts.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to update customer" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required." }, { status: 400 });
    }

    await dynamo.send(
      new DeleteCommand({
        TableName: "WaterStationCustomers",
        Key: { customerId },
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to delete customer" },
      { status: 500 }
    );
  }
}
