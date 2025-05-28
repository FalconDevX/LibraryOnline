from pydantic import BaseModel, EmailStr, Field
from datetime import date, datetime
from typing import Optional

class RegisterUser(BaseModel):
    username: str
    email: str
    password: str
    faculty: str = ""
    field_of_study: str = ""
    student_id: str = ""
    birth_date: str = ""
    phone_number: str = ""

class LoginUser(BaseModel):
    email: EmailStr
    password: str

class Book(BaseModel):
    title: str
    borrowedAt: date
    returnBy: date
    status: str
    notes: str
    canRenew: bool

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
