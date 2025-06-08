from pydantic import BaseModel, EmailStr
from datetime import date, datetime
from typing import Optional

class RegisterUser(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginUser(BaseModel):
    email: EmailStr
    password: str

class UserBook(BaseModel):
    title: str
    author: str 
    borrowedAt: date
    returnBy: date
    status: str
    notes: str
    canRenew: bool

class BookOut(BaseModel):
    id: int
    title: str
    author: str
    borrowedAt: date
    returnBy: date
    notes: Optional[str] = None
    status: str
    owner_email: str
    library_book_id: int 
    class Config:
        orm_mode = True

class LibraryBookOut(BaseModel):
    id: int
    title: str
    author: str
    total_copies: int
    borrowed_copies: int
    available_for_borrow: int

    class Config:
        orm_mode = True

class UserInfo(BaseModel):
    faculty: str
    field_of_study: str
    student_id: str
    birth_date: str
    phone_number: str

class LoanHistory(BaseModel):
    id: Optional[int] = None
    user_id: int
    book_id: int
    book_title: str
    book_author: str
    action: str  
    date: datetime
    status: str

class ReviewIn(BaseModel):
    rating: int
    comment: Optional[str] = None
    library_book_id: int


class ReviewOut(BaseModel):
    id: int
    user_id: int
    library_book_id: int
    rating: int
    comment: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True