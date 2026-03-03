# Backend Socket Protocol Spec

## Namespace
All events operate on the `/socket` namespace.

---

## Server-Side State
```
room_users: { room_id: [username, ...] }
```
In-memory dict tracking which users are in which room. Not persisted.

---

## Client → Server Events

### `join`
User joins a room.

**Payload:**
```json
{
  "username": "string",
  "room_id": "string"
}
```

### `leave`
User leaves a room.

**Payload:**
```json
{
  "username": "string",
  "room_id": "string"
}
```

### `message`
Send any data to everyone in the room.

**Payload:**
```json
{
  "username": "string",
  "room_id": "string",
  "socket_data": "JSON string"
}
```
> `socket_data` is a **JSON-encoded string** (i.e. `JSON.stringify(...)` on the client). The server parses it with `json.loads()` before re-emitting.

---

## Server → Client Events

### `status`
Emitted to the **entire room** after a `join` or `leave`. Used to sync the current user list.

**Payload:**
```json
{
  "users": ["username1", "username2"],
  "log": "string"
}
```

### `message`
Emitted to the **entire room** after a `message` event. Carries the parsed `socket_data`.

**Payload:**
```json
{
  "username": "string",
  "room_id": "string",
  "socket_data": { /* parsed object, whatever was sent */ },
  "log": "string"
}
```

---

## Key Design Notes

- **All game and chat logic is encoded in `socket_data`**. The server is a dumb relay — it does not inspect or act on `socket_data` contents.
- `socket_data` arrives as a JSON string from the client and is parsed server-side before being forwarded. The client receives it as a plain object.
- `room_users` is in-memory only — no persistence across server restarts.
- There is no authentication on the socket layer; username is trust-based (provided by the client).
- The server broadcasts all events back to the full room, including the sender.

---

## Typical Client Flow

1. Connect to `ws://<host>/socket`
2. Emit `join` with `{ username, room_id }`
3. Listen for `status` to get the current user list
4. Emit `message` with `{ username, room_id, socket_data: JSON.stringify(payload) }` to broadcast game/chat state
5. Listen for `message` to receive broadcasts from others (and self)
6. Emit `leave` with `{ username, room_id }` on disconnect/exit
