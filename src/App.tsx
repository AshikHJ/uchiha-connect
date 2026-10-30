import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PinLogin } from './pages/PinLogin';
import { StudioLayout } from './components/studio/StudioLayout';
import { StudioDashboard } from './pages/StudioDashboard';
import { StudioParticipants } from './pages/StudioParticipants';
import { StudioEditor } from './pages/StudioEditor';
import { StudioTemplates } from './pages/StudioTemplates';
import { StudioQR } from './pages/StudioQR';
import { StudioSettings } from './pages/StudioSettings';
import { PublicProfile } from './pages/PublicProfile';
import { ParticipantModal } from './components/studio/ParticipantModal';
import { Participant } from './types';
import { api } from './services/api';

// Protected Route Guard for Organizer
const ProtectedOrganizerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-warmWhite flex flex-col items-center justify-center p-4">
        <div className="w-8 h-8 border-4 border-brand-orange border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-brand-charcoal">Verifying Organizer Session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PinLogin />;
  }

  return <>{children}</>;
};

export const AppContent: React.FC = () => {
  // Global Create / Edit Participant Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTargetSlot, setModalTargetSlot] = useState<number | undefined>(undefined);
  const [modalExistingParticipant, setModalExistingParticipant] = useState<Participant | null>(null);

  const handleOpenCreateModal = (targetSlot?: number, participant?: Participant) => {
    setModalTargetSlot(targetSlot);
    setModalExistingParticipant(participant || null);
    setIsModalOpen(true);
  };

  const handleSaveParticipant = async (
    data: Partial<Participant>,
    shouldPublish: boolean
  ): Promise<Participant> => {
    let saved: Participant;
    if (modalExistingParticipant) {
      saved = await api.participants.update(modalExistingParticipant.participant_id, {
        ...data,
        publication_status: shouldPublish ? 'published' : modalExistingParticipant.publication_status,
      });
    } else {
      saved = await api.participants.create({
        ...data,
        publication_status: shouldPublish ? 'published' : 'draft',
      });
    }

    if (shouldPublish) {
      const pubRes = await api.participants.publish(saved.participant_id);
      saved = pubRes.participant;
    }

    return saved;
  };

  return (
    <>
      <Routes>
        {/* Public Participant Digital Business Card */}
        <Route path="/p/:username" element={<PublicProfile />} />

        {/* Protected Organizer Studio */}
        <Route
          path="/studio"
          element={
            <ProtectedOrganizerRoute>
              <StudioLayout onOpenCreateModal={() => handleOpenCreateModal()} />
            </ProtectedOrganizerRoute>
          }
        >
          <Route
            index
            element={<StudioDashboard onOpenCreateModal={handleOpenCreateModal} />}
          />
          <Route
            path="participants"
            element={<StudioParticipants onOpenCreateModal={handleOpenCreateModal} />}
          />
          <Route path="templates" element={<StudioTemplates />} />
          <Route path="qr" element={<StudioQR />} />
          <Route path="settings" element={<StudioSettings />} />
        </Route>

        {/* Fullscreen Canva-Style Card Visual Editor */}
        <Route
          path="/studio/editor/:id"
          element={
            <ProtectedOrganizerRoute>
              <StudioEditor />
            </ProtectedOrganizerRoute>
          }
        />

        {/* Default Redirect to /studio */}
        <Route path="/" element={<Navigate to="/studio" replace />} />
        <Route path="*" element={<Navigate to="/studio" replace />} />
      </Routes>

      {/* Reusable Participant Creation & Publication Modal */}
      <ParticipantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveParticipant}
        existingParticipant={modalExistingParticipant}
        targetSlotNumber={modalTargetSlot}
      />
    </>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
