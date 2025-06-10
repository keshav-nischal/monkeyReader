import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react'
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import TestInstructions from '@/components/reading-test/TestInstruction';
import useReadingTestStore from '@/stores/readTestStore';
import { ReadingArea } from '@/components/reading-test/ReadingArea';

const ReadingTest = () => {
    const [isRecording, setIsRecording] = useState(false);
    const [websocket, setWebsocket] = useState<WebSocket | null>(null);
    const {testState, startTest, updateReadingAreaMarkings} = useReadingTestStore()

    // Keep track of active audio components
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const [workletNode, setWorkletNode] = useState<AudioWorkletNode | null>(null);

    async function startRecording(){
        setIsRecording(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            const source = audioCtx.createMediaStreamSource(stream);

            await audioCtx.audioWorklet.addModule('/audio-processor.js');
            
            const audioWorkletNode = new AudioWorkletNode(audioCtx, 'audio-processor');

            audioWorkletNode.port.onmessage = (event) => {
                const int16Buffer = event.data;
                console.log(int16Buffer)
                if (websocket?.readyState === WebSocket.OPEN) {
                    console.log("keshav")
                    websocket.send(int16Buffer);
                }
            };
            
            source.connect(audioWorkletNode);

            // Store references for cleanup
            setAudioContext(audioCtx);
            setAudioStream(stream);
            setWorkletNode(audioWorkletNode);

        } catch (error) {
            console.error('Error in micHandler:', error);
            throw error;
        }
    }
    function stopRecording(){
        setIsRecording(false);
        
        // Cleanup audio resources
        if (workletNode) {
            workletNode.disconnect();
            setWorkletNode(null);
        }
        
        if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            setAudioStream(null);
        }

        if (audioContext) {
            audioContext.close();
            setAudioContext(null);
        }
    }
    async function testStartHandler(){
        const wb = await establishWebSocketConnection() //after  connection request is successful, we have set events so test will start automatically
        setWebsocket(wb);
    }
    function establishWebSocketConnection(): Promise<WebSocket> {
        return new Promise((resolve, reject) => {
            const ws = new WebSocket('ws://localhost:8012/ws');
            ws.binaryType = 'arraybuffer'; // Optimize for binary data
            ws.onopen = () => {
                console.log('WebSocket connection established.');
                // reconnectAttempts = 0;
                resolve(ws!);
            };
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                reject(error);
            };
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                // console.log(data);
                if(data.ws_msg_type === "passage_details"){
                    startTest(data.content.passage, data.content.marks);
                }
                else if(data.ws_msg_type === "marking_details"){
                    updateReadingAreaMarkings(data.content);
                }
            };
            ws.onclose = () => {
                console.log('WebSocket connection closed.');
            };
        });
    }
    return (
        <>
            {!testState.isTestAreaReady && <TestInstructions onStart={testStartHandler}></TestInstructions>}
            {
                testState.isTestAreaReady &&
                (
                <div className="min-h-screen p-4">
                    <h1 className='text-primary text-4xl font-semibold m-4'>MonkeyRead</h1>
                    
                    <div className='flex justify-center gap-4 mb-6'>
                    <Button 
                        onClick={isRecording ? stopRecording : startRecording}
                        variant={isRecording ? "destructive" : "default"}
                        className="min-w-24"
                    >
                        {isRecording ? "Stop" : "Start"} Recording
                    </Button>
                    
                    {/* <Button 
                        onClick={clearTranscripts}
                        variant="outline"
                    >
                        Clear
                    </Button> */}
                    </div>

                    {/* Status indicator */}
                    {/* <div className="flex justify-center mb-4">
                    <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="ml-2 text-sm text-muted-foreground">
                        {isRecording ? 'Recording...' : 'Not recording'}
                    </span>
                    </div> */}
                    
                    {/* Sample text card */}
                    <Card className='bg-card p-4 rounded mb-6'>
                    <ScrollArea className='h-48'>
                        <p className="text-justify text-lg leading-8">
                            <ReadingArea></ReadingArea>
                        </p>
                    </ScrollArea>
                    </Card>

                </div>
                )
            }
        </>
    );
}

export default ReadingTest