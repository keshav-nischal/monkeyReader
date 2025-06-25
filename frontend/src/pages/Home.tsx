import Header from '@/components/Header'
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress';
import { type LucideIcon } from 'lucide-react';
import React from 'react'
import { Rocket } from 'lucide-react';


type Book = {
    title: string;
    author: string;
    totalPages: number;
    pagesRead: number;
    BookSymbol: LucideIcon;
};


const BookCard: React.FC<Book> = ({ title, author, totalPages, pagesRead, BookSymbol }) => {
    const progress = totalPages > 0 ? Math.round((pagesRead / totalPages) * 100) : 0;
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{author}</CardDescription>
            </CardHeader>
            <CardContent>
                <span
                    role="img"
                    aria-label="book-icon"
                >
                    <BookSymbol className=" w-full h-full p-4"/>
                </span>
                
            </CardContent>
            <CardFooter className="flex flex-col gap-2 flex-grow justify-center min-h-[60px]">
                <div className="w-full flex flex-col gap-1">
                    <div className='flex justify-between'>
                        <span className="text-muted-foreground text-sm">
                            {pagesRead} / {totalPages}
                        </span>
                        <span className="ml-2 text-xs">
                            {progress >= 100 ? 'Complete' : 'In progress'}
                        </span>
                    </div>
                    <Progress value={progress} />
                </div>
                {pagesRead === 0 ? (
                    <Button className="w-full mt-2">Start</Button>
                ) : pagesRead >= totalPages ? (
                    <Button className="w-full mt-2" variant="secondary">Re-read</Button>
                ) : (
                    <Button className="w-full mt-2">Continue</Button>
                )}
            </CardFooter>
        </Card>
    );
};

const Home = () => {
    const books: Omit<Book, 'BookSymbol'>[] = [
        { title: '1984', author: 'George Orwell', totalPages: 328, pagesRead: 0 },
        { title: 'Brave New World', author: 'Aldous Huxley', totalPages: 311, pagesRead: 124 },
        { title: 'To Kill a Mockingbird', author: 'Harper Lee', totalPages: 281, pagesRead: 50 },
        { title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', totalPages: 180, pagesRead: 180 },
    ];

    const debug = ():void => {

    };

    return (
        <div className='w-full px-6 pt-6'>
            <Header />
            <Button onClick={debug}></Button>
            <div className='my-4'>
                <h1 className='text-3xl my-4'>Books Available:</h1>
                <div
                    style={{
                        display: 'flex',
                        gap: '1rem',
                        flexWrap: 'wrap',
                        justifyContent: 'flex-start',
                    }}
                >
                    {books.map((book, idx) => (
                        <div
                            key={idx}
                            style={{
                                flex: '1 1 220px',
                                maxWidth: '250px',
                                minWidth: '150px',
                                minHeight: '150px',
                                width: '100%',
                            }}
                        >
                            <BookCard
                                title={book.title}
                                author={book.author}
                                totalPages={book.totalPages}
                                pagesRead={book.pagesRead}
                                BookSymbol={Rocket}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Home