# Data Model

This document describes the core data model used in Redtail's verification layer.
It corresponds to the slimmed Prisma schema in `prisma/schema.prisma`.

## Entity overview

```
Record
  ├── RecordEvent[]        (append-only event log)
  │   └── RecordMedia[]    (media attached to a specific event)
  ├── RecordMedia[]        (media attached directly to the record)
  ├── RecordFieldValue[]   (structured metadata fields)
  └── CategoryDefinition
      ├── FieldDefinition[]
      └── CategoryEventType[]
```

## Record

The central entity. Represents a single physical asset (artwork, collectible, luxury good, cultural object).

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (CUID) | Primary key. |
| `title` | string | Human-readable title of the asset. |
| `category` | string | Legacy category string. |
| `categoryId` | string (FK) | Reference to `CategoryDefinition`. |
| `statusV2` | enum | `DRAFT`, `ACTIVE`, `ARCHIVED`, `SUSPENDED`, `TRANSFERRED`. |
| `createdAt` | datetime | When the record was created. |
| `updatedAt` | datetime | Last modification timestamp. |

## RecordEvent

An append-only event log entry. Each event represents something that happened to the asset: creation, transfer, inspection, certification, repair, etc.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (CUID) | Primary key. |
| `recordId` | string (FK) | Parent record. |
| `eventType` | enum | `CREATION`, `UPDATE`, `OWNERSHIP_TRANSFER`, `CUSTODY_TRANSFER`, `INSPECTION`, `CERTIFICATION`, `REPAIR`, `RESTORATION`, `APPRAISAL`, `SHIPMENT`, `CUSTOM`. |
| `title` | string | Short description of the event. |
| `description` | string | Detailed description. |
| `occurredAt` | datetime | When the event occurred (may differ from `createdAt`). |
| `txHash` | string | On-chain anchor transaction hash (if anchored). |
| `chainId` | string | Blockchain chain ID (e.g., "8453" for Base mainnet). |
| `metadata` | JSON | Arbitrary additional metadata. |

The event log is append-only by convention. Events are never updated or deleted.

## RecordMedia

A media file associated with a record or event. Content-addressable via SHA-256.

| Field | Type | Description |
|-------|------|-------------|
| `id` | string (CUID) | Primary key. |
| `recordId` | string (FK) | Parent record. |
| `eventId` | string (FK) | Associated event (optional). |
| `storagePath` | string | Path in object storage. |
| `mimeType` | string | MIME type of the file. |
| `sha256` | string | SHA-256 hash of the file bytes. |
| `purpose` | enum | `PRIMARY`, `EVIDENCE`, `THUMBNAIL`, `DOCUMENT`, `SUPPLEMENTARY`. |
| `sortOrder` | int | Ordering within the record. |

## RecordFieldValue

A single field value for a record, defined by the record's category schema. Implements the EAV (Entity-Attribute-Value) pattern with type-specific columns.

| Field | Type | Description |
|-------|------|-------------|
| `recordId` | string (FK) | Parent record. |
| `fieldId` | string (FK) | Reference to `FieldDefinition`. |
| `valueText` | string | Text value. |
| `valueNumber` | float | Numeric value. |
| `valueBoolean` | boolean | Boolean value. |
| `valueDate` | datetime | Date/datetime value. |
| `valueYear` | int | Year value. |
| `valueJson` | JSON | Complex/structured value. |

Only one `value*` column is populated per row, determined by the field type.

## CategoryDefinition

Defines a type of record (e.g., "painting", "sculpture", "watch", "wine").

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string (unique) | URL-safe identifier. |
| `name` | string | Display name. |
| `description` | string | Category description. |
| `isSystem` | boolean | Whether this is a built-in category. |
| `parentId` | string (FK) | Parent category (hierarchical). |

## FieldDefinition

Defines a field within a category schema.

| Field | Type | Description |
|-------|------|-------------|
| `categoryId` | string (FK) | Parent category. |
| `key` | string | Machine-readable field key. |
| `label` | string | Human-readable label. |
| `fieldType` | enum | `TEXT`, `NUMBER`, `BOOLEAN`, `DATE`, `DATETIME`, `YEAR`, `CURRENCY`, `ENUM`, `URL`, `EMAIL`, `DIMENSION`, `LOCATION`, `JSON`. |
| `isRequired` | boolean | Whether the field must be populated. |
| `isSearchable` | boolean | Whether the field is indexed for search. |
| `allowedValues` | JSON | For `ENUM` fields, the set of valid values. |
| `validationRule` | string | Validation pattern (regex or custom). |

## CategoryEventType

Defines which event types are relevant for a given category.

| Field | Type | Description |
|-------|------|-------------|
| `categoryId` | string (FK) | Parent category. |
| `eventType` | enum | The event type. |
| `label` | string | Display label for this event type in this category context. |
