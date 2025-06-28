from typing import List
from services.passage import Passage, Mark

class WordMatcher:
    def __init__(self, look_ahead_factor: int = 8):
        self.look_ahead_factor = look_ahead_factor

    def match_and_mark(self, model_tokens: List[str], passage: Passage, last_correctly_marked_pos: int) -> int:
        words = passage.words
        marks = passage.marks
        last_model_token_used_idx = -1
        for i in range(last_correctly_marked_pos+1, len(words)):
            if(i-last_correctly_marked_pos > self.look_ahead_factor):
                break
            for j in range(last_model_token_used_idx+1, min(len(model_tokens), last_model_token_used_idx+1+self.look_ahead_factor)):
                if(words[i]==model_tokens[j]):
                    # if(i-last_pos)
                    for k in range(last_correctly_marked_pos+1, i):
                        marks[k] = Mark.INCORRECTLY_READ
                    marks[i] = Mark.CORRECTLY_READ
                    last_correctly_marked_pos = i
                    last_model_token_used_idx = j
                    break
        return last_correctly_marked_pos

class ReadingTracker:
    def __init__(self, passage: Passage, matcher: WordMatcher):
        self.passage = passage
        self.last_marked_word_pos = -1
        self.matcher = matcher

    def mark_sentence(self, model_tokens: List[str]):
        mark_details = {"start_idx": self.last_marked_word_pos + 1, "end_idx": -1, "marks": []}
        self.last_marked_word_pos = self.matcher.match_and_mark(
            model_tokens, self.passage, self.last_marked_word_pos
        )
        mark_details['end_idx'] = self.last_marked_word_pos
        mark_details['marks'] = [self.passage.marks[i].value for i in range(mark_details["start_idx"], mark_details["end_idx"] + 1)]
        return mark_details
    def mark_sentence_rough(self, model_tokens: List[str]):
        mark_details = {"start_idx": self.last_marked_word_pos + 1, "end_idx": -1, "marks": []}
        lastPos = self.matcher.match_and_mark(
            model_tokens, self.passage, self.last_marked_word_pos
        )
        mark_details['end_idx'] = lastPos
        mark_details['marks'] = [self.passage.marks[i].value for i in range(mark_details["start_idx"], mark_details["end_idx"] + 1)]
        return mark_details
    def __str__(self) -> str:
        return str(self.passage)

    def __repr__(self) -> str:
        return repr(self.passage)
