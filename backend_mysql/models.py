from sqlalchemy import Column, ForeignKey, Integer, String, Date, DateTime
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50))
    email = Column(String(100))
    password = Column(String(255))
    birth_date = Column(Date, nullable=True)
    faculty = Column(String(100), nullable=True)
    field_of_study = Column(String(100), nullable=True)
    phone_number = Column(String(20), nullable=True)
    student_id = Column(String(20), nullable=True)


class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200))
    author = Column(String(100))
    borrowedAt = Column(Date)
    returnBy = Column(Date)
    notes = Column(String(500), nullable=True)
    status = Column(String(50), default="borrowed")
    owner_email = Column(String(100)) 
    library_book_id = Column(Integer) 

class LibraryBook(Base):
    __tablename__ = "library_books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200))
    author = Column(String(100))
    total_copies = Column(Integer)
    borrowed_copies = Column(Integer)
    available_for_borrow = Column(Integer)

class LoanHistory(Base):
    __tablename__ = "loan_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    book_id = Column(Integer)
    book_title = Column(String(200))
    book_author = Column(String(100))
    action = Column(String(50))
    date = Column(DateTime)
    status = Column(String(50))

class Reviews(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer)
    library_book_id = Column(Integer, ForeignKey('library_books.id'), nullable=False)
    rating = Column(Integer)
    comment = Column(String(500), nullable=True)
    created_at = Column(DateTime)