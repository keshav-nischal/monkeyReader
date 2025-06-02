class AudioProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.bufferSize = 1024; // Larger buffer for better efficiency
        this.buffer = new Float32Array(this.bufferSize);
        this.bufferIndex = 0;
        this.sampleRate = 16000;
    }
    
    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input && input.length > 0) {
            const inputData = input[0]; // First channel (Float32Array)
            
            // Buffer the audio data
            for (let i = 0; i < inputData.length; i++) {
                this.buffer[this.bufferIndex] = inputData[i];
                this.bufferIndex++;
                
                // When buffer is full, send it
                if (this.bufferIndex >= this.bufferSize) {
                    // Convert Float32 to Int16
                    const int16Buffer = new Int16Array(this.bufferSize);
                    for (let j = 0; j < this.bufferSize; j++) {
                        const sample = Math.max(-1, Math.min(1, this.buffer[j]));
                        int16Buffer[j] = sample * 0x7FFF;
                    }
                    
                    // Send the processed data back to the main thread
                    this.port.postMessage(int16Buffer);
                    
                    // Reset buffer
                    this.bufferIndex = 0;
                }
            }
        }
        return true; // Keep the processor alive
    }
}

registerProcessor('audio-processor', AudioProcessor);