# Water Station Database Context

## DynamoDB Tables

---

# Table: WaterStation

Stores customer orders.

## Keys

Partition Key:
- pk

Sort Key:
- sk

## Order Item Example

```json
{
  "pk": "ORDER",
  "sk": "ORDER#123",

  "customer": "Juan Dela Cruz",
  "address": "Blk 1 Lot 3",
  "tag": "AREA-A",

  "quantity": 3,
  "mode": "DELIVERY",
  "amount": 105,

  "status": "PENDING",

  "createdAt": "2026-05-21T10:00:00Z"
}
```

---

# Table: WaterStationCustomers

Stores static customer information.

## Keys

Partition Key:
- customerId

## Customer Example

```json
{
  "customerId": "CUS-001",
  "name": "Juan Dela Cruz",
  "address": "Blk 1 Lot 3",
  "tag": "AREA-A",
  "createdAt": "2026-05-21T10:00:00Z"
}
```

---

# Business Rules

- Pickup = ₱30 per container
- Delivery = ₱35 per container
- Quantity range = 1–5
- Status = PENDING or COMPLETED
- Tags represent grouped delivery areas