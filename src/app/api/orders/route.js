import { NextResponse } from "next/server";
import { PutCommand, QueryCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { dynamo } from "@/lib/dynamodb";

function computeAmount(mode, quantity) {
  const qty = Number(quantity) || 0;
  return (mode === "DELIVERY" ? 35 : 30) * qty;
}

export async function GET() {
  try {
    const result = await dynamo.send(
      new ScanCommand({
        TableName: "WaterStation"
      })
    );

    const orders = (result.Items || [])
      .filter(item => item.pk === "ORDER")
      .map(item => ({
        id: item.sk,
        customer: item.customer,
        address: item.address,
        quantity: item.quantity,
        amount: item.amount,
        mode: item.mode,
        tag: item.tag,
        status: item.status,
        mop: item.mop || item.MOP || item.modeOfPayment,
        completedAt: item.completedAt,
        createdAt: item.createdAt,
        deliveredBy: item.deliveredBy,
        date: item.createdAt
      }));

    return NextResponse.json(orders);
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const orderId = Date.now().toString();

    await dynamo.send(
      new PutCommand({
        TableName: "WaterStation",
        Item: {
          pk: "ORDER",
          sk: `ORDER#${orderId}`,
          customer: body.customer,
          address: body.address,
          quantity: Number(body.quantity),
          amount: Number(body.amount),
          mode: body.mode || "PICKUP",
          tag: body.tag || "UNASSIGNED",
          status: body.status || "PENDING",
            mop: body.mop || body.MOP || body.modeOfPayment || null,
            createdAt: new Date().toISOString(),
            completedAt: body.status === "COMPLETED" ? new Date().toISOString() : undefined
        }
      })
    );

    return NextResponse.json({ success: true, orderId });
  } catch (err) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
  try {
    const body = await req.json();
    const { id, customer, address, quantity, amount, mode, tag, status, mop, deliveredBy } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const pk = "ORDER";
    const sk = id;

    const updateExpressionParts = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    const finalMode = mode;
    const finalQuantity = quantity !== undefined ? Number(quantity) : undefined;
    const finalAmount = amount !== undefined ? Number(amount) : (finalMode !== undefined && finalQuantity !== undefined ? computeAmount(finalMode, finalQuantity) : undefined);

    if (customer !== undefined) {
      updateExpressionParts.push("#c = :c");
      expressionAttributeNames["#c"] = "customer";
      expressionAttributeValues[":c"] = customer;
    }
    if (address !== undefined) {
      updateExpressionParts.push("#a = :a");
      expressionAttributeNames["#a"] = "address";
      expressionAttributeValues[":a"] = address;
    }
    if (finalQuantity !== undefined) {
      updateExpressionParts.push("#q = :q");
      expressionAttributeNames["#q"] = "quantity";
      expressionAttributeValues[":q"] = finalQuantity;
    }
    if (finalAmount !== undefined) {
      updateExpressionParts.push("#amt = :amt");
      expressionAttributeNames["#amt"] = "amount";
      expressionAttributeValues[":amt"] = finalAmount;
    }
    if (finalMode !== undefined) {
      updateExpressionParts.push("#m = :m");
      expressionAttributeNames["#m"] = "mode";
      expressionAttributeValues[":m"] = finalMode;
    }
    if (tag !== undefined) {
      updateExpressionParts.push("#t = :t");
      expressionAttributeNames["#t"] = "tag";
      expressionAttributeValues[":t"] = tag;
    }
    if (mop !== undefined) {
      updateExpressionParts.push("#mop = :mop");
      expressionAttributeNames["#mop"] = "mop";
      expressionAttributeValues[":mop"] = mop;
    }
    if (deliveredBy !== undefined) {
      if (deliveredBy === "" || deliveredBy === null) {
        updateExpressionParts.push("REMOVE deliveredBy");
      } else {
        updateExpressionParts.push("#deliveredBy = :deliveredBy");
        expressionAttributeNames["#deliveredBy"] = "deliveredBy";
        expressionAttributeValues[":deliveredBy"] = deliveredBy;
      }
    }
    // status and completedAt handling
    if (status !== undefined) {
      updateExpressionParts.push("#s = :s");
      expressionAttributeNames["#s"] = "status";
      expressionAttributeValues[":s"] = status;
      if (status === "COMPLETED") {
        updateExpressionParts.push("#completedAt = :completedAt");
        expressionAttributeNames["#completedAt"] = "completedAt";
        expressionAttributeValues[":completedAt"] = new Date().toISOString();
      } else {
        updateExpressionParts.push("REMOVE completedAt");
      }
    }

    let params;
    if (updateExpressionParts.length === 0) {
      return NextResponse.json({ success: true });
    }

    const removeParts = updateExpressionParts
      .filter((p) => p.startsWith("REMOVE "))
      .map((p) => p.replace(/^REMOVE /, ""));
    const setParts = updateExpressionParts.filter((p) => !p.startsWith("REMOVE "));
    let updateExpression = "";

    if (setParts.length > 0) {
      updateExpression += `SET ${setParts.join(", ")}`;
    }
    if (removeParts.length > 0) {
      updateExpression += `${updateExpression ? " " : ""}REMOVE ${removeParts.join(", ")}`;
    }

    params = {
      TableName: "WaterStation",
      Key: { pk, sk },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: Object.keys(expressionAttributeNames).length ? expressionAttributeNames : undefined,
      ExpressionAttributeValues: Object.keys(expressionAttributeValues).length ? expressionAttributeValues : undefined,
      ReturnValues: "ALL_NEW"
    };

    await dynamo.send(new UpdateCommand(params));

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json();
    const { id } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await dynamo.send(
      new DeleteCommand({
        TableName: "WaterStation",
        Key: { pk: "ORDER", sk: id }
      })
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}