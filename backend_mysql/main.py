from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from models import Base, User, Book, LibraryBook, LoanHistory, Reviews
from database import SessionLocal, engine
from auth import hash_password, verify_password, create_access_token, decode_token
from schemas import RegisterUser, LoginUser, UserBook , BookOut, LibraryBookOut, UserInfo, ReviewIn, ReviewOut 
from fastapi.security import OAuth2PasswordBearer
from typing import List
from datetime import datetime, timedelta
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")
Base.metadata.create_all(bind=engine)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register")
async def register_user(user: RegisterUser, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = db.query(User).filter(User.username == user.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Nazwa użytkownika jest już zajęta")

    db_user = User(
        username=user.username,
        email=user.email,
        password=hash_password(user.password)
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return {"message": "User registered successfully", "user_id": db_user.id}

@app.post("/login")
async def login_user(user: LoginUser, db: Session = Depends(get_db)):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if not existing_user or not verify_password(user.password, existing_user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": existing_user.email})
    return {"access_token": token, "token_type": "bearer"}

@app.post("/books")
async def add_book(book: UserBook, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    new_book = Book(
        title=book.title,
        author=book.author,
        borrowedAt=book.borrowedAt,
        returnBy=book.returnBy,
        notes=book.notes,
        status=book.status,
        owner_email=email
    )

    db.add(new_book)
    db.commit()
    db.refresh(new_book)

    return {"msg": "Book added", "book_id": new_book.id}

@app.get("/books", response_model=List[BookOut])
async def get_books(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    books = db.query(Book).filter(Book.owner_email == email).all()
    return books


@app.get("/available-books", response_model=List[LibraryBookOut])
async def get_public_books(db: Session = Depends(get_db)):
    books = db.query(LibraryBook).filter(LibraryBook.available_for_borrow == 1).all()
    return books

@app.post("/borrow-book/{book_id}")
async def borrow_book(book_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    library_book = db.query(LibraryBook).filter(LibraryBook.id == book_id).first()
    if not library_book:
        raise HTTPException(status_code=404, detail="Book not found")

    if library_book.borrowed_copies >= library_book.total_copies:
        raise HTTPException(status_code=400, detail="No copies available")

    existing_borrow = db.query(Book).filter(
        Book.owner_email == email,
        Book.title == library_book.title,
        Book.author == library_book.author,
        Book.status == "borrowed"
    ).first()
    
    if existing_borrow:
        raise HTTPException(status_code=400, detail="Już wypożyczyłeś tę książkę. Najpierw ją zwróć, aby wypożyczyć ponownie.")

    borrowed_at = datetime.now()
    return_by = borrowed_at + timedelta(days=30)

    new_book = Book(
        title=library_book.title,
        author=library_book.author,
        borrowedAt=borrowed_at,
        returnBy=return_by,
        status="borrowed",
        owner_email=email,
        library_book_id=library_book.id
    )
    db.add(new_book)

    history_entry = LoanHistory(
        user_id=user.id,
        book_id=library_book.id,
        book_title=library_book.title,
        book_author=library_book.author,
        action="Wypożyczenie",
        date=borrowed_at,
        status="Aktywny"
    )
    db.add(history_entry)

    library_book.borrowed_copies += 1
    db.commit()

    return {"msg": "Book borrowed successfully"}

@app.post("/return-book/{book_id}")
async def return_book(book_id: int, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    borrowed_book = db.query(Book).filter(
        Book.id == book_id,
        Book.owner_email == email,
        Book.status == "borrowed"
    ).first()
    if not borrowed_book:
        raise HTTPException(status_code=404, detail="Book not found or not borrowed by user")

    library_book = db.query(LibraryBook).filter(
        LibraryBook.title == borrowed_book.title,
        LibraryBook.author == borrowed_book.author
    ).first()
    if not library_book:
        raise HTTPException(status_code=404, detail="Book not found in library")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_id = user.id

    history_entry = LoanHistory(
        user_id=user_id,
        book_id=library_book.id,
        book_title=library_book.title,
        book_author=library_book.author,
        action="Zwrot",
        date=datetime.now(),
        status="Zakończony"
    )
    db.add(history_entry)

    db.delete(borrowed_book)

    library_book.borrowed_copies = max(0, library_book.borrowed_copies - 1)
    db.commit()

    return {"msg": "Book returned successfully"}

@app.get("/history")
async def get_history(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    history_entries = db.query(LoanHistory).filter(LoanHistory.user_id == user.id).order_by(LoanHistory.date.desc()).all()
    # Zamiana na listę słowników
    result = []
    for entry in history_entries:
        result.append({
            "id": entry.id,
            "user_id": entry.user_id,
            "book_id": entry.book_id,
            "book_title": entry.book_title,
            "book_author": entry.book_author,
            "action": entry.action,
            "date": entry.date.isoformat() if entry.date else None,
            "status": entry.status
        })
    return {"history": result}

@app.put("/update-user-info")
async def update_user_info(user_info: UserInfo, token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Aktualizuj dane użytkownika
    user.faculty = user_info.faculty
    user.field_of_study = user_info.field_of_study
    user.student_id = user_info.student_id
    user.birth_date = datetime.strptime(user_info.birth_date, "%Y-%m-%d").date() if user_info.birth_date else None
    user.phone_number = user_info.phone_number

    db.commit()
    db.refresh(user)

    return {"msg": "User info updated"}

@app.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)   # <-- DODAJ TO!
):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    extensions = [".png", ".jpg", ".jpeg", ".webp"]
    for ext in extensions:
        old_path = os.path.join(UPLOAD_DIR, f"{user.id}{ext}")
        if os.path.exists(old_path):
            os.remove(old_path)

    file_extension = os.path.splitext(file.filename)[1]
    file_path = os.path.join(UPLOAD_DIR, f"{user.id}{file_extension}")

    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    return {"msg": "Avatar uploaded"}

@app.get("/avatar/{user_id}")
def get_avatar(user_id: str):
    extensions = [".png", ".jpg", ".jpeg", ".webp"]
    for ext in extensions:
        avatar_path = os.path.join(UPLOAD_DIR, f"{user_id}{ext}")
        if os.path.exists(avatar_path):
            return FileResponse(avatar_path)
    raise HTTPException(status_code=404, detail="Avatar not found")

@app.get("/account")
async def get_account(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Zamień na dict, jeśli używasz SQLAlchemy
    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "faculty": user.faculty,
            "field_of_study": user.field_of_study,
            "student_id": user.student_id,
            "birth_date": user.birth_date.isoformat() if user.birth_date else "",
            "phone_number": user.phone_number
        }
    }

@app.post("/reviews", response_model=ReviewOut)
async def add_review(
    review: ReviewIn,
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    email = decode_token(token)
    if not email:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing_review = db.query(Reviews).filter_by(user_id=user.id, library_book_id=review.library_book_id).first()
    if existing_review:
        raise HTTPException(status_code=400, detail="Już oceniłeś tę książkę.")
        
    if review.rating <= 0 or not review.comment.strip():
        raise HTTPException(status_code=400, detail="Wymagana jest ocena oraz komentarz.")

    new_review = Reviews(
        user_id=user.id,
        library_book_id=review.library_book_id,
        rating=review.rating,
        comment=review.comment,
        created_at=datetime.utcnow()
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)

    return new_review


@app.get("/book-reviews/{book_id}", response_model=List[ReviewOut])
async def get_book_reviews(book_id: int, db: Session = Depends(get_db)):
    reviews = db.query(Reviews).filter(Reviews.book_id == book_id).all()
    return reviews