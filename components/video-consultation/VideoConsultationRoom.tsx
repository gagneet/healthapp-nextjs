import { Prisma } from "@/generated/prisma";

'use client'

import { useState, useEffect, useCallback } from 'react';
import {
  DailyProvider,
  useDaily,
  useLocalParticipant,
  useParticipant,
  useVideo,
  useAudio,
  useAppMessage,
  useScreenShare,
  useRecording,
} from '@daily-co/daily-react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  MessageSquare,
  Share2,
  Users,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// ParticipantTile component to display each participant's video
type EmergencyAlertWithRelations = Prisma.EmergencyAlertGetPayload<{
  include: { patient: true; user: true }
}>;

type MedicationSafetyAlertWithRelations = Prisma.MedicationSafetyAlertGetPayload<{
  include: { patient: true; user: true }
}>;

type NotificationWithRelations = Prisma.NotificationGetPayload<{
  include: { patient: true; user: true }
}>;

type AdherenceRecordWithRelations = Prisma.AdherenceRecordGetPayload<{
  include: { patient: true; user: true }
}>;

const ParticipantTile = ({ sessionId }: { sessionId: string }) => {
  const participant = useParticipant(sessionId);
  const { isPlayable, cam, isScreen } = useVideo(sessionId);
  const { isPlayable: isAudioPlayable } = useAudio(sessionId);

  if (!participant) return null;

  return (
    <div className="relative w-full h-full bg-gray-800 rounded-lg overflow-hidden">
      {isPlayable && !isScreen ? (
        <video
          autoPlay
          muted={participant.local}
          playsInline
          ref={(ref) => ref && cam?.track && (ref.srcObject = new MediaStream([cam.track]))}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-700">
          <div className="text-center text-white">
            <div className="w-24 h-24 bg-gray-600 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl font-bold">{participant.user_name?.[0]?.toUpperCase()}</span>
            </div>
            <p>{participant.user_name}</p>
          </div>
        </div>
      )}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
        {participant.user_name} {!participant.local && (isAudioPlayable ? <Mic className="inline h-4 w-4" /> : <MicOff className="inline h-4 w-4 text-red-500" />)}
      </div>
    </div>
  );
};

// Main component for the video consultation room
const VideoConsultationRoomContent = ({ consultationId, roomUrl, userRole, onEndConsultation }: { consultationId: string, roomUrl: string, userRole: 'doctor' | 'patient', onEndConsultation: () => void }) => {
  const daily = useDaily();
  const localParticipant = useLocalParticipant();
  const { startScreenShare, stopScreenShare, isSharingScreen } = useScreenShare();
  const { startRecording, stopRecording, isRecording } = useRecording();
  const [chatMessages, setChatMessages] = useState<Array<{ sender: string; msg: string }>>([]);
  const [showChat, setShowChat] = useState(false);

  const sendAppMessage = useAppMessage({
    onAppMessage: useCallback((ev: any) => {
      setChatMessages((prev) => [...prev, { sender: ev.from, msg: ev.data.msg }]);
    }, []),
  });

  useEffect(() => {
    const joinRoom = async () => {
      if (!daily) return;

      try {
        const roomName = new URL(roomUrl).pathname.split('/')[1];
        const response = await fetch('/api/video-consultations/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ roomName }),
        });
        const { token } = await response.json();

        if (token) {
          await daily.join({ url: roomUrl, token });
        } else {
          console.error('Failed to get a meeting token.');
        }
      } catch (error) {
        console.error('Error joining room:', error);
      }
    };

    joinRoom();

    return () => {
      daily?.leave();
    };
  }, [daily, roomUrl]);

  const handleSendMessage = (message: string) => {
    sendAppMessage({ msg: message }, '*');
    setChatMessages((prev) => [...prev, { sender: 'Me', msg: message }]);
  };

  const toggleRecording = async () => {
    const action = isRecording ? 'stop' : 'start';
    try {
      await fetch(`/api/video-consultations/${consultationId}/recording`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (action === 'start') {
        startRecording();
      } else {
        stopRecording();
      }
    } catch (error) {
      console.error(`Failed to ${action} recording:`, error);
    }
  };

  const participants = daily?.participants() ?? {};

  return (
    <div className="w-full h-screen bg-gray-900 flex flex-col">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {localParticipant && <ParticipantTile sessionId={localParticipant.session_id} />}
        {Object.values(participants)
          .filter((p) => !p.local)
          .map((p) => (
            <ParticipantTile key={p.session_id} sessionId={p.session_id} />
          ))}
      </div>

      {isRecording && (
        <div className="absolute top-4 left-4 flex items-center space-x-2 text-red-400">
          <Circle className="h-4 w-4 fill-current" />
          <span>Recording</span>
        </div>
      )}

      {showChat && (
        <div className="absolute right-4 top-4 bottom-20 w-80 bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
          <div className="p-4 bg-blue-600 text-white">
            <h3 className="font-semibold">Chat</h3>
          </div>
          <div className="flex-1 p-4 overflow-y-auto">
            {chatMessages.map((msg, index) => (
              <div key={index} className="mb-2">
                <strong>{msg.sender === localParticipant?.user_name ? 'Me' : msg.sender}:</strong> {msg.msg}
              </div>
            ))}
          </div>
          <div className="p-2 border-t">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full px-3 py-2 border rounded-lg"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  handleSendMessage(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
          </div>
        </div>
      )}

      <div className="bg-gray-800 p-4 flex items-center justify-center space-x-4">
        <Button onClick={() => daily?.setLocalVideo(!daily.localVideo())} variant={daily?.localVideo() ? 'default' : 'destructive'}>
          {daily?.localVideo() ? <Video /> : <VideoOff />}
        </Button>
        <Button onClick={() => daily?.setLocalAudio(!daily.localAudio())} variant={daily?.localAudio() ? 'default' : 'destructive'}>
          {daily?.localAudio() ? <Mic /> : <MicOff />}
        </Button>
        <Button onClick={() => (isSharingScreen ? stopScreenShare() : startScreenShare())} variant={isSharingScreen ? 'secondary' : 'outline'}>
          <Share2 />
        </Button>
        <Button onClick={() => setShowChat(!showChat)} variant={showChat ? 'secondary' : 'outline'}>
          <MessageSquare />
        </Button>
        {userRole === 'doctor' && (
          <Button onClick={toggleRecording} variant={isRecording ? 'destructive' : 'outline'}>
            <Circle className="h-6 w-6" />
          </Button>
        )}
        <Button onClick={() => { onEndConsultation(); daily?.leave(); }} variant="destructive">
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
};

// Wrapper component to provide the DailyProvider
export default function VideoConsultationRoom({ consultationId, roomUrl, userRole, onEndConsultation }: { consultationId: string, roomUrl: string, userRole: 'doctor' | 'patient', onEndConsultation: () => void }) {
  if (!roomUrl) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <Card className="p-8">
          <h2 className="text-xl font-bold">Error</h2>
          <p>Room URL is not available. Cannot start the consultation.</p>
        </Card>
      </div>
    );
  }

  return (
    <DailyProvider>
      <VideoConsultationRoomContent consultationId={consultationId} roomUrl={roomUrl} userRole={userRole} onEndConsultation={onEndConsultation} />
    </DailyProvider>
  );
}