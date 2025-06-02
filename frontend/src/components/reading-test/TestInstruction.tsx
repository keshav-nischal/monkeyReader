import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlayCircle, BookOpen, Timer, BarChart2 } from 'lucide-react';

interface TestInstructionsProps {
  onStart: () => void;
}

const TestInstructions = ({ onStart }: TestInstructionsProps) => {
  return (
    <div className="max-w-3xl mx-auto">
      <Card className="border-2 border-primary/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl">Reading Speed Test</CardTitle>
          <CardDescription>
            Measure your reading speed and comprehension
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Read the text</h3>
                  <p className="text-sm text-muted-foreground">
                    Read the provided text at your normal pace
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <Timer className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Time is tracked</h3>
                  <p className="text-sm text-muted-foreground">
                    Your reading speed is automatically measured
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <BarChart2 className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">View your results</h3>
                  <p className="text-sm text-muted-foreground">
                    See your reading speed in words per minute
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="rounded-full bg-primary/10 p-2">
                  <PlayCircle className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Practice regularly</h3>
                  <p className="text-sm text-muted-foreground">
                    Take multiple tests to improve your reading speed
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 rounded-lg bg-muted p-4">
            <h4 className="mb-2 font-medium">Tips for better results:</h4>
            <ul className="space-y-1 text-sm">
              <li>• Find a quiet, well-lit environment</li>
              <li>• Avoid distractions during the test</li>
              <li>• Try to understand the content, not just scan it</li>
              <li>• Click "I've Finished Reading" when you're done</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={onStart} size="lg" className="w-full">
            <PlayCircle className="mr-2 h-5 w-5" />
            Start Reading Test
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TestInstructions;