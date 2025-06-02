import { create } from 'zustand'

interface ReadingAreaState {
    isContentAvailable: boolean
    words: string[]
    marks: number[]
}

interface TestState {
    readingAreaState: ReadingAreaState
    isTestAreaReady: boolean
}

export interface MarkingDetails {
    start_idx: number
    end_idx: number
    marks: number[]
}
interface ReadingTestStore {
    testState: TestState
    startTest: (passage: string[], marks: number[]) => void
    updateReadingAreaMarkings: (markingDetails: MarkingDetails)=>void
}

const initialTestState: TestState = {
    readingAreaState: {
        isContentAvailable: false,
        words: [],
        marks: []
    },
    isTestAreaReady: false
}

const useReadingTestStore = create<ReadingTestStore>()((set) => ({
    testState: initialTestState,

    startTest: (passage: string[], marks: number[]) => {
        set((state) => ({
            testState: {
                ...state.testState,
                readingAreaState: {
                    isContentAvailable: true,
                    words: passage,
                    marks: marks
                },
                isTestAreaReady: true
            }
        }))
    },

    updateReadingAreaMarkings: ({start_idx, end_idx, marks: newMarks}: MarkingDetails) => {
        set((state) => ({
            testState: {
                ...state.testState,
                readingAreaState: {
                    ...state.testState.readingAreaState,
                    marks: state.testState.readingAreaState.marks.map((mark, index) => 
                        index >= start_idx && index <= end_idx ? newMarks[index - start_idx] : mark
                    )
                }
            }
        }))
    }
}))

export default useReadingTestStore