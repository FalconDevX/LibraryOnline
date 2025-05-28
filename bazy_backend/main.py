from fastapi import FastAPI, HTTPException, Depends,Request, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from bson.objectid import ObjectId
from typing import List
from datetime import datetime, timedelta
import os
from fastapi.responses import FileResponse

from models import Book, LoanHistory
from database import borrowed_books, users, library_books, loan_history
from models import RegisterUser, LoginUser, UserInfo
from auth import hash_password, verify_password, create_access_token, decode_token

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/register")
async def register(user: RegisterUser):
    existing_email = await users.find_one({"email": user.email})
    existing_username = await users.find_one({"username": user.username})
    
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already in use")
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already in use")
    
    hashed_password = hash_password(user.password)
    new_user = {
        "username": user.username,
        "email": user.email,
        "password": hashed_password
    }

    await users.insert_one(new_user)
    return {"msg": "User registered"}

@app.post("/login")
async def login(user: LoginUser):
    existing = await users.find_one({"email": user.email})
    if not existing:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if "password" not in existing:
        raise HTTPException(status_code=500, detail="User record is corrupted")
        
    if not verify_password(user.password, existing["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": existing["email"]})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/account")
async def get_account(token: str = Depends(oauth2_scheme)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await users.find_one({"email": email})
    if user:
        user["_id"] = str(user["_id"])
    
    if not user:
        return {
            "user": {
                "email": email,
                "faculty": "",
                "field_of_study": "",
                "student_id": "",
                "birth_date": "",
                "phone_number": ""
            }
        }

    return {"user": user}

@app.post("/books")
async def add_book(book: Book, token: str = Depends(oauth2_scheme)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    data = book.dict()
    data["owner"] = email

    data["borrowedAt"] = str(data["borrowedAt"])
    data["returnBy"] = str(data["returnBy"])

    await borrowed_books.insert_one(data)
    return {"msg": "Book added"}

@app.get("/books")
async def get_books(token: str = Depends(oauth2_scheme)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_books = await borrowed_books.find({"owner": email}).to_list(100)
    for book in user_books:
        book["_id"] = str(book["_id"])
    return {"books": user_books}

@app.get("/available-books")
async def get_available_books():
    books = await library_books.find({"availableForBorrow": True}).to_list(100)
    for book in books:
        book["_id"] = str(book["_id"])
    return {"books": books}

@app.post("/borrow-book/{book_id}")
async def borrow_book(book_id: str, token: str = Depends(oauth2_scheme)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    existing_borrow = await borrowed_books.find_one({
        "owner": email,
        "bookId": book_id,
        "status": "wypożyczona"
    })
    
    if existing_borrow:
        raise HTTPException(status_code=400, detail="You have already borrowed this book")

    book = await library_books.find_one({"_id": ObjectId(book_id)})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")

    if book["borrowedCopies"] >= book["totalCopies"]:
        raise HTTPException(status_code=400, detail="No copies available")

    borrowed_at = datetime.utcnow()
    return_by = borrowed_at + timedelta(days=30)

    user = await users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    history_entry = {
        "user_id": str(user["_id"]),
        "book_id": str(book["_id"]),
        "book_title": book["title"],
        "book_author": book["author"],
        "action": "Wypożyczenie",
        "date": borrowed_at,
        "status": "Aktywny"
    }
    await loan_history.insert_one(history_entry)

    await borrowed_books.insert_one({
        "owner": email,
        "bookId": str(book["_id"]),
        "title": book["title"],
        "borrowedAt": borrowed_at.isoformat(),
        "returnBy": return_by.isoformat(),
        "status": "wypożyczona",
        "notes": "",
        "can_renew": True
    })

    await library_books.update_one(
        {"_id": ObjectId(book_id)},
        {"$inc": {"borrowedCopies": 1}}
    )

    return {"msg": "Book borrowed successfully"}

@app.post("/return-book/{book_id}")
async def return_book(book_id: str, token: str = Depends(oauth2_scheme)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    borrowed_book = await borrowed_books.find_one({
        "_id": ObjectId(book_id),
        "owner": email,
        "status": "wypożyczona"
    })
    
    if not borrowed_book:
        raise HTTPException(status_code=404, detail="Book not found or not borrowed by user")

    library_book = await library_books.find_one({"_id": ObjectId(borrowed_book["bookId"])})
    if not library_book:
        raise HTTPException(status_code=404, detail="Book not found in library")

    user = await users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    history_entry = {
        "user_id": str(user["_id"]),
        "book_id": str(library_book["_id"]),
        "book_title": library_book["title"],
        "book_author": library_book["author"],
        "action": "Zwrot",
        "date": datetime.utcnow(),
        "status": "Zakończony"
    }
    await loan_history.insert_one(history_entry)

    await borrowed_books.delete_one({"_id": ObjectId(book_id)})

    await library_books.update_one(
        {"_id": ObjectId(borrowed_book["bookId"])},
        {"$inc": {"borrowedCopies": -1}}
    )

    return {"msg": "Book returned successfully"}

@app.get("/history")
async def get_history(token: str = Depends(oauth2_scheme)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    history_entries = await loan_history.find(
        {"user_id": str(user["_id"])}
    ).sort("date", -1).to_list(100)

    for entry in history_entries:
        entry["_id"] = str(entry["_id"])
        entry["date"] = entry["date"].isoformat()

    return {"history": history_entries}

@app.put("/update-user-info")
async def update_user_info(user_info: UserInfo, token: str = Depends(oauth2_scheme)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await users.update_one(
        {"email": email},
        {"$set": user_info.dict()}
    )

    return {"msg": "User info updated"}

@app.post("/upload-avatar")
async def upload_avatar(file: UploadFile = File(...), token: str = Depends(oauth2_scheme)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = await users.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    file_extension = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{user['_id']}{file_extension}")

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    await users.update_one(
        {"email": email},
        {"$set": {"avatar_path": file_path}}
    )

    return {"msg": "Avatar uploaded"}

@app.get("/avatar/{user_id}")
def get_avatar(user_id: str):
    user = users.find_one({"_id": ObjectId(user_id)})
    if not user or "avatar_path" not in user:
        return FileResponse("default_avatar.png")

    return FileResponse(user["avatar_path"]) 
