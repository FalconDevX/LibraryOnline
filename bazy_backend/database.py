from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()
client = AsyncIOMotorClient(os.getenv("MONGO_URL"))
db = client["backend-app"]
users = db["users"]
borrowed_books = db["borrowed_books"]
library_books = db["library_books"]
history = db["history"]
loan_history = db["loan_history"]
