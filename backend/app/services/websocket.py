from fastapi import WebSocket
from typing import List, Dict
import json

class ChatConnectionManager:
    def __init__(self):
        self.active_rooms: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_rooms:
            self.active_rooms[room_id] = []
        self.active_rooms[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_rooms and websocket in self.active_rooms[room_id]:
            self.active_rooms[room_id].remove(websocket)

    async def broadcast_to_room(self, message: dict, room_id: str):
        if room_id in self.active_rooms:
            for connection in self.active_rooms[room_id]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    pass

manager = ChatConnectionManager()