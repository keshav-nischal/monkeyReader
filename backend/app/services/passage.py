from enum import Enum
import re
from typing import List

class Mark(Enum):
    UNREAD = 0 
    CORRECTLY_READ = 1
    INCORRECTLY_READ = 2

class Passage:
    def __init__(self, text: str):
        self.words = self._tokenize(text)
        self.marks: List[Mark] = [Mark.UNREAD] * len(self.words)
        
    def to_dict(self):
        return {"passage": self.words, "marks": [mark.value for mark in self.marks]}
    
    def _tokenize(self, text: str) -> List[str]:
        # Convert text to lowercase and extract word tokens similar to VOSK model output.
        return re.findall(r'\b\w+\b', text.lower())

    def __str__(self) -> str:
        GREEN = '\033[92m'  # Bright green
        RED = '\033[91m'    # Bright red
        RESET = '\033[0m'   # Reset to default color
        
        colored_words = []
        for i, word in enumerate(self.words):
            mark = self.marks[i]
            if mark == Mark.CORRECTLY_READ:
                colored_words.append(f"{GREEN}{word}{RESET}")
            elif mark == Mark.INCORRECTLY_READ:
                colored_words.append(f"{RED}{word}{RESET}")
            else:
                colored_words.append(word)
        return ' '.join(colored_words)

    def __repr__(self) -> str:
        GREEN = '\033[92m'
        RED = '\033[91m'
        RESET = '\033[0m'
        
        correct_count = sum(1 for mark in self.marks if mark == Mark.CORRECTLY_READ)
        incorrect_count = sum(1 for mark in self.marks if mark == Mark.INCORRECTLY_READ)
        unread_count = sum(1 for mark in self.marks if mark == Mark.UNREAD)
        
        stats = (f"Passage(words={len(self.words)}, "
                    f"correct={correct_count}, incorrect={incorrect_count}, "
                    f"unread={unread_count})\n")
        
        legend = (f"Legend: {GREEN}Correct{RESET} | {RED}Incorrect{RESET} | Plain=Unread\n")
        
        return stats + legend + self.__str__()
