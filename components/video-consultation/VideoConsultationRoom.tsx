'use client'

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Settings,
  MessageSquare,
  FileText,
  Share2,
  Users
} from 'lucide-react';

interface VideoConsultationRoomProps {
  consultationId: string;
  userRole: 'doctor' | 'patient';
  participantName: string;
  onEndConsultation: (summary?: string) => void;
  onError: (error: string) => void;
}

interface Participant {
  id: string;
  name: string;
  role: 'doctor' | 'patient';
  videoEnabled: boolean;
  audioEnabled: boolean;
  isLocal: boolean;
}

export default function VideoConsultationRoom({
  consultationId,
  userRole,
  participantName,
  onEndConsultation,
  onError
}: VideoConsultationRoomProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'failed'>('connecting');
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localVideoEnabled, setLocalVideoEnabled] = useState(true);
  const [localAudioEnabled, setLocalAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [consultationDuration, setConsultationDuration] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, sender: string, message: string, timestamp: Date}>>([]);
  const [notes, setNotes] = useState('');
  const [consultationSummary, setConsultationSummary] = useState('');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const startTimeRef = useRef<Date>(new Date());
  const durationIntervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initialize WebRTC connection
    initializeConnection();
    
    // Start duration timer
    durationIntervalRef.current = setInterval(() => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - startTimeRef.current.getTime()) / 1000);
      setConsultationDuration(diff);
    }, 1000);

    return () => {
      cleanup();
    };
  }, [consultationId]);

  const initializeConnection = async () => {
    try {
      setConnectionStatus('connecting');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize local participant
      setParticipants(prev => [
        ...prev,
        {
          id: 'local',
          name: participantName,
          role: userRole,
          videoEnabled: true,
          audioEnabled: true,
          isLocal: true
        }
      ]);

      // Simulate WebRTC connection (in real implementation, use WebRTC libraries like Simple Peer or Socket.IO)
      setTimeout(() => {
        setConnectionStatus('connected');
        setIsConnected(true);
        
        // Add remote participant (simulated)
        setParticipants(prev => [
          ...prev,
          {
            id: 'remote',
            name: userRole === 'doctor' ? 'Patient' : 'Dr. Smith',
            role: userRole === 'doctor' ? 'patient' : 'doctor',
            videoEnabled: true,
            audioEnabled: true,
            isLocal: false
          }
        ]);
      }, 2000);

    } catch (error) {
      console.error('Failed to initialize connection:', error);
      setConnectionStatus('failed');
      onError('Failed to access camera and microphone. Please check your permissions.');
    }
  };

  const cleanup = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    // Stop all media tracks
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setLocalVideoEnabled(videoTrack.enabled);
        
        // Update participants state
        setParticipants(prev => prev.map(p => 
          p.isLocal ? { ...p, videoEnabled: videoTrack.enabled } : p
        ));
      }
    }
  };

  const toggleAudio = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setLocalAudioEnabled(audioTrack.enabled);
        
        // Update participants state
        setParticipants(prev => prev.map(p => 
          p.isLocal ? { ...p, audioEnabled: audioTrack.enabled } : p
        ));
      }
    }
  };

  const endConsultation = () => {
    if (userRole === 'doctor' && consultationSummary.trim()) {
      onEndConsultation(consultationSummary);
    } else {
      onEndConsultation();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sendMessage = (message: string) => {
    const newMessage = {
      id: Date.now().toString(),
      sender: participantName,
      message,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, newMessage]);
  };

  if (connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="animate-pulse flex flex-col items-center space-y-4">
            <Video className="h-16 w-16 text-blue-500" />
            <h3 className="text-xl font-semibold">Connecting to consultation...</h3>
            <p className="text-gray-600">Setting up your video and audio</p>
          </div>
        </Card>
      </div>
    );
  }

  if (connectionStatus === 'failed') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <PhoneOff className="h-16 w-16 text-red-500" />
            <h3 className="text-xl font-semibold text-red-600">Connection Failed</h3>
            <p className="text-gray-600">Unable to connect to the consultation</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white font-medium">
              {userRole === 'doctor' ? 'Video Consultation' : 'Consultation with Doctor'}
            </span>
          </div>
          <div className="text-gray-300 text-sm">
            Duration: {formatDuration(consultationDuration)}
          </div>
          {isRecording && (
            <div className="flex items-center space-x-1 text-red-400">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-sm">Recording</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-gray-300 text-sm">
            {participants.length} participant{participants.length > 1 ? 's' : ''}
          </span>
          <Users className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video */}
        <div className="absolute inset-0">
          {participants.find(p => !p.isLocal)?.videoEnabled ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              muted={false}
              className="w-full h-full object-cover bg-gray-800"
            />
          ) : (
            <div className="w-full h-full bg-gray-800 flex items-center justify-center">
              <div className="text-center">
                <div className="w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl font-semibold text-white">
                    {participants.find(p => !p.isLocal)?.name?.[0] || '?'}
                  </span>
                </div>
                <p className="text-white text-lg">
                  {participants.find(p => !p.isLocal)?.name || 'Participant'}
                </p>
                <p className="text-gray-400">Camera is off</p>
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-64 h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600">
          {localVideoEnabled ? (
            <video
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mb-2 mx-auto">
                  <span className="text-lg font-semibold text-white">
                    {participantName[0]}
                  </span>
                </div>
                <p className="text-white text-sm">You</p>
                <p className="text-gray-400 text-xs">Camera off</p>
              </div>
            </div>
          )}
        </div>

        {/* Side Panels */}
        {showChat && (
          <div className="absolute right-4 top-4 bottom-20 w-80 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-blue-600 text-white">
              <h3 className="font-semibold">Chat</h3>
            </div>
            <div className="flex-1 p-4 overflow-y-auto max-h-96">
              {chatMessages.map(msg => (
                <div key={msg.id} className="mb-3">
                  <div className="text-sm font-medium text-gray-900">{msg.sender}</div>
                  <div className="text-sm text-gray-700">{msg.message}</div>
                  <div className="text-xs text-gray-500">
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <input
                type="text"
                placeholder="Type a message..."
                className="w-full px-3 py-2 border rounded-lg"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    sendMessage(e.currentTarget.value);
                    e.currentTarget.value = '';
                  }
                }}
              />
            </div>
          </div>
        )}

        {showNotes && userRole === 'doctor' && (
          <div className="absolute left-4 top-4 bottom-20 w-80 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-green-600 text-white">
              <h3 className="font-semibold">Consultation Notes</h3>
            </div>
            <div className="p-4 flex-1">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Take notes during the consultation..."
                className="w-full h-40 p-3 border rounded-lg resize-none"
              />
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Consultation Summary
                </label>
                <textarea
                  value={consultationSummary}
                  onChange={(e) => setConsultationSummary(e.target.value)}
                  placeholder="Summarize the consultation for the patient..."
                  className="w-full h-32 p-3 border rounded-lg resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-center space-x-4">
          {/* Video Controls */}
          <Button
            variant={localVideoEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleVideo}
            className="rounded-full p-3"
          >
            {localVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>

          {/* Audio Controls */}
          <Button
            variant={localAudioEnabled ? "default" : "destructive"}
            size="lg"
            onClick={toggleAudio}
            className="rounded-full p-3"
          >
            {localAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>

          {/* Chat Toggle */}
          <Button
            variant={showChat ? "secondary" : "outline"}
            size="lg"
            onClick={() => setShowChat(!showChat)}
            className="rounded-full p-3"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>

          {/* Notes Toggle (Doctor only) */}
          {userRole === 'doctor' && (
            <Button
              variant={showNotes ? "secondary" : "outline"}
              size="lg"
              onClick={() => setShowNotes(!showNotes)}
              className="rounded-full p-3"
            >
              <FileText className="h-6 w-6" />
            </Button>
          )}

          {/* Settings */}
          <Button
            variant="outline"
            size="lg"
            className="rounded-full p-3"
          >
            <Settings className="h-6 w-6" />
          </Button>

          {/* Screen Share */}
          <Button
            variant="outline"
            size="lg"
            className="rounded-full p-3"
          >
            <Share2 className="h-6 w-6" />
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            onClick={endConsultation}
            className="rounded-full p-3 bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}