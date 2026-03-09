# API Reference

**Audience:** Engineers, API Consumers
**Last Updated:** 2026-03-09

## Authentication

All API requests require authentication via Bearer token.

- **Header:** `Authorization: Bearer <API_KEY>`
- **Key Source:** `KAYCHA_API_KEY` environment variable or `.env` file.
- **Scope:** Full access to all endpoints unless specified otherwise.

## Base URL

```
https://api.kaycha-labs.com/v1
```

For local development:
```
http://localhost:3000
```

## Endpoints

### `POST /function-name`

- **URL:** `POST /function-name`
- **Auth:** Required
- **Description:** Initiates a generation request using the Kaycha DocGen engine. Accepts a source context and configuration parameters.

#### Request Body

```json
{
  "source_context": {
    "repository": "string",
    "commit_hash": "string",
    "files": ["string"]
  },
  "config": {
    "output_format": "markdown",
    "include_code_blocks": true,
    "max_tokens": 8192
  }
}
```

**Schema:**
| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `source_context` | Object | Yes | Metadata about the repository state. |
| `source_context.repository` | String | Yes | Repository name (e.g., `docgen-template`). |
| `source_context.commit_hash` | String | Yes | SHA-1 hash of the commit to document. |
| `source_context.files` | Array[String] | Yes | List of file paths to include in context. |
| `config.output_format` | String | No | Default: `markdown`. Options: `markdown`, `json`. |
| `config.include_code_blocks` | Boolean | No | Default: `true`. |
| `config.max_tokens` | Integer | No | Default: `8192`. |

#### Response

**200 OK**
```json
{
  "id": "gen_8f9a2b1c",
  "status": "completed",
  "result": {
    "document": "# API Reference\n\n...",
    "metadata": {
      "generated_at": "2026-03-09T21:59:46.111Z",
      "tokens_used": 4500
    }
  }
}
```

**Schema:**
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | String | Unique generation ID. |
| `status` | String | `pending`, `processing`, `completed`, `failed`. |
| `result.document` | String | Generated Markdown content. |
| `result.metadata.tokens_used` | Integer | Number of tokens consumed. |

#### Errors

| Code | Status | Description |
| :--- | :--- | :--- |
| `INVALID_REQUEST` | 400 | Malformed JSON or missing required fields. |
| `AUTH_FAILED` | 401 | Invalid or missing Bearer token. |
| `RATE_LIMITED` | 429 | Too many requests. |
| `INTERNAL_ERROR` | 500 | Server-side processing failure. |

### `GET /status/:id`

- **URL:** `GET /status/:id`
- **Auth:** Required
- **Description:** Polls the status of a generation job.

#### Request Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | String | Yes | Generation ID from the initial request. |

#### Response

**200 OK**
```json
{
  "id": "gen_8f9a2b1c",
  "status": "completed",
  "result": {
    "document": "# API Reference\n...",
    "metadata": {
      "generated_at": "2026-03-09T21:59:46.111Z"
    }
  }
}
```

**202 Accepted**
```json
{
  "id": "gen_8f9a2b1c",
  "status": "processing",
  "progress": 0.45
}
```

#### Errors
| Code | Status | Description |
| :--- | :--- | :--- |
| `NOT_FOUND` | 404 | Generation ID does not exist. |

## Rate Limits

- **Standard Tier:** 60 requests per minute.
- **Premium Tier:** 300 requests per minute.
- **Headers:**
  - `X-RateLimit-Limit`: Max requests allowed.
  - `X-RateLimit-Remaining`: Requests remaining.
  - `X-RateLimit-Reset`: Unix timestamp when the limit resets.

## Webhooks

Webhooks are supported for asynchronous status updates.

- **Event:** `generation.completed`
- **Payload:**
  ```json
  {
    "event": "generation.completed",
    "data": {
      "id": "gen_8f9a2b1c",
      "status": "completed",
      "result": { ... }
    }
  }
  ```
- **Configuration:** Configure webhook URL in the dashboard or via `POST /webhooks`.
- **Signature:** Requests are signed with `X-Kaycha-Signature` using HMAC-SHA256.