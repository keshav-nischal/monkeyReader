import './App.css';
import { useState, useRef, useCallback } from 'react';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { ScrollArea } from './components/ui/scroll-area';
import { ThemeProvider } from "@/components/theme-provider"

interface TranscriptData {
  type: 'partial' | 'final';
  text: string;
}

class AudioStreamer {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private onMessage: ((data: string) => void) | null = null;

  constructor() {}

  setMessageHandler(handler: (data: string) => void) {
    this.onMessage = handler;
  }

  establishWebSocketConnection(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket('ws://localhost:8012/ws');
      this.ws.binaryType = 'arraybuffer'; // Optimize for binary data

      this.ws.onopen = () => {
        console.log('WebSocket connection established.');
        this.reconnectAttempts = 0;
        resolve(this.ws!);
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        reject(error);
      };

      this.ws.onmessage = (event) => {
        if (this.onMessage) {
          this.onMessage(event.data);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket connection closed.');
        this.handleReconnection();
      };
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        console.log(`Reconnection attempt ${this.reconnectAttempts}`);
        this.establishWebSocketConnection().catch(console.error);
      }, this.reconnectDelay);
    }
  }

  send(data: ArrayBuffer) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(data);
    }
  }

  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

function App() {
  const [translatedText, setTranslatedText] = useState<string>("");
  const [translatedTextsComplete, setTranslatedTextsComplete] = useState<string[]>([]);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  
  const audioStreamerRef = useRef<AudioStreamer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const handleTranscriptMessage = useCallback((data: string) => {
    setTranslatedText(data);
    try {
      const parsedData: TranscriptData = JSON.parse(data);
      if (parsedData.type === "final") {
        setTranslatedTextsComplete(prev => [...prev, parsedData.text]);
        setTranslatedText(""); // Clear partial text after final
      }
    } catch (error) {
      console.error('Error parsing transcript data:', error);
    }
  }, []);

  async function startRecording() {
    try {
      setIsRecording(true);
      
      // Initialize audio streamer
      audioStreamerRef.current = new AudioStreamer();
      audioStreamerRef.current.setMessageHandler(handleTranscriptMessage);

      // Request microphone access with optimized settings
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,  // Reduce processing overhead
          noiseSuppression: false,  // Reduce processing overhead
          autoGainControl: false,   // Reduce processing overhead
          sampleRate: 16000,
          channelCount: 1          // Mono audio
        }
      });
      
      streamRef.current = stream;

      // Create audio context with low latency settings
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ 
        sampleRate: 16000,
        latencyHint: 'interactive'  // Optimize for low latency
      });
      
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);

      // Load the optimized audio processor
      await audioCtx.audioWorklet.addModule('/audio-processor-optimized.js');
      
      const audioWorkletNode = new AudioWorkletNode(audioCtx, 'audio-processor-optimized');

      // Establish WebSocket connection
      const ws = await audioStreamerRef.current.establishWebSocketConnection();
      
      audioWorkletNode.port.onmessage = (event) => {
        const int16Buffer = event.data as Int16Array;
        if (audioStreamerRef.current) {
          // Send as ArrayBuffer for better performance
          audioStreamerRef.current.send(int16Buffer.buffer);
        }
      };
      
      source.connect(audioWorkletNode);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setIsRecording(false);
      throw error;
    }
  }

  function stopRecording() {
    setIsRecording(false);
    
    // Stop audio stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Close WebSocket connection
    if (audioStreamerRef.current) {
      audioStreamerRef.current.close();
      audioStreamerRef.current = null;
    }
  }

  function clearTranscripts() {
    setTranslatedText("");
    setTranslatedTextsComplete([]);
  }

  return (
    <ThemeProvider>
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
          
          <Button 
            onClick={clearTranscripts}
            variant="outline"
          >
            Clear
          </Button>
        </div>

        {/* Status indicator */}
        <div className="flex justify-center mb-4">
          <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`} />
          <span className="ml-2 text-sm text-muted-foreground">
            {isRecording ? 'Recording...' : 'Not recording'}
          </span>
        </div>
        
        {/* Live transcript display */}
        {translatedText && (
          <Card className="bg-card p-4 mb-4 border-l-4 border-l-blue-500">
            <p className="text-lg italic text-muted-foreground">
              Live: {translatedText}
            </p>
          </Card>
        )}
        
        {/* Sample text card */}
        <Card className='bg-card p-4 rounded mb-6'>
          <ScrollArea className='h-48'>
            <p className="text-justify text-lg leading-8">
              
            </p>
          </ScrollArea>
        </Card>

        {/* Final transcripts */}
        {translatedTextsComplete.length > 0 && (
          <Card className="bg-card p-4">
            <h2 className="text-xl font-semibold mb-4">Transcripts</h2>
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {translatedTextsComplete.map((transcriptText, idx) => (
                  <div key={idx} className="p-3 bg-muted rounded-lg">
                    <span className="text-xs text-muted-foreground">#{idx + 1}</span>
                    <p className="text-base mt-1">{transcriptText}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;