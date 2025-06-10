import useReadingTestStore from "@/stores/readTestStore"

export const ReadingArea = () =>{
    const {testState} = useReadingTestStore()

    const words = testState.readingAreaState.words
    const marks = testState.readingAreaState.marks
    return (
        <>
            {testState.readingAreaState.isContentAvailable ? words.map((word, idx)=>{
                return <span key={idx} className={marks[idx] === 1 ? "text-muted-foreground" : marks[idx] === 2 ? "text-destructive" : ""}>{word} </span>
            }) : <span className='text-destructive'>something went wrong</span>}
        </>
    )

}
